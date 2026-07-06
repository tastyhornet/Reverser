// autoplay - the "play through time" button. instead of dragging, hit ▶ and the
// slider walks itself forward one snapshot at a time so you can watch a site age
// on its own. this only knows about an index and a callback - the popup owns the
// actual navigation.

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
    timer = setInterval(tick, 2500);
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

  return { start, stop, toggle, running };
}
