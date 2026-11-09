import { test } from "node:test";
import assert from "node:assert/strict";
import { normalisiereUrl, privat, sichererLookup, seitenText, unterseiten, liesAntwort, suche, vorschau, SuchFehler } from "./suche.mjs";
import { server } from "./server.mjs";

test("normalisiereUrl: ergänzt https, lehnt interne Ziele ab", () => {
  assert.equal(normalisiereUrl("www.mein-verein.de").href, "https://www.mein-verein.de/");
  assert.equal(normalisiereUrl("http://verein.de/ueber#x").href, "http://verein.de/ueber");
  for (const schlecht of ["", "localhost", "http://localhost:3000", "127.0.0.1", "http://10.0.0.5", "http://[::1]/", "http://169.254.169.254/latest", "http://100.64.0.1", "file:///etc/passwd", "ftp://verein.de", "https://verein.de:8443", "http://user:pw@verein.de", "drucker.local", "a".repeat(301)]) {
    assert.throws(() => normalisiereUrl(schlecht), SuchFehler, schlecht);
  }
});

test("privat: private und Sonderadressen", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.1.1", "100.64.0.1", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1"]) assert.ok(privat(ip), ip);
  for (const ip of ["93.184.216.34", "2606:4700::1111"]) assert.ok(!privat(ip), ip);
});

test("sichererLookup: Name, der auf localhost zeigt, wird gesperrt", async () => {
  await assert.rejects(new Promise((ok, nein) => sichererLookup("localhost", {}, (e, a) => (e ? nein(e) : ok(a)))), SuchFehler);
});

test("seitenText und unterseiten", () => {
  const html = `<html><head><title>T</title><style>x{}</style><script>alert(1)</script></head><body>
    <h1>Sportverein Musterstadt e.&nbsp;V.</h1><p>Wir f&uuml;hren Kinderturnen &amp; Yoga durch.</p>
    <a href="/impressum">Impressum</a><a href="/ueber-uns/">Über uns</a><a href="https://fremd.de/impressum">x</a>
    <a href="/satzung.pdf">Satzung</a><a href="/termine">Termine</a><a href="/verein">Der Verein</a><a href="/projekte">P</a></body></html>`;
  const t = seitenText(html);
  assert.match(t, /Sportverein Musterstadt e\. V\./);
  assert.match(t, /führen Kinderturnen & Yoga/);
  assert.doesNotMatch(t, /alert|x\{\}/);
  assert.deepEqual(unterseiten(html, "https://verein.de/"), ["https://verein.de/impressum", "https://verein.de/ueber-uns/", "https://verein.de/verein"]);
});

test("seitenText und unterseiten bleiben bei feindseligem HTML schnell", () => {
  const feindlich = ["<script".repeat(150_000), "<!--".repeat(250_000), "<a href='/impressum'>x".repeat(60_000), "<p".repeat(400_000), "\r".repeat(300_000) + "x", "<a ".repeat(300_000)];
  for (const html of feindlich) {
    const start = performance.now();
    seitenText(html); unterseiten(html, "https://verein.de/");
    assert.ok(performance.now() - start < 500, `zu langsam: ${html.slice(0, 12)}`);
  }
});

test("liesAntwort: prüft Felder, verwirft unbekannte IDs", () => {
  const a = liesAntwort(`<think>…</think>Hier: {"profil":{"name":"TSV","land":"by","themen":["Sport",3,"Kinder"]},"treffer":[{"id":"deutscher-engagementpreis","warum":"Passt."},{"id":"erfunden","warum":"x"}]}`);
  assert.equal(a.profil.land, "BY");
  assert.deepEqual(a.profil.themen, ["Sport", "Kinder"]);
  assert.deepEqual(a.treffer.map((t) => t.id), ["deutscher-engagementpreis"]);
  assert.equal(liesAntwort("kein json"), null);
  assert.equal(liesAntwort('{"profil":{"land":"XX"},"treffer":[]}').profil.land, null);
});

