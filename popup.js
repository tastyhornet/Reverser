// reverser popup - figures out what page you're on and looks up its history.

import { isweb, originOf } from "./js/util.js";
import { loadSnapshots } from "./js/wayback.js";

const siteEl = document.getElementById("site");
const whenEl = document.getElementById("when");

let tabId = null;
let origin = null;   // the real url we're time-travelling
let snaps = [];      // [{ ts, label }] oldest -> newest

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !isweb(tab.url)) {
    siteEl.textContent = "no web page to reverse here";
    whenEl.textContent = "";
    return;
  }

  tabId = tab.id;
  origin = originOf(tab.url);
  siteEl.textContent = new URL(origin).hostname;
})();
