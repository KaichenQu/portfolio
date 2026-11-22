---
type: case-design
date: 2026-11-21
tags: [design, frontend, multi-agent, ci, playwright, css, motion]
status: solved
publish: true
---
# 外包给另一组 agent 的界面改版：验收关卡

`kairotrade-desk` 的网页按四级深度和动效库重做了一遍。代码全部由 Codex 的 lead 和它的子代理写；主控是 Claude 会话，负责写 issue 和 brief、验收、合并、部署。发布提交是 `main` 上的 `a4938a7b`，生产环境已经是这个版本。

==对方交付时带着 248 组新旧截图、六轮自查和本地全绿的测试，里面仍然有五处肉眼可见的缺陷，还有两条只在 CI 平台上失败的测试。== 对方自己的检查漏掉的东西，靠三道关卡拦下：主控亲自打开截图、Linux 上的全量测试、拷进仓库的 Kit 文件逐字节比对。这篇记录每道关卡拦下了什么，以及两处和原计划不一样的决定。

![控制方打开截图、在 Linux 跑完整测试并对比随库代码哈希，发现五处视觉缺陷和两项平台相关测试失败。](../../Diagrams/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign.evidence-gates.svg)

## 背景与约束

需求只有一句话：照 ▒▒▒▒ Design 站点（Motion Kit 0.1.0，26 个动效加 2 种爆炸图）重做页面，只用 Codex，做完直接合并部署，不用再问。

| 项目 | 值 |
| --- | --- |
| 范围 | `web/` 的全部路由，四档宽度（1440、1024、681、390），明暗两套主题 |
| 规定不动 | Go API、路由地址、功能行为、配色、字号体系 |
| Content Security Policy（浏览器只执行白名单来源脚本的响应头） | `script-src 'self' https://cdn.plaid.com`，不许加新域名 |
| PR 上跑的测试 | smoke 子集，5 个 spec |
| 推送到 `main` 和 `integration/**` 跑的测试 | Chromium 全量，跑在自建的 Linux arm64 runner 上 |
| 前端部署 | 手动跑 Vercel CLI；API 由 `main` 的 workflow 部署 |
| 合并权限 | 执行方不合并，只有主控合并 |

主控和对方的 lead 各在自己的 [[zh/Glossary/worktree|worktree]]（同一个仓库的另一份检出）里干活，靠文件沟通：brief、只有一行的进度文件、以标记字符串（`DEPTH-REPORT-COMPLETE`）结尾的报告、截图目录。主控起后台循环等这个标记出现。

## 流程

| 关卡 | 谁来跑 | 查什么 | 这次拦下了什么 |
| --- | --- | --- | --- |
| 执行方本地检查 | Codex | 单元测试、类型检查、macOS 上的 Chromium 全量、推送前审查脚本 | 它自己六轮查出的问题，包括指数报价过期、弹层退场动画丢失 |
| [[zh/Glossary/PR\|PR]] 检查 | CI | smoke 子集 | 没有 |
| 改动边界 | 主控 | 对 brief 禁止改的路径跑 `git diff --stat` | 没有；`internal/`、`cmd/`、`scripts/`、`.github/`、`vercel.json` 和依赖清单都没动 |
| 拷入文件的字节 | 主控 | Kit 文件的 SHA-256 和上游比 | 没有；一致 |
| 截图 | 主控 | 打开 9 张 `after` 截图逐张看 | 5 处缺陷 |
| 集成分支推送 | CI | Linux 上的 Chromium 全量 | 2 条失败的测试 |
| 生产环境 | 主控 | `version.json`、Kit 哈希、策略响应头、无头浏览器打开两个页面 | 没有 |

## 候选方案

### 方案 A：四个 PR

- 做法：brief 里的计划。先基础，再外壳和首页，再交易台和研究，最后其余页面和图解；每个 PR 400 行上下，都不到 1000 行。
- 好处：每个 PR 都小到可以逐行读。
- 代价：共用的基础组件（`Motion`、`Number`、`OverlayPresence`、`routeMotion.tsx`）在使用方开发期间还在变，第一个 PR 合进去的时候没有任何东西能证明它是对的。

### 方案 B：一个 PR

