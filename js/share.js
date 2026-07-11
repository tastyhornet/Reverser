// "share this moment" - copy the archive.org url for the snapshot you're currently
// looking at to the clipboard, so you can paste the exact then-and-there page to
// someone. falls back through a couple of clipboard strategies because popups are
// a slightly awkward place to write to the clipboard.

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

// try the async clipboard api, then the old execCommand trick.
async function copy(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    logger.warn("navigator.clipboard failed, trying execCommand:", e.message);
  }
  return legacyCopy(text);
}

// the pre-clipboard-api fallback: a throwaway textarea + document.execCommand.
function legacyCopy(text) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    logger.warn("execCommand copy failed:", e.message);
    return false;
  }
}
