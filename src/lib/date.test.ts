import { describe, expect, it } from 'vitest'
import { formatCastTime, getGanZhiPillars } from './date'

describe('formatCastTime', () => {
  it('formats the casting time with its Chinese lunar date', () => {
    const result = formatCastTime(new Date(2026, 8, 22, 11, 33))
    expect(result).toEqual({
      solarDate: '2026年9月22日',
      lunarDate: '八月十二',
      clockTime: '11:33',
    })
  })

  it('calculates the four pillars shown in the reference date', () => {
    const pillars = getGanZhiPillars(new Date(2026, 8, 22, 11, 33))
    expect(pillars.map((pillar) => pillar.value)).toEqual(['丙午', '丁酉', '己亥', '庚午'])
  })
})
