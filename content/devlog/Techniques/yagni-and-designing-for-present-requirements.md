---
type: pattern
date: 2026-06-20
tags: [design, method]
---
# YAGNI and designing for present requirements

YAGNI = You Aren't Gonna Need It. Don't add abstractions, config options, or extension points now for something you might need later.

## When to use
When designing or writing code, any time you think "let's make this configurable/pluggable now, for future extensibility."

## How
- Solve only the requirement that actually exists right now.
- Don't force a one-off operation into a general framework.
- Don't add error handling or branches for scenarios that won't happen.
- When a second use case actually shows up, it's not too late to abstract then — and that's when you'll actually know what the right abstraction looks like.

## Why it works
An abstraction built ahead of time is based on a guess, and the odds of guessing wrong are high. ==A wrong abstraction is worse than no abstraction: it never gets used, it raises the cost of reading and changing the code, and later you're reluctant to touch it because it "looks general purpose."== Once you actually have two or three concrete use cases, the commonality becomes visible and the abstraction lands correctly.

## Caveats / counterexamples
- YAGNI isn't "don't design." The module boundaries you need ([[drawing-module-boundaries|drawing module boundaries]]) still need to be drawn. It targets speculative complexity built for imagined requirements.
- An exception applies when you're genuinely confident, the cost of changing it later is extremely high, and the extension point is certain to be needed (e.g. versioning a public-facing API).

## Source cases
- [[debugging-and-design-method]]

## Related
- [[drawing-module-boundaries]]
