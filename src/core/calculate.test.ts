import { describe, expect, it } from 'vitest'
import { calculate, permissibleAssemblyPreload, plateResilience } from './calculate'
import { coarseThread } from './data/threads'
import { totalEmbedding } from './data/embedding'
import { headDimensions, nutDimensions } from './data/fasteners'

/** relative Abweichung prüfen */
const near = (actual: number, expected: number, tol = 0.01) =>
  expect(Math.abs(actual - expected) / Math.abs(expected)).toBeLessThan(tol)

describe('Gewindegeometrie (Vergleich mit VDI 2230 Tabelle A11)', () => {
  const cases: [string, number, number, number][] = [
    // Name, d2, AS, Ad3
    ['M6', 5.35, 20.1, 17.89],
    ['M8', 7.188, 36.6, 32.84],
    ['M10', 9.026, 58.0, 52.3],
    ['M12', 10.863, 84.3, 76.25],
    ['M16', 14.701, 157, 144.1],
    ['M20', 18.376, 245, 225.2],
    ['M24', 22.051, 353, 324.3],
    ['M30', 27.727, 561, 519.0],
    ['M36', 33.402, 817, 759.3],
  ]
  it.each(cases)('%s', (name, d2, AS, Ad3) => {
    const t = coarseThread(name)
    near(t.d2, d2, 0.001)
    near(t.AS, AS, 0.003)
    near(t.Ad3, Ad3, 0.003)
  })
})

describe('Zulässige Montagevorspannkraft (Vergleich mit Tabelle A1)', () => {
  it('M12, 10.9, µG = 0,1 ergibt etwa 64,8 kN', () => {
    near(permissibleAssemblyPreload(coarseThread('M12'), 940, 0.1), 64800, 0.005)
  })
})

describe('Setzbeträge (Tabelle 5)', () => {
  it('ESV, Rz 16, axial: Gewinde + Kopf + 1 Trennfuge = 8 µm', () => {
    expect(totalEmbedding('10to40', 'axial', 1, 1)).toBeCloseTo(0.008, 6)
  })
})

/**
 * Rechenbeispiel B1 aus VDI 2230 Blatt 1, Anhang B:
 * Kolben/Kolbenstange eines Hydraulikzylinders, ISO 4762 M12×60-10.9,
 * zentrisch verspannt und zentrisch belastet.
 */
describe('Rechenbeispiel B1 (Hydraulikzylinder)', () => {
  const thread = coarseThread('M12')
  const result = calculate({
    thread,
    strengthClass: '10.9',
    headForm: 'socket',
    jointType: 'ESV',
    dW: 17.23,
    dh: 13.5,
    lK: 42,
    lShank: 24,
    DA: 80,
    DAsub: 80,
    EP: 205000,
    pG: 1300,
    // Beispiel rechnet die Plattennachgiebigkeit näherungsweise als DSV
    // mit gemitteltem Auflagedurchmesser (dW + DSt) / 2
    dWPlate: (17.23 + 25) / 2,
    plateModel: 'DSV',
    alphaA: 1.8,
    muGmin: 0.1,
    muKmin: 0.1,
    n: 0.35,
    fZ: 0.008,
    FAmax: 24900,
    FKP: 1000,
  })
  const v = result.values
  const step = (id: string) => result.steps.find((s) => s.id === id)!
  const quantity = (id: string, symbol: string) => step(id).quantities.find((x) => x.symbol === symbol)!.value

  it('R3: Nachgiebigkeit der Schraube δS = 2,95·10⁻⁶ mm/N', () => near(v.deltaS, 2.95e-6))
  it('R3: tan φD = 0,566 und DA,Gr = 44,9 mm', () => {
    near(v.plate.tanPhi, 0.566, 0.002)
    near(v.plate.DAGr, 44.9, 0.002)
    expect(v.plate.case).toBe('cone')
  })
  it('R3: Plattennachgiebigkeit δP = 0,363·10⁻⁶ mm/N', () => near(v.deltaP, 0.363e-6))
  it('R3: ΦK = 0,16 und Φn = 0,056', () => {
    near(v.PhiK, 0.161, 0.01)
    near(v.Phi, 0.056, 0.01)
  })
  it('R4: FZ = 2415 N', () => near(v.FZ, 2415))
  it('R5: FM,min = 26 921 N', () => near(v.FMmin, 26921))
  it('R6: FM,max = 48 458 N', () => near(v.FMmax, 48458))
  it('R7: FM,zul ≈ 64,8 kN ≥ FM,max', () => {
    near(v.FMzul, 64800, 0.005)
    expect(step('R7').checks[0].ok).toBe(true)
  })
  it('R8: FS,max = 66 194 N, σred,B = 819 N/mm², SF = 1,15', () => {
    near(v.FSmax, 66194)
    near(quantity('R8', 'σ_red,B'), 819)
    near(step('R8').checks[0].safety, 1.15)
  })
  it('R9: σASV = 48,9 N/mm², dauerfest', () => {
    near(quantity('R9', 'σ_ASV'), 48.9, 0.002)
    expect(step('R9').checks[0].ok).toBe(true)
  })
  it('R10: Ap,min = 90 mm², pM,max = 720 N/mm², Sp = 1,8', () => {
    near(quantity('R10', 'A_p,min'), 90)
    near(quantity('R10', 'p_M,max'), 720)
    near(step('R10').checks[0].safety, 1.8, 0.01)
  })
  it('R13: MA = 108 N·m', () => near(v.MA, 108))
  it('Gesamtergebnis: alle Nachweise erfüllt', () => expect(result.ok).toBe(true))
})

describe('Plattennachgiebigkeit: Fallunterscheidung', () => {
  it('kleiner Außendurchmesser ergibt Kegel und Hülse', () => {
    const r = plateResilience('DSV', 17, 13.5, 40, 25, 25, 205000)
    expect(r.case).toBe('cone+sleeve')
    expect(r.lH).toBeGreaterThan(0)
  })
  it('DA ≤ dW ergibt reine Hülse', () => {
    const r = plateResilience('DSV', 17, 13.5, 40, 16, 16, 205000)
    expect(r.case).toBe('sleeve')
    near(r.deltaP, (4 * 40) / (205000 * Math.PI * (16 ** 2 - 13.5 ** 2)))
  })
  it('Übergang Kegel/Hülse ist stetig bei DA = DA,Gr', () => {
    const ref = plateResilience('DSV', 17, 13.5, 40, 200, 60, 205000)
    const a = plateResilience('DSV', 17, 13.5, 40, ref.DAGr - 1e-6, 60, 205000)
    const b = plateResilience('DSV', 17, 13.5, 40, ref.DAGr + 1e-6, 60, 205000)
    near(a.deltaP, b.deltaP, 1e-4)
  })
})

describe('Kopf- und Mutternmaße (Stichproben aus den Normen)', () => {
  it('ISO 4762 M12: dK = 18, dW = 17,23', () => {
    expect(headDimensions('ISO4762', 'M12')).toMatchObject({ dK: 18, dW: 17.23, k: 12 })
  })
  it('ISO 4017:2022 M4: dW = 6,20, M30 (Produktklasse B): dW = 42,75, s = 46', () => {
    expect(headDimensions('ISO4017', 'M4').dW).toBe(6.2)
    expect(headDimensions('ISO4017', 'M30')).toMatchObject({ dK: 46, dW: 42.75 })
  })
  it('ISO 4032:2023 M24: s = 36, dW = 33,25, m = 21,5', () => {
    expect(nutDimensions('M24')).toMatchObject({ s: 36, dW: 33.25, m: 21.5 })
  })
})
