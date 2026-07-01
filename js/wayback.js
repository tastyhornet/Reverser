// the wayback machine plumbing: pick a match target, scan it through the cdx
// api, and fall back to a year-by-year sweep when the scan can't cope.

import { homepageOf } from "./urls.js";
import { pretty } from "./format.js";
import { mapLimit } from "./concurrency.js";
import { SWEEP_START_YEAR, SWEEP_MONTH, SWEEP_DAY, SWEEP_CONCURRENCY } from "./constants.js";
import { cdxRows } from "./cdx.js";
import { availableAt } from "./availability.js";
import * as logger from "./logger.js";

// dedupe a pile of stamps down to one per year-month, oldest -> newest, and tag
// each with its human label. neighbouring years often resolve to the same capture.
function toSnaps(stamps) {
  const seen = new Set();
  const snaps = [];
  for (const ts of stamps.filter(Boolean).sort()) {
    const key = ts.slice(0, 6); // year-month
    if (seen.has(key)) continue;
    seen.add(key);
    snaps.push({ ts, label: pretty(ts) });
  }
  return snaps;
}

// the huge-site fallback. when the all-time cdx query times out (google.com 504s
// it), we can't scan - so we sample one snapshot per year through the fast
// availability index instead.
async function sampledTimeline(url) {
  const now = new Date().getFullYear();
  const targets = [];
  for (let y = SWEEP_START_YEAR; y <= now; y++) {
    targets.push(`${y}${SWEEP_MONTH}${SWEEP_DAY}`);
  }
  logger.log(`sampling ${targets.length} years via availability api for`, url);

  // thirty-odd lookups at once would get us rate limited, so fan out gently.
  const stamps = await mapLimit(targets, SWEEP_CONCURRENCY, (ts) => availableAt(url, ts));
  const snaps = toSnaps(stamps);

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
