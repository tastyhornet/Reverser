// theme handling. the popup ships dark, but the gear panel lets you pick light.
// all this does is stamp data-theme onto <html> and let the css do the rest.

import * as gear from "./gear.js";

// resolve a setting value ("dark" | "light" | "auto") to a concrete theme.
export function resolveTheme(pref) {
  return pref === "auto" ? "dark" : pref;
}

// apply the current setting to the document.
export function applyTheme(pref = gear.get("theme")) {
  const theme = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

// wire it up: apply now, re-apply whenever the setting changes. returns an
// unsubscribe fn for tidiness.
export function initTheme() {
  applyTheme();
  return gear.onChange((key) => {
    if (key === "theme") applyTheme();
  });
}
