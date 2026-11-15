/*
 * UniFi Network Card – Lovelace-Karte für die offizielle UniFi Network Integration
 * Realistische SVG-Darstellung (UDR7, U7 Lite, generische APs/Switches/Gateways),
 * automatische Entitätserkennung pro Gerät, Ports, Clients, Firmware, Neustart.
 */
const UNC_VERSION = "1.3.2";

/* ---------- Hilfsfunktionen ---------- */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const num = (hass, id) => {
  const s = id && hass.states[id];
  if (!s) return null;
  const v = parseFloat(s.state);
  return Number.isFinite(v) ? v : null;
};

const RATE_TO_MBIT = {
  "bit/s": 1e-6, "kbit/s": 1e-3, "mbit/s": 1, "gbit/s": 1e3,
  "b/s": 8e-6, "kb/s": 8e-3, "kib/s": 8.192e-3, "mb/s": 8, "mib/s": 8.388608, "gb/s": 8e3, "gib/s": 8589.934592,
};
const rateMbit = (hass, id) => {
  const v = num(hass, id);
  if (v === null) return null;
  const u = (hass.states[id].attributes.unit_of_measurement || "").toLowerCase();
  return v * (RATE_TO_MBIT[u] ?? 1);
};
const fmtMbit = (m) => {
  if (m === null || m === undefined) return "–";
  if (m >= 1000) return `${(m / 1000).toFixed(2)} Gbit/s`;
  if (m >= 10) return `${m.toFixed(0)} Mbit/s`;
  if (m >= 1) return `${m.toFixed(1)} Mbit/s`;
  return `${Math.round(m * 1000)} kbit/s`;
};
const fmtUptime = (hass, id) => {
  const s = id && hass.states[id];
  if (!s || ["unknown", "unavailable"].includes(s.state)) return null;
  let secs;
  if (/^\d+(\.\d+)?$/.test(s.state)) secs = parseFloat(s.state);
  else {
    const t = Date.parse(s.state);
    if (Number.isNaN(t)) return null;
    secs = (Date.now() - t) / 1000;
  }
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d} T ${h} Std`;
  if (h > 0) return `${h} Std ${m} Min`;
  return `${m} Min`;
};

/* ---------- Geräteprofile ---------- */
const PROFILES = [
  { key: "udr7", re: /udr\s*-?\s*7|dream\s*router\s*7|udma67a/i, kind: "gateway", art: "udr7", photo: "udr7", label: "UniFi Dream Router 7" },
  { key: "udr", re: /\budr\b|dream\s*router/i, kind: "gateway", art: "udr7", label: "UniFi Dream Router" },
  { key: "u7lite", re: /u7[\s-]*lite|\bu7lt\b|\bual7\b|uapa693/i, kind: "ap", art: "ap-round", photo: "u7lite", label: "U7 Lite" },
  { key: "u6lite", re: /u6[\s-]*lite|\bual6\b/i, kind: "ap", art: "ap-round", label: "U6 Lite" },
  { key: "ap-square", re: /u7[\s-]*(pro|max)|u6[\s-]*(pro|enterprise|\+|plus)|\buap\b|ac[\s-]*pro/i, kind: "ap", art: "ap-square" },
  { key: "ap-round", re: /\bu[67]\b|nano|ac[\s-]*lite|lr\b|access\s*point/i, kind: "ap", art: "ap-round" },
  { key: "switch", re: /\busw\b|switch|flex|lite\s*\d+\s*poe|\bus-?\d+/i, kind: "switch", art: "switch" },
  { key: "gateway", re: /\budm\b|\bucg\b|\buxg\b|\busg\b|dream\s*machine|gateway|cloud\s*gateway|express/i, kind: "gateway", art: "udr7" },
];
const PROFILE_BY_KEY = Object.fromEntries(PROFILES.map((p) => [p.key, p]));

/* Offizielle Ubiquiti-Produktfotos (transparente PNGs) + Position der Status-LED in % des Bildes */
const UI_IMG = (product, file) =>
  `https://images.svc.ui.com/?u=${encodeURIComponent(`https://cdn.ecomm.ui.com/products/${product}/${file}.png`)}&q=75&w=640`;
const PHOTOS = {
  udr7: { src: UI_IMG("5fd748ec-76b6-48ca-9256-9fb09d50b4b0", "c57b6e85-cf5b-48c8-9e92-9f25e4dd0f39"),
          led: { kind: "band", x: 28.5, y: 20.6, w: 43, h: 1.8 } },
  u7lite: { src: UI_IMG("253cc208-4b09-4b2e-9d1a-7aa1e8f93507", "49241c96-878f-4e40-8541-c2e89c1c5e6e"),
            led: { kind: "ring", x: 50, y: 49.7, d: 30 } },
};
const failedImages = new Set();

function detectProfile(device, disc, override) {
  if (override && PROFILE_BY_KEY[override]) return PROFILE_BY_KEY[override];
  const hay = `${device?.model || ""} ${device?.model_id || ""} ${device?.name || ""} ${device?.name_by_user || ""}`;
  const hit = PROFILES.find((p) => p.re.test(hay));
  if (hit) return hit;
  const portCount = disc.ports.length;
  if (portCount >= 6) return PROFILE_BY_KEY.switch;
  if (disc.clients && portCount <= 1) return PROFILE_BY_KEY["ap-round"];
  return PROFILE_BY_KEY.gateway;
}

/* ---------- Entitäten eines Geräts finden ---------- */
// Suffixe der Port-Entitäten (englisch + deutsch, da die Entity-IDs in der HA-Sprache angelegt werden)
const PORT_SUFFIX = [
  ["poe_power", /_poe_power$|_poe_leistung$/],
  ["cycle", /_power_cycle$|_aus_und_einschalten$/],
  ["poe", /_poe$/],
  ["speed", /_link_speed$|_verbindungsgeschwindigkeit$|_speed$/],
  ["rx", /_rx$/], ["tx", /_tx$/],
];
const PORT_LABEL_SUFFIX = /\s*(RX|TX|PoE([- ](Power|Leistung))?|Link Speed|Verbindungsgeschwindigkeit|Power Cycle|aus- und einschalten)\s*$/i;

