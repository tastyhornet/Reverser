// everything about turning wayback's YYYYMMDDhhmmss timestamps into things a
// human reads. pulled out of util.js so the date logic has one home - the slider
// label, the stats footer and the history list all lean on this.

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_LONG = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// "Jun 2011" - month + year from a stamp. captures are monthly so the year is
// the thing that actually matters as you scrub.
export function pretty(ts) {
  const y = ts.slice(0, 4);
  const m = +ts.slice(4, 6) || 1;
  return `${MONTHS[m - 1]} ${y}`;
}

// "June 2011" - the long form, for tooltips and the history list where there's room.
export function prettyLong(ts) {
  const y = ts.slice(0, 4);
  const m = +ts.slice(4, 6) || 1;
  return `${MONTHS_LONG[m - 1]} ${y}`;
}

// just the year as a number, for maths (span, gaps, etc.).
export function yearOf(ts) {
  return +ts.slice(0, 4);
}

// "1 of 240" style position readout.
export function position(i, total) {
  return `${i + 1} of ${total}`;
}

// human "how long ago" for a stamp, coarse on purpose (years/months). the whole
// point of the extension is deep time, so "3 years ago" beats "1109 days ago".
export function ago(ts, now = new Date()) {
  const y = +ts.slice(0, 4);
  const m = +ts.slice(4, 6) || 1;
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (months <= 0) return "this month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
