// the CDX side of the wayback machine: ask for every successful capture of one
// exact url, collapsed to one per month. deliberately noisy - when a site like
// google.com comes back empty we want the raw reply in the console (open the
// popup, right-click -> Inspect, read the console).

import { CDX_ENDPOINT, CDX_LIMIT, CDX_COLLAPSE, CDX_STATUS_FILTER } from "./constants.js";
import * as logger from "./logger.js";

// assemble the cdx query url for one match target.
function cdxQuery(matchUrl) {
  const params = new URLSearchParams({
    output: "json",
    fl: "timestamp",
    filter: CDX_STATUS_FILTER,
    collapse: CDX_COLLAPSE,
    limit: String(CDX_LIMIT),
    url: matchUrl,
  });
  return `${CDX_ENDPOINT}?${params.toString()}`;
}

// fetch monthly-collapsed successful captures for one exact match url. returns an
// array of [timestamp] rows (header stripped). throws on network / parse trouble
// so the orchestrator can fall back to the year sweep.
export async function cdxRows(matchUrl) {
  const api = cdxQuery(matchUrl);
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