function discover(hass, deviceId) {
  const ents = Object.values(hass.entities || {}).filter((e) => e.device_id === deviceId && !e.hidden);
  const r = { ports: [], ids: [] };
  const portMap = new Map();
  for (const e of ents) {
    const id = e.entity_id;
    const [domain, obj] = id.split(".");
    const tk = (e.translation_key || "").toLowerCase();
    const attrs = hass.states[id]?.attributes || {};
    const dc = attrs.device_class || "";
    const unit = attrs.unit_of_measurement || "";
    r.ids.push(id);

    // Port-Entitäten (Port 1…n und SFP)
    let portKey = null, kind = null;
    const isPortish = /(^|_)(port|sfp)_\d+/.test(obj) || /port/.test(tk);
    for (const [k, re] of PORT_SUFFIX) {
      if (re.test(obj) && (isPortish || k === "poe" || k === "poe_power" || k === "cycle")) {
        portKey = obj.replace(re, ""); kind = k; break;
      }
    }
    if (!portKey && domain === "switch" && /_(port|sfp)_\d+$/.test(obj)) { portKey = obj; kind = "enable"; }
    if (portKey && !(domain === "sensor" && kind === "poe")) {
      if (kind === "poe" && domain !== "switch") continue;
      if (kind === "cycle" && domain !== "button") continue;
      const m = portKey.match(/(port|sfp)_(\d+)$/) || portKey.match(/()(\d+)$/);
      const p = portMap.get(portKey) || { key: portKey, n: m ? +m[2] + (m[1] === "sfp" ? 100 : 0) : 999 };
      p[kind] = id;
      portMap.set(portKey, p);
      continue;
    }

    const t = (re) => re.test(obj) || (tk !== "" && re.test(tk));
    if (domain === "update") r.update = id;
    else if (domain === "button" && (dc === "restart" || t(/restart|reboot|neu_?starten/))) r.restart = id;
    else if (domain === "device_tracker") r.tracker = id;
    else if (domain === "sensor") {
      if (dc === "uptime" || t(/uptime|betriebszeit/)) r.uptime = id;
      else if (dc === "temperature" || t(/temperat|_temp(_|$)/)) { if (!r.temp || /cpu/.test(obj)) r.temp = id; }
      else if (t(/latency|latenz/)) { if (!r.latency) r.latency = id; }
      else if (t(/cpu/)) r.cpu = id;
      else if (t(/memory|speicher|_mem(_|$)|_ram(_|$)/)) r.mem = id;
      else if (t(/clients/)) r.clients = id;
      else if ((dc === "enum" && (attrs.options || []).includes("connected")) || t(/_state$|_zustand$|device_state/)) r.state = id;
      else if (t(/wan.*(rx|download)|download/)) r.wanRx = id;
      else if (t(/wan.*(tx|upload)|upload/)) r.wanTx = id;
      else if (dc === "power" || t(/ac_power|power_consumption|_power$|leistungsaufnahme/)) r.power = id;
    }
    void unit;
  }
  r.ports = [...portMap.values()].filter((p) => p.rx || p.tx || p.poe || p.speed || p.enable || p.poe_power).sort((a, b) => a.n - b.n);
  return r;
}

/* ---------- Status ---------- */
const STATE_TEXT = {
  connected: "Online", disconnected: "Offline", pending: "Wartet auf Adoption", firmware_mismatch: "Firmware-Konflikt",
  upgrading: "Update läuft", provisioning: "Wird provisioniert", heartbeat_missed: "Heartbeat verpasst",
  adopting: "Wird adoptiert", deleting: "Wird entfernt", inform_error: "Inform-Fehler", adoption_failed: "Adoption fehlgeschlagen",
  isolated: "Isoliert", unknown: "Unbekannt", unavailable: "Nicht verfügbar",
};
function deviceStatus(hass, d) {
  const st = d.state && hass.states[d.state];
  if (st && !["unknown", "unavailable"].includes(st.state)) {
    const v = st.state;
    const level = v === "connected" ? "ok" : ["upgrading", "provisioning", "adopting", "pending"].includes(v) ? "busy" : "bad";
    return { level, text: STATE_TEXT[v] || v };
  }
  const tr = d.tracker && hass.states[d.tracker];
  if (tr) return tr.state === "home" ? { level: "ok", text: "Online" } : { level: "bad", text: "Offline" };
  const probe = d.uptime || d.clients || d.cpu;
  if (probe && hass.states[probe]) {
    return hass.states[probe].state === "unavailable" ? { level: "bad", text: "Offline" } : { level: "ok", text: "Online" };
  }
  return { level: "unknown", text: "Unbekannt" };
}
const LED = { ok: "#2f8cff", busy: "#ffb020", bad: "#ff4d4f", unknown: "#9aa3ad" };

