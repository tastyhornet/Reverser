// orchestration for "get me a slider's worth of history for this url". tries the
// exact url, then the homepage, and if the cdx api times out or errors on a huge
// site it drops to the year-by-year availability sweep. this is the one function
// the popup actually calls.

import { cdxRows } from "./cdx.js";
import { sampledTimeline } from "./timeline.js";
import { homepageOf } from "./urls.js";
import { pretty } from "./format.js";
import * as logger from "./logger.js";

// the ordered list of match targets: the exact url first, then its homepage.
function matchTargets(url) {
  const tries = [url];
  const home = homepageOf(url);
  if (home && home !== url) tries.push(home);
  return { tries, home };
}

// map raw cdx rows into the { ts, label } shape the slider wants.
function rowsToSnaps(rows) {
  return rows.map((r) => ({ ts: r[0], label: pretty(r[0]) }));
}

// resolve a url to { matched, snaps }. `matched` is the url we actually found
// history for, which the popup then navigates through.
export async function loadSnapshots(url) {
  const { tries, home } = matchTargets(url);
  logger.log("origin url:", url, "| match attempts in order:", tries);

  let timedOut = false;
  for (const t of tries) {
    try {
      const data = await cdxRows(t);
      if (data.length) {
        logger.log(`using "${t}" with ${data.length} snapshots`);
        return { matched: t, snaps: rowsToSnaps(data) };
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
