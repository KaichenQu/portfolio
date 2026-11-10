---
type: case-design
date: 2026-10-24
tags: [design, backend, frontend, cache, redis, rate-limit]
status: wip
---
# Yahoo request budget and the daily-bar store

KairoTrade's server calls Yahoo for sparklines and daily bars. Over four sessions, from 10/24 to 10/30, three changes put a ceiling on how often the server calls it:

1. **Batched intraday requests.** Server calls to Yahoo for intraday sparklines fell from about 21,600 a day (the first draft of #80) to about 1,250 a weekday.
2. **A daily-bar library in Redis.** 180 symbols with about 370 days each, filled once and then topped up once per weekday.
3. **A cache key convention for public data.** `public:<kind>:v<n>:<id>`, so every user's request for the same public data reads one shared entry.

==The budget comes from moving each upstream call into a scheduled job, and having pages read what the server already holds.== The last step, on 10/30, moved research quotes onto the store as well (#204).

Third-party sources were checked against their terms along the way. StockTwits was used only as a rendering reference; no data was taken from it.

## Background and constraints

- A sparkline is the small price line next to a symbol in a list. Here it is drawn from Yahoo's spark endpoint, 15-minute or 5-minute closes for one day.
- Yahoo answers too many requests with HTTP 429 (Too Many Requests). That is its rate limit, the cap on requests per unit of time. The scheduler and the backfill below both back off on a 429.
- Futures (`MES`, `MNQ`) do not use Yahoo for live data. They come from the TradingView feed over SSE (server-sent events, a one-way HTTP stream of updates), with a `LIVE_BACKOFF` backoff.
- Some candidate data sources forbid automated access in their terms. That limits what can be fetched at all, before any question of volume.

The briefs record before-and-after states, not option lists written down in advance. The sections below follow them in time order, with the numbers each one gives.

## 10/24: request budget for intraday sparklines

Release [[PR]] #85 (`integration/ticker-1` → main, `1965311`) shipped six PRs. Three of them set the budget:

| PR | Change |
| --- | --- |
| #80 | the scheduler sets a period per source; spark `1d`/`15m`; 20 symbols per batch; at most 3 Yahoo requests per slot; a 429 stops the current slot; intraday sources go first in the queue |
| #84 | in the 15-minute off-hours slots, a rate-limit mark is kept for the whole slot |
| #81 | the browser's watchlist, ticker tape and table share one `useIntradaySparks` store, which makes one batch request every 150 s |

The numbers:

| Path | Before | After |
| --- | --- | --- |
| server → Yahoo | first draft of #80: 1 request per symbol per slot, 52 symbols, ≈ 21,600/day | at most 3 requests per slot, ≈ 1,250/day on weekdays |
| browser → server | watchlist, ticker tape and table each fetch on their own | one batch `/api/spark` every 150 s; the quote snapshot is no longer polled |
| futures | — | `MES`/`MNQ` over TradingView SSE with `LIVE_BACKOFF` |

The slot schedule explains both counts. From 04:00 to 20:00 ET (extended hours) a slot runs every 2.5 minutes, and outside that window every 15 minutes. That is 384 + 32 = 416 slots a day. This arithmetic is derived from the schedule, not quoted from a brief:

```
before:  52 symbols × 1 request  × 416 slots ≈ 21,600 requests/day
after:   ⌈52 / 20⌉ = 3 batches   × 416 slots ≈  1,250 requests/day
```

The 2.5-minute period matches a read-only probe of StockTwits, which measured how its sparklines refresh: its batch endpoint caches for about 2.5 minutes. The site copied the rendering (a `polyline` in an `svg` with `viewBox 0 0 W 32`, stroke 1.33) and that refresh rate, not the data.

![Request flow](../../Diagrams/2026-10-24-yahoo-request-budget-and-daily-bar-store.request-flow.svg)

### Source terms

The same session read the terms of every third-party source in use or under consideration:

| Source | Terms | Outcome |
| --- | --- | --- |
| StockTwits | §5 forbids automated scraping without written permission or an approved API; the API docs page returns 404 | no data taken; rendering reference only |
| Quiver | §8 forbids robot access; §6 limits Quiver Data to personal, non-commercial use, no redistribution; commercial use needs a paid tier | the existing disclosure scraping conflicts with this; left to the owner |
| Rallies | the page is JS-rendered; #30 recorded that robots.txt disallows `/api/` and the terms forbid crawling | only an official keyed API would be allowed |
| ai4trade | every path returns the same [[SPA]] shell; no terms | no licence, not enabled |

On 10/29, #143 removed the Rallies data source and its model ranking.

## 10/25: spark fixes and the daily-bar library

Three fixes to the sparkline path went straight to main:

| PR | Change |
| --- | --- |
| #87 | removed `includePrePost`: Yahoo's spark endpoint returns 400 for it, and the `1d` snapshot had been empty for 13 hours |
| #90 | the default intraday list is 22 symbols (6 index ETFs, 11 sector ETFs, 4 futures, NVDA), which is 2 requests per slot |
| #95 | 5-minute bars, 78 points a day; sparkline drawn at 64×24 real pixels, line width 1.25, no stretching |

22 symbols in batches of 20 is two batches, hence two requests per slot.

The daily-bar library (issue #92, PR #94, shipped in release PR #97) replaced refetching two years of history every 12 hours:

| Item | Value |
| --- | --- |
| Symbols | 180: 161 from `companyLogos.ts` plus the 22 home-page symbols, deduplicated |
| Storage | Redis, column arrays, about 370 days per symbol |
| [[TTL]] | 400 days |
| Size | about 12 KB per symbol, 2-3 MB in total |
| Backfill | `range=1y`, 2 s between requests, split across minute ticks; a 429 pauses for 15 minutes |
| Daily update | weekdays at 20:30 ET, `range=5d`, merged by date |
| Check after deploy | 10 minutes later: AAPL and MSFT 250 bars each, last bar 2026-10-23 |

A TTL (time to live) is how long a stored entry lives before Redis deletes it.

Yahoo requests per day for daily bars:

| Scheme | Requests |
| --- | --- |
| old: every 12 hours, each symbol, 2 years of history | ≈ 60/day |
| new: backfill | 180, once |
| new: afterwards | 180 per weekday, plus 2 per intraday slot |

The new scheme makes more daily-bar requests per day than the old one, but it covers 180 symbols, and each request fetches 5 days instead of 2 years.

## 10/29: K-line store

#139 (Codex, two rounds; the review's nine yellow items were all fixed) added the K-line store. A K-line is one candlestick bar: open, high, low, close (OHLC).

| Item | Value |
| --- | --- |
| Futures | `MES1!`, `MNQ1!`, `MGC1!`, `MCL1!`; 5m, 15m, 1h and 1d; 600 bars each |
| Daily | 235 symbols plus watchlists |
| Key prefix | `ohlcv:v1:` |
| Series cap | 48 |
| Active set | about 6.5 MB, under the 128 MB Redis limit |

The store fills from the TradingView sidecar's `/history` endpoint. When that call fails, a daily series falls back to Yahoo. On the day it shipped, the sidecar's `/history` was failing, and the store stayed empty; that outage is in [[2026-10-26-tradingview-intraday-snapshots-stuck-pending]].

#153 followed up:

- every silent return now logs a `reason`;
- an empty result is no longer negatively cached for 1 hour (a negative cache stores "no data" so the next caller does not ask again);
- a failed fetch is retried within 5 minutes;
- the sidecar request timeout went from 12 s to 20 s.

## 10/30: public data cache

Issue #196 moved shared market data behind one key convention:

```
public:<kind>:v<n>:<id>
```

That key is shared by every user. A private key carries a hash of the user instead.

A cache key is the name an entry is stored under. Two requests that build the same key read the same entry. The version segment `v<n>` lets a format change start fresh entries instead of misreading old ones.

| PR | Change | Changed after review |
| --- | --- | --- |
| #201 | intraday signal chunks shared; keys kept 7 days | context anchored to the session (306 bars plus the current day); an early close is charged once |
| #202 | long daily snapshot kept 7 days, latest data merged in | a refreshed snapshot may correct history; only a 404 is negatively cached |
| #203 | `data-sources` cached 60 s; registry deduplicated; macro sends only missing items | an evicted registration can be restored; an invalid verdict is retried after 1 hour |
| #204 | research quotes read from the store; Finnhub auth failures back off from 1 hour to 24 hours | a stale intraday snapshot is marked stale; a 12-row watchlist hitting 429 makes 1 call instead of 36 |
| #207 | key helper functions and a static test | the test rejects empty keys, hand-written private keys, and caching on arbitrary field names |
| #208 | Redis statistics and prompt-hash logs | none |

Cross-review: Codex reviewed #202 and #203; claude2 reviewed #201, #204 and #207.

Two rules came with it:

- **A public path reads the store, and a miss does not call the upstream.**
- **Private data never goes under a public key.** The audit found none, and logs carry neither prompt text nor user ids.

The live hit rate was not measured.

## Candidate options

The before-and-after pairs the briefs record:

| Question | Before | After | What decided it |
| --- | --- | --- | --- |
| how the server asks Yahoo for sparklines | one request per symbol per slot | batches of 20, at most 3 per slot | ≈ 21,600 vs ≈ 1,250 requests/day |
| how the browser gets sparklines | each component fetches | one shared store, one batch every 150 s | one batch request every 150 s serves all three components |
| where daily history comes from | each symbol refetched every 12 hours, 2 years | a Redis library, backfilled once, `range=5d` each weekday | 180 symbols covered; each update fetches 5 days |
| which third-party data to take | — | only sources whose terms allow it | StockTwits, Quiver, Rallies and ai4trade terms |
| how shared data is cached | — | `public:<kind>:v<n>:<id>`, checked by a static test | one entry per public datum; no private data in shared keys |

## Decision

The ceiling on Yahoo traffic is set by the schedule and the batch size, not by how many people are looking. A page view reads the shared sparkline batch, the Redis library or a `public:` key. The scheduler, the daily-bar job and the backfill make the Yahoo calls, and they back off on a 429.

## Module breakdown

| Unit | Responsibility |
| --- | --- |
| slot scheduler (#80, #84) | one period per source; batches of 20; at most 3 requests per slot; stops on 429 |
| `useIntradaySparks` (#81) | shared browser store; one batch `/api/spark` every 150 s |
| daily-bar library (#94) | 180 symbols in Redis; backfill and weekday update from Yahoo |
| K-line store (#139, #153) | futures and daily OHLC under `ohlcv:v1:`; fills from the sidecar's `/history` |
| key helpers and static test (#207) | build `public:` and private keys; reject hand-written ones |

## Data flow

1. The scheduler wakes on its slot, groups the symbol list into batches of 20, and makes at most 3 Yahoo requests.
2. The server keeps the latest batch.
3. Every 150 s each open page makes one `/api/spark` request and reads that batch.
4. Daily bars come from the Redis library, which the daily-bar job updates at 20:30 ET on weekdays.
5. Shared data that is not a sparkline sits under a `public:` key; a miss does not call the upstream.

## Out of scope (YAGNI)

- The spark registry of 50 entries is shared across ranges. `1d` gets its own table only if the home page crowds it out.
- The 2.5-minute window was not narrowed to 09:30-16:00 ET.
- The full S&P 500 was not added to the daily library.
- The quote endpoint has no volume or day high/low, so the home table has five columns.
- Whether to prewarm the long daily snapshot (about 400 × 130 KB) is undecided.
- Public response cache headers and polling frequency (F7 of #196) are not done.
- Redis persistence and eviction on the host are unconfirmed; the check is `redis-cli CONFIG GET save`.

See [[yagni-and-designing-for-present-requirements]].

## Lessons and small tricks

- State the request budget as arithmetic: symbols, batch size, slots per day. The 21,600 figure was visible as soon as the first draft of #80 was multiplied out.
- Let a scheduler own every upstream call, and let pages read only what it stored. Traffic to the upstream then depends on the schedule, not on the number of viewers.
- Read the terms of a data source before writing its scraper. Three of the four sources here forbid automated access in their terms.
- Negative caching needs a narrow trigger. #202 caches only a 404, and #153 stopped caching empty results, because an empty answer may only mean the upstream is down.
- Put a version in every cache key (`v<n>`), so a format change writes new entries instead of misreading old ones.

## Related

- [[2026-10-26-tradingview-intraday-snapshots-stuck-pending]]
- [[2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[yagni-and-designing-for-present-requirements]]
- [[TTL]] · [[SPA]] · [[PR]]
