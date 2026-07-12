// settings-ui.js - the DOM side of the gear panel. gear.js owns the data; this
// owns the drawer: opening/closing it, binding each control to a setting in both
// directions, rendering the "recently reversed" list, and the reset button. kept
// apart from popup.js so the main flow stays about scrubbing.

import { el, show } from "./dom.js";
import { getHistory } from "./history.js";
import { toast } from "./toast.js";
import * as gear from "./gear.js";

// wire the whole panel up. call once, after gear.loadSettings() has run.
export function initSettingsPanel() {
  const panel = el("settings");
  const gearBtn = el("gear");

  gearBtn.addEventListener("click", async () => {
    const opening = panel.hidden;
    show(panel, opening);
    if (opening) await renderRecents(); // refresh the list each time it opens
  });

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

// --- recents list --------------------------------------------------------

// draw the recently-reversed sites, or hide the block when there's nothing / the
// feature is off.
async function renderRecents() {
  const wrap = el("recents");
  const list = el("recents-list");
  if (!wrap || !list) return;

  if (!gear.get("rememberHistory")) { show(wrap, false); return; }

  const items = await getHistory();
  if (!items.length) { show(wrap, false); return; }

  list.innerHTML = "";
  for (const item of items) {
    list.appendChild(recentRow(item));
  }
  show(wrap, true);
}

// one <li> for a history entry: hostname + snapshot count, clicking opens that
// site fresh in a new tab so you can reverse it from scratch.
function recentRow(item) {
  const li = document.createElement("li");

  const btn = document.createElement("button");
  btn.className = "recent";
  btn.title = item.url;

  const host = document.createElement("span");
  host.className = "recent-host";
  host.textContent = item.host || item.url;

  const meta = document.createElement("span");
  meta.className = "recent-meta";
  meta.textContent = item.snapshots ? `${item.snapshots} snaps` : "";

  btn.append(host, meta);
  btn.addEventListener("click", () => chrome.tabs.create({ url: item.url }));

  li.appendChild(btn);
  return li;
}
