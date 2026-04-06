import { describe, it, expect, vi } from 'vitest'
import { parseDeckList } from './deck.js'

vi.mock('./p2p.js', () => ({ sendCreateMessage: vi.fn() }))
vi.mock('./card.js', () => ({ createCard: vi.fn(), snapOutOfHandArea: vi.fn() }))
vi.mock('./grab.js', () => ({ grabCard: vi.fn() }))

const allCards = [
    { title: 'Hedge Fund' },
    { title: 'Sure Gamble' },
    { title: 'Ice Wall' },
]

// ---------------------------------------------------------------------------
// parseDeckList
// ---------------------------------------------------------------------------
describe('parseDeckList', () => {
    it('parses a valid multi-card entry with x suffix', () => {
        const result = parseDeckList('3x Hedge Fund', allCards)
        expect(result).toHaveLength(3)
        expect(result.every(c => c.title === 'Hedge Fund')).toBe(true)
    })

    it('parses a valid entry without x suffix', () => {
        const result = parseDeckList('3 Hedge Fund', allCards)
        expect(result).toHaveLength(3)
        expect(result.every(c => c.title === 'Hedge Fund')).toBe(true)
    })

    it('skips blank lines interspersed in the list', () => {
        const result = parseDeckList('2x Hedge Fund\n\n1x Sure Gamble', allCards)
        expect(result).toHaveLength(3)
    })

    it('returns an empty array for an entirely empty string', () => {
        const result = parseDeckList('', allCards)
        expect(result).toHaveLength(0)
    })
})
