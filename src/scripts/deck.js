import cardBackUrl from "../assets/card-back.jpg";
import { createCard, snapOutOfHandArea } from "./card.js";
import { grabCard } from "./grab.js";
import { sendCreateMessage } from "./p2p.js";
import { shuffle } from "./utils.js";

/**
 * @param {string} deckListString
 * @param {import('./card.js').CardInfo[]} allCards
 * @returns {{ matched: import('./card.js').CardInfo[], failed: string[] }}
 */
export const parseDeckList = (deckListString, allCards) => {
    const names = deckListString
        .trim()
        .split("\n")
        .flatMap((entry) => {
            const trimmed = entry.trim();
            if (!trimmed) return [];
            const nameParts = trimmed.split(" ");
            const number = Number.parseInt((nameParts.shift() ?? "").replace("x", ""));
            if (!Number.isInteger(number) || number < 1) return [];
            const name = nameParts.join(" ");
            return Array.from({ length: number }, () => name);
        });

    const matched = /** @type {import('./card.js').CardInfo[]} */ ([]);
    const failedSet = new Set();

    for (const cardName of names) {
        const card = allCards.find((c) => c.title === cardName);
        if (card) {
            matched.push(card);
        } else {
            failedSet.add(cardName);
        }
    }

    return { matched, failed: Array.from(failedSet) };
};

/**
 * @param {string} deckList
 * @param {string} id
 * @param {string} x
 * @param {string} y
 * @returns {HTMLElement}
 */
export const createDeck = (deckList, id, x, y) => {
    const { matched, failed } = parseDeckList(deckList, window.allCards);
    const deck = matched;
    shuffle(deck);

    const deckElement = document.createElement("div");
    deckElement.id = id;
    deckElement.title = `${deck.length} cards`;
    deckElement.style.left = x;
    deckElement.style.top = y;
    deckElement.classList.add("deck");
    deckElement.innerHTML = `
    <div class="deck-card-back">
        <img width="190" height="265" src="${cardBackUrl}">
    </div>`;
    /** @type {HTMLElement} */ (document.querySelector("#card-layer")).appendChild(deckElement);
    snapOutOfHandArea(deckElement);

    if (failed.length > 0) {
        const errorElement = document.createElement("div");
        errorElement.classList.add("deck-parse-errors");

        const heading = document.createElement("strong");
        heading.textContent = "Unrecognized cards (not loaded):";
        errorElement.appendChild(heading);

        const list = document.createElement("ul");
        for (const name of failed) {
            const item = document.createElement("li");
            item.textContent = name;
            list.appendChild(item);
        }
        errorElement.appendChild(list);

        /** @type {HTMLElement} */ (document.querySelector("#card-layer")).appendChild(errorElement);
    }

    deckElement.addEventListener("mousedown", (e) => {
        e.preventDefault();

        if (deck.length) {
            const deckRect = deckElement.getBoundingClientRect();
            const cardElement = createCard(
                /** @type {import('./card.js').CardInfo} */ (deck.pop()),
                `${deckRect.x}px`,
                `${deckRect.y}px`,
            );
            grabCard(cardElement)(e);

            if (!deck.length) {
                deckElement.firstElementChild?.classList.add("red-tint");
                deckElement.title = "no cards left";
            } else {
                deckElement.title = `${deck.length} card${deck.length > 1 ? "s" : ""}`;
            }
        }
    });
    deckElement.addEventListener("puttop", (e) => {
        const cardInfo = cardElementToCardInfo(/** @type {CustomEvent} */ (e).detail.card);
        deck.push(cardInfo);

        deckElement.firstElementChild?.classList.remove("red-tint");
        deckElement.title = `${deck.length} card${deck.length > 1 ? "s" : ""}`;
    });

    deckElement.addEventListener("putbottom", (e) => {
        const cardInfo = cardElementToCardInfo(/** @type {CustomEvent} */ (e).detail.card);
        deck.unshift(cardInfo);

        deckElement.firstElementChild?.classList.remove("red-tint");
        deckElement.title = `${deck.length} card${deck.length > 1 ? "s" : ""}`;
    });

    deckElement.addEventListener("shufflein", (e) => {
        const cardInfo = cardElementToCardInfo(/** @type {CustomEvent} */ (e).detail.card);
        deck.push(cardInfo);
        shuffle(deck);

        deckElement.firstElementChild?.classList.remove("red-tint");
        deckElement.title = `${deck.length} card${deck.length > 1 ? "s" : ""}`;
    });

    deckElement.addEventListener("shuffle", (e) => {
        shuffle(deck);
    });

    sendCreateMessage("deck", id, [deckList, id, x, y]);
    return deckElement;
};

/**
 * @param {Element} cardElement
 * @returns {import('./card.js').CardInfo}
 */
const cardElementToCardInfo = (cardElement) => {
    return {
        title: cardElement.getAttribute("data-title") ?? "",
        side_code: cardElement.getAttribute("data-side") ?? "",
        faction_code: cardElement.getAttribute("data-faction") ?? "",
        type_code: cardElement.getAttribute("data-type") ?? "",
        image: /** @type {HTMLImageElement} */ (cardElement.querySelector(".card-front img")).src,
    };
};
