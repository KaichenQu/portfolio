---
type: agent-lesson
date: 2026-07-10
tags: [frontend, css, multi-agent]
---
# 删死代码先全仓 grep，再查归属

**错误**：四个 agent 并行改版，按互不重叠的文件分工。负责实时工作台的 agent 去掉了模型切换控件，把 `live.css` 里的 `.seg-ctrl`/`.seg-btn` 当死代码删了。它只查了自己负责的文件。另一个 agent 负责的 `SectorHeatmap.tsx` 还在用这两个类，`heatmap.css` 只是在它们上面叠了覆盖规则。基础规则一删，热力图的模式切换就成了没有样式的方框。

![一个面板移除切换控件后，按文件归属限定的搜索漏掉了另一个仍依赖基础样式的面板。](../Diagrams/multi-agent-dead-code-deletion-needs-repo-wide-grep.shared-css.svg)

后来团队仓库里的一次清理 PR 碰到的是另一面：代码确实没用（全仓没有调用方），却轮不到 owner 去删。一个没有调用方的符号记成了 owner 的，因为对它所在的当前文件跑 `git blame`，指向的是 owner 的提交；那个提交只是挪动了它，跨全历史跑 `git log -S<symbol>`，才看出是队友的 PR 引入的。审计前一天合入的一个队友 PR 还带着 22 个没用上的 CSS 类和几个没用上的 export，那是后面还要接的线。

**根因**：按文件分工只保证「这个文件只有一个 agent 写」，不保证「这个类只有一个 agent 的 markup 在用」。共享的 UI 写法（多个面板共用的分段控件）在按文件分工的模式里没有主人，任何 agent 都可能以为它是本地死代码而删掉，其实分工另一侧的文件还依赖它。团队仓库里，同样的缺口出现在人和人之间：grep 只能证明今天没人调用这段代码，证明不了作者已经用完了它；而在 open PR 正在改的文件里删东西，会变成那位作者的合并冲突。

**以后的规则**：
- 按文件或按 agent 分工时，删 CSS 类或选择器之前，对全仓 grep，不只查自己负责的文件。
- 共享的 UI 写法（分段控件、徽标，以及任何跨面板复用的样式）从一开始就放进共享的基础样式表，不要复制一份，也不要半归属地放在某个面板的文件里。单这一条就能避免这次的问题。
- 协调方审多 agent 产出时，有个快办法：某个 agent 删掉的每个类，都在所有 agent 的文件里 grep 一遍，再接受改动。
- 另外：删除清单从文件系统里列，不要手写。按手写的文件清单删模块，漏下了 `scripts/lib/icon-export.test.ts`，随后 typecheck 报 TS2307。同目录的测试也是要删的那个单元的一部分，手写清单最容易漏掉这种同级文件。用 `git ls-files <dir>` / `rg -l <module>` 列出来，每删一批就跑一次那个包的 typecheck；这比全仓检查便宜得多，正好能抓住这种遗漏。`git rm` 本身用绝对路径，因为 Bash 工具的工作目录会在调用之间保留，前面一句 `cd scripts && ...` 会让后面的相对路径静默失败，报 "did not match any files"。
- 团队仓库里，证明代码没用不等于可以删。删之前，用 `git log -S<symbol> --format='%h %an %ad %s' --date=short` 查是谁最早写进来的，不带路径（最后一行是引入它的提交；带路径或用 `git blame`，查到的是挪动文件的提交），再列出每个 open PR 的文件（先 `gh pr list --state open`，再 `gh pr view <n> --json files -q '.files[].path'`）。只删发起清理的人自己写进来、所在文件没有 open PR 在改的代码。队友的代码，以及 open PR 改到的文件里的任何东西，都进暂缓清单，写明作者、证据、原因，以及到什么条件就可以删。

**来源**：[[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]（完整案例，含排查时间线）。归属这一半来自 ▒▒▒▒▒▒▒▒。删除清单那一半来自 ▒▒▒▒▒▒▒▒，主题相同（删之前先核实），失败方式不同：问的不是「还有谁在用」，而是「还有什么属于它」。
