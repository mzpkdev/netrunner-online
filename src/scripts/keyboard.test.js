/**
 * @vitest-environment jsdom
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./p2p.js", () => ({
    sendDeleteMessage: vi.fn(),
    sendFlipMessage: vi.fn(),
    sendRotateMessage: vi.fn(),
}));
import {
    deselectCard,
    getSelectedCard,
    selectCard,
    setupKeyboardShortcuts,
} from "./keyboard.js";
import {
    sendDeleteMessage,
    sendFlipMessage,
    sendRotateMessage,
} from "./p2p.js";

const makeCard = (id = "test-card") => {
    const el = document.createElement("div");
    el.id = id;
    el.classList.add("game-card");
    el.setAttribute("tabindex", "0");
    document.body.appendChild(el);
    return el;
};

// Creates a card that also wires up the focus→selectCard listener,
// matching the behaviour of createCard() in card.js.
const makeCardWithFocusListener = (id = "test-card") => {
    const el = makeCard(id);
    el.addEventListener("focus", () => selectCard(el));
    return el;
};

const pressKey = (key) => {
    document.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
    );
};

beforeAll(() => {
    setupKeyboardShortcuts();
});

beforeEach(() => {
    document.body.innerHTML = "";
    deselectCard();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// selectCard
// ---------------------------------------------------------------------------
describe("selectCard", () => {
    it("adds the 'selected' class to the card", () => {
        const card = makeCard();
        selectCard(card);
        expect(card.classList.contains("selected")).toBe(true);
    });

    it("removes 'selected' from the previously selected card", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        selectCard(card1);
        selectCard(card2);
        expect(card1.classList.contains("selected")).toBe(false);
        expect(card2.classList.contains("selected")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// deselectCard
// ---------------------------------------------------------------------------
describe("deselectCard", () => {
    it("removes 'selected' class from the active card", () => {
        const card = makeCard();
        selectCard(card);
        deselectCard();
        expect(card.classList.contains("selected")).toBe(false);
    });

    it("sets the active card to null", () => {
        const card = makeCard();
        selectCard(card);
        deselectCard();
        expect(getSelectedCard()).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// R key — rotate
// ---------------------------------------------------------------------------
describe("R key", () => {
    it("adds 'rotated' when pressed with a selected card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("r");
        expect(card.classList.contains("rotated")).toBe(true);
    });

    it("removes 'rotated' if the card is already rotated (toggle)", () => {
        const card = makeCard();
        card.classList.add("rotated");
        selectCard(card);
        pressKey("R");
        expect(card.classList.contains("rotated")).toBe(false);
    });

    it("does nothing when no card is selected", () => {
        const card = makeCard();
        pressKey("r");
        expect(card.classList.contains("rotated")).toBe(false);
    });

    it("calls sendRotateMessage with (card.id, true) when toggling on", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("r");
        expect(sendRotateMessage).toHaveBeenCalledWith(card.id, true);
    });

    it("calls sendRotateMessage with (card.id, false) when toggling off", () => {
        const card = makeCard();
        card.classList.add("rotated");
        selectCard(card);
        pressKey("R");
        expect(sendRotateMessage).toHaveBeenCalledWith(card.id, false);
    });

    it("does not call sendRotateMessage when no card is selected", () => {
        makeCard();
        pressKey("r");
        expect(sendRotateMessage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// F key — flip
// ---------------------------------------------------------------------------
describe("F key", () => {
    it("adds 'flipped' when pressed with a selected card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("f");
        expect(card.classList.contains("flipped")).toBe(true);
    });

    it("removes 'flipped' if the card is already flipped (toggle)", () => {
        const card = makeCard();
        card.classList.add("flipped");
        selectCard(card);
        pressKey("F");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("does nothing when no card is selected", () => {
        const card = makeCard();
        pressKey("f");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("calls sendFlipMessage with (card.id, true) when toggling on", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("f");
        expect(sendFlipMessage).toHaveBeenCalledWith(card.id, true);
    });

    it("calls sendFlipMessage with (card.id, false) when toggling off", () => {
        const card = makeCard();
        card.classList.add("flipped");
        selectCard(card);
        pressKey("F");
        expect(sendFlipMessage).toHaveBeenCalledWith(card.id, false);
    });

    it("does not call sendFlipMessage when no card is selected", () => {
        makeCard();
        pressKey("f");
        expect(sendFlipMessage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Delete key — discard
// ---------------------------------------------------------------------------
describe("Delete key", () => {
    it("removes the selected card from the DOM", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Delete");
        expect(document.getElementById("test-card")).toBeNull();
    });

    it("clears the active selection after deletion", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Delete");
        expect(getSelectedCard()).toBeNull();
    });

    it("does nothing when no card is selected", () => {
        const card = makeCard();
        pressKey("Delete");
        expect(document.getElementById("test-card")).not.toBeNull();
    });

    it("calls sendDeleteMessage with the card id when Delete is pressed", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Delete");
        expect(sendDeleteMessage).toHaveBeenCalledWith(card.id);
    });

    it("calls sendDeleteMessage exactly once when Delete is pressed with a selected card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Delete");
        expect(sendDeleteMessage).toHaveBeenCalledOnce();
    });

    it("does not call sendDeleteMessage when no card is selected", () => {
        makeCard();
        pressKey("Delete");
        expect(sendDeleteMessage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Escape key — deselect
// ---------------------------------------------------------------------------
describe("Escape key", () => {
    it("removes 'selected' class from the active card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Escape");
        expect(card.classList.contains("selected")).toBe(false);
    });

    it("clears the active selection", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Escape");
        expect(getSelectedCard()).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Text-input guard
// ---------------------------------------------------------------------------
describe("text-input guard", () => {
    it("does not rotate when an <input> has focus", () => {
        const card = makeCard();
        selectCard(card);
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();
        pressKey("r");
        expect(card.classList.contains("rotated")).toBe(false);
    });

    it("does not flip when a <textarea> has focus", () => {
        const card = makeCard();
        selectCard(card);
        const textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        textarea.focus();
        pressKey("f");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("does not delete when an <input> has focus", () => {
        const card = makeCard();
        selectCard(card);
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();
        pressKey("Delete");
        expect(document.getElementById("test-card")).not.toBeNull();
    });

    it("does not move focus on ArrowRight when an <input> has focus", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        card1.focus();
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();
        pressKey("ArrowRight");
        expect(document.activeElement).toBe(input);
    });

    it("does not flip on Enter when an <input> has focus", () => {
        const card = makeCard();
        selectCard(card);
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();
        pressKey("Enter");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("does not flip on Space when a <textarea> has focus", () => {
        const card = makeCard();
        selectCard(card);
        const textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        textarea.focus();
        pressKey(" ");
        expect(card.classList.contains("flipped")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// ArrowRight key — focus cycling forward
// ---------------------------------------------------------------------------
describe("ArrowRight key", () => {
    it("moves focus to the next card in DOM order", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        card1.focus();
        pressKey("ArrowRight");
        expect(document.activeElement).toBe(card2);
    });

    it("wraps from the last card to the first", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        card2.focus();
        pressKey("ArrowRight");
        expect(document.activeElement).toBe(card1);
    });

    it("focuses the first card when no card is currently focused", () => {
        const card1 = makeCard("card1");
        makeCard("card2");
        pressKey("ArrowRight");
        expect(document.activeElement).toBe(card1);
    });

    it("does nothing when there are no cards", () => {
        // Should not throw
        expect(() => pressKey("ArrowRight")).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// ArrowLeft key — focus cycling backward
// ---------------------------------------------------------------------------
describe("ArrowLeft key", () => {
    it("moves focus to the previous card in DOM order", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        card2.focus();
        pressKey("ArrowLeft");
        expect(document.activeElement).toBe(card1);
    });

    it("wraps from the first card to the last", () => {
        const card1 = makeCard("card1");
        const card2 = makeCard("card2");
        card1.focus();
        pressKey("ArrowLeft");
        expect(document.activeElement).toBe(card2);
    });

    it("focuses the last card when no card is currently focused", () => {
        makeCard("card1");
        const card2 = makeCard("card2");
        pressKey("ArrowLeft");
        expect(document.activeElement).toBe(card2);
    });
});

// ---------------------------------------------------------------------------
// Enter and Space keys — flip activation
// ---------------------------------------------------------------------------
describe("Enter key", () => {
    it("toggles 'flipped' on the selected card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Enter");
        expect(card.classList.contains("flipped")).toBe(true);
    });

    it("removes 'flipped' if the card is already flipped (toggle)", () => {
        const card = makeCard();
        card.classList.add("flipped");
        selectCard(card);
        pressKey("Enter");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("calls sendFlipMessage with (card.id, true) when toggling on", () => {
        const card = makeCard();
        selectCard(card);
        pressKey("Enter");
        expect(sendFlipMessage).toHaveBeenCalledWith(card.id, true);
    });

    it("does nothing when no card is selected", () => {
        makeCard();
        pressKey("Enter");
        expect(sendFlipMessage).not.toHaveBeenCalled();
    });
});

describe("Space key", () => {
    it("toggles 'flipped' on the selected card", () => {
        const card = makeCard();
        selectCard(card);
        pressKey(" ");
        expect(card.classList.contains("flipped")).toBe(true);
    });

    it("removes 'flipped' if the card is already flipped (toggle)", () => {
        const card = makeCard();
        card.classList.add("flipped");
        selectCard(card);
        pressKey(" ");
        expect(card.classList.contains("flipped")).toBe(false);
    });

    it("calls sendFlipMessage with (card.id, true) when toggling on", () => {
        const card = makeCard();
        selectCard(card);
        pressKey(" ");
        expect(sendFlipMessage).toHaveBeenCalledWith(card.id, true);
    });

    it("does nothing when no card is selected", () => {
        makeCard();
        pressKey(" ");
        expect(sendFlipMessage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// focus-sets-selection — keyboard focus syncs selected card
// ---------------------------------------------------------------------------
describe("focus-sets-selection", () => {
    it("focusing a card via the focus event calls selectCard", () => {
        const card = makeCardWithFocusListener();
        card.focus();
        expect(getSelectedCard()).toBe(card);
    });

    it("ArrowRight focus updates the active selection", () => {
        const card1 = makeCardWithFocusListener("card1");
        const card2 = makeCardWithFocusListener("card2");
        card1.focus();
        pressKey("ArrowRight");
        expect(getSelectedCard()).toBe(card2);
    });

    it("ArrowLeft focus updates the active selection", () => {
        const card1 = makeCardWithFocusListener("card1");
        const card2 = makeCardWithFocusListener("card2");
        card2.focus();
        pressKey("ArrowLeft");
        expect(getSelectedCard()).toBe(card1);
    });

    it("clears selection on the previously focused card", () => {
        const card1 = makeCardWithFocusListener("card1");
        const card2 = makeCardWithFocusListener("card2");
        card1.focus();
        card2.focus();
        expect(card1.classList.contains("selected")).toBe(false);
        expect(card2.classList.contains("selected")).toBe(true);
    });
});
