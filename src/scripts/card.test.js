// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCard, handleCardBehavior, snapOutOfHandArea } from "./card.js";

vi.mock("./p2p.js", () => ({
    sendCreateMessage: vi.fn(),
    sendFlipMessage: vi.fn(),
    sendRotateMessage: vi.fn(),
}));
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

    it("renders the card-back img with a non-empty local src", () => {
        const el = createCard(cardInfo, "0px", "0px", "back-test");
        const src = el.querySelector(".card-back img").src;
        expect(src).toBeTruthy();
        expect(src).not.toContain("gstatic.com");
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
