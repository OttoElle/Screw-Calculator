import type { ReactNode } from 'react'
import { THREAD_SIZES, coarseThread } from '../core/data/threads'
import { STRENGTH_CLASSES, strengthValues } from '../core/data/strengthClasses'
import { MATERIALS } from '../core/data/materials'
import { ROUGHNESS_LABELS, embeddingValues, type Roughness } from '../core/data/embedding'
import { FRICTION_CLASSES, TIGHTENING_METHODS, preloadScatter } from '../core/data/tightening'
import { clearanceHole, headDimensions, nutDimensions } from '../core/data/fasteners'
import { fmt } from './format'
import { Rich } from './Fields'

const tableNum = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 })

function DataTable({
  id,
  title,
  source,
  head,
  rows,
}: {
  id: string
  title: string
  source: string
  head: ReactNode[]
  rows: ReactNode[][]
}) {
  return (
    <section className="card" id={id}>
      <h2>{title}</h2>
      <p className="hint">
        <Rich text={source} />
      </p>
      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} scope="col" className={rows.length > 0 && typeof rows[0][i] === 'number' ? 'num' : undefined}>
                  <Rich text={h} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className={typeof c === 'number' ? 'num' : undefined}>
                    {typeof c === 'number' ? tableNum.format(c) : c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const SECTIONS = [
  ['t-threads', 'Gewinde'],
  ['t-strength', 'Festigkeitsklassen'],
  ['t-fasteners', 'Kopf, Mutter, Bohrung'],
  ['t-materials', 'Werkstoffe'],
  ['t-tightening', 'Anziehfaktoren'],
  ['t-friction', 'Reibungszahlklassen'],
  ['t-embedding', 'Setzbeträge'],
] as const

export function Tables() {
  const roughness = Object.keys(ROUGHNESS_LABELS) as Roughness[]
  return (
    <div className="tables">
      <nav className="card toc" aria-label="Tabellen">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>

      <DataTable
        id="t-threads"
        title="Metrisches ISO-Regelgewinde"
        source="Steigung nach ISO 261, Querschnitte nach DIN 13-28 berechnet (vgl. VDI 2230 Tabelle A11). Längen in mm, Flächen in mm²."
        head={['Gewinde', 'P', 'd₂', 'd₃', 'D₁', 'A_N', 'A_S', 'A_d3']}
        rows={THREAD_SIZES.map((s) => {
          const t = coarseThread(s)
          return [s, t.P, t.d2, t.d3, t.D1, t.AN, t.AS, t.Ad3]
        })}
      />

      <DataTable
        id="t-strength"
        title="Festigkeitsklassen"
        source="Mindestwerte nach DIN EN ISO 898-1, in N/mm²."
        head={['Klasse', 'R_p0,2min (d ≤ 16)', 'R_m,min (d ≤ 16)', 'R_p0,2min (d > 16)', 'R_m,min (d > 16)']}
        rows={STRENGTH_CLASSES.map((c) => {
          const a = strengthValues(c, 16)
          const b = strengthValues(c, 20)
          return [c, a.Rp02min, a.Rmmin, b.Rp02min, b.Rmmin]
        })}
      />

      <DataTable
        id="t-fasteners"
        title="Kopf-, Mutter- und Bohrungsmaße"
        source="ISO 4762 (Zylinderschraube), ISO 4017 (Sechskantschraube), ISO 4032 (Mutter), ISO 273 (Durchgangsbohrung). Maße in mm. Bitte vor einem echten Nachweis gegen ein Tabellenbuch prüfen."
        head={[
          'Gewinde',
          '4762 d_K',
          '4762 d_W',
          '4762 k',
          '4017 s',
          '4017 d_W',
          '4017 k',
          '4032 s',
          '4032 m',
          'd_h fein',
          'd_h mittel',
          'd_h grob',
        ]}
        rows={THREAD_SIZES.map((s) => {
          const a = headDimensions('ISO4762', s)
          const b = headDimensions('ISO4017', s)
          const n = nutDimensions(s)
          return [s, a.dK, a.dW, a.k, b.dK, b.dW, b.k, n.s, n.m, clearanceHole(s, 'fein'), clearanceHole(s, 'mittel'), clearanceHole(s, 'grob')]
        })}
      />

      <DataTable
        id="t-materials"
        title="Werkstoffe der verspannten Teile"
        source="Auswahl nach VDI 2230 Tabelle A9, Festigkeiten und E-Modul in N/mm²."
        head={['Gruppe', 'Werkstoff', 'Nr.', 'R_m', 'R_p0,2', 'τ_B', 'p_G', 'E']}
        rows={MATERIALS.map((m) => [m.group, m.name, m.number, m.Rm, m.Rp02, m.tauB, m.pG, m.E])}
      />

      <DataTable
        id="t-tightening"
        title="Anziehfaktoren"
        source="Zusammengefasst nach VDI 2230 Tabelle A8. Streuung der Vorspannkraft ±(α_A − 1)/(α_A + 1)."
        head={['Anziehverfahren', 'α_A von', 'α_A bis', 'Streuung']}
        rows={TIGHTENING_METHODS.map((m) => [
          m.label,
          m.alphaMin,
          m.alphaMax,
          `±${fmt(preloadScatter(m.alphaMin) * 100, 2)} % bis ±${fmt(preloadScatter(m.alphaMax) * 100, 2)} %`,
        ])}
      />

      <DataTable
        id="t-friction"
        title="Reibungszahlklassen"
        source="Nach VDI 2230 Tabelle A5, Bereich für µ_G und µ_K."
        head={['Klasse', 'µ von', 'µ bis']}
        rows={FRICTION_CLASSES.map((c) => [c.id, c.min, c.max])}
      />

      <DataTable
        id="t-embedding"
        title="Setzbeträge"
        source="Richtwerte nach VDI 2230 Tabelle 5 für Teile aus Stahl ohne Beschichtung, in µm."
        head={['Rauheit', 'Belastung', 'im Gewinde', 'je Kopf-/Mutternauflage', 'je innere Trennfuge']}
        rows={roughness.flatMap((r) =>
          (['axial', 'shear'] as const).map((l) => {
            const v = embeddingValues(r, l)
            return [ROUGHNESS_LABELS[r], l === 'axial' ? 'Zug/Druck' : 'Schub', v.thread, v.bearing, v.interface]
          }),
        )}
      />
    </div>
  )
}
