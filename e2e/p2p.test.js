import { expect, test } from "@playwright/test";
import { NETRUNNERDB_API, apiFixture } from "./fixtures.js";

/**
 * Synthetic PeerJS implementation injected into each browser context via
 * addInitScript before any application script runs.
 *
 * The mock relies on four functions exposed per-context via exposeFunction and
 * wired to shared Node.js queues in the test body:
 *
 *   window.__bridgePeerPoll()       – host: returns {__type:'connection'} once
 *                                     the joiner has signalled; otherwise null.
 *                                     joiner: always returns null.
 *   window.__bridgeConnPoll()       – returns the next inbound JSON string from
 *                                     this page's incoming queue, or null.
 *   window.__bridgeSend(jsonStr)    – enqueues a serialised message for the
 *                                     remote peer's incoming queue.
 *   window.__bridgeConnect(hostId)  – joiner signals the host that it is
 *                                     connecting (no-op on the host side).
 */
const MOCK_PEER_SCRIPT = `
(function () {
    if (window.__mockPeerInstalled) return;
    window.__mockPeerInstalled = true;

    var OPEN_DELAY_MS = 80;
    var DATA_POLL_MS  = 30;
    var PEER_POLL_MS  = 40;

    function MockConnection() {
        var self = this;
        this._h = {};
        setTimeout(function () {
            if (self._h.open) self._h.open();
        }, OPEN_DELAY_MS);
        this._poll = setInterval(function () {
            window.__bridgeConnPoll().then(function (item) {
                if (!item) return;
                var msg = typeof item === 'string' ? JSON.parse(item) : item;
                if (self._h.data) self._h.data(msg);
            });
        }, DATA_POLL_MS);
    }
    MockConnection.prototype.on = function (ev, fn) {
        this._h[ev] = fn;
        return this;
    };
    MockConnection.prototype.send = function (data) {
        window.__bridgeSend(JSON.stringify(data));
    };
    MockConnection.prototype.close = function () {
        clearInterval(this._poll);
        if (this._h.close) this._h.close();
    };

    function MockPeer(opts) {
        var self = this;
        this._h = {};
        this._conn = null;
        var id = 'mock-' + Math.random().toString(36).slice(2, 9);
        setTimeout(function () {
            if (self._h.open) self._h.open(id);
        }, OPEN_DELAY_MS);
        this._peerPoll = setInterval(function () {
            window.__bridgePeerPoll().then(function (item) {
                if (!item) return;
                if (item.__type === 'connection') {
                    clearInterval(self._peerPoll);
                    var conn = new MockConnection();
                    self._conn = conn;
                    if (self._h.connection) self._h.connection(conn);
                }
            });
        }, PEER_POLL_MS);
    }
    MockPeer.prototype.on = function (ev, fn) {
        this._h[ev] = fn;
        return this;
    };
    MockPeer.prototype.connect = function (remoteId) {
        window.__bridgeConnect(remoteId);
        var conn = new MockConnection();
        this._conn = conn;
        return conn;
    };
    MockPeer.prototype.destroy = function () {
        clearInterval(this._peerPoll);
        if (this._conn) this._conn.close();
    };

    window.Peer = MockPeer;
})();
`;

