---
type: pattern
date: 2026-06-20
tags: [debug, method]
---
# Systematic troubleshooting

The most common mistake when troubleshooting a bug is changing things by gut feel — you make a bunch of edits, the bug isn't fixed, and you don't even know which change did what. The approach below is more reliable.

## When to use
Any bug, test failure, or behavior that doesn't match expectations. The more a bug "looks simple," the more this process matters, because the assumption you're taking for granted is usually exactly where the problem is.

## How

1. Get a stable repro ([[repro]]) first. If you can't reproduce it, fix that first — otherwise you can't verify any fix.
2. Read the full error, not just the first line. The real cause is often in the middle or at the end of the stack trace.
3. Write the problem down in one sentence: what you expected, what actually happened, and where they diverge.
4. Form a specific hypothesis (not something vague like "maybe it's an environment issue").
5. Design the smallest observation that could falsify the hypothesis: add a log line, run a command, comment out a section.
6. Run it and look at the result. If the hypothesis holds, drill further; if it's falsified, form a new one.
7. Change exactly one variable at a time. Change several things at once and even a fix leaves you not knowing which change actually did it.
8. Find the root cause before you fix it. Don't stop at "the symptom went away" — it may just be masked.

## Why it works
This is binary search at its core: every step halves the range of where the problem could be. ==The key is that every step needs a clear, falsifiable hypothesis, not a random guess.== **Keep "what I've verified as fact" separate from "what I'm guessing," and only build forward on the facts.**

## Caveats / counterexamples
- Don't "fix" anything before you have a repro. You won't know whether the fix worked.
- Don't change five places at once.
- Intuition is fine for picking a direction, but every intuition needs to be checked with an observation — don't just trust it outright.

## Source cases
- [[debugging-and-design-method]]

## Related
- [[binary-search-fault-localization]]
- [[log-placement]]
- [[RCA]]
