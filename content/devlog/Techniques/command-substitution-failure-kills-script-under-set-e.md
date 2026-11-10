---
type: trick
date: 2026-07-07
tags: [shell, debug]
---
# Command substitution failure kills the script silently under set -e

Under `set -euo pipefail`, if any stage inside `var="$(a | b | c)"` returns non-zero — including the normal case of `grep` returning 1 on no match — the assignment fails and the whole script exits immediately, without printing any error message. Append `|| true` to a pipeline that's allowed to fail; call a function that's allowed to fail as `f || <fallback>`, which also happens to disable `set -e` inside that function's body.

```bash
result="$(security dump-keychain | grep -oE '...' | head -n1 || true)"
sync_creds || log "WARN: sync failed; continuing"
```

## Related
- [[pipefail]]
- [[2026-07-07-cron-job-appears-untriggered-script-died-silently]]
