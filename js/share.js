// "share this moment" - copy the archive.org url for the snapshot you're currently
// looking at to the clipboard, so you can paste the exact then-and-there page to
// someone.

import { archiveUrl } from "./urls.js";
import { toast } from "./toast.js";
import * as logger from "./logger.js";

// build + copy the snapshot url. returns the url on success, null on failure.
export async function shareSnapshot(ts, origin) {
  const url = archiveUrl(ts, origin);
  const ok = await copy(url);
  toast(ok ? "Snapshot link copied" : "Couldn't copy - link is in the console");
  if (!ok) logger.warn("clipboard failed, here's the link:", url);
  return ok ? url : null;
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    logger.warn("navigator.clipboard failed:", e.message);
    return false;
  }
}
