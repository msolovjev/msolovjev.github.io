// Shared Sector/Theme filter for the Large Movers pages. Each row carries a
// `themes` array of {sector, theme} memberships (see load_sector_theme_map()
// in publish_tables.py, sourced from rs_hist/sector_theme_classification.md
// -- the same source rs_hist/build_habitat_pages.py builds its card views
// from). A row can belong to more than one theme, so filtering matches if
// ANY membership satisfies the current sector/theme selection.
function createSectorThemeFilter(rows, sectorSelId, themeSelId){
  const sectorSel = document.getElementById(sectorSelId);
  const themeSel = document.getElementById(themeSelId);

  function themesOf(r){ return r.themes || []; }

  function populateThemes(){
    const sector = sectorSel.value;
    const pool = sector ? rows.filter(r => themesOf(r).some(t => t.sector === sector)) : rows;
    const themes = Array.from(new Set(
      pool.flatMap(r => themesOf(r).filter(t => !sector || t.sector === sector).map(t => t.theme))
    )).sort();
    const prev = themeSel.value;
    themeSel.innerHTML = '<option value="">All themes</option>'
      + themes.map(t => `<option value="${t}">${t}</option>`).join("");
    themeSel.value = themes.includes(prev) ? prev : "";
  }

  const sectors = Array.from(new Set(rows.flatMap(r => themesOf(r).map(t => t.sector)))).sort();
  sectorSel.innerHTML = '<option value="">All sectors</option>'
    + sectors.map(s => `<option value="${s}">${s}</option>`).join("");
  populateThemes();
  sectorSel.addEventListener("change", populateThemes);

  return {
    matches(r){
      const sector = sectorSel.value;
      const theme = themeSel.value;
      if (!sector && !theme) return true;
      return themesOf(r).some(t => (!sector || t.sector === sector) && (!theme || t.theme === theme));
    },
  };
}

// Shared Sector-button / Theme-dropdown control for the Overview page (see
// rs_hist/build_habitat_pages.py's sector legend chips for the pattern this
// borrows, dot included). One control drives several row sets (Table1 +
// both histograms) at once -- register a callback with onChange() to
// re-render each widget whenever the selection changes. `sectorColors` is
// the sector -> hex map from rs_hist/sector_colors.json (see
// report_lib.load_sector_colors), used for each button's color dot.
function createSectorThemeControl(datasets, sectorBarId, themeSelId, sectorColors){
  const sectorBar = document.getElementById(sectorBarId);
  const themeSel = document.getElementById(themeSelId);
  const colors = sectorColors || {};
  const listeners = [];
  let sector = null;

  function themesOf(r){ return r.themes || []; }

  function allRows(){ return datasets.flatMap(rows => rows); }

  function sectorsFor(){
    return Array.from(new Set(allRows().flatMap(r => themesOf(r).map(t => t.sector)))).sort();
  }

  function themesFor(sel){
    const pool = sel ? allRows().filter(r => themesOf(r).some(t => t.sector === sel)) : allRows();
    return Array.from(new Set(
      pool.flatMap(r => themesOf(r).filter(t => !sel || t.sector === sel).map(t => t.theme))
    )).sort();
  }

  function renderSectorButtons(){
    const sectors = sectorsFor();
    sectorBar.innerHTML = `<button type="button" class="sector-chip${sector ? "" : " active"}" data-sector="">All sectors</button>`
      + sectors.map(s => `<button type="button" class="sector-chip${sector === s ? " active" : ""}" data-sector="${s}">`
        + `<span class="chip-dot" style="background:${colors[s] || "var(--accent)"}"></span>${s}</button>`).join("");
    sectorBar.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        const s = btn.dataset.sector || null;
        sector = sector === s ? null : s;
        renderSectorButtons();
        populateThemes();
        notify();
      });
    });
  }

  function populateThemes(){
    const prev = themeSel.value;
    const themes = themesFor(sector);
    themeSel.innerHTML = '<option value="">All themes</option>'
      + themes.map(t => `<option value="${t}">${t}</option>`).join("");
    themeSel.value = themes.includes(prev) ? prev : "";
  }

  function notify(){ listeners.forEach(fn => fn()); }

  themeSel.addEventListener("change", notify);
  renderSectorButtons();
  populateThemes();

  return {
    matches(r){
      const theme = themeSel.value;
      if (!sector && !theme) return true;
      return themesOf(r).some(t => (!sector || t.sector === sector) && (!theme || t.theme === theme));
    },
    onChange(fn){ listeners.push(fn); },
  };
}
