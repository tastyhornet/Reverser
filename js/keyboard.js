// keyboard shortcuts for the popup. once it's open you can scrub without touching
// the mouse: ←/→ step a snapshot, Home/End jump to the oldest/newest, space
// toggles autoplay, Esc drops back to the live page. all wired through callbacks
// so this file knows nothing about the app's internals.

// handlers: { prev, next, first, last, togglePlay, backToLive }. any can be omitted.
export function initKeyboard(handlers = {}) {
  function onKey(e) {
    // don't hijack keys while someone's typing in a field (there aren't any today,
    // but the settings panel might grow one).
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" && e.target.type !== "range") return;
    if (tag === "TEXTAREA") return;

    switch (e.key) {
      case "ArrowLeft":  fire(handlers.prev, e); break;
      case "ArrowRight": fire(handlers.next, e); break;
      case "Home":       fire(handlers.first, e); break;
      case "End":        fire(handlers.last, e); break;
      case " ":          // spacebar
      case "Spacebar":   fire(handlers.togglePlay, e); break;
      case "Escape":     fire(handlers.backToLive, e); break;
      default: break;
    }
  }

  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

// call a handler if it exists, and swallow the key's default (scroll, etc.).
function fire(fn, e) {
  if (typeof fn !== "function") return;
  e.preventDefault();
  fn();
}
