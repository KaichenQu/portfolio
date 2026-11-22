---
type: case-design
date: 2026-11-21
tags: [design, frontend, multi-agent, ci, playwright, css, motion]
status: solved
publish: true
---
# 委托另一组 agent 改版界面的验收关卡

`kairotrade-desk` 的网页按四级深度和动效库重做了一遍。代码全交给 Codex 的 lead 和子代理写；主控用 Claude 会话写 issue、发 brief，负责验收、合并和上线。发布提交是 `main` 上的 `a4938a7b`，线上已经跑着这个版本。

==交付时带着 248 组新旧截图、六轮自查和本地全绿的测试，里面仍然藏着五处肉眼可见的缺陷，还有两条只在 CI 平台上失败的测试。== 补漏靠三道关：主控亲自点开截图看、在 Linux 上跑全量测试、把拷进仓库的 Kit 文件逐字节核哈希。每道关拦下的问题，以及两处偏离原计划的决定，都记在下面。

![控制方打开截图、在 Linux 跑完整测试并对比随库代码哈希，发现五处视觉缺陷和两项平台相关测试失败。](../../Diagrams/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign.evidence-gates.svg)

## 背景与约束

需求只有一句话：照 ▒▒▒▒ Design 站点（Motion Kit 0.1.0，26 个动效加 2 种爆炸图）把页面重做一遍，全程只用 Codex，做完直接合并部署，不用再问。

| 项目 | 值 |
| --- | --- |
| 范围 | `web/` 全部路由，四档宽度（1440、1024、681、390），明暗两套主题 |
| 规定不动 | Go API、路由地址、功能行为、配色、字号体系 |
| Content Security Policy（只放行白名单来源脚本的响应头） | `script-src 'self' https://cdn.plaid.com`，不许加新域名 |
| PR 跑的测试 | smoke 子集，5 个 spec |
| 推 `main` 和 `integration/**` 跑的测试 | Chromium 全量，跑在自建 Linux arm64 runner 上 |
| 前端部署 | 手动跑 Vercel CLI；API 走 `main` 的 workflow 自动发 |
| 合并权限 | 执行方不合并，主控来合 |

主控和对方 lead 各用各自的 [[zh/Glossary/worktree|worktree]]（同一仓库拉出的独立工作目录），靠文件传话：brief、单行进度文件、截图目录，以及末尾带 `DEPTH-REPORT-COMPLETE` 标记的报告。后台循环一直在等这个标记出现。

## 流程

| 关卡 | 谁跑 | 查什么 | 这次拦住了什么 |
| --- | --- | --- | --- |
| 执行方本地检查 | Codex | 单元测试、类型检查、macOS 上的 Chromium 全量、推送前审查脚本 | 它自己六轮查出的问题，包括指数报价过期、弹层退场动画丢失 |
| [[zh/Glossary/PR\|PR]] 检查 | CI | smoke 子集 | 没有 |
| 改动边界 | 主控 | 对 brief 禁改路径跑 `git diff --stat` | 没有；`internal/`、`cmd/`、`scripts/`、`.github/`、`vercel.json` 和依赖清单全都没动 |
| 拷入文件校验 | 主控 | 核对 Kit 文件和上游的 SHA-256 | 没有；完全一致 |
| 截图 | 主控 | 点开 9 张 `after` 截图逐张看 | 5 处缺陷 |
| 集成分支推送 | CI | Linux 上的 Chromium 全量 | 2 条失败测试 |
| 生产环境 | 主控 | `version.json`、Kit 哈希、策略响应头、无头浏览器打开两个页面 | 没有 |

## 候选方案

### 方案 A：四个 PR

- 做法：brief 里的原计划。先合基础层，再合外壳和首页，接着交易台和研究页，最后其余页面和图解；每个 PR 控制在 400 行上下，都不超 1000 行。
- 好处：拆得够小，每份都能逐行读完。
- 代价：共用基础组件（`Motion`、`Number`、`OverlayPresence`、`routeMotion.tsx`）在业务页面开发期间还在改，第一个 PR 合进去时没法证明它是对的。

### 方案 B：一个 PR

