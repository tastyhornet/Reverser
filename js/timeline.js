// the huge-site fallback. when the all-time cdx query times out (google.com 504s
// it), we can't scan - so we sample one snapshot per year through the fast
// availability index and dedupe the results into a monthly timeline.

import { SWEEP_START_YEAR, SWEEP_MONTH, SWEEP_DAY, SWEEP_CONCURRENCY } from "./constants.js";
import { availableAt } from "./availability.js";
import { mapLimit } from "./concurrency.js";
import { pretty } from "./format.js";
import * as logger from "./logger.js";

// the mid-year target stamp for each year from 1996 to now.
function sweepTargets(now = new Date().getFullYear()) {
  const targets = [];
  for (let y = SWEEP_START_YEAR; y <= now; y++) {
    targets.push(`${y}${SWEEP_MONTH}${SWEEP_DAY}`);
  }
  return targets;
}

// dedupe a pile of stamps down to one per year-month, oldest -> newest, and tag
// each with its human label.
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

// sample one snapshot per year via the availability api and fold into a timeline.
export async function sampledTimeline(url) {
  const targets = sweepTargets();
  logger.log(`sampling ${targets.length} years via availability api for`, url);

  const stamps = await mapLimit(targets, SWEEP_CONCURRENCY, (ts) => availableAt(url, ts));
  const snaps = toSnaps(stamps);

  logger.log("sampled timeline:", snaps.length, "points");
  return snaps;
}
