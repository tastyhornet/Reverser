// reverser popup - figures out what page you're on and looks up its history.

import { isweb, originOf } from "./js/util.js";
import { loadSnapshots } from "./js/wayback.js";
import * as logger from "./js/logger.js";

const siteEl = document.getElementById("site");
const whenEl = document.getElementById("when");
const slider = document.getElementById("slider");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const stopBtn = document.getElementById("stop");
const loaderEl = document.getElementById("loader");
const lheadEl = document.getElementById("lhead");
const llineEl = document.getElementById("lline");
const ltextEl = document.getElementById("ltext");

let tabId = null;
let origin = null;   // the real url we're time-travelling
let snaps = [];      // [{ ts, label }] oldest -> newest
let navTimer = null;
let phraseTimer = null;
let safetyTimer = null;

// silly loading lines that cycle while something is loading
const PHRASES = ["Time travelling", "Lightspeed", "1 hour = 7 years", "Dinosaurs"];

function label(i) {
  whenEl.textContent = `${snaps[i].label}  ·  ${i + 1} of ${snaps.length}`;
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
    chrome.tabs.update(tabId, { url: `https://web.archive.org/web/${ts}/${origin}` });
    stopBtn.hidden = false;
    startLoader();
  }, 300);
}

// "hold on while we take you back" panel, shown between the jump and the
// archived page actually rendering.
function startLoader(maxMs = 8000) {
  let i = 0;
  lheadEl.textContent = "Hold on while we take you back";
  ltextEl.textContent = PHRASES[0];
  llineEl.style.display = "";   // show the rotating line + waving dots
  loaderEl.hidden = false;
  clearInterval(phraseTimer);
  phraseTimer = setInterval(() => {
    i = (i + 1) % PHRASES.length;
    ltextEl.textContent = PHRASES[i];
  }, 10000); // switch the line periodically
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
  lheadEl.textContent = "There you go!";
  llineEl.style.display = "none";
  loaderEl.hidden = false;
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
    siteEl.textContent = "no web page to reverse here";
    whenEl.textContent = "";
    return;
  }

  tabId = tab.id;
  origin = originOf(tab.url);
  // already sitting on an archived page? then offer the way back straight away.
  if (origin !== tab.url) stopBtn.hidden = false;
  siteEl.textContent = new URL(origin).hostname;
  logger.log("tab url:", tab.url, "| origin:", origin);

  whenEl.textContent = "";
  startLoader(25000); // the first lookup on a big site can take a while
  const result = await loadSnapshots(origin);
  origin = result.matched;  // navigate using the url we actually found history for
  snaps = result.snaps;
  if (!snaps.length) {
    whenEl.textContent = "no snapshots found for this page";
    logger.warn("no snapshots after all fallbacks for", origin);
    return;
  }

  stopLoader(); // history loaded, not loading anymore

  // one stop per snapshot, oldest on the left, newest on the right.
  slider.max = String(snaps.length - 1);
  slider.value = String(snaps.length - 1);
  slider.disabled = false;
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  label(snaps.length - 1);
})();
