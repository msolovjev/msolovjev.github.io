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
