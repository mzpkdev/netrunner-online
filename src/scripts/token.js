import { grabCard } from "./grab.js";
import { sendCreateMessage, sendDeleteMessage } from "./p2p.js";
import { isPointWithinElement, putElementTop, snapToGrid } from "./utils.js";

export const createToken = (tokenName, x, y, id) => {
    const tokenElement = document.createElement("div");

    const innerElement = /** @type {HTMLElement} */ (document
        .querySelector(`#${tokenName}`)
        .cloneNode(true));
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
        putElementTop(tokenElement);
        tokenElement.style.left = `${e.detail.targetX}px`;
        tokenElement.style.top = `${e.detail.targetY}px`;
    });
    tokenElement.addEventListener("move", (e) => {
        tryActivateBin(e);
    });
    tokenElement.addEventListener("ungrab", (e) => {
        putElementTop(tokenElement);
        snapToGrid(tokenElement, 15);
        const tokenRect = tokenElement.getBoundingClientRect();

        const tokenBin = document.querySelector("#token-bin");
        if (isPointWithinElement(tokenRect.x, tokenRect.y, tokenBin)) {
            sendDeleteMessage(tokenElement.id);
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
    tokenElement.addEventListener("auxclick", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.button === 1) {
            const lastTokenInStack =
                tokenElement.querySelector("div:only-child").parentElement;
            lastTokenInStack.appendChild(
                createToken(tokenElement.firstElementChild.id, "0px", "15px"),
            );
        }
    });
    document.querySelector("#card-layer").appendChild(tokenElement);
    sendCreateMessage("token", tokenElement.id, [
        tokenName,
        x,
        y,
        tokenElement.id,
    ]);
    return tokenElement;
};

function tryActivateBin(moveEvent) {
    const tokenBin = document.querySelector("#token-bin");
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

function flipToken(tokenElement, key, value) {
    const newTokenName =
        tokenElement.firstElementChild.id === key
            ? value
            : tokenElement.firstElementChild.id === value
              ? key
              : tokenElement.firstElementChild.id;
    const newInnerElement = /** @type {HTMLElement} */ (document
        .querySelector(`#${newTokenName}`)
        .cloneNode(true));
    newInnerElement.style.position = "absolute";
    newInnerElement.style.transform +=
        "translate(-50%, -50%) translate(-10px, -10px)";
    tokenElement.replaceChild(newInnerElement, tokenElement.firstElementChild);

    const stactedToken = tokenElement.querySelector(".token");
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
        /** @type {HTMLElement} */ (document
            .querySelector(`#${tokenName}`))
            .addEventListener("mousedown", (e) => {
                e.preventDefault();

                const tokenElement = createToken(
                    tokenName,
                    `${e.clientX}px`,
                    `${e.clientY}px`,
                );
                grabCard(tokenElement)(e);
            });
    });
};
