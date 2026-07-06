// autoplay - the "play through time" button. instead of dragging, hit ▶ and the
// slider walks itself forward one snapshot at a time so you can watch a site age
// on its own. speed comes from settings; this only knows about an index and a
// callback - the popup owns the actual navigation.

import { AUTOPLAY_SPEEDS } from "./constants.js";
import * as gear from "./gear.js";

// step: called with each new index to move to. bounds: () => ({ index, max }).
// onStop: optional, fired whenever playback ends (button state, etc.).
export function createAutoplay({ step, bounds, onStop }) {
  let timer = null;

  function running() {
    return timer !== null;
  }

  function tick() {
    const { index, max } = bounds();
    if (index >= max) {
      stop();
      return;
    }
    step(index + 1);
  }

  function start() {
    if (running()) return;
    const ms = speedMs();
    timer = setInterval(tick, ms);
  }

  function stop() {
    if (!running()) return;
    clearInterval(timer);
    timer = null;
    if (typeof onStop === "function") onStop();
  }

  function toggle() {
    running() ? stop() : start();
  }

  // if the speed setting changes mid-play, restart the interval so it takes effect.
  gear.onChange((key) => {
    if (key === "autoplaySpeed" && running()) { stop(); start(); }
  });

  return { start, stop, toggle, running };
}

// resolve the current speed setting to a millisecond interval.
function speedMs() {
  const i = gear.get("autoplaySpeed");
  const chosen = AUTOPLAY_SPEEDS[i] || AUTOPLAY_SPEEDS[Math.floor(AUTOPLAY_SPEEDS.length / 2)];
  return chosen.ms;
}