/* ---------- SVG-Darstellungen ---------- */
// Ersatzgrafik nach echtem Vorbild: weißer Zylinder (Ø110 × 184 mm), Kuppel, LED-Band, kleines Hochkant-Display
function artUDR7(p, led, online) {
  return `
<svg viewBox="0 0 160 222" class="art" role="img" aria-label="Dream Router 7">
  <defs>
    <linearGradient id="${p}b" x1="0" x2="1">
      <stop offset="0" stop-color="#d3d6da"/><stop offset=".12" stop-color="#eff0f2"/>
      <stop offset=".42" stop-color="#ffffff"/><stop offset=".85" stop-color="#eceef0"/>
      <stop offset="1" stop-color="#cfd3d7"/>
    </linearGradient>
    <radialGradient id="${p}sh"><stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${p}g" x="-.2" y="-4" width="1.4" height="9"><feGaussianBlur stdDeviation="1.6"/></filter>
  </defs>
  <ellipse cx="80" cy="212" rx="56" ry="6" fill="url(#${p}sh)"/>
  <path d="M30 48 Q30 18 80 16 Q130 18 130 48 V188 Q130 208 110 208 H50 Q30 208 30 188 Z" fill="url(#${p}b)" stroke="#d0d4d8" stroke-width=".6"/>
  <path d="M30 48 Q30 18 80 16 Q130 18 130 48" fill="none" stroke="#fff" stroke-width="1.2" opacity=".9"/>
  <rect x="31" y="46" width="98" height="3" rx="1.5" fill="${online ? led : "#c7cbd0"}" filter="url(#${p}g)" opacity="${online ? 0.9 : 0}"/>
  <rect x="31" y="46.4" width="98" height="2.2" rx="1.1" fill="${online ? led : "#c7cbd0"}"/>
  <rect x="73" y="110" width="14" height="27" rx="7" fill="#0e1520"/>
  ${online ? `<rect x="76.5" y="116" width="7" height="1.6" rx=".8" fill="#9fc3ff"/><rect x="76.5" y="120" width="7" height="1.3" rx=".6" fill="#6f8fb8"/><rect x="76.5" y="123.5" width="5" height="1.3" rx=".6" fill="#6f8fb8"/><rect x="76.5" y="127" width="6" height="1.3" rx=".6" fill="#6f8fb8"/>` : ""}
</svg>`;
}

function artAPRound(p, led, online) {
  // Proportionen wie U7 Lite: Ø171,5 mm Scheibe, LED-Ring ≈ 39 % des Durchmessers, mittig
  return `
<svg viewBox="0 0 220 222" class="art" role="img" aria-label="Access Point">
  <defs>
    <radialGradient id="${p}f" cx=".45" cy=".4" r=".62">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".72" stop-color="#fcfcfd"/><stop offset=".93" stop-color="#eceef0"/><stop offset="1" stop-color="#dfe2e5"/>
    </radialGradient>
    <linearGradient id="${p}e" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e4e6e9"/><stop offset="1" stop-color="#b9bec4"/>
    </linearGradient>
    <radialGradient id="${p}sh"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="${p}in"><stop offset=".72" stop-color="${led}" stop-opacity="0"/><stop offset="1" stop-color="${led}" stop-opacity=".22"/></radialGradient>
    <filter id="${p}g" x="-.3" y="-.3" width="1.6" height="1.6"><feGaussianBlur stdDeviation="2.2"/></filter>
  </defs>
  <ellipse cx="110" cy="198" rx="80" ry="9" fill="url(#${p}sh)"/>
  <circle cx="110" cy="103.5" r="86" fill="url(#${p}e)"/>
  <circle cx="110" cy="100" r="86" fill="url(#${p}f)"/>
  ${online ? `<circle cx="110" cy="100" r="33.5" fill="url(#${p}in)"/>
  <circle cx="110" cy="100" r="33.5" fill="none" stroke="${led}" stroke-width="3.5" filter="url(#${p}g)" opacity=".75"/>` : ""}
  <circle cx="110" cy="100" r="33.5" fill="none" stroke="${online ? led : "#dcdfe2"}" stroke-width="1.5"/>
  <path d="M106.5 95.5 v5.5 a3.5 3.5 0 0 0 7 0 v-5.5" fill="none" stroke="#cfd3d7" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="114.5" cy="94" r=".9" fill="#cfd3d7"/>
</svg>`;
}

function artAPSquare(p, led, online) {
  return `
<svg viewBox="0 0 220 222" class="art" role="img" aria-label="Access Point">
  <defs>
    <radialGradient id="${p}f" cx=".35" cy=".3" r=".85">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".65" stop-color="#f2f3f5"/><stop offset="1" stop-color="#d3d7db"/>
    </radialGradient>
    <linearGradient id="${p}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9dde1"/><stop offset="1" stop-color="#9ea5ad"/></linearGradient>
    <radialGradient id="${p}sh"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${p}g" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="4"/></filter>
  </defs>
  <ellipse cx="110" cy="200" rx="86" ry="12" fill="url(#${p}sh)"/>
  <rect x="24" y="21" width="172" height="172" rx="40" fill="url(#${p}e)"/>
  <rect x="24" y="14" width="172" height="172" rx="40" fill="url(#${p}f)" stroke="#c8cdd2" stroke-width=".8"/>
  <circle cx="110" cy="100" r="9" fill="${led}" filter="url(#${p}g)" opacity="${online ? 0.9 : 0}"/>
  <circle cx="110" cy="100" r="5" fill="${online ? led : "#c9ced3"}"/>
  <ellipse cx="80" cy="52" rx="44" ry="14" fill="#fff" opacity=".5" transform="rotate(-18 80 52)"/>
</svg>`;
}

function artSwitch(p, led, online, n) {
  const count = Math.max(4, Math.min(n || 8, 24));
  const w = 300, portW = Math.min(16, 220 / count - 3);
  const start = (w - count * (portW + 3)) / 2 + 20;
  return `
<svg viewBox="0 0 ${w} 110" class="art art-wide" role="img" aria-label="Switch">
  <defs>
    <linearGradient id="${p}b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#eef0f2"/><stop offset="1" stop-color="#c9ced3"/>
    </linearGradient>
    <radialGradient id="${p}sh"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <filter id="${p}g"><feGaussianBlur stdDeviation="2"/></filter>
  </defs>
  <ellipse cx="150" cy="96" rx="140" ry="9" fill="url(#${p}sh)"/>
  <rect x="8" y="22" width="284" height="66" rx="10" fill="url(#${p}b)" stroke="#bfc4ca" stroke-width=".7"/>
  <rect x="14" y="26" width="272" height="6" rx="3" fill="#fff" opacity=".7"/>
  <circle cx="26" cy="56" r="3" fill="${led}" filter="url(#${p}g)" opacity="${online ? 1 : 0}"/>
  <circle cx="26" cy="56" r="2.2" fill="${online ? led : "#b8bec4"}"/>
  ${Array.from({ length: count }, (_, i) => {
    const x = start + i * (portW + 3);
    return `<rect x="${x}" y="46" width="${portW}" height="20" rx="2" fill="#1c2128"/><rect x="${x + portW * 0.25}" y="63" width="${portW * 0.5}" height="3" fill="#0b0e12"/>`;
  }).join("")}
</svg>`;
}

