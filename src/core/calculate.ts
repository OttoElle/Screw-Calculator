/**
 * Rechenkern nach VDI 2230 Blatt 1 (11/2015), Rechenschritte R0 bis R13,
 * für zentrisch verspannte und zentrisch belastete Einschraubenverbindungen
 * mit axialer Betriebskraft und optionaler Querkraft.
 *
 * Einheiten: Kräfte in N, Längen in mm, Spannungen und E-Moduln in N/mm²,
 * Nachgiebigkeiten in mm/N, Momente in N·mm (Ausgabe von MA zusätzlich in N·m).
 *
 * Nicht enthalten (spätere Ausbaustufen): exzentrische Verspannung/Belastung,
 * Klaffen, Temperatureinfluss (ΔF'Vth = 0), Einschraubtiefe (R11),
 * Taillenschrauben, Scherbeanspruchung der Schraube.
 */

import type { ThreadGeometry } from './data/threads'
import { strengthValues, type StrengthClass } from './data/strengthClasses'

/** DSV: Durchsteckschraubenverbindung (mit Mutter), ESV: Einschraubverbindung (Sackloch) */
export type JointType = 'DSV' | 'ESV'
/** Kopfform, bestimmt die Ersatzlänge lSK (Sechskant 0,5·d, Innensechskant 0,4·d) */
export type HeadForm = 'hex' | 'socket'
/** SV: schlussvergütet, SG: schlussgewalzt */
export type ThreadFinish = 'SV' | 'SG'

export interface BoltJointInput {
  thread: ThreadGeometry
  strengthClass: StrengthClass
  headForm: HeadForm
  jointType: JointType
  /** E-Modul der Schraube, Standard 205 000 N/mm² */
  ES?: number
  /** E-Modul des Mutter- bzw. Innengewindewerkstoffs, Standard = ES */
  EM?: number

  /** Auflagedurchmesser Schraubenkopf dW */
  dW: number
  /** Bohrungsdurchmesser dh */
  dh: number
  /** Klemmlänge lK */
  lK: number
  /** Länge des Schafts (Nenndurchmesser d) innerhalb der Klemmlänge; Rest ist freies Gewinde */
  lShank: number
  /** Außendurchmesser der Trennfugenfläche DA */
  DA: number
  /** Ersatzaußendurchmesser des Grundkörpers D'A (Standard = DA) */
  DAsub?: number
  /** E-Modul der verspannten Teile EP */
  EP: number
  /** Grenzflächenpressung unter dem Kopf pG */
  pG: number

  /**
   * Optional: abweichender Auflagedurchmesser für die Plattennachgiebigkeit
   * (z.B. Mittelwert aus Kopfauflage und Trennfugendurchmesser).
   */
  dWPlate?: number
  /** Optional: Verformungsmodell der Platten abweichend vom Verbindungstyp */
  plateModel?: JointType

  /** Anziehfaktor αA */
  alphaA: number
  /** minimale Reibungszahl im Gewinde µG,min */
  muGmin: number
  /** minimale Reibungszahl in der Kopfauflage µK,min */
  muKmin: number
  /** Ausnutzungsgrad der Streckgrenze bei Montage ν, Standard 0,9 */
  nu?: number
  /** Reduktionskoeffizient der Torsionsspannung im Betrieb kτ, Standard 0,5 */
  kTau?: number

  /** Krafteinleitungsfaktor n */
  n: number
  /** Setzbetrag fZ in mm */
  fZ: number

  /** maximale axiale Betriebskraft FA,max */
  FAmax: number
  /** minimale axiale Betriebskraft FA,min (Standard 0) */
  FAmin?: number
  /** maximale Querkraft FQ,max (Standard 0) */
  FQmax?: number
  /** Anzahl kraftübertragender Trennfugen qF (Standard 1) */
  qF?: number
  /** minimale Haftreibungszahl in der Trennfuge µT,min */
  muTmin?: number
  /** Mindestklemmkraft für Dichtfunktion FKP (Standard 0) */
  FKP?: number

  /** Fertigungsfolge des Gewindes, Standard schlussvergütet */
  finish?: ThreadFinish
}

export interface Quantity {
  symbol: string
  label: string
  value: number
  unit: string
}

export interface Check {
  label: string
  /** Sicherheit bzw. Verhältnis "vorhanden / erforderlich" */
  safety: number
  /** empfohlene Mindestsicherheit */
  required: number
  ok: boolean
}

