// theme handling. the popup ships dark, but the gear panel lets you pick light or
// "auto" (follow the OS). all this does is stamp data-theme onto <html> and let
// the css do the rest, plus resolve "auto" against the system preference.

import * as gear from "./gear.js";

// what "auto" resolves to right now, based on the OS setting.
function systemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

// resolve a setting value ("dark" | "light" | "auto") to a concrete theme.
export function resolveTheme(pref) {
  return pref === "auto" ? systemTheme() : pref;
}

// apply the current setting to the document.
export function applyTheme(pref = gear.get("theme")) {
  const theme = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", theme);
  return theme;
}

// wire it up: apply now, re-apply whenever the setting changes, and follow the OS
// live while the pref is "auto". returns an unsubscribe fn for tidiness.
export function initTheme() {
  applyTheme();
  const off = gear.onChange((key) => {
    if (key === "theme") applyTheme();
  });

  let mq = null;
  try {
    mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", () => {
      if (gear.get("theme") === "auto") applyTheme();
    });
  } catch { /* matchMedia not available - fine, "auto" just won't live-update */ }

  return off;
}
