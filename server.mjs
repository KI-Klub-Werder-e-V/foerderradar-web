// Förderradar-Web: statische Seite und eine Such-Schnittstelle. Keine Speicherung, keine Cookies.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { daten } from "foerderradar";
import { suche, vorschau, SuchFehler, STANDARD_MODELLE } from "./suche.mjs";

const BASIS = (process.env.BASIS_PFAD ?? "/foerderradar").replace(/\/$/, "");
const PORT = Number(process.env.PORT ?? 3000);
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODELLE = process.env.OPENROUTER_MODELLE?.split(",").map((m) => m.trim()).filter(Boolean) ?? STANDARD_MODELLE;
const TAGESLIMIT = Number(process.env.TAGESLIMIT ?? 40); // unter dem Tageslimit freier OpenRouter-Modelle (50) bleiben
const PRO_IP_STUNDE = Number(process.env.PRO_IP_STUNDE ?? 5);
const GLEICHZEITIG = 3;
const OEFFENTLICH = new URL("./public/", import.meta.url).pathname;
const TYPEN = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".webp": "image/webp", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8" };
const SICHERHEIT = {
  "content-security-policy": "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
};

// shortcut: Zähler im Speicher, gelten pro Prozess und gehen beim Neustart verloren; bei mehreren Instanzen in Redis legen.
const proIp = new Map();
let tag = "", heuteGezaehlt = 0, laufend = 0;

function darfSuchen(ip) {
  const jetzt = Date.now(), heute = new Date().toISOString().slice(0, 10);
  if (heute !== tag) { tag = heute; heuteGezaehlt = 0; proIp.clear(); }
  const liste = (proIp.get(ip) ?? []).filter((t) => jetzt - t < 3_600_000);
  if (liste.length >= PRO_IP_STUNDE) return new SuchFehler("limit_ip", "Du hast in der letzten Stunde schon mehrere Suchen gestartet. Bitte versuch es später noch einmal.", 429);
  if (heuteGezaehlt >= TAGESLIMIT) return new SuchFehler("limit_tag", "Für heute sind alle kostenlosen Suchen aufgebraucht. Morgen geht es weiter, oder nutze das Claude-Plugin.", 429);
  if (laufend >= GLEICHZEITIG) return new SuchFehler("ausgelastet", "Gerade laufen mehrere Suchen gleichzeitig. Bitte versuch es in einer Minute noch einmal.", 503);
  liste.push(jetzt); proIp.set(ip, liste); heuteGezaehlt++;
  return null;
}

// Traefik hängt die echte Client-IP hinten an X-Forwarded-For an; was davor steht, kann der Client frei setzen.
// shortcut: genau ein vertrauenswürdiger Proxy davor; bei mehreren Proxys die Zahl der Hops konfigurierbar machen.
const clientIp = (req) => (req.headers["x-forwarded-for"]?.split(",").at(-1) ?? req.socket.remoteAddress ?? "").trim();
const json = (res, status, obj) => { res.writeHead(status, { ...SICHERHEIT, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(obj)); };

async function leseKoerper(req, max = 4096) {
  let roh = "";
  for await (const c of req) { roh += c; if (roh.length > max) throw new SuchFehler("zu_gross", "Anfrage zu groß.", 413); }
  try { return JSON.parse(roh); } catch { throw new SuchFehler("ungueltig", "Ungültige Anfrage."); }
}

async function api(req, res, pfad) {
  if (pfad === "/api/vorschau" && req.method === "GET") return json(res, 200, { stand: daten.stand, anzahl: daten.programme.length, fristen: vorschau() });
  if (pfad !== "/api/suche") return json(res, 404, { fehler: "nicht_gefunden", text: "Nicht gefunden." });
  if (req.method !== "POST") return json(res, 405, { fehler: "methode", text: "Nur POST." });
  let eingabe;
  try { eingabe = await leseKoerper(req); } catch (e) { return json(res, e.status, { fehler: e.code, text: e.message }); }
  if (!API_KEY) return json(res, 503, { fehler: "nicht_eingerichtet", text: "Die Suche ist auf diesem Server noch nicht eingerichtet." });
  const sperre = darfSuchen(clientIp(req));
  if (sperre) return json(res, sperre.status, { fehler: sperre.code, text: sperre.message });

  // Ab hier NDJSON: Fortschritt zeilenweise, zum Schluss Ergebnis oder Fehler.
  laufend++;
  res.writeHead(200, { ...SICHERHEIT, "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" });
  const zeile = (obj) => res.write(`${JSON.stringify(obj)}\n`);
  try {
    const ergebnis = await suche({ adresse: eingabe?.url, beschreibung: eingabe?.beschreibung, apiKey: API_KEY, models: MODELLE, url: process.env.OPENROUTER_URL, melde: (schritt) => zeile({ schritt }) });
    zeile({ ergebnis: { ...ergebnis, stand: daten.stand } });
  } catch (e) {
    if (!(e instanceof SuchFehler)) console.error("suche:", e?.message);
    zeile(e instanceof SuchFehler ? { fehler: e.code, text: e.message } : { fehler: "intern", text: "Da ist etwas schiefgegangen. Bitte versuch es noch einmal." });
  } finally { laufend--; res.end(); }
}

async function statisch(req, res, pfad) {
  const datei = normalize(join(OEFFENTLICH, pfad === "/" ? "index.html" : pfad));
  if (!datei.startsWith(OEFFENTLICH)) return json(res, 404, { fehler: "nicht_gefunden" });
  try {
    const inhalt = await readFile(datei);
    const typ = TYPEN[extname(datei)];
    if (!typ) throw new Error();
    res.writeHead(200, { ...SICHERHEIT, "content-type": typ, "cache-control": [".html", ".css", ".js"].includes(extname(datei)) ? "no-cache" : "public, max-age=86400" });
    res.end(req.method === "HEAD" ? undefined : inhalt);
  } catch {
    res.writeHead(404, { ...SICHERHEIT, "content-type": "text/plain; charset=utf-8" });
    res.end("Nicht gefunden.");
  }
}

export const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://x");
  if (pathname === "/health") return json(res, 200, { ok: true });
  // Funktioniert mit und ohne Pfad-Präfix, je nachdem ob Traefik ihn abschneidet.
  if (pathname === BASIS) { res.writeHead(308, { location: `${BASIS}/` }); return res.end(); }
  const pfad = pathname.startsWith(`${BASIS}/`) ? pathname.slice(BASIS.length) : pathname;
  try {
    if (pfad.startsWith("/api/")) return await api(req, res, pfad);
    if (req.method !== "GET" && req.method !== "HEAD") return json(res, 405, { fehler: "methode" });
    let entschluesselt;
    try { entschluesselt = decodeURIComponent(pfad); } catch { return json(res, 400, { fehler: "ungueltig" }); }
    return await statisch(req, res, entschluesselt);
  } catch (e) {
    console.error("anfrage:", e?.message);
    if (!res.headersSent) json(res, 500, { fehler: "intern", text: "Interner Fehler." });
    else res.end();
  }
});

if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, () => console.log(`Förderradar auf http://localhost:${PORT}${BASIS}/ · Datensatz ${daten.stand} · ${API_KEY ? "Suche aktiv" : "ohne OPENROUTER_API_KEY: nur Vorschau"}`));
}
