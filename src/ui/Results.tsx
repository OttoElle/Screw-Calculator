import type { BoltJointResult, Check } from '../core/calculate'
import { Rich, Sym } from './Fields'
import { fmt, kN } from './format'

export function Summary({ result }: { result: BoltJointResult }) {
  const v = result.values
  const checks = result.steps.flatMap((s) => s.checks.map((c) => ({ ...c, step: s.id })))
  const failed = checks.filter((c) => !c.ok)
  const open = v.FKRmin <= 0
  return (
    <section className={`card summary ${result.ok ? 'ok' : 'fail'}`}>
      <div className="verdict">
        <span className="badge">{result.ok ? 'Alle Nachweise erfüllt' : 'Nachweis nicht erfüllt'}</span>
        {!result.ok && (
          <span className="verdict-detail">
            <Rich text={[...failed.map((c) => `${c.step}: ${c.label}`), ...(open ? ['Trennfuge öffnet sich'] : [])].join(' · ')} />
          </span>
        )}
      </div>
      <dl className="kpis">
        <div>
          <dt>Anziehdrehmoment</dt>
          <dd>{fmt(v.MA, 3)} N·m</dd>
        </div>
        <div>
          <dt>
            <Sym s="F_M,zul" /> zulässige Vorspannkraft
          </dt>
          <dd>{kN(v.FMzul)}</dd>
        </div>
        <div>
          <dt>
            <Sym s="F_M,max" /> erforderlich
          </dt>
          <dd>{kN(v.FMmax)}</dd>
        </div>
        <div>
          <dt>
            <Sym s="Φ_n" /> Kraftverhältnis
          </dt>
          <dd>{fmt(v.Phi, 3)}</dd>
        </div>
      </dl>
    </section>
  )
}

/** Auslastung = erforderliche / vorhandene Sicherheit, 100 % entspricht der Mindestsicherheit */
export function UtilizationBars({ result }: { result: BoltJointResult }) {
  const checks: (Check & { step: string })[] = result.steps.flatMap((s) =>
    s.checks.map((c) => ({ ...c, step: s.id })),
  )
  return (
    <section className="card">
      <h2>Auslastung der Nachweise</h2>
      <p className="hint">100 % entspricht der geforderten Mindestsicherheit.</p>
      <ul className="bars">
        {checks.map((c) => {
          const util = c.required / c.safety
          const width = Math.min(Math.max(util, 0), 1.5) / 1.5
          return (
            <li key={c.step + c.label} className={c.ok ? 'ok' : 'fail'}>
              <div className="bar-label">
                <span>
                  <span className="step-tag">{c.step}</span> <Rich text={c.label} />
                </span>
                <span className="bar-value">
                  S = {fmt(c.safety, 3)} (min. {fmt(c.required, 2)}) · {fmt(util * 100, 3)} %
                </span>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div className="bar-fill" style={{ width: `${width * 100}%` }} />
                <div className="bar-limit" style={{ left: `${(1 / 1.5) * 100}%` }} />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function StepList({ result }: { result: BoltJointResult }) {
  return (
    <section className="card">
      <h2>Rechenschritte</h2>
      <div className="steps">
        {result.steps.map((s) => {
          const ok = s.checks.every((c) => c.ok)
          return (
            <details key={s.id} className="step" open={!ok}>
              <summary>
                <span className="step-tag">{s.id}</span>
                <span className="step-title">{s.title}</span>
                {s.checks.length > 0 && <span className={`dot ${ok ? 'ok' : 'fail'}`} aria-label={ok ? 'erfüllt' : 'nicht erfüllt'} />}
              </summary>
              {s.quantities.length > 0 && (
                <table>
                  <tbody>
                    {s.quantities.map((q) => (
                      <tr key={q.symbol}>
                        <th scope="row">
                          <Sym s={q.symbol} />
                        </th>
                        <td className="q-label">{q.label}</td>
                        <td className="num">{fmt(q.value)}</td>
                        <td className="q-unit">{q.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {s.checks.map((c) => (
                <p key={c.label} className={`check ${c.ok ? 'ok' : 'fail'}`}>
                  {c.ok ? '✓' : '✗'} <Rich text={c.label} />: {fmt(c.safety, 3)} {c.ok ? '≥' : '<'} {fmt(c.required, 2)}
                </p>
              ))}
              {s.notes.map((n) => (
                <p key={n} className="note">
                  <Rich text={n} />
                </p>
              ))}
            </details>
          )
        })}
      </div>
    </section>
  )
}