- 做法：lead 实际交上来的。PR #290，+5773/-392，涉及 117 个文件，head 先是 `9a6d0488`，后来推到 `afe3877e`。
- 好处：基础组件和所有页面绑在一起验，截图拍一套、全量测试跑一遍就够。
- 代价：远超仓库的拆分线，5773 行没有人逐行读完。

## 决定

收下单 PR。事后再拆，等于把 248 组截图重拍一遍、全量测试再跑四轮，最后得到的还是同一棵代码树。既然没法逐行读，就换范围更窄的检查来补：

```bash
R=origin/integration/▒▒▒▒▒▒▒▒▒▒▒▒...origin/feat/depth-1-foundation
git diff --stat $R -- internal cmd src scripts .github supabase vercel.json web/package.json web/package-lock.json package.json package-lock.json
git diff -U0 $R -- tests/settings.spec.js tests/unit/pwa-worker.test.js tests/chart-studio.spec.js tests/monetization.spec.js tests/workspace-navigation.spec.js
```

第一条命令输出为空，禁改路径都没碰。第二条把老测试里的改动逐行摊开，有没有削弱断言一眼能看到。新增模块挑最大的几个整份通读，先看 `web/src/lib/routeMotion.tsx`（334 行），因为它直接换掉了路由的 history 对象。

这次破例连同理由记进了 issue。仓库里「PR 保持在 400 行上下」的规矩没改。

## 拷进仓库的 Kit

策略响应头只放行本站和单个支付域名的脚本。把设计站域名加进白名单只要改一行，但以后 Kit 每次发新版都会跳过审查直接在线上执行。干脆把 Kit 拷进 `web/public/kit/0.1.0/`，评审时核一次哈希，上线后再核一次。输出顺序跟循环一致，先 `motion.css` 后 `motion.js`：

```bash
for f in motion.css motion.js; do curl -sS "https://design.▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒.com/kit/0.1.0/$f" | shasum -a 256; done
```

```text
5930dd92e525a8f300386d9fcf86401f9944cb9b6651ac41ce8e53a58c76b48e  -
584386622ed9a1ef9e6d82ed5a72d72f5f9b88b59b51195e54cb8c0861354a45  -
```

本机 shell 套了命令包装器，查文件大小时给两个文件报了同一个字节数，那是包装器自己的输出，不作数，证据只认哈希。

## 截图

报告里写着改版做完也自查过了。主控点开 9 张 `after` 截图，挑出五处缺陷：

| 截图 | 缺陷 |
| --- | --- |
| `desk-1440-dark-after.png` | 图表工具条盖住价格轴最上面的刻度 |
| `desk-1440-dark-after.png` | 涨跌幅数字离价格差了约 170 px |
| `home-1440-light-after.png` | 四块指数卡里一块白底、三块灰底 |
| `plans-dialog-1440-light-after.png` | 套餐卡片没内边距，图解把价格挤到下面 |
| `login-1440-dark-after.png` | 爆炸图默认收着 |

这五处全过了自动检查。测试只断言执行方自己想到的几何规则，这几个问题没写进去。第二份 brief 只列了文件名和这五处缺陷，没写别的。新起的 lead 花了约 40 分钟、推了 11 个提交修完，合并前主控把同样几张图重新点开看了一遍。

## Linux 全量测试

#290 和发布 PR 自己的检查全绿，一推集成分支就红了：

```text
44976906277  pull_request  success  a5b9812f
44976896498  push          failure  a5b9812f

1) [chromium] › tests/motion-kit.spec.js:54:1 › late body portal receives kit initialization once
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 1
    Received: 0
```

Codex 子代理查完这两条失败，就在同一台 Mac 上用 [[zh/Glossary/Playwright|Playwright]] 的 Linux arm64 容器复现出来。问题全出在测试自己的假设不成立：

| 测试 | 假设 | 事实 |
| --- | --- | --- |
| `late body portal receives kit initialization once` | `#root` 非空就是 React 挂好了 | `web/src/main.tsx:52` 在 `initializeSupabase()` 返回前先往 `#root` 写占位内容，Kit 绑在 `body` 上的观察器要到真正挂载时才装上 |
| `strategy tilt and spotlight reset on live touch and unmount` | 用 DevTools 协议关掉触屏模拟就能恢复精细指针 | Linux 无头 Chromium 关掉后变成 `hover: none`、`pointer: none`，测试等的 `change` 事件不会触发；macOS 才会回到 `hover: hover`、`pointer: fine` |

