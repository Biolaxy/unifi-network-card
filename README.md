# UniFi Network Card

Lovelace-Karte für die offizielle **UniFi Network**-Integration von Home Assistant.
Zeigt **UDR7 und U7 Lite mit den offiziellen Ubiquiti-Produktfotos**. Der Gerätestatus wird
direkt auf der echten Status-LED dargestellt: Normal bleibt das Original-Blau, bei Update oder
Provisionierung leuchtet sie orange und pulsiert, offline wird das Gerät ausgegraut.
Dazu Status, Clients, Laufzeit, CPU/RAM, Temperatur, Durchsatz, Ports inkl. PoE,
Firmware-Updates und ein Neustart-Button. Andere Modelle (und UDR7/U7 Lite, falls ein Foto
nicht lädt) bekommen eine gezeichnete Grafik nach echtem Vorbild.

## Produktfotos

Die Fotos werden zur Laufzeit von Ubiquitis Bild-CDN (`images.svc.ui.com`) geladen, also vom
Browser, der das Dashboard anzeigt. Ohne Internet (oder für weitere Modelle) kannst du eigene
Bilder verwenden: transparentes PNG nach `/config/www/unifi/` legen und im Karten-Editor beim
jeweiligen Gerät unter **Eigenes Bild** z. B. `/local/unifi/mein-ap.png` eintragen. Mit dem Schalter
**Original-Produktfotos verwenden** kannst du die Fotos ganz abschalten.

Die Entitäten werden **automatisch über das Gerät** gefunden – egal wie die Entity-IDs heißen.

## Installation

### Über HACS (empfohlen)

1. **HACS → ⋮ → Benutzerdefinierte Repositories**
2. Repository-URL `https://github.com/Biolaxy/unifi-network-card` eintragen, Typ **Dashboard**, hinzufügen.
3. „UniFi Network Card“ suchen und herunterladen. HACS registriert die Ressource automatisch.
4. Seite neu laden (Strg/Cmd + Shift + R) und im Dashboard **Karte hinzufügen → „UniFi Network Card“** wählen.

Updates erscheinen danach automatisch in HACS.

### Manuell

1. `unifi-network-card.js` nach `/config/www/` kopieren (z. B. mit der App „File editor“ oder „Samba share“).
2. **Einstellungen → Dashboards → ⋮ → Ressourcen → Ressource hinzufügen**
   - URL: `/local/unifi-network-card.js?v=1.3.2`
   - Typ: **JavaScript-Modul**
3. Browser-Cache leeren bzw. Seite neu laden (Strg/Cmd + Shift + R).
4. Im Dashboard **Karte hinzufügen → „UniFi Network Card“** wählen.

Nach einem Update der Datei die Versionsnummer in der Ressourcen-URL hochzählen.

## Wichtig: Sensoren aktivieren

Viele UniFi-Sensoren sind standardmäßig **deaktiviert**. Damit die Karte etwas anzeigen kann:
**Einstellungen → Geräte & Dienste → UniFi Network → Gerät (z. B. UDR7) → Entitäten**
und u. a. diese aktivieren:

- *Clients*, *CPU-Temperatur*, *WAN-Latenz* (z. B. Cloudflare)
- je Port: *Verbindungsgeschwindigkeit* (auch SFP+), *PoE*, *PoE-Leistung*

*Betriebszeit*, *Zustand*, *CPU-* und *Speicherauslastung* sind bereits aktiv. Die Karte erkennt die
Sensoren am Typ und an englischen wie deutschen Namen, funktioniert also unabhängig von der HA-Sprache.

## Konfiguration – komplett grafisch

Alles lässt sich im Karten-Editor einstellen, YAML ist nicht nötig:

**Darstellung**
- Titel, Design (Automatisch / Hell / Dunkel)
- Original-Produktfotos an/aus
- Ports, Firmware & Updates und Neustart-Button ein-/ausblenden

**Geräte**
- Geräte auswählen – leer lassen zeigt alle UniFi-Geräte automatisch

**Pro Gerät** (aufklappbarer Bereich je Gerät)
- Anzeigename
- Darstellung erzwingen, falls ein Gerät falsch erkannt wird (z. B. „U7 Lite (Foto)“)
- Eigenes Bild (URL)

<details>
<summary>YAML-Referenz (optional)</summary>

```yaml
type: custom:unifi-network-card
title: Netzwerk
theme: dark                # auto (Standard) | light | dark
photos: false              # Standard: true
devices:                   # weglassen = alle UniFi-Geräte automatisch
  - 1a2b3c4d5e...
overrides:                 # Einstellungen pro Gerät (Geräte-ID)
  1a2b3c4d5e...:
    name: AP Wohnzimmer
    model: u7lite          # udr7, udr, u7lite, u6lite, ap-round, ap-square, switch, gateway
    image: /local/unifi/mein-ap.png
show_ports: false          # Standard: true
show_firmware: false       # Standard: true
show_restart: false        # Standard: true
```

Die ältere Form mit Objekten in `devices` (`- device: … name: …`) funktioniert weiterhin und wird
beim Öffnen im Editor automatisch übernommen.
</details>

## Bedienung

- Klick auf Grafik, Werte oder Ports → Detail-Dialog der jeweiligen Entität
- Klick auf den Gerätenamen → Geräteseite in HA
- Neustart fragt vorher nach

## Testen ohne Home Assistant

`test.html` enthält simulierte Daten (UDR7, U7 Lite online/offline), `editor-test.html` prüft die
Logik des grafischen Editors, `test-de.html` die Erkennung deutscher Entitäten (Dream Router 7 / U7 Lite). Im Ordner einen
lokalen Webserver starten und `http://localhost:8765/test.html` öffnen (`#dark` für Dunkelmodus):

```bash
python3 -m http.server 8765
```

## Hinweis

Kein offizielles Produkt von Ubiquiti und nicht mit Ubiquiti verbunden. UniFi ist eine Marke von
Ubiquiti Inc. Die Produktfotos gehören Ubiquiti. Sie sind nicht Teil dieses Repositorys, sondern werden
beim Anzeigen direkt von Ubiquitis Servern geladen.

Lizenz: MIT
