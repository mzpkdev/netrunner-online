// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCard } from "./card.js";
import { createDeck } from "./deck.js";
import {
    receiveMessage,
    sendDeleteMessage,
    sendFlipMessage,
    sendRotateMessage,
    setupHeartbeat,
    teardownHeartbeat,
} from "./p2p.js";
import { createToken } from "./token.js";
import { flipElement, snapToGrid } from "./utils.js";

vi.mock("./game.js", () => ({ setupGame: vi.fn() }));
vi.mock("./utils.js", () => ({
    throttle: vi.fn((fn) => fn),
    snapToGrid: vi.fn(),
    flipElement: vi.fn(),
}));
vi.mock("./card.js", () => ({ createCard: vi.fn() }));
vi.mock("./deck.js", () => ({ createDeck: vi.fn() }));
vi.mock("./token.js", () => ({ createToken: vi.fn() }));

// ---------------------------------------------------------------------------
// receiveMessage — positive path for grab / move / ungrab
// ---------------------------------------------------------------------------
describe("receiveMessage positive path", () => {
    let element;

    beforeEach(() => {
        document.body.innerHTML = "";
        element = document.createElement("div");
        element.id = "test-entity";
        document.body.appendChild(element);
        window.playerSide = "corp";
        vi.clearAllMocks();
    });

    it("sets style.left and style.top for grab-element", () => {
        receiveMessage({
            messageType: "grab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(element.style.left).toBe("100px");
        expect(element.style.top).toBe("200px");
    });

    it("dispatches grab CustomEvent with targetX/targetY from message.content for grab-element", () => {
        let detail = null;
        element.addEventListener("grab", (e) => {
            detail = e.detail;
        });
        receiveMessage({
            messageType: "grab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(detail.targetX).toBe(100);
        expect(detail.targetY).toBe(200);
    });

    it("sets style.left and style.top for move-element", () => {
        receiveMessage({
            messageType: "move-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(element.style.left).toBe("100px");
        expect(element.style.top).toBe("200px");
    });

    it("dispatches move CustomEvent with targetX/targetY from message.content for move-element", () => {
        let detail = null;
        element.addEventListener("move", (e) => {
            detail = e.detail;
        });
        receiveMessage({
            messageType: "move-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(detail.targetX).toBe(100);
        expect(detail.targetY).toBe(200);
    });

    it("sets style.left and style.top for ungrab-element", () => {
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(element.style.left).toBe("100px");
        expect(element.style.top).toBe("200px");
    });

    it("dispatches ungrab CustomEvent with targetX/targetY from message.content for ungrab-element", () => {
        let detail = null;
        element.addEventListener("ungrab", (e) => {
            detail = e.detail;
        });
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(detail.targetX).toBe(100);
        expect(detail.targetY).toBe(200);
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — null guard for unknown entityIds
// ---------------------------------------------------------------------------
describe("receiveMessage null guard", () => {
    beforeEach(() => {
        // Ensure the element referenced in tests does not exist in the DOM.
        document.body.innerHTML = "";
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("does not throw when grab-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "grab-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when grab-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "grab-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });

    it("does not throw when move-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "move-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when move-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "move-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });

    it("does not throw when ungrab-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "ungrab-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when ungrab-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — create-element
// ---------------------------------------------------------------------------
describe("receiveMessage create-element", () => {
    let fakeElement;

    beforeEach(() => {
        document.body.innerHTML = "";
        window.playerSide = "corp";
        fakeElement = document.createElement("div");
        fakeElement.id = "new-entity";
        vi.clearAllMocks();
    });

    it("calls createCard with spread content for entityType card", () => {
        createCard.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "card",
            entityId: "new-entity",
            perspective: "corp",
            content: ["arg1", "arg2"],
        });
        expect(createCard).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("calls createDeck with spread content for entityType deck", () => {
        createDeck.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "deck",
            entityId: "new-entity",
            perspective: "corp",
            content: ["arg1", "arg2"],
        });
        expect(createDeck).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("calls createToken with spread content for entityType token", () => {
        createToken.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "token",
            entityId: "new-entity",
            perspective: "corp",
            content: ["arg1", "arg2"],
        });
        expect(createToken).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("skips createCard when the entity ID already exists in the DOM", () => {
        document.body.appendChild(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "card",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(createCard).not.toHaveBeenCalled();
    });

    it("calls flipElement when perspective differs from playerSide", () => {
        createCard.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "card",
            entityId: "new-entity",
            perspective: "runner",
            content: [],
        });
        expect(flipElement).toHaveBeenCalledWith(
            fakeElement,
            expect.objectContaining({ x: 0, y: 0, width: 0, height: 0 }),
        );
    });

    it("calls snapToGrid on the created element", () => {
        createCard.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "card",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(snapToGrid).toHaveBeenCalledWith(fakeElement);
    });

    it("skips createDeck when the entity ID already exists in the DOM", () => {
        document.body.appendChild(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "deck",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(createDeck).not.toHaveBeenCalled();
    });

    it("skips createToken when the entity ID already exists in the DOM", () => {
        document.body.appendChild(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "token",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(createToken).not.toHaveBeenCalled();
    });

    it("calls flipElement with the deck element when perspective differs from playerSide", () => {
        createDeck.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "deck",
            entityId: "new-entity",
            perspective: "runner",
            content: [],
        });
        expect(flipElement).toHaveBeenCalledWith(
            fakeElement,
            expect.objectContaining({ x: 0, y: 0, width: 0, height: 0 }),
        );
    });

    it("calls snapToGrid with the token element", () => {
        createToken.mockReturnValue(fakeElement);
        receiveMessage({
            messageType: "create-element",
            entityType: "token",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(snapToGrid).toHaveBeenCalledWith(fakeElement);
    });

    it("does not throw and calls no create function for an unrecognized entityType", () => {
        expect(() =>
            receiveMessage({
                messageType: "create-element",
                entityType: "unknown",
                entityId: "new-entity",
                perspective: "corp",
                content: [],
            }),
        ).not.toThrow();
        expect(createCard).not.toHaveBeenCalled();
        expect(createDeck).not.toHaveBeenCalled();
        expect(createToken).not.toHaveBeenCalled();
    });

    it("emits a console.warn when entityType is unrecognized", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        receiveMessage({
            messageType: "create-element",
            entityType: "unknown",
            entityId: "new-entity",
            perspective: "corp",
            content: [],
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — flip-element positive path
// ---------------------------------------------------------------------------
describe("receiveMessage flip-element positive path", () => {
    let element;

    beforeEach(() => {
        document.body.innerHTML = "";
        element = document.createElement("div");
        element.id = "flip-entity";
        document.body.appendChild(element);
        window.playerSide = "corp";
        vi.clearAllMocks();
    });

    it("adds the flipped class when content.flipped is true", () => {
        receiveMessage({
            messageType: "flip-element",
            entityId: "flip-entity",
            perspective: "corp",
            content: { flipped: true },
        });
        expect(element.classList.contains("flipped")).toBe(true);
    });

    it("removes the flipped class when content.flipped is false", () => {
        element.classList.add("flipped");
        receiveMessage({
            messageType: "flip-element",
            entityId: "flip-entity",
            perspective: "corp",
            content: { flipped: false },
        });
        expect(element.classList.contains("flipped")).toBe(false);
    });

    it("applies the same flipped state regardless of perspective", () => {
        receiveMessage({
            messageType: "flip-element",
            entityId: "flip-entity",
            perspective: "runner",
            content: { flipped: true },
        });
        expect(element.classList.contains("flipped")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — flip-element null guard
// ---------------------------------------------------------------------------
describe("receiveMessage flip-element null guard", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("does not throw when flip-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "flip-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { flipped: true },
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when flip-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "flip-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { flipped: true },
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — rotate-element positive path
// ---------------------------------------------------------------------------
describe("receiveMessage rotate-element positive path", () => {
    let element;

    beforeEach(() => {
        document.body.innerHTML = "";
        element = document.createElement("div");
        element.id = "rotate-entity";
        document.body.appendChild(element);
        window.playerSide = "corp";
        vi.clearAllMocks();
    });

    it("adds the rotated class when content.rotated is true", () => {
        receiveMessage({
            messageType: "rotate-element",
            entityId: "rotate-entity",
            perspective: "corp",
            content: { rotated: true },
        });
        expect(element.classList.contains("rotated")).toBe(true);
    });

    it("removes the rotated class when content.rotated is false", () => {
        element.classList.add("rotated");
        receiveMessage({
            messageType: "rotate-element",
            entityId: "rotate-entity",
            perspective: "corp",
            content: { rotated: false },
        });
        expect(element.classList.contains("rotated")).toBe(false);
    });

    it("applies the same rotated state regardless of perspective", () => {
        receiveMessage({
            messageType: "rotate-element",
            entityId: "rotate-entity",
            perspective: "runner",
            content: { rotated: true },
        });
        expect(element.classList.contains("rotated")).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — rotate-element null guard
// ---------------------------------------------------------------------------
describe("receiveMessage rotate-element null guard", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("does not throw when rotate-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "rotate-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { rotated: true },
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when rotate-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "rotate-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { rotated: true },
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — delete-element positive path
// ---------------------------------------------------------------------------
describe("receiveMessage delete-element positive path", () => {
    let element;

    beforeEach(() => {
        document.body.innerHTML = "";
        element = document.createElement("div");
        element.id = "delete-entity";
        document.body.appendChild(element);
        vi.clearAllMocks();
    });

    it("removes the element from the DOM when the id matches", () => {
        receiveMessage({
            messageType: "delete-element",
            entityId: "delete-entity",
            perspective: "corp",
            content: {},
        });
        expect(document.getElementById("delete-entity")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — delete-element null guard
// ---------------------------------------------------------------------------
describe("receiveMessage delete-element null guard", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    it("does not throw when delete-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "delete-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: {},
            }),
        ).not.toThrow();
    });

    it("emits a console.warn when delete-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "delete-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: {},
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// sendFlipMessage — payload shape
// ---------------------------------------------------------------------------
describe("sendFlipMessage", () => {
    beforeEach(() => {
        window.playerSide = "corp";
        window.sendMessageImmediate = vi.fn();
    });

    it("calls window.sendMessageImmediate with the correct flip-element payload when flipped is true", () => {
        sendFlipMessage("card-1", true);
        expect(window.sendMessageImmediate).toHaveBeenCalledWith({
            messageType: "flip-element",
            entityId: "card-1",
            perspective: "corp",
            content: { flipped: true },
        });
    });

    it("calls window.sendMessageImmediate with flipped: false when the second argument is false", () => {
        sendFlipMessage("card-1", false);
        expect(window.sendMessageImmediate).toHaveBeenCalledWith({
            messageType: "flip-element",
            entityId: "card-1",
            perspective: "corp",
            content: { flipped: false },
        });
    });
});

// ---------------------------------------------------------------------------
// sendRotateMessage — payload shape
// ---------------------------------------------------------------------------
describe("sendRotateMessage", () => {
    beforeEach(() => {
        window.playerSide = "corp";
        window.sendMessageImmediate = vi.fn();
    });

    it("calls window.sendMessageImmediate with the correct rotate-element payload when rotated is true", () => {
        sendRotateMessage("card-1", true);
        expect(window.sendMessageImmediate).toHaveBeenCalledWith({
            messageType: "rotate-element",
            entityId: "card-1",
            perspective: "corp",
            content: { rotated: true },
        });
    });

    it("calls window.sendMessageImmediate with rotated: false when the second argument is false", () => {
        sendRotateMessage("card-1", false);
        expect(window.sendMessageImmediate).toHaveBeenCalledWith({
            messageType: "rotate-element",
            entityId: "card-1",
            perspective: "corp",
            content: { rotated: false },
        });
    });
});

// ---------------------------------------------------------------------------
// sendDeleteMessage — payload shape
// ---------------------------------------------------------------------------
describe("sendDeleteMessage", () => {
    beforeEach(() => {
        window.playerSide = "corp";
        window.sendMessageImmediate = vi.fn();
    });

    it("calls window.sendMessageImmediate with the correct delete-element payload", () => {
        sendDeleteMessage("card-1");
        expect(window.sendMessageImmediate).toHaveBeenCalledWith({
            messageType: "delete-element",
            entityId: "card-1",
            perspective: "corp",
        });
    });
});

// ---------------------------------------------------------------------------
// receiveMessage — unknown messageType
// ---------------------------------------------------------------------------
describe("receiveMessage unknown messageType", () => {
    it("does not throw for an unrecognized messageType", () => {
        expect(() =>
            receiveMessage({
                messageType: "unknown-type",
                entityId: "any-id",
                perspective: "corp",
                content: {},
            }),
        ).not.toThrow();
    });

    it("emits a console.warn for an unrecognized messageType", () => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
        receiveMessage({
            messageType: "unknown-type",
            entityId: "any-id",
            perspective: "corp",
            content: {},
        });
        expect(console.warn).toHaveBeenCalledOnce();
    });
});

// ---------------------------------------------------------------------------
// Heartbeat — setupHeartbeat / teardownHeartbeat / receiveMessage("heartbeat")
// ---------------------------------------------------------------------------
describe("heartbeat", () => {
    let statusEl;
    let mockConnection;

    beforeEach(() => {
        vi.useFakeTimers();
        document.body.innerHTML = '<div id="p2p-status" style="display:none;"></div>';
        statusEl = document.querySelector("#p2p-status");
        mockConnection = { send: vi.fn() };
    });

    afterEach(() => {
        teardownHeartbeat();
        vi.useRealTimers();
    });

    it("sends a heartbeat message to the peer on each 5-second interval", () => {
        setupHeartbeat(mockConnection);
        vi.advanceTimersByTime(5000);
        expect(mockConnection.send).toHaveBeenCalledWith({ messageType: "heartbeat" });
    });

    it("does not show the disconnect banner before 3 missed pings", () => {
        setupHeartbeat(mockConnection);
        vi.advanceTimersByTime(10000); // 2 intervals
        expect(statusEl.style.display).not.toBe("block");
    });

    it("shows the disconnect banner after 3 consecutive missed heartbeat intervals", () => {
        setupHeartbeat(mockConnection);
        vi.advanceTimersByTime(15000); // 3 intervals
        expect(statusEl.style.display).toBe("block");
    });

    it("receiveMessage heartbeat resets the missed-ping counter so the banner is not shown", () => {
        setupHeartbeat(mockConnection);
        vi.advanceTimersByTime(10000); // 2 intervals — no banner yet
        receiveMessage({ messageType: "heartbeat" });
        vi.advanceTimersByTime(10000); // 2 more intervals after reset — still no banner
        expect(statusEl.style.display).not.toBe("block");
    });

    it("clears the disconnect banner when a heartbeat is received after the banner appeared", () => {
        setupHeartbeat(mockConnection);
        vi.advanceTimersByTime(15000); // trigger banner
        expect(statusEl.style.display).toBe("block");
        receiveMessage({ messageType: "heartbeat" });
        expect(statusEl.style.display).toBe("none");
    });

    it("teardownHeartbeat stops heartbeat messages from being sent", () => {
        setupHeartbeat(mockConnection);
        teardownHeartbeat();
        vi.advanceTimersByTime(15000);
        expect(mockConnection.send).not.toHaveBeenCalled();
    });

    it("teardownHeartbeat prevents the disconnect banner from appearing", () => {
        setupHeartbeat(mockConnection);
        teardownHeartbeat();
        vi.advanceTimersByTime(15000);
        expect(statusEl.style.display).not.toBe("block");
    });
});
