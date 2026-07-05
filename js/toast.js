// dead-simple toast notifications. one floating strip at the bottom of the popup
// that fades a short message in and out - "copied!", "added to history", that
// kind of thing. no dependencies beyond a host element to mount into.

import { TOAST_MS } from "./constants.js";

let host = null;
let hideTimer = null;

// point the toaster at a container (usually a fixed-position div in the popup).
export function mountToast(node) {
  host = node;
}

// show a message. calling again while one is up just replaces the text and
// restarts the timer, so rapid actions don't stack up a queue.
export function toast(message, ms = TOAST_MS) {
  if (!host) return;
  host.textContent = message;
  host.classList.add("show");
  host.hidden = false;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    host.classList.remove("show");
    // let the fade-out finish before we actually hide it from layout
    setTimeout(() => { if (host) host.hidden = true; }, 200);
  }, ms);
}
