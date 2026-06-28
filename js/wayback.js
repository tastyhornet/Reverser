// talks to the wayback machine's cdx api. one request gets every successful
// capture of a url, collapsed to one per month so the slider doesn't end up with
// forty thousand stops on it.

import { pretty, mapLimit } from "./util.js";
import { availableAt } from "./availability.js";
import * as logger from "./logger.js";

const CDX = "https://web.archive.org/cdx/search/cdx";

// fetch monthly-collapsed successful captures for one exact match url. throws on
// network / parse trouble so the caller can decide what to do about it.
async function cdxRows(matchUrl) {
  const params = new URLSearchParams({
    output: "json",
    fl: "timestamp",
    filter: "statuscode:200",
    collapse: "timestamp:6",
    limit: "1000",
    url: matchUrl,
  });

  const api = `${CDX}?${params.toString()}`;
  logger.log("CDX request:", api);

  let res;
  try {
    res = await fetch(api);
  } catch (e) {
    logger.error("fetch threw for", matchUrl, e);
    throw new Error("network error reaching the wayback machine");
  }

  const ct = res.headers.get("content-type");
  const text = await res.text();
  logger.log(`CDX "${matchUrl}" -> ${res.status} ${res.statusText} | type=${ct} | ${text.length} bytes`);
  logger.log("CDX body (first 300 chars):", text.slice(0, 300));

  if (!res.ok) throw new Error(`cdx http ${res.status}: ${text.slice(0, 120)}`);

  let rows;
  try {
    rows = JSON.parse(text);
  } catch {
    logger.error("CDX did not return JSON. full body below:");
    logger.error(text);
    throw new Error("cdx returned non-json (rate limit / error page?) - see console");
  }

  const data = (rows && rows.length > 1) ? rows.slice(1) : [];
  logger.log(`CDX "${matchUrl}" parsed ${data.length} captures`);
  return data;
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

// the huge-site fallback. when the all-time cdx query times out (google.com 504s
// it), we can't scan - so we sample one snapshot per year through the fast
// availability index instead.
async function sampledTimeline(url) {
  const now = new Date().getFullYear();
  const targets = [];
  for (let y = 1996; y <= now; y++) {
    targets.push(`${y}0601`); // sample mid-year so we dodge edges
  }
  logger.log(`sampling ${targets.length} years via availability api for`, url);

  // thirty-odd lookups at once would get us rate limited, so fan out gently.
  const stamps = await mapLimit(targets, 6, (ts) => availableAt(url, ts));
  const snaps = stamps.filter(Boolean).map((ts) => ({ ts, label: pretty(ts) }));

  logger.log("sampled timeline:", snaps.length, "points");
  return snaps;
}

// resolve a url to { matched, snaps }. `matched` is the url we actually found
// history for, which the popup then navigates through.
export async function loadSnapshots(url) {
  const tries = [url];
  const home = homepageOf(url);
  if (home && home !== url) tries.push(home);

  logger.log("origin url:", url, "| match attempts in order:", tries);

  let timedOut = false;

  for (const t of tries) {
    try {
      const data = await cdxRows(t);
      if (data.length) {
        logger.log(`using "${t}" with ${data.length} snapshots`);
        return { matched: t, snaps: data.map((r) => ({ ts: r[0], label: pretty(r[0]) })) };
      }
      logger.warn(`0 snapshots for "${t}" - trying next`);
    } catch (e) {
      timedOut = true;
      logger.warn(`cdx failed for "${t}":`, e.message, "- will try the year sweep");
    }
  }

  // the simple query gave nothing or timed out - sample the timeline instead.
  const matched = home || url;
  logger.log(timedOut ? "timed out," : "empty,", "falling back to availability sampling for", matched);
  const snaps = await sampledTimeline(matched);
  return { matched, snaps };
}
