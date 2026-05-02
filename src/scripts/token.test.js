// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createToken, setupTokenSpawning } from "./token.js";
import { sendDeleteMessage } from "./p2p.js";
import { isPointWithinElement } from "./utils.js";

vi.mock("./grab.js", () => ({ grabCard: vi.fn(() => () => {}) }));
vi.mock("./p2p.js", () => ({ sendCreateMessage: vi.fn(), sendDeleteMessage: vi.fn() }));
vi.mock("./utils.js", () => ({
    putElementTop: vi.fn(),
    isPointWithinElement: vi.fn(() => false),
    snapToGrid: vi.fn(),
}));

const TOKEN_NAMES = [
    "credit",
    "advancement",
    "power",
    "virus",
    "tag",
    "bad-publicity",
    "brain-damage",
];

function setupTokenDOM() {
    const tokenEls = TOKEN_NAMES.map((name) => `<div id="${name}"></div>`).join(
        "",
    );
    document.body.innerHTML = `
        <div id="card-layer"></div>
        <div id="token-bin"></div>
        ${tokenEls}
    `;
}

// ---------------------------------------------------------------------------
// createToken
// ---------------------------------------------------------------------------
describe("createToken", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupTokenDOM();
    });

    it("uses the supplied id", () => {
        const token = createToken("credit", "0px", "0px", "explicit-token");
        expect(token.id).toBe("explicit-token");
    });

    it("generates a token-${uuid} id when no id is supplied", () => {
        const token = createToken("credit", "0px", "0px");
        expect(token.id).toMatch(/^token-[0-9a-f-]+$/);
    });

    it("appends the token to #card-layer", () => {
        const token = createToken("credit", "0px", "0px", "layer-token");
        expect(document.querySelector("#card-layer").contains(token)).toBe(
            true,
        );
    });
});

// ---------------------------------------------------------------------------
// flipToken — via dblclick on a dual token
// ---------------------------------------------------------------------------
describe("flipToken", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupTokenDOM();
    });

    it("replaces the inner element with the paired token (credit → advancement)", () => {
        const token = createToken("credit", "0px", "0px", "flip-token");
        expect(token.firstElementChild.id).toBe("credit");

        token.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

        expect(token.firstElementChild.id).toBe("advancement");
    });

    it("flips back from advancement to credit on a second dblclick", () => {
        const token = createToken("credit", "0px", "0px", "flip-back-token");
        token.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
        token.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));

        expect(token.firstElementChild.id).toBe("credit");
    });
});

// ---------------------------------------------------------------------------
// tryPutTokenOnCard — via ungrab event
// ---------------------------------------------------------------------------
describe("tryPutTokenOnCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupTokenDOM();
    });

    it("appends the token to an overlapping card and computes style.left/top from the rect delta", () => {
        const card = document.createElement("div");
        card.classList.add("game-card");
        const cardChild = document.createElement("div");
        card.appendChild(cardChild);
        document.querySelector("#card-layer").appendChild(card);

        const token = createToken("credit", "0px", "0px", "onto-card-token");

        // First isPointWithinElement call: token-bin check → false
        // Second call: card child overlap check → true
        isPointWithinElement
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(true);

        token.dispatchEvent(new Event("ungrab"));

        expect(card.contains(token)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// token bin — sendDeleteMessage on ungrab over bin
// ---------------------------------------------------------------------------
describe("token bin deletion", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupTokenDOM();
    });

    it("calls sendDeleteMessage with the token id when isPointWithinElement returns true for the bin", () => {
        const token = createToken("credit", "0px", "0px", "bin-token");

        // ungrab handler: first isPointWithinElement call is the token-bin check → true
        isPointWithinElement.mockReturnValueOnce(true);

        token.dispatchEvent(new Event("ungrab"));

        expect(sendDeleteMessage).toHaveBeenCalledWith("bin-token");
    });

    it("does not call sendDeleteMessage when the token is not over the bin", () => {
        const token = createToken("credit", "0px", "0px", "no-bin-token");

        // isPointWithinElement returns false for the bin
        isPointWithinElement.mockReturnValue(false);

        token.dispatchEvent(new Event("ungrab"));

        expect(sendDeleteMessage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// setupTokenSpawning
// ---------------------------------------------------------------------------
describe("setupTokenSpawning", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupTokenDOM();
    });

    it("attaches a mousedown listener to each token element that creates a token in #card-layer", () => {
        setupTokenSpawning();

        document.querySelector("#credit").dispatchEvent(
            new MouseEvent("mousedown", {
                clientX: 50,
                clientY: 50,
                bubbles: true,
            }),
        );

        expect(
            document.querySelectorAll("#card-layer .token").length,
        ).toBeGreaterThan(0);
    });
});
