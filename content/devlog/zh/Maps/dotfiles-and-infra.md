---
type: moc
tags: [moc, infra, chezmoi, config, shell, cron, macos, security]
---
# Dotfiles 与基础设施

41 篇笔记，是最大的专题。横跨 `Cases/`、`Techniques/`、`Agents/`、`Glossary/`。

![解释基础设施故障要分别核对生成配置、进程退出或网络证据，以及实际交付路径。](../Diagrams/dotfiles-and-infra.mechanism-groups.svg)

## chezmoi 与 dotfile 模板

- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]：用 age 加密原本明文存放的 API key。
- [[zh/Cases/Debug/2026-06-29-chezmoi-platform-template-breaks-decryption|2026-06-29-chezmoi-platform-template-breaks-decryption]]：加了平台模板后报 `decrypt: encryption not configured`。
- [[zh/Agents/config-template-overwrites-handwritten-config|config-template-overwrites-handwritten-config]]：`chezmoi init` 会用新模板重写整份配置。
- [[zh/Techniques/merge-old-config-before-templating|merge-old-config-before-templating]]：先把旧配置搬进模板。
- [[zh/Glossary/chezmoi|chezmoi]] · [[zh/Glossary/age|age]] · [[zh/Glossary/whitespace-trimming|whitespace-trimming]]

## Shell 脚本静默退出

- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]：cron 正常触发，脚本写完第一行日志就退出。
- [[zh/Agents/cron-script-silent-death-under-set-e|cron-script-silent-death-under-set-e]]：避免这类故障的规则。
- [[zh/Techniques/command-substitution-failure-kills-script-under-set-e|command-substitution-failure-kills-script-under-set-e]]：`grep` 没匹配返回 1，就足以让脚本退出。
- [[zh/Glossary/pipefail|pipefail]]

## Guard 误拦

- [[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]：按路径子串写的拒绝条件，连 bridge 自己的缓存也拦了。
- [[zh/Agents/env-file-protection-patterns-fire-on-non-secret-operations|env-file-protection-patterns-fire-on-non-secret-operations]]：文件名匹配了，也未必有读取秘密的动作。
- [[zh/Agents/widening-a-hook-matcher-revisits-every-rule|widening-a-hook-matcher-revisits-every-rule]]

## 不透明系统的排查

- [[zh/Cases/Debug/2026-07-08-tradingview-auth-token-no-longer-a-cookie|2026-07-08-tradingview-auth-token-no-longer-a-cookie]]：提取器没坏，token 已经不存成 cookie。
- [[zh/Cases/Debug/2026-10-26-tradingview-intraday-snapshots-stuck-pending|2026-10-26-tradingview-intraday-snapshots-stuck-pending]]：行情 JWT 约 4 h 到期，一直没续，盘中序列卡到 SNAPSHOT_PENDING。现在提前 10 min 通过 session id 刷新。
- [[zh/Agents/grep-anchor-vs-ls-trailing-slash|grep-anchor-vs-ls-trailing-slash]]：行尾锚定的正则会悄悄漏掉带额外格式的条目。
- [[zh/Techniques/dump-then-grep-strings-from-binaries|dump-then-grep-strings-from-binaries]]

## 云资源与 teardown

- [[zh/Cases/Debug/2026-06-19-lambda-succeeds-but-writes-no-data|2026-06-19-lambda-succeeds-but-writes-no-data]]：运行成功、表为空、触发器没配。
- [[zh/Cases/Design/2026-06-19-teardown-by-prefix-instead-of-exact-name|2026-06-19-teardown-by-prefix-instead-of-exact-name]]：按前缀删资源，部分失败留下的东西也能清掉。
- [[zh/Glossary/GC|GC]]

## 实际生效的配置

- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[zh/Agents/mcp-server-config-location|mcp-server-config-location]]
- [[zh/Agents/verify-hooks-fire-before-trusting-them|verify-hooks-fire-before-trusting-them]]

## 跨境传输与部署控制面

链路按 TCP 流限速，签名 URL 10 分钟过期，服务端 controller 发现产物任意字节和仓库对不上就拒绝继续。

- [[zh/Agents/check-signed-url-lifetime-before-designing-resume|check-signed-url-lifetime-before-designing-resume]]：提炼出的经验。
- [[zh/Glossary/SAS|SAS]] · [[zh/Glossary/ICP|ICP]] · [[zh/Glossary/OIDC|OIDC]]

## 公网 SSH 端点的背景扫描

公网 22 端口全天都有人撞字典。查已接受的登录清单可以定安全问题，容量要把 `MaxStartups` 与尝试速率对照。

- [[zh/Techniques/fail2ban-escalating-ban-formula|fail2ban-escalating-ban-formula]]：先是 1 h、1 h，之后是 2^n 小时，30 天封顶。
- [[zh/Agents/hand-over-full-state-config-not-deltas|hand-over-full-state-config-not-deltas]]：给用户发了 `sed` 增量，用户还没创建目标文件，由此提炼的经验。
- [[zh/Glossary/SSH|SSH]] · [[zh/Glossary/VPS|VPS]]

## 自托管 CI 与回退路由

- [[zh/Cases/Design/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm|2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]]：隔离的 OrbStack VM 跑 6 个自托管 GitHub Actions runner，每分钟心跳决定路由，异常时回退到云 runner。
- [[zh/Cases/Design/2026-10-26-self-hosted-ci-on-shared-mac-mini|2026-10-26-self-hosted-ci-on-shared-mac-mini]]：计费锁定后，测试转到共享 Mac mini 的专用 VM。部署及其凭据仍留在 GitHub 托管的 runner。