test("suche: ganze Strecke mit Testdoubles, Region gefiltert, nach Frist sortiert", async () => {
  const seiten = {
    "https://verein.de/": `<p>${"Wir sind ein gemeinnütziger Verein für Medienbildung von Kindern. ".repeat(6)}</p><a href="/impressum">Impressum</a>`,
    "https://verein.de/impressum": "<p>Verein e.V., Hauptstraße 1, 80331 München</p>",
  };
  const hole = async (u) => ({ url: new URL(u.includes("://") ? u : `https://${u}`).href, html: seiten[new URL(u.includes("://") ? u : `https://${u}`).href] });
  let gesendet;
  const fetch = async (_u, opt) => {
    gesendet = JSON.parse(opt.body);
    return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({
      profil: { name: "Verein e.V.", ort: "München", land: "BY", zusammenfassung: "Medienbildung", themen: ["Medien"], zielgruppen: [] },
      treffer: [
        { id: "100xdigital-digitalisierung-im-ehrenamt", warum: "a" },
        { id: "themenfonds-medienkompetenz-foerderrichtlinien-stand-01-04-2", warum: "b" },
        { id: "foerderung-aus-lottomitteln-des-mbjs-bildung-kinder-und-juge", warum: "Brandenburg, muss raus" },
        { id: "github-for-nonprofits-kostenloser-github-team-plan", warum: "c" },
      ] }) } }] }));
  };
  const schritte = [];
  const e = await suche({ adresse: "verein.de", apiKey: "k", fetch, hole, heute: "2026-11-09", melde: (s) => schritte.push(s) });
  assert.deepEqual(schritte, ["lesen", "abgleichen", "sortieren"]);
  assert.match(gesendet.messages[1].content, /80331 München/);
  assert.ok(gesendet.models.length > 0);
  assert.deepEqual(e.treffer.map((t) => t.naechste_frist), ["2026-11-15", "2026-12-31", "laufend"]);
  assert.ok(e.treffer.every((t) => !/Brandenburg, muss raus/.test(t.warum)));
  // Die Brandenburger ID ist gültig (liesAntwort behält sie), entfernt hat sie also der Regionsfilter.
  assert.equal(liesAntwort('{"profil":{},"treffer":[{"id":"foerderung-aus-lottomitteln-des-mbjs-bildung-kinder-und-juge"}]}').treffer.length, 1);
});

test("suche: ohne Schlüssel und bei zu wenig Text klare Fehler", async () => {
  await assert.rejects(suche({ adresse: "verein.de" }), { code: "nicht_eingerichtet" });
  await assert.rejects(suche({ adresse: "verein.de", apiKey: "k", hole: async () => ({ url: "https://verein.de/", html: "<p>Hallo</p>" }) }), { code: "zu_wenig_text" });
});

test("vorschau: drei kommende bundesweite Fristen", () => {
  const v = vorschau(3, "2026-11-09");
  assert.equal(v.length, 3);
  assert.ok(v.every((p) => p.naechste_frist >= "2026-11-09"));
});

test("server: Seite unter Präfix, Vorschau, Suche ohne Schlüssel, kein Pfad-Ausbruch", async () => {
  await new Promise((r) => server.listen(0, r));
  const basis = `http://localhost:${server.address().port}`;
  try {
    const seite = await fetch(`${basis}/foerderradar/`);
    assert.equal(seite.status, 200);
    assert.match(seite.headers.get("content-security-policy"), /default-src 'self'/);
    assert.equal((await fetch(`${basis}/foerderradar`, { redirect: "manual" })).status, 308);
    assert.equal((await (await fetch(`${basis}/foerderradar/api/vorschau`)).json()).fristen.length, 3);
    const s = await fetch(`${basis}/foerderradar/api/suche`, { method: "POST", body: '{"url":"verein.de"}' });
    assert.equal(s.status, process.env.OPENROUTER_API_KEY ? 200 : 503);
    assert.equal((await fetch(`${basis}/foerderradar/..%2f..%2fpackage.json`)).status, 404);
    assert.equal((await fetch(`${basis}/foerderradar/%E0%A4%A`)).status, 400);
  } finally { server.close(); }
});
