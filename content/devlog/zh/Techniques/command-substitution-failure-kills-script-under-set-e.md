---
type: trick
date: 2026-07-07
tags: [shell, debug]
---
# set -e 下命令替换失败会让脚本静默退出

开了 `set -euo pipefail`，`var="$(a | b | c)"` 里任意一段返回非零，赋值就会失败，整个脚本立刻退出，不打印报错。连 `grep` 没匹配而返回 1 这种正常情况也一样。允许失败的管道在末尾加 `|| true`。允许失败的函数用 `f || <fallback>` 调用，这也会让函数体里的 `set -e` 不生效。

![启用 pipefail 时，grep 无匹配使命令替换失败，set -e 因此在赋值处退出。](../Diagrams/command-substitution-failure-kills-script-under-set-e.exit-propagation.svg)

```bash
result="$(security dump-keychain | grep -oE '...' | head -n1 || true)"
sync_creds || log "WARN: sync failed; continuing"
```

## 相关

- [[zh/Glossary/pipefail|pipefail]]
- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]
