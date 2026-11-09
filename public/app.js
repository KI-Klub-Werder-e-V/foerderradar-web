// Förderradar: Vorschau laden, Suche abschicken, Fortschritt und Ergebnis zeigen. Kein Tracking, keine Speicherung.
const $ = (s) => document.querySelector(s);
const MONAT = new Intl.DateTimeFormat("de-DE", { month: "short", year: "numeric", timeZone: "UTC" });
const LANG = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const LAENDER = { BW: "Baden-Württemberg", BY: "Bayern", BE: "Berlin", BB: "Brandenburg", HB: "Bremen", HH: "Hamburg", HE: "Hessen", MV: "Mecklenburg-Vorpommern", NI: "Niedersachsen", NW: "Nordrhein-Westfalen", RP: "Rheinland-Pfalz", SL: "Saarland", SN: "Sachsen", ST: "Sachsen-Anhalt", SH: "Schleswig-Holstein", TH: "Thüringen" };
let letztes = null;

function el(tag, attrs = {}, ...kinder) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) e.setAttribute(k, v);
  for (const k of kinder.flat()) if (k != null && k !== false) e.append(k);
  return e;
}
const svg = (pfad) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "20"); s.setAttribute("height", "20"); s.setAttribute("aria-hidden", "true");
  s.innerHTML = `<path d="${pfad}"/>`;
  return s;
};
const ICON_EXTERN = "M14 5h5v5M19 5l-8 8M10 6H6a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4";
const ICON_INFO = "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01";

const alsDatum = (iso) => new Date(`${iso}T00:00:00Z`);
function tageBis(iso) {
  const heute = new Date(); const h = Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate());
  return Math.round((alsDatum(iso) - h) / 86_400_000);
}

function datumBlock(frist, mitRest) {
  if (frist === "laufend") return el("div", { class: "datum" }, el("span", { class: "laufend" }, "laufend"));
  const d = alsDatum(frist), rest = tageBis(frist);
  return el("time", { class: "datum", datetime: frist, title: LANG.format(d) },
    el("span", { class: "tag" }, String(d.getUTCDate())),
    el("span", { class: "monat" }, MONAT.format(d).replace(".", "")),
    mitRest && el("span", { class: "rest" }, rest === 0 ? "heute" : rest === 1 ? "morgen" : `in ${rest} Tagen`));
}

async function ladeVorschau() {
  try {
    const r = await fetch("api/vorschau");
    if (!r.ok) throw new Error();
    const v = await r.json();
    $("#vorschau-stand").textContent = `Aus ${v.anzahl} geprüften Förderprogrammen · Stand ${LANG.format(alsDatum(v.stand))}`;
    $("#vorschau-liste").replaceChildren(...v.fristen.map((p) =>
      el("li", {}, datumBlock(p.naechste_frist, true),
        el("div", {}, el("a", { href: p.url, rel: "noopener" }, p.programm), el("p", { class: "is-meta" }, p.geldgeber)))));
  } catch {
    $(".vorschau").hidden = true;
  }
}

// ── Fortschritt ──
let uhr = null;
function zeigeSchritt(name) {
  const reihenfolge = ["lesen", "abgleichen", "sortieren"], i = reihenfolge.indexOf(name);
  document.querySelectorAll(".schritte li").forEach((li, n) => li.setAttribute("data-zustand", n < i ? "fertig" : n === i ? "aktiv" : "offen"));
  clearInterval(uhr);
  $("#status-zeit").textContent = "";
  if (name === "abgleichen") {
    const start = Date.now();
    uhr = setInterval(() => {
      const s = Math.round((Date.now() - start) / 1000);
      if (s >= 5) $("#status-zeit").textContent = `Läuft seit ${s} Sekunden. Kostenlose Sprachmodelle brauchen oft bis zu einer Minute.`;
    }, 1000);
  }
}
function setzeLaden(an) {
  const knopf = $(".knopf-haupt");
  knopf.setAttribute("aria-disabled", an ? "true" : "false");
  knopf.querySelector(".knopf-text").textContent = an ? "Suche läuft …" : "Programme finden";
  $("#status").hidden = !an;
  if (!an) clearInterval(uhr);
}

