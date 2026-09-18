import { FormEvent, useEffect, useMemo, useState } from 'react'
import { LINE_NAMES, type Trigram } from './config'
import {
  calculateHexagram,
  calculateSpaceTime,
  getEarthlyBranch,
  type HexagramResult,
} from './lib/divination'

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

function YangYinLine({ yang, active = false, label }: { yang: boolean; active?: boolean; label: string }) {
  return (
    <div className={`yao-row${active ? ' is-moving' : ''}`} aria-label={`${label}，${yang ? '阳爻' : '阴爻'}${active ? '，动爻' : ''}`}>
      <span className={`yao-mark ${yang ? 'yang' : 'yin'}`} aria-hidden="true">
        <i />
        {!yang && <i />}
      </span>
      <span className="yao-label">{label}{active ? ' · 动' : ''}</span>
    </div>
  )
}

function HexagramFigure({ lines, movingLine, changed = false }: { lines: boolean[]; movingLine?: number; changed?: boolean }) {
  return (
    <div className="hexagram-figure">
      {[...lines].map((line, index) => ({ line, lineNumber: index + 1 })).reverse().map(({ line, lineNumber }) => (
        <YangYinLine
          key={lineNumber}
          yang={line}
          active={!changed && movingLine === lineNumber}
          label={LINE_NAMES[lineNumber - 1]}
        />
      ))}
    </div>
  )
}

function TrigramFigure({ trigram }: { trigram: Trigram }) {
  return (
    <div className="trigram-figure" aria-label={`${trigram.name}卦三爻`}>
      {[...trigram.lines].reverse().map((line, index) => (
        <YangYinLine key={index} yang={line} label="" />
      ))}
    </div>
  )
}

function HexagramCard({ title, result, changed = false }: { title: string; result: HexagramResult; changed?: boolean }) {
  const lines = changed ? result.changedLines : result.originalLines
  return (
    <article className={`result-card${changed ? ' changed-card' : ''}`}>
      <div className="card-heading">
        <div>
          <p className="section-kicker">{title}</p>
          <h2>{result.upper.name}上 · {result.lower.name}下</h2>
        </div>
        <span className="double-symbol" aria-hidden="true">{result.upper.symbol}{result.lower.symbol}</span>
      </div>
      <HexagramFigure lines={lines} movingLine={result.movingLine} changed={changed} />
      <p className="card-note">
        {changed
          ? `${LINE_NAMES[result.movingLine - 1]}阴阳翻转，其余五爻不变`
          : `${LINE_NAMES[result.movingLine - 1]}为动爻 · 下卦 ${result.lower.symbol}${result.lower.name} · 上卦 ${result.upper.symbol}${result.upper.name}`}
      </p>
    </article>
  )
}

function SpaceTimeCard({ index, trigram, formula }: { index: string; trigram: Trigram; formula: string }) {
  return (
    <article className="space-card">
      <div className="space-index">{index}</div>
      <div className="space-copy">
        <p className="section-kicker">时空卦{index}</p>
        <h3><span aria-hidden="true">{trigram.symbol}</span> {trigram.name}卦</h3>
        <p>{formula}</p>
      </div>
      <TrigramFigure trigram={trigram} />
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

          {result ? (
            <div className="hexagram-grid">
              <HexagramCard title="本卦" result={result} />
              <HexagramCard title="变卦" result={result} changed />
            </div>
          ) : (
            <div className="empty-state">输入两个有效整数后即可起卦。</div>
          )}

          <div className="space-section">
            <div className="results-heading compact-heading">
              <div>
                <p className="section-kicker">时空</p>
                <h2>当下地支之卦</h2>
              </div>
              <span className="branch-badge">{resultBranch.name}时 · 序 {resultBranch.number}</span>
            </div>
            <div className="space-grid">
              <SpaceTimeCard
                index="一"
                trigram={spaceTime.folded}
                formula={`${resultBranch.name} ${resultBranch.number} → ${spaceTime.foldedNumber} → ${spaceTime.folded.name}`}
              />
              <SpaceTimeCard
                index="二"
                trigram={spaceTime.direct}
                formula={`${resultBranch.name} → 直接对应 → ${spaceTime.direct.name}`}
              />
            </div>
          </div>
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
