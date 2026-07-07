// settings-ui.js - the DOM side of the gear panel. gear.js owns the data; this
// owns the drawer: opening/closing it, binding each control to a setting in both
// directions, and the reset button. kept apart from popup.js so the main flow
// stays about scrubbing.

import { el, show } from "./dom.js";
import { toast } from "./toast.js";
import * as gear from "./gear.js";

// wire the whole panel up. call once, after gear.loadSettings() has run.
export function initSettingsPanel() {
  const panel = el("settings");
  const gearBtn = el("gear");

  gearBtn.addEventListener("click", () => show(panel, panel.hidden));

  bindSelect("set-theme", "theme");
  bindSelect("set-speed", "autoplaySpeed", Number);
  bindCheckbox("set-loop", "loopAutoplay");
  bindCheckbox("set-history", "rememberHistory");
  bindCheckbox("set-stats", "showStats");
  bindCheckbox("set-verbose", "verboseLogging");

  el("reset-settings").addEventListener("click", async () => {
    await gear.resetSettings();
    syncControls();
    toast("Settings reset");
  });

  syncControls();
}

// --- control <-> setting binding ----------------------------------------

// a <select>: push its value into the setting on change; `cast` maps the string
// value to whatever type the setting wants (Number for the speed index).
function bindSelect(id, key, cast = (v) => v) {
  const node = el(id);
  if (!node) return;
  node.addEventListener("change", () => gear.set(key, cast(node.value)));
}

// a checkbox: mirror its checked state into the boolean setting.
function bindCheckbox(id, key) {
  const node = el(id);
  if (!node) return;
  node.addEventListener("change", () => gear.set(key, node.checked));
}

// push the current settings back into every control (initial paint + after reset).
function syncControls() {
  const s = gear.getSettings();
  setValue("set-theme", s.theme);
  setValue("set-speed", String(s.autoplaySpeed));
  setChecked("set-loop", s.loopAutoplay);
  setChecked("set-history", s.rememberHistory);
  setChecked("set-stats", s.showStats);
  setChecked("set-verbose", s.verboseLogging);
}

function setValue(id, value) {
  const node = el(id);
  if (node) node.value = value;
}
function setChecked(id, on) {
  const node = el(id);
  if (node) node.checked = !!on;
}
