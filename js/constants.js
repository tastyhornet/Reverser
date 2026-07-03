// central config for Reverser. every magic number and endpoint that used to be
// sprinkled across the codebase lives here so there's exactly one place to tune
// things when archive.org changes shape or we want a different feel.

// --- wayback endpoints ---------------------------------------------------
export const WAYBACK_BASE = "https://web.archive.org";
export const CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx";
export const AVAILABILITY_ENDPOINT = "https://archive.org/wayback/available";

// how a snapshot url is assembled: /web/<timestamp>/<original-url>
export const SNAPSHOT_PATH = (ts, url) => `${WAYBACK_BASE}/web/${ts}/${url}`;

// --- timing --------------------------------------------------------------
export const NAV_DEBOUNCE_MS = 300;     // wait out a drag before navigating
export const LOADER_DEFAULT_MS = 8000;  // spinner backstop for a normal jump
export const LOADER_LOOKUP_MS = 25000;  // longer backstop for the first lookup
export const PHRASE_ROTATE_MS = 10000;  // how often the loading line changes
