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