- 做法：lead 实际交付的。PR #290，+5773/-392，117 个文件，head 先是 `9a6d0488`，后来是 `afe3877e`。
- 好处：基础组件和所有使用方一起验证，一套截图、一次全量测试。
- 代价：远超仓库的拆分线。没有人把 5773 行逐行读完。

## 决定

接受一个 PR。事后再拆，等于重拍 248 组截图、再跑四次全量，最后得到同一棵树。逐行读不现实，改用范围更窄的检查来补：

```bash
R=origin/integration/▒▒▒▒▒▒▒▒▒▒▒▒...origin/feat/depth-1-foundation
git diff --stat $R -- internal cmd src scripts .github supabase vercel.json web/package.json web/package-lock.json package.json package-lock.json
git diff -U0 $R -- tests/settings.spec.js tests/unit/pwa-worker.test.js tests/chart-studio.spec.js tests/monetization.spec.js tests/workspace-navigation.spec.js
```

第一条命令没有任何输出。第二条列出原有测试里每一行改动，断言如果削弱了会直接看到。新增模块里最大的几个整份读了，先读 `web/src/lib/routeMotion.tsx`（334 行），因为它换掉了路由的 history 对象。

这处偏差连同原因写在 issue 上。仓库里「PR 保持在 400 行上下」的规定没有改。

## 拷进仓库的 Kit

策略响应头只放行本站和一个支付域名的脚本。把设计站的域名加进去只要改一行，但之后 Kit 每次发新版都会不经审查直接在生产环境执行。所以把 Kit 拷到 `web/public/kit/0.1.0/`，审查时比一次哈希，上线后再比一次。输出顺序跟循环一致，先 `motion.css` 后 `motion.js`：

```bash
for f in motion.css motion.js; do curl -sS "https://design.▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒.com/kit/0.1.0/$f" | shasum -a 256; done
```

```text
5930dd92e525a8f300386d9fcf86401f9944cb9b6651ac41ce8e53a58c76b48e  -
584386622ed9a1ef9e6d82ed5a72d72f5f9b88b59b51195e54cb8c0861354a45  -
```

这台机器的 shell 里有命令包装器，用它查文件大小时两个文件报了同一个字节数，那是包装器自己的输出，不是文件的大小。证据只用哈希。

## 截图

报告说改版做完了，也审查过了。主控打开 9 张 `after` 截图，找出五处缺陷：

| 截图 | 缺陷 |
| --- | --- |
| `desk-1440-dark-after.png` | 图表工具条盖住价格轴最上面的刻度 |
| `desk-1440-dark-after.png` | 涨跌幅数字离价格约 170 px |
| `home-1440-light-after.png` | 四块指数卡里一块白底、三块灰底 |
| `plans-dialog-1440-light-after.png` | 套餐卡片没有内边距，图解把价格挤到下面 |
| `login-1440-dark-after.png` | 爆炸图默认是收起的 |

五处都通过了全部自动检查：测试断言的是执行方想到的几何规则，这五处不在里面。第二份 brief 只写了文件名和这五处缺陷。新起的 lead 用了大约 40 分钟、11 个提交修完，合并前主控把同样几张截图又打开看了一遍。

## Linux 全量测试

#290 的 PR 检查是绿的，发布 PR 自己的检查也是绿的。集成分支的推送运行不是：

```text
44976906277  pull_request  success  a5b9812f
44976896498  push          failure  a5b9812f

1) [chromium] › tests/motion-kit.spec.js:54:1 › late body portal receives kit initialization once
    Error: expect(received).toBe(expected) // Object.is equality
    Expected: 1
    Received: 0
```

Codex 的子代理诊断了这两条失败，并在同一台 Mac 上用 [[zh/Glossary/Playwright|Playwright]] 的 Linux arm64 容器复现。两条都是测试自己的假设不成立：

| 测试 | 假设 | 事实 |
| --- | --- | --- |
| `late body portal receives kit initialization once` | `#root` 非空就是 React 已经挂载 | `web/src/main.tsx:52` 在 `initializeSupabase()` 返回之前先往 `#root` 写占位内容，而 Kit 对 `body` 的观察器要到挂载时才装上 |
| `strategy tilt and spotlight reset on live touch and unmount` | 通过 DevTools 协议关掉触屏模拟后会恢复精细指针 | Linux 上的无头 Chromium 关掉后变成 `hover: none`、`pointer: none`，测试等的 `change` 事件不会触发；macOS 会回到 `hover: hover`、`pointer: fine` |

