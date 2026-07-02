// compatibility shim. the wayback machine plumbing used to live here as one file;
// it's since been split into cdx.js (the capture scan), availability.js (the fast
// index lookup), timeline.js (the year-by-year sweep) and snapshots.js (the
// orchestration that ties them together). loadSnapshots is re-exported here so the
// old import path keeps working - new code should import from snapshots.js.

export { loadSnapshots } from "./snapshots.js";
