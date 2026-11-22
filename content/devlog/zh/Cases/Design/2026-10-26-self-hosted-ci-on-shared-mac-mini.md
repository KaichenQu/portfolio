---
type: case-design
date: 2026-10-26
tags: [design, infra, ci, github-actions, self-hosted-runner, orbstack, playwright]
status: wip
publish: true
---
# 把停摆的 GitHub Actions 流水线搬到共享 Mac mini

## 背景与约束

==GitHub 因为付款失败锁了账号，所有 GitHub 托管的 job 都停了。测试搬到了 Mac mini 上的 self-hosted runner；部署 job 没搬，到现在还在失败。==

**GitHub-hosted runner** 是 GitHub 按分钟出租的机器。**self-hosted runner** 是装在自己机器上的 GitHub runner 程序，它会接走所有指定它 label（runner 标签）的 job。

仓库是交易台应用 `kairotrade-desk` ，前端用 Vite，API 用 Go。它的 CI 分两个 **tier**，也就是两组有名字的测试：pull request 跑 smoke tier，push 到 `main` 跑 full tier。

账号被锁，最先表现为看不出原因的失败。2026-10-26，三个 [[zh/Glossary/PR|PR]] 和 `main` 的每次运行都这样失败：

```text
run fails in 1 to 3 seconds, zero steps executed
```

一个步骤都没执行，说明运行根本没碰到代码，原因在账号上。GitHub 给出的锁定原因：

```text
recent account payments have failed or your spending limit needs to be increased
```

10 月的用量说明了免费额度为什么用完：

| 项目 | 数值 |
| --- | --- |
| 10 月运行次数 | 305 |
| pull request 运行 | 200 次，2020 分钟 |
| push 运行 | 105 次，1908 分钟 |
| 免费额度 | 每月 2000 分钟 |
| 一次 PR 运行，smoke tier | 11 min，其中 [[zh/Glossary/Playwright\|Playwright]] 196 个测试 6.2 min |
| 一次 `main` push，full tier | 23 min，其中 Playwright 611 个测试 17.8 min |

光是 pull request 就超过了每月的额度。

硬约束：

- Mac mini 是共享的。它上面已经在 OrbStack 里给另一个仓库 `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 跑着 `ci-runner` VM；OrbStack 是 macOS 上跑轻量 Linux 虚拟机的应用。那套环境、它的隔离和脚本见 [[zh/Cases/Design/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm|2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]]。
- 所有 OrbStack VM 共用一个 24 GB 的全局内存池，整机是 48 GB。
- 计费问题本身要账号所有者去解决，这次工作结束时还没解决。

## 候选方案

迁移方案交给 Codex 做了对抗式评审，Codex 来自另一家厂商。结论是 `SHIP WITH CHANGES` ，要求四处改动。每处改动都替换了草案里的一部分。

### 方案 A：草案

- 做法：新 runner 跑在现有的 `ci-runner` VM 里；`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 的六个 runner 保持原样；所有 job 连同部署都搬到 Mac mini；用 nightly 运行顶替 `main` 上的 full tier。
- 优点：不用新建 VM；所有 job 一次搬完。
- 代价：两个仓库共用一个用户和一个 Docker daemon；内存超卖（见下文）；生产凭据放在共享机器上；`main` 上没有能用的 full tier 关卡。

草案本身没有留档；这个方案是从四处改动推翻的内容反推出来的。

### 方案 B：评审后方案

