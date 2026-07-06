// central config for Reverser. every magic number and endpoint that used to be
// sprinkled across the codebase lives here so there's exactly one place to tune
// things when archive.org changes shape or we want a different feel.

// --- wayback endpoints ---------------------------------------------------
export const WAYBACK_BASE = "https://web.archive.org";
export const CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx";
export const AVAILABILITY_ENDPOINT = "https://archive.org/wayback/available";

// how a snapshot url is assembled: /web/<timestamp>/<original-url>
export const SNAPSHOT_PATH = (ts, url) => `${WAYBACK_BASE}/web/${ts}/${url}`;

// --- cdx query tuning ----------------------------------------------------
export const CDX_LIMIT = 1000;          // cap rows so a busy site can't flood us
export const CDX_COLLAPSE = "timestamp:6"; // one capture per year-month
export const CDX_STATUS_FILTER = "statuscode:200"; // only successful captures

// --- year sweep (the huge-site fallback) ---------------------------------
export const SWEEP_START_YEAR = 1996;   // wayback's own beginning of time
export const SWEEP_MONTH = "06";        // sample mid-year so we dodge edges
export const SWEEP_DAY = "01";
export const SWEEP_CONCURRENCY = 6;     // parallel availability lookups

// --- timing --------------------------------------------------------------
export const NAV_DEBOUNCE_MS = 300;     // wait out a drag before navigating
export const LOADER_DEFAULT_MS = 8000;  // spinner backstop for a normal jump
export const LOADER_LOOKUP_MS = 25000;  // longer backstop for the first lookup
export const PHRASE_ROTATE_MS = 10000;  // how often the loading line changes
export const TOAST_MS = 2600;           // how long a toast sticks around

// --- autoplay ("play through time") --------------------------------------
export const AUTOPLAY_SPEEDS = [
  { label: "0.5×", ms: 4000 },
  { label: "1×", ms: 2500 },
  { label: "2×", ms: 1200 },
];
export const AUTOPLAY_DEFAULT_SPEED = 1; // index into AUTOPLAY_SPEEDS

// --- settings ------------------------------------------------------------
export const SETTINGS_KEY = "reverser:settings";
