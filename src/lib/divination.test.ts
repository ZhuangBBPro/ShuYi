import { describe, expect, it } from 'vitest'
import {
  calculateHexagram,
  calculateSpaceTime,
  getEarthlyBranch,
  getMovingLine,
  spaceTimeNumber,
  toBaguaNumber,
} from './divination'
import { EARTHLY_BRANCHES } from '../config'

describe('toBaguaNumber', () => {
  it('maps a zero remainder to 8', () => {
    expect(toBaguaNumber(0)).toBe(8)
    expect(toBaguaNumber(16)).toBe(8)
  })

  it('keeps negative values inside 1–8', () => {
    expect(toBaguaNumber(-1)).toBe(7)
    expect(toBaguaNumber(-8)).toBe(8)
  })
})

describe('moving line', () => {
  it('maps a zero remainder to line 6', () => {
    expect(getMovingLine(12)).toBe(6)
  })

  it('adds the resolved trigram numbers and the branch when requested', () => {
    const result = calculateHexagram(6, 40, true, 9)
    expect(result.upper.number).toBe(6)
    expect(result.lower.number).toBe(8)
    expect(result.movingRaw).toBe(23)
    expect(result.movingLine).toBe(5)
    expect(result.changedLines.filter((line, index) => line !== result.originalLines[index])).toHaveLength(1)
  })

  it('omits the branch when time participation is disabled', () => {
    const result = calculateHexagram(6, 40, false, 9)
    expect(result.movingRaw).toBe(14)
    expect(result.movingLine).toBe(2)
  })

  it('resolves the changed upper and lower trigrams from the flipped lines', () => {
    const result = calculateHexagram(1, 2, false, 3)
    expect(result.upper.name).toBe('乾')
    expect(result.lower.name).toBe('兑')
    expect(result.changedUpper.name).toBe('乾')
    expect(result.changedLower.name).toBe('乾')
    expect(result.name).toBe('天泽履')
    expect(result.changedName).toBe('乾为天')
  })

  it('returns the standard names for the default original and changed hexagrams', () => {
    const result = calculateHexagram(18, 27, false, 7)
    expect(result.name).toBe('泽火革')
    expect(result.changedName).toBe('雷火丰')
  })
})

describe('earthly branches', () => {
  it('covers Zi hour across midnight', () => {
    expect(getEarthlyBranch(new Date(2026, 0, 1, 23, 30)).name).toBe('子')
    expect(getEarthlyBranch(new Date(2026, 0, 2, 0, 30)).name).toBe('子')
    expect(getEarthlyBranch(new Date(2026, 0, 2, 1, 0)).name).toBe('丑')
  })

  it('folds branch numbers 9–12 back into 1–4', () => {
    expect([9, 10, 11, 12].map(spaceTimeNumber)).toEqual([1, 2, 3, 4])
  })

  it('uses the configured direct mapping', () => {
    const monkey = calculateSpaceTime(EARTHLY_BRANCHES[8])
    expect(monkey.folded.name).toBe('乾')
    expect(monkey.direct.name).toBe('坤')
  })
})
