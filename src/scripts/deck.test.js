// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeck, parseDeckList } from "./deck.js";
import { shuffle } from "./utils.js";

vi.mock("./p2p.js", () => ({ sendCreateMessage: vi.fn() }));
vi.mock("./card.js", () => ({
    createCard: vi.fn(),
    snapOutOfHandArea: vi.fn(),
}));
vi.mock("./grab.js", () => ({ grabCard: vi.fn(() => vi.fn()) }));
vi.mock("./utils.js", () => ({ shuffle: vi.fn() }));

const allCards = [
    { title: "Hedge Fund" },
    { title: "Sure Gamble" },
    { title: "Ice Wall" },
];

const makeCardElement = (title = "Hedge Fund") => {
    const el = document.createElement("div");
    el.setAttribute("data-title", title);
    el.setAttribute("data-side", "corp");
    el.setAttribute("data-faction", "haas-bioroid");
    el.setAttribute("data-type", "operation");
    const front = document.createElement("div");
    front.className = "card-front";
    const img = document.createElement("img");
    img.src = "https://example.com/card.png";
    front.appendChild(img);
    el.appendChild(front);
    return el;
};

// ---------------------------------------------------------------------------
// parseDeckList
// ---------------------------------------------------------------------------
describe("parseDeckList", () => {
    it("parses a valid multi-card entry with x suffix", () => {
        const result = parseDeckList("3x Hedge Fund", allCards);
        expect(result.matched).toHaveLength(3);
        expect(result.matched.every((c) => c.title === "Hedge Fund")).toBe(
            true,
        );
    });

    it("parses a valid entry without x suffix", () => {
        const result = parseDeckList("3 Hedge Fund", allCards);
        expect(result.matched).toHaveLength(3);
        expect(result.matched.every((c) => c.title === "Hedge Fund")).toBe(
            true,
        );
    });

    it("skips blank lines interspersed in the list", () => {
        const result = parseDeckList(
            "2x Hedge Fund\n\n1x Sure Gamble",
            allCards,
        );
        expect(result.matched).toHaveLength(3);
    });

    it("parses Windows CRLF line endings", () => {
        const result = parseDeckList(
            "2x Hedge Fund\r\n1x Sure Gamble\r\n3x Ice Wall",
            allCards,
        );
        expect(result.matched).toHaveLength(6);
        expect(result.failed).toHaveLength(0);
        expect(
            result.matched.filter((c) => c.title === "Hedge Fund"),
        ).toHaveLength(2);
        expect(
            result.matched.filter((c) => c.title === "Sure Gamble"),
        ).toHaveLength(1);
        expect(
            result.matched.filter((c) => c.title === "Ice Wall"),
        ).toHaveLength(3);
    });

    it("parses bare carriage-return line endings", () => {
        const result = parseDeckList(
            "1x Hedge Fund\r2x Sure Gamble",
            allCards,
        );
        expect(result.matched).toHaveLength(3);
        expect(result.failed).toHaveLength(0);
        expect(
            result.matched.filter((c) => c.title === "Hedge Fund"),
        ).toHaveLength(1);
        expect(
            result.matched.filter((c) => c.title === "Sure Gamble"),
        ).toHaveLength(2);
    });

    it("returns an empty matched array for an entirely empty string", () => {
        const result = parseDeckList("", allCards);
        expect(result.matched).toHaveLength(0);
        expect(result.failed).toHaveLength(0);
    });

    it("excludes entries where the card name is not in allCards", () => {
        const result = parseDeckList("2x Unknown Card", allCards);
        expect(result.matched).toHaveLength(0);
    });

    it("returns only recognized cards from a mixed list", () => {
        const result = parseDeckList(
            "2x Hedge Fund\n1x Unknown Card\n3x Ice Wall",
            allCards,
        );
        expect(result.matched).toHaveLength(5);
        expect(result.matched.every((c) => c !== undefined)).toBe(true);
        expect(
            result.matched.filter((c) => c.title === "Hedge Fund"),
        ).toHaveLength(2);
        expect(
            result.matched.filter((c) => c.title === "Ice Wall"),
        ).toHaveLength(3);
    });

    it("populates failed with unrecognized card names from a mixed list", () => {
        const result = parseDeckList(
            "2x Hedge Fund\n1x Ghost Runner\n3x Ice Wall\n2x Sneakdoor Beta",
            allCards,
        );
        expect(result.matched).toHaveLength(5);
        expect(result.failed).toHaveLength(2);
        expect(result.failed).toContain("Ghost Runner");
        expect(result.failed).toContain("Sneakdoor Beta");
    });

    it("deduplicates failed names when the same unrecognized card appears multiple times", () => {
        const result = parseDeckList("3x Unknown Card", allCards);
        expect(result.matched).toHaveLength(0);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0]).toBe("Unknown Card");
    });
});

