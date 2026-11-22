---
type: case-design
date: 2026-10-26
tags: [design, infra, ci, github-actions, self-hosted-runner, orbstack, playwright]
status: wip
publish: true
---
# 把停摆的 GitHub Actions 流水线搬到共享 Mac mini

## 背景与约束

==GitHub 因付款失败锁了账号，所有 GitHub 托管 job 全停。测试搬到了 Mac mini 的 self-hosted runner，部署 job 没搬，到现在还在失败。==

**GitHub-hosted runner** 是 GitHub 按分钟出租的机器；**self-hosted runner** 是装在自己机器上的 GitHub runner 程序，专门接标了它 label（runner 标签）的 job。

仓库是交易台应用 `kairotrade-desk`，前端 Vite、API Go。CI 分两个 **tier**（两组命名的测试集）：pull request 跑 smoke tier，推 `main` 跑 full tier。

账号被锁，最先表现为看不出原因的失败。2026-10-26，三个 [[zh/Glossary/PR|PR]] 和 `main` 的每次运行都这么挂：

```text
run fails in 1 to 3 seconds, zero steps executed
```

一步都没跑，说明根本没碰到代码，毛病在账号上。GitHub 给的锁定提示：

```text
recent account payments have failed or your spending limit needs to be increased
```

10 月用量解释了免费额度怎么烧完的：

| 项目 | 数值 |
| --- | --- |
| 10 月运行次数 | 305 |
| pull request 运行 | 200 次，2020 分钟 |
| push 运行 | 105 次，1908 分钟 |
| 免费额度 | 每月 2000 分钟 |
| 一次 PR 运行，smoke tier | 11 min，其中 [[zh/Glossary/Playwright\|Playwright]] 196 个测试 6.2 min |
| 一次 `main` push，full tier | 23 min，其中 Playwright 611 个测试 17.8 min |

光是 pull request 就用超了每月的免费额度。

硬约束：

- Mac mini 是共享机器，上面已经在 OrbStack（macOS 上跑轻量 Linux 虚拟机的应用）里替另一个仓库 `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 跑着 `ci-runner` VM。那套环境的隔离和脚本见 [[zh/Cases/Design/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm|2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]]。
- 所有 OrbStack VM 共分 24 GB 全局内存池，整机 48 GB。
- 计费问题归账号所有者处理，这次收尾时还没解。

## 候选方案

迁移方案交给另一家厂商的 Codex 做对抗式评审，结论是 `SHIP WITH CHANGES`，提了四处改动，每处都改掉了草案里的做法。

### 方案 A：草案

- 做法：新 runner 直接放进现有 `ci-runner` VM；`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 六个 runner 不动；连同部署在内的所有 job 全搬 Mac mini；拿 nightly 运行顶替 `main` 的 full tier。
- 优点：不用新开 VM，所有 job 一次搬齐。
- 代价：两个仓库共用同一个用户和 Docker daemon；内存超卖（见下文）；生产凭据落到共享机器上；`main` 没了靠谱的 full tier 关卡。

草案原稿没留，这是按四处改动反推出来的。

### 方案 B：评审后方案

