/*
 * UniFi Network Card – Lovelace-Karte für die offizielle UniFi Network Integration
 * Realistische SVG-Darstellung (UDR7, U7 Lite, generische APs/Switches/Gateways),
 * automatische Entitätserkennung pro Gerät, Ports, Clients, Firmware, Neustart.
 */
const UNC_VERSION = "1.5.0";

/* ---------- Sprache (Deutsch / Englisch) ---------- */
const I18N = {
  de: {
    online: "Online", offline: "Offline", unknown: "Unbekannt",
    st_pending: "Wartet auf Adoption", st_firmware_mismatch: "Firmware-Konflikt", st_upgrading: "Update läuft",
    st_provisioning: "Wird provisioniert", st_heartbeat_missed: "Heartbeat verpasst", st_adopting: "Wird adoptiert",
    st_deleting: "Wird entfernt", st_inform_error: "Inform-Fehler", st_adoption_failed: "Adoption fehlgeschlagen",
    st_isolated: "Isoliert", st_unavailable: "Nicht verfügbar",
    clients: "Clients", uptime: "Laufzeit", download: "Download", upload: "Upload", cpu: "CPU", ram: "RAM",
    latency: "Latenz", temperature: "Temperatur", poe: "PoE", power: "Leistung",
    disconnected: "getrennt", port_disabled: "deaktiviert", poe_on: "PoE an",
    days: "T", hours: "Std", minutes: "Min",
    update: "Update", restart: "Neustart", restart_confirm: "{name} wirklich neu starten?",
    no_devices: "Keine UniFi-Geräte gefunden. Ist die Integration „UniFi Network“ eingerichtet?",
    device_missing: "Gerät {id} nicht gefunden.",
    no_sensors: "Keine Sensoren aktiviert – in der UniFi-Integration die Geräte-Sensoren einschalten.",
    unreachable: "Gerät ist nicht erreichbar.",
    invalid_config: "Ungültige Konfiguration",
    // Editor
    sec_appearance: "Darstellung", sec_devices: "Geräte",
    title: "Titel (optional)", theme: "Design", language: "Sprache", photos: "Original-Produktfotos verwenden",
    show_ports: "Ports anzeigen", show_firmware: "Firmware & Updates anzeigen", show_restart: "Neustart-Button anzeigen",
    devices: "Geräte", name: "Anzeigename", model: "Modell / Darstellung", image: "Eigenes Bild (URL)",
    h_devices: "Leer lassen, um alle UniFi-Geräte automatisch anzuzeigen.",
    h_photos: "Aus: gezeichnete Grafiken statt Fotos von Ubiquiti.",
    h_name: "Leer = Name aus Home Assistant", h_model: "Nur ändern, wenn das Gerät falsch erkannt wird.",
    h_image: "z. B. /local/unifi/mein-ap.png – leer = Originalfoto bzw. Grafik",
    theme_auto: "Automatisch (wie Home-Assistant-Theme)", theme_light: "Hell", theme_dark: "Dunkel",
    lang_auto: "Automatisch (wie Home Assistant)",
    model_auto: "Automatisch erkennen", graphic: "Grafik",
    g_gateway: "Gateway", g_ap_round: "Access Point (rund)", g_ap_square: "Access Point (eckig)", g_switch: "Switch",
    order: "Reihenfolge", order_hint: "Geräte am Griff ziehen oder mit den Pfeilen verschieben.",
    move_up: "Nach oben", move_down: "Nach unten", drag: "Ziehen zum Verschieben",
    card_desc: "UniFi-Geräte mit echten Produktfotos, Status-LED, Ports, Clients und Firmware.",
  },
  en: {
    online: "Online", offline: "Offline", unknown: "Unknown",
    st_pending: "Pending adoption", st_firmware_mismatch: "Firmware mismatch", st_upgrading: "Updating",
    st_provisioning: "Provisioning", st_heartbeat_missed: "Heartbeat missed", st_adopting: "Adopting",
    st_deleting: "Deleting", st_inform_error: "Inform error", st_adoption_failed: "Adoption failed",
    st_isolated: "Isolated", st_unavailable: "Unavailable",
    clients: "Clients", uptime: "Uptime", download: "Download", upload: "Upload", cpu: "CPU", ram: "RAM",
    latency: "Latency", temperature: "Temperature", poe: "PoE", power: "Power",
    disconnected: "no link", port_disabled: "disabled", poe_on: "PoE on",
    days: "d", hours: "h", minutes: "min",
    update: "Update", restart: "Restart", restart_confirm: "Really restart {name}?",
    no_devices: "No UniFi devices found. Is the “UniFi Network” integration set up?",
    device_missing: "Device {id} not found.",
    no_sensors: "No sensors enabled – enable the device sensors in the UniFi integration.",
    unreachable: "Device is unreachable.",
    invalid_config: "Invalid configuration",
    sec_appearance: "Appearance", sec_devices: "Devices",
    title: "Title (optional)", theme: "Design", language: "Language", photos: "Use original product photos",
    show_ports: "Show ports", show_firmware: "Show firmware & updates", show_restart: "Show restart button",
    devices: "Devices", name: "Display name", model: "Model / appearance", image: "Custom image (URL)",
    h_devices: "Leave empty to show all UniFi devices automatically.",
    h_photos: "Off: drawn graphics instead of Ubiquiti photos.",
    h_name: "Empty = name from Home Assistant", h_model: "Only change if the device is detected incorrectly.",
    h_image: "e.g. /local/unifi/my-ap.png – empty = original photo or graphic",
    theme_auto: "Automatic (follow Home Assistant theme)", theme_light: "Light", theme_dark: "Dark",
    lang_auto: "Automatic (follow Home Assistant)",
    model_auto: "Detect automatically", graphic: "Graphic",
    g_gateway: "Gateway", g_ap_round: "Access point (round)", g_ap_square: "Access point (square)", g_switch: "Switch",
    order: "Order", order_hint: "Drag devices by the handle or move them with the arrows.",
    move_up: "Move up", move_down: "Move down", drag: "Drag to reorder",
    card_desc: "UniFi devices with real product photos, status LED, ports, clients and firmware.",
  },
};
// Aktuelle Sprache: per Karten-Option `language` oder aus Home Assistant (de* → Deutsch, sonst Englisch)
let LANG = (navigator.language || "en").toLowerCase().startsWith("de") ? "de" : "en";
function setLang(hass, forced) {
  const l = forced && forced !== "auto" ? forced : (hass?.locale?.language || hass?.language || LANG);
  LANG = String(l).toLowerCase().startsWith("de") ? "de" : "en";
  return LANG;
}
const t = (key, vars) => {
  let s = I18N[LANG][key] ?? I18N.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
};

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
// UniFi meldet für Ports ohne Verbindung oft 10 Mbit/s statt 0 (im Controller steht dann "up: false").
// Home Assistant reicht nur die Geschwindigkeit weiter, deshalb gilt ≤ 10 Mbit/s als getrennt.
const LINK_DOWN_MAX_MBIT = 10;
const fmtSpeed = (m) => {
  if (m === null || m === undefined) return null;
  if (m <= LINK_DOWN_MAX_MBIT) return t("disconnected");
  if (m >= 1000) return `${+(m / 1000).toFixed(1)} Gbit/s`;
  return `${Math.round(m)} Mbit/s`;
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
  if (d > 0) return `${d} ${t("days")} ${h} ${t("hours")}`;
  if (h > 0) return `${h} ${t("hours")} ${m} ${t("minutes")}`;
  return `${m} ${t("minutes")}`;
};

