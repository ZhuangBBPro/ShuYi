import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  calculateHexagram,
  calculateSpaceTime,
  getEarthlyBranch,
} from './lib/divination'
import { formatCastTime, getGanZhiPillars } from './lib/date'

declare global {
  interface Document {
    readonly modelContext?: {
      registerTool: (tool: {
        name: string
        title: string
        description: string
        inputSchema: object
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
        execute: (input: unknown) => Promise<unknown>
      }, options?: { signal?: AbortSignal }) => void | Promise<void>
    }
  }
}

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const FIVE_ELEMENT_CHARACTERS: Record<string, string> = {
  '甲': 'wood', '乙': 'wood', '寅': 'wood', '卯': 'wood',
  '丙': 'fire', '丁': 'fire', '巳': 'fire', '午': 'fire',
  '戊': 'earth', '己': 'earth', '辰': 'earth', '戌': 'earth', '丑': 'earth', '未': 'earth',
  '庚': 'metal', '辛': 'metal', '申': 'metal', '酉': 'metal',
  '壬': 'water', '癸': 'water', '亥': 'water', '子': 'water',
}

function ganZhiElementClass(character: string) {
  return `element-${FIVE_ELEMENT_CHARACTERS[character] ?? 'neutral'}`
}

function CompactLine({ yang, active = false, lineNumber }: { yang: boolean; active?: boolean; lineNumber: number }) {
  return (
    <div className={`compact-line${active ? ' is-moving' : ''}`} aria-label={`第${lineNumber}爻，${yang ? '阳爻' : '阴爻'}${active ? '，动爻' : ''}`}>
      <span className={`compact-mark ${yang ? 'yang' : 'yin'}`} aria-hidden="true">
        <i />
        {!yang && <i />}
      </span>
      {active && <b aria-hidden="true">×</b>}
    </div>
  )
}

function CompactHexagram({
  tag,
  descriptor,
  name,
  lines,
  tone,
  movingLine,
}: {
  tag: string
  descriptor: string
  name: string
  lines: readonly boolean[]
  tone: 'original' | 'space-one' | 'space-two' | 'changed'
  movingLine?: number
}) {
  return (
    <article className={`compact-hexagram tone-${tone}`} aria-label={`${tag}，${name}`}>
      <div className="compact-title">
        <span>[ {tag} ]</span>
        <small>「{descriptor}」</small>
      </div>
      <div className={`compact-lines${lines.length === 3 ? ' is-trigram' : ''}`}>
        {[...lines].map((line, index) => ({ line, lineNumber: index + 1 })).reverse().map(({ line, lineNumber }) => (
          <CompactLine key={lineNumber} yang={line} lineNumber={lineNumber} active={movingLine === lineNumber} />
        ))}
      </div>
      <h3>{name}</h3>
    </article>
  )
}

