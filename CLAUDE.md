# foerderradar-web

Eine Seite (`public/`), ein Server ohne Framework (`server.mjs`), die Suche (`suche.mjs`). Datensatz und Vorfilter kommen als Abhängigkeit `foerderradar` (Commit-Tarball von GitHub, aktualisieren mit `npm run daten`).

- Tests: `npm test`. Ohne `OPENROUTER_API_KEY` laufen alle.
- Lokal mit echter Oberfläche ohne Modellkosten: `OPENROUTER_URL` auf einen Mock zeigen lassen (OpenAI-kompatible Antwort).
- Sicherheit: Jeder Abruf fremder Seiten geht über `holeSeite` mit `sichererLookup`. Nie `fetch` für Nutzer-URLs nehmen, das umgeht die Sperre privater Adressen.
- Design: Farben und Typo-Rollen sind die der Club-Website (`shared/design/tokens.ts` dort). Nie unter 15 px, Bedeutung nie nur über Farbe. Siehe `DESIGN.md`, `PRODUCT.md`.
- Texte: Deutsch, Du-Form, Alltagssprache.
