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
        expect(result.matched).toHaveLength(3)
        expect(result.matched.every(c => c.title === 'Hedge Fund')).toBe(true)
    })

    it('parses a valid entry without x suffix', () => {
        const result = parseDeckList('3 Hedge Fund', allCards)
        expect(result.matched).toHaveLength(3)
        expect(result.matched.every(c => c.title === 'Hedge Fund')).toBe(true)
    })

    it('skips blank lines interspersed in the list', () => {
        const result = parseDeckList('2x Hedge Fund\n\n1x Sure Gamble', allCards)
        expect(result.matched).toHaveLength(3)
    })

    it('returns an empty matched array for an entirely empty string', () => {
        const result = parseDeckList('', allCards)
        expect(result.matched).toHaveLength(0)
        expect(result.failed).toHaveLength(0)
    })

    it('excludes entries where the card name is not in allCards', () => {
        const result = parseDeckList('2x Unknown Card', allCards)
        expect(result.matched).toHaveLength(0)
    })

    it('returns only recognized cards from a mixed list', () => {
        const result = parseDeckList('2x Hedge Fund\n1x Unknown Card\n3x Ice Wall', allCards)
        expect(result.matched).toHaveLength(5)
        expect(result.matched.every(c => c !== undefined)).toBe(true)
        expect(result.matched.filter(c => c.title === 'Hedge Fund')).toHaveLength(2)
        expect(result.matched.filter(c => c.title === 'Ice Wall')).toHaveLength(3)
    })

    it('populates failed with unrecognized card names from a mixed list', () => {
        const result = parseDeckList('2x Hedge Fund\n1x Ghost Runner\n3x Ice Wall\n2x Sneakdoor Beta', allCards)
        expect(result.matched).toHaveLength(5)
        expect(result.failed).toHaveLength(2)
        expect(result.failed).toContain('Ghost Runner')
        expect(result.failed).toContain('Sneakdoor Beta')
    })

    it('deduplicates failed names when the same unrecognized card appears multiple times', () => {
        const result = parseDeckList('3x Unknown Card', allCards)
        expect(result.matched).toHaveLength(0)
        expect(result.failed).toHaveLength(1)
        expect(result.failed[0]).toBe('Unknown Card')
    })
})