test.describe("p2p two-player flow", () => {
    test("host and joiner connect, host deck and drawn card sync to joiner", async ({
        browser,
    }) => {
        // Shared message queues in the Node.js test process.
        const hostQueue = [];   // messages destined for the host (sent by joiner)
        const joinerQueue = []; // messages destined for the joiner (sent by host)
        let pendingConnection = false;

        // Two isolated browser contexts: host plays corp, joiner plays runner.
        const hostContext = await browser.newContext({
            permissions: ["clipboard-read", "clipboard-write"],
        });
        const joinerContext = await browser.newContext();
        const hostPage = await hostContext.newPage();
        const joinerPage = await joinerContext.newPage();

        // Host-side bridge: peer poll surfaces incoming connections; conn poll
        // drains messages sent by the joiner.
        await hostPage.exposeFunction("__bridgePeerPoll", async () => {
            if (pendingConnection) {
                pendingConnection = false;
                return { __type: "connection" };
            }
            return null;
        });
        await hostPage.exposeFunction(
            "__bridgeConnPoll",
            async () => hostQueue.shift() || null,
        );
        await hostPage.exposeFunction("__bridgeSend", async (json) => {
            joinerQueue.push(json);
        });
        await hostPage.exposeFunction("__bridgeConnect", async () => {});

        // Joiner-side bridge: peer poll is a no-op; conn poll drains messages
        // sent by the host.
        await joinerPage.exposeFunction("__bridgePeerPoll", async () => null);
        await joinerPage.exposeFunction(
            "__bridgeConnPoll",
            async () => joinerQueue.shift() || null,
        );
        await joinerPage.exposeFunction("__bridgeSend", async (json) => {
            hostQueue.push(json);
        });
        await joinerPage.exposeFunction("__bridgeConnect", async (_hostId) => {
            pendingConnection = true;
        });

        // Inject the mock Peer before any application script runs.
        await hostPage.addInitScript(MOCK_PEER_SCRIPT);
        await joinerPage.addInitScript(MOCK_PEER_SCRIPT);

        // Intercept the NetrunnerDB card-data API on both pages.
        const apiRoute = (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(apiFixture),
            });
        await hostPage.route(NETRUNNERDB_API, apiRoute);
        await joinerPage.route(NETRUNNERDB_API, apiRoute);

        // Block the PeerJS CDN so the mock Peer installed by addInitScript is
        // not overwritten.  Without this the real PeerJS script loads after
        // addInitScript runs and replaces window.Peer; messages then travel
        // over WebRTC rather than the in-process bridge, making delivery
        // timing unpredictable and causing the deck-sync assertions to time
        // out in CI.
        const blockPeerJS = (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/javascript",
                body: "",
            });
        await hostPage.route("https://unpkg.com/**", blockPeerJS);
        await joinerPage.route("https://unpkg.com/**", blockPeerJS);

        await hostPage.goto("/");
        await joinerPage.goto("/");

        // Wait for card data to resolve on both pages.
        await hostPage.waitForFunction(
            () => typeof window.allCards !== "undefined",
        );
        await joinerPage.waitForFunction(
            () => typeof window.allCards !== "undefined",
        );

        // Wait for MockPeer.on('open') to fire, which enables the host/join buttons.
        await hostPage.waitForFunction(
            () => !document.querySelector("#host-game").disabled,
        );
        await joinerPage.waitForFunction(
            () => !document.querySelector("#join-game").disabled,
        );

        // Host clicks #host-game (copies the peer ID to clipboard).
        // The test reads the ID directly from the input rather than from the clipboard.
        await hostPage.click("#host-game");
        const hostId = await hostPage.inputValue("#your-host-id");
        expect(hostId).toBeTruthy();

        // Joiner fills the host ID field and initiates the connection.
        await joinerPage.fill("#opponent-host-id", hostId);
        await joinerPage.click("#join-game");

        // Joiner removes #start-game-panel synchronously on click.
        await expect(joinerPage.locator("#start-game-panel")).not.toBeAttached();

        // Host removes #start-game-panel once MockPeer fires the 'connection' event
        // (~40–80 ms after the joiner signals via __bridgeConnect).
        await expect(hostPage.locator("#start-game-panel")).not.toBeAttached({
            timeout: 5000,
        });

        // Host loads the corp deck.  The player-panel is an offcanvas element
        // rendered off-screen; use evaluate() to dispatch the click directly and
        // bypass Playwright's viewport-geometry check.
        await hostPage.evaluate(() => {
            document.querySelector("#corp-deck-list").value = "3x Hedge Fund";
            document.querySelector("#load-deck-button").click();
        });

        // Corp deck element must appear locally in the host's #card-layer.
        await expect(hostPage.locator("#card-layer .deck")).toHaveCount(1);

        // The create-deck message must propagate to the joiner and render there.
        await expect(joinerPage.locator("#card-layer .deck")).toHaveCount(1, {
            timeout: 8000,
        });

        // setupCorp also places the corp identity card on the host.
        // Wait for the host's identity card, then wait for the throttle-delayed
        // create-card message to propagate to the joiner.
        // This serves a second purpose: the host's sendMessage throttle runs at
        // 200ms.  By waiting until the joiner has already received the identity
        // card, we guarantee that the throttle window has elapsed before the draw
        // fires, so the drawn-card message is sent as an immediate leading call
        // rather than being silently overwritten as a trailing call.
        await expect(hostPage.locator("#card-layer .game-card")).toHaveCount(1);
        await expect(joinerPage.locator("#card-layer .game-card")).toHaveCount(1, {
            timeout: 8000,
        });

        // Add a margin beyond the 200ms throttle window so the next sendMessage
        // call from the draw fires immediately.
        await hostPage.waitForTimeout(250);

        // Host draws from the corp deck via a left-button mousedown.
        await hostPage
            .locator("#corp-deck")
            .dispatchEvent("mousedown", { button: 0, buttons: 1 });

        // After drawing, the host's #card-layer contains the corp identity card
        // (placed by setupCorp) plus the newly drawn card: 2 total.
        await expect(hostPage.locator("#card-layer .game-card")).toHaveCount(2, {
            timeout: 3000,
        });

        // The create-card message for the drawn card must propagate to the joiner.
        await expect(joinerPage.locator("#card-layer .game-card")).toHaveCount(2, {
            timeout: 8000,
        });

        // ── Reverse channel: joiner → host ──────────────────────────────────────
        // Joiner loads a runner deck.  This exercises the reverse P2P path:
        // sendCreateMessage on the joiner → __bridgeSend → hostQueue →
        // __bridgeConnPoll on the host → receiveMessage on the host.
        //
        // Because the mock bridge is active, the joiner has already fired its
        // throttle (for the echo messages sent when it received the host's deck
        // and identity-card creates).  Wait 250ms so the joiner's 200ms throttle
        // window expires; the first create-deck message from setupRunner then
        // fires on the leading edge rather than being coalesced with the identity
        // card that follows it.
        await joinerPage.waitForTimeout(250);
        await joinerPage.evaluate(() => {
            document.querySelector("#runner-deck-list").value = "3x Sure Gamble";
            document.querySelector("#load-deck-button").click();
        });

        // The runner deck create-message must propagate from joiner to host.
        await expect(hostPage.locator("#card-layer .deck")).toHaveCount(2, {
            timeout: 8000,
        });

        await hostContext.close();
        await joinerContext.close();
    });
});
