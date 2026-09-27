declare module 'lunar-javascript' {
  type EightChar = {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
  }

  type Lunar = {
    getEightChar(): EightChar
  }

  type SolarDate = {
    getLunar(): Lunar
  }

  export const Solar: {
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarDate
  }
}
