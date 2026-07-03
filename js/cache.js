// remember each site's snapshot list for this session so reopening the popup is
// instant instead of hitting the cdx api again.
export async function getCached(url) {
  try {
    const k = "snaps:" + url;
    const o = await chrome.storage.session.get(k);
    return o[k] || null;
  } catch {
    return null;
  }
}

export async function setCached(url, list) {
  try {
    await chrome.storage.session.set({ ["snaps:" + url]: list });
  } catch {}
}
