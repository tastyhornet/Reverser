// the wayback machine plumbing: pick a match target, scan it through the cdx
// api, and fall back to a year-by-year sweep when the scan can't cope.

import { homepageOf } from "./urls.js";
import { pretty } from "./format.js";
import { mapLimit } from "./concurrency.js";
import { SWEEP_START_YEAR, SWEEP_MONTH, SWEEP_DAY, SWEEP_CONCURRENCY } from "./constants.js";
import { cdxRows } from "./cdx.js";
import { availableAt } from "./availability.js";
import * as logger from "./logger.js";

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
