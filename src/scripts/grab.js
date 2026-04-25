import { sendGrabMessage, sendMoveMessage, sendUngrabMessage } from "./p2p.js";

/**
 * @param {HTMLElement} element
 */
export const grabCard = (element) => {
    /** @param {MouseEvent} e */
    const grab = (e) => {
        if (e.button === 0) {
            e.preventDefault();
            e.stopPropagation();

            const elementRect = element.getBoundingClientRect();
            const offsetX = elementRect.x - e.clientX;
            const offsetY = elementRect.y - e.clientY;

            const thisMove = move(offsetX, offsetY);
            const thisUngrab = ungrab(thisMove);
            const body = /** @type {HTMLElement} */ (document.querySelector("body"));
            body.addEventListener("mousemove", thisMove);
            body.addEventListener("mouseup", thisUngrab);

            element.dispatchEvent(
                new CustomEvent("grab", {
                    detail: { targetX: elementRect.x, targetY: elementRect.y },
                }),
            );
            sendGrabMessage(element.id, elementRect.x, elementRect.y);
        }
    };

    /**
     * @param {number} offsetX
     * @param {number} offsetY
     * @returns {(e: MouseEvent) => void}
     */
    const move = (offsetX, offsetY) => (e) => {
        e.preventDefault();
        e.stopPropagation();

        element.style.left = `${e.clientX + offsetX}px`;
        element.style.top = `${e.clientY + offsetY}px`;

        element.dispatchEvent(
            new CustomEvent("move", {
                detail: {
                    targetX: e.clientX + offsetX,
                    targetY: e.clientY + offsetY,
                },
            }),
        );
        sendMoveMessage(element.id, e.clientX + offsetX, e.clientY + offsetY);
    };

    /**
     * @param {(e: MouseEvent) => void} thisMove
     */
    const ungrab = (thisMove) => {
        /** @param {MouseEvent} e */
        const thisUngrab = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const body = /** @type {HTMLElement} */ (document.querySelector("body"));
            body.removeEventListener("mousemove", thisMove);
            body.removeEventListener("mouseup", thisUngrab);

            const elementRect = element.getBoundingClientRect();
            element.dispatchEvent(
                new CustomEvent("ungrab", {
                    detail: { targetX: elementRect.x, targetY: elementRect.y },
                }),
            );
            sendUngrabMessage(element.id, elementRect.x, elementRect.y);
        };
        return thisUngrab;
    };

    return grab;
};
