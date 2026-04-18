// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createCard,
    handleCardBehavior,
    snapOutOfHandArea,
    updateCardArea,
    updateCardHoverArea,
} from "./card.js";
import { isPointWithinElement } from "./utils.js";

vi.mock("./p2p.js", () => ({ sendCreateMessage: vi.fn() }));
vi.mock("./utils.js", () => ({
    snapToGrid: vi.fn(),
    putElementBottom: vi.fn(),
    putElementTop: vi.fn(),
    isPointWithinElement: vi.fn(() => false),
}));
vi.mock("./grab.js", () => ({ grabCard: vi.fn(() => () => {}) }));
vi.mock("./keyboard.js", () => ({ selectCard: vi.fn() }));

const cardInfo = {
    title: "Ice Wall",
    side_code: "corp",
    faction_code: "hb",
    type_code: "ice",
    image: "https://example.com/ice-wall.jpg",
};

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
}

// ---------------------------------------------------------------------------
// createCard
// ---------------------------------------------------------------------------
describe("createCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
    });

    it("uses the supplied id", () => {
        const el = createCard(cardInfo, "10px", "20px", "explicit-id");
        expect(el.id).toBe("explicit-id");
    });

    it("generates a card-${uuid} id when no id is supplied", () => {
        const el = createCard(cardInfo, "10px", "20px");
        expect(el.id).toMatch(/^card-[0-9a-f-]+$/);
    });

    it("appends the new element to #card-layer", () => {
        const el = createCard(cardInfo, "10px", "20px", "layer-test");
        expect(document.querySelector("#card-layer").contains(el)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// snapOutOfHandArea
// ---------------------------------------------------------------------------
describe("snapOutOfHandArea", () => {
    let cardElement;
    let yourHand;

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `<div id="your-hand"></div>`;
        yourHand = document.querySelector("#your-hand");
        cardElement = document.createElement("div");
        document.body.appendChild(cardElement);
    });

    it("adjusts style.top when yourHandY − cardY < 75", () => {
        yourHand.getBoundingClientRect = vi.fn(() => ({
            y: 60,
            height: 100,
            x: 0,
        }));
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 40, x: 0 }));
        // yourHandY(60) − cardY(40) = 20 < 75 → new top = 40 − (75 − 20) = −15
        snapOutOfHandArea(cardElement);
        expect(cardElement.style.top).toBe("-15px");
    });

    it("leaves style.top unchanged when yourHandY − cardY >= 75", () => {
        yourHand.getBoundingClientRect = vi.fn(() => ({
            y: 200,
            height: 100,
            x: 0,
        }));
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 100, x: 0 }));
        // yourHandY(200) − cardY(100) = 100 >= 75 → no adjustment
        cardElement.style.top = "100px";
        snapOutOfHandArea(cardElement);
        expect(cardElement.style.top).toBe("100px");
    });
});

// ---------------------------------------------------------------------------
// handleCardBehavior
// ---------------------------------------------------------------------------
describe("handleCardBehavior", () => {
    let cardElement;

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `<div id="your-hand"></div>`;
        cardElement = document.createElement("div");
        cardElement.innerHTML = `
            <div class="card-front"></div>
            <div class="card-back"></div>
            <div class="game-card-tooltip"></div>
        `;
        document.body.appendChild(cardElement);
    });

    it("sets data-location to board for identity cards arriving with data-location deck", () => {
        cardElement.setAttribute("data-location", "deck");
        cardElement.setAttribute("data-type", "identity");
        handleCardBehavior(cardElement);
        expect(cardElement.getAttribute("data-location")).toBe("board");
    });
});

