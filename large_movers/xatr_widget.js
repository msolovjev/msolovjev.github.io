// Reusable xATR table widget -- Symbol / Mkt Cap / xATR only. Same shape as
// table1_widget.js (mkt-cap range + Day1 checkbox + Sector/Theme + sortable
// columns) but with a "Min xATR" filter instead of "Both signals only" /
// "Min RVOL". Needs sector_theme_filter.js loaded first.
//
// Sector/Theme filtering: pass either `sectorSelId`/`themeSelId` (the widget
// creates its own dropdown-based createSectorThemeFilter -- standalone page
// use) or a pre-built `stFilter` object with a matches(row) method (Overview
// page use, where one shared button/dropdown control drives every widget at
// once -- see createSectorThemeControl).
function createXatrWidget(opts){
  const ROWS = opts.rows;
  const tableId = opts.tableId;
  const tbody = document.getElementById(opts.tbodyId);
  const capMin = document.getElementById(opts.capMinId);
  const capMax = document.getElementById(opts.capMaxId);
  const minXatr = document.getElementById(opts.minXatrId);
  const day1Only = document.getElementById(opts.day1Id);
  const rowCount = document.getElementById(opts.rowCountId);
  const headers = document.querySelectorAll("#" + tableId + " th.sortable");
  const stFilter = opts.stFilter || createSectorThemeFilter(ROWS, opts.sectorSelId, opts.themeSelId);
  const sectorColors = opts.sectorColors || {};

  function fmtCap(v){
    if (v == null || isNaN(v)) return "—";
    const a = Math.abs(v);
    if (a >= 1e12) return (v/1e12).toFixed(2) + "T";
    if (a >= 1e9)  return (v/1e9).toFixed(2) + "B";
    if (a >= 1e6)  return (v/1e6).toFixed(2) + "M";
    if (a >= 1e3)  return (v/1e3).toFixed(2) + "K";
    return v.toFixed(0);
  }

  function parseCap(s){
    s = (s || "").trim().toUpperCase();
    if (!s) return null;
    const m = s.match(/^([\d.]+)\s*([KMBT])?$/);
    if (!m) return null;
    const n = parseFloat(m[1]);
    if (isNaN(n)) return null;
    const mult = { K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[m[2]] || 1;
    return n * mult;
  }

  const sortValue = {
    symbol: r => r.symbol,
    marketCap: r => r.marketCap,
    xatr: r => r.xatr,
  };
  let sortKey = "xatr";
  let sortDir = -1; // -1 desc, 1 asc

  function compareRows(a, b){
    const va = sortValue[sortKey](a);
    const vb = sortValue[sortKey](b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1; // nulls last regardless of direction
    if (vb == null) return -1;
    if (typeof va === "string") return sortDir * va.localeCompare(vb);
    return sortDir * (va - vb);
  }

  function updateHeaderArrows(){
    headers.forEach(th => {
      const arrow = th.querySelector(".sort-arrow");
      if (th.dataset.key === sortKey){
        arrow.textContent = sortDir === 1 ? " ▲" : " ▼";
      } else {
        arrow.textContent = "";
      }
    });
  }

  headers.forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.key;
      if (sortKey === key){
        sortDir = -sortDir;
      } else {
        sortKey = key;
        sortDir = 1;
      }
      render();
    });
  });

  function render(){
    const min = parseCap(capMin.value);
    const max = parseCap(capMax.value);
    const minXatrVal = minXatr.value.trim() === "" ? null : parseFloat(minXatr.value);
    const day1 = day1Only.checked;

    const filtered = ROWS.filter(r => {
      if (min != null && (r.marketCap == null || r.marketCap < min)) return false;
      if (max != null && (r.marketCap == null || r.marketCap > max)) return false;
      if (minXatrVal != null && !isNaN(minXatrVal) && (r.xatr == null || r.xatr <= minXatrVal)) return false;
      if (day1 && r.day1_signal == null) return false;
      if (!stFilter.matches(r)) return false;
      return true;
    }).sort(compareRows);

    updateHeaderArrows();

    tbody.innerHTML = "";
    for (const r of filtered){
      const tr = document.createElement("tr");

      const tdSym = document.createElement("td");
      tdSym.className = "sym";
      tdSym.innerHTML = r.symbol + sectorDotsHTML(r.themes, sectorColors);

      const tdCap = document.createElement("td");
      tdCap.className = "num n";
      tdCap.textContent = fmtCap(r.marketCap);

      const tdXatr = document.createElement("td");
      tdXatr.className = "num n";
      tdXatr.textContent = r.xatr != null ? r.xatr.toFixed(2) : "—";

      tr.append(tdSym, tdCap, tdXatr);
      tbody.appendChild(tr);
    }

    rowCount.textContent = filtered.length + " / " + ROWS.length + " shown";
  }

  capMin.addEventListener("input", render);
  capMax.addEventListener("input", render);
  minXatr.addEventListener("input", render);
  day1Only.addEventListener("change", render);
  if (opts.stFilter){
    opts.stFilter.onChange(render);
  } else {
    document.getElementById(opts.sectorSelId).addEventListener("change", render);
    document.getElementById(opts.themeSelId).addEventListener("change", render);
  }
  render();

  return { render };
}
