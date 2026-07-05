// concurrency helpers. the year sweep can fire ~30 availability lookups and we
// don't want them all hitting archive.org at once, so everything that fans out
// goes through mapLimit.

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

// resolve after ms milliseconds. the one-liner we kept re-writing inline.
export function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// wrap a promise so it rejects if it hasn't settled within ms. the cdx all-time
// query on giant sites can hang forever; this lets a caller bail to the sweep.
export function withTimeout(promise, ms, message = "timed out") {
  let timer;
  const guard = new Promise((_, rej) => {
    timer = setTimeout(() => rej(new Error(message)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}
