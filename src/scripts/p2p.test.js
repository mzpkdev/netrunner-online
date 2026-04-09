// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { receiveMessage } from "./p2p.js"

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
// receiveMessage — CustomEvent coordinate dispatch (positive path)
// ---------------------------------------------------------------------------
describe("receiveMessage coordinate dispatch", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
        window.playerSide = "corp"
    })

    it("dispatches grab event with targetX and targetY sourced from message.content", () => {
        const el = document.createElement("div")
        el.id = "test-card-grab"
        document.body.appendChild(el)

        let receivedEvent = null
        el.addEventListener("grab", (e) => { receivedEvent = e })

        receiveMessage({
            messageType: "grab-element",
            entityId: "test-card-grab",
            perspective: "corp",
            content: { x: 42, y: 99 },
        })

        expect(receivedEvent).not.toBeNull()
        expect(receivedEvent.detail.targetX).toBe(42)
        expect(receivedEvent.detail.targetY).toBe(99)
    })

    it("dispatches move event with targetX and targetY sourced from message.content", () => {
        const el = document.createElement("div")
        el.id = "test-card-move"
        document.body.appendChild(el)

        let receivedEvent = null
        el.addEventListener("move", (e) => { receivedEvent = e })

        receiveMessage({
            messageType: "move-element",
            entityId: "test-card-move",
            perspective: "corp",
            content: { x: 150, y: 275 },
        })

        expect(receivedEvent).not.toBeNull()
        expect(receivedEvent.detail.targetX).toBe(150)
        expect(receivedEvent.detail.targetY).toBe(275)
    })

    it("dispatches ungrab event with targetX and targetY sourced from message.content", () => {
        const el = document.createElement("div")
        el.id = "test-card-ungrab"
        document.body.appendChild(el)

        let receivedEvent = null
        el.addEventListener("ungrab", (e) => { receivedEvent = e })

        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-card-ungrab",
            perspective: "corp",
            content: { x: 300, y: 400 },
        })

        expect(receivedEvent).not.toBeNull()
        expect(receivedEvent.detail.targetX).toBe(300)
        expect(receivedEvent.detail.targetY).toBe(400)
    })
})
