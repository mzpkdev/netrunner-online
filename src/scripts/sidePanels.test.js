// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./utils.js', () => ({
    flipElement: vi.fn(),
    snapToGrid: vi.fn(),
}))

vi.mock('./game.js', () => ({
    setupCorp: vi.fn(),
    setupRunner: vi.fn(),
}))

vi.mock('./card.js', () => ({
    updateCardArea: vi.fn(),
    updateCardHoverArea: vi.fn(),
    updateCardTooltipPosition: vi.fn(),
    handleCardBehavior: vi.fn(),
}))

import { flipElement, snapToGrid } from './utils.js'
import { flipBoard, setupSidePanels } from './sidePanels.js'

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const BODY_RECT = { width: 1920, height: 1080 }

const buildCardLayerDOM = () => {
    document.body.innerHTML = `<div id="card-layer"></div>`
    document.body.getBoundingClientRect = vi.fn(() => BODY_RECT)
}

const buildFullDOM = () => {
    document.body.innerHTML = `
        <div id="card-layer"></div>
        <div id="player-panel" tabindex="-1"></div>
        <button id="open-player-panel"></button>
        <div id="resource-panel" tabindex="-1"></div>
        <button id="open-resource-panel"></button>
        <div><div class="flex-container"></div></div>
        <input type="radio" id="corp-check" />
        <input type="radio" id="runner-check" />
        <div id="your-title"></div>
        <div id="opponent-title"></div>
        <div id="corp-deck-panel"></div>
        <div id="runner-deck-panel"></div>
        <button id="load-deck-button"></button>
    `
    document.body.getBoundingClientRect = vi.fn(() => BODY_RECT)
}

// ---------------------------------------------------------------------------
// flipBoard — .deck elements
// ---------------------------------------------------------------------------
describe('flipBoard — .deck elements', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildCardLayerDOM()
    })

    it('calls flipElement on each .deck child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const deck1 = document.createElement('div')
        deck1.classList.add('deck')
        const deck2 = document.createElement('div')
        deck2.classList.add('deck')
        cardLayer.append(deck1, deck2)

        flipBoard()

        expect(flipElement).toHaveBeenCalledWith(deck1, BODY_RECT)
        expect(flipElement).toHaveBeenCalledWith(deck2, BODY_RECT)
    })

    it('calls snapToGrid on each .deck child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const deck1 = document.createElement('div')
        deck1.classList.add('deck')
        const deck2 = document.createElement('div')
        deck2.classList.add('deck')
        cardLayer.append(deck1, deck2)

        flipBoard()

        expect(snapToGrid).toHaveBeenCalledWith(deck1)
        expect(snapToGrid).toHaveBeenCalledWith(deck2)
    })
})

// ---------------------------------------------------------------------------
// flipBoard — .game-card elements
// ---------------------------------------------------------------------------
describe('flipBoard — .game-card elements', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildCardLayerDOM()
    })

    it('calls flipElement on each .game-card child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const card1 = document.createElement('div')
        card1.classList.add('game-card')
        const card2 = document.createElement('div')
        card2.classList.add('game-card')
        cardLayer.append(card1, card2)

        flipBoard()

        expect(flipElement).toHaveBeenCalledWith(card1, BODY_RECT)
        expect(flipElement).toHaveBeenCalledWith(card2, BODY_RECT)
    })

    it('calls snapToGrid on each .game-card child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const card1 = document.createElement('div')
        card1.classList.add('game-card')
        const card2 = document.createElement('div')
        card2.classList.add('game-card')
        cardLayer.append(card1, card2)

        flipBoard()

        expect(snapToGrid).toHaveBeenCalledWith(card1)
        expect(snapToGrid).toHaveBeenCalledWith(card2)
    })
})

// ---------------------------------------------------------------------------
// flipBoard — .token elements
// ---------------------------------------------------------------------------
describe('flipBoard — .token elements', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildCardLayerDOM()
    })

    it('calls flipElement on each .token child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const token1 = document.createElement('div')
        token1.classList.add('token')
        const token2 = document.createElement('div')
        token2.classList.add('token')
        cardLayer.append(token1, token2)

        flipBoard()

        expect(flipElement).toHaveBeenCalledWith(token1, BODY_RECT)
        expect(flipElement).toHaveBeenCalledWith(token2, BODY_RECT)
    })

    it('calls snapToGrid on each .token child of #card-layer', () => {
        const cardLayer = document.querySelector('#card-layer')
        const token1 = document.createElement('div')
        token1.classList.add('token')
        const token2 = document.createElement('div')
        token2.classList.add('token')
        cardLayer.append(token1, token2)

        flipBoard()

        expect(snapToGrid).toHaveBeenCalledWith(token1, 15)
        expect(snapToGrid).toHaveBeenCalledWith(token2, 15)
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — corp radio button
// ---------------------------------------------------------------------------
describe('setupSidePanels — corp radio button', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        window.playerSide = 'runner'
        setupSidePanels()
    })

    it('sets window.playerSide to "corp" when switching from runner', () => {
        document.querySelector('#corp-check').click()
        expect(window.playerSide).toBe('corp')
    })

    it('calls flipBoard when switching from runner to corp', () => {
        const deck = document.createElement('div')
        deck.classList.add('deck')
        document.querySelector('#card-layer').appendChild(deck)

        document.querySelector('#corp-check').click()

        expect(flipElement).toHaveBeenCalledWith(deck, BODY_RECT)
        expect(snapToGrid).toHaveBeenCalledWith(deck)
    })

    it('does not call flipBoard when already on corp side', () => {
        window.playerSide = 'corp'
        document.querySelector('#corp-check').click()
        expect(flipElement).not.toHaveBeenCalled()
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — runner radio button
// ---------------------------------------------------------------------------
describe('setupSidePanels — runner radio button', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        window.playerSide = 'corp'
        setupSidePanels()
    })

    it('sets window.playerSide to "runner" when switching from corp', () => {
        document.querySelector('#runner-check').click()
        expect(window.playerSide).toBe('runner')
    })

    it('calls flipBoard when switching from corp to runner', () => {
        const deck = document.createElement('div')
        deck.classList.add('deck')
        document.querySelector('#card-layer').appendChild(deck)

        document.querySelector('#runner-check').click()

        expect(flipElement).toHaveBeenCalledWith(deck, BODY_RECT)
        expect(snapToGrid).toHaveBeenCalledWith(deck)
    })

    it('does not call flipBoard when already on runner side', () => {
        window.playerSide = 'runner'
        document.querySelector('#runner-check').click()
        expect(flipElement).not.toHaveBeenCalled()
    })
})
