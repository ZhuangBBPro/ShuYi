import { describe, expect, it } from 'vitest'
import { formatCastTime } from './date'

describe('formatCastTime', () => {
  it('formats the casting time with its Chinese lunar date', () => {
    const result = formatCastTime(new Date(2026, 8, 22, 11, 33))
    expect(result).toEqual({
      solarDate: '2026年9月22日',
      lunarDate: '八月十二',
      clockTime: '11:33',
    })
  })
})