修复是提交 `50379810`，只改 `tests/motion-kit.spec.js`，加 13 行、删 7 行。portal 那条改成等应用自己的预览辅助函数。tilt 那条用 `page.addInitScript` 把 hover 和 pointer 查询映射到 `prefers-contrast`，再用 `page.emulateMedia` 切换，这样每个平台都会发出真实的 `MediaQueryList` 事件。断言一条没删。

| 运行 | 平台 | 通过 | 失败 | 跳过 |
| --- | --- | --- | --- | --- |
| 44976896498 | Linux arm64，集成分支首次推送 | 1196 | 2 | 3 |
| 44979169479 | Linux arm64，`50379810` 之后 | 1198 | 0 | 3 |
| 本地 | macOS | 1198 | 0 | 3 |

基线在这之前就是红的：集成分支还没有任何改动时，那次运行失败在一条依赖日期的测试 `tests/ticker-tape.spec.js:332` 上。修法是固定 fixture 的日期，随 #290 一起进来；结果都是对着这条基线读的（[[zh/Techniques/baseline-diff-verification-on-a-red-baseline|基线比对验证]]）。

## 走过的弯路

### 从规则文件里抄来的模型 id

执行方的规则文件用带版本号的名字写模型，启动时直接用了里面的 id。启动 17 分钟后 owner 问为什么 lead 不是新版模型；本机安装自带的清单里其实有：

```bash
jq -r '.models[] | select(.visibility=="list") | .slug' ~/.codex/models_cache.json
```

规则现在只写代号，id 在启动时从这个文件取（[[zh/Techniques/config-on-disk-is-not-config-in-effect|写在磁盘上的配置不等于生效的配置]]）。

### 会改默认值的选择器

用 `/model` 选择器给运行中的 lead 换模型，顺手把 `~/.codex/config.toml` 的全局默认值也改了，这台机器之后的每个会话都会继承它。那一行手动改了回去。同一步里还有第二个坑：发送 `/model` 时带自动回车，会直接确认列表里的第一项，持续一轮。

### 比代码更严的验收标准

issue 上写的是新增动效只能改 translate、scale、rotate、opacity 和 clip-path。实际有两处悬停状态（热力图板块、扫描表的行）过渡的是颜色，用的是项目已有的 token。颜色不引起布局变化，原有控件也一直这样做，所以在 issue 上把这条标准改了措辞并写明原因，没有按原文直接打勾。

## 范围之外（YAGNI）

- 策略列表重排后按策略标识恢复焦点（`routeMotion.tsx` 现在按位置恢复）。等有人反馈焦点落到别处再做。
- 兑换弹窗里 `motion.js` 加载成功而 `motion.css` 加载失败的情况。下次改这个弹窗或离线缓存时一起做。
- 换掉 `UNSAFE_createBrowserHistory`。升级路由库之前跑一遍全量浏览器测试就够，现在不重写。

## 经验与小技巧

- 执行方的数字只说明它的检查跑过，五处肉眼可见的缺陷全都通过了这些检查。合并前主控抽几张截图打开看（[[zh/Agents/review-delegated-visual-work-by-opening-the-screenshots|验收外包的界面改动要打开截图]]）。
- 模拟触屏或指针能力的测试可能在 macOS 上通过、在 Linux 无头浏览器上失败，要在 CI 平台上跑过才算完成（[[zh/Agents/pointer-media-after-touch-emulation-differs-on-linux-headless|关掉触屏模拟后的指针媒体查询因平台而异]]）。
- 这个仓库里 PR 检查和推送检查跑的不是同一档测试。发布要等集成分支的推送运行，即使 PR 上的状态全绿。
- 和计划不一样的地方，当天写到计划所在的地方，并附上原因。
- 第二轮就是一份 brief：文件名加一张固定的清单。它用了大约 40 分钟；第一轮从启动到 PR 检查用了大约四个半小时。

## 相关笔记

- [[zh/Cases/Design/2026-10-26-self-hosted-ci-on-shared-mac-mini|把停摆的 GitHub Actions 流水线搬到共享 Mac mini]]
- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]
- [[zh/Techniques/parallel-claude-code-sessions-with-git-worktrees|parallel-claude-code-sessions-with-git-worktrees]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Glossary/CI-CD|CI-CD]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/worktree|worktree]]
