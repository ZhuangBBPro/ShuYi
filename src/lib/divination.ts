import { EARTHLY_BRANCHES, TRIGRAMS, type EarthlyBranch, type Trigram } from '../config'

export type HexagramResult = {
  upper: Trigram
  lower: Trigram
  originalLines: boolean[]
  changedLines: boolean[]
  movingLine: number
  movingRaw: number
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

  return { upper, lower, originalLines, changedLines, movingLine, movingRaw }
}

export function calculateSpaceTime(branch: EarthlyBranch): SpaceTimeResult {
  const foldedNumber = spaceTimeNumber(branch.number)
  return {
    folded: TRIGRAMS[foldedNumber],
    direct: TRIGRAMS[branch.directTrigramNumber],
    foldedNumber,
  }
}
