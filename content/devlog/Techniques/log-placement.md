---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# Log placement

Adding log lines is the most basic and most effective debugging tool there is, but putting them in the wrong place is the same as not adding them at all.

## When to use
When you can't attach a debugger (production, async, concurrent, or scheduled jobs), or you want to narrow the range quickly.

## How
- Add them at boundaries: function entry/exit, before/after cross-module or cross-network calls, loop entry/exit. First confirm at which hop the data starts going wrong.
- Log values, not just "got here." Print the actual content, type, and length of the key variables. Many bugs come down to "the value isn't what you thought it was."
- Log in pairs: `before X = ...` / `after X = ...`, so you can see at a glance which step corrupted it. This is really [[binary-search-fault-localization|binary search fault localization]] in disguise.
- In async/concurrent scenarios, include an id (request id, task id) — otherwise interleaved logs make cause and effect unreadable.
- Coarse to fine: log a few major boundaries first, then add denser logging once you've narrowed it to a section.

## Why it works
==A bug's essence is usually that the actual state somewhere doesn't match the state you have in your head.== Logging puts "what you assumed" side by side with "what actually happened" — the hop where they diverge is the prime suspect.

## Caveats / counterexamples
- Remember to remove temporary log lines once you're done, or use debug level — don't pollute production logs.
- Don't scatter log lines everywhere from the start; figure out which hypothesis you're testing before you add them.

## Source cases
- [[debugging-and-design-method]]

## Related
- [[systematic-troubleshooting]]
- [[binary-search-fault-localization]]
