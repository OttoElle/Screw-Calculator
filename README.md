# Schraubenrechner nach VDI 2230 Blatt 1

Web-App zur Berechnung hochbeanspruchter Einschraubenverbindungen nach VDI 2230 Blatt 1 (Ausgabe 11/2015).

## Stand

**Schritt 1: Rechenkern** (`src/core/`)

- Zentrisch verspannte und zentrisch belastete Verbindungen (DSV und ESV), axiale Betriebskraft und optionale Querkraft
- Rechenschritte R0 bis R13 außer R11 (Einschraubtiefe), ohne Temperatureinfluss
- Nachgiebigkeiten von Schraube und Platten mit Fallunterscheidung Kegel, Kegel und Hülse, Hülse
- Nachweise: Montagevorspannkraft, Betriebsbeanspruchung, Dauerhaltbarkeit (schlussvergütet und schlussgewalzt), Flächenpressung, Restklemmkraft, Gleiten
- Stammdaten: Regelgewinde M4 bis M36, Festigkeitsklassen 8.8/10.9/12.9, Werkstoffe (Tabelle A9), Setzbeträge (Tabelle 5), Anziehfaktoren (Tabelle A8), Reibungszahlklassen (Tabelle A5), Kopf-, Mutter- und Bohrungsmaße (ISO 4762, ISO 4017, ISO 4032, ISO 273)

Die Tests in `src/core/calculate.test.ts` rechnen das Beispiel B1 aus Anhang B der Richtlinie nach (Abweichung unter 1 %) und prüfen die Gewindegeometrie gegen Tabelle A11.

Die Kopf- und Mutternmaße sind mit DIN EN ISO 4762:2004-06, DIN EN ISO 4017:2022-10 und DIN EN ISO 4032:2023-12 abgeglichen. Die Durchgangsbohrungen nach ISO 273 sind noch nicht gegen die Norm geprüft.

**Schritt 3: Web-App** (`src/App.tsx`, `src/ui/`)

- Eingabemaske mit Auswahl aus den Stammdaten, Eingaben werden im Browser gespeichert
- Ergebnis mit Anziehdrehmoment, Auslastungsbalken für alle Nachweise und aufklappbaren Rechenschritten
- Verspannungsschaubild (mit Setzen und Betriebskraft) und maßstäbliche Schnittskizze mit Verformungskörper
- Button „Beispiel B1 laden“ zum Nachvollziehen des Rechenbeispiels aus der Richtlinie
- Automatisches Deployment auf GitHub Pages bei jedem Push auf `main` (`.github/workflows/deploy.yml`)

## Nächste Schritte

1. Später: PDF-Bericht, exzentrische Verspannung und Belastung, Einschraubtiefe, Temperatureinfluss

## Lokal starten (Windows)

Node.js installieren (https://nodejs.org), dann `start.bat` doppelklicken. Beim ersten Start werden die Abhängigkeiten installiert, danach öffnet sich die App im Browser.

## Entwicklung

```bash
npm install
npm test        # Rechenkern-Tests
npm run dev     # Entwicklungsserver
```

Hinweis: Die Richtlinie selbst ist urheberrechtlich geschützt und nicht Teil dieses Repositorys.
