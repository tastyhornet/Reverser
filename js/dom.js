// tiny DOM helpers so the rest of the code never touches document.* directly.
// nothing clever - just the two or three calls we make constantly, named.

// grab one element by id. throws loudly in dev if the id is a typo, because a
// silent null here turns into a confusing "cannot read property" three files away.
export function el(id) {
  const node = document.getElementById(id);
  if (!node) console.warn("[Reverser] el(): no element with id", id);
  return node;
}

// grab the first match for a selector, scoped to root (defaults to document).
export function q(selector, root = document) {
  return root.querySelector(selector);
}

// grab all matches as a real array (not a NodeList) so .map/.filter just work.
export function qa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// show / hide by toggling the [hidden] attribute. returns the node for chaining.
export function show(node, on = true) {
  if (node) node.hidden = !on;
  return node;
}

// set text only if it actually changed, to avoid pointless layout churn while a
// slider drag fires updates dozens of times a second.
export function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
  return node;
}

// enable / disable a batch of controls in one call.
export function setEnabled(on, ...nodes) {
  for (const n of nodes) if (n) n.disabled = !on;
}
