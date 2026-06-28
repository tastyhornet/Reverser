// talks to the wayback machine's cdx api. one request gets every successful
// capture of a url, collapsed to one per month so the slider doesn't end up with
// forty thousand stops on it.

import { pretty } from "./util.js";
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

// resolve a url to { matched, snaps }. `matched` is the url we actually found
// history for, which the popup then navigates through.
export async function loadSnapshots(url) {
  const tries = [url];
  const home = homepageOf(url);
  if (home && home !== url) tries.push(home);

  logger.log("origin url:", url, "| match attempts in order:", tries);

  for (const t of tries) {
    try {
      const data = await cdxRows(t);
      if (data.length) {
        logger.log(`using "${t}" with ${data.length} snapshots`);
        return { matched: t, snaps: data.map((r) => ({ ts: r[0], label: pretty(r[0]) })) };
      }
      logger.warn(`0 snapshots for "${t}" - trying next`);
    } catch (e) {
      logger.warn(`cdx failed for "${t}":`, e.message);
    }
  }
  return { matched: url, snaps: [] };
}
