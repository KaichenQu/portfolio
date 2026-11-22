---
type: trick
date: 2026-07-07
tags: [shell, debug]
---
# set -e 下命令替换失败会让脚本静默退出

开了 `set -euo pipefail`，`var="$(a | b | c)"` 里只要有一段返回非零，赋值就失败，脚本直接退出且不打报错，哪怕只是 `grep` 没匹配而返回 1 这种正常情况。允许失败的管道在末尾加 `|| true`；允许失败的函数写成 `f || <fallback>`，这样同时会关掉函数体里的 `set -e`。

![启用 pipefail 时，grep 无匹配使命令替换失败，set -e 因此在赋值处退出。](../Diagrams/command-substitution-failure-kills-script-under-set-e.exit-propagation.svg)

```bash
result="$(security dump-keychain | grep -oE '...' | head -n1 || true)"
sync_creds || log "WARN: sync failed; continuing"
```

## 相关

- [[zh/Glossary/pipefail|pipefail]]
- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]
