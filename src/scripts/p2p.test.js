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
// receiveMessage — CustomEvent coordinates sourced from message.content
// ---------------------------------------------------------------------------
describe("receiveMessage event coordinate dispatch", () => {
    beforeEach(() => {
        document.body.innerHTML = `<div id="test-token"></div>`
        window.playerSide = "corp"
    })

    it("grab-element dispatches 'grab' event with targetX/targetY from message.content", () => {
        const element = document.querySelector("#test-token")
        let capturedDetail = null
        element.addEventListener("grab", (e) => { capturedDetail = e.detail })

        receiveMessage({
            messageType: "grab-element",
            entityId: "test-token",
            perspective: "corp",
            content: { x: 150, y: 250 },
        })

        expect(capturedDetail).not.toBeNull()
        expect(capturedDetail.targetX).toBe(150)
        expect(capturedDetail.targetY).toBe(250)
    })

    it("move-element dispatches 'move' event with targetX/targetY from message.content", () => {
        const element = document.querySelector("#test-token")
        let capturedDetail = null
        element.addEventListener("move", (e) => { capturedDetail = e.detail })

        receiveMessage({
            messageType: "move-element",
            entityId: "test-token",
            perspective: "corp",
            content: { x: 300, y: 400 },
        })

        expect(capturedDetail).not.toBeNull()
        expect(capturedDetail.targetX).toBe(300)
        expect(capturedDetail.targetY).toBe(400)
    })

    it("ungrab-element dispatches 'ungrab' event with targetX/targetY from message.content", () => {
        const element = document.querySelector("#test-token")
        let capturedDetail = null
        element.addEventListener("ungrab", (e) => { capturedDetail = e.detail })

        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-token",
            perspective: "corp",
            content: { x: 50, y: 75 },
        })

        expect(capturedDetail).not.toBeNull()
        expect(capturedDetail.targetX).toBe(50)
        expect(capturedDetail.targetY).toBe(75)
    })
})
