# Product

Förderradar-Web: eine Seite, auf der gemeinnützige Organisationen ihre Website-Adresse eingeben und passende Förderprogramme mit kommender Frist und Link zur Ausschreibung bekommen. Ohne Anmeldung, ohne Speicherung. Teil des Digitalen Werkzeugkastens des KI Klub Werder e.V.

## Platform
web

## Stack
Node.js ≥ 20 ohne Framework (`node:http`), statisches HTML/CSS/Vanilla-JS, keine Build-Kette. Datensatz und Vorfilter kommen als npm-Abhängigkeit aus `KI-Klub-Werder-e-V/foerderradar`. Sprachmodell über kostenlose OpenRouter-Modelle. Betrieb als Docker-Container auf Coolify unter `ki-klub-werder.de/foerderradar` (Pfad-Routing über Traefik, wie in-werder). Vom Nutzer im Spec freigegeben.

## Users
Ehrenamtliche Vorstände und Aktive kleiner Vereine und Initiativen (bestätigt). Wenig Erfahrung mit Fördermitteln, oft am Handy oder abends am Laptop zu Hause, nach der Arbeit. Lesen nicht gern Fachsprache.

## Product Purpose
In unter einer Minute von „Gibt es Geld für uns?“ zu einer kurzen Liste echter Programme mit Frist, Summe und Link. Für Prüfung, Unterlagen und Lückenanalyse verweist die Seite auf das Claude-Plugin.

## Positioning
Kostenlos, offen, aus der Vereinsarbeit. Keine Fördermittelberatung, kein Abo, kein Lead-Formular. Ehrlich über Datenstand und Grenzen.

## Operating Context
Läuft unter dem Dach von ki-klub-werder.de und muss wie ein Teil davon wirken. Freie Modelle sind langsam (20–60 s) und begrenzt (Tageslimit), die Seite muss Warten und Ausfälle gut erklären.

## Capabilities and Constraints
- Liest nur öffentliche Websites, höchstens wenige Seiten.
- Ergebnisse nur aus dem geprüften Datensatz (155 Programme, Stand August 2026), Landesprogramme bisher nur Brandenburg.
- Keine Speicherung, keine Cookies, kein Tracking.

## Brand Commitments
Gleiche Familie wie ki-klub-werder.de (bestätigt): Plus Jakarta Sans selbst gehostet, Tinte auf Weiß/Papier, gelber Strich unter Überschriften und als Oberkante, tiefes Türkis für Links und Fokus, gelbe Hauptschaltfläche mit schwarzer Schrift, dünne Kanten, runde Ecken 12–16 px. Du-Form. Typo-Rollen der Website: nie unter 15 px. Dunkelmodus „Werkbank“.

## Evidence on Hand
Echter Datensatz mit Fristen, Summen, Links und Prüfdatum. Keine Nutzerzahlen, keine Testimonials: nichts davon erfinden.

## Product Principles
1. Frist zuerst: das Datum entscheidet, ob sich Lesen lohnt.
2. Jede Angabe mit Quelle und Stand.
3. Ehrlich über Grenzen, ohne Dramatik (keine roten Countdowns).
4. Ein Feld, eine Schaltfläche.

## Accessibility & Inclusion
WCAG 2.2 AA mit den Kontrastpaaren aus `shared/design/tokens.ts` der Website. Bedeutung nie nur über Farbe. Tastatur vollständig, sichtbarer Fokus, `aria-live` für Lade- und Ergebnisstatus, `prefers-reduced-motion` respektiert, forced-colors berücksichtigt.
