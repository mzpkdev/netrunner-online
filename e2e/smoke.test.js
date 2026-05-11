import { expect, test } from "@playwright/test";

const NETRUNNERDB_API = "https://netrunnerdb.com/api/2.0/public/cards";

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