export default function App() {
  const [firstNumber, setFirstNumber] = useState('18')
  const [secondNumber, setSecondNumber] = useState('27')
  const [withTime, setWithTime] = useState(true)
  const [castTime, setCastTime] = useState(() => new Date())
  const [clock, setClock] = useState(() => new Date())
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return

    const lifecycle = new AbortController()
    const register = context.registerTool({
      name: 'cast_divination',
      title: '起卦',
      description: '输入两个整数，可选当下时辰，计算并更新页面上的本卦、动爻与变卦。',
      inputSchema: {
        type: 'object',
        properties: {
          firstNumber: { type: 'integer', description: '定上卦的第一数' },
          secondNumber: { type: 'integer', description: '定下卦的第二数' },
          withTime: { type: 'boolean', description: '是否让当前地支序数参与动爻计算' },
        },
        required: ['firstNumber', 'secondNumber', 'withTime'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const data = input as Record<string, unknown>
        if (!Number.isInteger(data.firstNumber) || !Number.isInteger(data.secondNumber) || typeof data.withTime !== 'boolean') {
          throw new Error('第一数、第二数必须为整数，withTime 必须为布尔值。')
        }

        const now = new Date()
        const branch = getEarthlyBranch(now)
        const nextResult = calculateHexagram(data.firstNumber as number, data.secondNumber as number, data.withTime, branch.number)
        setFirstNumber(String(data.firstNumber))
        setSecondNumber(String(data.secondNumber))
        setWithTime(data.withTime)
        setCastTime(now)
        setError('')

        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        return {
          upper: nextResult.upper.name,
          lower: nextResult.lower.name,
          changedUpper: nextResult.changedUpper.name,
          changedLower: nextResult.changedLower.name,
          movingLine: nextResult.movingLine,
          branch: branch.name,
          withTime: data.withTime,
        }
      },
    }, { signal: lifecycle.signal })

    Promise.resolve(register).catch(() => undefined)
    return () => lifecycle.abort()
  }, [])

  const values = useMemo(() => {
    const first = Number(firstNumber)
    const second = Number(secondNumber)
    if (!Number.isFinite(first) || !Number.isFinite(second) || firstNumber.trim() === '' || secondNumber.trim() === '') return null
    return { first: Math.trunc(first), second: Math.trunc(second) }
  }, [firstNumber, secondNumber])

  const currentBranch = getEarthlyBranch(clock)
  const resultBranch = getEarthlyBranch(castTime)
  const result = values ? calculateHexagram(values.first, values.second, withTime, resultBranch.number) : null
  const spaceTime = calculateSpaceTime(resultBranch)
  const castTimeParts = formatCastTime(castTime)
  const ganZhiPillars = getGanZhiPillars(castTime)

  const cast = (event?: FormEvent) => {
    event?.preventDefault()
    if (!values) {
      setError('请输入两个有效整数。')
      return
    }
    setError('')
    setCastTime(new Date())
  }

  const toggleTime = () => {
    setWithTime((enabled) => !enabled)
    setCastTime(new Date())
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="数占易术首页">
          <span className="brand-seal" aria-hidden="true">易</span>
          <span>
            <b>数占易术</b>
            <small>SHU ZHAN YI SHU</small>
          </span>
        </a>
        <div className="live-time" aria-live="polite">
          <span className="pulse" />
          {dateTimeFormatter.format(clock)}
        </div>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">以数观象 · 以时定变</p>
        <h1>两数成卦，一爻见变</h1>
        <p>输入两个整数，结合当下时辰，即时排出本卦、动爻与变卦。</p>
      </section>

      <div className="workspace">
        <aside className="control-panel">
          <div className="panel-number" aria-hidden="true">01</div>
          <div className="panel-title">
            <p className="section-kicker">起卦</p>
            <h2>输入两数</h2>
          </div>

          <form onSubmit={cast} noValidate>
            <div className="number-fields">
              <label>
                <span>第一数 <small>定上卦</small></span>
                <input
                  inputMode="numeric"
                  type="number"
                  step="1"
                  value={firstNumber}
                  onChange={(event) => setFirstNumber(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </label>
              <label>
                <span>第二数 <small>定下卦</small></span>
                <input
                  inputMode="numeric"
                  type="number"
                  step="1"
                  value={secondNumber}
                  onChange={(event) => setSecondNumber(event.target.value)}
                  aria-invalid={Boolean(error)}
                />
              </label>
            </div>

            <button className={`time-toggle${withTime ? ' enabled' : ''}`} type="button" role="switch" aria-checked={withTime} onClick={toggleTime}>
              <span className="toggle-track"><i /></span>
              <span>
                <b>添加时辰</b>
                <small>当前地支序数参与动爻计算</small>
              </span>
            </button>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="cast-button" type="submit">
              <span>起卦</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="time-panel">
            <p className="section-kicker">此刻</p>
            <div className="branch-display">
              <span className="branch-character">{currentBranch.name}</span>
              <div>
                <b>{currentBranch.name}时</b>
                <span>{currentBranch.time}</span>
              </div>
              <strong>{String(currentBranch.number).padStart(2, '0')}</strong>
            </div>
            <div className="time-meta">
              <span>本地时间</span>
              <b>{dateTimeFormatter.format(clock)}</b>
            </div>
          </div>
        </aside>

        <section className="results" aria-live="polite">
          <div className="results-heading">
            <div>
              <p className="section-kicker">卦象</p>
              <h2>本卦与变卦</h2>
            </div>
            {result && (
              <div className="formula-chip">
                <span>动爻推演</span>
                <b>{values?.first} + {values?.second}{withTime ? ` + ${resultBranch.number}` : ''} = {result.movingRaw} → {result.movingLine}</b>
              </div>
            )}
          </div>
          <div className="cast-time-banner">
            <span className="section-kicker">起卦时间</span>
            <time dateTime={castTime.toISOString()}>
              <span>{castTimeParts.solarDate}</span>
              <span>({castTimeParts.lunarDate}){castTimeParts.clockTime}</span>
            </time>
            <div className="gan-zhi-grid" aria-label="起卦时间四柱干支">
              {ganZhiPillars.map((pillar) => (
                <div className="gan-zhi-pillar" key={pillar.label} aria-label={`${pillar.label}${pillar.value}`}>
                  <div className="gan-zhi-characters" aria-hidden="true">
                    <b className={ganZhiElementClass(pillar.stem)}>{pillar.stem}</b>
                    <b className={ganZhiElementClass(pillar.branch)}>{pillar.branch}</b>
                  </div>
                  <span>{pillar.label}</span>
                </div>
              ))}
            </div>
          </div>

          {result ? (
            <div className="compact-divination">
              <CompactHexagram
                tag="主"
                descriptor={`${result.upper.name}上·${result.lower.name}下`}
                name={result.name}
                lines={result.originalLines}
                movingLine={result.movingLine}
                tone="original"
              />
              <CompactHexagram
                tag="时空"
                descriptor={`一·${spaceTime.folded.name}卦`}
                name={`${spaceTime.folded.name}卦`}
                lines={spaceTime.folded.lines}
                tone="space-one"
              />
              <CompactHexagram
                tag="时空"
                descriptor={`二·${spaceTime.direct.name}卦`}
                name={`${spaceTime.direct.name}卦`}
                lines={spaceTime.direct.lines}
                tone="space-two"
              />
              <CompactHexagram
                tag="变"
                descriptor={`${result.changedUpper.name}上·${result.changedLower.name}下`}
                name={result.changedName}
                lines={result.changedLines}
                tone="changed"
              />
            </div>
          ) : (
            <div className="empty-state">输入两个有效整数后即可起卦。</div>
          )}
        </section>
      </div>

      <section className="rules-section">
        <details>
          <summary>
            <span><b>规则说明</b><small>了解折八、动爻与时空卦的计算方式</small></span>
            <span className="summary-plus" aria-hidden="true">+</span>
          </summary>
          <div className="rules-content">
            <div><span>01</span><p><b>定上下卦</b>两数分别除以 8 取余，余 0 按 8 计。第一数定上卦，第二数定下卦。</p></div>
            <div><span>02</span><p><b>定动爻</b>两数相加；若启用时辰，再加地支序数。总数除以 6 取余，余 0 按第 6 爻计。</p></div>
            <div><span>03</span><p><b>成变卦</b>自下而上数动爻，只翻转该爻的阴阳，其余五爻保持不变。</p></div>
          </div>
        </details>
      </section>

      <footer>
        <span>数占易术</span>
        <p>所有结果仅在浏览器本地计算，不会上传或保存。</p>
      </footer>
    </main>
  )
}
