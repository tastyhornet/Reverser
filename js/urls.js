// url plumbing, split out of util.js. deciding whether a tab is even reversible,
// pulling the original url back out of an archive url, and building archive urls
// all live together here.

import { SNAPSHOT_PATH } from "./constants.js";

// is this something we can time-travel? http/https only - no chrome://, file://,
// about:blank, new-tab pages, etc.
export function isweb(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// dig the original url back out of a wayback url, or hand it back untouched.
// wayback urls look like https://web.archive.org/web/<ts>(if_)?/https://site/...
export function originOf(url) {
  const m = /^https?:\/\/web\.archive\.org\/web\/\d+(?:\w{2,3}_)?\/(.+)$/.exec(url || "");
  return m ? m[1] : url;
}

// build the snapshot url we navigate the tab to.
export function archiveUrl(ts, origin) {
  return SNAPSHOT_PATH(ts, origin);
}
