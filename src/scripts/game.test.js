// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCard } from "./card.js";
import { createDeck } from "./deck.js";
import { main, setupCorp, setupRunner } from "./game.js";
import { setupKeyboardShortcuts } from "./keyboard.js";
import { setupP2P } from "./p2p.js";
import { setupSidePanels } from "./sidePanels.js";
import { setupTokenSpawning } from "./token.js";
import { fetchAllCards } from "./utils.js";

vi.mock("./p2p.js", () => ({ setupP2P: vi.fn() }));
vi.mock("./utils.js", () => ({ fetchAllCards: vi.fn() }));
vi.mock("./sidePanels.js", () => ({ setupSidePanels: vi.fn() }));
vi.mock("./deck.js", () => ({ createDeck: vi.fn() }));
vi.mock("./card.js", () => ({ createCard: vi.fn() }));
vi.mock("./token.js", () => ({ setupTokenSpawning: vi.fn() }));
vi.mock("./keyboard.js", () => ({ setupKeyboardShortcuts: vi.fn() }));

const CORP_IDENTITY = {
    title: "Haas-Bioroid: Engineering the Future",
    side_code: "corp",
    type_code: "identity",
    faction_code: "hb",
    image: "img.jpg",
};
const RUNNER_IDENTITY = {
    title: "The Collective",
    side_code: "runner",
    type_code: "identity",
    faction_code: "neutral-runner",
    image: "img.jpg",
};

function setupDOM() {
    document.body.innerHTML = `
        <textarea id="corp-deck-list">3x Ice Wall</textarea>
        <input id="corp-identity" value="Haas-Bioroid: Engineering the Future">
        <textarea id="runner-deck-list">3x Sure Gamble</textarea>
        <input id="runner-identity" value="The Collective">
    `;
}

// ---------------------------------------------------------------------------
// setupCorp
// ---------------------------------------------------------------------------
describe("setupCorp", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
        window.playerSide = "corp";
        window.allCards = [CORP_IDENTITY, RUNNER_IDENTITY];
    });

    it("calls createDeck with the corp deck list value and the corp-deck id", () => {
        setupCorp();
        expect(createDeck).toHaveBeenCalledWith(
            "3x Ice Wall",
            "corp-deck",
            "85vw",
            "75vh",
        );
    });

    it("calls createCard with the card whose title matches the corp identity input value", () => {
        setupCorp();
        expect(createCard).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Haas-Bioroid: Engineering the Future",
            }),
            "75vw",
            "75vh",
        );
    });

    it("does not call createCard when the corp identity input value does not match any card in allCards", () => {
        document.querySelector("#corp-identity").value = "Unknown Corp Identity";
        setupCorp();
        expect(createCard).not.toHaveBeenCalled();
    });

    it("appends an error element to the DOM when the corp identity input value does not match any card in allCards", () => {
        document.querySelector("#corp-identity").value = "Unknown Corp Identity";
        setupCorp();
        expect(document.querySelector("#corp-identity-error")).not.toBeNull();
    });

    it("still calls createDeck when the corp identity input value does not match any card in allCards", () => {
        document.querySelector("#corp-identity").value = "Unknown Corp Identity";
        setupCorp();
        expect(createDeck).toHaveBeenCalledWith(
            "3x Ice Wall",
            "corp-deck",
            "85vw",
            "75vh",
        );
    });
});

