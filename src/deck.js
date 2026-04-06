/**
 * Parses a Netrunner deck list string into an array of card objects.
 * Extracted and hardened to gracefully ignore blank/malformed lines without throwing RangeErrors.
 *
 * Supported formats:
 * - "3 Card Name"
 * - "3x Card Name"
 * - "Card Name" (defaults to quantity 1)
 * - Lines starting with "#" are treated as comments and ignored
 *
 * @param {string} input - The raw deck list string.
 * @returns {Array<{quantity: number, name: string}>} - Parsed deck list.
 */
export function parseDeckList(input) {
  if (typeof input !== 'string') return [];

  return input
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'))
    .map((line) => {
      // Match optional quantity, optional 'x'/'X', whitespace, then the rest as name
      const match = line.match(/^(\d+)\s*[xX]?\s+(.+)$/s);
      if (match) {
        const qty = parseInt(match[1], 10);
        const name = match[2].trim();
        if (Number.isFinite(qty) && qty > 0 && name.length > 0) {
          return { quantity: qty, name };
        }
      }
      // Fallback: treat unrecognised/malformed lines as a single card with qty 1
      // instead of crashing with RangeError on slice/repeat/array operations
      if (line.length > 0) {
        return { quantity: 1, name: line };
      }
      return null;
    })
    .filter(Boolean);
}

// Vitest tests validating the extracted parser and edge-case handling
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('parseDeckList', () => {
    it('parses standard deck list formats correctly', () => {
      const input = '3 Akamatsu Mem Chip\n2x Daily Business Show\n1 Personal Workshop';
      expect(parseDeckList(input)).toEqual([
        { quantity: 3, name: 'Akamatsu Mem Chip' },
        { quantity: 2, name: 'Daily Business Show' },
        { quantity: 1, name: 'Personal Workshop' }
      ]);
    });

    it('safely ignores blank lines and whitespace-only lines', () => {
      const input = '\n  \n3 Valid Card\n\n   \n';
      expect(parseDeckList(input)).toEqual([{ quantity: 3, name: 'Valid Card' }]);
    });

    it('does not throw RangeError on malformed or truncated lines', () => {
      // Previously caused RangeError due to unsafe string/array slicing on empty matches
      const input = 'bad line\n\n3x \n  x Card\n---\n';
      expect(() => parseDeckList(input)).not.toThrow();
      const result = parseDeckList(input);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles non-string input gracefully', () => {
      expect(parseDeckList(null)).toEqual([]);
      expect(parseDeckList(undefined)).toEqual([]);
      expect(parseDeckList(123)).toEqual([]);
    });

    it('ignores comment lines', () => {
      const input = '# Identity: Jinteki: Personal Evolution\n3 Akamatsu Mem Chip';
      expect(parseDeckList(input)).toEqual([{ quantity: 3, name: 'Akamatsu Mem Chip' }]);
    });
  });
}
