import type { BoltJointResult, BoltJointInput } from '../core/calculate'
import { Expandable } from './Expandable'
import { fmt } from './format'

/** SVG-Text mit Index: "F_SA" → F mit tiefgestelltem SA */
function Sym({ s }: { s: string }) {
  const i = s.indexOf('_')
  if (i < 0) return <>{s}</>
  return (
    <>
      {s.slice(0, i)}
      <tspan dy="3" fontSize="0.72em">
        {s.slice(i + 1)}
      </tspan>
      <tspan dy="-3"> </tspan>
    </>
  )
}

/** "schöne" Achsenteilung */
function niceStep(max: number, count: number): number {
  const raw = max / count
  const mag = 10 ** Math.floor(Math.log10(raw))
  const n = raw / mag
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag
}

interface Callout {
  key: string
  symbol: string
  value: number
  y: number
  color: string
}

/** verteilt Beschriftungen vertikal, damit sie sich nicht überlappen */
function spread(items: Callout[], gap: number, minY: number, maxY: number): number[] {
  const order = items.map((c, i) => ({ y: c.y, i })).sort((a, b) => a.y - b.y)
  const pos = order.map((o) => o.y)
  for (let k = 1; k < pos.length; k++) pos[k] = Math.max(pos[k], pos[k - 1] + gap)
  const overflow = pos[pos.length - 1] - maxY
  if (overflow > 0) for (let k = 0; k < pos.length; k++) pos[k] -= overflow
  for (let k = 0; k < pos.length; k++) pos[k] = Math.max(pos[k], minY + k * gap)
  const out: number[] = []
  order.forEach((o, k) => (out[o.i] = pos[k]))
  return out
}

