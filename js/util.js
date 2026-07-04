// compatibility shim. util.js used to be the grab-bag of shared helpers; those
// have since moved into focused homes (urls.js, format.js, concurrency.js). this
// file just re-exports them under the old names so any import path that still
// points here keeps working. prefer importing from the specific module in new code.

export { isweb, originOf } from "./urls.js";
export { pretty } from "./format.js";
export { mapLimit } from "./concurrency.js";