提交 `50379810` 修掉了这两条，只动了 `tests/motion-kit.spec.js`，加 13 行、删 7 行。portal 那条改等应用自带的预览辅助函数；tilt 那条用 `page.addInitScript` 把 hover 和 pointer 查询映射到 `prefers-contrast`，再用 `page.emulateMedia` 切换，跨平台都能触发真实的 `MediaQueryList` 事件。断言一条没删。

| 运行 | 平台 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 44976896498 | Linux arm64，集成分支首次推送 | 1196 | 2 | 3 |
| 44979169479 | Linux arm64，`50379810` 之后 | 1198 | 0 | 3 |
| 本地 | macOS | 1198 | 0 | 3 |

动手前基线本来就是红的：集成分支一行没改，就挂在依赖日期的 `tests/ticker-tape.spec.js:332` 上。修法是把 fixture 日期锁死，随 #290 一起合进来；后面所有结果都对照这条基线看（[[zh/Techniques/baseline-diff-verification-on-a-red-baseline|基线比对验证]]）。

## 走过的弯路

### 规则文件里的旧模型 id

执行方的规则文件里给模型带上了版本号，启动时直接用了里面的 id。跑了 17 分钟，owner 问起来为什么 lead 没用新版；一查本机安装自带的清单里其实有：

```bash
jq -r '.models[] | select(.visibility=="list") | .slug' ~/.codex/models_cache.json
```

后来规则里只写代号，具体 id 启动时现从这个文件取（[[zh/Techniques/config-on-disk-is-not-config-in-effect|写在磁盘上的配置不等于生效的配置]]）。

### 会改默认值的选择器

用 `/model` 选择器给跑着的 lead 换模型，同时也把 `~/.codex/config.toml` 的全局默认值改写了，这台机器之后的每个会话本来都会继承它，那一行手动改了回去。这步还有第二个坑：发 `/model` 时带了自动回车，直接确认了列表第一项，持续了一轮。

### 比代码更严的验收标准

issue 原话要求新增动效只能改 translate、scale、rotate、opacity 和 clip-path。实际有两处悬停（热力图板块、扫描表的行）过渡的是颜色，用的是项目现成的 token。变色不触发布局变化，老控件本来也这么写，于是在 issue 里把条款改了措辞并补上原因，没有按旧原文直接打勾。

## 范围之外（YAGNI）

- 策略列表重排后按策略标识恢复焦点（`routeMotion.tsx` 现在按位置恢复）。真有人反馈焦点跑偏再做。
- 兑换弹窗里 `motion.js` 加载成功、`motion.css` 却失败的情况。留到下次改这个弹窗或离线缓存时一起做。
- 换掉 `UNSAFE_createBrowserHistory`。升级路由库之前跑一遍全量浏览器测试就够，眼下不重写。

## 经验与小技巧

- 执行方的通过数只说明它自己的检查跑过，五处肉眼可见的缺陷照样全漏过去。合代码前主控得自己抽几张截图点开看（[[zh/Agents/review-delegated-visual-work-by-opening-the-screenshots|验收委托的界面改动要打开截图]]）。
- 模拟触屏或指针能力的测试，可能在 macOS 上通过、在 Linux 无头浏览器上失败，非得在 CI 平台上跑过才算完（[[zh/Agents/pointer-media-after-touch-emulation-differs-on-linux-headless|关掉触屏模拟后的指针媒体查询因平台而异]]）。
- 这个仓库的 PR 检查和推送检查跑的不是同一档测试。PR 状态全绿也没用，发布得等集成分支的推送跑完。
- 跟计划不一样的地方，当天写到计划所在的地方，并附上原因。
- 第二轮返工就靠简短 brief：文件名加固定缺陷清单。修完只花了约 40 分钟，第一轮从启动到过 PR 检查花了约四个半小时。

## 相关笔记

- [[zh/Cases/Design/2026-10-26-self-hosted-ci-on-shared-mac-mini|把停摆的 GitHub Actions 流水线搬到共享 Mac mini]]
- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Glossary/CI-CD|CI-CD]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/worktree|worktree]]
