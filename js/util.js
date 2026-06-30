// shared odds and ends. keeping them in one place until there's enough of any
// one thing to deserve its own file. url and date helpers have their own modules
// now - this re-exports them so old import paths keep working.

export { isweb, originOf } from "./urls.js";
export { pretty } from "./format.js";

// run async work over a list with a small concurrency cap. preserves order in
// the output even though the workers finish out of order.
export async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  const n = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}