| 改动 | 内容 |
| --- | --- |
| 1 | 不共用 `ci-runner` 。新建独立 VM `kairo-ci` ，有自己的用户和自己的 Docker |
| 2 | `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 六个 runner 的历史内存峰值是 3.6、5.2、3.6、5.3、0.2 和 5.5 GB，超卖了 24 GB 的池。减到 2 个，并设上限 |
| 3 | `deploy` 、`vercel-settings` 和 `vercel` 三个 job 留在 GitHub 托管 runner 上。生产凭据不上 Mac mini |
| 4 | `main` 保留 full tier。nightly 运行最近两晚都失败了，当不了关卡 |
| 其他 | `workers` 保持 2，保留 `integration/**` 触发器，`cancel-in-progress` 只对 pull request 打开 |

`cancel-in-progress` 是 **concurrency** 设置：同一组里来了新运行，就取消还在跑的旧运行。只对 pull request 打开，push 到 `main` 的运行就不会跑到一半被取消。

## 决定

==选方案 B。测试跑在 Mac mini 上的专用 VM 里；部署留在 GitHub 托管 runner 上；`main` 保留 full tier。==

起决定作用的约束是内存和凭据。实测峰值超卖了共享的 24 GB 池，所以 runner 数量按峰值来定。部署留在 GitHub 托管 runner 上，生产凭据就不会落到 Mac mini 上。

改动 3 的代价，在之后记录的两次 `main` 运行里都看得到：deploy job 还要靠 GitHub 计费，账号修好之前会一直失败。

![验证在 Mac mini 虚拟机运行，部署留在 GitHub 托管运行器并因计费锁定而失败。](../../Diagrams/2026-10-26-self-hosted-ci-on-shared-mac-mini.lanes.svg)

## 模块划分

改动后的 Mac mini：

| 范围 | Runner 数 | CPU | 内存 |
| --- | --- | --- | --- |
| OrbStack 全局池（整机：18 核，48 GB） | 3 | 10 核 | 24 GB |
| `kairo-ci`（Ubuntu 26.04 arm64，用户 `kairo` ，runner `kairo1` ，label `kairo-mac-mini` ） | 1 | 4 | 8 GB |
| `ci-runner`（`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` ；保留 `r1` 和 `r2` ，停掉 `r3` 到 `r6` ） | 2 | 4 | 12 GB |
| Docker 基础设施（postgres、redis、mongo、mysql、团队 bot） | 0 | 2 | 3 GB |

每个 VM 是一道边界：`kairo-ci` 有自己的用户和自己的 Docker，两个仓库不再共用其中任何一样。

## 数据流

[[zh/Glossary/PR|PR]] #110（claude2 编写，合并为 `51ff5c3` ）迁移了测试 job。它在 `kairo1` 上跑了四次：

| 运行 | 提交 | 结果 | verify 耗时 | 原因 |
| --- | --- | --- | --- | --- |
| `40448801349` | `acbc0bc` | 失败 | 47 s | `setup-python` 装的解释器在测试子进程里缺 `LD_LIBRARY_PATH` |
| `40449760584` | `289d076` | 通过 | 4 min 24 s | venv 改用机器自带的 Python 3.14 |
| `40450404304` | `0f03ee6` | 失败 | 6 s | 仓库的 `.cache/go-mod` 是只读的；checkout 在不会清空的工作目录里删不掉它 |
| `40450640862` | `a3451f8` | 通过 | 4 min 37 s | Go 缓存移到 `$HOME/.cache/kairo-go` |

第二次失败来自 self-hosted runner 的特点：工作目录在两次运行之间会保留。GitHub 托管 runner 每次都从干净环境开始；`kairo1` 会留着上一次运行剩下的所有东西。第一次失败来自 `setup-python` 安装的解释器，它在这台机器的测试子进程里用不了，机器自带的 Python 可以。

## main 上的回归

==迁移后，`main` 上第一次 full tier 运行查出 11 个失败，都是 CI 被锁期间漏进来的。== 回归（regression）指原本正常的功能被新改动弄坏。

```text
618 passed, 11 failed, 5.2 min
```

原因是 PR #108。它在同一天早些时候合并，当时所有 Actions 运行都在零步骤时失败。#108 把搜索表单挪进了自选股面板，之后有两个输入框的 label 都是「股票代码」。另外，三个交易笔记测试的 fixture 对 `/api/bars` 返回了 503。

PR #111（Codex 编写，合并为 `8cbca84` ）修好了这些问题。产品上的改动是一处改名：加入自选的输入框改叫「添加自选代码」/ "Symbol to add to watchlist"。

| 检查 | 结果 |
| --- | --- |
| 本地，改动的五个测试文件 | 87 个通过 |
| 本地，full tier | 630 个通过，3 个跳过 |
| 单元测试 | 218 个通过 |
| `tsc` | 通过 |
| `kairo1` 上的 PR CI | verify 通过，212 s |
| 合并后 `main` 的 full tier，运行 `40453063622` | verify 通过，313 s；Playwright 630 个通过，用时 4.1 min；Go 覆盖率 82.3% |
| 同一运行里的 `deploy` job | 2 s 内失败（计费锁定） |

## 前后耗时

| 运行 | Runner | 耗时 |
| --- | --- | --- |
| PR，smoke tier，迁移前 | GitHub 托管 | 11 min（整次运行） |
| `main` ，full tier，迁移前 | GitHub 托管 | 23 min（整次运行）；Playwright 611 个测试 17.8 min |
| PR #111 | `kairo1` | verify 212 s |
| #111 之后的 `main` ，运行 `40453063622` | `kairo1` | verify 313 s；Playwright 630 个测试 4.1 min |
| PR #113（2026-10-27） | `kairo1` | verify 3 min 25 s |
| #113 之后的 `main` ，运行 `40475446872` | `kairo1` | verify 5 min 12 s；Playwright 639 个测试 4.1 min |

迁移前的几行是整次运行，迁移后的几行只算 verify job，两边对不齐。Playwright 那几行可以比：full tier 从 17.8 min 降到 4.1 min，测试还多了。

2026-10-27，运行 `40475446872` 的 `deploy` job 又因为计费锁定在 2 s 内失败。那次的功能只改了前端，发布的东西都不依赖这个 job。

## 不做的事（YAGNI）

YAGNI 是 You Aren't Gonna Need It，眼下用不上的就不做。

- 修 GitHub 计费。这一步归账号所有者。修好之前，生产环境的 Go API 停在 `4f579e6` ，前端用 Vercel CLI 手动部署。
- nightly 的 Playwright 步骤。它在 GitHub 上连续两晚失败；它在 `kairo1` 上的第一次运行排在下一个 03:00 UTC，在这次工作结束之后。

## 经验与技巧

- 运行 1 到 3 秒就失败、一个步骤都没执行，说明根本没跑到你的代码。先查账号和计费，再去读 workflow。
- 按实测内存峰值，对照它们共用的池，来定 runner 数量。`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 六个 runner 的峰值超卖了 24 GB 的池，最后换成了两个设了上限的 runner。
- 部署 job 和它持有的生产凭据，留在 GitHub 托管 runner 上，不要放到共享的 self-hosted 机器上。代价是要依赖托管计费；这次的表现就是 deploy 在 2 s 内失败。
- 已经在失败的关卡，顶替不了另一个关卡。nightly 已经红了两晚，所以 `main` 保留了 full tier。
- CI 停摆期间合并的代码会积压 [[zh/Glossary/regression|regression]]。CI 恢复后，第一件事就是跑 full tier；这次它从早先的同一个 PR 里查出了 11 个失败。
- self-hosted runner 会保留工作目录。工具缓存放在 `$HOME` 下，不要放在 checkout 里；优先用机器自带的解释器，不用 setup action 解压出来的那个。

## 相关

- [[zh/Cases/Design/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm|2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]]（同一台 Mac mini 上更早的 `ci-runner` VM）
- [[zh/Glossary/CI-CD|CI/CD]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/regression|regression]] · [[zh/Glossary/e2e|e2e]]
