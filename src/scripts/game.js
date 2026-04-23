import { createCard } from "./card.js";
import { createDeck } from "./deck.js";
import { setupKeyboardShortcuts } from "./keyboard.js";
import { setupP2P } from "./p2p.js";
import { setupSidePanels } from "./sidePanels.js";
import { setupTokenSpawning } from "./token.js";
import { fetchAllCards } from "./utils.js";

export const setupCorp = () => {
    const corpDeckLocation =
        window.playerSide === "corp" ? ["85vw", "75vh"] : ["15vw", "25vh"];
    const corpIdentityLocation =
        window.playerSide === "corp" ? ["75vw", "75vh"] : ["25vw", "25vh"];

    createDeck(
        document.querySelector("#corp-deck-list").value,
        "corp-deck",
        ...corpDeckLocation,
    );
    const corpIdentity = document.querySelector("#corp-identity").value.trim();
    const corpIdentityCard = allCards.find(
        (cardInfo) => cardInfo.title === corpIdentity,
    );
    if (corpIdentityCard) {
        createCard(corpIdentityCard, ...corpIdentityLocation);
    } else {
        document.querySelector("#corp-identity-error")?.remove();
        const error = document.createElement("p");
        error.id = "corp-identity-error";
        error.textContent = `Identity not recognized: "${corpIdentity}"`;
        document.body.appendChild(error);
    }
};

export const setupRunner = () => {
    const runnerDeckLocation =
        window.playerSide === "corp" ? ["15vw", "25vh"] : ["85vw", "75vh"];
    const runnerIdentityLocation =
        window.playerSide === "corp" ? ["25vw", "25vh"] : ["75vw", "75vh"];

    createDeck(
        document.querySelector("#runner-deck-list").value,
        "runner-deck",
        ...runnerDeckLocation,
    );
    const runnerIdentity = document
        .querySelector("#runner-identity")
        .value.trim();
    const runnerIdentityCard = allCards.find(
        (cardInfo) => cardInfo.title === runnerIdentity,
    );
    if (runnerIdentityCard) {
        createCard(runnerIdentityCard, ...runnerIdentityLocation);
    } else {
        document.querySelector("#runner-identity-error")?.remove();
        const error = document.createElement("p");
        error.id = "runner-identity-error";
        error.textContent = `Identity not recognized: "${runnerIdentity}"`;
        document.body.appendChild(error);
    }
};

export const setupGame = () => {
    setupCorp();
    setupRunner();
};

export const main = async () => {
    try {
        window.allCards = await fetchAllCards().then((cards) =>
            cards.data.map((cardIfo) => {
                cardIfo.image = `https://card-images.netrunnerdb.com/v2/large/${cardIfo.code}.jpg`;
                return cardIfo;
            }),
        );
    } catch (error) {
        const msg = document.createElement("p");
        msg.id = "fetch-error";
        msg.textContent =
            "Card data unavailable. Check your connection and reload.";
        document.body.appendChild(msg);
        return;
    }

    document.addEventListener("mousedown", (e) => {
        if (e.button === 1) {
            e.preventDefault(); //prevent MMB auto-scroll
        }
    });

    document.addEventListener("click", (e) => {
        document.querySelector(".dropdown-menu").style.display = "none";
    });

    document.addEventListener("auxclick", (e) => {
        document.querySelector(".dropdown-menu").style.display = "none";
    });

    setupKeyboardShortcuts();
    setupP2P();
    setupSidePanels();
    setupTokenSpawning();
};
