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

// ---------------------------------------------------------------------------
// setupP2P — playerSide assignment
// ---------------------------------------------------------------------------
describe("setupP2P playerSide assignment", () => {
    let mockPeer

    beforeEach(() => {
        document.body.innerHTML = `
            <input id="your-host-id" />
            <input id="opponent-host-id" />
            <button id="host-game"></button>
            <button id="join-game"></button>
            <button id="play-solo"></button>
            <div id="start-game-panel"></div>
            <button id="open-player-panel"></button>
        `

        mockPeer = {
            _handlers: {},
            on(event, handler) { this._handlers[event] = handler },
            connect: vi.fn(() => ({ on: vi.fn(), send: vi.fn() })),
            emit(event, ...args) {
                if (this._handlers[event]) this._handlers[event](...args)
            },
        }
        window.Peer = vi.fn(() => mockPeer)
        window.playerSide = undefined
    })

    it("sets window.playerSide to 'runner' when the joining player clicks #join-game", () => {
        setupP2P()
        document.querySelector("#join-game").click()
        expect(window.playerSide).toBe("runner")
    })

    it("sets window.playerSide to 'corp' when the host receives a peer connection", () => {
        setupP2P()
        const mockConn = { on: vi.fn(), send: vi.fn() }
        mockPeer.emit("connection", mockConn)
        expect(window.playerSide).toBe("corp")
    })
})
