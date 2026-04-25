import { grabCard } from "./grab.js";
import { sendCreateMessage } from "./p2p.js";
import { isPointWithinElement, putElementTop, snapToGrid } from "./utils.js";

/**
 * @param {string} tokenName
 * @param {string} x
 * @param {string} y
 * @param {string} [id]
 * @returns {HTMLElement}
 */
export const createToken = (tokenName, x, y, id) => {
    const tokenElement = document.createElement("div");

    const templateEl = /** @type {HTMLElement} */ (document.querySelector(`#${tokenName}`));
    const innerElement = /** @type {HTMLElement} */ (templateEl.cloneNode(true));
    innerElement.style.position = "absolute";
    innerElement.style.transform +=
        "translate(-50%, -50%) translate(-10px, -10px)";
    tokenElement.appendChild(innerElement);

    tokenElement.id = id ? id : `token-${crypto.randomUUID()}`;
    tokenElement.classList.add("token");
    tokenElement.style.left = x;
    tokenElement.style.top = y;
    tokenElement.addEventListener("mousedown", grabCard(tokenElement));
    tokenElement.addEventListener("grab", (e) => {
        const ce = /** @type {CustomEvent} */ (e);
        putElementTop(tokenElement);
        tokenElement.style.left = `${ce.detail.targetX}px`;
        tokenElement.style.top = `${ce.detail.targetY}px`;
    });
    tokenElement.addEventListener("move", (e) => {
        tryActivateBin(/** @type {CustomEvent} */ (e));
    });
    tokenElement.addEventListener("ungrab", (e) => {
        putElementTop(tokenElement);
        snapToGrid(tokenElement, 15);
        const tokenRect = tokenElement.getBoundingClientRect();

        const tokenBin = /** @type {HTMLElement | null} */ (document.querySelector("#token-bin"));
        if (tokenBin && isPointWithinElement(tokenRect.x, tokenRect.y, tokenBin)) {
            tokenElement.remove();
            tokenBin.classList.remove("token-bin-active");
        } else {
            tryPutTokenOnCard(tokenElement, tokenRect);
            tryPutTokenOnToken(tokenElement, tokenRect);
        }
    });

    const dualTokens = [
        ["credit", "advancement"],
        ["advancement", "credit"],
        ["power", "virus"],
        ["virus", "power"],
        ["tag", "bad-publicity"],
        ["bad-publicity", "tag"],
    ];
    // biome-ignore lint/complexity/noForEach: chained filter+forEach; converting to for..of would require an intermediate variable and reduce readability
    dualTokens
        .filter(([key, value]) => key === tokenName)
        .forEach(([key, value]) => {
            tokenElement.addEventListener("dblclick", (e) => {
                e.preventDefault();
                e.stopPropagation();

                flipToken(tokenElement, key, value);
            });
        });
    tokenElement.addEventListener("auxclick", (/** @type {MouseEvent} */ e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.button === 1) {
            const onlyChild = tokenElement.querySelector("div:only-child");
            const lastTokenInStack = onlyChild?.parentElement;
            const firstChildId = /** @type {HTMLElement | null} */ (tokenElement.firstElementChild)?.id;
            if (lastTokenInStack && firstChildId) {
                lastTokenInStack.appendChild(
                    createToken(firstChildId, "0px", "15px"),
                );
            }
        }
    });
    /** @type {HTMLElement} */ (document.querySelector("#card-layer")).appendChild(tokenElement);
    sendCreateMessage("token", tokenElement.id, [
        tokenName,
        x,
        y,
        tokenElement.id,
    ]);
    return tokenElement;
};

/**
 * @param {CustomEvent} moveEvent
 */
function tryActivateBin(moveEvent) {
    const tokenBin = /** @type {HTMLElement | null} */ (document.querySelector("#token-bin"));
    if (!tokenBin) return;
    if (
        isPointWithinElement(
            moveEvent.detail.targetX,
            moveEvent.detail.targetY,
            tokenBin,
        )
    ) {
        tokenBin.classList.add("token-bin-active");
    } else {
        tokenBin.classList.remove("token-bin-active");
    }
}

/**
 * @param {HTMLElement} tokenElement
 * @param {DOMRect} tokenRect
 */
function tryPutTokenOnCard(tokenElement, tokenRect) {
    const cards = [...document.querySelectorAll(".game-card")];
    // biome-ignore lint/complexity/noForEach: iterating DOM spread array; forEach is idiomatic here
    cards.forEach((card) => {
        if (
            isPointWithinElement(
                tokenRect.x,
                tokenRect.y,
                [...card.children].find(
                    (child) => getComputedStyle(child).display !== "none",
                ),
            )
        ) {
            card.appendChild(tokenElement);
            const cardRect = card.getBoundingClientRect();
            if (card.classList.contains("rotated")) {
                tokenElement.style.left = `${(tokenRect.y - cardRect.y) * 2}px`;
                tokenElement.style.top = `${-(tokenRect.x - cardRect.x) * 2}px`;
            } else {
                tokenElement.style.left = `${(tokenRect.x - cardRect.x) * 2}px`;
                tokenElement.style.top = `${(tokenRect.y - cardRect.y) * 2}px`;
            }
        }
    });
}

/**
 * @param {HTMLElement} tokenElement
 * @param {DOMRect} tokenRect
 */
function tryPutTokenOnToken(tokenElement, tokenRect) {
    const tokens = [...document.querySelectorAll(".token")].filter(
        (t) => t.id !== tokenElement.id && !tokenElement.contains(t),
    );
    // biome-ignore lint/complexity/noForEach: iterating filtered DOM spread array; forEach is idiomatic here
    tokens.forEach((token) => {
        if (
            isPointWithinElement(
                tokenRect.x,
                tokenRect.y,
                token.firstElementChild,
            )
        ) {
            token.appendChild(tokenElement);
            tokenElement.style.left = "0px";
            tokenElement.style.top = "15px";
        }
    });
}

/**
 * @param {HTMLElement} tokenElement
 * @param {string} key
 * @param {string} value
 */
function flipToken(tokenElement, key, value) {
    const firstChild = /** @type {HTMLElement | null} */ (tokenElement.firstElementChild);
    const newTokenName =
        firstChild?.id === key
            ? value
            : firstChild?.id === value
              ? key
              : firstChild?.id ?? key;
    const newInnerElement = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (document
        .querySelector(`#${newTokenName}`))
        .cloneNode(true));
    newInnerElement.style.position = "absolute";
    newInnerElement.style.transform +=
        "translate(-50%, -50%) translate(-10px, -10px)";
    if (firstChild) {
        tokenElement.replaceChild(newInnerElement, firstChild);
    }

    const stactedToken = /** @type {HTMLElement | null} */ (tokenElement.querySelector(".token"));
    if (stactedToken) {
        flipToken(stactedToken, key, value);
    }
}

export const setupTokenSpawning = () => {
    // biome-ignore lint/complexity/noForEach: token name list is a short literal array; forEach is clear and concise here
    [
        "credit",
        "advancement",
        "power",
        "virus",
        "tag",
        "bad-publicity",
        "brain-damage",
    ].forEach((tokenName) => {
        document
            .querySelector(`#${tokenName}`)
            ?.addEventListener("mousedown", (e) => {
                const me = /** @type {MouseEvent} */ (e);
                me.preventDefault();

                const tokenElement = createToken(
                    tokenName,
                    `${me.clientX}px`,
                    `${me.clientY}px`,
                );
                grabCard(tokenElement)(me);
            });
    });
};
