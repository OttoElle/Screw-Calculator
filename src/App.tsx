import { useMemo, useState } from 'react'
import { calculate, type BoltJointResult } from './core/calculate'
import { InputForm } from './ui/InputForm'
import { StepList, Summary, UtilizationBars } from './ui/Results'
import { JointDiagram } from './ui/JointDiagram'
import { JointSketch } from './ui/JointSketch'
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
        <div className="actions">
          <button type="button" onClick={() => replace(EXAMPLE_B1)}>
            Beispiel B1 laden
          </button>
          <button type="button" className="secondary" onClick={() => replace(DEFAULT_STATE)}>
            Zurücksetzen
          </button>
        </div>
      </header>

      <main className="layout">
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
        Ergebnisse ohne Gewähr. Kopf-, Mutter- und Bohrungsmaße nach ISO 4762, 4017, 4032 und 273. Nicht berücksichtigt:
        exzentrische Belastung, Temperatur, Einschraubtiefe (R11).
      </footer>
    </div>
  )
}
