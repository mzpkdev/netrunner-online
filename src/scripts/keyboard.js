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
        }
    });
};
