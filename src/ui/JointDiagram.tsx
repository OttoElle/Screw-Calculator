import type { BoltJointResult, BoltJointInput } from '../core/calculate'
import { fmt } from './format'

/** SVG-Text mit Index: "F_SA" → F mit tiefgestelltem SA */
function Label({ x, y, s, anchor = 'start', className }: { x: number; y: number; s: string; anchor?: 'start' | 'middle' | 'end'; className?: string }) {
  const i = s.indexOf('_')
  const [base, rest] = i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
  const j = rest.indexOf(' ')
  const sub = j < 0 ? rest : rest.slice(0, j)
  const tail = j < 0 ? '' : rest.slice(j)
  return (
    <text x={x} y={y} textAnchor={anchor} className={className}>
      {base}
      {sub && (
        <tspan dy="4" fontSize="0.75em">
          {sub}
        </tspan>
      )}
      {tail && <tspan dy={sub ? -4 : 0}>{tail}</tspan>}
    </text>
  )
}

/**
 * Verspannungsschaubild für den ungünstigsten Fall der Restklemmkraft:
 * Montagevorspannkraft F_M = F_M,zul / α_A, Setzverlust F_Z, Betriebskraft F_A,max.
 */
export function JointDiagram({ result, input }: { result: BoltJointResult; input: BoltJointInput }) {
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
  const fV = FV * dS * 1000
  const fOp = (FV + FSA) * dS * 1000

  const W = 640
  const H = 380
  const m = { l: 64, r: 24, t: 20, b: 44 }
  const fMax = fSM + fPM
  const Fmax = Math.max(FM, FV + FSA) * 1.12
  const X = (f: number) => m.l + (f / fMax) * (W - m.l - m.r)
  const Y = (F: number) => H - m.b - (F / Fmax) * (H - m.t - m.b)
  const kN = (F: number) => `${fmt(F / 1000, 3)} kN`

  const valid = [dS, dP, FM, FV].every((x) => Number.isFinite(x) && x > 0)
  if (!valid) return null

  const xFA = X(fOp)
  return (
    <section className="card">
      <h2>Verspannungsschaubild</h2>
      <p className="hint">
        Ungünstigster Fall für die Restklemmkraft: F<sub>M</sub> = F<sub>M,zul</sub>/α<sub>A</sub>, nach Setzen und unter
        F<sub>A,max</sub>.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="diagram" role="img" aria-label="Verspannungsschaubild">
        {/* Achsen */}
        <line x1={m.l} y1={H - m.b} x2={W - m.r} y2={H - m.b} className="axis" />
        <line x1={m.l} y1={H - m.b} x2={m.l} y2={m.t} className="axis" />
        <text x={W - m.r} y={H - 12} textAnchor="end" className="axis-label">
          Verformung f in µm
        </text>
        <text x={14} y={m.t + 4} className="axis-label" transform={`rotate(-90 14 ${m.t + 4})`} textAnchor="end">
          Kraft F
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={X(fMax * t)} y1={H - m.b} x2={X(fMax * t)} y2={H - m.b + 4} className="axis" />
            <text x={X(fMax * t)} y={H - m.b + 16} textAnchor="middle" className="tick">
              {fmt(fMax * t, 3)}
            </text>
          </g>
        ))}

        {/* Schraubenkennlinie */}
        <line x1={X(0)} y1={Y(0)} x2={X(Math.max(fOp, fSM) * 1.04)} y2={Y((Math.max(fOp, fSM) * 1.04) / (dS * 1000))} className="bolt" />
        {/* Plattenkennlinie bei Montage */}
        <line x1={X(fSM)} y1={Y(FM)} x2={X(fSM + fPM)} y2={Y(0)} className="plate" />
        {/* Plattenkennlinie nach Setzen */}
        <line x1={X(fV)} y1={Y(FV)} x2={X(fSM + fPM - input.fZ * 1000)} y2={Y(0)} className="plate dashed" />

        {/* F_M */}
        <line x1={m.l} y1={Y(FM)} x2={X(fSM)} y2={Y(FM)} className="guide" />
        <Label x={m.l - 6} y={Y(FM) + 4} s="F_M" anchor="end" className="val" />
        {/* F_V */}
        <line x1={m.l} y1={Y(FV)} x2={X(fV)} y2={Y(FV)} className="guide" />
        <Label x={m.l - 6} y={Y(FV) + 12} s="F_V" anchor="end" className="val" />

        {/* F_Z am Rand */}
        <line x1={X(fSM + fPM - input.fZ * 1000)} y1={Y(0) - 6} x2={X(fSM + fPM)} y2={Y(0) - 6} className="dim" />
        <Label x={X(fSM + fPM - (input.fZ * 1000) / 2)} y={Y(0) - 12} s="f_Z" anchor="middle" className="val" />

        {/* Betriebskraft */}
        <line x1={xFA} y1={Y(FV + FSA)} x2={xFA} y2={Y(FV)} className="fsa" />
        <line x1={xFA} y1={Y(FV)} x2={xFA} y2={Y(Math.max(FKR, 0))} className="fpa" />
        <line x1={xFA} y1={Y(Math.max(FKR, 0))} x2={xFA} y2={Y(0)} className="fkr" />
        <line x1={X(fV)} y1={Y(FV)} x2={xFA + 12} y2={Y(FV)} className="guide" />
        <line x1={xFA - 4} y1={Y(FV + FSA)} x2={xFA + 12} y2={Y(FV + FSA)} className="guide" />

        <Label x={xFA + 10} y={(Y(FV + FSA) + Y(FV)) / 2 + 4} s={`F_SA = ${kN(FSA)}`} className="val fsa-t" />
        <Label x={xFA + 10} y={(Y(FV) + Y(Math.max(FKR, 0))) / 2 + 4} s={`F_PA = ${kN(FPA)}`} className="val fpa-t" />
        <Label x={xFA + 10} y={(Y(Math.max(FKR, 0)) + Y(0)) / 2 + 4} s={`F_KR = ${kN(FKR)}`} className="val fkr-t" />

        {/* Legende */}
        <g transform={`translate(${m.l + 12}, ${m.t + 6})`} className="legend">
          <line x1={0} y1={0} x2={22} y2={0} className="bolt" />
          <text x={28} y={4}>Schraube</text>
          <line x1={0} y1={18} x2={22} y2={18} className="plate" />
          <text x={28} y={22}>Platten (Montage)</text>
          <line x1={0} y1={36} x2={22} y2={36} className="plate dashed" />
          <text x={28} y={40}>Platten nach Setzen</text>
        </g>
      </svg>
      <dl className="mini">
        <div>
          <dt>
            F<sub>M</sub>
          </dt>
          <dd>{kN(FM)}</dd>
        </div>
        <div>
          <dt>
            F<sub>Z</sub>
          </dt>
          <dd>{kN(v.FZ)}</dd>
        </div>
        <div>
          <dt>
            F<sub>V</sub>
          </dt>
          <dd>{kN(FV)}</dd>
        </div>
        <div>
          <dt>
            F<sub>S,max</sub> (mit F<sub>M,zul</sub>)
          </dt>
          <dd>{kN(v.FSmax)}</dd>
        </div>
      </dl>
      {input.n < 1 && (
        <p className="hint">
          Bei n &lt; 1 wird die Betriebskraft innerhalb der Platten eingeleitet. Deshalb endet F<sub>PA</sub> nicht auf
          der Plattenkennlinie.
        </p>
      )}
    </section>
  )
}
