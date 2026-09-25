// Reusable Table1 (signal screener) widget -- used standalone on signals.html
// and embedded (with two histogram widgets) on the Overview page. Needs
// sector_theme_filter.js loaded first.
//
// Sector/Theme filtering: pass either `sectorSelId`/`themeSelId` (the widget
// creates its own dropdown-based createSectorThemeFilter -- standalone page
// use) or a pre-built `stFilter` object with a matches(row) method (Overview
// page use, where one shared button/dropdown control drives all three
// widgets at once -- see createSectorThemeControl).
function createTable1Widget(opts){
  const ROWS = opts.rows;
  const tableId = opts.tableId;
  const tbody = document.getElementById(opts.tbodyId);
  const bothOnly = document.getElementById(opts.bothOnlyId);
  const capMin = document.getElementById(opts.capMinId);
  const capMax = document.getElementById(opts.capMaxId);
  const rowCount = document.getElementById(opts.rowCountId);
  const headers = document.querySelectorAll("#" + tableId + " th.sortable");
  const stFilter = opts.stFilter || createSectorThemeFilter(ROWS, opts.sectorSelId, opts.themeSelId);

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

  // Color already carries the sign, so the "+" is dropped when showPlus is
  // false (Overview page) -- a plain space keeps the digits aligned in the
  // monospace column instead of "−" hanging one column further right.
  const showPlus = opts.showPlus !== false;
  function fmtPct(v){
    if (v == null || isNaN(v)) return "—";
    const sign = v >= 0 ? (showPlus ? "+" : " ") : "−";
    return sign + Math.abs(v).toFixed(2) + "%";
  }

  const sortValue = {
    symbol: r => r.symbol,
    marketCap: r => r.marketCap,
    rvol: r => r.rvol,
    dr_atr: r => r.dr_atr,
    pct_change: r => r.pct_change,
  };
  let sortKey = "rvol";
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
    const both = bothOnly.checked;
    const min = parseCap(capMin.value);
    const max = parseCap(capMax.value);

    const filtered = ROWS.filter(r => {
      if (both && !(r.dr_atr_plus === 1 && r.rvol_plus === 1)) return false;
      if (min != null && (r.marketCap == null || r.marketCap < min)) return false;
      if (max != null && (r.marketCap == null || r.marketCap > max)) return false;
      if (!stFilter.matches(r)) return false;
      return true;
    }).sort(compareRows);

    updateHeaderArrows();

    tbody.innerHTML = "";
    for (const r of filtered){
      const tr = document.createElement("tr");

      const tdSym = document.createElement("td");
      tdSym.className = "sym";
      tdSym.textContent = r.symbol;

      const tdCap = document.createElement("td");
      tdCap.className = "num n";
      tdCap.textContent = fmtCap(r.marketCap);

      const tdRvol = document.createElement("td");
      tdRvol.className = "num n";
      tdRvol.textContent = r.rvol != null ? r.rvol.toFixed(2) : "—";

      const tdDrAtr = document.createElement("td");
      tdDrAtr.className = "num n";
      tdDrAtr.textContent = r.dr_atr != null ? r.dr_atr.toFixed(2) : "—";

      const tdPct = document.createElement("td");
      tdPct.className = "num n";
      tdPct.textContent = fmtPct(r.pct_change);
      if (r.pct_change != null) tdPct.style.color = r.pct_change >= 0 ? "var(--pos)" : "var(--neg)";

      tr.append(tdSym, tdCap, tdRvol, tdDrAtr, tdPct);
      tbody.appendChild(tr);
    }

    rowCount.textContent = filtered.length + " / " + ROWS.length + " shown";
  }

  bothOnly.addEventListener("change", render);
  capMin.addEventListener("input", render);
  capMax.addEventListener("input", render);
  if (opts.stFilter){
    opts.stFilter.onChange(render);
  } else {
    document.getElementById(opts.sectorSelId).addEventListener("change", render);
    document.getElementById(opts.themeSelId).addEventListener("change", render);
  }
  render();

  return { render };
}
