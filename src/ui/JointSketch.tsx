import type { ReactNode } from 'react'
import type { BoltJointInput, PlateResilience } from '../core/calculate'
import { nutDimensions } from '../core/data/fasteners'
import { fmt } from './format'
import { Expandable } from './Expandable'

interface Props {
  input: BoltJointInput
  plate: PlateResilience
  size: string
  dK: number
  k: number
  plates: number
}

/** Maßstäblicher Halbschnitt der Verbindung mit Ersatzverformungskörper */
export function JointSketch({ input, plate, size, dK, k, plates }: Props) {
  const { thread: t, lK, DA, dh, dW, lShank, jointType } = input
  const d = t.d
  const dWP = input.dWPlate ?? dW
  const nut = jointType === 'DSV' ? nutDimensions(size) : null
  const baseH = jointType === 'ESV' ? Math.max(1.8 * d, 0.4 * lK) : 0
  const engage = jointType === 'ESV' ? 1.3 * d : 0
  const boltEnd = jointType === 'DSV' ? lK + (nut?.m ?? 0) + 2 * t.P : lK + engage
  const bottom = jointType === 'DSV' ? boltEnd : lK + baseH

  // Zeichenbereich in mm
  const halfW = Math.max(DA, dK, nut?.s ?? 0) / 2 + 4
  const top = -k - 4
  const spanY = bottom + 4 - top
  const W = 360
  const scale = Math.min((W - 40) / (2 * halfW), 460 / spanY)
  const H = spanY * scale + 30
  const cx = W / 2
  const X = (x: number) => cx + x * scale
  const Y = (y: number) => 16 + (y - top) * scale

  // Verformungskörper (rechte Hälfte), Koordinaten in mm
  const r0 = dWP / 2
  const tan = plate.tanPhi
  const body: [number, number][] = []
  if (plate.case === 'sleeve') {
    body.push([dh / 2, 0], [DA / 2, 0], [DA / 2, lK], [dh / 2, lK])
  } else if ((input.plateModel ?? jointType) === 'DSV') {
    const rV = r0 + plate.lV * tan
    body.push([dh / 2, 0], [r0, 0], [rV, plate.lV], [rV, lK - plate.lV], [r0, lK], [dh / 2, lK])
  } else {
    const rV = r0 + plate.lV * tan
    body.push([dh / 2, 0], [r0, 0], [rV, plate.lV], [rV, lK], [dh / 2, lK])
  }
  const poly = (sign: 1 | -1) => body.map(([x, y]) => `${X(sign * x)},${Y(y)}`).join(' ')

  const plateRects: ReactNode[] = []
  for (let i = 0; i < plates; i++) {
    const y0 = (lK / plates) * i
    const h = lK / plates
    plateRects.push(
      <g key={i}>
        <rect x={X(-DA / 2)} y={Y(y0)} width={(DA / 2 - dh / 2) * scale} height={h * scale} className="part" />
        <rect x={X(dh / 2)} y={Y(y0)} width={(DA / 2 - dh / 2) * scale} height={h * scale} className="part" />
      </g>,
    )
  }

  const threadStart = Math.max(Math.min(lShank, lK), 0)
  const threadLines: ReactNode[] = []
  for (let y = threadStart + t.P / 2; y < boltEnd; y += t.P) {
    threadLines.push(<line key={y} x1={X(-d / 2)} y1={Y(y)} x2={X(d / 2)} y2={Y(y + t.P / 2)} className="thread" />)
  }

  return (
    <Expandable
      title="Schnittskizze"
      hint={<>
        Maßstäblich, mit Ersatzverformungskörper ({plate.case === 'cone' ? 'Kegel' : plate.case === 'sleeve' ? 'Hülse' : 'Kegel und Hülse'}
        , tan φ = {fmt(plate.tanPhi, 3)}).
      </>}
    >
      {(large) => (
      <svg viewBox={`0 0 ${W} ${H}`} className={large ? "sketch large" : "sketch"} role="img" aria-label="Schnittskizze der Schraubenverbindung">
        {plateRects}
        {jointType === 'ESV' && (
          <g>
            <rect x={X(-DA / 2)} y={Y(lK)} width={(DA / 2 - d / 2) * scale} height={baseH * scale} className="part base" />
            <rect x={X(d / 2)} y={Y(lK)} width={(DA / 2 - d / 2) * scale} height={baseH * scale} className="part base" />
            <rect x={X(-d / 2)} y={Y(boltEnd)} width={d * scale} height={(lK + baseH - boltEnd) * scale} className="part base" />
          </g>
        )}
        <polygon points={poly(1)} className="cone" />
        <polygon points={poly(-1)} className="cone" />

        {/* Schraube */}
        <rect x={X(-dK / 2)} y={Y(-k)} width={dK * scale} height={k * scale} className="bolt-part" />
        <rect x={X(-d / 2)} y={Y(0)} width={d * scale} height={boltEnd * scale} className="bolt-part" />
        {threadLines}
        {nut && <rect x={X(-nut.s / 2)} y={Y(lK)} width={nut.s * scale} height={nut.m * scale} className="bolt-part nut" />}
        <line x1={X(0)} y1={Y(top + 1)} x2={X(0)} y2={Y(bottom + 2)} className="center" />

        {/* Bemaßung Klemmlänge */}
        <line x1={X(-halfW) + 6} y1={Y(0)} x2={X(-halfW) + 6} y2={Y(lK)} className="dim" />
        <line x1={X(-halfW) + 2} y1={Y(0)} x2={X(-DA / 2)} y2={Y(0)} className="dim-ext" />
        <line x1={X(-halfW) + 2} y1={Y(lK)} x2={X(-DA / 2)} y2={Y(lK)} className="dim-ext" />
        <text x={X(-halfW) + 2} y={Y(lK / 2)} className="dim-text" transform={`rotate(-90 ${X(-halfW) + 2} ${Y(lK / 2)})`} textAnchor="middle">
          lK = {fmt(lK, 3)}
        </text>
        <text x={X(DA / 2) - 4} y={Y(lK) + 14} textAnchor="end" className="dim-text">
          DA = {fmt(DA, 3)}
        </text>
      </svg>
      )}
    </Expandable>
  )
}
