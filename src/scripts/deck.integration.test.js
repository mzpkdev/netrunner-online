// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck } from "./deck.js";

// Only P2P send functions are mocked to prevent network-related errors.
// card.js, utils.js, grab.js, and keyboard.js are exercised as real modules.
vi.mock("./p2p.js", () => ({
    sendCreateMessage: vi.fn(),
    sendDeleteMessage: vi.fn(),
    sendFlipMessage: vi.fn(),
    sendGrabMessage: vi.fn(),
    sendMoveMessage: vi.fn(),
    sendRotateMessage: vi.fn(),
    sendUngrabMessage: vi.fn(),
}));

const allCards = [
    {
        title: "Sure Gamble",
        side_code: "runner",
        faction_code: "neutral-runner",
        type_code: "event",
        image: "https://example.com/sure-gamble.jpg",
    },
    {
        title: "Hedge Fund",
        side_code: "corp",
        faction_code: "neutral-corp",
        type_code: "operation",
        image: "https://example.com/hedge-fund.jpg",
    },
    {
        title: "Ice Wall",
        side_code: "corp",
        faction_code: "haas-bioroid",
        type_code: "ice",
        image: "https://example.com/ice-wall.jpg",
    },
];

function setupDOM() {
    document.body.innerHTML = `
        <div id="card-layer"></div>
        <div id="your-hand"></div>
        <div class="dropdown-menu">
            <div id="context-menu-flip"></div>
            <div id="context-menu-put-under"></div>
            <div id="context-menu-rotate"></div>
        </div>
    `;
    window.allCards = allCards;
    window.playerSide = "corp";
}

/**
 * Builds a minimal card DOM element that satisfies cardElementToCardInfo.
 * Used only for dispatching puttop/putbottom/shufflein events in tests that
 * need a card element without going through a full draw cycle.
 */
function makeCardElement(cardInfo) {
    const el = document.createElement("div");
    el.setAttribute("data-title", cardInfo.title);
    el.setAttribute("data-side", cardInfo.side_code);
    el.setAttribute("data-faction", cardInfo.faction_code);
    el.setAttribute("data-type", cardInfo.type_code);
    const front = document.createElement("div");
    front.className = "card-front";
    const img = document.createElement("img");
    img.src = cardInfo.image;
    front.appendChild(img);
    el.appendChild(front);
    return el;
}

// ---------------------------------------------------------------------------
// deck-load-to-card-draw pipeline — integration (no mocks on collaborators)
// ---------------------------------------------------------------------------
describe("deck-load-to-card-draw pipeline (integration)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
    });

    it("createDeck appends a .deck element to #card-layer with the correct title", () => {
        const deckEl = createDeck(
            "3x Sure Gamble\n2x Hedge Fund",
            "integ-deck",
            "0px",
            "0px",
        );

        expect(deckEl.classList.contains("deck")).toBe(true);
        expect(document.querySelector("#card-layer").contains(deckEl)).toBe(
            true,
        );
        expect(deckEl.title).toBe("5 cards");
    });

    it("mousedown on deck draws a real .game-card with correct data-title into #card-layer", () => {
        // Use a single card name so the drawn title is deterministic regardless
        // of the real shuffle ordering.
        const deckEl = createDeck("2x Sure Gamble", "draw-deck", "0px", "0px");

        deckEl.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, button: 0 }),
        );

        const cards = document.querySelectorAll("#card-layer .game-card");
        expect(cards.length).toBe(1);
        expect(cards[0].getAttribute("data-title")).toBe("Sure Gamble");
        // Deck title must reflect the remaining card count.
        expect(deckEl.title).toBe("1 card");
    });

    it("puttop event on deck increases the deck count and updates the title", () => {
        const deckEl = createDeck("2x Sure Gamble", "puttop-deck", "0px", "0px");
        expect(deckEl.title).toBe("2 cards");

        const cardEl = makeCardElement(allCards[0]); // Sure Gamble
        deckEl.dispatchEvent(
            new CustomEvent("puttop", { detail: { card: cardEl } }),
        );

        expect(deckEl.title).toBe("3 cards");
    });
});
