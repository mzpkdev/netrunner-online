import {
    handleCardBehavior,
    updateCardArea,
    updateCardHoverArea,
    updateCardTooltipPosition,
} from "./card.js";
import { setupCorp, setupRunner } from "./game.js";
import { flipElement, snapToGrid } from "./utils.js";

export const flipBoard = () => {
    const bodyRect = /** @type {HTMLElement} */ (document.querySelector("body")).getBoundingClientRect();
    // biome-ignore lint/complexity/noForEach: Array.from+forEach used consistently throughout flipBoard; converting all three to for..of loops would only add noise
    Array.from(document.querySelectorAll("#card-layer>.deck")).forEach(
        (deck) => {
            flipElement(/** @type {HTMLElement} */ (deck), bodyRect);
            snapToGrid(/** @type {HTMLElement} */ (deck));
        },
    );
    // biome-ignore lint/complexity/noForEach: see above
    Array.from(document.querySelectorAll("#card-layer>.game-card")).forEach(
        (card) => {
            flipElement(/** @type {HTMLElement} */ (card), bodyRect);
            snapToGrid(/** @type {HTMLElement} */ (card));
            updateCardTooltipPosition(/** @type {HTMLElement} */ (card));
            updateCardArea(/** @type {HTMLElement} */ (card));
            updateCardHoverArea(/** @type {HTMLElement} */ (card));
            handleCardBehavior(/** @type {HTMLElement} */ (card));
        },
    );
    // biome-ignore lint/complexity/noForEach: see above
    Array.from(document.querySelectorAll("#card-layer>.token")).forEach(
        (token) => {
            flipElement(/** @type {HTMLElement} */ (token), bodyRect);
            snapToGrid(/** @type {HTMLElement} */ (token), 15);
        },
    );
};

export const setupSidePanels = () => {
    const playerPanel = /** @type {HTMLElement} */ (document.querySelector("#player-panel"));
    document
        .querySelector("#open-player-panel")
        ?.addEventListener("click", (e) => {
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

    const resourcePanel = /** @type {HTMLElement} */ (document.querySelector("#resource-panel"));
    document
        .querySelector("#open-resource-panel")
        ?.addEventListener("click", (e) => {
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

    const flexContainer = document.querySelector(".flex-container");
    flexContainer?.parentElement?.addEventListener("mousemove", (e) => {
        if (e.clientX === 0) {
            /** @type {HTMLElement} */ (document.querySelector("#open-resource-panel")).click();
        } else if (e.clientX === window.innerWidth - 1) {
            /** @type {HTMLElement} */ (document.querySelector("#open-player-panel")).click();
        }
    });

    /** @type {HTMLInputElement} */ (document.querySelector("#corp-check")).checked = true;
    document.querySelector("#corp-check")?.addEventListener("click", (e) => {
        if (window.playerSide !== "corp") {
            window.playerSide = "corp";
            flipBoard();
        }
        /** @type {HTMLElement} */ (document.querySelector("#your-title")).innerText = "Corporation";
        /** @type {HTMLElement} */ (document.querySelector("#opponent-title")).innerText = "Runner";

        document.querySelector("#corp-deck-panel")?.classList.remove("hidden");
        document.querySelector("#runner-deck-panel")?.classList.add("hidden");
    });

    document.querySelector("#runner-check")?.addEventListener("click", (e) => {
        if (window.playerSide !== "runner") {
            window.playerSide = "runner";
            flipBoard();
        }
        /** @type {HTMLElement} */ (document.querySelector("#your-title")).innerText = "Runner";
        /** @type {HTMLElement} */ (document.querySelector("#opponent-title")).innerText = "Corporation";

        document.querySelector("#corp-deck-panel")?.classList.add("hidden");
        document.querySelector("#runner-deck-panel")?.classList.remove("hidden");
    });

    document
        .querySelector("#load-deck-button")
        ?.addEventListener("click", (e) => {
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
