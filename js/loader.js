import { PHRASE_ROTATE_MS, LOADER_DEFAULT_MS } from "./constants.js";

// silly loading lines that cycle while something is loading
const PHRASES = ["Time travelling", "Lightspeed", "1 hour = 7 years", "Dinosaurs"];

// drives the "hold on while we take you back" panel. `navigating` tracks
// whether we're mid slider-jump, so callers can tell a real snapshot load
// apart from the live tab just sitting there.
export function createLoader({ loader, lhead, lline, ltext }) {
  let phraseTimer = null;
  let safetyTimer = null;
  let navigating = false;

  function start(maxMs = LOADER_DEFAULT_MS) {
    let i = 0;
    lhead.textContent = "Hold on while we take you back";
    ltext.textContent = PHRASES[0];
    lline.style.display = "";   // show the rotating line + waving dots
    loader.hidden = false;
    clearInterval(phraseTimer);
    phraseTimer = setInterval(() => {
      i = (i + 1) % PHRASES.length;
      ltext.textContent = PHRASES[i];
    }, PHRASE_ROTATE_MS); // switch the line periodically
    // archived pages with dead api calls can keep the tab "loading" forever, so
    // never spin past this backstop.
    clearTimeout(safetyTimer);
    safetyTimer = setTimeout(stop, maxMs);
  }

  // done loading - drop the rotating text and the waving dots, just say it landed
  function stop() {
    clearInterval(phraseTimer);
    clearTimeout(safetyTimer);
    phraseTimer = null;
    navigating = false;
    lhead.textContent = "There you go!";
    lline.style.display = "none";
    loader.hidden = false;
  }

  // fully hide the loader (errors / nothing to show)
  function hide() {
    clearInterval(phraseTimer);
    clearTimeout(safetyTimer);
    phraseTimer = null;
    navigating = false;
    loader.hidden = true;
  }

  return {
    start,
    stop,
    hide,
    get navigating() { return navigating; },
    set navigating(v) { navigating = v; },
  };
}
