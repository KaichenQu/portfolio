export const CASE_FILTERS = {
  type: ["case-debug", "case-design"],
  status: ["solved", "wip", "open"],
};

export function caseMatchSelector(search: string, filters: Record<string, string[]>) {
  const params = new URLSearchParams(search);
  const groups = Object.entries(filters).map(([name, values]) => {
    const selected = params.getAll(name);
    const selectors = values.filter(value => selected.includes(value)).map(value => `[data-${name}="${value}"]`);
    return selectors.length ? `:is(${selectors.join(",")})` : "";
  });
  return groups.join("");
}

export const INITIAL_FILTER_STYLE = "index-initial-filter-style";

function primeCaseFilters(matchSelector: typeof caseMatchSelector, filters: typeof CASE_FILTERS, styleId: string) {
  const matching = matchSelector(location.search, filters);
  const sheet = (document.getElementById(styleId) as HTMLStyleElement | null)?.sheet;
  if (!matching || !sheet) return;
  sheet.insertRule(`.blog-index :is([data-map-case],[data-case-row]):not(${matching}) { display: none !important; }`);
  sheet.insertRule(`.index-map .index-map-covers:not(:has(> li${matching})) { display: none; }`);
  sheet.insertRule(`.index-cases:not(:has([data-case-row]${matching})) [data-empty-cases] { display: block !important; }`);
}

// The two indexes are static. Apply a deep link's filter before paint, through CSSOM
// so the initial HTML and React's hydration markup stay identical.
export const INITIAL_FILTER_SCRIPT = `(${primeCaseFilters})(${caseMatchSelector}, ${JSON.stringify(CASE_FILTERS)}, ${JSON.stringify(INITIAL_FILTER_STYLE)})`;
