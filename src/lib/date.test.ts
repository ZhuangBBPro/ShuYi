import { describe, expect, it } from 'vitest'
import { formatCastTime, getGanZhiPillars, parseDateTimeLocalValue, toDateTimeLocalValue } from './date'

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

describe('datetime-local helpers', () => {
  it('round-trips a local time to the minute', () => {
    const date = new Date(2026, 9, 13, 22, 59, 41)
    expect(toDateTimeLocalValue(date)).toBe('2026-10-13T22:59')
    expect(parseDateTimeLocalValue('2026-10-13T22:59')).toEqual(new Date(2026, 9, 13, 22, 59))
  })

  it('rejects empty or malformed input', () => {
    expect(parseDateTimeLocalValue('')).toBeNull()
    expect(parseDateTimeLocalValue('22:59')).toBeNull()
  })
})
