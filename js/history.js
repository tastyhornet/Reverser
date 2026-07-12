// "recently reversed" list. every time you scrub a site we drop it here so the
// popup can show a few one-click shortcuts back to sites you've time-travelled
// before. persisted in chrome.storage.local, capped, most-recent-first, and
// gated behind the rememberHistory setting.

import { HISTORY_KEY, HISTORY_MAX } from "./constants.js";
import { hostnameOf } from "./urls.js";
import * as gear from "./gear.js";
import * as logger from "./logger.js";

// read the list back, newest first. always returns an array.
export async function getHistory() {
  try {
    const o = await chrome.storage.local.get(HISTORY_KEY);
    const list = o[HISTORY_KEY];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    logger.warn("history read failed:", e.message);
    return [];
  }
}

// record a visit. no-op when the setting is off. dedupes by url (moving an existing entry to the front), stamps
// the time, and trims to HISTORY_MAX.
export async function recordVisit(url, snapshotCount = 0) {
  if (!gear.get("rememberHistory")) return;
  try {
    const list = await getHistory();
    const filtered = list.filter((e) => e.url !== url);
    filtered.unshift({
      url,
      host: hostnameOf(url),
      snapshots: snapshotCount,
      at: Date.now(),
    });
    const trimmed = filtered.slice(0, HISTORY_MAX);
    await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
    logger.log("history recorded:", url, `(${trimmed.length} kept)`);
  } catch (e) {
    logger.warn("history write failed:", e.message);
  }
}

// wipe it (the gear panel offers this).
export async function clearHistory() {
  try {
    await chrome.storage.local.remove(HISTORY_KEY);
    logger.log("history cleared");
  } catch (e) {
    logger.warn("history clear failed:", e.message);
  }
}
