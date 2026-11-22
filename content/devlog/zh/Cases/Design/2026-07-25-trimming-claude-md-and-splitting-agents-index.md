---
type: case-design
date: 2026-07-25
tags: [design, infra, claude-code, context-engineering]
status: solved
---
# 上下文工程下的 CLAUDE.md 精简与 AGENTS.md 入口拆分

## 背景与约束

Anthropic 在 2026-07-24 的文章 [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) 给了个明确的数字：**给高档模型用的 Claude Code 系统提示词删掉 80% 以上，没测到表现下降**。文中 5 项转变有 3 项直接关系到本地配置：把规则改成判断原则、删除重复内容、按需逐层披露。

官方的记忆文档给的是另一项更具体的指标：

> **Size: target under 200 lines per CLAUDE.md file.** Longer files consume more context and **reduce adherence**.

实测每个会话加载 183 行 / 11 KB，其中 `~/.claude/CLAUDE.md` 有 90 行，`RTK.md` 有 27 行，`DevLog/AGENTS.md` 有 66 行。后两份靠 `@` 导入。文档明确说导入的文件会在启动时进上下文，所以单纯拆文件并不省上下文。

两项硬约束：

- **单个文件都没超过 200 行**，所以没有超出官方指标。博客的 80% 说的是 Claude Code 自己的系统提示词，这个数字套不到用户的 CLAUDE.md。
- `AGENTS.md` 是特意设计的**跨工具入口**。Cursor、Codex 和 Copilot 按约定读这个文件名，不能为了省上下文把入口拆没了。

## 候选方案

### 方案 A：一律删掉 80%

- 做法：把 CLAUDE.md 缩到约 30 行，只留个人专属的语言偏好、git 格式和 DevLog 触发条件。
- 好处：省得最多。
- 代价：会删掉文档**明确建议保留**的东西。先核对后发现，Response style 里 8 条抑制啰嗦的规则，正是 Anthropic 推荐给 Opus 5 的对策。`prompting-claude-opus-5` 原文是：

  > The effort parameter controls how much the model **thinks** rather than how much it **says**: lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly.

  这一代模型只有靠提示词才能压住啰嗦，动 `effort` 起不到这个作用。删这些规则反而会损害效果。

### 方案 B：只删和 harness 重复的内容

- 做法：逐行对照 CLAUDE.md 和当前系统提示词，只删内置提示词已经覆盖的部分。
- 好处：有证据，也不会误伤别的规则。官方文档说，重复和冲突的指令会**降低遵从度**，去重的收益不只是少几行。
- 代价：省不了多少。

### 方案 C：在 B 的基础上，把非全局内容移出全局导入

- 做法：在 B 的基础上处理 `AGENTS.md` 的 66 行。前 27 行是 vault 元信息（vault 是什么、`Agents/` 干什么、怎么写经验笔记），只有在 DevLog 仓库里工作才用得上。后 39 行是 8 项经验的索引，在哪里都用得上。
- 好处：前 27 行在 95% 的会话里都没用，减掉它们是最明确的收益。
- 代价：需要改 vault 结构，`@` 导入只能整份导入，不能导半份。

## 决定

选方案 C。

**淘汰 A 的约束是「官方建议保留」**，砍 80% 会删掉 Anthropic 亲自建议留下的内容。这靠查证才确认：先读 `prompting-claude-opus-5`，确定 Response style 应保留；再读 Fable 5 迁移指南，发现 Code style 剩下的两条（不为不可能出现的情况写错误处理、不为一次性操作做抽象）几乎逐字复述了官方推荐提示词，所以也留下。

最终只从 CLAUDE.md 删掉 4 项，每项在 harness 里都找得到对应内容。

| 删除内容 | 已有覆盖 |
|---|---|
| 昨天新增、共 6 行的 When to delegate 段 | harness 里有三处同义指令，见 Agent 工具说明、会话级指令和 Workflow 工具文档 |
| `Don't add comments... to code I didn't change` | harness 内置的 `Write code that reads like the surrounding code: match its comment density, naming, and idiom`，也正是博客的「after」示例 |
| `Don't add features beyond what was asked` | harness 的整个 `# Delivering work` 段 |
| DevLog 段的写作约定（emoji / 时间线 / Glossary） | `/devlog` 第 25、28 和 38-41 行，逐字对应 |

