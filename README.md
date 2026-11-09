# Förderradar-Web: Fördermittel für deinen Verein finden, ohne Anmeldung

Deutsch · [English](#english)

**Förderradar-Web ist eine kostenlose Website, auf der gemeinnützige Vereine und Initiativen die Adresse ihrer Website eingeben und passende Förderprogramme mit der nächsten Frist und dem Link zur Ausschreibung bekommen.** Sie liest die Website, erkennt Zweck, Sitz und Themen der Organisation und gleicht sie mit 155 geprüften Förderprogrammen von Bund, Ländern, EU, Stiftungen und Lotterien ab. Ohne Anmeldung, ohne Cookies, ohne Speicherung. Ein Projekt des [KI Klub Werder e.V.](https://ki-klub-werder.de).

**Ausprobieren:** [ki-klub-werder.de/foerderradar](https://ki-klub-werder.de/foerderradar)

> Die Website findet Programme. Für Prüfung der Förderrichtlinie, Unterlagen und Lückenanalyse gibt es das Claude-Plugin [**foerderradar**](https://github.com/KI-Klub-Werder-e-V/foerderradar). Von dort kommt auch der Datensatz.

## Auf einen Blick

| | |
|---|---|
| **Eingabe** | Website-Adresse, optional zwei Sätze Beschreibung |
| **Ausgabe** | Programme mit kommender Frist, Fördersumme, Grund für die Passung, Link zur Ausschreibung; als Markdown speicherbar oder druckbar |
| **Datensatz** | 155 Programme, Stand 18.08.2026, bundesweit, Ostdeutschland und Brandenburg |
| **Sprachmodell** | Kostenlose Modelle über [OpenRouter](https://openrouter.ai), mit Ausweichmodellen |
| **Datenschutz** | Keine Speicherung, keine Cookies, kein Tracking, keine externen Schriften |
| **Technik** | Node.js ≥ 20, keine Framework-Abhängigkeit, eine HTML-Seite |
| **Lizenz** | AGPL-3.0 |

## So funktioniert es

1. Der Server liest die Startseite und bis zu drei Unterseiten (Impressum zuerst, wegen des Sitzes). Nur öffentliche Adressen, auch nach DNS-Auflösung und Weiterleitungen.
2. Ein Sprachmodell erkennt Name, Sitz, Bundesland und Themen und wählt passende Programme aus dem geprüften Datensatz. Der Website-Text gilt dabei nur als Material, nicht als Anweisung.
3. Der Server prüft die Auswahl: nur bekannte Programme, nur passende Region, nur kommende oder laufende Fristen. Sortiert wird nach Frist.

Fortschritt und Ergebnis kommen als NDJSON-Strom, damit die Seite echte Schritte statt einer Fake-Ladeanzeige zeigt.

## Selbst betreiben

```bash
git clone https://github.com/KI-Klub-Werder-e-V/foerderradar-web
cd foerderradar-web && npm ci
OPENROUTER_API_KEY=sk-or-... npm start   # http://localhost:3000/foerderradar/
```

Ohne Schlüssel läuft die Seite mit Fristen-Vorschau, die Suche meldet „noch nicht eingerichtet“.

| Variable | Standard | Bedeutung |
|---|---|---|
| `OPENROUTER_API_KEY` | – | Schlüssel für OpenRouter |
| `OPENROUTER_MODELLE` | Gemma 4 31B, Nemotron 3 Ultra, Nemotron 3.5 Super (je `:free`) | kommagetrennt, in Ausweich-Reihenfolge |
| `BASIS_PFAD` | `/foerderradar` | Pfad-Präfix; funktioniert auch, wenn der Proxy ihn abschneidet |
| `TAGESLIMIT` | `40` | Suchen pro Tag (freie OpenRouter-Modelle: 50 Anfragen/Tag ohne Guthaben) |
| `PRO_IP_STUNDE` | `5` | Suchen pro IP und Stunde |
| `PORT` | `3000` | |

Docker: `docker build -t foerderradar-web . && docker run -p 3000:3000 -e OPENROUTER_API_KEY=... foerderradar-web`. Der Dienst erwartet einen Reverse Proxy davor (nutzt `X-Forwarded-For` für das Limit).

Datensatz aktualisieren: `npm run daten` (pinnt den neuesten Stand von `foerderradar` als Commit), dann `npm test`.

## Häufige Fragen

### Welche Daten speichert Förderradar?

Keine. Die Website-Adresse und der Website-Text gehen für die Auswertung an ein Sprachmodell über OpenRouter. Der Server schreibt weder Adressen noch Ergebnisse in eine Datei oder Datenbank und setzt keine Cookies.

### Warum findet Förderradar keine Landesprogramme für mein Bundesland?

Der Datensatz enthält bisher nur Landesprogramme aus Brandenburg. Bundesweite Programme, Stiftungen, Lotterien und Sachleistungen gelten überall. Das Claude-Plugin sucht Landesprogramme zusätzlich live. Fehlende Programme bitte [melden](https://github.com/KI-Klub-Werder-e-V/foerderradar/issues).

### Wie zuverlässig sind die Fristen?

Jedes Programm wurde an der Quelle geprüft, das Datum steht bei jedem Treffer. Förderer ändern Fristen; vor dem Antrag bitte auf der verlinkten Seite bestätigen.

### Kann ich Förderradar für meine Region selbst betreiben?

Ja. Der Code steht unter AGPL-3.0, der Datensatz unter CC BY 4.0. Eigene Programme gehören am besten als Pull Request in den gemeinsamen Datensatz.

## Teil des Digitalen Werkzeugkastens

Förderradar gehört zum [Digitalen Werkzeugkasten](https://ki-klub-werder.de/werkzeugkasten) des KI Klub Werder. Ehrenamtlich gebaut, ohne Gewähr, kein Anspruch auf Betreuung.

---

## English

**Förderradar-Web is a free website where German non-profits enter their website address and get matching funding programmes with upcoming deadlines and links to apply.** No login, no cookies, nothing stored. It reads the organisation's site, detects purpose, location and themes with a free OpenRouter model, and matches against 155 verified programmes from the [foerderradar](https://github.com/KI-Klub-Werder-e-V/foerderradar) dataset. For eligibility checks, document collection and gap analysis, use the foerderradar Claude plugin. Licence: AGPL-3.0.
