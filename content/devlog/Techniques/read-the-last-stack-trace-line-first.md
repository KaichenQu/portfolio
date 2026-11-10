---
type: trick
date: 2026-06-20
tags: [debug]
---
# Read the last line of a stack trace first, then the first

Most people glance at the first line of an error and start guessing. In practice, the bottom-most frame of the stack trace is usually where the error actually got thrown; everything above it is just the call chain. Read the last line first to find "where it was thrown," then work back up the chain to see "how execution got there."

Python gets closer to the root cause as you go down; JS gets closer to the throw site as you go up (toward the first frame). Know which order you're looking at.

## Related
- [[systematic-troubleshooting]]
- Paired with the `explain-error-k` skill (explains errors using DeepSeek)
