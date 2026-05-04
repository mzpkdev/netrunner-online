// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCard, handleCardBehavior, snapOutOfHandArea } from "./card.js";
import { sendDeleteMessage, sendFlipMessage, sendRotateMessage } from "./p2p.js";
import { isPointWithinElement } from "./utils.js";

vi.mock("./p2p.js", () => ({
    sendCreateMessage: vi.fn(),
    sendDeleteMessage: vi.fn(),
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

    it("treats a malicious image value as a literal src without injecting extra DOM nodes", () => {
        const maliciousInfo = {
            ...cardInfo,
            image: '"><img src=x onerror=alert(1)>',
        };
        const el = createCard(maliciousInfo, "0px", "0px", "xss-test");
        // Each wrapper section must contain exactly one img element — no injected nodes.
        expect(el.querySelectorAll(".card-front img")).toHaveLength(1);
        expect(el.querySelectorAll(".card-back img")).toHaveLength(1);
        expect(el.querySelectorAll(".game-card-tooltip img")).toHaveLength(1);
        // No element anywhere in the card must carry an onerror attribute.
        expect(el.querySelectorAll("[onerror]")).toHaveLength(0);
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

    it("hand location removes flipped class and shows card-front", () => {
        cardElement.setAttribute("data-location", "hand");
        cardElement.classList.add("flipped");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("flipped")).toBe(false);
        expect(
            cardElement.querySelector(".card-front").classList.contains("hidden"),
        ).toBe(false);
    });

    it("opponent-hand location removes flipped class and hides card-front", () => {
        cardElement.setAttribute("data-location", "opponent-hand");
        cardElement.classList.add("flipped");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("flipped")).toBe(false);
        expect(
            cardElement.querySelector(".card-front").classList.contains("hidden"),
        ).toBe(true);
    });

    it("board corp operation shows card-front", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-side", "corp");
        cardElement.setAttribute("data-type", "operation");
        handleCardBehavior(cardElement);
        expect(
            cardElement.querySelector(".card-front").classList.contains("hidden"),
        ).toBe(false);
    });

    it("board corp non-operation non-identity sets card face-down", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-side", "corp");
        cardElement.setAttribute("data-type", "asset");
        handleCardBehavior(cardElement);
        expect(
            cardElement.querySelector(".card-front").classList.contains("hidden"),
        ).toBe(true);
        expect(
            cardElement.querySelector(".card-back").classList.contains("hidden"),
        ).toBe(false);
    });

    it("board runner shows card-front", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-side", "runner");
        cardElement.setAttribute("data-type", "program");
        handleCardBehavior(cardElement);
        expect(
            cardElement.querySelector(".card-front").classList.contains("hidden"),
        ).toBe(false);
    });

    it("ICE card on board receives rotated class", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-side", "corp");
        cardElement.setAttribute("data-type", "ice");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("rotated")).toBe(true);
    });

    it("non-ICE card on board has rotated class removed", () => {
        cardElement.setAttribute("data-location", "board");
        cardElement.setAttribute("data-side", "runner");
        cardElement.setAttribute("data-type", "program");
        cardElement.classList.add("rotated");
        handleCardBehavior(cardElement);
        expect(cardElement.classList.contains("rotated")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// createCard — dblclick handler calls sendFlipMessage
// ---------------------------------------------------------------------------
describe("createCard dblclick handler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
    });

    it("calls sendFlipMessage with (element.id, true) on first dblclick", () => {
        const el = createCard(cardInfo, "10px", "20px", "dblclick-test-1");
        vi.clearAllMocks();
        el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        expect(sendFlipMessage).toHaveBeenCalledWith("dblclick-test-1", true);
    });

    it("calls sendFlipMessage with (element.id, false) on second dblclick (toggle off)", () => {
        const el = createCard(cardInfo, "10px", "20px", "dblclick-test-2");
        vi.clearAllMocks();
        el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        expect(sendFlipMessage).toHaveBeenLastCalledWith("dblclick-test-2", false);
    });
});

// ---------------------------------------------------------------------------
// createCard — context-menu-rotate handler calls sendRotateMessage
// ---------------------------------------------------------------------------
describe("createCard context-menu-rotate handler", () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
        vi.clearAllMocks();
        setupDOM();
    });

    it("calls sendRotateMessage with (element.id, true) when context-menu-rotate is clicked the first time", () => {
        const el = createCard(cardInfo, "10px", "20px", "rotate-ctx-test-1");
        vi.clearAllMocks();
        el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
        document
            .querySelector("#context-menu-rotate")
            .dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sendRotateMessage).toHaveBeenCalledWith("rotate-ctx-test-1", true);
    });

    it("calls sendRotateMessage with (element.id, false) on second click (toggle off)", () => {
        const el = createCard(cardInfo, "10px", "20px", "rotate-ctx-test-2");
        vi.clearAllMocks();
        el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
        document
            .querySelector("#context-menu-rotate")
            .dispatchEvent(new MouseEvent("click", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
        document
            .querySelector("#context-menu-rotate")
            .dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(sendRotateMessage).toHaveBeenLastCalledWith("rotate-ctx-test-2", false);
    });
});

// ---------------------------------------------------------------------------
// createCard — ungrab handler sends delete message when dropped on a deck
// ---------------------------------------------------------------------------
describe("createCard ungrab handler — deck drop", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDOM();
        isPointWithinElement.mockReturnValue(false);
    });

    it("calls sendDeleteMessage with the card id when ungrab lands on a deck element", () => {
        const deck = document.createElement("div");
        deck.classList.add("deck");
        const deckChild = document.createElement("div");
        deck.appendChild(deckChild);
        document.body.appendChild(deck);

        const el = createCard(cardInfo, "10px", "20px", "ungrab-deck-test");
        vi.clearAllMocks();

        isPointWithinElement.mockReturnValue(true);
        el.dispatchEvent(new CustomEvent("ungrab"));

        expect(sendDeleteMessage).toHaveBeenCalledWith("ungrab-deck-test");
    });

    it("does not call sendDeleteMessage when ungrab does not land on a deck element", () => {
        const el = createCard(cardInfo, "10px", "20px", "ungrab-no-deck-test");
        vi.clearAllMocks();

        isPointWithinElement.mockReturnValue(false);
        el.dispatchEvent(new CustomEvent("ungrab"));

        expect(sendDeleteMessage).not.toHaveBeenCalled();
    });
});
