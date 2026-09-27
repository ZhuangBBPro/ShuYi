import { Solar } from 'lunar-javascript'

const LUNAR_DAY_NAMES = [
  '',
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
] as const

const lunarFormatter = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
  month: 'long',
  day: 'numeric',
})

export type CastTimeParts = {
  solarDate: string
  lunarDate: string
  clockTime: string
}

export type GanZhiPillar = {
  label: '年柱' | '月柱' | '日柱' | '时柱'
  value: string
  stem: string
  branch: string
}

export function formatCastTime(date: Date): CastTimeParts {
  const lunarParts = lunarFormatter.formatToParts(date)
  const lunarMonth = lunarParts.find((part) => part.type === 'month')?.value ?? ''
  const lunarDayNumber = Number(lunarParts.find((part) => part.type === 'day')?.value)
  const lunarDay = LUNAR_DAY_NAMES[lunarDayNumber] ?? String(lunarDayNumber)

  return {
    solarDate: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
    lunarDate: `${lunarMonth}${lunarDay}`,
    clockTime: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`,
  }
}

export function getGanZhiPillars(date: Date): GanZhiPillar[] {
  const eightChar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ).getLunar().getEightChar()

  return [
    ['年柱', eightChar.getYear()],
    ['月柱', eightChar.getMonth()],
    ['日柱', eightChar.getDay()],
    ['时柱', eightChar.getTime()],
  ].map(([label, value]) => ({
    label: label as GanZhiPillar['label'],
    value,
    stem: value.slice(0, 1),
    branch: value.slice(1, 2),
  }))
}
