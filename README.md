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

Die Kopf-, Mutter- und Bohrungsmaße stammen aus den Produktnormen und sollten vor einem echten Nachweis gegen ein Tabellenbuch geprüft werden.

## Nächste Schritte

1. Web-App mit Eingabemaske, Ergebnissen pro Rechenschritt, Verspannungsschaubild, Schnittskizze und Auslastungsbalken
2. Später: PDF-Bericht, exzentrische Verspannung und Belastung, Einschraubtiefe, Temperatureinfluss

## Entwicklung

```bash
npm install
npm test        # Rechenkern-Tests
npm run dev     # Entwicklungsserver
```

Hinweis: Die Richtlinie selbst ist urheberrechtlich geschützt und nicht Teil dieses Repositorys.