function zeigeMeldung(titel, text, mitPlugin) {
  const m = el("div", { class: "meldung", role: "alert", tabindex: "-1" }, svg(ICON_INFO),
    el("div", {}, el("strong", {}, titel), el("p", { class: "is-text" }, text),
      mitPlugin && el("p", { class: "is-text" }, "Das ", el("a", { href: "#plugin-titel" }, "Claude-Plugin"), " sucht zusätzlich live im Web, auch nach Landesprogrammen eures Bundeslands.")));
  $("#meldung-ort").replaceChildren(m);
  m.focus();
}

// ── Ergebnis ──
function programmZeile(p) {
  const bedingungen = el("dl", {},
    el("dt", {}, "Frist laut Förderer"), el("dd", {}, p.frist),
    p.eigenanteil && [el("dt", {}, "Eigenanteil"), el("dd", {}, p.eigenanteil)],
    p.hinweise?.length && [el("dt", {}, "Hinweise"), el("dd", {}, p.hinweise.join(" · "))],
    el("dt", {}, "Geprüft"), el("dd", {}, `${LANG.format(alsDatum(p.stand))}. Bitte Frist vor dem Antrag auf der Seite des Förderers bestätigen.`));
  return el("li", { class: "programm" },
    datumBlock(p.naechste_frist, true),
    el("div", {},
      el("h4", {}, p.programm),
      el("p", { class: "is-meta geber" }, p.geldgeber),
      p.warum && el("p", { class: "is-body warum" }, p.warum),
      p.summe && el("p", { class: "is-text summe" }, el("strong", {}, "Förderung: "), p.summe),
      el("details", {}, el("summary", {}, "Frist und Bedingungen"), bedingungen),
      el("a", { class: "ausschreibung", href: p.url, rel: "noopener" }, "Zur Ausschreibung", svg(ICON_EXTERN))));
}

function gruppe(titel, liste) {
  if (!liste.length) return null;
  return el("section", { class: "gruppe" },
    el("h3", {}, titel, el("span", { class: "is-meta" }, `${liste.length} ${liste.length === 1 ? "Programm" : "Programme"}`)),
    el("ol", { class: "fristen" }, liste.map(programmZeile)));
}

function zeigeErgebnis(e) {
  letztes = e;
  const p = e.profil;
  if (!p.name) {
    zeigeMeldung("Wir konnten auf der Seite keinen Verein erkennen", "Prüf die Adresse oder beschreib euren Verein im Feld „Wenig Text auf eurer Website?“ und such noch einmal.");
    return;
  }
  $("#ergebnis-titel").textContent = `Passende Programme für ${p.name}`;
  const sitz = [p.ort, p.kreis && p.kreis !== p.ort ? p.kreis : null, LAENDER[p.land]].filter(Boolean).join(", ");
  $("#profil").replaceChildren(
    el("p", { class: "is-label" }, "So haben wir euch verstanden"),
    p.zusammenfassung && el("p", { class: "is-body" }, p.zusammenfassung),
    el("dl", {},
      el("dt", {}, "Sitz"), el("dd", {}, sitz || "nicht erkannt, deshalb nur bundesweite Programme"),
      p.rechtsform && [el("dt", {}, "Rechtsform"), el("dd", {}, p.rechtsform)],
      p.themen.length && [el("dt", {}, "Themen"), el("dd", {}, el("ul", { class: "chips" }, p.themen.map((t) => el("li", {}, t))))],
      p.zielgruppen.length && [el("dt", {}, "Zielgruppen"), el("dd", {}, p.zielgruppen.join(", "))]),
    el("p", { class: "is-help" }, "Stimmt etwas nicht? Ergänze oben eine kurze Beschreibung und such noch einmal."));

  const mitFrist = e.treffer.filter((t) => t.naechste_frist !== "laufend"), laufend = e.treffer.filter((t) => t.naechste_frist === "laufend");
  $("#gruppen").replaceChildren(...[gruppe("Mit Frist", mitFrist), gruppe("Laufend, ohne Stichtag", laufend)].filter(Boolean));
  $(".aktionen").hidden = !e.treffer.length;
  $("#ergebnis").hidden = false;
  if (!e.treffer.length) {
    const landHinweis = p.land && p.land !== "BB" ? ` Landesprogramme für ${LAENDER[p.land]} sind im Datensatz noch nicht erfasst.` : "";
    zeigeMeldung("Gerade kein passendes Programm mit kommender Frist", `Im geprüften Datensatz steht im Moment nichts, das zu euch passt.${landHinweis}`, true);
    return;
  }
  $("#ergebnis-titel").focus();
}

