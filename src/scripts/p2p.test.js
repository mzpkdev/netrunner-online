// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { receiveMessage } from "./p2p.js"
import { flipElement } from "./utils.js"

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
// receiveMessage — positive path for grab / move / ungrab
// ---------------------------------------------------------------------------
describe("receiveMessage positive path", () => {
    let element

    beforeEach(() => {
        document.body.innerHTML = ""
        element = document.createElement("div")
        element.id = "test-entity"
        document.body.appendChild(element)
        window.playerSide = "corp"
        vi.clearAllMocks()
    })

    it("sets style.left and style.top for grab-element", () => {
        receiveMessage({
            messageType: "grab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(element.style.left).toBe("100px")
        expect(element.style.top).toBe("200px")
    })

    it("dispatches grab CustomEvent with targetX/targetY from message.content for grab-element", () => {
        let detail = null
        element.addEventListener("grab", e => { detail = e.detail })
        receiveMessage({
            messageType: "grab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(detail.targetX).toBe(100)
        expect(detail.targetY).toBe(200)
    })

    it("sets style.left and style.top for move-element", () => {
        receiveMessage({
            messageType: "move-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(element.style.left).toBe("100px")
        expect(element.style.top).toBe("200px")
    })

    it("dispatches move CustomEvent with targetX/targetY from message.content for move-element", () => {
        let detail = null
        element.addEventListener("move", e => { detail = e.detail })
        receiveMessage({
            messageType: "move-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(detail.targetX).toBe(100)
        expect(detail.targetY).toBe(200)
    })

    it("sets style.left and style.top for ungrab-element", () => {
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(element.style.left).toBe("100px")
        expect(element.style.top).toBe("200px")
    })

    it("dispatches ungrab CustomEvent with targetX/targetY from message.content for ungrab-element", () => {
        let detail = null
        element.addEventListener("ungrab", e => { detail = e.detail })
        receiveMessage({
            messageType: "ungrab-element",
            entityId: "test-entity",
            perspective: "corp",
            content: { x: 100, y: 200 },
        })
        expect(detail.targetX).toBe(100)
        expect(detail.targetY).toBe(200)
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