// ---------------------------------------------------------------------------
// handleCardBehavior — visibility matrix
// ---------------------------------------------------------------------------
describe("handleCardBehavior — visibility matrix", () => {
    let cardElement;

    function vis(el) {
        return {
            front: !el
                .querySelector(".card-front")
                .classList.contains("hidden"),
            back: !el.querySelector(".card-back").classList.contains("hidden"),
            tooltip: !el
                .querySelector(".game-card-tooltip")
                .classList.contains("hidden"),
        };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `<div id="your-hand"></div>`;
        cardElement = document.createElement("div");
        cardElement.innerHTML = `
            <div class="card-front"></div>
            <div class="card-back"></div>
            <div class="game-card-tooltip"></div>
        `;
        document.body.appendChild(cardElement);
        window.playerSide = "corp";
    });

    it.each([
        {
            desc: "deck non-identity — back only visible",
            location: "deck",
            type: "ice",
            side: "corp",
            playerSide: "corp",
            expected: { front: false, back: true, tooltip: false },
        },
        {
            desc: "deck identity — front+tooltip visible, location promoted to board",
            location: "deck",
            type: "identity",
            side: "corp",
            playerSide: "corp",
            expected: { front: true, back: false, tooltip: true },
        },
        {
            desc: "opponent-hand — back only visible",
            location: "opponent-hand",
            type: "ice",
            side: "corp",
            playerSide: "corp",
            expected: { front: false, back: true, tooltip: false },
        },
        {
            desc: "board corp operation — front+tooltip visible",
            location: "board",
            type: "operation",
            side: "corp",
            playerSide: "corp",
            expected: { front: true, back: false, tooltip: true },
        },
        {
            desc: "board corp identity — front+tooltip visible",
            location: "board",
            type: "identity",
            side: "corp",
            playerSide: "corp",
            expected: { front: true, back: false, tooltip: true },
        },
        {
            desc: "board corp ice same side — back+tooltip visible",
            location: "board",
            type: "ice",
            side: "corp",
            playerSide: "corp",
            expected: { front: false, back: true, tooltip: true },
        },
        {
            desc: "board corp ice opposite side — back only visible",
            location: "board",
            type: "ice",
            side: "corp",
            playerSide: "runner",
            expected: { front: false, back: true, tooltip: false },
        },
        {
            desc: "board runner — front+tooltip visible",
            location: "board",
            type: "ice",
            side: "runner",
            playerSide: "corp",
            expected: { front: true, back: false, tooltip: true },
        },
        {
            desc: "bin — front+tooltip visible",
            location: "bin",
            type: "ice",
            side: "corp",
            playerSide: "corp",
            expected: { front: true, back: false, tooltip: true },
        },
    ])("$desc", ({ location, type, side, playerSide, expected }) => {
        window.playerSide = playerSide;
        cardElement.setAttribute("data-location", location);
        cardElement.setAttribute("data-type", type);
        cardElement.setAttribute("data-side", side);
        handleCardBehavior(cardElement);
        expect(vis(cardElement)).toEqual(expected);
    });

    it("hand — front+tooltip visible and flipped class removed", () => {
        cardElement.classList.add("flipped");
        cardElement.setAttribute("data-location", "hand");
        cardElement.setAttribute("data-type", "ice");
        cardElement.setAttribute("data-side", "corp");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("flipped")).toBe(false);
        expect(vis(cardElement)).toEqual({
            front: true,
            back: false,
            tooltip: true,
        });
    });

    it("opponent-hand — flipped class removed", () => {
        cardElement.classList.add("flipped");
        cardElement.setAttribute("data-location", "opponent-hand");
        cardElement.setAttribute("data-type", "ice");
        cardElement.setAttribute("data-side", "corp");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("flipped")).toBe(false);
    });

    it("ice on board — rotated class added", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-type", "ice");
        cardElement.setAttribute("data-side", "corp");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("rotated")).toBe(true);
    });

    it("non-ice on board — rotated class not added", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-type", "agenda");
        cardElement.setAttribute("data-side", "corp");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("rotated")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// updateCardHoverArea
// ---------------------------------------------------------------------------
describe("updateCardHoverArea", () => {
    let cardElement;

    beforeEach(() => {
        vi.clearAllMocks();
        // clientHeight defaults to 0 in jsdom; handHeight = 0 − 10 = −10
        // hand threshold: cardRect.y > 0 − (−10) = 10
        // opponent-hand threshold: cardRect.y < −10
        // board: −10 ≤ cardRect.y ≤ 10
        document.body.innerHTML = `<div id="your-hand"></div>`;
        cardElement = document.createElement("div");
        document.body.appendChild(cardElement);
    });

    it("sets data-hover-location to deck when card overlaps a deck", () => {
        const deckWrapper = document.createElement("div");
        deckWrapper.className = "deck";
        deckWrapper.appendChild(document.createElement("div"));
        document.body.appendChild(deckWrapper);
        isPointWithinElement.mockReturnValueOnce(true);
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 0, x: 0 }));
        updateCardHoverArea(cardElement);
        expect(cardElement.getAttribute("data-hover-location")).toBe("deck");
    });

    it("sets data-hover-location to hand when card.y exceeds the bottom threshold", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 50, x: 0 }));
        updateCardHoverArea(cardElement);
        expect(cardElement.getAttribute("data-hover-location")).toBe("hand");
    });

    it("sets data-hover-location to opponent-hand when card.y is below the top threshold", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: -50, x: 0 }));
        updateCardHoverArea(cardElement);
        expect(cardElement.getAttribute("data-hover-location")).toBe(
            "opponent-hand",
        );
    });

    it("sets data-hover-location to board when card is in neither zone", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 0, x: 0 }));
        updateCardHoverArea(cardElement);
        expect(cardElement.getAttribute("data-hover-location")).toBe("board");
    });
});

// ---------------------------------------------------------------------------
// updateCardArea
// ---------------------------------------------------------------------------
describe("updateCardArea", () => {
    let cardElement;

    beforeEach(() => {
        vi.clearAllMocks();
        document.body.innerHTML = `<div id="your-hand"></div>`;
        cardElement = document.createElement("div");
        document.body.appendChild(cardElement);
    });

    it("sets data-location to deck when card overlaps a deck", () => {
        const deckWrapper = document.createElement("div");
        deckWrapper.className = "deck";
        deckWrapper.appendChild(document.createElement("div"));
        document.body.appendChild(deckWrapper);
        isPointWithinElement.mockReturnValueOnce(true);
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 0, x: 0 }));
        updateCardArea(cardElement);
        expect(cardElement.getAttribute("data-location")).toBe("deck");
    });

    it("sets data-location to hand when card.y exceeds the bottom threshold", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 50, x: 0 }));
        updateCardArea(cardElement);
        expect(cardElement.getAttribute("data-location")).toBe("hand");
    });

    it("sets data-location to opponent-hand when card.y is below the top threshold", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: -50, x: 0 }));
        updateCardArea(cardElement);
        expect(cardElement.getAttribute("data-location")).toBe("opponent-hand");
    });

    it("sets data-location to board when card is in neither zone", () => {
        cardElement.getBoundingClientRect = vi.fn(() => ({ y: 0, x: 0 }));
        updateCardArea(cardElement);
        expect(cardElement.getAttribute("data-location")).toBe("board");
    });
});
