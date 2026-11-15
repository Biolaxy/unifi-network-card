// Baut die Geräteliste der Karte aus öffentlichen Ubiquiti-Quellen.
//
// Schritt 1 (dieses Skript, Modus "base"):
//   node tools/build-device-db.mjs base <public.json> <techspecs-*.html …>  > tools/device-db.base.json
//   public.json:  https://static.ui.com/fingerprint/ui/public.json
//   HTML:         https://techspecs.ui.com/unifi/{cloud-gateways,wifi,switching}
// Schritt 2: tools/analyze-leds.html im Browser öffnen (ermittelt die Status-LED je Foto) → device-db.leds.json
// Schritt 3 (Modus "embed"):
//   node tools/build-device-db.mjs embed tools/device-db.base.json tools/device-db.leds.json unifi-network-card.js
//   schreibt die kompakte Tabelle zwischen die Marker DEVICE_DB:BEGIN/END in die Karte.
import fs from "node:fs";

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9+]/g, "");
const REGION = /-(us|eu|uk|au|ca|jp|in|br|il|cn|tw|kr)$/i;
// Shop-Fotos, die kein einzelnes Gerät zeigen (Aktions-Bundle, mehrere Farbvarianten) → App-Foto verwenden
const SHOP_PHOTO_UNSUITABLE = new Set(["ux7", "u7proxg", "u7proxgs"]);

function kindOf(d) {
  const t = d.unifi?.network?.type, dt = d.deviceType;
  if (dt === "console" || dt === "gateway" || ["udm", "uxg", "ugw"].includes(t) || dt === "router") return "gateway";
  if (dt === "access-point" || t === "uap") return "ap";
  if (dt === "switch" || t === "usw") return "switch";
  if (dt === "bridge") return "bridge";
  return "other";
}

function base(publicPath, htmlPaths) {
  const devices = JSON.parse(fs.readFileSync(publicPath, "utf8")).devices
    .filter((d) => d.unifi?.network?.model && (d.line?.id === "unifi-network"));

  // Shop-Fotos (techspecs) nach normalisierter SKU
  const shop = new Map();
  for (const p of htmlPaths) {
    const html = fs.readFileSync(p, "utf8");
    const data = JSON.parse(html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)[1]);
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (o.thumbnail?.url?.includes("cdn.ecomm") && o.name) {
        const m = o.thumbnail.url.match(/products\/([0-9a-f-]+)\/([0-9a-f-]+)\.png/);
        if (m) for (const k of [norm(o.name.replace(REGION, "")), norm(o.name)]) if (!shop.has(k)) shop.set(k, { img: `s:${m[1]}/${m[2]}`, title: o.shortTitle });
        return;
      }
      for (const k of Object.keys(o)) walk(o[k]);
    })(data);
  }

  // Nach SKU zusammenfassen (manche Modelle haben mehrere interne Codes)
  const bySku = new Map();
  for (const d of devices) {
    const sku = d.sku || d.shortnames?.[0];
    if (!sku) continue;
    const key = norm(sku);
    const e = bySku.get(key) || {
      sku, name: d.product?.abbrev || sku, kind: kindOf(d), models: new Set(), aliases: new Set(),
      ports: d.unifi.network.numberOfPorts || 0, img: null,
    };
    e.models.add(d.unifi.network.model);
    for (const s of d.shortnames || []) e.aliases.add(s);
    if (d.product?.name) e.aliases.add(d.product.name);
    const s = SHOP_PHOTO_UNSUITABLE.has(key) ? null : shop.get(key) || [...(d.shortnames || [])].map((x) => shop.get(norm(x))).find(Boolean);
    if (s) { e.img = s.img; if (s.title) e.name = s.title; }
    else if (!e.img && d.images?.default && d.id) e.img = `a:${d.id}/${d.images.default}`;
    bySku.set(key, e);
  }
  const out = [...bySku.values()]
    .filter((e) => e.img)
    .map((e) => ({ ...e, models: [...e.models], aliases: [...e.aliases].filter((a) => norm(a) !== norm(e.name) && norm(a) !== norm(e.sku)) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  process.stdout.write(JSON.stringify(out, null, 1));
  process.stderr.write(`${out.length} Geräte, davon ${out.filter((e) => e.img.startsWith("s:")).length} mit Shop-Foto\n`);
}

function embed(basePath, ledPath, cardPath) {
  const db = JSON.parse(fs.readFileSync(basePath, "utf8"));
  const leds = JSON.parse(fs.readFileSync(ledPath, "utf8"));
  const rows = db.map((e) => {
    const l = leds[e.sku] || {};
    // Kleine "Ringe" sind in Wahrheit Punkt-LEDs, senkrechte Bänder werden wie Bänder dargestellt
    let kind = l.kind;
    if (kind === "ring" && l.w < 12 && l.h < 12) kind = "dot";
    if (kind === "vband") kind = "band";
    const led = kind && kind !== "none" ? [kind, l.x, l.y, l.w, l.h] : 0;
    return JSON.stringify([e.sku, e.name, e.kind, e.models.join("|"), e.aliases.join("|"), e.img, led, l.box || 0]);
  });
  const block = `// DEVICE_DB:BEGIN – erzeugt mit tools/build-device-db.mjs (${new Date().toISOString().slice(0, 10)}), nicht von Hand ändern\n` +
    `// [SKU, Name, Art, interne Modellcodes, weitere Namen, Bild (s: Shop-Foto, a: App-Foto), Status-LED [Form, x, y, b, h] in %, Geräteumriss [x, y, b, h] in %]\n` +
    `const DEVICE_DB_RAW = [\n${rows.join(",\n")},\n];\n// DEVICE_DB:END`;
  const card = fs.readFileSync(cardPath, "utf8");
  const re = /\/\/ DEVICE_DB:BEGIN[\s\S]*?\/\/ DEVICE_DB:END/;
  if (!re.test(card)) throw new Error("Marker DEVICE_DB:BEGIN/END fehlen in " + cardPath);
  fs.writeFileSync(cardPath, card.replace(re, () => block));
  process.stderr.write(`${rows.length} Geräte eingebettet, ${db.filter((e) => { const k = (leds[e.sku] || {}).kind; return k && k !== "none"; }).length} mit Status-LED\n`);
}

const [mode, ...args] = process.argv.slice(2);
if (mode === "base") base(args[0], args.slice(1));
else if (mode === "embed") embed(args[0], args[1], args[2]);
else { console.error("Nutzung: base <public.json> <html…> | embed <base.json> <leds.json> <card.js>"); process.exit(1); }
