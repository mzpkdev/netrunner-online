import { grabCard } from "./grab.js";
import { selectCard } from "./keyboard.js";
import { sendCreateMessage } from "./p2p.js";
import {
    isPointWithinElement,
    putElementBottom,
    putElementTop,
    snapToGrid,
} from "./utils.js";

export const createCard = (cardInfo, x, y, id) => {
    const cardElement = document.createElement("div");
    cardElement.setAttribute("data-title", cardInfo.title);
    cardElement.setAttribute("data-side", cardInfo.side_code);
    cardElement.setAttribute("data-faction", cardInfo.faction_code);
    cardElement.setAttribute("data-type", cardInfo.type_code);
    cardElement.setAttribute("data-location", "deck");
    cardElement.setAttribute("id", id ? id : `card-${crypto.randomUUID()}`);
    cardElement.style = `left: ${x}; top: ${y};`;
    cardElement.classList.add("game-card");
    cardElement.innerHTML = `
    <div class="card-front">
        <img width="190" height="265" src="${cardInfo.image}">
    </div>
    <div class="card-back">
        <img width="190" height="265" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSEArMDpLqCtEe0kLcWh5dJj0s-dAnCShz_cQ&s">
    </div>
    <div class="game-card-tooltip">
        <img width="190" height="265" src="${cardInfo.image}">
    </div>
    `;
    document.querySelector("#card-layer").appendChild(cardElement);

    cardElement.addEventListener("mousedown", grabCard(cardElement));
    cardElement.addEventListener("dblclick", flipCard(cardElement));
    cardElement.addEventListener("auxclick", putCardUnder(cardElement));
    cardElement.addEventListener("contextmenu", cardContextMenu(cardElement));
    cardElement.addEventListener("grab", (e) => {
        putElementTop(cardElement);
        selectCard(cardElement);
    });
    cardElement.addEventListener("move", (e) => {
        updateCardTooltipPosition(cardElement);
        updateCardHoverArea(cardElement);
    });
    cardElement.addEventListener("ungrab", (e) => {
        putElementTop(cardElement);
        snapToGrid(cardElement);
        updateCardArea(cardElement);
        handleCardBehavior(cardElement);

        const cardRect = cardElement.getBoundingClientRect();
        const targetDeck = Array.from(document.querySelectorAll(".deck")).find(
            (deck) =>
                isPointWithinElement(
                    cardRect.x,
                    cardRect.y,
                    deck.firstElementChild,
                ),
        );
        if (targetDeck) {
            const putTop = new CustomEvent("puttop", {
                detail: { card: cardElement },
            });
            targetDeck.dispatchEvent(putTop);
            cardElement.remove();
        }
    });
    snapOutOfHandArea(cardElement);
    updateCardTooltipPosition(cardElement);
    handleCardBehavior(cardElement);
    sendCreateMessage("card", cardElement.id, [cardInfo, x, y, cardElement.id]);
    return cardElement;
};

const flipCard = (element) => {
    return () => {
        element.classList.toggle("flipped");
    };
};

const putCardUnder = (element) => {
    return (e) => {
        e.preventDefault();

        if (e.button === 1) {
            putElementBottom(element);
        }
    };
};

const cardContextMenu = (element) => {
    return (e) => {
        e.preventDefault();
        const contextMenu = document.querySelector(".dropdown-menu");
        const newContextMenu = /** @type {HTMLElement} */ (contextMenu.cloneNode(true));
        contextMenu.parentNode.replaceChild(newContextMenu, contextMenu);

        newContextMenu.style.display = "block";
        newContextMenu.style.left = `${e.clientX}px`;
        newContextMenu.style.top = `${e.clientY}px`;
        newContextMenu.scrollIntoView();
        newContextMenu
            .querySelector("#context-menu-flip")
            .addEventListener("click", flipCard(element));
        newContextMenu
            .querySelector("#context-menu-put-under")
            .addEventListener("click", () => putElementBottom(element));
        newContextMenu
            .querySelector("#context-menu-rotate")
            .addEventListener("click", () =>
                element.classList.toggle("rotated"),
            );
    };
};

export const updateCardTooltipPosition = (cardElement) => {
    const y = cardElement.getBoundingClientRect().y;
    if (y < 500) {
        cardElement
            .querySelector(".game-card-tooltip")
            .classList.add("force-in-view");
    } else {
        cardElement
            .querySelector(".game-card-tooltip")
            .classList.remove("force-in-view");
    }
};

