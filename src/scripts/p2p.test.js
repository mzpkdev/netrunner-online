// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { receiveMessage, setupP2P } from "./p2p.js"

vi.mock("./game.js", () => ({ setupGame: vi.fn() }))
vi.mock("./utils.js", () => ({
    throttle: vi.fn((fn) => fn),
    snapToGrid: vi.fn(),
    flipElement: vi.fn(),
}))
vi.mock("./card.js", () => ({ createCard: vi.fn() }))
vi.mock("./deck.js", () => ({ createDeck: vi.fn() }))
vi.mock("./token.js", () => ({ createToken: vi.fn() }))

// ---------------------------------------------------------------------------
// setupP2P — playerSide assignment
// ---------------------------------------------------------------------------
describe("setupP2P playerSide assignment", () => {
    let peerHandlers
    let mockConnection

    beforeEach(() => {
        peerHandlers = {}
        mockConnection = { on: vi.fn(), send: vi.fn() }

        window.Peer = vi.fn(() => ({
            on: (event, handler) => {
                peerHandlers[event] = handler
            },
            connect: vi.fn(() => mockConnection),
        }))

        Object.defineProperty(navigator, "clipboard", {
            value: { writeText: vi.fn() },
            configurable: true,
        })

        document.body.innerHTML = `
            <div id="start-game-panel">
                <input id="your-host-id" />
                <input id="opponent-host-id" />
                <button id="host-game">Host</button>
                <button id="join-game">Join</button>
                <button id="play-solo">Solo</button>
            </div>
            <button id="open-player-panel"></button>
        `

        window.playerSide = undefined
    })

    it("sets playerSide to 'runner' when #join-game is clicked", () => {
        setupP2P()
        document.querySelector("#join-game").click()
        expect(window.playerSide).toBe("runner")
    })

    it("sets playerSide to 'corp' when peer fires a connection event (host path)", () => {
        setupP2P()
        peerHandlers["connection"](mockConnection)
        expect(window.playerSide).toBe("corp")
    })

    it("calls Peer constructor with ICE server config including TURN credentials", () => {
        setupP2P()
        expect(window.Peer).toHaveBeenCalledWith(
            expect.objectContaining({
                config: expect.objectContaining({
                    iceServers: expect.arrayContaining([
                        expect.objectContaining({ username: expect.any(String) }),
                    ]),
                }),
            })
        )
    })
})

// ---------------------------------------------------------------------------
// receiveMessage — null guard for unknown entityIds
// ---------------------------------------------------------------------------
describe("receiveMessage null guard", () => {
    beforeEach(() => {
        // Ensure the element referenced in tests does not exist in the DOM.
        document.body.innerHTML = ""
        vi.spyOn(console, "warn").mockImplementation(() => {})
    })

    it("does not throw when grab-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "grab-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            })
        ).not.toThrow()
    })

    it("emits a console.warn when grab-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "grab-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(console.warn).toHaveBeenCalledOnce()
    })

    it("does not throw when move-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "move-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            })
        ).not.toThrow()
    })

    it("emits a console.warn when move-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "move-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(console.warn).toHaveBeenCalledOnce()
    })

    it("does not throw when ungrab-element references a nonexistent entityId", () => {
        expect(() =>
            receiveMessage({
                messageType: "ungrab-element",
                entityId: "nonexistent-entity",
                perspective: "corp",
                content: { x: 100, y: 200 },
            })
        ).not.toThrow()
    })

    it("emits a console.warn when ungrab-element references a nonexistent entityId", () => {
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "nonexistent-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(console.warn).toHaveBeenCalledOnce()
    })
})