另外有一项做了改写。原文是「never add double-check instructions」，现在改成「strip verification scaffolding when you find it」。Opus 5 指南的原话是 `**Delete** verification instructions`，把删除现有东西的要求改成新的禁令，方向就弄反了。

## 模块划分

`AGENTS.md` 拆成两份文件，各管一件事。

```mermaid
flowchart LR
    subgraph before["拆分前"]
        A1["AGENTS.md，66 行<br/>vault 指南和索引"] -->|@ 导入，常驻| A2[每个会话]
    end
    subgraph after["拆分后"]
        B1["AGENTS.md，31 行<br/>仅 vault 指南<br/>跨工具入口保留"] -.按需读取.-> B3[人和其他 AI 工具]
        B2["Agents/INDEX.md，47 行<br/>仅 8 项经验"] -->|@ 导入，常驻| B4[每个会话]
        B1 -->|链接| B2
    end
```

- `AGENTS.md`（31 行）保留完整的跨工具入口职责。Index 段缩成一句话，指向 `Agents/INDEX.md`。
- `Agents/INDEX.md`（47 行）只放 8 项经验的索引，和经验文件同目录，链接改为同级相对路径，Obsidian 仍能解析。
- `~/.claude/CLAUDE.md` 的导入从 `AGENTS.md` 切到 `Agents/INDEX.md`。
- `/devlog` 新增第 7 步，接手旧 `AGENTS.md` 里的 Agents/ 工作流。

常驻内容从 183 行降到 150 行。

## 数据流

关键在差一点漏掉的那一环。原计划直接把 `AGENTS.md` 从全局导入去掉，动手前扫了一眼 `/devlog`，发现第 1 到第 7 步**都没提 `Agents/`**。「写完案例再提炼英文经验」的工作流只存在于 `AGENTS.md:22-26`。

照原计划走不会有任何报错，`Agents/` 只是再也不长新文件，几周后才可能看出来。

所以调换了顺序：先把工作流挪到 `/devlog` 的第 7 步，再改导入。新位置也更好懂，它说的本来就是 `/devlog` 跑完后的事，常驻文件用不上。记忆文档也正有这条：

> If an entry is a **multi-step procedure** or only matters for one part of the codebase, move it to a **skill** or a path-scoped rule instead.

事后完整性检查确认 8/8 个链接可达，没有孤立的经验笔记：

```bash
for f in Agents/*.md; do b=$(basename "$f"); [ "$b" = "INDEX.md" ] && continue
  grep -q "($b)" Agents/INDEX.md || echo "  ORPHAN $b"; done
```

## 未做事项（YAGNI）

- **没压缩经验摘要。** 每项 3 到 5 行看着长，但摘要本身就是**预防触发条件**，读到它就学到了经验，不需要打开文件。压成光秃秃的标题（「grep anchor vs ls trailing slash」）就失去了触发作用，读者甚至不会想到值得打开。47 行都是自己踩坑换来的经验，值得占上下文；27 行「这个 vault 是什么」不值得。
- **没建 `DevLog/CLAUDE.md`。** 官方的做法是文件里只放 `@AGENTS.md`，在 vault 内自动加载。但绝大部分 `/devlog` 都是在**其他项目**下开会话调用，根本不会加载这个文件，建了只是摆设。
- **没用带 `paths` frontmatter 的 `~/.claude/rules/`。** 8 项经验只有 5 项能按路径定范围（chezmoi / hooks / shell / React / CSS），另 3 项（`git add` pathspec、grep 锚点和 MCP 配置位置）按**话题**触发，不适合按路径限定。为了省几百 token 搞一套符号链接加 frontmatter，不划算。

## 经验

- ==移动结构之前，先 grep 看要搬的内容还有没有第二份；只有一处的内容，搬错就会悄悄消失。== 这里 4 项删除里有 3 项是先在 harness 或 skill 找到逐字副本才删的。Agents/ 工作流只有那一份；避免丢失只多花了一次 `Read`。详见 [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]。
- **先核对官方数字在衡量什么。** 「删 80%」和「低于 200 行」分别说 Claude Code 自己的系统提示词和用户的 CLAUDE.md，套错就会误删。读文档时把发布日期和指标对象一起看。
- **去重还能提高遵从度。** 官方说重复或冲突的指令会降低遵从度。「don't dispatch subagents carelessly」同义说 3 遍，信号会稀释，模型并不会因此更听话。

## 相关

- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]
- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]