export const updateCardHoverArea = (cardElement) => {
    const cardRect = cardElement.getBoundingClientRect();
    const handHeight =
        document.querySelector("#your-hand").getBoundingClientRect().height -
        10; //protection from play by grid snapping
    const decks = [...document.querySelectorAll(".deck")];

    if (
        decks.some((deck) =>
            isPointWithinElement(
                cardRect.x,
                cardRect.y,
                deck.firstElementChild,
            ),
        )
    ) {
        cardElement.setAttribute("data-hover-location", "deck");
    } else if (
        cardRect.y >
        document.documentElement.clientHeight - handHeight
    ) {
        cardElement.setAttribute("data-hover-location", "hand");
    } else if (cardRect.y < handHeight) {
        cardElement.setAttribute("data-hover-location", "opponent-hand");
    } else {
        cardElement.setAttribute("data-hover-location", "board");
    }
};

export const updateCardArea = (cardElement) => {
    const cardRect = cardElement.getBoundingClientRect();
    const handHeight =
        document.querySelector("#your-hand").getBoundingClientRect().height -
        10; //protection from play by grid snapping
    const decks = [...document.querySelectorAll(".deck")];

    if (
        decks.some((deck) =>
            isPointWithinElement(
                cardRect.x,
                cardRect.y,
                deck.firstElementChild,
            ),
        )
    ) {
        cardElement.setAttribute("data-location", "deck");
    } else if (
        cardRect.y >
        document.documentElement.clientHeight - handHeight
    ) {
        cardElement.setAttribute("data-location", "hand");
    } else if (cardRect.y < handHeight) {
        cardElement.setAttribute("data-location", "opponent-hand");
    } else {
        cardElement.setAttribute("data-location", "board");
    }
};

export const snapOutOfHandArea = (cardElement) => {
    const yourHandY = document
        .querySelector("#your-hand")
        .getBoundingClientRect().y;
    const cardY = cardElement.getBoundingClientRect().y;
    if (yourHandY - cardY < 75) {
        cardElement.style.top = `${cardY - (75 - (yourHandY - cardY))}px`;
    }
    snapToGrid(cardElement);
};

const snapIntoHandArea = (cardElement) => {
    const yourHandRect = document
        .querySelector("#your-hand")
        .getBoundingClientRect();
    cardElement.style.top = `${yourHandRect.y + yourHandRect.height / 2}px`;
    snapToGrid(cardElement);
};

export const handleCardBehavior = (cardElement) => {
    const cardLocation = cardElement.getAttribute("data-location");

    switch (cardLocation) {
        case "deck":
            if (cardElement.getAttribute("data-type") === "identity") {
                cardElement.setAttribute("data-location", "board");
                cardVisibility(cardElement, true, false, true);
            } else {
                cardVisibility(cardElement, false, true, false);
            }
            break;

        case "hand":
            cardElement.classList.remove("flipped");
            cardVisibility(cardElement, true, false, true);
            snapIntoHandArea(cardElement);
            break;

        case "opponent-hand":
            cardElement.classList.remove("flipped");
            cardVisibility(cardElement, false, true, false);
            break;

        case "board":
            if (cardElement.getAttribute("data-side") === "corp") {
                if (
                    cardElement.getAttribute("data-type") === "operation" ||
                    cardElement.getAttribute("data-type") === "identity"
                ) {
                    cardVisibility(cardElement, true, false, true);
                } else {
                    if (
                        cardElement.getAttribute("data-side") ===
                        window.playerSide
                    ) {
                        cardVisibility(cardElement, false, true, true);
                    } else {
                        cardVisibility(cardElement, false, true, false);
                    }
                }
            } else {
                cardVisibility(cardElement, true, false, true);
            }
            snapOutOfHandArea(cardElement);
            break;

        case "bin":
            cardVisibility(cardElement, true, false, true);
            break;
    }

    if (
        cardElement.getAttribute("data-type") === "ice" &&
        cardLocation === "board"
    ) {
        cardElement.classList.add("rotated");
    } else {
        cardElement.classList.remove("rotated");
    }
};

function cardVisibility(
    cardElement,
    frontVisible,
    backVisible,
    tooltipVisible,
) {
    if (frontVisible) {
        cardElement.querySelector(".card-front").classList.remove("hidden");
    } else {
        cardElement.querySelector(".card-front").classList.add("hidden");
    }
    if (backVisible) {
        cardElement.querySelector(".card-back").classList.remove("hidden");
    } else {
        cardElement.querySelector(".card-back").classList.add("hidden");
    }
    if (tooltipVisible) {
        cardElement
            .querySelector(".game-card-tooltip")
            .classList.remove("hidden");
    } else {
        cardElement.querySelector(".game-card-tooltip").classList.add("hidden");
    }
}
