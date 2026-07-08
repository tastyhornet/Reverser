// number-crunching over a snapshot list for the little stats footer. pure
// functions, no DOM, no storage - hand it snaps, get back facts. kept separate so
// the readouts are trivially testable and the popup just formats what it returns.

import { yearOf } from "./format.js";

// the headline numbers about a timeline.
export function summarize(snaps) {
  if (!snaps || !snaps.length) {
    return { count: 0, firstYear: null, lastYear: null, spanYears: 0 };
  }
  const first = snaps[0].ts;
  const last = snaps[snaps.length - 1].ts;
  const firstYear = yearOf(first);
  const lastYear = yearOf(last);
  return {
    count: snaps.length,
    firstYear,
    lastYear,
    spanYears: Math.max(0, lastYear - firstYear),
  };
}

// the biggest gap in the timeline - a stretch with no captures, which usually
// means the site was down, parked, or between owners. returns { from, to, years }
// or null when the history is too short to have a gap.
export function largestGap(snaps) {
  if (!snaps || snaps.length < 2) return null;
  let best = null;
  for (let i = 1; i < snaps.length; i++) {
    const from = yearOf(snaps[i - 1].ts);
    const to = yearOf(snaps[i].ts);
    const years = to - from;
    if (!best || years > best.years) best = { from, to, years };
  }
  return best && best.years >= 2 ? best : null;
}

// one-line human summary for the footer, e.g. "1998–2024 · 240 snapshots".
export function summaryLine(snaps) {
  const s = summarize(snaps);
  if (!s.count) return "";
  const range = s.firstYear === s.lastYear ? `${s.firstYear}` : `${s.firstYear}–${s.lastYear}`;
  const noun = s.count === 1 ? "snapshot" : "snapshots";
  return `${range} · ${s.count} ${noun}`;
}