export interface Step {
  id: string
  title: string
  quantities: Quantity[]
  checks: Check[]
  notes: string[]
}

export interface PlateResilience {
  tanPhi: number
  DAGr: number
  case: 'cone' | 'cone+sleeve' | 'sleeve'
  deltaP: number
  /** Kegelhöhe lV und Hülsenhöhe lH (für Darstellung) */
  lV: number
  lH: number
}

export interface BoltJointResult {
  steps: Step[]
  /** wichtige Werte für Diagramme und Zusammenfassung */
  values: {
    deltaS: number
    deltaP: number
    PhiK: number
    Phi: number
    FZ: number
    FKerf: number
    FMmin: number
    FMmax: number
    FMzul: number
    FSA: number
    FPA: number
    FSmax: number
    FKRmin: number
    MA: number
    plate: PlateResilience
  }
  ok: boolean
}

const q = (symbol: string, label: string, value: number, unit: string): Quantity => ({
  symbol,
  label,
  value,
  unit,
})

const check = (label: string, safety: number, required: number): Check => ({
  label,
  safety,
  required,
  ok: safety >= required,
})

/** Kegelwinkel des Ersatzverformungskörpers, Gl. (42)/(43) */
export function coneAngle(model: JointType, lK: number, dW: number, DAsub: number): number {
  const betaL = lK / dW
  const y = DAsub / dW
  return model === 'ESV'
    ? 0.348 + 0.013 * Math.log(betaL) + 0.193 * Math.log(y)
    : 0.362 + 0.032 * Math.log(betaL / 2) + 0.153 * Math.log(y)
}

/** Nachgiebigkeit der zentrisch verspannten Teile, Gl. (39) bis (50) */
export function plateResilience(
  model: JointType,
  dW: number,
  dh: number,
  lK: number,
  DA: number,
  DAsub: number,
  EP: number,
): PlateResilience {
  const w = model === 'DSV' ? 1 : 2
  const tanPhi = coneAngle(model, lK, dW, DAsub)
  const DAGr = dW + w * lK * tanPhi

  if (DA <= dW) {
    // nur Verformungshülse
    const deltaP = (4 * lK) / (EP * Math.PI * (DA * DA - dh * dh))
    return { tanPhi, DAGr, case: 'sleeve', deltaP, lV: 0, lH: lK }
  }

  const dCone = DA >= DAGr ? DAGr : DA
  const lV = (dCone - dW) / (2 * tanPhi)
  const lH = lK - (2 * lV) / w
  // Nachgiebigkeit eines Kegels der Höhe lV, Gl. (46)
  const deltaCone =
    Math.log(((dW + dh) * (dW + 2 * lV * tanPhi - dh)) / ((dW - dh) * (dW + 2 * lV * tanPhi + dh))) /
    (EP * dh * Math.PI * tanPhi)
  // Hülse, Gl. (49)
  const deltaSleeve = lH > 0 ? (4 * lH) / (EP * Math.PI * (DA * DA - dh * dh)) : 0
  const deltaP = (2 / w) * deltaCone + deltaSleeve

  return { tanPhi, DAGr, case: DA >= DAGr ? 'cone' : 'cone+sleeve', deltaP, lV, lH: Math.max(lH, 0) }
}

/** zulässige Montagevorspannkraft FM,zul, Gl. (R7/2) */
export function permissibleAssemblyPreload(
  t: ThreadGeometry,
  Rp02min: number,
  muGmin: number,
  nu = 0.9,
): number {
  const term = 1.5 * (t.d2 / t.dS) * (t.P / (Math.PI * t.d2) + 1.155 * muGmin)
  return (t.AS * nu * Rp02min) / Math.sqrt(1 + 3 * term * term)
}

/** Gewindemoment MG in N·mm */
export function threadTorque(t: ThreadGeometry, FM: number, muG: number): number {
  return FM * (t.d2 / 2) * (t.P / (Math.PI * t.d2) + 1.155 * muG)
}

