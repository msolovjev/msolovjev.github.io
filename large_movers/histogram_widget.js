// Reusable diverging-histogram widget -- used standalone on pct5.html /
// pct20.html and embedded twice (5-day + 20-day) on the Overview page.
// Needs sector_theme_filter.js loaded first.
//
// Sector/Theme filtering: pass either `sectorSelId`/`themeSelId` (the widget
// creates its own dropdown-based createSectorThemeFilter -- standalone page
// use) or a pre-built `stFilter` object with a matches(row) method (Overview
// page use, where one shared button/dropdown control drives all three
// widgets at once -- see createSectorThemeControl).
function createHistogramWidget(opts){
  const DATA = opts.data; // already sorted by |value| descending
  const chart = document.getElementById(opts.chartId);
  const tip = document.getElementById(opts.tipId);
  const tipVal = document.getElementById(opts.tipValId);
  const tipMeta = document.getElementById(opts.tipMetaId);
  const topN = document.getElementById(opts.topNId);
  const rowCount = document.getElementById(opts.rowCountId);
  const stFilter = opts.stFilter || createSectorThemeFilter(DATA, opts.sectorSelId, opts.themeSelId);

  const fmtPct = v => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2) + "%";
  function fmtCap(v){
    if (v == null || isNaN(v)) return "n/a mkt cap";
    const a = Math.abs(v);
    if (a >= 1e12) return (v/1e12).toFixed(2) + "T mkt cap";
    if (a >= 1e9)  return (v/1e9).toFixed(2) + "B mkt cap";
    if (a >= 1e6)  return (v/1e6).toFixed(2) + "M mkt cap";
    if (a >= 1e3)  return (v/1e3).toFixed(2) + "K mkt cap";
    return v.toFixed(0) + " mkt cap";
  }

  function showTip(el, d){
    const r = el.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2) + "px";
    tip.style.top = r.top + "px";
    tipVal.textContent = fmtPct(d.value);
    tipMeta.textContent = d.symbol + " — " + fmtCap(d.marketCap);
    tip.classList.add("show");
  }
  function hideTip(){ tip.classList.remove("show"); }

  function render(){
    const filtered = DATA.filter(d => stFilter.matches(d));
    const n = topN.value === "all" ? filtered.length : parseInt(topN.value, 10);
    const shown = filtered.slice(0, n).sort((a, b) => b.value - a.value);
    const maxAbs = Math.max(...shown.map(d => Math.abs(d.value))) * 1.08;

    chart.innerHTML = "";
    shown.forEach(d => {
      const pct = (Math.abs(d.value) / maxAbs * 100).toFixed(2);
      const isPos = d.value >= 0;

      const row = document.createElement("div");
      row.className = "rs-row";
      row.setAttribute("role", "listitem");
      row.tabIndex = 0;

      const label = document.createElement("div");
      label.className = "rs-label";
      const symEl = document.createElement("span");
      symEl.className = "rs-theme";
      symEl.textContent = d.symbol;
      label.append(symEl);

      const track = document.createElement("div");
      track.className = "rs-track";
      const negHalf = document.createElement("div");
      negHalf.className = "rs-half neg";
      const posHalf = document.createElement("div");
      posHalf.className = "rs-half pos";

      const bar = document.createElement("div");
      bar.className = "rs-bar";
      bar.style.width = pct + "%";
      const val = document.createElement("span");
      val.className = "rs-value";
      val.textContent = fmtPct(d.value);

      if (isPos){
        posHalf.append(bar, val);
      } else {
        negHalf.append(val, bar);
      }
      track.append(negHalf, posHalf);
      row.append(label, track);
      chart.appendChild(row);

      const onEnter = () => { row.classList.add("is-active"); showTip(bar, d); };
      const onLeave = () => { row.classList.remove("is-active"); hideTip(); };
      row.addEventListener("pointerenter", onEnter);
      row.addEventListener("pointerleave", onLeave);
      row.addEventListener("focus", onEnter);
      row.addEventListener("blur", onLeave);
    });

    rowCount.textContent = shown.length + " / " + filtered.length + " shown";
  }

  topN.addEventListener("change", render);
  if (opts.stFilter){
    opts.stFilter.onChange(render);
  } else {
    document.getElementById(opts.sectorSelId).addEventListener("change", render);
    document.getElementById(opts.themeSelId).addEventListener("change", render);
  }
  render();

  return { render };
}
