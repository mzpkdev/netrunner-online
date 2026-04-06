import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shuffle, snapToGrid, isPointWithinElement, throttle } from './utils.js'

// ---------------------------------------------------------------------------
// shuffle
// ---------------------------------------------------------------------------
describe('shuffle', () => {
  it('preserves all input elements', () => {
    const input = [1, 2, 3, 4, 5]
    const copy = [...input]
    shuffle(input)
    expect([...input].sort((a, b) => a - b)).toEqual(copy.sort((a, b) => a - b))
  })

  it('preserves input length', () => {
    const input = [1, 2, 3, 4, 5]
    shuffle(input)
    expect(input.length).toBe(5)
  })

  it('handles an empty array without throwing', () => {
    const input = []
    expect(() => shuffle(input)).not.toThrow()
    expect(input).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// snapToGrid
// ---------------------------------------------------------------------------
describe('snapToGrid', () => {
  const makeElement = (x, y) => ({
    getBoundingClientRect: () => ({ x, y }),
    style: {}
  })

  it('leaves values that already sit on a grid line unchanged', () => {
    const el = makeElement(25, 50)
    snapToGrid(el)
    expect(el.style.left).toBe('25px')
    expect(el.style.top).toBe('50px')
  })

  it('rounds up when the value is above the midpoint', () => {
    // 13 / 25 = 0.52 → rounds to 1 → 25
    const el = makeElement(13, 13)
    snapToGrid(el)
    expect(el.style.left).toBe('25px')
    expect(el.style.top).toBe('25px')
  })

  it('rounds down when the value is below the midpoint', () => {
    // 12 / 25 = 0.48 → rounds to 0 → 0
    const el = makeElement(12, 12)
    snapToGrid(el)
    expect(el.style.left).toBe('0px')
    expect(el.style.top).toBe('0px')
  })

  it('respects a custom grid size', () => {
    // 40 / 20 = 2 exactly → 40; 80 / 20 = 4 exactly → 80
    const el = makeElement(40, 80)
    snapToGrid(el, 20)
    expect(el.style.left).toBe('40px')
    expect(el.style.top).toBe('80px')
  })
})

// ---------------------------------------------------------------------------
// isPointWithinElement
// ---------------------------------------------------------------------------
describe('isPointWithinElement', () => {
  const makeElement = (left, top, right, bottom) => ({
    getBoundingClientRect: () => ({ left, top, right, bottom })
  })

  const el = makeElement(10, 20, 110, 120)

  it('returns true for a point strictly inside the bounds', () => {
    expect(isPointWithinElement(50, 70, el)).toBe(true)
  })

  it('returns false for a point to the left of the element', () => {
    expect(isPointWithinElement(5, 70, el)).toBe(false)
  })

  it('returns false for a point above the element', () => {
    expect(isPointWithinElement(50, 10, el)).toBe(false)
  })

  it('returns false for a point to the right of the element', () => {
    expect(isPointWithinElement(120, 70, el)).toBe(false)
  })

  it('returns false for a point below the element', () => {
    expect(isPointWithinElement(50, 130, el)).toBe(false)
  })

  it('returns true on the left boundary (inclusive)', () => {
    expect(isPointWithinElement(10, 70, el)).toBe(true)
  })

  it('returns true on the right boundary (inclusive)', () => {
    expect(isPointWithinElement(110, 70, el)).toBe(true)
  })

  it('returns true on the top boundary (inclusive)', () => {
    expect(isPointWithinElement(50, 20, el)).toBe(true)
  })

  it('returns true on the bottom boundary (inclusive)', () => {
    expect(isPointWithinElement(50, 120, el)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// throttle
// ---------------------------------------------------------------------------
describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set a concrete start time so Date.now() >> 0, ensuring the leading
    // call fires immediately (throttle checks `wait - (now - previous)` where
    // previous starts at 0).
    vi.setSystemTime(1_000_000)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls the function immediately on the first invocation (leading call)', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not call the function again before the wait interval elapses', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    throttled()
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('calls the function again once the wait interval has fully elapsed', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(100)
    throttled()
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('cancel() prevents any pending trailing call from firing', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 100)
    throttled()   // leading call fires
    throttled()   // schedules a trailing call
    throttled.cancel()
    vi.advanceTimersByTime(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})