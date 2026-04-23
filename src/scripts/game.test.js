// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCard } from "./card.js";
import { createDeck } from "./deck.js";
import { setupCorp, setupRunner } from "./game.js";

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
        expect(
            document.querySelector("#corp-identity-error").textContent,
        ).toContain("Unknown Corp Identity");
    });

    it("replaces the error element rather than duplicating it when setupCorp is called twice with an unmatched identity", () => {
        document.querySelector("#corp-identity").value = "Unknown Corp Identity";
        setupCorp();
        setupCorp();
        expect(
            document.querySelectorAll("#corp-identity-error").length,
        ).toBe(1);
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
        expect(
            document.querySelector("#runner-identity-error").textContent,
        ).toContain("Unknown Runner Identity");
    });

    it("replaces the error element rather than duplicating it when setupRunner is called twice with an unmatched identity", () => {
        document.querySelector("#runner-identity").value =
            "Unknown Runner Identity";
        setupRunner();
        setupRunner();
        expect(
            document.querySelectorAll("#runner-identity-error").length,
        ).toBe(1);
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
