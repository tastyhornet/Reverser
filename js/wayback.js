// talks to the wayback machine's cdx api. one request gets every successful
// capture of a url, collapsed to one per month so the slider doesn't end up with
// forty thousand stops on it.

import { pretty } from "./util.js";

const CDX = "https://web.archive.org/cdx/search/cdx";

export async function loadSnapshots(url) {
  const params = new URLSearchParams({
    output: "json",
    fl: "timestamp",
    filter: "statuscode:200",
    collapse: "timestamp:6",
    limit: "1000",
    url,
  });

  const res = await fetch(`${CDX}?${params.toString()}`);
  const rows = await res.json();
  const data = (rows && rows.length > 1) ? rows.slice(1) : [];
  return data.map((r) => ({ ts: r[0], label: pretty(r[0]) }));
}