/* ---------- Ports (Rückseite) ---------- */
function portInfo(hass, port) {
  const rx = rateMbit(hass, port.rx), tx = rateMbit(hass, port.tx);
  const speed = rateMbit(hass, port.speed);
  const poeOn = port.poe ? hass.states[port.poe]?.state === "on" : false;
  const poeW = num(hass, port.poe_power);
  const enabled = port.enable ? hass.states[port.enable]?.state !== "off" : true;
  let status = "unknown";
  if (!enabled) status = "disabled";
  else if (speed !== null) status = speed > 0 ? "up" : "down";
  else if (rx !== null || tx !== null) status = (rx || 0) + (tx || 0) > 0 ? "up" : "idle";
  let color = "var(--unc-led-off)";
  if (status === "up") color = speed >= 2500 ? "#2f8cff" : speed !== null && speed < 1000 ? "#ffb020" : "#34c759";
  if (status === "idle") color = "#6b7a88";
  const fn = hass.states[port.rx || port.tx || port.poe || port.speed || port.enable]?.attributes?.friendly_name || "";
  return { rx, tx, speed, poeOn, poeW, enabled, status, color, fn };
}

function portLabel(port, info, deviceName) {
  let l = info.fn;
  if (deviceName && l.toLowerCase().startsWith(deviceName.toLowerCase())) l = l.slice(deviceName.length).trim();
  l = l.replace(PORT_LABEL_SUFFIX, "").trim();
  if (!l || /^\d+$/.test(l)) l = port.n >= 100 && port.n < 999 ? "SFP+" : `Port ${port.n === 999 ? "?" : port.n}`;
  return l.replace(/^Port\s+/i, "P");
}

function renderPorts(hass, ports, deviceName) {
  if (!ports.length) return "";
  return `
  <div class="ports">
    ${ports.map((port) => {
      const i = portInfo(hass, port);
      const tip = [
        portLabel(port, i, deviceName),
        i.speed !== null ? `${i.speed >= 1000 ? i.speed / 1000 + " Gbit/s" : i.speed + " Mbit/s"}` : null,
        i.rx !== null ? `↓ ${fmtMbit(i.rx)}` : null,
        i.tx !== null ? `↑ ${fmtMbit(i.tx)}` : null,
        i.poeOn ? `PoE ${i.poeW !== null ? i.poeW.toFixed(1) + " W" : "an"}` : null,
        !i.enabled ? "deaktiviert" : null,
      ].filter(Boolean).join(" · ");
      const target = port.rx || port.speed || port.tx || port.poe || port.enable;
      return `
      <button class="port ${i.status}" data-entity="${esc(target)}" title="${esc(tip)}">
        <svg viewBox="0 0 30 26" class="jack">
          <rect x="1" y="1" width="28" height="24" rx="3" class="jf"/>
          <rect x="4" y="5" width="22" height="15" rx="1.5" class="jh"/>
          <rect x="10" y="20" width="10" height="3" class="jh"/>
          ${Array.from({ length: 8 }, (_, k) => `<rect x="${6 + k * 2.4}" y="6" width="1.2" height="4" fill="#b08d3c"/>`).join("")}
          <rect x="3" y="2" width="5" height="2" rx="1" style="fill:${i.color}" class="${i.status === "up" ? "blink" : ""}"/>
          <rect x="22" y="2" width="5" height="2" rx="1" style="fill:${i.poeOn ? "#ffb020" : "var(--unc-led-off)"}"/>
        </svg>
        <span class="plabel">${esc(portLabel(port, i, deviceName))}</span>
        ${i.status === "up" && (i.rx !== null || i.tx !== null) ? `<span class="prate">${esc(fmtMbit((i.rx || 0) + (i.tx || 0)))}</span>` : ""}
      </button>`;
    }).join("")}
  </div>`;
}

