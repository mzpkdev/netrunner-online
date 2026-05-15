import { expect, test } from "@playwright/test";
import { NETRUNNERDB_API, apiFixture } from "./fixtures.js";

test("page loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => typeof window.Peer !== "undefined");
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

        await page.goto("/");

        // Wait for main() to complete — window.allCards is assigned after the
        // API response resolves and before setupP2P() attaches click handlers
        await page.waitForFunction(() => typeof window.allCards !== "undefined");

        // Overwrite the deck lists with cards present in the fixture
        await page.evaluate(() => {
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

        // Draw a card from the corp deck via mousedown
        const corpDeck = page.locator("#corp-deck");
        await expect(corpDeck).toHaveAttribute("title", "3 cards");
        await corpDeck.dispatchEvent("mousedown", { button: 0, buttons: 1 });

        // The deck title must reflect the reduced count
        await expect(corpDeck).toHaveAttribute("title", "2 cards");

        // The drawn card must appear as an additional .game-card in #card-layer
        await expect(page.locator("#card-layer .game-card")).toHaveCount(3);

        // Keyboard navigation: ArrowRight must move focus to the first .game-card
        await page.keyboard.press("ArrowRight");
        const firstFocusedCard = page.locator("#card-layer .game-card:focus");
        await expect(firstFocusedCard).toHaveCount(1);

        const firstFocusedId = await firstFocusedCard.getAttribute("id");

        // A second ArrowRight must advance focus to a different card
        await page.keyboard.press("ArrowRight");
        const secondFocusedCard = page.locator("#card-layer .game-card:focus");
        await expect(secondFocusedCard).toHaveCount(1);

        const secondFocusedId = await secondFocusedCard.getAttribute("id");
        expect(secondFocusedId).not.toBe(firstFocusedId);

        // F key must toggle the flipped class on the currently focused card
        await page.keyboard.press("f");
        await expect(page.locator(`#${secondFocusedId}`)).toHaveClass(/flipped/);

        // Escape must clear the selected class from all cards
        await page.keyboard.press("Escape");
        await expect(page.locator("#card-layer .game-card.selected")).toHaveCount(0);
    });
});

test.describe("token lifecycle", () => {
    test("spawns a credit token, drops it to the board, drags it to the token bin, and verifies removal", async ({
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

        await page.goto("/");
        await page.waitForFunction(() => typeof window.allCards !== "undefined");

        // Overwrite the deck lists with cards present in the fixture
        await page.evaluate(() => {
            document.querySelector("#corp-deck-list").value = "3x Hedge Fund";
            document.querySelector("#runner-deck-list").value = "3x Sure Gamble";
        });

        // Start a solo game
        await page.click("#play-solo");
        await expect(page.locator("#start-game-panel")).not.toBeAttached();

        // Open the resource panel so #credit is interactable
        await page.click("#open-resource-panel");

        const creditBox = await page.locator("#credit").boundingBox();
        const cardLayerBox = await page.locator("#card-layer").boundingBox();

        // Board target: bottom-right area, away from the auto-placed identity cards
        const boardX = cardLayerBox.x + cardLayerBox.width * 0.8;
        const boardY = cardLayerBox.y + cardLayerBox.height * 0.8;

        // Spawn a credit token: mousedown on #credit triggers createToken + grabCard,
        // mousemove drives the drag, mouseup deposits the token on the board
        await page.mouse.move(
            creditBox.x + creditBox.width / 2,
            creditBox.y + creditBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(boardX, boardY);
        await page.mouse.up();

        // At least one .token must appear in #card-layer after spawning
        await expect(page.locator("#card-layer .token")).toHaveCount(1);

        // Re-open the resource panel so #token-bin is visible in the viewport
        await page.click("#open-resource-panel");

        const tokenBox = await page
            .locator("#card-layer .token")
            .first()
            .boundingBox();
        const binBox = await page.locator("#token-bin").boundingBox();

        // Drag the token to the token bin: mousedown on token, move to bin, mouseup
        // The ungrab handler in token.js checks getBoundingClientRect against #token-bin
        // and calls tokenElement.remove() when the hit-test passes
        await page.mouse.move(
            tokenBox.x + tokenBox.width / 2,
            tokenBox.y + tokenBox.height / 2,
        );
        await page.mouse.down();
        await page.mouse.move(
            binBox.x + binBox.width / 2,
            binBox.y + binBox.height / 2,
        );
        await page.mouse.up();

        // No .token elements must remain in #card-layer after bin removal
        await expect(page.locator("#card-layer .token")).toHaveCount(0);
    });
});
