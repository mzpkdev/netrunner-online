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
import { setupCorp, setupRunner } from './game.js'
import { updateCardArea, updateCardHoverArea, updateCardTooltipPosition, handleCardBehavior } from './card.js'
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

    it('calls updateCardTooltipPosition, updateCardArea, updateCardHoverArea, and handleCardBehavior on each .game-card', () => {
        const cardLayer = document.querySelector('#card-layer')
        const card1 = document.createElement('div')
        card1.classList.add('game-card')
        const card2 = document.createElement('div')
        card2.classList.add('game-card')
        cardLayer.append(card1, card2)

        flipBoard()

        expect(updateCardTooltipPosition).toHaveBeenCalledWith(card1)
        expect(updateCardArea).toHaveBeenCalledWith(card1)
        expect(updateCardHoverArea).toHaveBeenCalledWith(card1)
        expect(handleCardBehavior).toHaveBeenCalledWith(card1)

        expect(updateCardTooltipPosition).toHaveBeenCalledWith(card2)
        expect(updateCardArea).toHaveBeenCalledWith(card2)
        expect(updateCardHoverArea).toHaveBeenCalledWith(card2)
        expect(handleCardBehavior).toHaveBeenCalledWith(card2)
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

    it('sets #corp-check.checked to true during initialization', () => {
        expect(document.querySelector('#corp-check').checked).toBeTruthy()
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

    it('sets #your-title to "Corporation" and #opponent-title to "Runner"', () => {
        document.querySelector('#corp-check').click()
        expect(document.querySelector('#your-title').innerText).toBe('Corporation')
        expect(document.querySelector('#opponent-title').innerText).toBe('Runner')
    })

    it('removes hidden from #corp-deck-panel and adds hidden to #runner-deck-panel', () => {
        document.querySelector('#corp-deck-panel').classList.add('hidden')
        document.querySelector('#runner-deck-panel').classList.remove('hidden')

        document.querySelector('#corp-check').click()

        expect(document.querySelector('#corp-deck-panel').classList.contains('hidden')).toBe(false)
        expect(document.querySelector('#runner-deck-panel').classList.contains('hidden')).toBe(true)
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

    it('sets #your-title to "Runner" and #opponent-title to "Corporation"', () => {
        document.querySelector('#runner-check').click()
        expect(document.querySelector('#your-title').innerText).toBe('Runner')
        expect(document.querySelector('#opponent-title').innerText).toBe('Corporation')
    })

    it('removes hidden from #runner-deck-panel and adds hidden to #corp-deck-panel', () => {
        document.querySelector('#runner-deck-panel').classList.add('hidden')
        document.querySelector('#corp-deck-panel').classList.remove('hidden')

        document.querySelector('#runner-check').click()

        expect(document.querySelector('#runner-deck-panel').classList.contains('hidden')).toBe(false)
        expect(document.querySelector('#corp-deck-panel').classList.contains('hidden')).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — player panel open/close
// ---------------------------------------------------------------------------
describe('setupSidePanels — player panel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        setupSidePanels()
    })

    it('clicking #open-player-panel adds "show" and removes "hiding" on #player-panel', () => {
        const panel = document.querySelector('#player-panel')
        panel.classList.add('hiding')

        document.querySelector('#open-player-panel').click()

        expect(panel.classList.contains('show')).toBe(true)
        expect(panel.classList.contains('hiding')).toBe(false)
        expect(document.activeElement).toBe(panel)
    })

    it('focusin on #player-panel adds "show" and removes "hiding"', () => {
        const panel = document.querySelector('#player-panel')
        panel.classList.add('hiding')

        panel.dispatchEvent(new Event('focusin', { bubbles: true }))

        expect(panel.classList.contains('show')).toBe(true)
        expect(panel.classList.contains('hiding')).toBe(false)
    })

    it('focusout on #player-panel adds "hiding"', () => {
        const panel = document.querySelector('#player-panel')

        panel.dispatchEvent(new Event('focusout', { bubbles: true }))

        expect(panel.classList.contains('hiding')).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — resource panel open/close
// ---------------------------------------------------------------------------
describe('setupSidePanels — resource panel', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        setupSidePanels()
    })

    it('clicking #open-resource-panel adds "show" and removes "hiding" on #resource-panel', () => {
        const panel = document.querySelector('#resource-panel')
        panel.classList.add('hiding')

        document.querySelector('#open-resource-panel').click()

        expect(panel.classList.contains('show')).toBe(true)
        expect(panel.classList.contains('hiding')).toBe(false)
        expect(document.activeElement).toBe(panel)
    })

    it('focusin on #resource-panel adds "show" and removes "hiding"', () => {
        const panel = document.querySelector('#resource-panel')
        panel.classList.add('hiding')

        panel.dispatchEvent(new Event('focusin', { bubbles: true }))

        expect(panel.classList.contains('show')).toBe(true)
        expect(panel.classList.contains('hiding')).toBe(false)
    })

    it('focusout on #resource-panel adds "hiding"', () => {
        const panel = document.querySelector('#resource-panel')

        panel.dispatchEvent(new Event('focusout', { bubbles: true }))

        expect(panel.classList.contains('hiding')).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — mousemove trigger
// ---------------------------------------------------------------------------
describe('setupSidePanels — mousemove trigger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        setupSidePanels()
    })

    it('mousemove with clientX === 0 adds "show" to #resource-panel', () => {
        const container = document.querySelector('.flex-container').parentElement
        const resourcePanel = document.querySelector('#resource-panel')

        container.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, bubbles: true }))

        expect(resourcePanel.classList.contains('show')).toBe(true)
    })

    it('mousemove with clientX === window.screen.width - 1 adds "show" to #player-panel', () => {
        const container = document.querySelector('.flex-container').parentElement
        const playerPanel = document.querySelector('#player-panel')

        container.dispatchEvent(new MouseEvent('mousemove', { clientX: window.screen.width - 1, bubbles: true }))

        expect(playerPanel.classList.contains('show')).toBe(true)
    })
})

// ---------------------------------------------------------------------------
// setupSidePanels — load-deck-button
// ---------------------------------------------------------------------------
describe('setupSidePanels — load-deck-button', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        buildFullDOM()
        setupSidePanels()
    })

    it('calls setupCorp (not setupRunner) when playerSide is "corp"', () => {
        window.playerSide = 'corp'
        document.querySelector('#load-deck-button').click()
        expect(setupCorp).toHaveBeenCalled()
        expect(setupRunner).not.toHaveBeenCalled()
    })

    it('calls setupRunner (not setupCorp) when playerSide is "runner"', () => {
        window.playerSide = 'runner'
        document.querySelector('#load-deck-button').click()
        expect(setupRunner).toHaveBeenCalled()
        expect(setupCorp).not.toHaveBeenCalled()
    })

    it('removes #corp-deck and [data-side="corp"] cards from #card-layer when playerSide is "corp"', () => {
        const cardLayer = document.querySelector('#card-layer')
        const corpDeck = document.createElement('div')
        corpDeck.id = 'corp-deck'
        const corpCard1 = document.createElement('div')
        corpCard1.classList.add('game-card')
        corpCard1.dataset.side = 'corp'
        const corpCard2 = document.createElement('div')
        corpCard2.classList.add('game-card')
        corpCard2.dataset.side = 'corp'
        cardLayer.append(corpDeck, corpCard1, corpCard2)

        window.playerSide = 'corp'
        document.querySelector('#load-deck-button').click()

        expect(document.querySelector('#card-layer>#corp-deck')).toBeNull()
        expect(document.querySelectorAll('#card-layer>.game-card[data-side="corp"]').length).toBe(0)
    })

    it('removes #runner-deck and [data-side="runner"] cards from #card-layer when playerSide is "runner"', () => {
        const cardLayer = document.querySelector('#card-layer')
        const runnerDeck = document.createElement('div')
        runnerDeck.id = 'runner-deck'
        const runnerCard1 = document.createElement('div')
        runnerCard1.classList.add('game-card')
        runnerCard1.dataset.side = 'runner'
        const runnerCard2 = document.createElement('div')
        runnerCard2.classList.add('game-card')
        runnerCard2.dataset.side = 'runner'
        cardLayer.append(runnerDeck, runnerCard1, runnerCard2)

        window.playerSide = 'runner'
        document.querySelector('#load-deck-button').click()

        expect(document.querySelector('#card-layer>#runner-deck')).toBeNull()
        expect(document.querySelectorAll('#card-layer>.game-card[data-side="runner"]').length).toBe(0)
    })
})