/* ---------- Styles ---------- */
const STYLE = `
:host { --unc-ok:#2f8cff; --unc-bad:#ff4d4f; --unc-busy:#ffb020; }
ha-card { display:block; border-radius:var(--ha-card-border-radius, 12px); overflow:hidden; container-type:inline-size; padding:4px 0;
  --unc-text: var(--primary-text-color, #1c1c1e); --unc-text2: var(--secondary-text-color, #6b7078);
  --unc-tile: var(--secondary-background-color, rgba(127,127,127,.08)); --unc-divider: var(--divider-color, rgba(127,127,127,.2));
  --unc-jack: color-mix(in srgb, var(--unc-text2) 28%, var(--unc-tile)); --unc-hole: #1d2228; --unc-led-off: color-mix(in srgb, var(--unc-text2) 45%, transparent); }
ha-card.light { --ha-card-background:#ffffff; background:#ffffff; color:#1c1c1e; color-scheme:light;
  --unc-text:#1c1c1e; --unc-text2:#6b7078; --unc-tile:#f2f3f5; --unc-divider:#e6e7ea; --unc-jack:#dcdfe3; --unc-hole:#262b31; --unc-led-off:#c3c7cc; }
ha-card.dark { --ha-card-background:#1c1c1e; background:#1c1c1e; color:#f2f2f4; color-scheme:dark;
  --unc-text:#f2f2f4; --unc-text2:#9a9ca3; --unc-tile:#2a2a2d; --unc-divider:#333338; --unc-jack:#41464e; --unc-hole:#0c0e11; --unc-led-off:#555a62; }
.title { font-size:1.15rem; font-weight:500; padding:12px 16px 4px; color:var(--unc-text); }
.dev { padding:12px 16px 14px; }
.dev + .dev { border-top:1px solid var(--unc-divider); }
.head { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.name { font-weight:600; font-size:1rem; color:var(--unc-text); cursor:pointer; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.model { font-size:.78rem; color:var(--unc-text2); font-weight:400; }
.pill { font-size:.72rem; font-weight:600; padding:3px 9px; border-radius:999px; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; }
.pill::before { content:""; width:7px; height:7px; border-radius:50%; background:currentColor; }
.pill.ok { color:var(--unc-ok); background:color-mix(in srgb, var(--unc-ok) 14%, transparent); }
.pill.bad { color:var(--unc-bad); background:color-mix(in srgb, var(--unc-bad) 14%, transparent); }
.pill.busy { color:var(--unc-busy); background:color-mix(in srgb, var(--unc-busy) 16%, transparent); }
.pill.unknown { color:var(--unc-text2); background:rgba(127,127,127,.15); }
.body { display:grid; grid-template-columns: 150px 1fr; gap:14px; align-items:center; }
.stage { position:relative; display:flex; justify-content:center; align-items:center; aspect-ratio:1/1.1;
  border-radius:16px; background:radial-gradient(circle at 50% 40%, rgba(127,127,127,.10), transparent 70%); cursor:pointer; }
.stage.wide { aspect-ratio:auto; }
.art-wrap { display:contents; }
.art { width:100%; height:100%; max-height:190px; filter:drop-shadow(0 6px 10px rgba(0,0,0,.12)); }
.art-wide { max-height:110px; }
.offline .art { filter:grayscale(.6) opacity(.7); }
.photo { position:relative; width:100%; max-width:190px; aspect-ratio:1; }
.photo img { width:100%; height:100%; object-fit:contain; display:block; filter:drop-shadow(0 8px 12px rgba(0,0,0,.14)); }
.offline .photo img { filter:grayscale(1) opacity(.55); }
.led { position:absolute; pointer-events:none; mix-blend-mode:color; background:var(--led); }
.led.ring { border-radius:50%; background:transparent; box-shadow:0 0 0 3px var(--led) inset, 0 0 10px 1px var(--led); mix-blend-mode:normal; opacity:.85; }
.led.band { border-radius:999px; box-shadow:0 0 8px 2px var(--led); mix-blend-mode:normal; opacity:.9; }
.led.busy { animation: pulse 1.8s ease-in-out infinite; }
.offline .led { display:none; }
@keyframes pulse { 50% { opacity:.35; } }
.lcd { font: 600 8px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; fill:#dfe7ee; }
.lcd-h { font-size:8px; fill:#fff; }
.lcd-dim { fill:#7e8a97; font-weight:500; }
.stats { display:grid; grid-template-columns:repeat(auto-fill, minmax(104px, 1fr)); gap:8px; }
.stat { background:var(--unc-tile); border-radius:12px; padding:8px 10px; cursor:pointer; min-width:0; }
.stat:hover { filter:brightness(1.06); }
.slabel { font-size:.7rem; color:var(--unc-text2); display:flex; align-items:center; gap:4px; }
.slabel ha-icon { --mdc-icon-size:14px; }
.sval { font-size:.98rem; font-weight:600; color:var(--unc-text); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bar { height:4px; border-radius:2px; background:rgba(127,127,127,.2); margin-top:5px; overflow:hidden; }
.bar > i { display:block; height:100%; border-radius:2px; background:var(--unc-ok); }
.bar > i.warn { background:var(--unc-busy); } .bar > i.crit { background:var(--unc-bad); }
.ports { display:flex; flex-wrap:wrap; gap:6px; margin-top:12px; padding:10px; border-radius:12px;
  background:var(--unc-tile); }
.jf { fill:var(--unc-jack); } .jh { fill:var(--unc-hole); }
.port { all:unset; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; width:46px; }
.port:focus-visible { outline:2px solid var(--unc-ok); border-radius:6px; }
.jack { width:34px; height:30px; }
.plabel { font-size:.62rem; color:var(--unc-text); font-weight:500; max-width:46px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.prate { font-size:.56rem; color:var(--unc-text2); white-space:nowrap; }
.port.disabled { opacity:.45; }
.blink { animation: blink 1.6s infinite steps(2, jump-none); }
@keyframes blink { 50% { opacity:.55; } }
.foot { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; align-items:center; }
.chip { all:unset; cursor:pointer; font-size:.75rem; padding:5px 10px; border-radius:999px; display:inline-flex; align-items:center; gap:5px;
  background:rgba(127,127,127,.12); color:var(--unc-text); }
.chip ha-icon { --mdc-icon-size:15px; }
.chip.upd { background:color-mix(in srgb, var(--unc-busy) 18%, transparent); color:var(--unc-busy); font-weight:600; }
.chip.warn { color:var(--unc-bad); }
.spacer { flex:1; }
.empty { padding:16px; color:var(--unc-text2); font-size:.9rem; }
@container (max-width: 380px) {
  .body { grid-template-columns: 1fr; }
  .stage { max-width:170px; margin:0 auto; width:100%; }
}
@media (prefers-reduced-motion: reduce) { .blink, .led.busy { animation:none; } }
`;

/* ---------- Karte ---------- */
class UnifiNetworkCard extends HTMLElement {
  static getConfigElement() { return document.createElement("unifi-network-card-editor"); }
  static getStubConfig(hass) {
    const ids = findUnifiDevices(hass);
    return { devices: ids.slice(0, 2) };
  }

  setConfig(config) {
    if (!config) throw new Error("Ungültige Konfiguration");
    this._config = { theme: "auto", show_ports: true, show_firmware: true, show_restart: true, ...config };
    this._sig = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = this._signature();
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }

