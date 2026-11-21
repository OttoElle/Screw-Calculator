/**
 * Anziehverfahren mit Richtwerten für den Anziehfaktor αA
 * (zusammengefasst nach VDI 2230 Blatt 1, Tabelle A8).
 */

export interface TighteningMethod {
  id: string
  label: string
  alphaMin: number
  alphaMax: number
}

export const TIGHTENING_METHODS: TighteningMethod[] = [
  { id: 'ultrasonic', label: 'Längungssteuerung per Ultraschall', alphaMin: 1.1, alphaMax: 1.2 },
  { id: 'elongation', label: 'Mechanische Längungsmessung', alphaMin: 1.1, alphaMax: 1.5 },
  { id: 'hydraulic', label: 'Hydraulisch, reibungs- und torsionsfrei', alphaMin: 1.1, alphaMax: 1.4 },
  { id: 'yield', label: 'Streckgrenzgesteuert', alphaMin: 1.2, alphaMax: 1.4 },
  { id: 'angle', label: 'Drehwinkelgesteuert', alphaMin: 1.2, alphaMax: 1.4 },
  { id: 'torque-tested', label: 'Drehmomentgesteuert, Sollmoment am Originalteil ermittelt', alphaMin: 1.4, alphaMax: 1.6 },
  { id: 'torque-B', label: 'Drehmomentschlüssel, Reibung geschätzt (Reibungszahlklasse B)', alphaMin: 1.6, alphaMax: 2.0 },
  { id: 'torque-A', label: 'Drehmomentschlüssel, Reibung geschätzt (Reibungszahlklasse A)', alphaMin: 1.7, alphaMax: 2.5 },
  { id: 'impact', label: 'Schlagschrauber oder von Hand', alphaMin: 2.5, alphaMax: 4 },
]

/** Streuung der Montagevorspannkraft ±ΔFM/(2·FMm) = (αA − 1)/(αA + 1) */
export const preloadScatter = (alphaA: number): number => (alphaA - 1) / (alphaA + 1)

/** Reibungszahlklassen nach VDI 2230 Blatt 1, Tabelle A5 (Bereich für µG und µK) */
export const FRICTION_CLASSES = [
  { id: 'A', min: 0.04, max: 0.1 },
  { id: 'B', min: 0.08, max: 0.16 },
  { id: 'C', min: 0.14, max: 0.24 },
  { id: 'D', min: 0.2, max: 0.35 },
] as const