/* ---------- Gerätedatenbank (offizielle Ubiquiti-Daten, siehe tools/) ---------- */
// DEVICE_DB:BEGIN – erzeugt mit tools/build-device-db.mjs (2026-11-15), nicht von Hand ändern
// [SKU, Name, Art, interne Modellcodes, weitere Namen, Bild (s: Shop-Foto, a: App-Foto), Status-LED [Form, x, y, b, h] in %, Geräteumriss [x, y, b, h] in %]
const DEVICE_DB_RAW = [
["US-8","8 (Gen1)","switch","US8|USC8","Switch 8|USC8","s:57452968-38ff-463e-954a-8c0a45e85077/77f23229-bb66-4e85-ab80-25579b1db5f3",["band",2.1,42.7,1.3,7.3],[1.3,27.6,97.7,39.3]],
["US-8-60W","8 PoE (Gen1)","switch","USC8P60","US8P60|USC8P60|Switch 8 60W","s:329a00f3-7202-414d-968e-6330ee22037b/32857588-32c5-4fd0-99e7-5e29d0d84d10",["band",7.8,47.1,1,7],[7,33.6,86.5,37.2]],
["US-8-150W","8 PoE, SFP (Gen1)","switch","USC8P150","S28150|US8P150|USC8P150|Switch 8 PoE 150W","s:fdec2ee9-f41c-477c-8459-bc738780dd27/a74b1c79-80c4-492b-9c13-a11ca78bb4bd",["band",13,52.1,3.6,0.5],[10.9,41.4,77.6,23.2]],
["UAP-AC-EDU","AC EDU","ap","U7EDU","U7EDU|Access Point AC EDU","a:13ddabd6-7a68-4f23-8edd-1e83db8dbbb4/565af4c085308f85b401c65c50ba16c4",["ring",38.5,39.1,23.4,22.4],[10.4,10.7,79.2,78.4]],
["UAP-AC-HD","AC HD","ap","U7HD","U7HD|UniFi AC HD|Access Point AC HD","a:bc0e1444-3b03-4b10-9997-4f200cdf3709/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["UAP-AC-IW","AC In-Wall","ap","U7IW","U7IW|UniFi AC In Wall|Access Point AC In-Wall","s:9de03237-a16a-47a4-9c75-db8051799b46/4d2c71cc-e60c-4821-a988-44b5cf7b829a",["band",47.4,23.4,5.2,0.5],[25.3,12.5,49.7,79.9]],
["UAP-AC-IW-Pro","AC IW Pro","ap","U7IWP","U7IWP|UniFi AC In Wall AP Pro|Access Point AC In-Wall Pro","a:7a1db3e5-2a52-4bfa-9d30-1f0acbd97cc9/4c53e7abe276d7b355ce3bc37e5862d8",0,[25.8,10.9,48.4,78.1]],
["UAP-AC-LITE","AC Lite","ap","U7LT","U7LT|Access Point AC Lite","s:30ea4cce-588f-40dc-8ce4-a15b02fc43e9/e952f974-80b0-4283-be5a-12115e21a63c",["ring",31.8,32.3,36.5,35.4],[7.8,7.8,84.4,88.5]],
["UAP-AC-LR","AC Long-Range","ap","U7LR","U7LR|Access Point AC Long-Range","s:d85a6d0f-37b1-4e14-83dd-53f176ae3942/279351b1-fef0-4722-95b6-63feb169e249",["ring",32.6,32.8,35.2,34.4],[7.8,7.8,84.4,88.8]],
["UAP-AC-M","AC Mesh","ap","U7MSH","U7MSH|Access Point AC Mesh","s:256e298c-7a20-4d6a-983f-7445e6cb98df/5ebd628b-79bd-471a-b779-e5b6725f8086",0,[25,11.7,50,81.3]],
["UAP-AC-M-PRO","AC Mesh Pro","ap","U7MP","U7MP|Access Point AC Mesh Pro","s:061a3bec-9109-4b72-aeaa-e3ee095a8403/df143481-4b11-49b2-a21f-01634d1206ff",["band",48.2,68.2,3.9,0.5],[29.4,11.2,41.1,82.6]],
["UAP-AC-Pro","AC Pro","ap","U7PG2","U7PG2|UniFi AC PRO|Access Point AC Pro","s:28be41e3-da0e-4aae-98ce-5978cc61726c/8cc6250e-6c3b-4da2-8217-ae6422a5e153",["ring",32.8,33.3,34.4,33.3],[7.8,8.1,84.4,88.3]],
["UAP-AC-SHD","AC SHD","ap","U7SHD","U7SHD|U7SHDv2|Access Point AC SHD","a:1e6b3848-a078-43ab-be80-5878ea795f57/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["USW-Aggregation","Aggregation","switch","USL8A","USL8A|Switch Aggregation","s:1c748fb1-b4df-43ef-83e0-d5ed26f9db7c/b06fde87-241d-4b4e-8319-8d7d29f6f6c2",0,[10.7,45.6,78.6,10.4]],
["U-AirWire","AirWire","other","UAPEA07","UAW|UAPEA07","s:5c4634fe-2a7f-4a94-918e-04eb3b219f87/88388742-ff82-44f8-b6f2-c6e7b343f2ea",["dot",45.3,49,10.4,4.4],[17.2,37.8,65.6,31.5]],
["UAP-BeaconHD","Beacon HD","ap","UDMB","UDMB|Access Point BeaconHD","a:345e7d69-4b52-4a69-9acd-9948ef5cbabc/06e472000190f82f5399164c8d9f18d0",0,[24.2,10.9,51.6,78.1]],
["UBB","Building Bridge","bridge","UBB","","s:d57f7ab7-4c81-4c88-a848-6f85c49d0a27/c3ec370d-3651-4de7-b1b8-84ee63709874",0,[10.9,18.2,77.9,67.4]],
["UBB-XG","Building Bridge XG","bridge","UBBXG","","s:7d53794c-09ca-4ed2-81c6-3c410ed37398/38e3d67d-46c0-4efa-9426-c4d3fc18ecd9",0,[11.2,16.9,77.6,69]],
["UCG-Fiber","Cloud Gateway Fiber","gateway","UDMA6A8","UCGF","s:48cf74fa-0456-4c5f-bbcc-c1a1ffdc11f9/465257f3-0acc-4a11-bb15-762e7f6c0e9c",["band",31.8,51,2.1,0.5],[11.2,42.4,77.6,18.8]],
["UCG-Industrial","Cloud Gateway Industrial","gateway","UDMA6AD","UCGA6AD","s:b5db03fd-a838-4c6c-a1ee-1451a09d41d4/9635f89d-db57-4d0f-bb2d-40999debed54",["dot",49.2,73.2,1.6,0.8],[11.2,17.4,77.3,70.8]],
["UCG-Max","Cloud Gateway Max","gateway","UCGMAX","","s:8cca3680-14a6-496a-af7d-beba49cea3f2/7c6f4e54-1f20-485a-a0f0-22e968b66a66",["band",26,51.6,4.7,1.3],[10.9,41.4,77.9,24]],
["UCG-Ultra","Cloud Gateway Ultra","gateway","UDRULT","UDR-Pro|UDR-Ultra|UDRULT","s:8d2d9e4b-89f3-49a1-9c17-5d774c0067b4/2e179331-f85a-4bc9-bf3e-d00192522732",["band",26.3,51.6,4.4,1.3],[10.9,41.4,77.9,23.7]],
["UDB","Device Bridge","bridge","UACCMPOEAF","UACC-M-PoE-AF|UACCMPOEAF","s:a2bd3a3b-2094-42b4-abd6-b0ea32bfd5f3/43e44a8d-3921-4cfb-b579-6b0fac0076cf",["band",49.5,19.8,1,7.8],[33.3,8.9,33.3,82]],
["UDB-IoT","Device Bridge IoT","bridge","UACCEA03","","s:0847824f-f6ce-4aeb-b811-f30d134da52f/7f1bb937-1dcc-45c2-992c-90d7c1fecff1",["band",49.5,43.2,1,8.6],[35.2,11.2,29.7,64.3]],
["UDB-Pro","Device Bridge Pro","bridge","UDB","UDB","s:aa234654-23a1-49f8-89af-0eb41a2aec90/89dbcd7d-a21e-41c9-8af5-37937195cfdd",0,[11.2,11.2,77.6,81.5]],
["UDB-Pro-Sector","Device Bridge Pro Sector","bridge","UDBE802","UDB-Sector|UDBSECTOR","s:7f573ad6-b76c-4219-affa-5c34b4dac03b/12851e50-1461-4e66-b1fb-0a71f09ddfa0",0,[33.9,11.2,32.8,85.4]],
["UDB-Switch","Device Bridge Switch","switch","UDBA69F","UDBSW","s:c0d3fc51-9532-4cdf-89f1-631324bf8e4e/7c0debec-7666-412e-9131-1851fcab46bb",0,[10.9,41.4,78.1,22.7]],
["UDM-Beast","Dream Machine Beast","gateway","UDMEA4C","UDMEA4C","s:352e353d-16e7-45b5-805e-712848145c65/487e084b-5e18-4a74-b02c-ea6065ddbcc6",0,[10.4,44.3,79.2,13]],
["UDM-Pro","Dream Machine Pro","gateway","UDMPRO","UDMP","s:9df27ed4-c4ae-471a-8982-f5b0650da76a/2ede4300-385f-4043-8d96-e0400a22465f",0,[11.2,44.3,77.6,14.1]],
["UDM-Pro-Max","Dream Machine Pro Max","gateway","UDMPROMAX","","s:401190d7-6a49-4c2e-bef1-7fe087d2b6b6/95713566-423f-45e1-8b40-6d760f048490",0,[11.2,44.3,77.6,14.1]],
["UDM-SE","Dream Machine Special Edition","gateway","UDMPROSE","UDM-PRO-SE|UDMPROSE","s:1b6fcc08-a6b8-4496-a831-6125a47c412f/1aaaac38-597b-4125-b0de-7a2671580b21",0,[11.2,44.3,77.6,13.8]],
["UDR","Dream Router","gateway","UDR","","s:60459473-c989-41db-93f2-3c0f40df84f3/b4fd2ae0-8d83-4ad0-ab4e-138d034a32f3",["band",28.9,21.4,42.2,1],[26.6,10.9,46.9,81.8]],
["UDR-5G-Max","Dream Router 5G Max","gateway","UDMA6B9","UDR5G","s:59acabe1-9d17-43dc-8015-dfb95897fa11/7da91ff3-a17a-4c0d-80f5-f9f611c6c094",["band",33.1,87.2,33.9,2.9],[32.3,10.9,36.5,84.4]],
["UDR7","Dream Router 7","gateway","UDMA67A","","s:5fd748ec-76b6-48ca-9256-9fb09d50b4b0/c57b6e85-cf5b-48c8-9e92-9f25e4dd0f39",["band",28.4,21.1,43,1.3],[26.6,10.9,46.9,82]],
["UDW","Dream Wall","gateway","UDW","","s:df8c3478-6280-45c0-80e3-78915f9c17c1/b3abc194-6177-499a-ab20-6e21b47629ae",["dot",48.4,51.8,2.6,1],[25,11.5,49.2,77.3]],
["E7","E7","ap","UAPA697","Access Point E7","s:93ae773e-8969-4889-8591-2c227a31ac3f/09ff1a3a-0ce6-43ad-8188-607086944059",["ring",33.6,16.7,43.8,49],[22.7,16.4,54.9,74]],
["E7-Audience","E7 Audience","ap","UAPA699","E7A|Access Point E7 Audience","s:993e484e-4058-49eb-9cdb-4b5e89aec544/3a623234-838e-4663-81d5-0504347980eb",0,[10.9,28.1,78.1,46.9]],
["E7-Audience-EU","E7 Audience","ap","UAPA6AB","E7AEU|Access Point E7 Audience","a:0226f4eb-9c8a-7594-779b-c59bb9b22b7a/436e605c6733e8837f0c0559881ea391",["band",23.4,27.9,52.1,0.3],[10.7,27.6,78.6,39.6]],
["E7-Audience-Indoor","E7 Audience Indoor","ap","UAPA6AF","E7AI|Access Point E7 Audience Indoor","s:dc297e03-3266-43ee-963f-01c2234657a1/39a43dd2-2a31-463b-b125-ddcdcda5050d",0,[10.9,28.1,78.1,41.9]],
["E7-Campus","E7 Campus","ap","UAPA698","E7C|Access Point E7 Campus","s:67bc019d-eb07-4427-8989-b15bfd43cb5f/cbf37b3b-14d3-46f9-9017-0bbf83ec9444",0,[26,14.6,47.9,79.7]],
["E7-Campus-EU","E7 Campus","ap","UAPA6B1","E7CEU|Access Point E7 Campus","a:7d71a15d-596b-4df0-a169-c24ad96dc2fc/f219c8d5885f78ae8dfe0249e708a214",0,[11.2,11.2,77.6,77.6]],
["E7-Campus-Indoor","E7 Campus Indoor","ap","UAPA6BC","E7CI|Access Point E7 Campus Indoor","s:996cbaaa-198b-4f11-92a3-78ffea4c4787/c877a283-3b06-474d-abad-22fa66b73839",["ring",37.5,15.4,38,32.6],[23.7,10.9,52.6,86.7]],
["EAVBRIDGE","EAV Bridge","bridge","UAVAA06","","a:6d55d4ac-aebe-46af-b843-30966293fdca/7c94038692e271a223f5e3a57a2f595a",0,[11.2,32.8,77.6,34.1]],
["USW-Enterprise-24-PoE","Enterprise 24 PoE (Vintage)","switch","US624P","US624P|Switch Enterprise 24 PoE","s:9f693a84-9dcb-452f-889a-faba29ac4b73/5fe1f270-b8f9-4076-8cf3-805bea605720",0,[10.4,44,79.2,13]],
["USW-Enterprise-48-PoE","Enterprise 48 PoE (Vintage)","switch","US648P","US648P|UniFi Enterprise Switch 48 PoE|Switch Enterprise 48 PoE","s:81802ee3-ab5d-46f6-b6f7-2abbe2a5968b/99abbce7-11cf-457d-8cab-0418a12a82c7",0,[10.4,43.8,79.4,13.8]],
["USW-Enterprise-8-PoE","Enterprise 8 PoE (Vintage)","switch","US68P","US68P|Switch Enterprise 8 PoE","s:f9af6d87-2024-475d-a062-2038566ac850/726a4b28-9eb2-46c6-925e-4eef0adb4ad4",0,[11.2,41.4,77.9,25.3]],
["EAV-Fiber","Enterprise Audio/Video Fiber","switch","USWF002","EAVAGG|Switch Enterprise AV Fiber","s:b6dd112b-bedd-4089-8831-c43a1241448a/37b978dc-4a1c-43e1-8a8b-9cc193f66c58",0,[11.2,43.8,77.6,14.8]],
["EAV-XG-24-PoE","Enterprise Audio/Video XG 24 PoE","switch","USWF001","EAV-24-PoE|EAV24P|Switch Enterprise AV XG 24 PoE","s:d7832d85-03a3-4d3f-a935-e9ed5d4f7b8f/8b8579c0-f46a-46ab-8bac-a40796190a2c",0,[11.2,43.8,77.6,14.8]],
["ECS-24-PoE","Enterprise Campus 24 PoE","switch","USWF067","EAS24P|ECS24P|Switch Enterprise Campus 24 PoE","s:f83443e3-38b7-415b-85cd-e3da1d0c044c/6cae8c8d-f8ab-4207-b0f9-111898f30f66",0,[10.4,43.8,79.2,14.6]],
["ECS-24S","Enterprise Campus 24S","switch","USWF005","EAS24S|Switch Enterprise Campus 24S","s:4aca7985-bf07-4835-b2a2-7f14685f50c1/2a9e63b2-ce6e-4df4-a508-3e6758a54bbc",0,[10.7,43.8,78.9,14.6]],
["ECS-24S-PoE","Enterprise Campus 24S PoE","switch","USWF004","EAS24SP|ECS24SP|Switch Enterprise Campus 24S PoE","s:a8ebdcc3-9603-4387-b3ba-50f242bf55ae/9b2de5bf-3bbd-42fa-b647-c105c46d3457",0,[10.7,43.8,78.9,14.6]],
["ECS-48-PoE","Enterprise Campus 48 PoE","switch","USWF069","EAS48P|ECS48P|Switch Enterprise Campus 48 PoE","s:c0e18508-feb3-4d93-93d7-2a022815cfac/feb987d6-1eb6-497a-83fd-af24f4116192",0,[10.4,43.8,79.2,14.6]],
["ECS-48S","Enterprise Campus 48S","switch","USWF007","EAS48S|Switch Enterprise Campus 48S","s:c2dcfd86-e80c-4f55-a883-a40112f222d5/10e0b990-964f-4d9a-a1f7-9eb7dba4bf97",0,[10.7,43.8,78.9,14.6]],
["ECS-48S-PoE","Enterprise Campus 48S PoE","switch","USWF006","EAS48SP|ECS48SP|Switch Enterprise Campus 48S PoE","s:734c4b7d-fd16-43b8-90d6-f2427a0d499d/bb7f429a-5d30-49a5-8ed2-2595e61b753d",0,[10.7,43.8,78.9,14.6]],
["ECS-Aggregation","Enterprise Campus Aggregation","switch","USWF066","ECSAGG|Switch Enterprise Campus Aggregation","s:82c1c564-0e08-4b27-a7b9-95729cca00bd/273218d0-162e-4389-8143-686302547137",0,[10.4,43.8,78.9,14.3]],
["ECS-Core","Enterprise Campus Switch Core","switch","USWF07D","Switch Enterprise Campus Core","s:2fef9072-e7cd-4e94-82c3-b35ed53e473f/6333c1bf-a040-4cb7-a1e8-eecec4f160aa",0,[10.4,43.8,79.2,14.3]],
["EFG","Enterprise Firewall","gateway","UDMENT","UDMENT","s:65adb8bd-c318-45f9-8b9f-9c15fb025ec2/7321698a-e18b-4038-8ac1-f23d8d124c50",0,[10.9,44,78.1,12.8]],
["EF-Core","Enterprise Firewall Core","gateway","UDMEA4B","EFG-Core|EFGCORE","s:8f56712e-ed57-48ca-a180-f8fea2d343c3/9fbc153c-77b3-4b9e-a629-1927c66a7bc6",0,[10.4,43.8,79.4,13.8]],
["UX7","Express 7","gateway","UDMA69B","UX-Max|UXMAX","a:642916c5-9089-4c8d-b108-28216594d7c8/fc16ab538caecb60ed7a96267b64f9e2",["band",43.8,50.5,11.7,3.1],[10.9,33.6,78.1,32.6]],
["USW-Flex","Flex","switch","USF5P","USF5P|Switch Flex","s:c9a07d37-b390-4a5b-89c5-3cdab8e011c7/4bcd3c2b-a8b1-4be1-baab-deda172291cd",0,[11.2,40.9,77.9,28.1]],
["USW-Flex-XG","Flex 10 GbE","switch","USFXG","USFXG|Switch Flex XG","s:61d6b40e-0997-4ce0-b723-bb0c2c4aafa2/9d558a4b-49c7-435d-b574-94f6581e23a9",0,[10.4,41.9,79.4,28.1]],
["USW-Flex-2.5G-8","Flex 2.5G","switch","USWED36","USM25G8|Switch Flex 2.5G 8","s:1d18e099-3be0-4f49-8126-5ade125543b5/19c0d063-e56d-4fbe-958f-b6209eafc8cb",0,[11.2,40.6,77.6,28.9]],
["USW-Flex-2.5G-8-POE","Flex 2.5G PoE","switch","USWED37","USM25G8P|Switch Flex 2.5G 8 PoE","s:e9d97121-f363-4261-83db-5f74e093a304/dd55113e-93b2-40da-b10b-945ab4d609d0",0,[10.9,41.1,77.9,26.8]],
["USW-Flex-Mini","Flex Mini","switch","USMINI|USMINI2","USMINI|USW-Mini|Switch Flex Mini|USMINI2","s:5a176b22-af34-40f2-820c-958610df1825/19394e07-5146-4f8c-b72d-7fdbdf679c97",0,[11.2,41.1,77.6,24.7]],
["USW-Flex-2.5G-5","Flex Mini 2.5G","switch","USWED35","USM25G5|Switch Flex 2.5G 5","s:50830d51-4d7e-47ea-92f4-11043d3d664f/c956d05e-4351-46ba-b71e-afaafa3f1144",0,[10.9,40.9,77.9,29.7]],
["UAP-FlexHD","FlexHD","ap","UFLHD","UFLHD|Access Point FlexHD","a:f84319ea-3df6-429e-a0b5-36587271d094/e37ba48acdfe7e94f62d49a757e37db4",0,[38.3,10.9,23.4,78.1]],
["USW-Pro-Aggregation","Hi-Capacity Aggregation","switch","USAGGPRO","USAGGPRO|Switch Pro Aggregation","s:35879d83-6169-4d6b-abf6-d3b98b1e8367/f8726fbe-a4fa-4c3b-b9d7-ee426646c1be",0,[9.6,44.8,80.7,13]],
["UAP-IW-HD","In-Wall HD","ap","UHDIW","UHDIW|Access Point In-Wall HD","s:7388f491-3118-4f8d-a350-de2e09b3367a/608a8fdd-49a2-4e0a-8fe8-1e479427429a",["band",49,23.7,3.6,0.3],[25,12.5,50,80.2]],
["USW-Industrial","Industrial","switch","USC8P450|USWED05","USC8P450|Switch Industrial|USI8P","s:e9c1cd60-bc9d-4e80-9e17-7a3dbecf9f29/2fad00b0-046a-4040-abb5-a206120bffb6",["dot",13.5,48.4,3.6,5.7],[10.9,40.6,78.4,24.2]],
["USW-Industrial-DIN-2.5G-8-PoE","Industrial DIN 2.5G 8 PoE","switch","USWED9B","USID2P5G8P|Switch Industrial DIN 2.5G 8 PoE","s:940caf8d-bcd2-4fdf-a835-d835a2ccce68/83eaee93-a6f3-45f8-ab98-f8f2a4507af3",["band",61.7,18,8.3,1.6],[25.5,11.2,49,82.3]],
["USW-Industrial-DIN-8","Industrial DIN 8","switch","USWED98","USID8|Switch Industrial DIN 8","s:35508b8f-0600-45e9-aa66-de881a6aa402/6696f16b-2695-485b-89fe-ff1a1dcdf743",["band",63.8,18.5,9.1,1.6],[26.3,10.9,50,83.1]],
["USW-Industrial-DIN-8-PoE","Industrial DIN 8 PoE","switch","USWED97","USID8P|Switch Industrial DIN 8 PoE","s:2224a6a4-5ce5-496a-a8ed-b7a722af5d33/ddeccbf5-680a-4150-8388-faadb9aa663c",["band",63.8,18.5,9.1,1.6],[26.3,10.9,50,83.1]],
["USW-Lite-16-PoE","Lite 16 PoE","switch","USL16LPB|USL16LP|USWED06","USL16LPB|Switch Lite 16 PoE|USL16LP|USW-Lite-16-PoE-gen2","s:e726eace-a772-4f12-bfad-c68baf20e51f/9ecfc657-5e31-4135-89b5-46b3537b35fc",0,[10.7,41.1,78.4,26.3]],
["USW-Lite-8-PoE","Lite 8 PoE","switch","USL8LPB|USL8LP","USL8LPB|Switch Lite 8 PoE|USL8LP","s:75c44878-4e73-446e-8e86-f207db6b2b7c/53b8b06b-69c7-424f-bb81-2f8405356c65",0,[10.4,40.9,79.4,23.7]],
["USW-LR-Switch-8-PoE","Long-Range Switch 8 PoE","switch","USWED99","USMLR8P|Switch LR 8 PoE","s:e89551ff-356e-4a94-9e80-5499fb8c8557/9c84b7ab-b7a0-4694-beb4-9d5eaaedf12e",0,[10.9,41.9,78.1,19]],
["UAP-nanoHD","Nano HD","ap","U7NHD","U7NHD|Access Point Nano HD","a:847aa05f-7155-411c-82ea-47cc8f1eb3e3/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["USW-Pro-24","Pro 24","switch","US24PRO2","US24PRO2|Switch Pro 24","s:2315330e-7a37-4c6b-87df-0743d04e87ca/5281dd32-ad14-40c5-a8d0-2df56a340bae",0,[11.2,45.1,77.6,13.8]],
["USW-Pro-24-PoE","Pro 24 PoE","switch","USLP24P","US24PRO|USLP24P|Switch Pro 24 PoE","s:5b69cdb5-e7ea-44e6-ae16-8714339038fb/18d39964-78e7-45f9-874d-e331f1408730",0,[11.2,44.8,77.6,15.1]],
["USW-Pro-48","Pro 48","switch","US48PRO2","US48PRO2|Switch Pro 48","s:17a1db0a-a705-4ea0-b538-2972ca71615a/e5caa219-3faa-48a5-a4e1-d7eea81d738b",0,[10.9,44.5,78.1,16.1]],
["USW-Pro-48-PoE","Pro 48 PoE","switch","USLP48P","US48PRO|USLP48P|Switch Pro 48 PoE","s:6e019f0c-26b5-4fdf-b4e1-994abd9ce6e1/483da8b5-c584-4100-a4f2-18d11fa7187e",0,[10.9,44.5,78.4,16.1]],
["USW-Pro-8-PoE","Pro 8 PoE","switch","USLP8P","USLP8P|Switch Pro 8 PoE","s:37c8c814-f786-4f8a-ac58-96525f22e029/d4a21d75-7b98-43d5-9868-36cab2ba8161",0,[10.4,41.7,78.9,22.4]],
["USW-Pro-HD-24","Pro HD 24","switch","USWED73","USPH24|Switch Pro HD 24","s:66804bfc-9afd-453c-adbb-7327d8cebe25/387ab337-f5c8-4f8f-94e1-cffc8888ad1d",0,[10.7,44.3,78.9,12.8]],
["USW-Pro-HD-24-PoE","Pro HD 24 PoE","switch","USWED72","USPH24P|Switch Pro HD 24 PoE","s:17d901a5-c99b-4b02-8d3b-8cb7a5da0512/2ce20101-767d-4e15-b0dc-80449d2807a1",0,[10.4,43.8,79.7,13.8]],
["USW-Pro-Max-16","Pro Max 16","switch","USPM16","USPM16|Switch Pro Max 16","s:065e9d0f-19c7-4b9e-8b36-8e900363af80/b888cf82-f499-4460-943a-5e92a7a9cf79",0,[9.4,43.5,81,14.6]],
["USW-Pro-Max-16-PoE","Pro Max 16 PoE","switch","USPM16P","USPM16P|Switch Pro Max 16 PoE","s:0694226c-9791-4d7e-9fb1-d98c91fe3fda/7b73b27e-e77a-4771-b6bf-0aed35b4a16e",0,[9.4,43.5,81,14.6]],
["USW-Pro-Max-24","Pro Max 24","switch","USPM24","USPM24|Switch Pro Max 24","s:dd435390-1705-4159-852c-fd210b4e7c17/756296a7-f55d-4ac6-9aa0-fb946ee30434",0,[10.4,44,78.9,13]],
["USW-Pro-Max-24-PoE","Pro Max 24 PoE","switch","USPM24P","USPM24P|Switch Pro Max 24 PoE","s:58922518-88f6-4c75-89c1-f57ba3d8253a/797246c6-70eb-4606-be9a-77515ac74451",0,[10.4,44,79.2,13]],
["USW-Pro-Max-48","Pro Max 48","switch","USPM48","USPM48|Switch Pro Max 48","s:0966f626-63a9-4dc6-b07d-2e0b40e2cead/9bfb5a25-50a7-4c22-b2b9-ee3c8b4a82c0",0,[10.4,44,79.2,13]],
["USW-Pro-Max-48-PoE","Pro Max 48 PoE","switch","USPM48P","USPM48P|Switch Pro Max 48 PoE","s:51e22689-9b81-4717-beed-fe2c65c57362/18b790aa-f0b3-4e6b-9aca-63948c65535d",0,[10.4,43.8,79.4,13.8]],
["USW-Pro-XG-10-PoE","Pro XG 10 PoE","switch","USWED77","USPXG10P|Switch Pro XG 10 PoE","s:2617380d-b3a8-47c3-802f-fcc22d24e931/0af98290-e7a4-4d4f-b4e5-bd781f3d2132",0,[10.4,44.3,78.6,13.3]],
["USW-Pro-XG-24","Pro XG 24","switch","USWED45","USWPXG24|Switch Pro XG 24","s:5f2af015-a9fd-4f79-9779-74860c328e75/68de03e5-b2d6-41e0-bee0-82c106fe2ee6",0,[10.4,43.8,79.4,15.1]],
["USW-Pro-XG-24-PoE","Pro XG 24 PoE","switch","USWED44","USWPXG24P|Switch Pro XG 24 PoE","s:b6f03374-2a31-428c-86fb-62b49739c924/89656ee3-c3f8-424e-b3b1-e493508deffa",0,[10.4,43.8,79.4,15.1]],
["USW-Pro-XG-48","Pro XG 48","switch","USWED43","USWPXG48|Switch Pro XG 48","s:3ecbd029-ba8a-4f82-aa5e-0f2902f60576/1ee9bf0b-ece0-4fe9-bfec-64e21a8eed7e",0,[10.4,43.8,79.2,15.1]],
["USW-Pro-XG-48-PoE","Pro XG 48 PoE","switch","USWED42","USWPXG48P|Switch Pro XG 48 PoE","s:b4f97072-47c3-4ea1-96aa-616b94c1ca05/ffad1ad8-f360-420b-9a67-39f12065c33e",0,[10.4,43.8,79.2,15.1]],
["USW-Pro-XG-8-PoE","Pro XG 8 PoE","switch","USWED76","USPXG8P|Switch Pro XG 8 PoE","s:104a0f86-8c2e-462d-a95c-ebbc5675ebb8/a78f6eeb-f4ef-4401-aae4-4d8a50e30fce",0,[10.7,40.9,78.1,26.3]],
["USW-Pro-XG-Aggregation","Pro XG Aggregation","switch","USWF003","USWPXGAGG|Switch Pro XG Aggregation","s:2f42897e-4b8e-4851-af6a-5106211f979e/e541f8bf-a009-427f-815f-7966afbfd1ac",0,[10.4,43.8,79.4,14.3]],
["UACC-SFP-Wizard","SFP Wizard","other","USFPW","USFPW","a:893ab2e1-3ee6-43f2-a609-8509e2e30574/32a934e2daf57689ec310896e90143c8",0,[27.9,10.9,44.5,78.1]],
["USW-16-PoE","Standard 16 PoE","switch","USL16PB|USL16P","USL16PB|Switch 16 PoE|USL16P","s:ab04370e-f45d-4651-828c-b290de8df45b/8fe1e8dc-fb88-4102-91b5-e1826d079d37",0,[11.2,45.3,77.6,13.8]],
["USW-24","Standard 24","switch","USL24B|USL24","USL24B|Switch 24|USL24","s:d443e087-efcf-47a1-8465-7fa3e60cf916/23c2a6bc-a606-43c0-9f3c-27f04f437bdf",0,[11.2,45.3,77.6,13.8]],
["US-24-G1","Standard 24 (Gen1)","switch","US24","US-24|US24|UniFi Switch 24|Switch 24","s:fc8d2e53-536f-4de4-834c-dd945260404c/082b1a8d-aeb9-4075-9ee5-50af935ec6f8",["dot",1.3,45.8,6.3,6.3],[0.5,36.7,99.2,18.8]],
["USW-24-PoE","Standard 24 PoE","switch","USL24P|USL24PB|USWED08","USL24P|UniFi Switch PoE 24|Switch 24 PoE|USL24PB|USW-24-PoE-gen2","s:467359c4-e5c3-487b-ae00-f6b7de29c6fc/1fd41f67-8fd9-4689-989e-c03b43217e3a",0,[11.2,45.3,77.6,13.8]],
["US-24-500W","Standard 24 PoE Hi-Power (Gen1)","switch","US24P500","S224500|US24P500|Switch 24 PoE 500W","s:e93dcaf7-659b-45cd-a2a6-02c86a610aa5/1efb2070-8ce2-46b1-bf60-285762158039",["band",7.8,53.4,0.5,1.8],[4.2,49.2,90.1,14.3]],
["USW-48","Standard 48","switch","USL48|USL48B","USL48|Switch 48|USL48B","s:8a649eb8-c497-4240-92ba-a5c7a792c395/fcf3841a-9b8c-45b1-9d77-8f878bebdcba",0,[10.9,44.8,77.9,15.1]],
["US-48-G1","Standard 48 (Gen1)","switch","US48","US-48|US48|UniFi Switch 48|Switch 48","s:82cb04ea-31b6-42d8-99a2-1bb6276aac15/b75f2450-52b8-450f-8c04-0af1e84701d2",["dot",1.8,46.1,6.3,6],[1,36.2,97.9,19.8]],
["USW-48-PoE","Standard 48 PoE","switch","USL48P|USL48PB","USL48P|UniFi Switch PoE 48|Switch 48 PoE|USL48PB","s:147e90c2-da47-44ad-ad19-b98e223cb54b/378bcc80-2ebd-45f1-a2fc-0e66669824e1",0,[10.9,44.8,77.9,15.1]],
["US-48-500W","Standard 48 PoE (Gen1)","switch","US48P500","S248500|US48P500|UniFi Switch 48 AT 500W|Switch 48 PoE 500W","s:6f7fec08-d391-4466-947e-72182abcb738/d9cb3dca-7370-49f9-9c0b-1534b515e931",["dot",15.1,50,4.2,4.2],[11.2,44.3,77.6,14.6]],
["US-48-750W","Standard 48 PoE Hi-Power (Gen1)","switch","US48P750","S248750|US48P750|UniFi Switch 48 AT 750W|Switch 48 PoE 750W","s:1e5e0119-083c-46fb-a303-e2e5be1dabd7/2af1a3eb-82a1-49f4-95d4-b794af59c52c",0,[2.3,48.7,92.7,15.9]],
["UK-Ultra","Swiss Army Knife","gateway","U7UKU","U7UKU","s:eecac847-6407-4539-bbf0-03d0f8f3232f/9573d154-2b35-40df-8491-819c2a7eb244",0,[26,10.9,47.9,82]],
["U5G-EU","U5G Backup","other","UMBBE634","U5G-Antenna-EU|U5G-Backup-EU","a:64935368-65ae-4d35-b0a3-038b7919b030/e8b7f8aa05139e032536d6b6001e5ae8",["band",47.9,71.6,2.6,0.3],[42.4,10.9,15.1,78.1]],
["U5G-US","U5G Backup","other","UMBBE633","U5G-Antenna-US|U5G-Backup-US","a:e6e7188e-9a52-493e-b1c7-e6482074ccbb/e8b7f8aa05139e032536d6b6001e5ae8",["band",47.9,71.6,2.6,0.3],[42.4,10.9,15.1,78.1]],
["U5G-Max","U5G Max","gateway","UMBBE630","5G-Link|U5G-Link|U5GLINK","a:77ce1d39-d79f-4e02-9e63-258f639462f2/1b19d02a0d29ce47d7757b12373fce7d",["band",45.8,53.9,8.1,0.3],[26.6,11.2,46.9,77.6]],
["U5G-Max-Outdoor","U5G Max Outdoor","gateway","UMBBE631","5G-Link-Outdoor|U5G-Link-Outdoor|U5GMAXO","a:2c51d3ae-060a-470c-a295-e74689ece89a/111fa4f36e6c2d971d190fa957165aac",0,[20.8,11.2,58.3,77.6]],
["U6-Enterprise","U6 Enterprise","ap","U6ENT","U6ENT|Access Point U6 Enterprise","s:f9118c0f-060b-4fd7-99ce-ace671c7a1fe/6f2a87a4-193d-43e0-b253-aa0ea0795694",["ring",32.6,32.8,35.2,34.4],[8.1,8.1,84.1,88.3]],
["U6-Enterprise-IW","U6 Enterprise In-Wall","ap","U6ENTIW","U6ENTIW|Access Point U6 Enterprise In-Wall","s:f433d754-48f1-418e-b9cb-5cbdad450cde/55fb0115-6a19-4d49-b1b8-5b52e00ad4d9",0,[6.8,8.1,86.5,88.5]],
["U6-Extender","U6 Extender","ap","UAE6|U6EXT","UAE6|Access Point U6 Extender|U6EXT","s:25250ea7-8a67-4ddf-855b-d712a61c62a4/833afef7-a129-4218-9f1f-1ede30b42a58",0,[22.1,8.1,55.7,88.5]],
["U6-IW","U6 In-Wall","ap","UAIW6|U6IW","UAIW6|Access Point U6 In-Wall","s:9e487835-2aa9-4813-b210-732744a2884a/cac2e05e-2e46-4d47-84b2-7e3bb7d7ca1a",0,[19,8.1,61.7,89.8]],
["U6-Lite","U6 Lite","ap","UAL6","UAL6|Access Point U6 Lite","a:3aee50f4-7a04-4b00-a466-791803131293/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["U6-LR","U6 Long-Range","ap","UALR6v3|UALR6v2","UALR6V3|UALR6v3|Access Point U6 Long-Range|UALR6V2|UALR6v2","s:d8fee47d-b53e-4a86-a5cb-cf2f6ab1c5ef/4f1f5856-05c2-4989-970e-6751e6af7eb9",["ring",32.6,32.8,35.2,34.4],[7.8,7.8,84.4,88.8]],
["U6-LR-EA","U6 LR","ap","UALR6","UALR6|Access Point U6 Long-Range","a:38c08a41-c27a-eb94-466b-5cceec6205e4/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["U6-PLUS-LR","U6 LR+","ap","UALRPL6","UALRPL6|Access Point U6 Long-Range+","a:fa66c9b2-ba69-4f34-b346-051753cda2e9/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["U6-Mesh","U6 Mesh","ap","UAM6|U6M","UAM6|Access Point U6 Mesh|U6M","s:7b8f8da5-d684-4170-be1f-71b53af8d7f9/fdce5345-80e9-4edd-bf5b-93cf9141649e",0,[38.5,11.2,22.9,82.6]],
["U6-Mesh-Pro","U6 Mesh Pro","ap","U6MP","U6MP|Access Point U6 Mesh Pro","s:34b89d08-9ac2-4e83-8d83-10ca6a7d83a9/f26e0cfe-585c-43b8-819e-dbf047578afd",["band",47.9,68,4.4,0.8],[29.7,11.7,40.6,78.6]],
["U6-Pro","U6 Pro","ap","UAP6MP","UAP6MP|Access Point U6 Pro","s:8e88b222-7a55-4cf0-8677-ae9b6347fe84/e16aa122-b5e5-4ffb-9f1a-27ee14d9ab3d",["ring",32.8,33.3,34.4,33.3],[7.8,8.1,84.4,88.3]],
["U6+","U6+","ap","UAPL6","UAPL6|Access Point U6+","s:6d5c6141-e2e9-416a-b789-53e59416bb1a/853bc73b-f65b-4e59-a171-75c9a4a4615e",["ring",31.8,32.3,36.7,35.7],[7.8,7.8,84.4,88.5]],
["U7-IW","U7 In-Wall","ap","UAPA6A5","G7IW|Access Point U7 In Wall","s:9ea6158e-bc26-4ac7-946a-55eca465b059/566b1098-3514-46b6-8aee-4fde454d1205",0,[18.8,11.5,62,82.6]],
["U7-Industrial","U7 Industrial","ap","UAPA6BE","U7I|Access Point U7 Industrial","s:27c2f194-28fc-4853-b39f-2c387d0c0669/148df734-e1b3-49fe-b2ad-284ec3f44fb0",["dot",49,82,2.1,0.8],[5.5,19.3,89.1,79.2]],
["U7-Lite","U7 Lite","ap","UAPA693","G7LT|Access Point U7 Lite","s:253cc208-4b09-4b2e-9d1a-7aa1e8f93507/49241c96-878f-4e40-8541-c2e89c1c5e6e",["ring",34.4,34.1,31.3,31.5],[11.2,11.2,77.6,85.4]],
["U7-LR","U7 Long-Range","ap","UAPA6B3","G7LRv2|Access Point U7 Long-Range","s:7455fa2b-3074-47a0-b82f-a2cd701d4a8f/06752627-8180-42ea-afe3-4cfac57c10eb",["ring",35.7,35.7,28.6,28.6],[11.5,11.5,77.1,81.3]],
["U7-Mesh","U7 Mesh","ap","UAPA69E","U7M|Access Point U7 Mesh","s:3d6c28a3-3ba8-468c-b084-a7daf9d91d31/dd12539d-4c7e-4246-af89-b322f0ab7128",["band",41.7,11.2,16.9,0.8],[38.5,10.9,22.9,82.6]],
["U7-Outdoor","U7 Outdoor","ap","UKPW","UK-Pro|UKPW|Access Point U7 Outdoor","s:62cc30b7-9559-480f-9668-b9edf40c0772/f2010c22-ff34-48e5-81f4-e7dad275d3c0",0,[19,12.2,62,79.4]],
["U7-Pro","U7 Pro","ap","U7PRO","Access Point U7 Pro","s:fa8dd4e4-36c8-4c79-a928-22c7bff2ce29/ab5bc8a4-6135-402e-a695-e3ea5e16d3e6",["ring",32.8,33.3,34.4,33.3],[7.8,8.1,84.4,88.3]],
["U7-Pro-Max","U7 Pro Max","ap","U7PROMAX","Access Point U7 Pro Max","s:350070a0-ae43-431b-b052-8e849c3b0a75/bad94693-bc54-4ab4-b060-9b972401941c",["ring",32.8,33.3,34.4,33.3],[7.8,8.1,84.4,88.3]],
["U7-Pro-Outdoor","U7 Pro Outdoor","ap","UAPA6A6","U7PO|Access Point U7 Pro Outdoor","s:29714d60-88e2-482c-aded-e0c456b51f98/277445cb-7d35-4be0-b267-1331067895bf",0,[19,12,62,79.9]],
["U7-Pro-Outdoor-EU","U7 Pro Outdoor","ap","UAPA6B0","U7POEU|Access Point U7 Pro Outdoor","a:6a08c01f-6ac1-2264-d20b-813a3223d34b/9b17822dcb8bb18efb6e5960827d7d02",0,[18.2,10.9,63.5,78.1]],
["U7-Pro-Wall","U7 Pro Wall","ap","U7PIW","U7-Pro-IW|U7PIW|U7-Pro-W|Access Point U7 Pro Wall","s:7dacb4f6-b703-4154-9264-784f2eb0dbda/f1cb65a5-c557-4e02-bcbb-090502a95b84",0,[24,12.5,52.1,79.4]],
["U7-Pro-XG","U7 Pro XG","ap","UAPA6A9","Access Point U7 Pro XG","a:88237e91-7020-be74-ca43-7c6aa48feab9/88db6e36b92a7b81802faf22fb72322e",["ring",35.2,35.2,29.7,29.7],[10.9,10.9,78.1,78.1]],
["U7-Pro-XG-B","U7 Pro XG","ap","UAPA6AE","Access Point U7 Pro XG","a:6f5cefaf-6810-4525-aafd-ea704c1f50b9/f3707f0e330a3a3d01a90e8f1453123f",["ring",34.9,35.2,29.9,29.9],[10.7,10.7,78.6,78.6]],
["U7-Pro-XG-Wall","U7 Pro XG Wall","ap","UAPA6BA","U7PROXGW|Access Point U7 Pro XG Wall","s:c7f7e7f9-b357-44ea-8d30-1191140face2/6646484f-bded-4032-8826-93f919d950ec",["dot",49,25,2.1,1],[23.4,11.7,53.1,79.9]],
["U7-Pro-XGS","U7 Pro XGS","ap","UAPA6A4","Access Point U7 Pro XGS","a:e5868c5e-578a-dd54-d00b-cacde75cb54a/5c76f006212c2bdaa65ccc340ade26a7",["ring",35.7,35.7,28.6,28.4],[10.9,10.9,78.1,78.1]],
["U7-Pro-XGS-B","U7 Pro XGS","ap","UAPA6AC","Access Point U7 Pro XGS","a:e31bdf35-5d67-4ccf-b1cb-337c658bce95/8bf92859b7c649e197fb37ca7040ffbb",["ring",35.7,35.7,28.4,28.4],[10.9,10.9,78.1,78.1]],
["UAP","UAP","ap","U2S48","BZ2|U2S48|Access Point","a:ed103a3b-4dce-4330-9313-af30688e5a40/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["UAPv2","UAP","ap","U2Sv2","U2SV2|U2Sv2|Access Point","a:c38fdc61-f3de-4aa2-ba96-3fe8ba9b741c/618eeccb0a3190d8f03a77437e43c5bc",["ring",34.9,34.6,30.2,30.5],[10.9,10.9,78.1,78.1]],
["UAP-AC","UAP AC","ap","U7Ev2","U7E|U7EV2|U7Ev2|U7ev2|Access Point AC","a:acabff5f-85c1-46ee-8d04-17cd1adc9cc8/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["UAP-AC-Outdoor","UAP AC Outdoor","ap","U7O","U7O|Access Point AC Outdoor","a:d5ac5867-f79c-4127-af41-cd696b116b2b/90c24f1d9ef84106cf42da792b34359c",["band",47.7,68.2,4.7,1],[29.4,10.9,41.1,78.1]],
["UAP-IW","UAP IW","ap","U2IW","U2IW|UniFi AP In Wall|Access Point In-Wall","a:bcc0a8ac-d44b-43e8-8a92-57388da6df8a/159d21ca365baa92efc2d9ef4fd00593",["band",45.3,34.6,8.9,2.1],[25.8,10.9,48.4,78.1]],
["UAP-LR","UAP LR","ap","U2L48","BZ2LR|U2L48|Access Point Long-Range","a:7ded8c1e-1969-4661-ba79-88874d2ba476/ee9b96355c0f64d7c4461ed627efd919",0,[10.9,10.9,78.1,78.1]],
["UAP-LRv2","UAP LR","ap","U2Lv2","U2LV2|U2Lv2|Access Point Long-Range","a:53607bcb-2775-4bb3-91c3-2ca22c06c82c/618eeccb0a3190d8f03a77437e43c5bc",["ring",34.9,34.6,30.2,30.5],[10.9,10.9,78.1,78.1]],
["UAP-Outdoor","UAP Outdoor","ap","U2O","U2O|UniFi AP Outdoor|UniFi Mesh Outdoor|Access Point Outdoor","a:80482989-83b6-40cd-a54c-bc305addd9d9/23c70dc98bc2fddebaa1f37665ede25f",0,[41.7,11.2,16.7,77.3]],
["UAP-Outdoor-5","UAP Outdoor 5","ap","U5O","U5O|Access Point Outdoor 5","a:d0c96929-e831-4bac-a624-caf1a9c308b3/1431f29c974b8d2b6903f350f6c20e96",0,[31,10.9,38,78.1]],
["UAP-Outdoor+","UAP Outdoor+","ap","U2HSR","U2HSR|Access Point Outdoor+","a:b3ff0a59-22d0-4176-8d55-60cd6a5aacfb/739759e26f3c209348dc22bc17a1040a",0,[41.4,10.9,17.2,78.1]],
["UAP-Pro","UAP Pro","ap","U7P","U7P|Access Point Pro","a:4bb12a25-ca20-479c-831a-0e098e62806c/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["UAP-XG","UAP XG","ap","UCXG","UCXG|Access Point XG","a:70b77741-d7a5-4d02-a8e9-e54f465a12af/4fac659e9e888a9298a9f24ce02373b2",["ring",34.6,34.9,30.7,30.2],[10.9,10.9,78.1,78.1]],
["UAS-XG","UAS XG","gateway","UASXG","UAS|Application Server XG","a:c558246f-bfd7-4dc5-b077-659675d691dc/a8df82c0fee9392cd15e626a689e153b",["band",14.3,53.1,1.8,0.5],[10.9,44.5,78.1,10.7]],
["UCI","UCI","other","UCI","Cable Internet","a:f0290a73-4c78-420a-b659-4928db8a1fad/7c930f3e8c2008afcd4c662123b30c66",0,[10.9,45.6,78.1,8.9]],
["UCK","UCK","other","UCK-v3","UCK-V2|UCK-v2|UCK-V3|UCK-v3|CloudKey","a:3fadd594-e932-43f6-9f85-37fa624c262e/cb52d99d50f3a1aad1554c0d4807e10d",["band",50,45.1,0.3,5.7],[35.9,10.9,28.1,78.1]],
["CK-Enterprise","UCK Enterprise","other","UCKENT","UCKENT|CloudKey Enterprise","a:8dc148ad-2825-450c-af1b-b10888bc1260/35becbc9f54e9276c6c7b069bd8aa419",0,[10.9,44.8,78.1,10.4]],
["UCK-G2","UCK G2","other","UCKG2","CloudKey","a:180a4f60-1030-4935-b2df-6499e308524f/121c4c4f109572a95a8d42cd834bcefd",0,[20.8,28.1,58.3,43.8]],
["UCK-G2-PLUS","UCK G2 Plus","other","UCKP","UCKP|CloudKey+","a:ed67d43e-2d5c-4928-ace8-edf984baeff1/977c1f8c477549aeb7238727fd4ecc62",0,[10.4,35.4,77.9,29.4]],
["UDM","UDM","gateway","UDM","Dream Machine","a:142cd194-8164-46a1-ba48-bef078757393/015d558b57f631225c3ba6a73660d4df",["band",29.2,19.8,42.2,2.1],[27.1,11.2,45.8,77.9]],
["USW-Ultra","Ultra","switch","USM8P","USM8P|Switch Ultra","s:d4e5408e-e2b4-4b32-b9d6-efdde2bbaaf3/69808d5d-ba9c-4198-b3e9-749bbb02582c",["dot",14.8,48.4,1,1.3],[13,41.7,74.7,25.3]],
["USW-Ultra-210W","Ultra 210W","switch","USM8P210","USM8P210|Switch Ultra 210W","s:04d0418c-989e-4316-b143-e7a89c90b72d/fbfadf63-3eeb-4173-8340-3f6119fd7d72",["dot",14.8,48.4,1,1.3],[13,41.7,74.7,25.3]],
["USW-Ultra-60W","Ultra 60W","switch","USM8P60","USM8P60|Switch Ultra 60W","s:d1af5d9b-b74c-4881-99af-033b71ed1590/f80567f8-ba09-4a75-982d-6fd636623492",["dot",14.8,48.4,1,1.3],[13,41.7,74.7,25.3]],
["UX","UniFi Express","gateway","UX","UEX|Express","s:4ed25b4c-db92-4b98-bbf3-b0989f007c0e/3ff34453-72fa-485e-b2fa-836b10dbc3be",["dot",23.7,49.5,7,3.1],[11.2,38,77.6,29.9]],
["UTR","UniFi Travel Router","gateway","UTREA06","Travel Router","s:56664a45-ee21-460f-a8fb-e607a959a379/b9602ad1-009b-47b9-b1b9-03d97e502767",0,[34.1,26.8,31.5,49.7]],
["UTR-LR","UniFi Travel Router Long-Range","gateway","UTREA08","Travel Router Long-Range","s:0defc770-d70c-4938-9648-72722361dc79/8b284c0f-d1ed-485c-846b-a321bedb02d6",0,[33.9,12.5,33.9,78.4]],
["UPS-2U-EU","UPS 2U","switch","USWDA26","UPS26","a:b5c0849b-0157-43db-9fc9-625c4485f81d/a0e82e4b5d82c007b4d1ca30253c3bba",["dot",13.5,49,3.1,3.1],[11.2,41.1,77.6,17.2]],
["UPS-2U-US","UPS 2U","switch","USWDA25","UPS25","a:8c892836-041f-42b6-ad12-65ad2ebfc187/a0e82e4b5d82c007b4d1ca30253c3bba",["dot",13.5,49,3.1,3.1],[11.2,41.1,77.6,17.2]],
["UPS-2U-Pro-EU","UPS 2U Pro","other","USPDA2C","UPSPROEU","a:c65cf5e1-c884-475c-91d4-d49af72f4cc5/49a0bf654148fbac5acbda283a06d0f4",["dot",13.5,50,3.1,3.1],[11.2,40.6,77.6,18.8]],
["UPS-2U-Pro-US","UPS 2U Pro","other","USPDA2B","UPSPROUS","a:0d4330d4-78b0-488f-b7a2-6ca718640043/49a0bf654148fbac5acbda283a06d0f4",["dot",13.5,50,3.1,3.1],[11.2,40.6,77.6,18.8]],
["USW-Mission-Critical","UPS PoE Switch","switch","USL8MP","USL8MP|Switch Mission Critical","s:0a2a7ba1-12c3-4736-a31d-ed9a0e9f44d1/f09f5ea1-7307-41bf-89d4-bd864b4cb895",0,[10.4,43.5,79.7,16.1]],
["UPS-Tower-EU","UPS Tower","switch","USWDA24","UPS24","a:a7cb6248-8b64-45b9-a0ad-2a1ad672597f/6d7197be906aad4ace3bbbf502cd6490",["dot",47.4,22.4,5.2,4.9],[36.5,11.5,27.1,76.8]],
["UPS-Tower-US","UPS Tower","switch","USWDA23","UPS23","a:328099cb-f1ad-4b47-ad81-2f4ac20170c9/e1606352f97f6c5ae3f0121344b98e4f",["dot",47.4,22.4,5.2,5.2],[36.5,11.5,27.1,76.8]],
["US-16-150W","US 16 PoE 150W","switch","US16P150","S216150|US16P150|Switch 16 PoE 150W","a:34cb6371-02d6-461f-a318-0e6568528aee/0548f2954243e7a939b3f42d9a5f43df",["dot",11.5,50,4.7,4.2],[10.9,44.5,78.1,10.9]],
["US-24-250W","US 24 PoE 250W","switch","US24P250","S224250|US24P250|UniFi Switch AT 24 250W|Switch 24 PoE 250W","a:fc91bf40-ed01-4f12-bfe6-d9c5f86f7504/3a6eccae03d639e1ae0d15c3d0b62f5d",["band",18.8,50.3,0.5,3.4],[10.9,44.8,78.1,10.4]],
["US-L2-24-PoE","US L2 24 PoE","switch","US24PL2","US24PL2|Switch L2 24 PoE","a:9b793384-296d-413d-9d55-bf59a76147bb/da343f37a4ab71e75a333ec37a94fc4c",["band",12.2,53.4,3.9,0.8],[10.9,44.3,78.1,11.5]],
["US-L2-48-PoE","US L2 48 PoE","switch","US48PL2","US48PL2|Switch L2 48 PoE","a:1e69003c-37b5-401d-95a2-95f79ae4a248/09e8d305c88fe9a4190e53eb0370a207",["dot",14.8,53.4,1.3,0.8],[10.9,44.3,78.1,11.5]],
["US-16-XG","US XG 16","switch","USXG","USXG|Switch XG 16","a:c0563b69-fcc4-47c7-be11-4dbc676ec9c6/3b664333dbddcdba35973bfea700dc01",["band",15.6,50,0.5,4.2],[10.9,44.3,78.1,11.5]],
["USG","USG","gateway","UGWHD4","UGWHD4|Security Gateway","a:f3c83eb7-1972-4b08-8e7d-9652ece3fd52/c75f6c5014eaf8f73c62d942e30fc228",0,[11.2,39.6,77.6,21.1]],
["USG-3P","USG 3P","gateway","UGW3","UGW3|Security Gateway 3P","a:aca62980-de77-42e3-abf4-19b8e3cabcf7/c75f6c5014eaf8f73c62d942e30fc228",0,[11.2,39.6,77.6,21.1]],
["UGW8","USG Pro","gateway","UGW8","","a:5418881a-6fb6-409f-86bc-7c845ca66366/4f164ccfa41cf579f1d402673ba1a8f8",0,[10.9,44,78.1,12]],
["USG-PRO-4","USG Pro","gateway","UGW4","UGW4|Security Gateway Pro","a:f5e4600c-e9fd-4261-b998-b4867beeb29f/c322228b2ad5ac32fb8328605ea9eb52",["dot",15.4,48.4,3.9,3.6],[10.9,45.8,78.1,8.6]],
["USG-XG-8","USG XG 8","gateway","UGWXG","UGWXG|Security Gateway XG 8","a:43973cc0-7687-4bee-a33d-5af315ca9c0b/4f164ccfa41cf579f1d402673ba1a8f8",0,[10.9,44,78.1,12]],
["USP-PDU-HD","USP PDU HD","switch","USPPDUHD","Power Distribution Hi-Density","a:3d59ef70-bc5e-4536-92cd-37ff842250aa/8a9090b6dfd2ef805297c1568c1a82fc",0,[43.8,15.4,12.8,83.1]],
["USP-PDU-Pro","USP PDU Pro","switch","USPPDUP","USPPDUP|Power Distribution Pro","a:79e1c24d-7fca-462a-b1d7-3abc78181c4f/a7dbcf9a52361a56f5768e793925a431",0,[10.9,41.9,78.1,16.1]],
["USP-PDU-Pro-EU","USP PDU Pro","other","USPED18","USPPDUPEU|USPPDUP-EU|Power Distribution Pro","a:8b97efdb-b74a-45b3-b090-27e83c4b8bbb/86e9816fc6acb8e0a3128c7c566abefc",0,[10.9,41.7,78.1,16.1]],
["USP-Plug","USP Plug","ap","UP1","UP1|SmartPower Plug","a:4aa601aa-4c2b-4e0c-886a-41ebf8c731f8/59793563923bdda9b56ad35187f4cd0c",0,[10.9,11.2,78.1,77.9]],
["USP-RPS","USP RPS","switch","USPRPS","Power Backup","a:1d905584-35b7-4ad1-9e48-0c1c4822629d/b78760cee2f5e7750a95f6fb0b439cc1",0,[10.9,44.3,77.9,11.5]],
["USP-RPS-Pro","USP RPS Pro","switch","USPRPSP","USPRPSP|Power Backup Pro","a:c1e64a8b-9524-47e7-aed8-ea235c16a46b/9104eb52e328dc557a8e6b2736b3af8d",0,[10.7,41.4,78.6,17.4]],
["USP-Strip","USP Strip","ap","UP6","UP6|SmartPower Strip","a:fb410453-da92-403b-bbec-74f8ff0bf0b0/dcce319d2166e5bd7499c44a8bc91895",["dot",32.6,43.8,1,3.1],[11.5,39.1,77.6,21.9]],
["USW-EnterpriseXG-24","USW EnterpriseXG 24","switch","USXG24","US-24-XG|USXG24|UniFi Enterprise Switch XG 24|Switch EnterpriseXG 24","a:572c2e1f-a8ed-40b8-a449-ac32778b0168/92d5a8b30d93f6ec4b9e71e660ec2d05",0,[10.9,44.3,78.1,11.2]],
["USW-Leaf","USW Leaf","switch","UDC48X6","UDC48X6|Switch Leaf","a:5e7dc81c-38f3-4ac3-9bc7-bc806e94a309/bda9e079725465ec19d847921351d365",0,[10.9,43.8,78.1,12.5]],
["UWB-XG-BK","UWB XG","ap","UXBSDM","UXBSDM|WiFi BaseStation XG","a:345a2ec1-6f7f-4077-b1ee-09ba9c59ed41/c9dfd201ffe1fff62f46659edacae83f",["band",41.1,63.3,45.3,1.3],[10.9,27.9,78.1,44.3]],
["UXG-Enterprise","UXG Enterprise","gateway","UXGENT","UXGENT|Gateway Enterprise","a:e567a449-cfbe-4cdf-9aed-975fac5256d9/1f3133ffae76aea2e738892a78879e2a",0,[11.2,44.5,77.6,10.9]],
["UXG-Fiber","UXG Fiber","gateway","UXGA6AA","UXGA6AA|Gateway Fiber","a:8767809f-9c08-82e4-15f3-d189307d8ebb/6dca8831fbe1e935332754ad657fc796",0,[11.2,43.2,77.6,13.8]],
["UXG-Lite","UXG Lite","gateway","UXG","UXG|Gateway Lite","a:06112bf7-eae4-4bf4-a55c-de007c76dc45/8ef136631ea566a6087704ae07725ec6",0,[10.9,35.7,78.1,28.6]],
["UXG-Max","UXG Max","gateway","UXGB","UXGB|Gateway Max","a:dac2c752-2b31-406f-96ed-36859261f293/88b840fbb548b263bac30e4d335d5f5a",0,[11.2,40.1,77.6,20.6]],
["UXG-Pro","UXG Pro","gateway","UXGPRO","Gateway Pro","a:c18d6e40-b775-4229-8f59-6ec875aa3825/2a5e9ed77af5c2c3baaf2f2ba4e16162",0,[11.2,44.8,77.6,10.4]],
["USW-WAN","WAN Switch","switch","USWED74","WRS3F|Switch WAN Relay SFP+","s:280f3aca-e9e2-4e8e-9fd2-41349966e754/aae0726d-c438-40fa-8fb6-d71d1fdd0eda",0,[10.4,45.3,79.2,10.4]],
["USW-WAN-RJ45","WAN Switch RJ45","switch","USWED75","WRS3|Switch WAN Relay RJ45","s:c3e77652-db6d-41d5-882c-55a2da9b37f7/020638c1-490d-48e7-96e6-580ae3561e9c",0,[10.4,45.3,79.4,10.4]],
["UWB-XG","WiFi BaseStation XG","ap","UXSDM","UXSDM","s:998f8bbd-ef2e-4fed-8c88-9074e623409e/7079a25f-df5f-4911-8b02-e7c67ddd3c93",0,[6.8,25.5,86.5,52.6]],
["US-XG-6PoE","XG 6 PoE (Gen1)","switch","US6XG150","US6XG150|Switch XG 6 PoE","s:d8b7d995-1066-45af-b3a8-08bac0810f06/f677a14d-d908-4a73-976f-121295898a18",["band",12,47.4,0.5,2.6],[11.2,42.7,77.1,20.3]],
];
// DEVICE_DB:END

const normKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9+]/g, "");
const DEVICE_DB = DEVICE_DB_RAW.map(([sku, name, kind, models, aliases, img, led, box]) => ({
  sku, name, kind,
  models: models ? models.split("|") : [],
  aliases: aliases ? aliases.split("|") : [],
  img,
  led: led ? { kind: led[0], x: led[1], y: led[2], w: led[3], h: led[4] } : null,
  box: box || null,
}));
const DB_BY_MODEL = new Map(), DB_BY_NAME = new Map();
for (const e of DEVICE_DB) {
  for (const m of e.models) DB_BY_MODEL.set(normKey(m), e);
  for (const n of [e.sku, e.name, ...e.aliases]) if (!DB_BY_NAME.has(normKey(n))) DB_BY_NAME.set(normKey(n), e);
}
// Frühere Kurzschlüssel für `model:` (bis v1.3) weiter verstehen
const LEGACY_MODEL_KEYS = { udr7: "UDR7", u7lite: "U7-Lite", udr: "UDR", u6lite: "U6-Lite" };

// Gerät in der Datenbank finden: zuerst über den internen Modellcode (z. B. UDMA67A),
// dann über den Gerätenamen, solange er noch dem Produktnamen entspricht (z. B. "U7 Lite").
function dbLookup(device) {
  for (const m of [device?.model, device?.model_id]) {
    const e = DB_BY_MODEL.get(normKey(m)) || DB_BY_NAME.get(normKey(m));
    if (e) return e;
  }
  for (const n of [device?.name, device?.name_by_user]) {
    const e = DB_BY_NAME.get(normKey(n));
    if (e) return e;
  }
  return null;
}

const UI_IMG = (product, file) =>
  `https://images.svc.ui.com/?u=${encodeURIComponent(`https://cdn.ecomm.ui.com/products/${product}/${file}.png`)}&q=75&w=640`;
const UI_APP_IMG = (id, hash) =>
  `https://images.svc.ui.com/?u=${encodeURIComponent(`https://static.ui.com/fingerprint/ui/images/${id}/default/${hash}.png`)}&q=75&w=640`;
const photoUrl = (e) => {
  if (!e?.img) return null;
  const [a, b] = e.img.slice(2).split("/");
  return e.img.startsWith("s:") ? UI_IMG(a, b) : UI_APP_IMG(a, b);
};
const failedImages = new Set();

/* ---------- Geräteprofile (Darstellung) ---------- */
// Gezeichnete Ersatzgrafiken, falls kein Foto verfügbar ist oder Fotos abgeschaltet sind
const GENERIC = {
  gateway: { key: "gateway", kind: "gateway", art: "udr7", label: "Gateway" },
  "ap-round": { key: "ap-round", kind: "ap", art: "ap-round", label: "Access Point" },
  "ap-square": { key: "ap-square", kind: "ap", art: "ap-square", label: "Access Point" },
  switch: { key: "switch", kind: "switch", art: "switch", label: "Switch" },
};
const ART_FOR_KIND = { gateway: "udr7", ap: "ap-round", switch: "switch", bridge: "ap-square", other: "ap-square" };

function profileFromDb(e) {
  return { key: e.sku, kind: e.kind === "bridge" || e.kind === "other" ? "ap" : e.kind, art: ART_FOR_KIND[e.kind] || "ap-square", label: e.name, db: e };
}

function detectProfile(device, disc, override) {
  if (override) {
    if (GENERIC[override]) return GENERIC[override];
    const e = DB_BY_NAME.get(normKey(LEGACY_MODEL_KEYS[override] || override));
    if (e) return profileFromDb(e);
  }
  const e = dbLookup(device);
  if (e) return profileFromDb(e);
  const portCount = disc.ports.length;
  if (portCount >= 6) return GENERIC.switch;
  if (disc.clients && portCount <= 1) return GENERIC["ap-round"];
  return GENERIC.gateway;
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
const stateText = (v) => (v === "connected" ? t("online") : v === "disconnected" ? t("offline") : I18N.en["st_" + v] ? t("st_" + v) : v);
function deviceStatus(hass, d) {
  const st = d.state && hass.states[d.state];
  if (st && !["unknown", "unavailable"].includes(st.state)) {
    const v = st.state;
    const level = v === "connected" ? "ok" : ["upgrading", "provisioning", "adopting", "pending"].includes(v) ? "busy" : "bad";
    return { level, text: stateText(v) };
  }
  const tr = d.tracker && hass.states[d.tracker];
  if (tr) return tr.state === "home" ? { level: "ok", text: t("online") } : { level: "bad", text: t("offline") };
  const probe = d.uptime || d.clients || d.cpu;
  if (probe && hass.states[probe]) {
    return hass.states[probe].state === "unavailable" ? { level: "bad", text: t("offline") } : { level: "ok", text: t("online") };
  }
  return { level: "unknown", text: t("unknown") };
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
  else if (speed !== null) status = speed > LINK_DOWN_MAX_MBIT ? "up" : "down";
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
        fmtSpeed(i.speed),
        i.rx !== null ? `↓ ${fmtMbit(i.rx)}` : null,
        i.tx !== null ? `↑ ${fmtMbit(i.tx)}` : null,
        i.poeOn ? (i.poeW !== null ? `PoE ${i.poeW.toFixed(1)} W` : t("poe_on")) : null,
        !i.enabled ? t("port_disabled") : null,
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
        ${i.speed !== null ? `<span class="pspeed ${i.speed > LINK_DOWN_MAX_MBIT ? "" : "off"}">${esc(fmtSpeed(i.speed))}</span>` : ""}
        ${i.status === "up" && (i.rx !== null || i.tx !== null) ? `<span class="prate">${esc(fmtMbit((i.rx || 0) + (i.tx || 0)))}</span>` : ""}
      </button>`;
    }).join("")}
  </div>`;
}

/* ---------- Styles ---------- */
const STYLE = `
:host { --unc-ok:#2f8cff; --unc-online:#22a55a; --unc-bad:#ff4d4f; --unc-busy:#ffb020; }
ha-card { display:block; background:var(--ha-card-background, var(--card-background-color, #fff)); box-shadow:var(--ha-card-box-shadow, none); border-radius:var(--ha-card-border-radius, 12px); overflow:hidden; container-type:inline-size; padding:4px 0;
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
.pill.ok { color:var(--unc-online); background:color-mix(in srgb, var(--unc-online) 14%, transparent); }
.pill.bad { color:var(--unc-bad); background:color-mix(in srgb, var(--unc-bad) 14%, transparent); }
.pill.busy { color:var(--unc-busy); background:color-mix(in srgb, var(--unc-busy) 16%, transparent); }
.pill.unknown { color:var(--unc-text2); background:rgba(127,127,127,.15); }
.body { display:grid; grid-template-columns: 150px 1fr; gap:14px; align-items:center; }
.stage { position:relative; display:flex; justify-content:center; align-items:center; min-height:150px; padding:8px 0;
  border-radius:16px; background:radial-gradient(circle at 50% 40%, rgba(127,127,127,.10), transparent 70%); cursor:pointer; }
.stage.wide { aspect-ratio:auto; padding:6px 0; }
.art-wrap { display:contents; }
.art { width:100%; height:auto; max-height:190px; filter:drop-shadow(0 6px 10px rgba(0,0,0,.12)); }
.art-wide { max-height:110px; }
.offline .art { filter:grayscale(.6) opacity(.7); }
.photo { position:relative; width:min(100%, calc(170px * var(--ar, 1))); aspect-ratio:var(--ar, 1); }
.photo.wide { width:min(100%, calc(110px * var(--ar, 1)), 380px); }
.photo .pi { position:absolute; }
.photo img { width:100%; height:100%; object-fit:contain; display:block; filter:drop-shadow(0 8px 12px rgba(0,0,0,.14)); }
.offline .photo img { filter:grayscale(1) opacity(.55); }
.led { position:absolute; pointer-events:none; background:var(--led); }
.led.ring { border-radius:50%; background:transparent; box-shadow:0 0 0 3px var(--led) inset, 0 0 10px 1px var(--led); opacity:.85; }
.led.band { border-radius:999px; box-shadow:0 0 8px 2px var(--led); opacity:.9; min-height:3px; min-width:3px; }
.led.dot { border-radius:50%; box-shadow:0 0 8px 3px var(--led); opacity:.95; min-width:5px; min-height:5px; }
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
.port { all:unset; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:2px; width:52px; }
.port:focus-visible { outline:2px solid var(--unc-ok); border-radius:6px; }
.jack { width:34px; height:30px; }
.plabel { font-size:.62rem; color:var(--unc-text); font-weight:500; max-width:46px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.prate { font-size:.56rem; color:var(--unc-text2); white-space:nowrap; }
.pspeed { font-size:.6rem; color:var(--unc-text2); white-space:nowrap; font-variant-numeric:tabular-nums; }
.pspeed.off { opacity:.6; }
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
    if (!config) throw new Error(t("invalid_config"));
    this._config = { theme: "auto", show_ports: true, show_firmware: true, show_restart: true, ...config };
    this._sig = null;
    if (this._hass) this._render();
  }

  set hass(hass) {
    this._hass = hass;
    setLang(hass, this._config?.language);
    const sig = this._signature() + LANG;
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }

  getCardSize() { return 4 * Math.max(1, this._deviceIds().length); }
  getGridOptions() { return { columns: 12, min_columns: 6, rows: "auto" }; }

  _deviceIds() {
    const c = this._config || {};
    let list = c.devices ?? (c.device ? [c.device] : null);
    if (!list || !list.length) list = this._hass ? findUnifiDevices(this._hass) : [];
    return applyOrder(list.map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean), c.order);
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
    setLang(this._hass, this._config.language);
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (ev) => this._onClick(ev));
    }
    const ids = this._deviceIds();
    const title = this._config.title ? `<div class="title">${esc(this._config.title)}</div>` : "";
    const body = ids.length
      ? ids.map((id, i) => this._renderDevice(id, i)).join("")
      : `<div class="empty">${esc(t("no_devices"))}</div>`;
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
    if (!dev) return `<div class="dev empty">${esc(t("device_missing", { id }))}</div>`;
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
      // Nur Ports, die wirklich Datenraten liefern – sonst entstünde eine falsche "0 kbit/s"-Anzeige
      const src = (wan.length ? wan : prof.kind === "gateway" ? [] : d.ports).filter((p) => p.rx || p.tx);
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
    const db = prof.db;
    const imgSrc = ov.image || this._config.images?.[prof.key] || (this._config.photos !== false ? photoUrl(db) : null);
    let wide = prof.art === "switch";
    if (imgSrc && !failedImages.has(imgSrc)) {
      const own = !!(ov.image || this._config.images?.[prof.key]);
      const l = own ? ov.led || null : db?.led;
      // Auf den Geräteumriss zuschneiden (mit etwas Rand für Schatten/Leuchten)
      let [bx, by, bw, bh] = !own && db?.box ? db.box : [0, 0, 100, 100];
      const pad = 3;
      bx = Math.max(0, bx - pad); by = Math.max(0, by - pad);
      bw = Math.min(100 - bx, bw + 2 * pad); bh = Math.min(100 - by, bh + 2 * pad);
      const ar = bw / bh;
      wide = ar > 1.7;
      let ledHtml = "";
      if (l && status.level !== "ok") {
        ledHtml = `<i class="led ${l.kind} ${status.level}" style="left:${l.x}%;top:${l.y}%;width:${l.w}%;height:${l.h}%;--led:${led}"></i>`;
      }
      const inner = `left:${(-bx / bw) * 100}%;top:${(-by / bh) * 100}%;width:${(100 / bw) * 100}%;height:${(100 / bh) * 100}%`;
      art = `<div class="photo ${wide ? "wide" : ""}" style="--ar:${ar.toFixed(3)}"><div class="pi" style="${inner}">` +
        `<img src="${esc(imgSrc)}" alt="${esc(model)}" loading="lazy" referrerpolicy="no-referrer" data-src="${esc(imgSrc)}">${ledHtml}</div></div>`;
    }

    const stat = (icon, label, val, entity, pct) => {
      if (val === null || val === undefined) return "";
      const bar = pct !== undefined && pct !== null
        ? `<div class="bar"><i class="${pct > 90 ? "crit" : pct > 75 ? "warn" : ""}" style="width:${Math.min(100, Math.max(0, pct))}%"></i></div>` : "";
      return `<div class="stat" data-entity="${esc(entity)}"><div class="slabel"><ha-icon icon="${icon}"></ha-icon>${label}</div><div class="sval">${esc(val)}</div>${bar}</div>`;
    };
    const stats = [
      stat("mdi:devices", t("clients"), clients !== null ? String(clients) : null, d.clients),
      stat("mdi:timer-outline", t("uptime"), uptime, d.uptime),
      stat("mdi:download", t("download"), rx !== null ? fmtMbit(rx) : null, d.wanRx || d.ports[0]?.rx),
      stat("mdi:upload", t("upload"), tx !== null ? fmtMbit(tx) : null, d.wanTx || d.ports[0]?.tx),
      stat("mdi:cpu-64-bit", t("cpu"), cpu !== null ? `${cpu.toFixed(0)} %` : null, d.cpu, cpu),
      stat("mdi:memory", t("ram"), mem !== null ? `${mem.toFixed(0)} %` : null, d.mem, mem),
      stat("mdi:speedometer", t("latency"), num(h, d.latency) !== null ? `${num(h, d.latency).toFixed(0)} ms` : null, d.latency),
      stat("mdi:thermometer", t("temperature"), temp !== null ? `${temp.toFixed(0)} °C` : null, d.temp),
      stat("mdi:flash", t("poe"), poeTotal > 0 ? `${poeTotal.toFixed(1)} W` : null, d.ports.find((p) => p.poe_power)?.poe_power),
      stat("mdi:lightning-bolt", t("power"), power !== null ? `${power.toFixed(1)} W` : null, d.power),
    ].join("");

    const upd = d.update && h.states[d.update];
    let fw = "";
    if (this._config.show_firmware && upd) {
      const a = upd.attributes;
      fw = upd.state === "on"
        ? `<button class="chip upd" data-entity="${esc(d.update)}"><ha-icon icon="mdi:package-up"></ha-icon>${t("update")} ${esc(a.latest_version || "")}</button>`
        : `<button class="chip" data-entity="${esc(d.update)}"><ha-icon icon="mdi:chip"></ha-icon>FW ${esc(a.installed_version || dev.sw_version || "–")}</button>`;
    } else if (dev.sw_version) fw = `<span class="chip"><ha-icon icon="mdi:chip"></ha-icon>FW ${esc(dev.sw_version)}</span>`;
    const restart = this._config.show_restart && d.restart
      ? `<button class="chip warn" data-restart="${esc(d.restart)}" data-name="${esc(name)}"><ha-icon icon="mdi:restart"></ha-icon>${t("restart")}</button>` : "";

    (this._pendingArts = this._pendingArts || new Map()).set(id, art);
    return `
    <div class="dev ${online ? "" : "offline"}">
      <div class="head">
        <div class="name" data-device="${esc(id)}">${esc(name)}<div class="model">${esc(model)}</div></div>
        <span class="pill ${status.level}">${esc(status.text)}</span>
      </div>
      <div class="body" style="${wide ? "grid-template-columns:1fr" : ""}">
        <div class="stage ${wide ? "wide" : ""}" data-art-id="${esc(id)}" data-entity="${esc(d.state || d.tracker || d.uptime || "")}"></div>
        <div class="stats">${stats || `<div class="empty">${esc(online ? t("no_sensors") : t("unreachable"))}</div>`}</div>
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
      if (confirm(t("restart_confirm", { name: el.dataset.name }))) {
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

// Benutzerdefinierte Reihenfolge (`order`: Liste von Geräte-IDs); nicht aufgeführte Geräte folgen am Ende
function applyOrder(ids, order) {
  if (!Array.isArray(order) || !order.length) return ids;
  const pos = new Map(order.map((id, i) => [id, i]));
  return ids.map((id, i) => [id, pos.has(id) ? pos.get(id) : order.length + i]).sort((a, b) => a[1] - b[1]).map(([id]) => id);
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
const modelOptions = () => [
  { value: "", label: t("model_auto") },
  ...DEVICE_DB.map((e) => ({ value: e.sku, label: `${e.name} (${e.sku})` })),
  { value: "gateway", label: `${t("graphic")}: ${t("g_gateway")}` },
  { value: "ap-round", label: `${t("graphic")}: ${t("g_ap_round")}` },
  { value: "ap-square", label: `${t("graphic")}: ${t("g_ap_square")}` },
  { value: "switch", label: `${t("graphic")}: ${t("g_switch")}` },
];
const EDITOR_FIELDS = ["title", "theme", "language", "devices", "show_ports", "show_firmware", "show_restart", "photos", "name", "model", "image"];
const EDITOR_HELP = { devices: "h_devices", photos: "h_photos", name: "h_name", model: "h_model", image: "h_image" };
const OV_PREFIX = "geraet_";

class UnifiNetworkCardEditor extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (this._form) this._form.hass = hass;
    if (first) this._render();
  }

  // Geräte, für die Einstellungen angezeigt werden (gewählte oder automatisch gefundene), in Anzeigereihenfolge
  _shownDevices() {
    const list = (this._config.devices || []).map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean);
    return applyOrder(list.length ? list : findUnifiDevices(this._hass), this._config.order);
  }

  _devLabel(id) {
    const d = this._hass.devices?.[id];
    if (!d) return id;
    const model = detectProfile(d, { ports: [] }).label || d.model || "";
    return `${d.name_by_user || d.name || id}${model ? ` · ${model}` : ""}`;
  }

  _moveDevice(from, to) {
    const cur = this._shownDevices();
    if (to < 0 || to >= cur.length || from === to) return;
    const [id] = cur.splice(from, 1);
    cur.splice(to, 0, id);
    this._changed({ ...this._form.data, order: cur });
  }

  // Reihenfolge: Zeilen am Griff ziehen (Maus und Touch über Pointer-Events) oder per Pfeil verschieben
  _renderOrder(ids) {
    if (!this._orderEl) {
      this._orderEl = document.createElement("div");
      this._orderEl.className = "unc-order";
      this._orderEl.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button[data-move]");
        if (!btn) return;
        const i = +btn.dataset.idx;
        this._moveDevice(i, i + (btn.dataset.move === "up" ? -1 : 1));
      });
      this._orderEl.addEventListener("pointerdown", (ev) => this._dragStart(ev));
      this.appendChild(this._orderEl);
    }
    const btn = (dir, i, disabled) => {
      const label = t(dir === "up" ? "move_up" : "move_down");
      return `<button data-move="${dir}" data-idx="${i}" ${disabled ? "disabled" : ""} title="${label}" aria-label="${label}">${dir === "up" ? "▲" : "▼"}</button>`;
    };
    this._orderEl.innerHTML = `
      <style>
        .unc-order { margin-top:16px; }
        .unc-order h3 { font-size:1rem; font-weight:500; margin:0 0 4px; color:var(--primary-text-color); }
        .unc-order p { margin:0 0 8px; font-size:.85rem; color:var(--secondary-text-color); }
        .unc-order ol { list-style:none; margin:0; padding:0; border:1px solid var(--divider-color); border-radius:12px; position:relative; }
        .unc-order li { display:flex; align-items:center; gap:6px; padding:6px 8px 6px 4px; color:var(--primary-text-color);
          background:var(--card-background-color, var(--ha-card-background, #fff)); position:relative; transition:transform .15s ease; }
        .unc-order li:first-child { border-radius:12px 12px 0 0; } .unc-order li:last-child { border-radius:0 0 12px 12px; }
        .unc-order li:only-child { border-radius:12px; }
        .unc-order li + li { border-top:1px solid var(--divider-color); }
        .unc-order li.dragging { transition:none; z-index:2; box-shadow:0 6px 18px rgba(0,0,0,.22); border-radius:10px; }
        .unc-order .handle { cursor:grab; touch-action:none; user-select:none; width:28px; height:32px; display:inline-flex; align-items:center;
          justify-content:center; color:var(--secondary-text-color); font-size:1.1rem; border-radius:8px; }
        .unc-order .handle:hover { background:var(--secondary-background-color, rgba(127,127,127,.15)); }
        .unc-order li.dragging .handle { cursor:grabbing; }
        .unc-order .nr { width:1.4em; color:var(--secondary-text-color); font-variant-numeric:tabular-nums; }
        .unc-order .nm { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .unc-order button { all:unset; cursor:pointer; width:32px; height:32px; display:inline-flex; align-items:center; justify-content:center;
          border-radius:50%; color:var(--primary-text-color); font-size:.8rem; }
        .unc-order button:hover:not([disabled]) { background:var(--secondary-background-color, rgba(127,127,127,.15)); }
        .unc-order button:focus-visible { outline:2px solid var(--primary-color); }
        .unc-order button[disabled] { opacity:.3; cursor:default; }
        @media (prefers-reduced-motion: reduce) { .unc-order li { transition:none; } }
      </style>
      <h3>${esc(t("order"))}</h3>
      <p>${esc(t("order_hint"))}</p>
      <ol>${ids.map((id, i) => `<li data-idx="${i}"><span class="handle" title="${esc(t("drag"))}" aria-hidden="true">⠿</span><span class="nr">${i + 1}.</span><span class="nm">${esc(this._devLabel(id))}</span>${btn("up", i, i === 0)}${btn("down", i, i === ids.length - 1)}</li>`).join("")}</ol>`;
    this._orderEl.style.display = ids.length > 1 ? "" : "none";
  }

  _dragStart(ev) {
    const handle = ev.target.closest(".handle");
    if (!handle || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    ev.preventDefault();
    const li = handle.closest("li");
    const rows = [...li.parentElement.children];
    const from = rows.indexOf(li);
    const rects = rows.map((r) => r.getBoundingClientRect());
    const h = rects[from].height;
    const startY = ev.clientY;
    let to = from;
    li.classList.add("dragging");
    try { handle.setPointerCapture(ev.pointerId); } catch { /* z. B. synthetische Ereignisse */ }
    const move = (e) => {
      const minDy = rects[0].top - rects[from].top, maxDy = rects[rects.length - 1].bottom - rects[from].bottom;
      const dy = Math.max(minDy, Math.min(maxDy, e.clientY - startY));
      li.style.transform = `translateY(${dy}px)`;
      // Ziel = Zeile, in der die Mitte der gezogenen Zeile gerade liegt
      const mid = rects[from].top + h / 2 + dy;
      to = rects.findIndex((r) => mid >= r.top && mid < r.bottom);
      if (to === -1) to = mid < rects[0].top ? 0 : rects.length - 1;
      rows.forEach((r, i) => {
        if (i === from) return;
        const shift = from < to && i > from && i <= to ? -h : from > to && i >= to && i < from ? h : 0;
        r.style.transform = shift ? `translateY(${shift}px)` : "";
      });
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      rows.forEach((r) => { r.style.transform = ""; });
      li.classList.remove("dragging");
      this._moveDevice(from, to);
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
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
    const devName = (id) => this._devLabel(id);
    return [
      { type: "expandable", name: "", flatten: true, title: t("sec_appearance"), icon: "mdi:palette-outline", expanded: true, schema: [
        { name: "title", selector: { text: {} } },
        { type: "grid", name: "", schema: [
          { name: "theme", selector: { select: { mode: "dropdown", options: [
            { value: "auto", label: t("theme_auto") },
            { value: "light", label: t("theme_light") },
            { value: "dark", label: t("theme_dark") },
          ] } } },
          { name: "language", selector: { select: { mode: "dropdown", options: [
            { value: "auto", label: t("lang_auto") },
            { value: "de", label: "Deutsch" },
            { value: "en", label: "English" },
          ] } } },
        ] },
        { name: "photos", selector: { boolean: {} } },
        { type: "grid", name: "", schema: [
          { name: "show_ports", selector: { boolean: {} } },
          { name: "show_firmware", selector: { boolean: {} } },
          { name: "show_restart", selector: { boolean: {} } },
        ] },
      ] },
      { type: "expandable", name: "", flatten: true, title: t("sec_devices"), icon: "mdi:router-wireless", expanded: true, schema: [
        { name: "devices", selector: { device: { multiple: true, filter: { integration: "unifi" } } } },
      ] },
      ...ids.map((id) => ({
        type: "expandable", name: OV_PREFIX + id, title: devName(id), icon: "mdi:tune-variant", schema: [
          { name: "name", selector: { text: {} } },
          { name: "model", selector: { select: { mode: "dropdown", options: modelOptions() } } },
          { name: "image", selector: { text: {} } },
        ],
      })),
    ];
  }

  _render() {
    if (!this._hass || !this._config) return;
    setLang(this._hass, this._config.language);
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.computeLabel = (s) => (EDITOR_FIELDS.includes(s.name) ? t(s.name) : s.title || s.name);
      this._form.computeHelper = (s) => (EDITOR_HELP[s.name] ? t(EDITOR_HELP[s.name]) : undefined);
      this._form.addEventListener("value-changed", (ev) => this._changed(ev.detail.value));
      this.appendChild(this._form);
    }
    const ids = this._shownDevices();
    const key = ids.join(",") + "|" + LANG;
    if (key !== this._schemaKey) { this._schemaKey = key; this._form.schema = this._schema(ids); }
    const ov = this._overrides();
    const data = {
      theme: "auto", language: "auto", photos: true, show_ports: true, show_firmware: true, show_restart: true,
      ...this._config,
      devices: (this._config.devices || []).map((d) => (typeof d === "string" ? d : d.device)).filter(Boolean),
    };
    delete data.overrides;
    delete data.order;
    for (const id of ids) {
      const o = { name: "", model: "", image: "", ...(ov[id] || {}) };
      if (LEGACY_MODEL_KEYS[o.model]) o.model = LEGACY_MODEL_KEYS[o.model];
      data[OV_PREFIX + id] = o;
    }
    this._form.hass = this._hass;
    this._form.data = data;
    this._renderOrder(ids);
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
    // Reihenfolge: aus dem Formular nicht änderbar, deshalb aus der bisherigen Konfiguration übernehmen
    if (!("order" in value) && this._config.order) v.order = this._config.order;
    if (v.devices && v.order) v.order = v.order.filter((id) => v.devices.includes(id));
    if (!v.order?.length) delete v.order;
    if (!v.title) delete v.title;
    if (v.theme === "auto") delete v.theme;
    if (v.language === "auto") delete v.language;
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
    description: t("card_desc"),
    preview: true,
  });
}
console.info(`%c UNIFI-NETWORK-CARD %c v${UNC_VERSION} `, "background:#2f8cff;color:#fff;font-weight:700", "background:#222;color:#fff");
