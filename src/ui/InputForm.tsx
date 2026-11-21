import { THREAD_SIZES } from '../core/data/threads'
import { STRENGTH_CLASSES } from '../core/data/strengthClasses'
import { MATERIALS } from '../core/data/materials'
import { ROUGHNESS_LABELS, type Roughness } from '../core/data/embedding'
import { FRICTION_CLASSES, TIGHTENING_METHODS } from '../core/data/tightening'
import { NumberField, Segmented, SelectField } from './Fields'
import { defaultAlpha, type Derived, type FormState } from './state'
import { fmt } from './format'

interface Props {
  state: FormState
  derived: Derived | null
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void
}

export function InputForm({ state: s, derived, set }: Props) {
  const num = (key: keyof FormState) => (v: number | null) => set(key, (v ?? 0) as never)
  const opt = (key: keyof FormState) => (v: number | null) => set(key, v as never)
  const method = TIGHTENING_METHODS.find((m) => m.id === s.tightening)

  return (
    <form className="inputs" onSubmit={(e) => e.preventDefault()}>
      <fieldset>
        <legend>Schraube</legend>
        <div className="grid2">
          <SelectField
            label="Gewinde (Regelgewinde)"
            value={s.size}
            options={THREAD_SIZES.map((x) => ({ value: x, label: x }))}
            onChange={(v) => set('size', v)}
          />
          <SelectField
            label="Festigkeitsklasse"
            value={s.strengthClass}
            options={STRENGTH_CLASSES.map((x) => ({ value: x, label: x }))}
            onChange={(v) => set('strengthClass', v)}
          />
        </div>
        <SelectField
          label="Schraubenart"
          value={s.headType}
          options={[
            { value: 'ISO4017', label: 'Sechskantschraube ISO 4017' },
            { value: 'ISO4762', label: 'Zylinderschraube mit Innensechskant ISO 4762' },
          ]}
          onChange={(v) => set('headType', v)}
        />
        <Segmented
          label="Gewinde gefertigt"
          value={s.finish}
          options={[
            { value: 'SV', label: 'schlussvergütet' },
            { value: 'SG', label: 'schlussgewalzt' },
          ]}
          onChange={(v) => set('finish', v)}
        />
        {derived && (
          <p className="derived">
            d<sub>W</sub> = {fmt(derived.dW)} mm · d<sub>h</sub> = {fmt(derived.dh)} mm · d<sub>K</sub> ={' '}
            {fmt(derived.dK)} mm
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Verbindung</legend>
        <Segmented
          label="Verbindungsart"
          value={s.jointType}
          options={[
            { value: 'DSV', label: 'Durchsteckverbindung (Mutter)' },
            { value: 'ESV', label: 'Einschraubverbindung' },
          ]}
          onChange={(v) => set('jointType', v)}
        />
        <div className="grid2">
          <NumberField symbol="l_K" label="Klemmlänge" unit="mm" value={s.lK} onChange={num('lK')} />
          <NumberField
            symbol="l_1"
            label="Schaftlänge in l_K"
            unit="mm"
            value={s.lShank}
            onChange={num('lShank')}
            hint="Rest der Klemmlänge ist freies Gewinde"
          />
          <NumberField
            symbol="D_A"
            label="Außendurchmesser Trennfuge"
            unit="mm"
            value={s.DA}
            onChange={num('DA')}
          />
          <NumberField
            symbol="D'_A"
            label="Ersatzaußendurchmesser"
            unit="mm"
            value={s.DAsub}
            onChange={opt('DAsub')}
            optional
            placeholder="wie Trennfuge"
          />
        </div>
        <SelectField
          label="Durchgangsbohrung ISO 273"
          value={s.holeSeries}
          options={[
            { value: 'fein', label: 'fein' },
            { value: 'mittel', label: 'mittel' },
            { value: 'grob', label: 'grob' },
          ]}
          onChange={(v) => set('holeSeries', v)}
        />
        <div className="grid2">
          <SelectField
            label="Werkstoff der verspannten Teile"
            value={s.material}
            options={MATERIALS.map((m) => ({ value: m.name, label: m.name }))}
            onChange={(v) => set('material', v)}
            hint={(() => {
              const m = MATERIALS.find((x) => x.name === s.material)
              return m ? `E = ${fmt(m.E)} N/mm², p_G = ${fmt(m.pG)} N/mm²` : null
            })()}
          />
          <NumberField
            symbol="i"
            label={s.jointType === 'DSV' ? 'Anzahl Platten' : 'Anzahl Platten über dem Einschraubteil'}
            value={s.plates}
            onChange={num('plates')}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Montage</legend>
        <SelectField
          label="Anziehverfahren (Tabelle A8)"
          value={s.tightening}
          options={TIGHTENING_METHODS.map((m) => ({ value: m.id, label: m.label }))}
          onChange={(v) => {
            set('tightening', v)
            set('alphaA', defaultAlpha(v))
          }}
        />
        <div className="grid3">
          <NumberField
            symbol="α_A"
            label="Anziehfaktor"
            value={s.alphaA}
            onChange={num('alphaA')}
            hint={method ? `Richtwert ${fmt(method.alphaMin)} bis ${fmt(method.alphaMax)}` : undefined}
          />
          <NumberField symbol="µ_G" label="Reibung Gewinde (min)" value={s.muG} onChange={num('muG')} />
          <NumberField symbol="µ_K" label="Reibung Kopf (min)" value={s.muK} onChange={num('muK')} />
        </div>
        <p className="hint">
          Reibungszahlklassen (Tabelle A5):{' '}
          {FRICTION_CLASSES.map((c) => `${c.id} ${fmt(c.min)}–${fmt(c.max)}`).join(' · ')}
        </p>
        <SelectField<Roughness>
          label="Rauheit der Auflageflächen (Setzbeträge, Tabelle 5)"
          value={s.rz}
          options={(Object.keys(ROUGHNESS_LABELS) as Roughness[]).map((k) => ({ value: k, label: ROUGHNESS_LABELS[k] }))}
          onChange={(v) => set('rz', v)}
          hint={derived ? `Setzbetrag f_Z = ${fmt(derived.fZ * 1000)} µm` : undefined}
        />
      </fieldset>

      <fieldset>
        <legend>Belastung</legend>
        <div className="grid2">
          <NumberField symbol="F_A,max" label="axiale Betriebskraft max" unit="kN" value={s.FAmax} onChange={num('FAmax')} />
          <NumberField
            symbol="F_A,min"
            label="axiale Betriebskraft min"
            unit="kN"
            value={s.FAmin}
            onChange={num('FAmin')}
            hint="gleich F_A,max bei statischer Last"
          />
          <NumberField symbol="F_Q,max" label="Querkraft" unit="kN" value={s.FQmax} onChange={num('FQmax')} />
          <NumberField symbol="F_KP" label="Mindestklemmkraft Dichten" unit="kN" value={s.FKP} onChange={num('FKP')} />
        </div>
        {s.FQmax > 0 && (
          <div className="grid2">
            <NumberField symbol="µ_T" label="Haftreibung Trennfuge (min)" value={s.muT} onChange={num('muT')} hint="Tabelle A6" />
            <NumberField symbol="q_F" label="kraftübertragende Trennfugen" value={s.qF} onChange={num('qF')} />
          </div>
        )}
        <NumberField
          symbol="n"
          label="Krafteinleitungsfaktor"
          value={s.n}
          onChange={num('n')}
          hint="nach Abschnitt 5.2.2 und Tabelle 2; n = 1 bei Krafteinleitung unter dem Kopf, typisch 0,3 bis 0,7"
        />
      </fieldset>

      <details className="advanced">
        <summary>Erweitert: Normwerte überschreiben</summary>
        <div className="grid2">
          <NumberField
            symbol="d_W"
            label="Auflagedurchmesser Kopf"
            unit="mm"
            value={s.dWOverride}
            onChange={opt('dWOverride')}
            optional
            placeholder="aus Norm"
          />
          <NumberField
            symbol="d_h"
            label="Bohrungsdurchmesser"
            unit="mm"
            value={s.dhOverride}
            onChange={opt('dhOverride')}
            optional
            placeholder="aus ISO 273"
          />
          <NumberField
            symbol="d_W,P"
            label="Auflagedurchmesser für δ_P"
            unit="mm"
            value={s.dWPlate}
            onChange={opt('dWPlate')}
            optional
            placeholder="wie d_W"
          />
          <SelectField
            label="Verformungsmodell Platten"
            value={s.plateModel ?? 'auto'}
            options={[
              { value: 'auto', label: 'wie Verbindungsart' },
              { value: 'DSV', label: 'DSV (zwei Kegel)' },
              { value: 'ESV', label: 'ESV (ein Kegel)' },
            ]}
            onChange={(v) => set('plateModel', v === 'auto' ? null : v)}
          />
        </div>
      </details>
    </form>
  )
}
