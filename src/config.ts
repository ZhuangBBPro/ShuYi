export type Trigram = {
  number: number
  name: string
  symbol: string
  lines: readonly [boolean, boolean, boolean]
}

export type EarthlyBranch = {
  name: string
  number: number
  time: string
  directTrigramNumber: number
}

// 三爻数组从下向上：true 为阳爻，false 为阴爻。
export const TRIGRAMS: Record<number, Trigram> = {
  1: { number: 1, name: '乾', symbol: '☰', lines: [true, true, true] },
  2: { number: 2, name: '兑', symbol: '☱', lines: [true, true, false] },
  3: { number: 3, name: '离', symbol: '☲', lines: [true, false, true] },
  4: { number: 4, name: '震', symbol: '☳', lines: [true, false, false] },
  5: { number: 5, name: '巽', symbol: '☴', lines: [false, true, true] },
  6: { number: 6, name: '坎', symbol: '☵', lines: [false, true, false] },
  7: { number: 7, name: '艮', symbol: '☶', lines: [false, false, true] },
  8: { number: 8, name: '坤', symbol: '☷', lines: [false, false, false] },
}

// TODO(待确认规则2)：地支直接对应八卦是否最终采用此表。
export const EARTHLY_BRANCHES: readonly EarthlyBranch[] = [
  { name: '子', number: 1, time: '23:00–00:59', directTrigramNumber: 6 },
  { name: '丑', number: 2, time: '01:00–02:59', directTrigramNumber: 7 },
  { name: '寅', number: 3, time: '03:00–04:59', directTrigramNumber: 7 },
  { name: '卯', number: 4, time: '05:00–06:59', directTrigramNumber: 4 },
  { name: '辰', number: 5, time: '07:00–08:59', directTrigramNumber: 5 },
  { name: '巳', number: 6, time: '09:00–10:59', directTrigramNumber: 5 },
  { name: '午', number: 7, time: '11:00–12:59', directTrigramNumber: 3 },
  { name: '未', number: 8, time: '13:00–14:59', directTrigramNumber: 8 },
  { name: '申', number: 9, time: '15:00–16:59', directTrigramNumber: 8 },
  { name: '酉', number: 10, time: '17:00–18:59', directTrigramNumber: 2 },
  { name: '戌', number: 11, time: '19:00–20:59', directTrigramNumber: 1 },
  { name: '亥', number: 12, time: '21:00–22:59', directTrigramNumber: 1 },
]

export const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'] as const
