// the availability side of the wayback machine. this is an index lookup (fast),
// not a scan, so it works even on google-sized sites where the cdx collapse
// query just times out. one call = "closest snapshot to this timestamp".

import * as logger from "./logger.js";

const AVAILABILITY = "https://archive.org/wayback/available";

// closest snapshot to a target timestamp. returns a timestamp string or null,
// never throws - a single missing year shouldn't sink the whole sweep.
export async function availableAt(url, ts) {
  const params = new URLSearchParams({ url, timestamp: ts });
  const api = `${AVAILABILITY}?${params.toString()}`;
  try {
    const res = await fetch(api);
    if (!res.ok) {
      logger.warn(`availability ${ts} -> ${res.status}`);
      return null;
    }
    const j = await res.json();
    const snap = j && j.archived_snapshots && j.archived_snapshots.closest;
    return (snap && snap.available && snap.timestamp) ? snap.timestamp : null;
  } catch (e) {
    logger.warn(`availability ${ts} error:`, e.message);
    return null;
  }
}
