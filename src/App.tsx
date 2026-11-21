import { useMemo, useState } from 'react'
import { calculate, type BoltJointResult } from './core/calculate'
import { InputForm } from './ui/InputForm'
import { StepList, Summary, UtilizationBars } from './ui/Results'
import { JointDiagram } from './ui/JointDiagram'
import { JointSketch } from './ui/JointSketch'
import { Tables } from './ui/Tables'
import { DEFAULT_STATE, EXAMPLE_B1, toInput, validate, type Derived, type FormState } from './ui/state'
import './App.css'

const STORAGE_KEY = 'schraubenrechner.state.v1'

function loadState(): FormState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    // Speicher nicht verfügbar
  }
  return DEFAULT_STATE
}

function saveState(s: FormState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Speicher nicht verfügbar
  }
}

export default function App() {
  const [state, setState] = useState<FormState>(loadState)
  const [tab, setTab] = useState<'calc' | 'tables'>('calc')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((prev) => {
      const next = { ...prev, [key]: value }
      saveState(next)
      return next
    })

  const replace = (s: FormState) => {
    setState(s)
    saveState(s)
  }

  const { derived, errors, result } = useMemo(() => {
    let derived: Derived | null = null
    let result: BoltJointResult | null = null
    let errors: string[] = []
    try {
      derived = toInput(state)
      errors = validate(state, derived)
      if (errors.length === 0) {
        result = calculate(derived.input)
        const v = result.values
        if (![v.deltaS, v.deltaP, v.FMzul, v.MA].every(Number.isFinite))
          errors = ['Mit diesen Eingaben lässt sich die Verbindung nicht berechnen. Bitte Abmessungen prüfen.']
      }
    } catch (e) {
      errors = [e instanceof Error ? e.message : String(e)]
    }
    return { derived, errors, result: errors.length ? null : result }
  }, [state])

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Schraubenrechner</h1>
          <p className="subtitle">Zentrisch verspannte und belastete Einschraubenverbindungen nach VDI 2230 Blatt 1</p>
        </div>
        {tab === 'calc' && (
          <div className="actions">
            <button type="button" onClick={() => replace(EXAMPLE_B1)}>
              Beispiel B1 laden
            </button>
            <button type="button" className="secondary" onClick={() => replace(DEFAULT_STATE)}>
              Zurücksetzen
            </button>
          </div>
        )}
      </header>

      <nav className="tabs" role="tablist" aria-label="Ansicht">
        <button type="button" role="tab" aria-selected={tab === 'calc'} className={tab === 'calc' ? 'active' : ''} onClick={() => setTab('calc')}>
          Berechnung
        </button>
        <button type="button" role="tab" aria-selected={tab === 'tables'} className={tab === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>
          Tabellen
        </button>
      </nav>

      {tab === 'tables' && <Tables />}

      <main className="layout" hidden={tab !== 'calc'}>
        <aside className="panel">
          <InputForm state={state} derived={derived} set={set} />
        </aside>
        <div className="output">
          {errors.length > 0 && (
            <section className="card errors" role="alert">
              <h2>Eingaben prüfen</h2>
              <ul>
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </section>
          )}
          {result && derived && (
            <>
              <Summary result={result} />
              <UtilizationBars result={result} />
              <div className="visuals">
                <JointDiagram result={result} input={derived.input} />
                <JointSketch
                  input={derived.input}
                  plate={result.values.plate}
                  size={state.size}
                  dK={derived.dK}
                  k={derived.k}
                  plates={Math.max(1, Math.round(state.plates))}
                />
              </div>
              <StepList result={result} />
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        Ergebnisse ohne Gewähr. Kopf- und Mutternmaße nach DIN EN ISO 4762, 4017 und 4032, Bohrungen nach ISO 273. Nicht berücksichtigt:
        exzentrische Belastung, Temperatur, Einschraubtiefe (R11).
      </footer>
    </div>
  )
}
