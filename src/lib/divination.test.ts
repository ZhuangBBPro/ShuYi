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

  it('includes the branch only when requested and flips one line', () => {
    const withoutTime = calculateHexagram(1, 2, false, 3)
    const withTime = calculateHexagram(1, 2, true, 3)
    expect(withoutTime.movingLine).toBe(3)
    expect(withTime.movingLine).toBe(6)
    expect(withTime.changedLines.filter((line, index) => line !== withTime.originalLines[index])).toHaveLength(1)
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
