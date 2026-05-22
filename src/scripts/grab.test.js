// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { grabCard } from "./grab.js";
import { sendGrabMessage, sendMoveMessage, sendUngrabMessage } from "./p2p.js";

vi.mock("./p2p.js", () => ({
    sendGrabMessage: vi.fn(),
    sendMoveMessage: vi.fn(),
    sendUngrabMessage: vi.fn(),
}));

// ---------------------------------------------------------------------------
// grabCard
// ---------------------------------------------------------------------------
describe("grabCard", () => {
    let element;

    beforeEach(() => {
        vi.clearAllMocks();
        element = document.createElement("div");
        element.id = "card-1";
        // elementRect.x=100, elementRect.y=200
        element.getBoundingClientRect = vi.fn(
            () =>
                /** @type {DOMRect} */ ({
                    x: 100,
                    y: 200,
                    top: 200,
                    right: 100,
                    bottom: 200,
                    left: 100,
                    width: 0,
                    height: 0,
                    toJSON: () => ({}),
                }),
        );
        document.body.appendChild(element);
    });

    afterEach(() => {
        // Fire mouseup to remove any grab-registered body listeners before the
        // next test runs.  For tests that already fired mouseup this is a no-op.
        document.body.dispatchEvent(
            new MouseEvent("mouseup", { bubbles: true }),
        );
        element.remove();
    });

    // -----------------------------------------------------------------------
    // left-click (button 0) — grab phase
    // -----------------------------------------------------------------------
    describe("left-click (button 0)", () => {
        it("dispatches a grab CustomEvent with targetX and targetY from getBoundingClientRect", () => {
            const grabHandler = grabCard(element);

            /** @type {any} */
            let capturedDetail = null;
            element.addEventListener("grab", (e) => {
                capturedDetail = e.detail;
            });

            // clientX=50, clientY=80 → offsetX=50, offsetY=120
            grabHandler(
                new MouseEvent("mousedown", {
                    button: 0,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );

            expect(capturedDetail).not.toBeNull();
            expect(capturedDetail.targetX).toBe(100);
            expect(capturedDetail.targetY).toBe(200);
        });

        it("calls sendGrabMessage with the element id and element rect coordinates", () => {
            const grabHandler = grabCard(element);

            grabHandler(
                new MouseEvent("mousedown", {
                    button: 0,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );

            expect(sendGrabMessage).toHaveBeenCalledOnce();
            expect(sendGrabMessage).toHaveBeenCalledWith("card-1", 100, 200);
        });
    });

    // -----------------------------------------------------------------------
    // mousemove after grab — move phase
    // -----------------------------------------------------------------------
    describe("mousemove after grab", () => {
        beforeEach(() => {
            // Initiate a grab: elementRect={x:100,y:200}, clientX=50, clientY=80
            // → offsetX = 100-50 = 50, offsetY = 200-80 = 120
            grabCard(element)(
                new MouseEvent("mousedown", {
                    button: 0,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );
        });

        it("dispatches a move CustomEvent with coordinates matching clientX + offsetX", () => {
            /** @type {any} */
            let capturedDetail = null;
            element.addEventListener("move", (e) => {
                capturedDetail = e.detail;
            });

            // clientX=60, clientY=90 → targetX=60+50=110, targetY=90+120=210
            document.body.dispatchEvent(
                new MouseEvent("mousemove", {
                    clientX: 60,
                    clientY: 90,
                    bubbles: true,
                }),
            );

            expect(capturedDetail).not.toBeNull();
            expect(capturedDetail.targetX).toBe(110);
            expect(capturedDetail.targetY).toBe(210);
        });

        it("calls sendMoveMessage with the element id and updated coordinates", () => {
            document.body.dispatchEvent(
                new MouseEvent("mousemove", {
                    clientX: 60,
                    clientY: 90,
                    bubbles: true,
                }),
            );

            expect(sendMoveMessage).toHaveBeenCalledOnce();
            expect(sendMoveMessage).toHaveBeenCalledWith("card-1", 110, 210);
        });
    });

    // -----------------------------------------------------------------------
    // mouseup after grab — ungrab phase
    // -----------------------------------------------------------------------
    describe("mouseup after grab", () => {
        beforeEach(() => {
            grabCard(element)(
                new MouseEvent("mousedown", {
                    button: 0,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );
        });

        it("dispatches an ungrab CustomEvent", () => {
            let capturedDetail = null;
            element.addEventListener("ungrab", (e) => {
                capturedDetail = e.detail;
            });

            document.body.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
            );

            expect(capturedDetail).not.toBeNull();
        });

        it("calls sendUngrabMessage with the element id and element rect coordinates", () => {
            document.body.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
            );

            expect(sendUngrabMessage).toHaveBeenCalledOnce();
            expect(sendUngrabMessage).toHaveBeenCalledWith("card-1", 100, 200);
        });

        it("removes the mousemove listener from body so subsequent moves do not dispatch move events", () => {
            document.body.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
            );

            let moveCount = 0;
            element.addEventListener("move", () => {
                moveCount++;
            });
            document.body.dispatchEvent(
                new MouseEvent("mousemove", {
                    clientX: 0,
                    clientY: 0,
                    bubbles: true,
                }),
            );

            expect(moveCount).toBe(0);
        });

        it("removes the mouseup listener from body so a subsequent mouseup does not dispatch ungrab again", () => {
            document.body.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
            );

            let ungrabCount = 0;
            element.addEventListener("ungrab", () => {
                ungrabCount++;
            });
            document.body.dispatchEvent(
                new MouseEvent("mouseup", { bubbles: true }),
            );

            expect(ungrabCount).toBe(0);
        });
    });

    // -----------------------------------------------------------------------
    // non-left-click (button !== 0)
    // -----------------------------------------------------------------------
    describe("non-left-click (button !== 0)", () => {
        it("does not dispatch a grab CustomEvent", () => {
            const grabHandler = grabCard(element);

            let eventFired = false;
            element.addEventListener("grab", () => {
                eventFired = true;
            });

            grabHandler(
                new MouseEvent("mousedown", {
                    button: 2,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );

            expect(eventFired).toBe(false);
        });

        it("does not call any p2p message function", () => {
            const grabHandler = grabCard(element);

            grabHandler(
                new MouseEvent("mousedown", {
                    button: 2,
                    clientX: 50,
                    clientY: 80,
                    bubbles: true,
                }),
            );

            expect(sendGrabMessage).not.toHaveBeenCalled();
            expect(sendMoveMessage).not.toHaveBeenCalled();
            expect(sendUngrabMessage).not.toHaveBeenCalled();
        });
    });
});