  getCardSize() { return 4 * Math.max(1, this._deviceIds().length); }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  _deviceIds() {
    const c = this._config || {};
    let list = c.devices ?? (c.device ? [c.device] : null);
    if (!list || !list.length) list = this._hass ? findUnifiDevices(this._hass) : [];
    return list.map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean);
  }

  _override(id) {
    const c = this._config;
    const fromList = (c.devices || []).find((d) => typeof d === "object" && d.device === id) || {};
    return { ...(c.overrides?.[id] || {}), ...fromList };
  }

  _signature() {
    const h = this._hass;
    if (!h || !this._config) return "";
    const parts = [];
    for (const id of this._deviceIds()) {
      const d = discover(h, id);
      for (const e of d.ids) {
        const s = h.states[e];
        parts.push(s ? s.last_updated + s.state : "-");
      }
    }
    // Uptime-Anzeige minütlich aktualisieren
    parts.push(Math.floor(Date.now() / 60000));
    return parts.join("|");
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    }
    const ids = this._deviceIds();
    const title = this._config.title ? `<div class="title">${esc(this._config.title)}</div>` : "";
    const body = ids.length
      ? ids.map((id, i) => this._renderDevice(id, i)).join("")
      : `<div class="empty">Keine UniFi-Geräte gefunden. Ist die Integration „UniFi Network“ eingerichtet?</div>`;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card class="${["light", "dark"].includes(this._config.theme) ? this._config.theme : ""}">${title}${body}</ha-card>`;
    this._placeArts();
  }

  // Gerätebilder bleiben als DOM-Knoten erhalten und werden nur ersetzt, wenn sich das Bild selbst
  // (Foto, Status-LED, Grafik) ändert – sonst würde das Foto bei jeder Wertänderung neu gezeichnet und blinken.
  _placeArts() {
    this._arts = this._arts || new Map();
    const pending = this._pendingArts || new Map();
    for (const [id, html] of pending) {
      const stage = [...this.shadowRoot.querySelectorAll(".stage[data-art-id]")].find((el) => el.dataset.artId === id);
      if (!stage) continue;
      let cached = this._arts.get(id);
      if (!cached || cached.html !== html) {
        const node = document.createElement("div");
        node.className = "art-wrap";
        node.innerHTML = html;
        node.querySelectorAll("img[data-src]").forEach((img) =>
          img.addEventListener("error", () => { failedImages.add(img.dataset.src); this._sig = null; this._render(); }, { once: true }));
        cached = { html, node };
        this._arts.set(id, cached);
      }
      stage.appendChild(cached.node);
    }
    for (const id of [...this._arts.keys()]) if (!pending.has(id)) this._arts.delete(id);
    this._pendingArts = new Map();
  }

  _renderDevice(id, idx) {
    const h = this._hass;
    const dev = h.devices?.[id];
    if (!dev) return `<div class="dev empty">Gerät ${esc(id)} nicht gefunden.</div>`;
    const ov = this._override(id);
    const d = discover(h, id);
    const prof = detectProfile(dev, d, ov.model);
    const status = deviceStatus(h, d);
    const online = status.level === "ok" || status.level === "busy";
    const led = LED[status.level];
    const name = ov.name || dev.name_by_user || dev.name || "UniFi";
    const model = prof.label || dev.model || "";
    const pfx = `d${idx}_`;

    const clients = num(h, d.clients);
    const cpu = num(h, d.cpu), mem = num(h, d.mem), temp = num(h, d.temp), power = num(h, d.power);
    const uptime = fmtUptime(h, d.uptime);
    let rx = rateMbit(h, d.wanRx), tx = rateMbit(h, d.wanTx);
    if (rx === null && tx === null && d.ports.length) {
      // Fallback: Summe aller Port-Raten (bei Gateways WAN-Port bevorzugt)
      const wan = d.ports.filter((p) => /wan|internet/i.test(h.states[p.rx || p.tx]?.attributes?.friendly_name || ""));
      const src = wan.length ? wan : prof.kind === "gateway" ? [] : d.ports;
      if (src.length) {
        rx = src.reduce((a, p) => a + (rateMbit(h, p.rx) || 0), 0);
        tx = src.reduce((a, p) => a + (rateMbit(h, p.tx) || 0), 0);
      }
    }
    const poeTotal = d.ports.reduce((a, p) => a + (num(h, p.poe_power) || 0), 0);

    let art;
    if (prof.art === "udr7") art = artUDR7(pfx, led, online);
    else if (prof.art === "ap-square") art = artAPSquare(pfx, led, online);
    else if (prof.art === "switch") art = artSwitch(pfx, led, online, d.ports.length);
    else art = artAPRound(pfx, led, online);

    // Echtes Produktfoto (eigenes Bild per `image:` möglich), Grafik nur als Rückfall
    const photo = PHOTOS[prof.photo];
    const imgSrc = ov.image || this._config.images?.[prof.key] || (this._config.photos !== false ? photo?.src : null);
    if (imgSrc && !failedImages.has(imgSrc)) {
      const l = !ov.image && photo ? photo.led : ov.led || null;
      let ledHtml = "";
      if (l && status.level !== "ok") {
        const style = l.kind === "ring"
          ? `left:${l.x - l.d / 2}%;top:${l.y - l.d / 2}%;width:${l.d}%;height:${l.d}%;`
          : `left:${l.x}%;top:${l.y - l.h / 2}%;width:${l.w}%;height:${l.h}%;`;
        ledHtml = `<i class="led ${l.kind} ${status.level}" style="${style}--led:${led}"></i>`;
      }
      art = `<div class="photo"><img src="${esc(imgSrc)}" alt="${esc(model)}" loading="lazy" referrerpolicy="no-referrer" data-src="${esc(imgSrc)}">${ledHtml}</div>`;
    }

    const stat = (icon, label, val, entity, pct) => {
      if (val === null || val === undefined) return "";
      const bar = pct !== undefined && pct !== null
        ? `<div class="bar"><i class="${pct > 90 ? "crit" : pct > 75 ? "warn" : ""}" style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>` : "";
      return `<div class="stat" data-entity="${esc(entity)}"><div class="slabel"><ha-icon icon="${icon}"></ha-icon>${label}</div><div class="sval">${esc(val)}</div>${bar}</div>`;
    };
    const stats = [
      stat("mdi:devices", "Clients", clients !== null ? String(clients) : null, d.clients),
      stat("mdi:timer-outline", "Laufzeit", uptime, d.uptime),
      stat("mdi:download", "Download", rx !== null ? fmtMbit(rx) : null, d.wanRx || d.ports[0]?.rx),
      stat("mdi:upload", "Upload", tx !== null ? fmtMbit(tx) : null, d.wanTx || d.ports[0]?.tx),
      stat("mdi:cpu-64-bit", "CPU", cpu !== null ? `${cpu.toFixed(0)} %` : null, d.cpu, cpu),
      stat("mdi:memory", "RAM", mem !== null ? `${mem.toFixed(0)} %` : null, d.mem, mem),
      stat("mdi:speedometer", "Latenz", num(h, d.latency) !== null ? `${num(h, d.latency).toFixed(0)} ms` : null, d.latency),
      stat("mdi:thermometer", "Temperatur", temp !== null ? `${temp.toFixed(0)} °C` : null, d.temp),
      stat("mdi:flash", "PoE", poeTotal > 0 ? `${poeTotal.toFixed(1)} W` : null, d.ports.find((p) => p.poe_power)?.poe_power),
      stat("mdi:lightning-bolt", "Leistung", power !== null ? `${power.toFixed(1)} W` : null, d.power),
    ].join("");

    const upd = d.update && h.states[d.update];
    let fw = "";
    if (this._config.show_firmware && upd) {
      const a = upd.attributes;
      fw = upd.state === "on"
        ? `<button class="chip upd" data-entity="${esc(d.update)}"><ha-icon icon="mdi:package-up"></ha-icon>Update ${esc(a.latest_version || "")}</button>`
        : `<button class="chip" data-entity="${esc(d.update)}"><ha-icon icon="mdi:chip"></ha-icon>FW ${esc(a.installed_version || dev.sw_version || "–")}</button>`;
    } else if (dev.sw_version) fw = `<span class="chip"><ha-icon icon="mdi:chip"></ha-icon>FW ${esc(dev.sw_version)}</span>`;
    const restart = this._config.show_restart && d.restart
      ? `<button class="chip warn" data-restart="${esc(d.restart)}" data-name="${esc(name)}"><ha-icon icon="mdi:restart"></ha-icon>Neustart</button>` : "";

    (this._pendingArts = this._pendingArts || new Map()).set(id, art);
    return `
    <div class="dev ${online ? "" : "offline"}">
      <div class="head">
        <div class="name" data-device="${esc(id)}">${esc(name)}<div class="model">${esc(model)}</div></div>
        <span class="pill ${status.level}">${esc(status.text)}</span>
      </div>
      <div class="body" style="${prof.art === "switch" ? "grid-template-columns:1fr" : ""}">
        <div class="stage ${prof.art === "switch" ? "wide" : ""}" data-art-id="${esc(id)}" data-entity="${esc(d.state || d.tracker || d.uptime || "")}"></div>
        <div class="stats">${stats || `<div class="empty">${online ? "Keine Sensoren aktiviert – in der UniFi-Integration die Geräte-Sensoren einschalten." : "Gerät ist nicht erreichbar."}</div>`}</div>
      </div>
      ${this._config.show_ports ? renderPorts(h, d.ports, dev.name_by_user || dev.name) : ""}
      ${fw || restart ? `<div class="foot">${fw}<span class="spacer"></span>${restart}</div>` : ""}
    </div>`;
  }

  _onClick(ev) {
    const path = ev.composedPath();
    const el = path.find((n) => n.dataset && (n.dataset.entity || n.dataset.restart || n.dataset.device));
    if (!el) return;
    if (el.dataset.restart) {
      if (confirm(`${el.dataset.name} wirklich neu starten?`)) {
        this._hass.callService("button", "press", { entity_id: el.dataset.restart });
      }
      return;
    }
    if (el.dataset.device) {
      history.pushState(null, "", `/config/devices/device/${el.dataset.device}`);
      window.dispatchEvent(new CustomEvent("location-changed"));
      return;
    }
    if (el.dataset.entity) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: el.dataset.entity }, bubbles: true, composed: true }));
    }
  }
}

function findUnifiDevices(hass) {
  const ids = new Set();
  for (const e of Object.values(hass.entities || {})) {
    if (e.platform === "unifi" && e.device_id) ids.add(e.device_id);
  }
  return [...ids].filter((id) => {
    const dev = hass.devices?.[id];
    if (!dev || !/ubiquiti/i.test(dev.manufacturer || "")) return false;
    // Nur Netzwerkgeräte (haben Uptime/State/Update/Restart), keine Clients
    return Object.values(hass.entities).some((e) => e.device_id === id && /^(update|button)\./.test(e.entity_id) || (e.device_id === id && /_(uptime|state)$/.test(e.entity_id)));
  }).sort((a, b) => {
    const k = (id) => (detectProfile(hass.devices[id], { ports: [] }).kind === "gateway" ? 0 : 1);
    return k(a) - k(b);
  });
}

/* ---------- Visueller Editor ---------- */
const MODEL_OPTIONS = [
  { value: "", label: "Automatisch erkennen" },
  { value: "udr7", label: "Dream Router 7 (Foto)" },
  { value: "u7lite", label: "U7 Lite (Foto)" },
  { value: "udr", label: "Dream Router" },
  { value: "u6lite", label: "U6 Lite" },
  { value: "ap-round", label: "Access Point (rund)" },
  { value: "ap-square", label: "Access Point (eckig)" },
  { value: "switch", label: "Switch" },
  { value: "gateway", label: "Gateway" },
];
const EDITOR_LABELS = {
  title: "Titel (optional)",
  theme: "Design",
  devices: "Geräte",
  show_ports: "Ports anzeigen",
  show_firmware: "Firmware & Updates anzeigen",
  show_restart: "Neustart-Button anzeigen",
  photos: "Original-Produktfotos verwenden",
  name: "Anzeigename",
  model: "Darstellung",
  image: "Eigenes Bild (URL)",
};
const EDITOR_HELPERS = {
  devices: "Leer lassen, um alle UniFi-Geräte automatisch anzuzeigen.",
  photos: "Aus: gezeichnete Grafiken statt Fotos von Ubiquiti.",
  name: "Leer = Name aus Home Assistant",
  model: "Nur ändern, wenn das Gerät falsch erkannt wird.",
  image: "z. B. /local/unifi/mein-ap.png – leer = Originalfoto bzw. Grafik",
};
const OV_PREFIX = "geraet_";

class UnifiNetworkCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first) this._render();
  }

  // Geräte, für die Einstellungen angezeigt werden (gewählte oder automatisch gefundene)
  _shownDevices() {
    const list = (this._config.devices || []).map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean);
    return list.length ? list : findUnifiDevices(this._hass);
  }

  // Alte YAML-Form (Objekte in devices) in overrides übernehmen
  _overrides() {
    const o = { ...(this._config.overrides || {}) };
    for (const d of this._config.devices || []) {
      if (typeof d === "object" && d.device) {
        const { device, ...rest } = d;
        o[device] = { ...rest, ...(o[device] || {}) };
      }
    }
    return o;
  }

  _schema(ids) {
    const devName = (id) => {
      const d = this._hass.devices?.[id];
      if (!d) return id;
      const model = detectProfile(d, { ports: [] }).label || d.model || "";
      return `${d.name_by_user || d.name || id}${model ? ` · ${model}` : ""}`;
    };
    return [
      { type: "expandable", name: "", flatten: true, title: "Darstellung", icon: "mdi:palette-outline", expanded: true, schema: [
        { name: "title", selector: { text: {} } },
        { name: "theme", selector: { select: { mode: "dropdown", options: [
          { value: "auto", label: "Automatisch (wie Home-Assistant-Theme)" },
          { value: "light", label: "Hell" },
          { value: "dark", label: "Dunkel" },
        ] } } },
        { name: "photos", selector: { boolean: {} } },
        { type: "grid", name: "", schema: [
          { name: "show_ports", selector: { boolean: {} } },
          { name: "show_firmware", selector: { boolean: {} } },
          { name: "show_restart", selector: { boolean: {} } },
        ] },
      ] },
      { type: "expandable", name: "", flatten: true, title: "Geräte", icon: "mdi:router-wireless", expanded: true, schema: [
        { name: "devices", selector: { device: { multiple: true, filter: { integration: "unifi" } } } },
      ] },
      ...ids.map((id) => ({
        type: "expandable", name: OV_PREFIX + id, title: devName(id), icon: "mdi:tune-variant", schema: [
          { name: "name", selector: { text: {} } },
          { name: "model", selector: { select: { mode: "dropdown", options: MODEL_OPTIONS } } },
          { name: "image", selector: { text: {} } },
        ],
      })),
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.title || s.name;
      this._form.computeHelper = (s) => EDITOR_HELPERS[s.name];
      this._form.addEventListener("value-changed", (ev) => this._changed(ev.detail.value));
      this.appendChild(this._form);
    }
    const ids = this._shownDevices();
    const key = ids.join(",");
    if (key !== this._schemaKey) { this._schemaKey = key; this._form.schema = this._schema(ids); }
    const ov = this._overrides();
    const data = {
      theme: "auto", photos: true, show_ports: true, show_firmware: true, show_restart: true,
      ...this._config,
      devices: (this._config.devices || []).map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean),
    };
    delete data.overrides;
    for (const id of ids) data[OV_PREFIX + id] = { name: "", model: "", image: "", ...(ov[id] || {}) };
    this._form.hass = this._hass;
    this._form.data = data;
  }

  _changed(value) {
    const v = { ...value };
    const overrides = { ...this._overrides() };
    for (const k of Object.keys(v)) {
      if (!k.startsWith(OV_PREFIX)) continue;
      const id = k.slice(OV_PREFIX.length);
      const clean = Object.fromEntries(Object.entries(v[k] || {}).filter(([, x]) => x !== "" && x != null));
      if (Object.keys(clean).length) overrides[id] = clean; else delete overrides[id];
      delete v[k];
    }
    v.devices = (v.devices || []).filter(Boolean);
    if (!v.devices.length) delete v.devices;
    // Einstellungen von Geräten, die nicht mehr angezeigt werden, entfernen
    if (v.devices) for (const id of Object.keys(overrides)) if (!v.devices.includes(id)) delete overrides[id];
    if (Object.keys(overrides).length) v.overrides = overrides; else delete v.overrides;
    if (!v.title) delete v.title;
    if (v.theme === "auto") delete v.theme;
    for (const k of ["photos", "show_ports", "show_firmware", "show_restart"]) if (v[k] === true) delete v[k];
    this._config = v;
    this._render();
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: v }, bubbles: true, composed: true }));
  }
}

customElements.get("unifi-network-card") || customElements.define("unifi-network-card", UnifiNetworkCard);
customElements.get("unifi-network-card-editor") || customElements.define("unifi-network-card-editor", UnifiNetworkCardEditor);
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "unifi-network-card")) {
  window.customCards.push({
    type: "unifi-network-card",
    name: "UniFi Network Card",
    description: "UniFi-Geräte (UDR7, U7 Lite, …) mit realistischer Darstellung, Ports, Clients und Firmware.",
    preview: true,
  });
}
console.info(`%c UNIFI-NETWORK-CARD %c v${UNC_VERSION} `, "background:#2f8cff;color:#fff;font-weight:700", "background:#222;color:#fff");
