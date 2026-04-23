import { sendFlipMessage, sendRotateMessage } from "./p2p.js";

let selectedCard = null;

export const selectCard = (cardElement) => {
    if (selectedCard && selectedCard !== cardElement) {
        selectedCard.classList.remove("selected");
    }
    selectedCard = cardElement;
    cardElement.classList.add("selected");
};

export const deselectCard = () => {
    if (selectedCard) {
        selectedCard.classList.remove("selected");
    }
    selectedCard = null;
};

export const getSelectedCard = () => selectedCard;

export const setupKeyboardShortcuts = () => {
    document.addEventListener("keydown", (e) => {
        const active = document.activeElement;
        if (
            active &&
            (active.tagName === "INPUT" || active.tagName === "TEXTAREA")
        ) {
            return;
        }

        switch (e.key) {
            case "r":
            case "R":
                if (selectedCard) {
                    selectedCard.classList.toggle("rotated");
                    sendRotateMessage(selectedCard.id, selectedCard.classList.contains("rotated"));
                }
                break;
            case "f":
            case "F":
                if (selectedCard) {
                    selectedCard.classList.toggle("flipped");
                    sendFlipMessage(selectedCard.id, selectedCard.classList.contains("flipped"));
                }
                break;
            case "Delete":
                if (selectedCard) {
                    selectedCard.remove();
                    selectedCard = null;
                }
                break;
            case "Escape":
                deselectCard();
                break;
            case "ArrowRight": {
                const cards = Array.from(document.querySelectorAll(".game-card"));
                if (cards.length === 0) break;
                e.preventDefault();
                const idx = cards.indexOf(document.activeElement);
                const next = (idx === -1 || idx === cards.length - 1) ? 0 : idx + 1;
                cards[next].focus();
                break;
            }
            case "ArrowLeft": {
                const cards = Array.from(document.querySelectorAll(".game-card"));
                if (cards.length === 0) break;
                e.preventDefault();
                const idx = cards.indexOf(document.activeElement);
                const prev = idx <= 0 ? cards.length - 1 : idx - 1;
                cards[prev].focus();
                break;
            }
            case "Enter":
            case " ": {
                e.preventDefault();
                const target = selectedCard ??
                    (document.activeElement?.classList.contains("game-card")
                        ? document.activeElement
                        : null);
                if (target) {
                    target.classList.toggle("flipped");
                    sendFlipMessage(target.id, target.classList.contains("flipped"));
                }
                break;
            }
        }
    });
};
