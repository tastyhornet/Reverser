// a thin, tagged wrapper around console so every line reads "[Reverser] ..." and
// we can dial the whole extension's chatter up or down from one switch instead of
// hunting down 30 console.log calls. the wayback code is deliberately noisy - when
// google.com comes back empty you want the raw cdx reply in the console - so this
// keeps that noise consistent and mutable.

const TAG = "[Reverser]";

// flip to false to silence everything below "warn". handy when you're demoing.
let VERBOSE = true;

export function setVerbose(on) {
  VERBOSE = !!on;
}

export function log(...args) {
  if (VERBOSE) console.log(TAG, ...args);
}

export function info(...args) {
  if (VERBOSE) console.info(TAG, ...args);
}

export function warn(...args) {
  console.warn(TAG, ...args);
}

export function error(...args) {
  console.error(TAG, ...args);
}
