export async function fetchAllCards() {
    try {
        const response = await fetch(
            "https://netrunnerdb.com/api/2.0/public/cards",
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching:", error);
        throw error;
    }
}

/**
 * @param {any[]} array
 */
export function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * @param {HTMLElement} element
 * @param {number} [grid]
 */
export function snapToGrid(element, grid = 25) {
    const left = Math.round(element.getBoundingClientRect().x / grid) * grid;
    const top = Math.round(element.getBoundingClientRect().y / grid) * grid;
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {Element | null | undefined} element
 * @returns {boolean}
 */
export function isPointWithinElement(x, y, element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    );
}

/**
 * @param {Function} func
 * @param {number} wait
 * @param {{ leading?: boolean, trailing?: boolean }} [options]
 */
export function throttle(func, wait, options) {
    /** @type {ReturnType<typeof setTimeout> | null | undefined} */
    let timeout;
    /** @type {any} */
    let context;
    /** @type {any} */
    let args;
    /** @type {any} */
    let result;
    let previous = 0;
    // biome-ignore lint/style/noParameterAssign: throttle uses options as a local default; restructuring the closure would break deferred invocation
    if (!options) options = {};

    const later = () => {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };

    // biome-ignore lint/style/noArguments: throttle captures call arguments for deferred apply; rest params cannot replace arguments here without restructuring the closure
    const throttled = /** @this {any} */ function () {
        const _now = Date.now();
        if (!previous && options.leading === false) previous = _now;
        const remaining = wait - (_now - previous);
        // @ts-ignore -- 'this' is intentionally dynamic; type depends on call site
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = _now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };

    throttled.cancel = () => {
        clearTimeout(/** @type {any} */ (timeout));
        previous = 0;
        timeout = context = args = null;
    };
    return throttled;
}

/**
 * @param {HTMLElement} element
 */
export const putElementBottom = (element) => {
    const cardLayer = /** @type {HTMLElement} */ (document.querySelector("#card-layer"));
    cardLayer.insertBefore(element, cardLayer.firstElementChild);
};

/**
 * @param {HTMLElement} element
 */
export const putElementTop = (element) => {
    const cardLayer = /** @type {HTMLElement} */ (document.querySelector("#card-layer"));
    if (cardLayer.lastElementChild !== element) {
        cardLayer.appendChild(element);
        element.click();
    }
};

/**
 * @param {HTMLElement} element
 * @param {DOMRect} documentRect
 * @returns {HTMLElement}
 */
export const flipElement = (element, documentRect) => {
    const elementRect = element.getBoundingClientRect();
    element.style.left = `${documentRect.width - elementRect.x}px`;
    element.style.top = `${documentRect.height - elementRect.y}px`;
    return element;
};
