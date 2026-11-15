// Erstellt PNG-Bilder der Demo-Karten für die README (ohne zusätzliche Software).
// Nutzung in demo.html (Browser-Konsole):  await uncSnapshot("docs/example.png")
// Die Karten werden samt Shadow-DOM in ein SVG <foreignObject> übertragen, Bilder als data:-URLs eingebettet,
// auf ein Canvas gezeichnet und als PNG an einen lokalen Empfänger (127.0.0.1:8766) geschickt.
(() => {
  const toDataUrl = async (url) => {
    const blob = await fetch(url, { mode: "cors" }).then((r) => r.blob());
    return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  };

  // Element samt Shadow-DOM flach kopieren
  async function flatten(node, imgCache) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const tag = node.tagName.toLowerCase();
    if (tag === "script" || tag === "ha-icon") return null;
    const isHost = !!node.shadowRoot;
    const el = node instanceof SVGElement ? node.cloneNode(false) : document.createElement(isHost ? "div" : tag);
    if (!(node instanceof SVGElement)) for (const a of node.attributes) el.setAttribute(a.name, a.value);
    if (isHost) el.className = "unc-host";
    if (tag === "img") {
      const src = node.currentSrc || node.src;
      if (!imgCache.has(src)) imgCache.set(src, await toDataUrl(src));
      el.setAttribute("src", imgCache.get(src));
      el.removeAttribute("loading");
    }
    if (tag === "style") { el.textContent = node.textContent.replace(/:host/g, ".unc-host"); return el; }
    const kids = isHost ? node.shadowRoot.childNodes : node.childNodes;
    for (const k of kids) {
      if (node instanceof SVGElement) { el.appendChild(k.cloneNode(true)); continue; }
      const c = await flatten(k, imgCache);
      if (c) el.appendChild(c);
    }
    return el;
  }

  window.uncSnapshot = async (name, { scale = 2, padding = 24, el = document.body } = {}) => {
    const rect = el.getBoundingClientRect();
    const w = Math.ceil(el.scrollWidth), h = Math.ceil(el.scrollHeight);
    const cs = getComputedStyle(document.body);
    const vars = [...document.styleSheets].flatMap((s) => [...s.cssRules]).map((r) => r.cssText)
      .join("\n").replace(/:root/g, ".unc-page").replace(/\bbody\.dark\b/g, ".unc-page.dark").replace(/\bbody\b/g, ".unc-page");
    const wrap = document.createElement("div");
    wrap.className = "unc-page" + (document.body.classList.contains("dark") ? " dark" : "");
    wrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    wrap.style.cssText = `width:${w}px;min-height:${h}px;box-sizing:border-box;`;
    const style = document.createElement("style");
    style.textContent = vars + `\n.unc-page{font-family:${cs.fontFamily};}`;
    wrap.appendChild(style);
    const imgCache = new Map();
    for (const k of el.childNodes) { const c = await flatten(k, imgCache); if (c) wrap.appendChild(c); }
    const xhtml = new XMLSerializer().serializeToString(wrap);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject x="0" y="0" width="100%" height="100%">${xhtml}</foreignObject></svg>`;
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const canvas = document.createElement("canvas");
    canvas.width = w * scale; canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    const png = canvas.toDataURL("image/png");
    await fetch("http://127.0.0.1:8766/" + name.replace(/[^a-z0-9_-]/gi, "_"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, png }),
    });
    return { name, w: canvas.width, h: canvas.height, kb: Math.round((png.length * 3) / 4 / 1024) };
  };
})();
