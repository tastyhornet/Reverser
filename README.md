# ⏪ Reverser

Drag a slider and watch the page you're on rewind through its own past. Reverser grabs every saved snapshot of the current site from the Wayback Machine, lines them up on a slider right in the toolbar popup, and as you drag it sends the actual tab back in time. Today, last year, ten years ago, one drag away.

It started as a fork of a split-screen "then vs now" extension. The compare view was fine, but two frozen pages side by side never really felt like time travel. A slider that rewinds the real page does.

## How to use it

Open any site, click the Reverser icon, and a slider appears in the popup with every monthly snapshot the archive has. Drag it, or step one at a time with ◀ ▶, and the tab reloads as that archived version. The date you're on shows right under the slider. Done looking? Hit "Back to live page" and the tab returns to the present-day site.

Keep the popup open while you scrub, it stays put as the tab reloads underneath it. And don't expect it to be instant, each date is a fresh pull from archive.org and that's not a fast server, so give every jump a second.

## How it works

- The popup reads the current tab's URL. If you're already on an archived page, it pulls the original URL back out so the slider still works.
- It asks the Wayback CDX API for every successful capture of that URL, collapsed to one per month so the slider doesn't drown in near-identical grabs.
- Dragging the slider just calls `chrome.tabs.update` to send the tab to `https://web.archive.org/web/<timestamp>/<your-url>`. A normal navigation, so the archived page renders natively, Wayback toolbar and all.

Because it's a real page load and not an iframe, there's none of the X-Frame-Options / CSP wrestling the split-screen version needed. The flip side is that archived pages still fire their original API calls, which 404 against the archive, so some come back half-working. Heavy-JS apps, paywalls and login screens are the usual offenders. Nothing Reverser can fix, that's just what's in the archive.

## Extras

Beyond the core slider, the toolbar popup now carries a few more things:

- **Play through time** - hit ▶ (or space) and the slider walks itself forward one snapshot at a time so you can watch a site age on its own. Speed and looping live in settings.
- **Share this moment** - 🔗 copies the archive.org link for the snapshot you're currently on, so you can paste the exact then-and-there page to someone.
- **Keyboard scrubbing** - ←/→ step, Home/End jump to the oldest/newest, space toggles play, Esc drops back to live.
- **Recently reversed** - the ⚙ panel keeps a short list of sites you've time-travelled, one click to reopen.
- **Settings (⚙)** - theme (dark / light / auto), autoplay speed + loop, a confirm prompt before leaving the archive, history on/off, a stats footer toggle, and verbose console logging.
- **Stats footer** - a one-line "1998–2024 · 240 snapshots" summary of the timeline you're scrubbing.

## Files

The logic is split into small, single-purpose modules under `js/`.

Entry & UI

- `manifest.json` - MV3 manifest
- `popup.html` / `popup.css` - the slider UI, settings drawer, and theme tokens
- `popup.js` - entry point: DOM wiring, event listeners, orchestration
- `js/settings-ui.js` - the DOM side of the gear panel (drawer, controls, recents list)

Wayback plumbing

- `js/snapshots.js` - orchestration: try exact url, then homepage, then the year sweep
- `js/cdx.js` - the Wayback CDX capture scan
- `js/availability.js` - the fast "closest snapshot to a date" index lookup
- `js/timeline.js` - the year-by-year availability sweep (huge-site fallback)

State & features

- `js/gear.js` - settings engine: defaults + get/set/subscribe over chrome.storage.local
- `js/cache.js` - per-session snapshot cache (chrome.storage.session)
- `js/history.js` - the "recently reversed" list (chrome.storage.local)
- `js/autoplay.js` - the "play through time" stepper
- `js/share.js` - copy the current snapshot's archive link to the clipboard
- `js/stats.js` - timeline number-crunching for the stats footer
- `js/theme.js` - dark / light / auto theme application
- `js/keyboard.js` - popup keyboard shortcuts
- `js/toast.js` - the little "copied!" toast strip
- `js/loader.js` - the "hold on while we take you back" loading panel

Shared helpers

- `js/urls.js` - url checks, archive-url building, origin extraction
- `js/format.js` - timestamp → human date/label formatting
- `js/concurrency.js` - concurrency-limited map, delay, timeout
- `js/constants.js` - every endpoint, tuning knob, and magic number in one place
- `js/logger.js` - tagged, mutable `[Reverser]` console wrapper
- `js/dom.js` - tiny DOM helpers so nothing else touches `document.*` directly
- `js/util.js` / `js/wayback.js` - back-compat shims re-exporting from the split modules

## Loading it

1. Open chrome://extensions (or edge://extensions).
2. Turn on Developer mode.
3. Load unpacked, and pick the Reverser folder.
