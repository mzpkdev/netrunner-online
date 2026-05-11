import {
    handleCardBehavior,
    updateCardArea,
    updateCardHoverArea,
    updateCardTooltipPosition,
} from "./card.js";
import { setupCorp, setupRunner } from "./game.js";
import { flipElement, snapToGrid } from "./utils.js";

export const flipBoard = () => {
    const bodyRect = document.querySelector("body").getBoundingClientRect();
    // biome-ignore lint/complexity/noForEach: Array.from+forEach used consistently throughout flipBoard; converting all three to for..of loops would only add noise
    Array.from(document.querySelectorAll("#card-layer>.deck")).forEach(
        (deck) => {
            flipElement(deck, bodyRect);
            snapToGrid(deck);
        },
    );
    // biome-ignore lint/complexity/noForEach: see above
    Array.from(document.querySelectorAll("#card-layer>.game-card")).forEach(
        (card) => {
            flipElement(card, bodyRect);
            snapToGrid(card);
            updateCardTooltipPosition(card);
            updateCardArea(card);
            updateCardHoverArea(card);
            handleCardBehavior(card);
        },
    );
    // biome-ignore lint/complexity/noForEach: see above
    Array.from(document.querySelectorAll("#card-layer>.token")).forEach(
        (token) => {
            flipElement(token, bodyRect);
            snapToGrid(token, 15);
        },
    );
};

export const setupSidePanels = () => {
    const playerPanel = document.querySelector("#player-panel");
    document
        .querySelector("#open-player-panel")
        .addEventListener("click", (e) => {
            playerPanel.classList.remove("hiding");
            playerPanel.classList.add("show");
            playerPanel.focus();
        });
    playerPanel.addEventListener("focusin", (e) => {
        playerPanel.classList.remove("hiding");
        playerPanel.classList.add("show");
    });
    playerPanel.addEventListener("focusout", (e) => {
        playerPanel.classList.add("hiding");
    });

    const resourcePanel = document.querySelector("#resource-panel");
    document
        .querySelector("#open-resource-panel")
        .addEventListener("click", (e) => {
            resourcePanel.classList.remove("hiding");
            resourcePanel.classList.add("show");
            resourcePanel.focus();
        });
    resourcePanel.addEventListener("focusin", (e) => {
        resourcePanel.classList.remove("hiding");
        resourcePanel.classList.add("show");
    });
    resourcePanel.addEventListener("focusout", (e) => {
        resourcePanel.classList.add("hiding");
    });

    document
        .querySelector(".flex-container")
        .parentElement.addEventListener("mousemove", (e) => {
            if (e.clientX === 0) {
                document.querySelector("#open-resource-panel").click();
            } else if (e.clientX === window.innerWidth - 1) {
                document.querySelector("#open-player-panel").click();
            }
        });

    document.querySelector("#corp-check").checked = true;
    document.querySelector("#corp-check").addEventListener("click", (e) => {
        if (window.playerSide !== "corp") {
            window.playerSide = "corp";
            flipBoard();
        }
        document.querySelector("#your-title").innerText = "Corporation";
        document.querySelector("#opponent-title").innerText = "Runner";

        document.querySelector("#corp-deck-panel").classList.remove("hidden");
        document.querySelector("#runner-deck-panel").classList.add("hidden");
    });

    document.querySelector("#runner-check").addEventListener("click", (e) => {
        if (window.playerSide !== "runner") {
            window.playerSide = "runner";
            flipBoard();
        }
        document.querySelector("#your-title").innerText = "Runner";
        document.querySelector("#opponent-title").innerText = "Corporation";

        document.querySelector("#corp-deck-panel").classList.add("hidden");
        document.querySelector("#runner-deck-panel").classList.remove("hidden");
    });

    document
        .querySelector("#load-deck-button")
        .addEventListener("click", (e) => {
            if (window.playerSide === "corp") {
                document.querySelector("#card-layer>#corp-deck")?.remove();
                // biome-ignore lint/complexity/noForEach: single-expression NodeList traversal; forEach is idiomatic for DOM removal
                document
                    .querySelectorAll(
                        '#card-layer>.game-card[data-side="corp"]',
                    )
                    .forEach((card) => card.remove());
                setupCorp();
            } else {
                document.querySelector("#card-layer>#runner-deck")?.remove();
                // biome-ignore lint/complexity/noForEach: single-expression NodeList traversal; forEach is idiomatic for DOM removal
                document
                    .querySelectorAll(
                        '#card-layer>.game-card[data-side="runner"]',
                    )
                    .forEach((card) => card.remove());
                setupRunner();
            }
        });
};
