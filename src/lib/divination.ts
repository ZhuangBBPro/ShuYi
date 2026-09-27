import { EARTHLY_BRANCHES, TRIGRAMS, type EarthlyBranch, type Trigram } from '../config'

export type HexagramResult = {
  upper: Trigram
  lower: Trigram
  changedUpper: Trigram
  changedLower: Trigram
  name: string
  changedName: string
  originalLines: boolean[]
  changedLines: boolean[]
  movingLine: number
  movingRaw: number
}

const HEXAGRAM_NAMES: Record<number, readonly string[]> = {
  1: ['乾为天', '天泽履', '天火同人', '天雷无妄', '天风姤', '天水讼', '天山遁', '天地否'],
  2: ['泽天夬', '兑为泽', '泽火革', '泽雷随', '泽风大过', '泽水困', '泽山咸', '泽地萃'],
  3: ['火天大有', '火泽睽', '离为火', '火雷噬嗑', '火风鼎', '火水未济', '火山旅', '火地晋'],
  4: ['雷天大壮', '雷泽归妹', '雷火丰', '震为雷', '雷风恒', '雷水解', '雷山小过', '雷地豫'],
  5: ['风天小畜', '风泽中孚', '风火家人', '风雷益', '巽为风', '风水涣', '风山渐', '风地观'],
  6: ['水天需', '水泽节', '水火既济', '水雷屯', '水风井', '坎为水', '水山蹇', '水地比'],
  7: ['山天大畜', '山泽损', '山火贲', '山雷颐', '山风蛊', '山水蒙', '艮为山', '山地剥'],
  8: ['地天泰', '地泽临', '地火明夷', '地雷复', '地风升', '地水师', '地山谦', '坤为地'],
}

export function getHexagramName(upper: Trigram, lower: Trigram): string {
  return HEXAGRAM_NAMES[upper.number][lower.number - 1]
}

export type SpaceTimeResult = {
  folded: Trigram
  direct: Trigram
  foldedNumber: number
}

export function toBaguaNumber(value: number): number {
  const remainder = ((Math.trunc(value) % 8) + 8) % 8
  return remainder === 0 ? 8 : remainder
}

// TODO(待确认规则1)：时空卦一暂按 1–8 不变、9–12 减 8。
export function spaceTimeNumber(branchNumber: number): number {
  return branchNumber > 8 ? branchNumber - 8 : branchNumber
}

export function getEarthlyBranch(date: Date): EarthlyBranch {
  const index = Math.floor((date.getHours() + 1) / 2) % 12
  return EARTHLY_BRANCHES[index]
}

export function getMovingLine(raw: number): number {
  const remainder = ((Math.trunc(raw) % 6) + 6) % 6
  return remainder === 0 ? 6 : remainder
}

export function getTrigramByLines(lines: readonly boolean[]): Trigram {
  const trigram = Object.values(TRIGRAMS).find((item) =>
    item.lines.every((line, index) => line === lines[index]),
  )

  if (!trigram) throw new Error('无法识别三爻卦象。')
  return trigram
}

export function calculateHexagram(
  firstNumber: number,
  secondNumber: number,
  withTime: boolean,
  branchNumber: number,
): HexagramResult {
  const first = Math.trunc(firstNumber)
  const second = Math.trunc(secondNumber)
  const upper = TRIGRAMS[toBaguaNumber(first)]
  const lower = TRIGRAMS[toBaguaNumber(second)]

  // TODO(待确认规则3)：添加时辰在 MVP 中只影响动爻。
  const movingRaw = first + second + (withTime ? branchNumber : 0)
  const movingLine = getMovingLine(movingRaw)
  const originalLines = [...lower.lines, ...upper.lines]
  const changedLines = [...originalLines]
  changedLines[movingLine - 1] = !changedLines[movingLine - 1]
  const changedLower = getTrigramByLines(changedLines.slice(0, 3))
  const changedUpper = getTrigramByLines(changedLines.slice(3, 6))

  return {
    upper,
    lower,
    changedUpper,
    changedLower,
    name: getHexagramName(upper, lower),
    changedName: getHexagramName(changedUpper, changedLower),
    originalLines,
    changedLines,
    movingLine,
    movingRaw,
  }
}

export function calculateSpaceTime(branch: EarthlyBranch): SpaceTimeResult {
  const foldedNumber = spaceTimeNumber(branch.number)
  return {
    folded: TRIGRAMS[foldedNumber],
    direct: TRIGRAMS[branch.directTrigramNumber],
    foldedNumber,
  }
}
