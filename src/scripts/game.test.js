// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { setupCorp, setupRunner } from "./game.js"
import { createDeck } from "./deck.js"
import { createCard } from "./card.js"

vi.mock("./p2p.js", () => ({ setupP2P: vi.fn() }))
vi.mock("./utils.js", () => ({ fetchAllCards: vi.fn() }))
vi.mock("./sidePanels.js", () => ({ setupSidePanels: vi.fn() }))
vi.mock("./deck.js", () => ({ createDeck: vi.fn() }))
vi.mock("./card.js", () => ({ createCard: vi.fn() }))
vi.mock("./token.js", () => ({ setupTokenSpawning: vi.fn() }))
vi.mock("./keyboard.js", () => ({ setupKeyboardShortcuts: vi.fn() }))

const CORP_IDENTITY = { title: "Haas-Bioroid: Engineering the Future", side_code: "corp", type_code: "identity", faction_code: "hb", image: "img.jpg" }
const RUNNER_IDENTITY = { title: "The Collective", side_code: "runner", type_code: "identity", faction_code: "neutral-runner", image: "img.jpg" }

function setupDOM() {
    document.body.innerHTML = `
        <textarea id="corp-deck-list">3x Ice Wall</textarea>
        <input id="corp-identity" value="Haas-Bioroid: Engineering the Future">
        <textarea id="runner-deck-list">3x Sure Gamble</textarea>
        <input id="runner-identity" value="The Collective">
    `
}

// ---------------------------------------------------------------------------
// setupCorp
// ---------------------------------------------------------------------------
describe("setupCorp", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setupDOM()
        window.playerSide = "corp"
        window.allCards = [CORP_IDENTITY, RUNNER_IDENTITY]
    })

    it("calls createDeck with the corp deck list value and the corp-deck id", () => {
        setupCorp()
        expect(createDeck).toHaveBeenCalledWith("3x Ice Wall", "corp-deck", "85vw", "75vh")
    })

    it("calls createCard with the card whose title matches the corp identity input value", () => {
        setupCorp()
        expect(createCard).toHaveBeenCalledWith(
            expect.objectContaining({ title: "Haas-Bioroid: Engineering the Future" }),
            "75vw",
            "75vh"
        )
    })
})

// ---------------------------------------------------------------------------
// setupRunner
// ---------------------------------------------------------------------------
describe("setupRunner", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        setupDOM()
        window.playerSide = "corp"
        window.allCards = [CORP_IDENTITY, RUNNER_IDENTITY]
    })

    it("calls createDeck with the runner deck list value and the runner-deck id", () => {
        setupRunner()
        expect(createDeck).toHaveBeenCalledWith("3x Sure Gamble", "runner-deck", "15vw", "25vh")
    })

    it("calls createCard with the card whose title matches the runner identity input value", () => {
        setupRunner()
        expect(createCard).toHaveBeenCalledWith(
            expect.objectContaining({ title: "The Collective" }),
            "25vw",
            "25vh"
        )
    })
})
