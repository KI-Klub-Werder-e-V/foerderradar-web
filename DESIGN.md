# Design

Förderradar-Web gehört zur visuellen Familie von ki-klub-werder.de. Maßgeblich für Farben und Kontraste ist `shared/design/tokens.ts` im Website-Repo; die Werte hier sind Kopien davon in `public/style.css`.

## Tokens

| Token | Hell | Dunkel („Werkbank“) | Rolle |
|---|---|---|---|
| `--ink` | `hsl(180 4% 5%)` | `hsl(42 28% 93%)` | Text, Überschriften |
| `--gray` | `hsl(207 7% 33%)` | `hsl(40 10% 70%)` | Sekundärtext |
| `--teal-deep` | `hsl(188 60% 27%)` | `hsl(185 53% 52%)` | Links, Fokus, aktiver Schritt |
| `--line-ui` | `hsl(40 6% 53%)` | `hsl(43 7% 49%)` | Rahmen von Eingabefeldern und Knöpfen (≥ 3:1) |
| `--line` | `hsl(42 11% 83%)` | `hsl(40 5% 18%)` | Trennlinien, Dekor |
| `--ground` | Weiß | `hsl(40 6% 10%)` | Seitengrund |
| `--panel` | Papier `hsl(45 33% 95%)` | `hsl(40 4% 13%)` | Profil-Fläche, Plugin-Band |
| `--yellow` | `#FDCF34` | gleich | Oberkante, Strich unter Überschriften, Hauptknopf, Schrittnummern; trägt immer Tinte `#0C0D0D` |
| `--yellow-tint` | `hsl(47 96% 90%)` | `hsl(42 39% 12%)` | Meldungen, Knopf im Ladezustand |

## Typografie

Plus Jakarta Sans, selbst gehostet (variable, 200–800). Rollen wie auf der Website: `.is-body` 18, `.is-text` 16, `.is-label` 16/600, `.is-help` 16 grau, `.is-meta` 15. Nichts unter 15 px. Überschriften 800, eng (−0,02 bis −0,03 em), H1 36–52 px.

## Bausteine

- **Fristenliste:** Datum links in fester Spalte (Tag 32 px/800, Monat und „in N Tagen“ darunter, tabellarische Ziffern), Inhalt rechts, Haarlinie zwischen Zeilen. „laufend“ als eigene Marke, laufende Programme als eigene Gruppe am Ende. Keine Farbe für Dringlichkeit.
- **Schritte:** drei benannte Schritte mit Ring (offen), drehendem Teilring (aktiv, ohne Bewegung bei `prefers-reduced-motion`), gefülltem Ring mit Haken (fertig). Schritte kommen vom Server, nicht von einem Timer.
- **Knöpfe:** gelb mit Tinte für die eine Hauptaktion, sonst weiß mit `--line-ui`-Rahmen.
- **Meldungen:** gelb getönte Fläche, Info-Symbol, Titel nennt das Problem, Text den Ausweg.

## Nicht machen

Keine Eyebrows über Überschriften, keine Karten-Raster für Ergebnisse, keine roten Countdowns, keine externen Schriften oder Skripte (CSP erlaubt nur `self`).