// ---------------------------------------------------------------------------
// createDeck
// ---------------------------------------------------------------------------
describe("createDeck", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="card-layer"></div>';
        window.allCards = allCards;
    });

    it("returns a .deck element appended to #card-layer", () => {
        const el = createDeck("2x Hedge Fund", "test-deck", "0px", "0px");
        expect(el.classList.contains("deck")).toBe(true);
        expect(document.querySelector("#card-layer").contains(el)).toBe(true);
    });

    it("sets the title attribute to reflect the number of parsed cards", () => {
        const el = createDeck("3x Hedge Fund", "test-deck", "0px", "0px");
        expect(el.title).toBe("3 cards");
    });

    it("dispatching puttop increases the deck count and updates the title", () => {
        const el = createDeck("2x Hedge Fund", "test-deck", "0px", "0px");
        el.dispatchEvent(
            new CustomEvent("puttop", {
                detail: { card: makeCardElement("Sure Gamble") },
            }),
        );
        expect(el.title).toBe("3 cards");
    });

    it("dispatching putbottom increases the deck count", () => {
        const el = createDeck("2x Hedge Fund", "test-deck", "0px", "0px");
        el.dispatchEvent(
            new CustomEvent("putbottom", {
                detail: { card: makeCardElement("Ice Wall") },
            }),
        );
        expect(el.title).toBe("3 cards");
    });

    it("dispatching shufflein adds the card to the deck and calls shuffle", () => {
        const el = createDeck("2x Hedge Fund", "test-deck", "0px", "0px");
        shuffle.mockClear();
        el.dispatchEvent(
            new CustomEvent("shufflein", {
                detail: { card: makeCardElement("Ice Wall") },
            }),
        );
        expect(el.title).toBe("3 cards");
        expect(shuffle).toHaveBeenCalledOnce();
    });

    it("appends a .deck-parse-errors element when card names fail to parse", () => {
        createDeck("1x Hedge Fund\n1x Unknown Card", "test-deck", "0px", "0px");
        expect(document.querySelector(".deck-parse-errors")).not.toBeNull();
    });

    it("renders HTML characters in failed card names as escaped text, not live markup", () => {
        createDeck('1x <img src=x onerror="xss()">', "test-deck", "0px", "0px");
        const errors = document.querySelector(".deck-parse-errors");
        expect(errors).not.toBeNull();
        expect(errors.querySelector("img")).toBeNull();
        expect(errors.textContent).toContain('<img src=x onerror="xss()">');
    });

    it('adds red-tint class and sets title to "no cards left" when all cards are drawn', () => {
        const el = createDeck("2x Hedge Fund", "test-deck", "0px", "0px");
        el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        expect(el.firstElementChild.classList.contains("red-tint")).toBe(true);
        expect(el.title).toBe("no cards left");
    });

    it("renders the deck-card-back img with a non-empty local src", () => {
        const el = createDeck("1x Hedge Fund", "deck-back-test", "0px", "0px");
        const src = el.querySelector(".deck-card-back img").src;
        expect(src).toBeTruthy();
        expect(src).not.toContain("gstatic.com");
    });
});
