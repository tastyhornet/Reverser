// gear.js - the settings ("gear" icon) engine. holds every user-tweakable
// preference, the defaults, and a tiny get/set layer over chrome.storage.local so
// the popup can read prefs synchronously after one load. everything behind the ⚙
// button routes through here.

import { SETTINGS_KEY } from "./constants.js";
import * as logger from "./logger.js";

// the shape of a fresh install. adding a new setting is just a new line here -
// merge() below makes sure older stored blobs pick up the new default.
export const DEFAULTS = Object.freeze({
  theme: "dark",              // "dark" | "light" | "auto"
  verboseLogging: true,       // the noisy [Reverser] console trail
  showStats: true,            // the little "spans 1998-2024 · 240 snapshots" footer
});

// in-memory copy so the rest of the app reads prefs without awaiting every time.
let current = { ...DEFAULTS };

// fold stored values over the defaults so a blob written by an older build (that
// was missing keys) still comes back complete.
function merge(stored) {
  const out = { ...DEFAULTS };
  if (stored && typeof stored === "object") {
    for (const k of Object.keys(DEFAULTS)) {
      if (k in stored) out[k] = stored[k];
    }
  }
  return out;
}

// load once at startup. safe to call with no chrome.storage (returns defaults).
export async function loadSettings() {
  try {
    const o = await chrome.storage.local.get(SETTINGS_KEY);
    current = merge(o[SETTINGS_KEY]);
    logger.log("settings loaded:", current);
  } catch (e) {
    logger.warn("settings load failed, using defaults:", e.message);
    current = { ...DEFAULTS };
  }
  return current;
}

// synchronous read of the whole bag, or one key.
export function getSettings() {
  return { ...current };
}
export function get(key) {
  return current[key];
}

// write one key and persist. fire-and-forget persistence - the in-memory value is
// authoritative for the current popup session.
export async function set(key, value) {
  if (!(key in DEFAULTS)) {
    logger.warn("ignoring unknown setting:", key);
    return current;
  }
  current = { ...current, [key]: value };
  try {
    await chrome.storage.local.set({ [SETTINGS_KEY]: current });
  } catch (e) {
    logger.warn("settings save failed:", e.message);
  }
  return current;
}

// flip a boolean setting in one call.
export function toggle(key) {
  return set(key, !current[key]);
}