function Chart({ result, input, large }: { result: BoltJointResult; input: BoltJointInput; large: boolean }) {
  const v = result.values
  const dS = v.deltaS
  const dP = v.deltaP
  const FM = v.FMzul / input.alphaA
  const FV = FM - v.FZ
  const FSA = v.FSA
  const FPA = v.FPA
  const FKR = FV - FPA

  // Verformungen in µm
  const fSM = FM * dS * 1000
  const fPM = FM * dP * 1000
  const fZ = input.fZ * 1000
  const fV = FV * dS * 1000
  const fOp = (FV + FSA) * dS * 1000
  const fEnd = fSM + fPM

  const W = 760
  const H = large ? 500 : 440
  const m = { l: 64, r: 170, t: 28, b: 78 }
  const pw = W - m.l - m.r
  const ph = H - m.t - m.b
  const fMax = fEnd * 1.04
  const Fmax = Math.max(FM, FV + FSA) * 1.12
  const X = (f: number) => m.l + (f / fMax) * pw
  const Y = (F: number) => m.t + ph - (F / Fmax) * ph
  const kN = (F: number) => `${fmt(F / 1000, 3)} kN`

  const step = niceStep(Fmax / 1000, 5) * 1000
  const ticks: number[] = []
  for (let F = 0; F <= Fmax; F += step) ticks.push(F)

  const xOp = X(fOp)
  const yTop = Y(FV + FSA)
  const yV = Y(FV)
  const yKR = Y(Math.max(FKR, 0))
  const y0 = Y(0)

  const callouts: Callout[] = [
    { key: 'sa', symbol: 'F_SA', value: FSA, y: (yTop + yV) / 2, color: 'var(--bolt)' },
    { key: 'pa', symbol: 'F_PA', value: FPA, y: (yV + yKR) / 2, color: 'var(--fpa)' },
    { key: 'kr', symbol: 'F_KR', value: FKR, y: (yKR + y0) / 2, color: 'var(--fkr)' },
  ]
  const labelX = W - m.r + 26
  const ys = spread(callouts, 30, m.t + 8, y0 - 6)

  const dimY1 = y0 + 30
  const dimY2 = y0 + 54

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Verspannungsschaubild">
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 1L9 5L0 9z" fill="var(--muted)" />
        </marker>
      </defs>

      {/* Raster und y-Achse */}
      {ticks.map((F) => (
        <g key={F}>
          <line x1={m.l} x2={m.l + pw} y1={Y(F)} y2={Y(F)} className="grid" />
          <text x={m.l - 8} y={Y(F) + 4} textAnchor="end" className="tick">
            {fmt(F / 1000, 3)}
          </text>
        </g>
      ))}
      <text x={m.l - 8} y={m.t - 12} textAnchor="end" className="axis-label">
        F in kN
      </text>

      {/* Montagezustand als Dreiecke */}
      <polygon points={`${X(0)},${y0} ${X(fSM)},${Y(FM)} ${X(fSM)},${y0}`} className="tri-bolt" />
      <polygon points={`${X(fSM)},${y0} ${X(fSM)},${Y(FM)} ${X(fEnd)},${y0}`} className="tri-plate" />

      {/* Kennlinien */}
      <line x1={X(0)} y1={y0} x2={X(Math.max(fOp, fSM) * 1.05)} y2={Y(Math.max(fOp, fSM) * 1.05 / (dS * 1000))} className="bolt" />
      <line x1={X(fSM)} y1={Y(FM)} x2={X(fEnd)} y2={y0} className="plate" />
      <line x1={X(fV)} y1={yV} x2={X(fEnd - fZ)} y2={y0} className="plate dashed" />

      {/* Achsen */}
      <line x1={m.l} y1={y0} x2={m.l + pw} y2={y0} className="axis" />
      <line x1={m.l} y1={y0} x2={m.l} y2={m.t} className="axis" />

      {/* Kennzeichnung F_M und F_V */}
      <line x1={m.l} x2={X(fSM)} y1={Y(FM)} y2={Y(FM)} className="guide" />
      <line x1={m.l} x2={xOp + 10} y1={yV} y2={yV} className="guide" />
      <circle cx={X(fSM)} cy={Y(FM)} r={4} className="pt" />
      <circle cx={X(fV)} cy={yV} r={4} className="pt" />
      <text x={X(fSM) - 10} y={Y(FM) - 10} textAnchor="end" className="pt-label">
        <Sym s="F_M" /> = {kN(FM)}
      </text>
      <text x={X(fV) - 10} y={Math.max(yV - 8, Y(FM) + 8)} textAnchor="end" className="pt-label">
        <Sym s="F_V" /> = {kN(FV)}
      </text>

      {/* Betriebskraft als gestapelter Balken */}
      <line x1={xOp} x2={xOp} y1={yTop} y2={yV} className="seg" stroke="var(--bolt)" />
      <line x1={xOp} x2={xOp} y1={yV} y2={yKR} className="seg" stroke="var(--fpa)" />
      <line x1={xOp} x2={xOp} y1={yKR} y2={y0} className="seg" stroke="var(--fkr)" />
      <line x1={xOp - 8} x2={xOp + 8} y1={yTop} y2={yTop} className="cap" />

      {/* Beschriftungen rechts */}
      {callouts.map((c, i) => (
        <g key={c.key}>
          <polyline
            points={`${xOp + 5},${c.y} ${labelX - 14},${c.y} ${labelX - 4},${ys[i]}`}
            fill="none"
            stroke={c.color}
            strokeWidth={1}
          />
          <rect x={labelX - 2} y={ys[i] - 12} width={m.r - 30} height={24} rx={12} className="pill" stroke={c.color} />
          <text x={labelX + 10} y={ys[i] + 5} className="pill-text" fill={c.color}>
            <Sym s={c.symbol} /> = {kN(c.value)}
          </text>
        </g>
      ))}
      <text x={labelX - 2} y={Y(FV + FSA) - 18} className="axis-label">
        unter <Sym s="F_A,max" /> = {kN(input.FAmax)}
      </text>

      {/* Bemaßung der Verformungen */}
      <line x1={X(0)} x2={X(fSM)} y1={dimY1} y2={dimY1} className="dim" markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x={(X(0) + X(fSM)) / 2} y={dimY1 - 6} textAnchor="middle" className="dim-text">
        <Sym s="f_SM" /> = {fmt(fSM, 3)} µm
      </text>
      <line x1={X(fSM)} x2={X(fEnd)} y1={dimY1} y2={dimY1} className="dim" markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text
        x={X(fEnd) - X(fSM) > 110 ? (X(fSM) + X(fEnd)) / 2 : X(fEnd) + 8}
        y={X(fEnd) - X(fSM) > 110 ? dimY1 - 6 : dimY1 + 4}
        textAnchor={X(fEnd) - X(fSM) > 110 ? 'middle' : 'start'}
        className="dim-text"
      >
        <Sym s="f_PM" /> = {fmt(fPM, 3)} µm
      </text>
      <line x1={X(fEnd - fZ)} x2={X(fEnd)} y1={dimY2} y2={dimY2} className="dim" markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x={X(fEnd - fZ) - 6} y={dimY2 + 4} textAnchor="end" className="dim-text">
        Setzen <Sym s="f_Z" /> = {fmt(fZ, 3)} µm
      </text>
      {[0, fSM, fEnd - fZ, fEnd].map((f) => (
        <line key={f} x1={X(f)} x2={X(f)} y1={y0} y2={f === fEnd - fZ ? dimY2 + 4 : f === fEnd ? dimY2 + 4 : dimY1 + 4} className="ext" />
      ))}

      {/* Legende */}
      <g transform={`translate(${m.l + 10}, ${m.t + 4})`} className="legend">
        <rect x={-8} y={-16} width={178} height={62} rx={8} className="legend-bg" />
        <rect x={0} y={-8} width={14} height={10} className="tri-bolt" />
        <line x1={0} x2={14} y1={-3} y2={-3} className="bolt" />
        <text x={20} y={1}>Schraube</text>
        <rect x={0} y={10} width={14} height={10} className="tri-plate" />
        <line x1={0} x2={14} y1={15} y2={15} className="plate" />
        <text x={20} y={19}>Platten bei Montage</text>
        <line x1={0} x2={14} y1={33} y2={33} className="plate dashed" />
        <text x={20} y={37}>Platten nach Setzen</text>
      </g>
    </svg>
  )
}

/**
 * Verspannungsschaubild für den ungünstigsten Fall der Restklemmkraft:
 * Montagevorspannkraft F_M = F_M,zul / α_A, Setzverlust F_Z, Betriebskraft F_A,max.
 */
export function JointDiagram({ result, input }: { result: BoltJointResult; input: BoltJointInput }) {
  const v = result.values
  const FM = v.FMzul / input.alphaA
  const valid = [v.deltaS, v.deltaP, FM, FM - v.FZ].every((x) => Number.isFinite(x) && x > 0)
  if (!valid) return null
  return (
    <Expandable
      title="Verspannungsschaubild"
      hint={
        <>
          Ungünstigster Fall für die Restklemmkraft: Montage mit F<sub>M</sub> = F<sub>M,zul</sub>/α<sub>A</sub>, dann
          Setzen und Betriebskraft F<sub>A,max</sub>.
        </>
      }
      footer={
        input.n < 1 ? (
          <p className="hint">
            Bei n &lt; 1 wird die Betriebskraft innerhalb der Platten eingeleitet. Deshalb endet F<sub>PA</sub> nicht auf
            der Plattenkennlinie.
          </p>
        ) : null
      }
    >
      {(large) => <Chart result={result} input={input} large={large} />}
    </Expandable>
  )
}
