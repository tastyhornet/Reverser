// talks to the wayback machine's cdx api. one request gets every successful
// capture of a url, collapsed to one per month so the slider doesn't end up with
// forty thousand stops on it.

import { pretty } from "./util.js";

const CDX = "https://web.archive.org/cdx/search/cdx";

// fetch monthly-collapsed successful captures for one exact match url.
async function cdxRows(matchUrl) {
  const params = new URLSearchParams({
    output: "json",
    fl: "timestamp",
    filter: "statuscode:200",
    collapse: "timestamp:6",
    limit: "1000",
    url: matchUrl,
  });

  const res = await fetch(`${CDX}?${params.toString()}`);
  const rows = await res.json();
  return (rows && rows.length > 1) ? rows.slice(1) : [];
}

// collapse a url to its homepage - deep links are often uncaptured even when the
// site itself has twenty years of history.
function homepageOf(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return null;
  }
}

// resolve a url to { matched, snaps }. `matched` is the url we actually found
// history for, which the popup then navigates through.
export async function loadSnapshots(url) {
  const tries = [url];
  const home = homepageOf(url);
  if (home && home !== url) tries.push(home);

  for (const t of tries) {
    const data = await cdxRows(t);
    if (data.length) {
      return { matched: t, snaps: data.map((r) => ({ ts: r[0], label: pretty(r[0]) })) };
    }
  }
  return { matched: url, snaps: [] };
}
