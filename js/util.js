// shared odds and ends. keeping them in one place until there's enough of any
// one thing to deserve its own file.

// is this something we can time-travel? http/https only - no chrome://, file://,
// about:blank, new-tab pages, etc.
export function isweb(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// dig the original url back out of a wayback url, or hand it back untouched.
// wayback urls look like https://web.archive.org/web/<ts>(if_)?/https://site/...
export function originOf(url) {
  const m = /^https?:\/\/web\.archive\.org\/web\/\d+(?:\w{2,3}_)?\/(.+)$/.exec(url || "");
  return m ? m[1] : url;
}

// "Jun 2011" - month + year from a wayback stamp. captures are monthly so the
// year is the thing that actually matters as you scrub.
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function pretty(ts) {
  const y = ts.slice(0, 4);
  const m = +ts.slice(4, 6) || 1;
  return `${MONTHS[m - 1]} ${y}`;
}

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
