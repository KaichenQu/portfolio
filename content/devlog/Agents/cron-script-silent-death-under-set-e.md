---
type: agent-lesson
date: 2026-07-07
tags: [shell, cron, macos]
---
# Guard best-effort pipelines in `set -e` cron scripts, and log stderr to a file

**Mistake**: a cron-driven script (`~/bin/cc-ping.sh`) "stopped triggering" for weeks. Cron was actually firing every time; the script died silently right after its first log line, and nobody noticed because stderr went to discarded cron mail.

**Root cause**: `set -euo pipefail` + command substitution. `result="$(security dump-keychain | grep ... | head -n1)"` — under cron there is no GUI security session, so `security` fails (and even when it works, `grep` with no match returns 1); with `pipefail` the whole pipeline is non-zero, the assignment fails, and `set -e` kills the script before it does anything visible.

**Rule going forward**:
- In any cron/launchd script, put `exec 2>>"$LOG"` before the first real logic so failures are never silent.
- Under `set -e`, treat every `var="$(pipeline)"` as a potential script-killer; append `|| true` to pipelines that are allowed to fail (remember: `grep` no-match is exit 1).
- Call best-effort functions as `f || log "WARN..."` — the `||` also disables `set -e` inside the function body.
- To test cron behavior, run with `env -i HOME=... PATH=<crontab PATH>`; but macOS keychain access follows the security session, not env vars, so the keychain-unreachable path needs a separate minimal repro (stub `security` with `false`).
- When a scheduled job "doesn't trigger", first check whether the scheduler fired (start marker in the log) before blaming cron.

**Source**: [[2026-07-07-cron-job-appears-untriggered-script-died-silently]] (full case, with the investigation timeline).