| 改动 | 内容 |
| --- | --- |
| 1 | 不共用 `ci-runner`，新开独立 VM `kairo-ci`，配独立用户和独立 Docker |
| 2 | `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 六个 runner 历史内存峰值 3.6、5.2、3.6、5.3、0.2、5.5 GB，超卖了 24 GB 池；砍到 2 个并设上限 |
| 3 | `deploy`、`vercel-settings` 和 `vercel` 留在 GitHub 托管 runner，生产凭据不上 Mac mini |
| 4 | `main` 保留 full tier；nightly 连挂两晚，当不了关卡 |
| 其他 | `workers` 保持 2，留着 `integration/**` 触发器，`cancel-in-progress` 只对 pull request 开 |

`cancel-in-progress` 是 **concurrency** 配置：同组来了新运行就取消正在跑的旧运行。只对 pull request 开，推 `main` 的运行就不会跑到一半被取消。

## 决定

==选方案 B：测试跑在 Mac mini 专用 VM，部署留 GitHub 托管 runner，`main` 保留 full tier。==

拍板看两点：内存和凭据。实测峰值超卖了 24 GB 共享池，runner 数必须按峰值定；部署留托管 runner，生产凭据就不必放上 Mac mini。

改动 3 的代价在随后两次 `main` 运行里都看得到：deploy job 依然依赖 GitHub 计费，账号修好前会一直失败。

![验证在 Mac mini 虚拟机运行，部署留在 GitHub 托管运行器并因计费锁定而失败。](../../Diagrams/2026-10-26-self-hosted-ci-on-shared-mac-mini.lanes.svg)

## 模块划分

改完后的 Mac mini：

| 范围 | Runner 数 | CPU | 内存 |
| --- | --- | --- | --- |
| OrbStack 全局池（整机：18 核，48 GB） | 3 | 10 核 | 24 GB |
| `kairo-ci`（Ubuntu 26.04 arm64，用户 `kairo`，runner `kairo1`，label `kairo-mac-mini`） | 1 | 4 | 8 GB |
| `ci-runner`（`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`；留 `r1`、`r2`，停 `r3` 到 `r6`） | 2 | 4 | 12 GB |
| Docker 基础设施（postgres、redis、mongo、mysql、团队 bot） | 0 | 2 | 3 GB |

每个 VM 是一道边界：`kairo-ci` 有自己的用户和 Docker，两个仓库两边都不共用。

## 数据流

[[zh/Glossary/PR|PR]] #110（claude2 写，合并为 `51ff5c3`）迁了测试 job，在 `kairo1` 上跑了四次才顺：

| 运行 | 提交 | 结果 | verify 耗时 | 原因 |
| --- | --- | --- | --- | --- |
| `40448801349` | `acbc0bc` | 失败 | 47 s | `setup-python` 装的解释器在测试子进程里缺 `LD_LIBRARY_PATH` |
| `40449760584` | `289d076` | 通过 | 4 min 24 s | venv 改用机器自带 Python 3.14 |
| `40450404304` | `0f03ee6` | 失败 | 6 s | 仓库 `.cache/go-mod` 只读，checkout 在保留的工作目录里删不掉它 |
| `40450640862` | `a3451f8` | 通过 | 4 min 37 s | Go 缓存迁到 `$HOME/.cache/kairo-go` |

第二次失败踩的是 self-hosted runner 的特性：工作目录跨次保留。GitHub 托管 runner 每次从空白开始，`kairo1` 会留着上次跑完的所有残留。第一次失败出在 `setup-python` 装的解释器在测试子进程里跑不起来，换机器自带 Python 就正常。

## main 上的回归

==迁完后，`main` 第一次跑 full tier 就查出 11 个失败，全是 CI 锁住期间合进来的。== 回归（regression）指新改动把原本正常的功能弄坏了。

```text
618 passed, 11 failed, 5.2 min
```

源头是 PR #108。它当天早些时候合并，当时所有 Actions 运行在零步骤就失败。#108 把搜索表单挪进了自选股面板，结果页面上有两个输入框的 label 都叫「股票代码」。另外，三条交易笔记测试的 fixture 对 `/api/bars` 返回了 503。

PR #111（Codex 写，合并为 `8cbca84`）修了这两处。产品改动只是一处改名：加入自选的输入框改叫「添加自选代码」/ "Symbol to add to watchlist"。

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
| `main`，full tier，迁移前 | GitHub 托管 | 23 min（整次运行）；Playwright 611 个测试 17.8 min |
| PR #111 | `kairo1` | verify 212 s |
| #111 之后的 `main`，运行 `40453063622` | `kairo1` | verify 313 s；Playwright 630 个测试 4.1 min |
| PR #113（2026-10-27） | `kairo1` | verify 3 min 25 s |
| #113 之后的 `main`，运行 `40475446872` | `kairo1` | verify 5 min 12 s；Playwright 639 个测试 4.1 min |

迁移前记的是整次运行，迁移后只记 verify job，两边不完全对齐。Playwright 这一项可以直接比：full tier 从 17.8 min 降到 4.1 min，测试还变多了。

2026-10-27 运行 `40475446872` 的 `deploy` job 照旧因为计费锁定在 2 s 内失败。那次只改前端，发版不靠这个 job。

## 不做的事（YAGNI）

YAGNI 是 You Aren't Gonna Need It，眼下用不上的就不做。

- 修 GitHub 计费：归账号所有者。修好前，生产 Go API 停在 `4f579e6`，前端用 Vercel CLI 手动发。
- nightly 的 Playwright 步骤：在 GitHub 上连挂两晚，它在 `kairo1` 上首跑排在下个 03:00 UTC，在这次收尾之后。

## 经验与技巧

- 跑 1 到 3 秒就挂、一步都没执行，说明根本没跑到代码，先查账号和计费再读 workflow。
- 按实测内存峰值对照共享池定 runner 数量。`▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` 六个 runner 峰值超卖了 24 GB 池，最后缩成两个带上限的 runner。
- 部署 job 连同生产凭据留在 GitHub 托管 runner，别放到共享 self-hosted 机器上。代价是继续依赖托管计费，这次表现为 deploy 在 2 s 内失败。
- 本身就在挂的关卡顶替不了别的关卡。nightly 连红两晚，所以 `main` 必须留住 full tier。
- CI 停摆期合进来的代码会攒出 [[zh/Glossary/regression|regression]]。CI 一恢复头一件事就是跑 full tier，这次从早先同一个 PR 里扫出 11 个失败。
- self-hosted runner 跨次保留工作目录：工具缓存放 `$HOME` 下别放 checkout 里，优先用机器自带解释器，少用 setup action 现解压的那套。

## 相关

- [[zh/Cases/Design/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm|2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]]（同一台 Mac mini 上更早的 `ci-runner` VM）
- [[zh/Glossary/CI-CD|CI/CD]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/regression|regression]] · [[zh/Glossary/e2e|e2e]]
