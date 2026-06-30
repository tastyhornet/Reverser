// reverser popup - figures out what page you're on and looks up its history.

import { el, show, setText, setEnabled } from "./js/dom.js";
import { isweb, originOf } from "./js/util.js";
import { loadSnapshots } from "./js/wayback.js";
import { NAV_DEBOUNCE_MS, LOADER_DEFAULT_MS, LOADER_LOOKUP_MS, PHRASE_ROTATE_MS, SNAPSHOT_PATH } from "./js/constants.js";
import { getCached, setCached } from "./js/cache.js";
import * as logger from "./js/logger.js";

const siteEl = el("site");
const whenEl = el("when");
const slider = el("slider");
const prevBtn = el("prev");
const nextBtn = el("next");
const stopBtn = el("stop");
const loaderEl = el("loader");
const lheadEl = el("lhead");
const llineEl = el("lline");
const ltextEl = el("ltext");

let tabId = null;
let origin = null;   // the real url we're time-travelling
let snaps = [];      // [{ ts, label }] oldest -> newest
let navTimer = null;
let phraseTimer = null;
let safetyTimer = null;
let navigating = false;   // true only while a slider jump is in flight

// silly loading lines that cycle while something is loading
const PHRASES = ["Time travelling", "Lightspeed", "1 hour = 7 years", "Dinosaurs"];

function label(i) {
  setText(whenEl, `${snaps[i].label}  ·  ${i + 1} of ${snaps.length}`);
}

// move the real tab to a snapshot. this replaces the whole page with the
// archived version - no iframe, so the old page renders natively.
// debounced, since a drag fires this a lot and each one is a full page load off
// a slow server.
function go(i) {
  i = Math.max(0, Math.min(snaps.length - 1, i));
  slider.value = String(i);
  label(i);
  clearTimeout(navTimer);
  navTimer = setTimeout(() => {
    const ts = snaps[+slider.value].ts;
    chrome.tabs.update(tabId, { url: SNAPSHOT_PATH(ts, origin) });
    show(stopBtn, true);
    navigating = true;
    startLoader();
  }, NAV_DEBOUNCE_MS);
}

// hide the loader once the snapshot page actually finishes loading. scoped to a
// real navigation so a stray "complete" from the live tab can't kill the loader
// we show during the initial fetch.
chrome.tabs.onUpdated.addListener((id, info) => {
  if (navigating && id === tabId && info.status === "complete") stopLoader();
});

// "hold on while we take you back" panel, shown between the jump and the
// archived page actually rendering.
function startLoader(maxMs = LOADER_DEFAULT_MS) {
  let i = 0;
  setText(lheadEl, "Hold on while we take you back");
  setText(ltextEl, PHRASES[0]);
  llineEl.style.display = "";   // show the rotating line + waving dots
  show(loaderEl, true);
  clearInterval(phraseTimer);
  phraseTimer = setInterval(() => {
    i = (i + 1) % PHRASES.length;
    setText(ltextEl, PHRASES[i]);
  }, PHRASE_ROTATE_MS); // switch the line periodically
  // archived pages with dead api calls can keep the tab "loading" forever, so
  // never spin past this backstop.
  clearTimeout(safetyTimer);
  safetyTimer = setTimeout(stopLoader, maxMs);
}

// done loading - keep the panel up but swap it for a friendly landing message.
function stopLoader() {
  clearInterval(phraseTimer);
  clearTimeout(safetyTimer);
  phraseTimer = null;
  navigating = false;
  setText(lheadEl, "There you go!");
  llineEl.style.display = "none";
  show(loaderEl, true);
}

// fully hide the loader (errors / nothing to show)
function hideLoader() {
  clearInterval(phraseTimer);
  clearTimeout(safetyTimer);
  phraseTimer = null;
  navigating = false;
  show(loaderEl, false);
}

// drop out of the archive and back to the real page.
function backToLive() {
  chrome.tabs.update(tabId, { url: origin });
  window.close();
}

stopBtn.addEventListener("click", backToLive);
prevBtn.addEventListener("click", () => go(+slider.value - 1));
nextBtn.addEventListener("click", () => go(+slider.value + 1));
slider.addEventListener("input", () => go(+slider.value));

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !isweb(tab.url)) {
    setText(siteEl, "no web page to reverse here");
    setText(whenEl, "");
    return;
  }

  tabId = tab.id;
  origin = originOf(tab.url);
  // already sitting on an archived page? then offer the way back straight away.
  if (origin !== tab.url) show(stopBtn, true);
  setText(siteEl, new URL(origin).hostname);
  logger.log("tab url:", tab.url, "| origin:", origin);

  // use the cached result if we've already looked this site up this session
  let result = await getCached(origin);
  if (result) {
    logger.log("using cached result for", origin, "-", result.snaps.length, "snapshots");
  } else {
    setText(whenEl, "");
    startLoader(LOADER_LOOKUP_MS); // the first lookup on a big site can take a while
    try {
      result = await loadSnapshots(origin);
    } catch (e) {
      hideLoader();
      setText(whenEl, "error: " + e.message);
      logger.error("loadSnapshots failed:", e);
      return;
    }
    if (result.snaps.length) setCached(origin, result);
  }
  origin = result.matched;  // navigate using the url we actually found history for
  snaps = result.snaps;
  if (!snaps.length) {
    hideLoader();
    setText(whenEl, "no snapshots found for this page");
    logger.warn("no snapshots after all fallbacks for", origin);
    return;
  }

  stopLoader(); // history loaded, not loading anymore

  // one stop per snapshot, oldest on the left, newest on the right.
  slider.max = String(snaps.length - 1);
  slider.value = String(snaps.length - 1);
  setEnabled(true, slider, prevBtn, nextBtn);
  label(snaps.length - 1);
})();
