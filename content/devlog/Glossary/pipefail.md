---
type: glossary
tags: [glossary, shell]
---
# pipefail

**Full name**: `set -o pipefail` (bash option)

By default a pipeline's exit code only reflects its last command. With `pipefail` on, if **any** stage of the pipeline is non-zero, the whole pipeline is non-zero. Commonly combined with `set -e` (exit on error) and `set -u` (error on unset variables) into `set -euo pipefail` as a shell script's strict mode.

Gotcha: even a "normal" case like `grep` returning 1 for no match makes the pipeline non-zero — combined with `set -e` and a command-substitution assignment (`var="$(a | b)"`), the script dies silently. Add `|| true` to any stage that's allowed to fail.

Example usage:
> The script opens with `set -euo pipefail`, but the keychain-sync pipeline needs `|| true`, or it dies every time under cron.

## Related
- [[command-substitution-failure-kills-script-under-set-e]]
- [[2026-07-07-cron-job-appears-untriggered-script-died-silently]]
