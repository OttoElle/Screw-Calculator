import type { BoltJointInput, JointType, ThreadFinish } from '../core/calculate'
import { coarseThread } from '../core/data/threads'
import type { StrengthClass } from '../core/data/strengthClasses'
import { headDimensions, clearanceHole, type HeadType, type HoleSeries } from '../core/data/fasteners'
import { materialByName } from '../core/data/materials'
import { totalEmbedding, type Roughness } from '../core/data/embedding'
import { TIGHTENING_METHODS } from '../core/data/tightening'

/** Zustand der Eingabemaske. Kräfte in kN, Längen in mm. */
export interface FormState {
  size: string
  strengthClass: StrengthClass
  headType: HeadType
  jointType: JointType
  holeSeries: HoleSeries
  finish: ThreadFinish

  lK: number
  lShank: number
  DA: number
  /** leer = wie DA */
  DAsub: number | null
  plates: number
  material: string

  tightening: string
  alphaA: number
  muG: number
  muK: number

  FAmax: number
  FAmin: number
  FQmax: number
  muT: number
  qF: number
  FKP: number

  n: number
  rz: Roughness

  /** Erweitert: Überschreiben von Normwerten */
  dWOverride: number | null
  dhOverride: number | null
  dWPlate: number | null
  plateModel: JointType | null
}

export const DEFAULT_STATE: FormState = {
  size: 'M10',
  strengthClass: '8.8',
  headType: 'ISO4017',
  jointType: 'DSV',
  holeSeries: 'mittel',
  finish: 'SV',
  lK: 30,
  lShank: 14,
  DA: 40,
  DAsub: null,
  plates: 2,
  material: 'S355J0',
  tightening: 'torque-B',
  alphaA: 1.8,
  muG: 0.12,
  muK: 0.12,
  FAmax: 8,
  FAmin: 0,
  FQmax: 0,
  muT: 0.15,
  qF: 1,
  FKP: 0,
  n: 0.5,
  rz: '10to40',
  dWOverride: null,
  dhOverride: null,
  dWPlate: null,
  plateModel: null,
}

/** Beispiel B1 aus VDI 2230 Blatt 1, Anhang B (Hydraulikzylinder) */
export const EXAMPLE_B1: FormState = {
  ...DEFAULT_STATE,
  size: 'M12',
  strengthClass: '10.9',
  headType: 'ISO4762',
  jointType: 'ESV',
  holeSeries: 'mittel',
  lK: 42,
  lShank: 24,
  DA: 80,
  DAsub: 80,
  plates: 1,
  material: '16MnCr5',
  tightening: 'torque-B',
  alphaA: 1.8,
  muG: 0.1,
  muK: 0.1,
  FAmax: 24.9,
  FAmin: 0,
  FQmax: 0,
  FKP: 1,
  n: 0.35,
  rz: '10to40',
  dWPlate: 21.11,
  plateModel: 'DSV',
}

export function defaultAlpha(methodId: string): number {
  const m = TIGHTENING_METHODS.find((x) => x.id === methodId)
  return m ? Math.round(((m.alphaMin + m.alphaMax) / 2) * 100) / 100 : 1.8
}

export interface Derived {
  dW: number
  dK: number
  k: number
  dh: number
  fZ: number
  input: BoltJointInput
}

export function toInput(s: FormState): Derived {
  const thread = coarseThread(s.size)
  const head = headDimensions(s.headType, s.size)
  const dW = s.dWOverride ?? head.dW
  const dh = s.dhOverride ?? clearanceHole(s.size, s.holeSeries)
  const mat = materialByName(s.material)
  const bearings = s.jointType === 'DSV' ? 2 : 1
  const interfaces = s.jointType === 'DSV' ? Math.max(s.plates - 1, 0) : s.plates
  const fZ = totalEmbedding(s.rz, s.FQmax > 0 ? 'shear' : 'axial', bearings, interfaces)

  const input: BoltJointInput = {
    thread,
    strengthClass: s.strengthClass,
    headForm: s.headType === 'ISO4762' ? 'socket' : 'hex',
    jointType: s.jointType,
    EM: s.jointType === 'ESV' ? mat.E : undefined,
    dW,
    dh,
    lK: s.lK,
    lShank: s.lShank,
    DA: s.DA,
    DAsub: s.DAsub ?? s.DA,
    EP: mat.E,
    pG: mat.pG,
    dWPlate: s.dWPlate ?? undefined,
    plateModel: s.plateModel ?? undefined,
    alphaA: s.alphaA,
    muGmin: s.muG,
    muKmin: s.muK,
    n: s.n,
    fZ,
    FAmax: s.FAmax * 1000,
    FAmin: s.FAmin * 1000,
    FQmax: s.FQmax * 1000,
    qF: s.qF,
    muTmin: s.muT,
    FKP: s.FKP * 1000,
    finish: s.finish,
  }
  return { dW, dK: head.dK, k: head.k, dh, fZ, input }
}

/** Plausibilitätsprüfung der Eingaben, liefert Fehlermeldungen */
export function validate(s: FormState, d: Derived): string[] {
  const e: string[] = []
  const pos = (v: number, name: string) => {
    if (!(v > 0)) e.push(`${name} muss größer als 0 sein.`)
  }
  pos(s.lK, 'Klemmlänge l_K')
  pos(s.DA, 'Außendurchmesser D_A')
  pos(s.alphaA, 'Anziehfaktor α_A')
  pos(s.muG, 'Reibungszahl µ_G')
  pos(s.muK, 'Reibungszahl µ_K')
  if (s.alphaA < 1) e.push('Der Anziehfaktor α_A muss mindestens 1 sein.')
  if (s.lShank < 0) e.push('Die Schaftlänge darf nicht negativ sein.')
  if (s.lShank > s.lK) e.push('Die Schaftlänge darf nicht größer als die Klemmlänge sein.')
  if (s.n <= 0 || s.n > 1) e.push('Der Krafteinleitungsfaktor n muss zwischen 0 und 1 liegen.')
  if (d.dh >= d.dW) e.push('Der Bohrungsdurchmesser d_h muss kleiner als der Auflagedurchmesser d_W sein.')
  if (s.DA <= d.dh) e.push('D_A muss größer als der Bohrungsdurchmesser d_h sein.')
  if (s.FAmin > s.FAmax) e.push('F_A,min darf nicht größer als F_A,max sein.')
  if (s.FAmax < 0) e.push('F_A,max darf nicht negativ sein (Druckkräfte werden noch nicht unterstützt).')
  if (s.FQmax > 0 && !(s.muT > 0)) e.push('Für eine Querkraft wird µ_T > 0 benötigt.')
  return e
}
