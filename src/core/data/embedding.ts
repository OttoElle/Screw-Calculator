/**
 * Richtwerte für Setzbeträge (VDI 2230 Blatt 1, Tabelle 5) für Schrauben,
 * Muttern und kompakte verspannte Teile aus Stahl ohne Beschichtung, in µm.
 */

export type Roughness = 'lt10' | '10to40' | '40to160'
export type EmbeddingLoad = 'axial' | 'shear'

export const ROUGHNESS_LABELS: Record<Roughness, string> = {
  lt10: 'Rz < 10 µm',
  '10to40': '10 µm ≤ Rz < 40 µm',
  '40to160': '40 µm ≤ Rz < 160 µm',
}

interface EmbeddingValues {
  /** im Gewinde */
  thread: number
  /** je Kopf- oder Mutternauflage */
  bearing: number
  /** je innere Trennfuge */
  interface: number
}

const TABLE5: Record<Roughness, Record<EmbeddingLoad, EmbeddingValues>> = {
  lt10: {
    axial: { thread: 3, bearing: 2.5, interface: 1.5 },
    shear: { thread: 3, bearing: 3, interface: 2 },
  },
  '10to40': {
    axial: { thread: 3, bearing: 3, interface: 2 },
    shear: { thread: 3, bearing: 4.5, interface: 2.5 },
  },
  '40to160': {
    axial: { thread: 3, bearing: 4, interface: 3 },
    shear: { thread: 3, bearing: 6.5, interface: 3.5 },
  },
}

export function embeddingValues(rz: Roughness, load: EmbeddingLoad): EmbeddingValues {
  return TABLE5[rz][load]
}

/**
 * Gesamtsetzbetrag fZ in mm.
 * @param bearings Anzahl Kopf-/Mutternauflagen (DSV: 2, ESV: 1)
 * @param interfaces Anzahl innerer Trennfugen
 */
export function totalEmbedding(
  rz: Roughness,
  load: EmbeddingLoad,
  bearings: number,
  interfaces: number,
): number {
  const v = embeddingValues(rz, load)
  return (v.thread + bearings * v.bearing + interfaces * v.interface) / 1000
}
