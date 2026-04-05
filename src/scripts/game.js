import { setupP2P } from "./p2p.js"
import { fetchAllCards } from "./utils.js"
import { setupSidePanels } from "./sidePanels.js"
import { createDeck } from "./deck.js"
import { createCard } from "./card.js"
import { setupTokenSpawning } from "./token.js"

export const setupCorp = () => {
    const corpDeckLocation = window.playerSide === "corp" ? ["85vw", "75vh"] : ["15vw", "25vh"]
    const corpIdentityLocation = window.playerSide === "corp" ? ["75vw", "75vh"] : ["25vw", "25vh"]

    createDeck(document.querySelector("#corp-deck-list").value, "corp-deck", ...corpDeckLocation)
    const corpIndentity = document.querySelector("#corp-identity").value.trim()
    const corpIndentityElement = createCard(allCards.find(cardInfo => cardInfo.title === corpIndentity), ...corpIdentityLocation)
}

export const setupRunner = () => {
    const runnerDeckLocation = window.playerSide === "corp" ? ["15vw", "25vh"] : ["85vw", "75vh"]
    const runnerIndentityLocation = window.playerSide === "corp" ? ["25vw", "25vh"] : ["75vw", "75vh"]

    createDeck(document.querySelector("#runner-deck-list").value, "runner-deck", ...runnerDeckLocation)
    const runnerIndentity = document.querySelector("#runner-identity").value.trim()
    const runnerIndentityElement = createCard(allCards.find(cardInfo => cardInfo.title === runnerIndentity), ...runnerIndentityLocation)
}

export const setupGame = () => {
    setupCorp()
    setupRunner()
}

export const main = async () => {

    const cardsResult = await fetchAllCards();
    if (!cardsResult) {
        const modalBody = document.querySelector('#start-game-panel .modal-body');
        if (modalBody) {
            const errorBanner = document.createElement('div');
            errorBanner.className = 'alert alert-danger';
            errorBanner.role = 'alert';
            errorBanner.textContent = 'Failed to load card data from NetrunnerDB. Please check your connection and reload the page.';
            modalBody.prepend(errorBanner);
        }
        return;
    }
    window.allCards = cardsResult.data.map(cardIfo => {
        cardIfo.image = `https://card-images.netrunnerdb.com/v2/large/${cardIfo.code}.jpg`
        return cardIfo
    })

    document.addEventListener("mousedown", e => {
        if (e.button === 1) {
            e.preventDefault() //prevent MMB auto-scroll
        }
    })

    document.addEventListener("click", e => {
        document.querySelector(".dropdown-menu").style.display = "none"
    })
    
    document.addEventListener("auxclick", e => {
        document.querySelector(".dropdown-menu").style.display = "none"
    })

    setupP2P()
    setupSidePanels()
    setupTokenSpawning()
}
