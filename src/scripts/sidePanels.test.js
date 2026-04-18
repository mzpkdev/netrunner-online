// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setupCorp, setupRunner } from "./game.js";
import { flipBoard, setupSidePanels } from "./sidePanels.js";
import { flipElement, snapToGrid } from "./utils.js";

vi.mock("./utils.js", () => ({
    flipElement: vi.fn(),
    snapToGrid: vi.fn(),
}));
vi.mock("./game.js", () => ({
    setupCorp: vi.fn(),
    setupRunner: vi.fn(),
}));
vi.mock("./card.js", () => ({
    updateCardArea: vi.fn(),
    updateCardHoverArea: vi.fn(),
    updateCardTooltipPosition: vi.fn(),
    handleCardBehavior: vi.fn(),
}));

function buildFullDOM() {
    document.body.innerHTML = `
        <div id="card-layer"></div>
        <div id="player-panel" tabindex="0"></div>
        <button id="open-player-panel"></button>
        <div id="resource-panel" tabindex="0"></div>
        <button id="open-resource-panel"></button>
        <div><div class="flex-container"></div></div>
        <input type="checkbox" id="corp-check">
        <input type="checkbox" id="runner-check">
        <button id="load-deck-button"></button>
        <span id="your-title"></span>
        <span id="opponent-title"></span>
        <div id="corp-deck-panel"></div>
        <div id="runner-deck-panel"></div>
    `;
}

// ---------------------------------------------------------------------------
// flipBoard
// ---------------------------------------------------------------------------
describe("flipBoard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        buildFullDOM();
    });

    it("calls flipElement and snapToGrid for each deck in #card-layer", () => {
        const deck = document.createElement("div");
        deck.classList.add("deck");
        document.querySelector("#card-layer").appendChild(deck);

        flipBoard();

        expect(flipElement).toHaveBeenCalledWith(deck, expect.anything());
        expect(snapToGrid).toHaveBeenCalledWith(deck);
    });

    it("calls flipElement and snapToGrid for each game-card in #card-layer", () => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        document.querySelector("#card-layer").appendChild(card);

        flipBoard();

        expect(flipElement).toHaveBeenCalledWith(card, expect.anything());
        expect(snapToGrid).toHaveBeenCalledWith(card);
    });

    it("calls flipElement and snapToGrid for each token in #card-layer", () => {
        const token = document.createElement("div");
        token.classList.add("token");
        document.querySelector("#card-layer").appendChild(token);

        flipBoard();

        expect(flipElement).toHaveBeenCalledWith(token, expect.anything());
        expect(snapToGrid).toHaveBeenCalledWith(token, 15);
    });
});

// ---------------------------------------------------------------------------
// setupSidePanels — mousemove edge triggers
// ---------------------------------------------------------------------------
describe("setupSidePanels — mousemove edge triggers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        buildFullDOM();
        setupSidePanels();
    });

    it("opens resource panel when clientX is 0", () => {
        const resourcePanel = document.querySelector("#resource-panel");
        const container = document.querySelector(".flex-container").parentElement;
        container.dispatchEvent(new MouseEvent("mousemove", { clientX: 0 }));
        expect(resourcePanel.classList.contains("show")).toBe(true);
    });

    it("opens player panel when clientX equals window.innerWidth - 1", () => {
        const playerPanel = document.querySelector("#player-panel");
        Object.defineProperty(window, "innerWidth", { value: 1280, writable: true, configurable: true });
        const container = document.querySelector(".flex-container").parentElement;
        container.dispatchEvent(new MouseEvent("mousemove", { clientX: 1279 }));
        expect(playerPanel.classList.contains("show")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// setupSidePanels — #load-deck-button
// ---------------------------------------------------------------------------
describe("setupSidePanels — #load-deck-button", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        buildFullDOM();
        setupSidePanels();
    });

    it("removes #corp-deck and corp cards, then calls setupCorp when playerSide is corp", () => {
        const corpDeck = document.createElement("div");
        corpDeck.id = "corp-deck";
        document.querySelector("#card-layer").appendChild(corpDeck);

        const corpCard = document.createElement("div");
        corpCard.classList.add("game-card");
        corpCard.setAttribute("data-side", "corp");
        document.querySelector("#card-layer").appendChild(corpCard);

        window.playerSide = "corp";
        document.querySelector("#load-deck-button").click();

        expect(document.querySelector("#card-layer>#corp-deck")).toBeNull();
        expect(
            document.querySelector('#card-layer>.game-card[data-side="corp"]'),
        ).toBeNull();
        expect(setupCorp).toHaveBeenCalled();
    });

    it("removes #runner-deck and runner cards, then calls setupRunner when playerSide is runner", () => {
        const runnerDeck = document.createElement("div");
        runnerDeck.id = "runner-deck";
        document.querySelector("#card-layer").appendChild(runnerDeck);

        const runnerCard = document.createElement("div");
        runnerCard.classList.add("game-card");
        runnerCard.setAttribute("data-side", "runner");
        document.querySelector("#card-layer").appendChild(runnerCard);

        window.playerSide = "runner";
        document.querySelector("#load-deck-button").click();

        expect(document.querySelector("#card-layer>#runner-deck")).toBeNull();
        expect(
            document.querySelector(
                '#card-layer>.game-card[data-side="runner"]',
            ),
        ).toBeNull();
        expect(setupRunner).toHaveBeenCalled();
    });
});
