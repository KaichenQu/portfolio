---
type: glossary
tags: [glossary, shell]
---
# pipefail

**全称**：`set -o pipefail`（bash 选项）

默认情况下，管道退出码只反映最后一条命令。启用 `pipefail` 后，**任何**一段返回非零，整个管道就返回非零。经常把它和 `set -e`（遇错退出）、`set -u`（使用未设置的变量时报错）合成 `set -euo pipefail`，用作 shell 脚本的严格模式。

![钥匙串管道中 grep 无匹配时，末尾命令成功可能掩盖失败，启用 pipefail 后管道才返回 1。](../Diagrams/pipefail.pipeline-status.svg)

容易踩坑的是，就连 `grep` 没匹配返回 1 这种「正常」情况，也会让管道返回非零。再叠加 `set -e` 和命令替换赋值（`var="$(a | b)"`），脚本就会静默退出。允许失败的阶段要加 `|| true`。

用例：

> 脚本开头是 `set -euo pipefail`，同步钥匙串的管道得加 `|| true`，否则在 cron 下每次都退出。

## 相关

- [[zh/Techniques/command-substitution-failure-kills-script-under-set-e|command-substitution-failure-kills-script-under-set-e]]
- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]
