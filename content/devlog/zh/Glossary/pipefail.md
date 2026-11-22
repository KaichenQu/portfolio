---
type: glossary
tags: [glossary, shell]
---
# pipefail

**全称**：`set -o pipefail`（bash 选项）

默认情况下，管道的退出码只看最后一条命令。打开 `pipefail` 后，只要有**任何**一段返回非零，整条管道就返回非零。平时常跟 `set -e`（遇错退出）、`set -u`（用了未设变量报错）合写成 `set -euo pipefail`，当 shell 脚本的严格模式。

![钥匙串管道中 grep 无匹配时，末尾命令成功可能掩盖失败，启用 pipefail 后管道才返回 1。](../Diagrams/pipefail.pipeline-status.svg)

常见的坑是，连 `grep` 没匹配返回 1 这种「正常」情况，也会让管道返回非零。再叠上 `set -e` 和命令替换赋值（`var="$(a | b)"`），脚本就会静默退出。允许失败的那一段要补 `|| true`。

用例：

> 脚本开头写了 `set -euo pipefail`，同步钥匙串那条管道得加 `|| true`，不然在 cron 下每次都退出。

## 相关

- [[zh/Techniques/command-substitution-failure-kills-script-under-set-e|command-substitution-failure-kills-script-under-set-e]]
- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]
