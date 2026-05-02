import { expect, test } from "@playwright/test";

const NETRUNNERDB_API = "https://netrunnerdb.com/api/2.0/public/cards";
const CARD_IMAGES = "https://card-images.netrunnerdb.com/**";

/** Minimal fixture — only the cards exercised by this test suite. */
const apiFixture = {
    data: [
        {
            code: "26100",
            title: "Pravdivost Consulting: Political Solutions",
            side_code: "corp",
            faction_code: "weyland-consortium",
            type_code: "identity",
        },
        {
            code: "01054",
            title: "Hedge Fund",
            side_code: "corp",
            faction_code: "neutral-corp",
            type_code: "operation",
        },
        {
            code: "33079",
            title: 'Nyusha "Sable" Sintashta: Symphonic Prodigy',
            side_code: "runner",
            faction_code: "criminal",
            type_code: "identity",
        },
        {
            code: "01088",
            title: "Sure Gamble",
            side_code: "runner",
            faction_code: "neutral-runner",
            type_code: "event",
        },
    ],
};

test("page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/netrunner/i);
});

test.describe("solo play flow", () => {
    test("starts a game, loads decks, draws a card, and verifies count updates", async ({
        page,
    }) => {
        // Intercept the NetrunnerDB API and return the minimal fixture
        await page.route(NETRUNNERDB_API, (route) =>
            route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify(apiFixture),
            }),
        );

        // Intercept card image requests to avoid outbound network calls in CI
        await page.route(CARD_IMAGES, (route) =>
            route.fulfill({
                status: 200,
                contentType: "image/jpeg",
                body: Buffer.alloc(0),
            }),
        );

        await page.goto("/");

        // Wait for main() to complete — window.allCards is assigned after the
        // API response resolves and before setupP2P() attaches click handlers
        await page.waitForFunction(() => typeof window.allCards !== "undefined");

        // Overwrite identity inputs and deck lists with cards present in the fixture
        await page.evaluate(() => {
            document.querySelector("#corp-identity").value =
                "Pravdivost Consulting: Political Solutions";
            document.querySelector("#runner-identity").value =
                'Nyusha "Sable" Sintashta: Symphonic Prodigy';
            document.querySelector("#corp-deck-list").value = "3x Hedge Fund";
            document.querySelector("#runner-deck-list").value = "3x Sure Gamble";
        });

        // Click the solo play button
        await page.click("#play-solo");

        // The start-game-panel must be removed from the DOM
        await expect(page.locator("#start-game-panel")).not.toBeAttached();

        // Both deck elements must appear in #card-layer
        await expect(page.locator("#card-layer .deck")).toHaveCount(2);

        // Identity cards for each side must be present as .game-card elements
        await expect(page.locator("#card-layer .game-card")).toHaveCount(2);

        // Draw a card from the corp deck via page.click() — fires the full
        // pointerdown → mousedown → pointerup → mouseup → click sequence,
        // triggering grabCard's cleanup path and leaving no dangling listeners
        const corpDeck = page.locator("#corp-deck");
        await expect(corpDeck).toHaveAttribute("title", "3 cards");
        await page.click("#corp-deck");

        // The deck title must reflect the reduced count
        await expect(corpDeck).toHaveAttribute("title", "2 cards");

        // The drawn card must appear as an additional .game-card in #card-layer
        await expect(page.locator("#card-layer .game-card")).toHaveCount(3);
    });

    test("shows fetch-error and no decks when the API returns 500", async ({
        page,
    }) => {
        // Intercept the NetrunnerDB API with a server error
        await page.route(NETRUNNERDB_API, (route) =>
            route.fulfill({ status: 500 }),
        );

        await page.goto("/");

        // main() catches the failed fetch, appends #fetch-error, and returns early
        await expect(page.locator("#fetch-error")).toBeVisible();

        // setupP2P() was never called, so no decks should be present
        await expect(page.locator("#card-layer .deck")).toHaveCount(0);
    });
});
