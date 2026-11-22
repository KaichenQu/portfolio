---
type: trick
date: 2026-06-20
tags: [debug]
---
# Reproduce before fixing, verify with the same steps after

Before touching any code, confirm you can reliably trigger the bug ([[repro]]). After the fix, run through the exact same steps again to confirm it went from broken to working.

![Run the same reproduction before and after the fix so the observed change can be attributed to the fix.](../Diagrams/reproduce-before-fixing-verify-after.same-steps.svg)

Skip this and you don't actually know whether you fixed it, or it was just intermittent to begin with. This step is not optional.

## Related
- [[systematic-troubleshooting]]
- [[repro]]
