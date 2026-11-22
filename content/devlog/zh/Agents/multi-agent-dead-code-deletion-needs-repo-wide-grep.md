---
type: agent-lesson
date: 2026-07-10
tags: [frontend, css, multi-agent]
---
# 删死代码先全仓 grep，再查归属

**错误**：四个 agent 按互不重叠的文件分工并行改版。负责实时工作台的 agent 移掉模型切换控件时，把 `live.css` 里的 `.seg-ctrl`/`.seg-btn` 当死代码删了，只搜了自己负责的文件。另一个 agent 负责的 `SectorHeatmap.tsx` 还在用这两个类，`heatmap.css` 只是在上面叠了覆写规则。基础规则一没，热力图的模式切换器成了没样式的方框。

![一个面板移除切换控件后，按文件归属限定的搜索漏掉了另一个仍依赖基础样式的面板。](../Diagrams/multi-agent-dead-code-deletion-needs-repo-wide-grep.shared-css.svg)

后来在团队仓库做清理 PR 遇到另一面：代码确实没用（全仓无调用方），却轮不到 owner 删。一个无调用符号起初算成了 owner 的，因为对当前文件跑 `git blame` 指向 owner 的提交；那个提交只是挪动了它，跨全历史跑 `git log -S<symbol>` 才看出是队友 PR 引入的。审计前一天合入的队友 PR 还带着 22 个闲置 CSS 类和几个没用上的 export，接线还没做。

**根因**：按文件分工只保证「这个文件归单个 agent 写」，不保证「这个类只给单个 agent 的 markup 用」。跨面板共用的 UI 写法（如分段控件）在按文件分工里没有主人，任何 agent 都可能误当成本地死代码删掉，分工另一头的文件却还依赖它。团队仓库里，同样的问题落在人与人之间：grep 只能说明今天没人调，说明不了作者已经写完；在 open PR 正在改的文件里删代码，还会给对方造合并冲突。

**以后的规则**：
- 按文件或按 agent 分工时，删 CSS 类或选择器前必须全仓 grep，不只搜自己负责的文件。
- 共享 UI 写法（分段控件、徽标，以及跨面板复用的样式）一开始就进共享基础样式表，别复制一份，也别权属不清地留在某个面板文件里。单这一条就能防住这次事故。
- 协调方审多 agent 产出，可以做个快检：把每个 agent 删掉的类在所有 agent 文件里 grep 一遍再验收。
- 删除清单从文件系统列，不要手写。按手写清单删模块时漏掉了 `scripts/lib/icon-export.test.ts`，随后 typecheck 报 TS2307。同目录测试也是被删单元的一部分，手写清单最容易漏这种同级文件。用 `git ls-files <dir>` / `rg -l <module>` 列全，每删一批跑一次那个包的 typecheck，比全仓检查便宜得多，正好抓遗漏。`git rm` 本身传绝对路径，因为 Bash 工具的工作目录在调用间会保留，前面一句 `cd scripts && ...` 会悄悄改变工作目录，让后面的相对路径失败并报 "did not match any files"。
- 团队仓库里，证明代码没用不等于有权删。动手前先用不带路径的 `git log -S<symbol> --format='%h %an %ad %s' --date=short` 查谁最早写进来（最后一行才是引入提交，带路径或 `git blame` 只能查到挪文件的提交），再列全每个 open PR 改的文件（先 `gh pr list --state open`，再 `gh pr view <n> --json files -q '.files[].path'`）。只删发起清理者自己写进来、且所在文件没有 open PR 在改的代码；队友的代码和 open PR 涉及的文件一律进暂缓清单，记清作者、证据、理由和放行条件。

**来源**：[[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]（完整案例，含排查时间线）。归属这一半来自 ▒▒▒▒▒▒▒▒。删除清单这一半来自 ▒▒▒▒▒▒▒▒，主题一样（删前核实），关注点从「还有谁在用」换成「还有什么属于它」。
