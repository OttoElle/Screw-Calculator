/**
 * Metrisches ISO-Regelgewinde (Steigungen nach DIN 13-1 / ISO 261).
 * Die Querschnitte werden aus den Normformeln (DIN 13-28) berechnet und in den
 * Tests gegen die Nennwerte aus VDI 2230 Blatt 1, Tabelle A11, geprüft.
 */

export interface ThreadGeometry {
  /** Gewindebezeichnung, z.B. "M12" */
  name: string
  /** Nenndurchmesser d in mm */
  d: number
  /** Steigung P in mm */
  P: number
  /** Flankendurchmesser d2 in mm */
  d2: number
  /** Kerndurchmesser Außengewinde d3 in mm */
  d3: number
  /** Kerndurchmesser Innengewinde D1 in mm */
  D1: number
  /** Durchmesser zum Spannungsquerschnitt dS = (d2 + d3) / 2 in mm */
  dS: number
  /** Nennquerschnitt AN = π/4 · d² in mm² */
  AN: number
  /** Spannungsquerschnitt AS = π/4 · dS² in mm² */
  AS: number
  /** Kernquerschnitt Ad3 = π/4 · d3² in mm² */
  Ad3: number
}

/** Regelgewinde-Steigungen nach ISO 261 (Vorzugsreihe) */
export const COARSE_PITCH: Record<string, number> = {
  M4: 0.7,
  M5: 0.8,
  M6: 1,
  M8: 1.25,
  M10: 1.5,
  M12: 1.75,
  M14: 2,
  M16: 2,
  M20: 2.5,
  M24: 3,
  M30: 3.5,
  M36: 4,
}

export const THREAD_SIZES = Object.keys(COARSE_PITCH)

/** Gewindegeometrie aus Nenndurchmesser und Steigung (ISO 724, DIN 13-28) */
export function threadGeometry(d: number, P: number, name = `M${d}×${P}`): ThreadGeometry {
  const H = (Math.sqrt(3) / 2) * P
  const d2 = d - 0.649519 * P
  const d3 = d - 1.226869 * P
  const D1 = d - 2 * (5 / 8) * H
  const dS = (d2 + d3) / 2
  return {
    name,
    d,
    P,
    d2,
    d3,
    D1,
    dS,
    AN: (Math.PI / 4) * d * d,
    AS: (Math.PI / 4) * dS * dS,
    Ad3: (Math.PI / 4) * d3 * d3,
  }
}

/** Regelgewinde per Name, z.B. coarseThread("M12") */
export function coarseThread(name: string): ThreadGeometry {
  const P = COARSE_PITCH[name]
  if (P === undefined) throw new Error(`Unbekanntes Gewinde: ${name}`)
  return threadGeometry(Number(name.slice(1)), P, name)
}