function alsMarkdown(e) {
  const z = [`# Förderprogramme für ${e.profil.name}`, "", `Gefunden mit dem Förderradar (ki-klub-werder.de/foerderradar) am ${LANG.format(new Date())}. Datenstand ${LANG.format(alsDatum(e.stand))}. Fristen bitte vor dem Antrag beim Förderer prüfen.`, ""];
  for (const p of e.treffer) {
    z.push(`## ${p.programm}`, "", `- **Frist:** ${p.naechste_frist === "laufend" ? "laufend" : LANG.format(alsDatum(p.naechste_frist))}`, `- **Förderer:** ${p.geldgeber}`);
    if (p.summe) z.push(`- **Förderung:** ${p.summe}`);
    if (p.eigenanteil) z.push(`- **Eigenanteil:** ${p.eigenanteil}`);
    if (p.warum) z.push(`- **Warum es passt:** ${p.warum}`);
    z.push(`- **Ausschreibung:** ${p.url}`, "");
  }
  z.push("---", "Weiter bis zum Antragspaket mit Lückenanalyse: https://github.com/KI-Klub-Werder-e-V/foerderradar");
  return z.join("\n");
}

// ── Suche ──
async function suchen(ev) {
  ev.preventDefault();
  if ($(".knopf-haupt").getAttribute("aria-disabled") === "true") return;
  const url = $("#url").value.trim(), fehler = $("#url-fehler");
  if (!url) {
    fehler.textContent = "Bitte gib die Adresse eurer Website ein, zum Beispiel www.mein-verein.de.";
    fehler.hidden = false; $("#url").setAttribute("aria-invalid", "true"); $("#url").focus();
    return;
  }
  fehler.hidden = true; $("#url").removeAttribute("aria-invalid");
  $("#meldung-ort").replaceChildren(); $("#ergebnis").hidden = true;
  setzeLaden(true); zeigeSchritt("lesen");
  $("#status").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  try {
    const r = await fetch("api/suche", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url, beschreibung: $("#beschreibung").value }) });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw Object.assign(new Error(j.text || "Die Suche ist gerade nicht möglich."), { code: j.fehler });
    }
    const leser = r.body.getReader(), dec = new TextDecoder();
    let puffer = "", fertig = false;
    while (!fertig) {
      const { value, done } = await leser.read();
      if (done) break;
      puffer += dec.decode(value, { stream: true });
      let i;
      while ((i = puffer.indexOf("\n")) >= 0) {
        const zeile = puffer.slice(0, i); puffer = puffer.slice(i + 1);
        if (!zeile.trim()) continue;
        const d = JSON.parse(zeile);
        if (d.schritt) zeigeSchritt(d.schritt);
        if (d.fehler) throw Object.assign(new Error(d.text), { code: d.fehler });
        if (d.ergebnis) { setzeLaden(false); zeigeErgebnis(d.ergebnis); fertig = true; }
      }
    }
    if (!fertig) throw new Error("Die Verbindung ist abgebrochen. Bitte versuch es noch einmal.");
  } catch (e) {
    setzeLaden(false);
    const ueberschrift = /limit|ausgelastet/.test(e.code ?? "") ? "Gerade keine Suche möglich" : e.code === "zu_wenig_text" ? "Zu wenig Text auf der Website" : "Das hat nicht geklappt";
    zeigeMeldung(ueberschrift, e.message || "Bitte versuch es noch einmal.", /limit|nicht_eingerichtet/.test(e.code ?? ""));
    if (e.code === "zu_wenig_text") $(".zusatz").open = true;
  }
}

$("#suche").addEventListener("submit", suchen);
$("#url").addEventListener("input", () => { $("#url-fehler").hidden = true; $("#url").removeAttribute("aria-invalid"); });
$("#drucken").addEventListener("click", () => window.print());
$("#speichern").addEventListener("click", () => {
  if (!letztes) return;
  const a = el("a", { href: URL.createObjectURL(new Blob([alsMarkdown(letztes)], { type: "text/markdown" })), download: "foerderprogramme.md" });
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("#kopieren").addEventListener("click", async () => {
  const t = $("#kopieren span");
  try { await navigator.clipboard.writeText($(".installieren code").textContent); t.textContent = "Kopiert"; }
  catch { t.textContent = "Bitte von Hand markieren"; }
  setTimeout(() => { t.textContent = "Befehle kopieren"; }, 2500);
});
ladeVorschau();
