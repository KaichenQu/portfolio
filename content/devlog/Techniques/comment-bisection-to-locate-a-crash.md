---
type: trick
date: 2026-06-20
tags: [debug]
---
# Comment-out bisection to quickly locate a crash

For a large block of code that throws somewhere you can't pinpoint, comment out the second half and run it: still crashes → the bug is in the first half; no crash → it's in the second half. Repeat on whichever half fails. Two or three rounds narrows it to a handful of lines.

The crudest but fastest application of [[binary-search-fault-localization]] — no debugger required.

## Related
- [[binary-search-fault-localization]]
