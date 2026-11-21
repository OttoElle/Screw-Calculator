/**
 * Abmessungen von Schraubenköpfen, Muttern und Durchgangsbohrungen.
 * Diese Werte stehen nicht in der VDI 2230, sondern in den Produktnormen:
 * - DIN EN ISO 4762:2004-06 Zylinderschraube mit Innensechskant (dK max, dW min, k max = d)
 * - DIN EN ISO 4017:2022-10 Sechskantschraube (s, dW min, k Nennmaß = Mittel aus kmin/kmax);
 *   M4 bis M24 Produktklasse A, M30 und M36 Produktklasse B
 * - DIN EN ISO 4032:2023-12 Sechskantmutter (s, dW min, m max)
 * - ISO 273 Durchgangslöcher (fein, mittel, grob), noch nicht gegen die Norm geprüft
 * Werte in mm. Die Werte nach ISO 4762, 4017 und 4032 sind mit den Normtexten abgeglichen.
 */

export type HeadType = 'ISO4762' | 'ISO4017'
export type HoleSeries = 'fein' | 'mittel' | 'grob'

export interface HeadDimensions {
  /** Kopfdurchmesser bzw. Schlüsselweite in mm */
  dK: number
  /** Auflagedurchmesser dW (min) in mm */
  dW: number
  /** Kopfhöhe k in mm */
  k: number
}

const ISO4762: Record<string, HeadDimensions> = {
  M4: { dK: 7, dW: 6.53, k: 4 },
  M5: { dK: 8.5, dW: 8.03, k: 5 },
  M6: { dK: 10, dW: 9.38, k: 6 },
  M8: { dK: 13, dW: 12.33, k: 8 },
  M10: { dK: 16, dW: 15.33, k: 10 },
  M12: { dK: 18, dW: 17.23, k: 12 },
  M14: { dK: 21, dW: 20.17, k: 14 },
  M16: { dK: 24, dW: 23.17, k: 16 },
  M20: { dK: 30, dW: 28.87, k: 20 },
  M24: { dK: 36, dW: 34.81, k: 24 },
  M30: { dK: 45, dW: 43.61, k: 30 },
  M36: { dK: 54, dW: 52.54, k: 36 },
}

const ISO4017: Record<string, HeadDimensions> = {
  M4: { dK: 7, dW: 6.2, k: 2.8 },
  M5: { dK: 8, dW: 7.2, k: 3.5 },
  M6: { dK: 10, dW: 8.88, k: 4 },
  M8: { dK: 13, dW: 11.63, k: 5.3 },
  M10: { dK: 16, dW: 14.63, k: 6.4 },
  M12: { dK: 18, dW: 16.63, k: 7.5 },
  M14: { dK: 21, dW: 19.64, k: 8.8 },
  M16: { dK: 24, dW: 22.49, k: 10 },
  M20: { dK: 30, dW: 28.19, k: 12.5 },
  M24: { dK: 36, dW: 33.61, k: 15 },
  M30: { dK: 46, dW: 42.75, k: 18.7 },
  M36: { dK: 55, dW: 51.11, k: 22.5 },
}

export interface NutDimensions {
  /** Schlüsselweite s in mm */
  s: number
  /** Auflagedurchmesser dW (min) in mm */
  dW: number
  /** Mutterhöhe m in mm */
  m: number
}

const ISO4032: Record<string, NutDimensions> = {
  M4: { s: 7, dW: 6.2, m: 3.2 },
  M5: { s: 8, dW: 7.2, m: 4.7 },
  M6: { s: 10, dW: 8.88, m: 5.2 },
  M8: { s: 13, dW: 11.63, m: 6.8 },
  M10: { s: 16, dW: 14.63, m: 8.4 },
  M12: { s: 18, dW: 16.63, m: 10.8 },
  M14: { s: 21, dW: 19.64, m: 12.8 },
  M16: { s: 24, dW: 22.49, m: 14.8 },
  M20: { s: 30, dW: 27.7, m: 18 },
  M24: { s: 36, dW: 33.25, m: 21.5 },
  M30: { s: 46, dW: 42.75, m: 25.6 },
  M36: { s: 55, dW: 51.11, m: 31 },
}

const ISO273: Record<string, Record<HoleSeries, number>> = {
  M4: { fein: 4.3, mittel: 4.5, grob: 4.8 },
  M5: { fein: 5.3, mittel: 5.5, grob: 5.8 },
  M6: { fein: 6.4, mittel: 6.6, grob: 7 },
  M8: { fein: 8.4, mittel: 9, grob: 10 },
  M10: { fein: 10.5, mittel: 11, grob: 12 },
  M12: { fein: 13, mittel: 13.5, grob: 14.5 },
  M14: { fein: 15, mittel: 15.5, grob: 16.5 },
  M16: { fein: 17, mittel: 17.5, grob: 18.5 },
  M20: { fein: 21, mittel: 22, grob: 24 },
  M24: { fein: 25, mittel: 26, grob: 28 },
  M30: { fein: 31, mittel: 33, grob: 35 },
  M36: { fein: 37, mittel: 39, grob: 42 },
}

function lookup<T>(table: Record<string, T>, size: string, what: string): T {
  const v = table[size]
  if (!v) throw new Error(`Keine ${what}-Daten für ${size}`)
  return v
}

export const headDimensions = (type: HeadType, size: string): HeadDimensions =>
  lookup(type === 'ISO4762' ? ISO4762 : ISO4017, size, type)

export const nutDimensions = (size: string): NutDimensions => lookup(ISO4032, size, 'ISO 4032')

export const clearanceHole = (size: string, series: HoleSeries = 'mittel'): number =>
  lookup(ISO273, size, 'ISO 273')[series]
