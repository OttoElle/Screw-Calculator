/** Festigkeitsklassen nach DIN EN ISO 898-1 (Mindestwerte) */

export type StrengthClass = '8.8' | '10.9' | '12.9'

export const STRENGTH_CLASSES: StrengthClass[] = ['8.8', '10.9', '12.9']

export interface StrengthValues {
  /** Mindeststreckgrenze Rp0,2min in N/mm² */
  Rp02min: number
  /** Mindestzugfestigkeit Rm,min in N/mm² */
  Rmmin: number
}

export function strengthValues(cls: StrengthClass, d: number): StrengthValues {
  switch (cls) {
    case '8.8':
      return d <= 16 ? { Rp02min: 640, Rmmin: 800 } : { Rp02min: 660, Rmmin: 830 }
    case '10.9':
      return { Rp02min: 940, Rmmin: 1040 }
    case '12.9':
      return { Rp02min: 1100, Rmmin: 1220 }
  }
}