// ---------------------------------------------------------------------------
// setupRunner
// ---------------------------------------------------------------------------
describe("setupRunner", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
        window.playerSide = "corp";
        window.allCards = [CORP_IDENTITY, RUNNER_IDENTITY];
    });

    it("calls createDeck with the runner deck list value and the runner-deck id", () => {
        setupRunner();
        expect(createDeck).toHaveBeenCalledWith(
            "3x Sure Gamble",
            "runner-deck",
            "15vw",
            "25vh",
        );
    });

    it("calls createCard with the card whose title matches the runner identity input value", () => {
        setupRunner();
        expect(createCard).toHaveBeenCalledWith(
            expect.objectContaining({ title: "The Collective" }),
            "25vw",
            "25vh",
        );
    });

    it("does not call createCard when the runner identity input value does not match any card in allCards", () => {
        document.querySelector("#runner-identity").value =
            "Unknown Runner Identity";
        setupRunner();
        expect(createCard).not.toHaveBeenCalled();
    });

    it("appends an error element to the DOM when the runner identity input value does not match any card in allCards", () => {
        document.querySelector("#runner-identity").value =
            "Unknown Runner Identity";
        setupRunner();
        expect(document.querySelector("#runner-identity-error")).not.toBeNull();
    });

    it("still calls createDeck when the runner identity input value does not match any card in allCards", () => {
        document.querySelector("#runner-identity").value =
            "Unknown Runner Identity";
        setupRunner();
        expect(createDeck).toHaveBeenCalledWith(
            "3x Sure Gamble",
            "runner-deck",
            "15vw",
            "25vh",
        );
    });
});

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
describe("main", () => {
    let addEventListenerSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = '<div class="dropdown-menu"></div>';
        window.allCards = undefined;
        addEventListenerSpy = vi.spyOn(document, "addEventListener");
    });

    afterEach(() => {
        for (const [type, listener] of addEventListenerSpy.mock.calls) {
            document.removeEventListener(type, listener);
        }
        addEventListenerSpy.mockRestore();
    });

    it("appends a #fetch-error element with the expected message and does not call setup functions when fetchAllCards rejects", async () => {
        fetchAllCards.mockRejectedValue(new Error("Network failure"));
        await main();
        const errorEl = document.querySelector("#fetch-error");
        expect(errorEl).not.toBeNull();
        expect(errorEl.textContent).toBe(
            "Card data unavailable. Check your connection and reload.",
        );
        expect(setupP2P).not.toHaveBeenCalled();
        expect(setupKeyboardShortcuts).not.toHaveBeenCalled();
        expect(setupSidePanels).not.toHaveBeenCalled();
        expect(setupTokenSpawning).not.toHaveBeenCalled();
    });

    it("populates window.allCards and calls all four setup functions when fetchAllCards resolves", async () => {
        fetchAllCards.mockResolvedValue({
            data: [{ code: "01001", title: "Hedge Fund" }],
        });
        await main();
        expect(window.allCards).toBeDefined();
        expect(setupKeyboardShortcuts).toHaveBeenCalledOnce();
        expect(setupP2P).toHaveBeenCalledOnce();
        expect(setupSidePanels).toHaveBeenCalledOnce();
        expect(setupTokenSpawning).toHaveBeenCalledOnce();
    });

    it("maps each card entry to include an image URL derived from card.code", async () => {
        fetchAllCards.mockResolvedValue({
            data: [
                { code: "01001", title: "Hedge Fund" },
                { code: "02002", title: "Sure Gamble" },
            ],
        });
        await main();
        expect(window.allCards[0].image).toBe(
            "https://card-images.netrunnerdb.com/v2/large/01001.jpg",
        );
        expect(window.allCards[1].image).toBe(
            "https://card-images.netrunnerdb.com/v2/large/02002.jpg",
        );
    });

    it("sets .dropdown-menu display to none when a click event is dispatched on document", async () => {
        fetchAllCards.mockResolvedValue({
            data: [{ code: "01001", title: "Hedge Fund" }],
        });
        await main();
        const menu = document.querySelector(".dropdown-menu");
        menu.style.display = "block";
        document.dispatchEvent(new Event("click"));
        expect(menu.style.display).toBe("none");
    });

    it("sets .dropdown-menu display to none when an auxclick event is dispatched on document", async () => {
        fetchAllCards.mockResolvedValue({
            data: [{ code: "01001", title: "Hedge Fund" }],
        });
        await main();
        const menu = document.querySelector(".dropdown-menu");
        menu.style.display = "block";
        document.dispatchEvent(new Event("auxclick"));
        expect(menu.style.display).toBe("none");
    });

    it("calls preventDefault when a middle mouse button mousedown event is dispatched on document", async () => {
        fetchAllCards.mockResolvedValue({
            data: [{ code: "01001", title: "Hedge Fund" }],
        });
        await main();
        const event = new MouseEvent("mousedown", { button: 1 });
        vi.spyOn(event, "preventDefault");
        document.dispatchEvent(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });
});