export function calculate(input: BoltJointInput): BoltJointResult {
  const t = input.thread
  const d = t.d
  const ES = input.ES ?? 205000
  const EM = input.EM ?? ES
  const nu = input.nu ?? 0.9
  const kTau = input.kTau ?? 0.5
  const FAmin = input.FAmin ?? 0
  const FQmax = input.FQmax ?? 0
  const qF = input.qF ?? 1
  const muTmin = input.muTmin ?? 0.1
  const FKP = input.FKP ?? 0
  const finish = input.finish ?? 'SV'
  const { Rp02min } = strengthValues(input.strengthClass, d)
  const steps: Step[] = []

  // R0: Geometrie und Gültigkeit
  const lGew = input.lK - input.lShank
  const r0notes: string[] = []
  if (lGew < 0) r0notes.push('Schaftlänge größer als Klemmlänge: es wird kein freies Gewinde berücksichtigt.')
  if (input.dh >= input.dW) r0notes.push('Bohrungsdurchmesser dh muss kleiner als der Auflagedurchmesser dW sein.')
  steps.push({
    id: 'R0',
    title: 'Schraubengeometrie',
    quantities: [
      q('d', 'Nenndurchmesser', d, 'mm'),
      q('P', 'Steigung', t.P, 'mm'),
      q('d₂', 'Flankendurchmesser', t.d2, 'mm'),
      q('d₃', 'Kerndurchmesser', t.d3, 'mm'),
      q('A_N', 'Nennquerschnitt', t.AN, 'mm²'),
      q('A_S', 'Spannungsquerschnitt', t.AS, 'mm²'),
      q('A_d3', 'Kernquerschnitt', t.Ad3, 'mm²'),
      q('l_K/d', 'Klemmlängenverhältnis', input.lK / d, '–'),
    ],
    checks: [],
    notes: r0notes,
  })

  // R1: Anziehfaktor
  steps.push({
    id: 'R1',
    title: 'Anziehfaktor',
    quantities: [q('α_A', 'Anziehfaktor', input.alphaA, '–')],
    checks: [],
    notes: [],
  })

  // R2: erforderliche Mindestklemmkraft
  const FKQ = FQmax > 0 ? FQmax / (qF * muTmin) : 0
  const FKerf = Math.max(FKQ, FKP)
  steps.push({
    id: 'R2',
    title: 'Erforderliche Mindestklemmkraft',
    quantities: [
      q('F_KQ', 'Klemmkraft zur Querkraftübertragung', FKQ, 'N'),
      q('F_KP', 'Klemmkraft für Dichtfunktion', FKP, 'N'),
      q('F_Kerf', 'erforderliche Mindestklemmkraft', FKerf, 'N'),
    ],
    checks: [],
    notes: [],
  })

  // R3: Nachgiebigkeiten, Kraftverhältnis
  const lSK = (input.headForm === 'hex' ? 0.5 : 0.4) * d
  const lM = (input.jointType === 'DSV' ? 0.4 : 0.33) * d
  const deltaSK = lSK / (ES * t.AN)
  const delta1 = Math.max(input.lShank, 0) / (ES * t.AN)
  const deltaGew = Math.max(lGew, 0) / (ES * t.Ad3)
  const deltaG = (0.5 * d) / (ES * t.Ad3)
  const deltaM = lM / (EM * t.AN)
  const deltaS = deltaSK + delta1 + deltaGew + deltaG + deltaM

  const plateModel = input.plateModel ?? input.jointType
  const plate = plateResilience(
    plateModel,
    input.dWPlate ?? input.dW,
    input.dh,
    input.lK,
    input.DA,
    input.DAsub ?? input.DA,
    input.EP,
  )
  const deltaP = plate.deltaP
  const w = input.jointType === 'DSV' ? 1 : 2
  const deltaPZu = (w - 1) * deltaM
  const PhiK = (deltaP + deltaPZu) / (deltaS + deltaP)
  const Phi = input.n * PhiK
  const FSA = Phi * input.FAmax
  const FPA = (1 - Phi) * input.FAmax

  steps.push({
    id: 'R3',
    title: 'Nachgiebigkeiten und Kraftverhältnis',
    quantities: [
      q('δ_SK', 'Nachgiebigkeit Schraubenkopf', deltaSK, 'mm/N'),
      q('δ_1', 'Nachgiebigkeit Schaft', delta1, 'mm/N'),
      q('δ_Gew', 'Nachgiebigkeit freies Gewinde', deltaGew, 'mm/N'),
      q('δ_G', 'Nachgiebigkeit eingeschraubtes Gewinde', deltaG, 'mm/N'),
      q('δ_M', 'Nachgiebigkeit Mutter bzw. Innengewinde', deltaM, 'mm/N'),
      q('δ_S', 'Nachgiebigkeit der Schraube', deltaS, 'mm/N'),
      q('tan φ', 'Kegelwinkel des Verformungskörpers', plate.tanPhi, '–'),
      q('D_A,Gr', 'Grenzdurchmesser', plate.DAGr, 'mm'),
      q('δ_P', 'Nachgiebigkeit der verspannten Teile', deltaP, 'mm/N'),
      q('Φ_K', 'Kraftverhältnis (Krafteinleitung unter Kopf)', PhiK, '–'),
      q('n', 'Krafteinleitungsfaktor', input.n, '–'),
      q('Φ_n', 'Kraftverhältnis', Phi, '–'),
      q('F_SA', 'Schraubenzusatzkraft', FSA, 'N'),
      q('F_PA', 'Plattenentlastungskraft', FPA, 'N'),
    ],
    checks: [],
    notes: [
      {
        cone: 'Verformungskörper: Kegel (D_A ≥ D_A,Gr).',
        'cone+sleeve': 'Verformungskörper: Kegel und Hülse (d_W < D_A < D_A,Gr).',
        sleeve: 'Verformungskörper: nur Hülse (D_A ≤ d_W).',
      }[plate.case],
    ],
  })

  // R4: Vorspannkraftverlust durch Setzen
  const FZ = input.fZ / (deltaS + deltaP)
  steps.push({
    id: 'R4',
    title: 'Vorspannkraftverlust durch Setzen',
    quantities: [q('f_Z', 'Setzbetrag', input.fZ * 1000, 'µm'), q('F_Z', 'Vorspannkraftverlust', FZ, 'N')],
    checks: [],
    notes: ['Temperatureinfluss wird nicht berücksichtigt (ΔF′_Vth = 0).'],
  })

  // R5, R6: Montagevorspannkräfte
  const FMmin = FKerf + (1 - Phi) * input.FAmax + FZ
  const FMmax = input.alphaA * FMmin
  steps.push({
    id: 'R5',
    title: 'Mindestmontagevorspannkraft',
    quantities: [q('F_M,min', 'Mindestmontagevorspannkraft', FMmin, 'N')],
    checks: [],
    notes: [],
  })
  steps.push({
    id: 'R6',
    title: 'Maximale Montagevorspannkraft',
    quantities: [q('F_M,max', 'maximale Montagevorspannkraft', FMmax, 'N')],
    checks: [],
    notes: [],
  })

  // R7: Montagebeanspruchung
  const FMzul = permissibleAssemblyPreload(t, Rp02min, input.muGmin, nu)
  steps.push({
    id: 'R7',
    title: 'Montagebeanspruchung',
    quantities: [
      q('R_p0,2min', 'Mindeststreckgrenze', Rp02min, 'N/mm²'),
      q('ν', 'Ausnutzungsgrad', nu, '–'),
      q('F_M,zul', 'zulässige Montagevorspannkraft', FMzul, 'N'),
    ],
    checks: [check('F_M,zul ≥ F_M,max', FMzul / FMmax, 1)],
    notes: [],
  })

  // R8: Betriebsbeanspruchung
  const FSmax = FMzul + Phi * input.FAmax
  const sigmaZmax = FSmax / t.AS
  const MG = threadTorque(t, FMzul, input.muGmin)
  const WP = (Math.PI / 16) * t.dS ** 3
  const tauMax = MG / WP
  const sigmaRedB = Math.sqrt(sigmaZmax ** 2 + 3 * (kTau * tauMax) ** 2)
  steps.push({
    id: 'R8',
    title: 'Betriebsbeanspruchung',
    quantities: [
      q('F_S,max', 'maximale Schraubenkraft', FSmax, 'N'),
      q('σ_z,max', 'maximale Zugspannung', sigmaZmax, 'N/mm²'),
      q('M_G', 'Gewindemoment', MG, 'N·mm'),
      q('W_P', 'polares Widerstandsmoment', WP, 'mm³'),
      q('τ_max', 'maximale Torsionsspannung', tauMax, 'N/mm²'),
      q('σ_red,B', 'Vergleichsspannung im Betrieb', sigmaRedB, 'N/mm²'),
    ],
    checks: [check('Sicherheit gegen Fließen S_F', Rp02min / sigmaRedB, 1)],
    notes: [],
  })

  // R9: Schwingbeanspruchung
  const FSAo = Phi * input.FAmax
  const FSAu = Phi * FAmin
  const sigmaA = (FSAo - FSAu) / (2 * t.AS)
  const sigmaASV = 0.85 * (150 / d + 45)
  const F02min = Rp02min * t.AS
  const FSm = (FSAo + FSAu) / 2 + FMzul
  const sigmaAS = finish === 'SV' ? sigmaASV : (2 - FSm / F02min) * sigmaASV
  const r9checks: Check[] = []
  const r9notes: string[] = []
  if (sigmaA > 0) r9checks.push(check('Sicherheit gegen Dauerbruch S_D', sigmaAS / sigmaA, 1.2))
  else r9notes.push('Keine schwingende Betriebskraft: Nachweis entfällt.')
  if (finish === 'SG' && (FSm / F02min < 0.3 || FSm / F02min >= 1))
    r9notes.push('F_Sm/F_0,2min liegt außerhalb des Gültigkeitsbereichs 0,3 bis 1.')
  steps.push({
    id: 'R9',
    title: 'Schwingbeanspruchung',
    quantities: [
      q('σ_a', 'Spannungsamplitude', sigmaA, 'N/mm²'),
      q(finish === 'SV' ? 'σ_ASV' : 'σ_ASG', 'Dauerhaltbarkeit', sigmaAS, 'N/mm²'),
    ],
    checks: r9checks,
    notes: r9notes,
  })

  // R10: Flächenpressung unter dem Kopf
  const ApMin = (Math.PI / 4) * (input.dW ** 2 - input.dh ** 2)
  const pMmax = FMzul / ApMin
  const FVmax = FMzul - FZ
  const pBmax = (FVmax + FSA) / ApMin
  steps.push({
    id: 'R10',
    title: 'Flächenpressung unter dem Kopf',
    quantities: [
      q('A_p,min', 'Auflagefläche', ApMin, 'mm²'),
      q('p_M,max', 'Flächenpressung Montage', pMmax, 'N/mm²'),
      q('p_B,max', 'Flächenpressung Betrieb', pBmax, 'N/mm²'),
      q('p_G', 'Grenzflächenpressung', input.pG, 'N/mm²'),
    ],
    checks: [check('Sicherheit Flächenpressung S_p', input.pG / Math.max(pMmax, pBmax), 1)],
    notes: [],
  })

  // R11: Einschraubtiefe (noch nicht umgesetzt)
  steps.push({
    id: 'R11',
    title: 'Mindesteinschraubtiefe',
    quantities: [],
    checks: [],
    notes: ['Noch nicht umgesetzt.'],
  })

  // R12: Restklemmkraft und Gleiten
  const FKRmin = FMzul / input.alphaA - (1 - Phi) * input.FAmax - FZ
  const r12checks: Check[] = []
  if (FKP > 0) r12checks.push(check('Restklemmkraft F_KR,min ≥ F_KP', FKRmin / FKP, 1))
  if (FQmax > 0) r12checks.push(check('Sicherheit gegen Gleiten S_G', FKRmin / FKQ, 1.2))
  steps.push({
    id: 'R12',
    title: 'Restklemmkraft und Sicherheit gegen Gleiten',
    quantities: [
      q('F_KR,min', 'minimale Restklemmkraft', FKRmin, 'N'),
      ...(FQmax > 0 ? [q('F_KQ,erf', 'erforderliche Klemmkraft gegen Gleiten', FKQ, 'N')] : []),
    ],
    checks: r12checks,
    notes: FKRmin <= 0 ? ['Die Trennfuge öffnet sich (F_KR,min ≤ 0).'] : [],
  })

  // R13: Anziehdrehmoment
  const DKm = (input.dW + input.dh) / 2
  const MA = FMzul * (0.16 * t.P + 0.58 * t.d2 * input.muGmin + (DKm / 2) * input.muKmin)
  steps.push({
    id: 'R13',
    title: 'Anziehdrehmoment',
    quantities: [
      q('D_Km', 'wirksamer Reibdurchmesser Kopfauflage', DKm, 'mm'),
      q('M_A', 'Anziehdrehmoment', MA / 1000, 'N·m'),
    ],
    checks: [],
    notes: [],
  })

  const ok = steps.every((s) => s.checks.every((c) => c.ok)) && FKRmin > 0
  return {
    steps,
    values: {
      deltaS,
      deltaP,
      PhiK,
      Phi,
      FZ,
      FKerf,
      FMmin,
      FMmax,
      FMzul,
      FSA,
      FPA,
      FSmax,
      FKRmin,
      MA: MA / 1000,
      plate,
    },
    ok,
  }
}
