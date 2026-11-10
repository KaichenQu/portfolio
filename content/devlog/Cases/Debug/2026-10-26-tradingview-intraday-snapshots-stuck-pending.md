---
type: case-debug
date: 2026-10-26
tags: [debug, backend, infra, auth, python, tradingview]
status: open
---
# TradingView intraday snapshots stuck in SNAPSHOT_PENDING

On KairoTrade, every intraday series from TradingView (5m, 1h) went to `SNAPSHOT_PENDING`, while daily bars kept working. `SNAPSHOT_PENDING` is the state a series shows when no snapshot is ready yet.

==`TV_TOKEN` is a [[JWT]] that lives about 4 hours, and nothing renewed it.== A JWT is a signed token that carries its own expiry time (`exp`). Once that time passed, the feed could no longer pull intraday data.

The fix, [[PR]] #109, makes the feed's sidecar fetch a new token from the TradingView login session 10 minutes before expiry. A sidecar is a separate small service next to the main one; here it is the Python service on the feed VM that talks to TradingView for the API.

The case stays open. On 10/29 the sidecar's `/history` calls failed again, and the cause of that second outage is not established.

How the token is obtained at all is the subject of [[2026-07-08-tradingview-auth-token-no-longer-a-cookie]]: it is no longer a browser cookie. This note starts after that point, with a token in hand that runs out.

## Observed symptoms

| Date | Seen | Unaffected |
| --- | --- | --- |
| 10/25 | `MNQ1!` (CME_MINI): every period `SNAPSHOT_PENDING` | Yahoo `MNQ=F` normal |
| 10/26 | NVDA, `MNQ1!`, `MES1!`, 5m and 1h: all `SNAPSHOT_PENDING` | daily bars normal |

The blast radius on 10/26 was every intraday series on the TradingView path, stocks and futures alike.

## Reproduction

The briefs record no deliberate reproduction. The pattern follows from the token's lifetime: about 4 hours after a token was set, every intraday series stops updating at the same moment, and it stays stopped until someone sets a new token.

## Investigation timeline

The source briefs record what each session saw and concluded. They do not record the commands run in between.

1. **10/25, one futures root.** Only `MNQ1!` was pending. Yahoo's `MNQ=F` was fine, so the market data existed and only the TradingView path failed. The hypothesis written down that evening was an expired TradingView subscription, with this as the next check:

   ```bash
   journalctl -u tvfeed
   ```

   The session did not run it.

2. **10/26 afternoon, the scope widens.** NVDA and `MES1!` were pending too, on both 5m and 1h, while daily bars were normal. A failure across stocks and futures, on every intraday interval, points at something the whole intraday path shares.

   Reading the feed VM's logs from the agent session failed:

   ```
   Permission denied (publickey)
   ```

   The note for the owner was to run `journalctl -u tvfeed` from an ordinary terminal instead.

3. **10/26 evening, the cause.** The session established that `TV_TOKEN` is a JWT of about 4 hours, and that every intraday series goes to `SNAPSHOT_PENDING` once it expires. The brief does not record which log line or decoded `exp` claim showed this.

The 10/25 guess named the subscription. The cause was the token's own lifetime.

## Root cause

==The sidecar authenticated with one fixed `TV_TOKEN`, a JWT that expires after about 4 hours, and had no step that replaced it.== Daily bars were served without that token (Yahoo's `MNQ=F` was normal on 10/25), which is why they kept working while every intraday series stopped.

![Token refresh timeline](../../Diagrams/2026-10-26-tradingview-intraday-snapshots-stuck-pending.refresh-timeline.svg)

## Fix

| Item | Value |
| --- | --- |
| PR | #109 (claude2), merged as `162ea9a` |
| Change | the sidecar uses `TV_SESSIONID` + `TV_SESSIONID_SIGN` to fetch the TradingView `/chart/` page and take a new token from it |
| Refresh | in the background, 10 minutes before the current token expires |
| Tests | 129 Python unit tests pass |
| Deploy | `rsync` to the feed VM |

`TV_SESSIONID` and `TV_SESSIONID_SIGN` hold the TradingView login session; the names match the `sessionid` / `sessionid_sign` cookies the July case found in the browser. The token is now derived from the session instead of being set by hand.

The `pip` step of the deploy was skipped. The feed VM runs Python 3.10, and `requirements.txt` pins `pandas==3.0.6`, which needs 3.11. That has to be fixed before the next dependency is added.

Checks after the deploy:

```
/token          source: sessionid, valid, expires 2026-10-27T06:48Z
MES1! 5m        asOf 2026-10-27T02:20Z
NVDA 5m         asOf 2026-10-26T19:55Z
```

The sidecar's `/token` endpoint reports where the current token came from and when it expires, so the check needs no shell on the VM.

## Second outage on 10/29

Three days later the new K-line store stayed empty, and the trail led back to the sidecar. A K-line is one OHLC bar (open, high, low, close); the K-line store keeps those bars in Redis.

| Time (UTC) | Observed |
| --- | --- |
| 01:06:53 | last successful sidecar call from the old quote path |
| 10:55 | deploy of `524bbd7` |
| 11:00-11:28 | `MES1!` 5m still the 300-bar snapshot from 01:06; `ohlcv-series` `updatedAt` empty |
| 12:00:55 | NVDA 1d falls back to Yahoo, so the sidecar's `/history` call failed |
| 12:40 | deploy of `a8c0808` (#153); `ohlcv-series` still empty |

What the brief established:

- The sidecar's `/history` returns failures to the API.
- The data cannot show whether the failures started before the 10:55 deploy.
- A possible trigger: the deploy's cold start sends about 32 requests of 600-1000 bars each.

#153 does not fix the sidecar. It shortens the gap after the sidecar recovers:

| Change in #153 | Value |
| --- | --- |
| silent returns in the K-line store | now logged with a `reason` |
| empty result | no longer negatively cached for 1 hour |
| failed fetch | retried within 5 minutes |
| sidecar request timeout | 12 s → 20 s |

A negative cache stores the answer "no data" so the next caller does not ask again. With a one-hour negative cache, an empty answer could outlive a sidecar recovery by up to an hour.

The open check is the feed VM's log since 01:00, searched for token and history errors:

```bash
ssh <feed-vm> "sudo journalctl -u tvfeed --since '2026-10-29 01:00' | grep -E 'No data returned|ERROR|Traceback|token|n_bars' | tail -80"
```

The brief asks whether the TradingView session id itself had expired. #109 derives every new token from that session id, so an expired session would stop the refresh as well. Nobody has answered that yet, and the other eight futures roots (ES, NQ, RTY, M2K, YM, MYM, CL, GC) wait for the sidecar to recover before they are verified.

## Lessons and small tricks

- When every series on one path fails together while another path serves the same symbols, look at what the failing path shares, such as a credential, before looking at symbols or exchanges.
- A token with an `exp` needs an owner that renews it before `exp`. Keep the longer-lived credential (here the login session) and derive the short-lived token from it on a schedule, with a margin before expiry.
- Expose credential state on an endpoint. `/token` (source, validity, expiry) turned the post-deploy check into a plain request.
- A fallback that hides a failure prolongs it. The K-line store returned empty without a log line and cached the empty answer for an hour. Log a reason at every silent return, and do not negatively cache a result that may only mean "upstream is down right now".

## Related

- [[2026-07-08-tradingview-auth-token-no-longer-a-cookie]]
- [[2026-10-24-yahoo-request-budget-and-daily-bar-store]]
- [[log-placement]]
- [[JWT]] · [[TTL]] · [[SSH]] · [[PR]]
