/**
 * Auswahl von Werkstoffen für verschraubte Bauteile
 * (Richtwerte nach VDI 2230 Blatt 1, Tabelle A9). Festigkeiten in N/mm².
 */

export interface Material {
  name: string
  number: string
  group: string
  /** Zugfestigkeit Rm,min */
  Rm: number
  /** 0,2%-Dehngrenze Rp0,2min */
  Rp02: number
  /** Scherfestigkeit τB,min */
  tauB: number
  /** Grenzflächenpressung pG */
  pG: number
  /** Elastizitätsmodul E */
  E: number
}

const STEEL_E = 205000
const AUSTENITE_E = 200000
const WROUGHT_AL_E = 75000

export const MATERIALS: Material[] = [
  { group: 'Unlegierte Baustähle', name: 'S235JR', number: '1.0036', Rm: 340, Rp02: 230, tauB: 290, pG: 490, E: STEEL_E },
  { group: 'Unlegierte Baustähle', name: 'E295', number: '1.0050', Rm: 470, Rp02: 270, tauB: 380, pG: 710, E: STEEL_E },
  { group: 'Unlegierte Baustähle', name: 'S355J0', number: '1.0553', Rm: 490, Rp02: 325, tauB: 390, pG: 760, E: STEEL_E },
  { group: 'Feinkorn-Baustähle', name: 'S315MC', number: '1.0972', Rm: 390, Rp02: 315, tauB: 420, pG: 540, E: STEEL_E },
  { group: 'Feinkorn-Baustähle', name: 'S420MC', number: '1.0980', Rm: 480, Rp02: 420, tauB: 370, pG: 670, E: STEEL_E },
  { group: 'Vergütungsstähle', name: 'C45 (Cq45)', number: '1.1192', Rm: 700, Rp02: 430, tauB: 460, pG: 770, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '38MnSiVS5', number: '1.5231', Rm: 900, Rp02: 600, tauB: 580, pG: 990, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '34CrNiMo6', number: '1.6582', Rm: 1100, Rp02: 900, tauB: 720, pG: 1430, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '37Cr4', number: '1.7034', Rm: 850, Rp02: 630, tauB: 720, pG: 1105, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '16MnCr5', number: '1.7131', Rm: 1000, Rp02: 850, tauB: 850, pG: 1300, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '42CrMo4', number: '1.7225', Rm: 1000, Rp02: 750, tauB: 660, pG: 1300, E: STEEL_E },
  { group: 'Vergütungsstähle', name: '34CrMo4', number: '1.7220', Rm: 900, Rp02: 650, tauB: 590, pG: 1170, E: STEEL_E },
  { group: 'Austenitische CrNi-Stähle', name: 'X5CrNi18-10', number: '1.4301', Rm: 520, Rp02: 210, tauB: 410, pG: 630, E: AUSTENITE_E },
  { group: 'Austenitische CrNi-Stähle', name: 'X5CrNiMo17-12-2', number: '1.4401', Rm: 530, Rp02: 220, tauB: 410, pG: 630, E: AUSTENITE_E },
  { group: 'Gusseisen', name: 'EN-GJL-250', number: '0.6025', Rm: 250, Rp02: 165, tauB: 290, pG: 850, E: 110000 },
  { group: 'Gusseisen', name: 'EN-GJS-400', number: '0.7040', Rm: 400, Rp02: 280, tauB: 360, pG: 600, E: 169000 },
  { group: 'Gusseisen', name: 'EN-GJS-500', number: '0.7050', Rm: 500, Rp02: 350, tauB: 450, pG: 750, E: 169000 },
  { group: 'Gusseisen', name: 'EN-GJS-600', number: '0.7060', Rm: 600, Rp02: 420, tauB: 540, pG: 900, E: 174000 },
  { group: 'Aluminium-Knetlegierungen', name: 'AlMgSi1 F31', number: '3.2315.62', Rm: 290, Rp02: 250, tauB: 170, pG: 360, E: WROUGHT_AL_E },
  { group: 'Aluminium-Knetlegierungen', name: 'AlZnMgCu1,5', number: '3.4365.71', Rm: 540, Rp02: 470, tauB: 330, pG: 540, E: WROUGHT_AL_E },
  { group: 'Aluminium-Gusslegierungen', name: 'G-AlSi7Mg0,3', number: '3.2371.61', Rm: 230, Rp02: 190, tauB: 120, pG: 290, E: 75000 },
  { group: 'Aluminium-Gusslegierungen', name: 'G-AlSi10Mg', number: '3.2381.01', Rm: 220, Rp02: 180, tauB: 115, pG: 275, E: 73000 },
  { group: 'Magnesiumlegierungen', name: 'GK-AZ91-T4', number: '–', Rm: 240, Rp02: 120, tauB: 140, pG: 290, E: 45000 },
  { group: 'Titanlegierung', name: 'TiAl6V4', number: '3.7165.10', Rm: 890, Rp02: 820, tauB: 600, pG: 1340, E: 110000 },
]

export function materialByName(name: string): Material {
  const m = MATERIALS.find((x) => x.name === name)
  if (!m) throw new Error(`Unbekannter Werkstoff: ${name}`)
  return m
}
