---
type: case-debug
date: 2026-07-08
tags: [debug, infra, auth]
status: open
---
# TradingView's auth_token can no longer be extracted: the tool isn't broken, it stopped being a cookie

## Symptom

In `al-brooks-realtime` (PriceAction-AB), the Python sidecar (`src/kairotrade_pa/data_sources/tradingview_feed.py`) authenticates against TradingView's realtime feed using an `auth_token` cookie pulled out of the local browser with `browser_cookie3`. I wanted a standalone script that reproduced that logic. No browser and no profile would give up an `auth_token`.

## Reproduction

```bash
.venv/bin/python3 scripts/tv-repin.py
```

```
[tv-repin] Firefox: Could not find Firefox profile directory
[tv-repin] Edge: Failed to find cookies for Edge browser
[tv-repin] no auth_token found in any browser's tradingview.com cookies...
```

The Chrome and Safari branches raise nothing and print no hit either — they fail silently, which means both cookie stores opened fine and simply contain no cookie by that name.

## Investigation timeline

1. First guess: not logged in. Listing Chrome's profile directories:

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "^default$|^profile"
   ```

   One line came back, `Profile 3/`. I took that for the profile in use, checked its cookie store, and found zero records under `tradingview.com`. Safari, likewise zero. Conclusion: "neither browser on this machine has ever logged into TradingView." I asked the user to log in again and confirm.

2. The user pasted the full `document.cookie` and the Application panel's cookie table out of DevTools — a real, live session (`sessionid`, `sessionid_sign`, plus a pile of analytics cookies), and **no `auth_token` in the table at all**. So step 1's "not logged in" verdict was itself wrong. It got the observable right — you can't read the token — by luck, and got the attribution completely wrong.

3. To verify the session state under Playwright, I first had to inject those cookies into a browser context. Re-extracting `tradingview.com` cookies from `Profile 3` with `browser_cookie3` returned **zero again**, contradicting the cookie table the user had just pasted. At this point I wrongly suspected that recent Chrome versions had moved to app-bound encryption and `browser_cookie3` could no longer decrypt — that is, I was about to blame the extraction tool.

4. The user asked where `Profile 3` had come from. Going back to step 1's command exposed the real problem: `ls` in this environment appends a trailing `/` to directory names (an `eza`/`lsd`-style output format), and the pattern was `^default$`. Anchoring to end-of-line means `Default/` cannot match `^default$`, so the `Default` line was **silently filtered out** and only `Profile 3` survived. There was never one profile; my own regex had discarded the one that mattered.

   Without the filter:

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "default|profile|guest"
   ```

   All four profiles show up. Chrome's own `Local State` file settles which one is live:

   ```python
   json.load(open(".../Chrome/Local State"))["profile"]["last_used"]
   # -> "Default"
   ```

   `Profile 3` belongs to an entirely different account ("evenness.rocks"). Every test so far had run against the wrong identity.

5. Re-extracting from `Default`: 4742 cookies in one pass, and the `tradingview.com` set **matches exactly** what the user was looking at in DevTools (`sessionid`, `sessionid_sign`, `device_t`, `tv_ecuid`, …). Step 3's encryption theory is dead — the extractor was never broken, it had been pointed at the wrong identity the whole time. This pass also confirmed the other half: even with the right profile, `auth_token` does not exist.

6. With "not logged in" and "the tool is broken" both eliminated, two possibilities remained: TradingView retired the cookie, or it appears only for a moment at login and is never persisted. The user hooked every XHR whose URL contains `signin` directly from the DevTools console:

   ```js
   const _send = XMLHttpRequest.prototype.send;
   XMLHttpRequest.prototype.send = function() {
     this.addEventListener("load", function() {
       if (this._url.includes("signin")) {
         const data = JSON.parse(this.responseText);
         const token = data?.user?.auth_token;
         if (token) console.log("[CAPTURED] auth_token:", token);
       }
     });
     return _send.apply(this, arguments);
   };
   ```

   `Object.keys(localStorage)` and `Object.keys(sessionStorage)` were both empty arrays.

## Root cause

==TradingView no longer writes `auth_token` as a cookie. It comes back exactly once, in the JSON body of the login endpoint (URL contains `signin`), as `data.user.auth_token`; the frontend holds it in memory and never persists it to a cookie, to `localStorage`, or to `sessionStorage`.== Any scheme built on reading a browser cookie store — `browser_cookie3`, this project's `tradingview_feed.py`, the now-deleted `scripts/tv-repin.py` — is guaranteed to come up empty, regardless of browser, profile, or encryption scheme. TradingView's server-side behaviour changed; nothing about the local environment is at fault.

Both detours, "not logged in" and "the extractor is broken", are the same mistake: **a local read comes back empty and the first instinct is to doubt the data source or the tool, rather than to first verify that the identity or path being read is the intended one**. And the anchored `grep` swallowed a line because of this environment's trailing slash without emitting anything at all. Silent filtering is more dangerous than an error, because it lets you draw confident conclusions from a truncated result.

## Fix

Deleted `scripts/tv-repin.py` (never committed, removed straight off disk). It was a faithful copy of `tradingview_feed.py::_extract_browser_token()`; the assumption behind it is now disproven, the script cannot produce a correct result, and leaving it in place would only mislead the next investigation.

The real extraction path in `tradingview_feed.py` (`_extract_browser_token`/`_ensure_token`) is **not fixed**. It has effectively been running empty this whole time, which means the deployed sidecar is very likely stuck in anonymous mode with nobody noticing. This round only pinned down the root cause and left a manual fallback in place — log out, log back in, capture the `signin` response with the console hook. Rewriting the automation is deferred to a dedicated pass.

## Lessons

- When a local extraction or query returns empty, the order should be: confirm that what you are reading is what you think you are reading, then doubt whether the target data exists, and only then doubt the tool. I ran that order backwards and took two detours to get back to it.
- A script that depends on some field or cookie on a third-party site is a standing bet that their implementation detail holds. Re-check that bet against real browser traffic (DevTools Network/Console) from time to time, instead of trusting the observation made on the day the script was written.
- Hooking XHR to intercept the response body was more direct than digging through cookie tables: no guessing about which storage the value lands in, just intercept where the data passes. Next time a token "should be somewhere on the client" but is missing from cookies, `localStorage`, and `sessionStorage`, skip straight to this rather than eliminating all three stores one at a time.

## Related

- [[JWT]]
- [[grep-anchor-vs-ls-trailing-slash]]
