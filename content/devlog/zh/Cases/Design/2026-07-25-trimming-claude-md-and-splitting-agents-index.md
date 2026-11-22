---
type: case-design
date: 2026-07-25
tags: [design, infra, claude-code, context-engineering]
status: solved
---
# 上下文工程下的 CLAUDE.md 精简与 AGENTS.md 入口拆分

## 背景与约束

Anthropic 2026-07-24 的文章 [The new rules of context engineering for Claude 5 generation models](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models) 给了个硬数字：**给高档模型用的 Claude Code 系统提示词删掉 80% 以上，没测出表现下降**。文中 5 项转变里有 3 项跟本地配置直接相关：规则改判断原则、删重复内容、按需逐层披露。

官方记忆文档给了另一条更具体的线：

> **Size: target under 200 lines per CLAUDE.md file.** Longer files consume more context and **reduce adherence**.

实测每个会话加载 183 行 / 11 KB：`~/.claude/CLAUDE.md` 90 行、`RTK.md` 27 行、`DevLog/AGENTS.md` 66 行，后两份用 `@` 导入。文档明确写着导入文件会在启动时全进上下文，光拆文件省不了上下文。

两项硬约束：

- **单文件都没过 200 行**，本来就没超标。博客里「80%」说的是 Claude Code 自己的系统提示词，不是用户的 CLAUDE.md，这个数字套不过来。
- `AGENTS.md` 是特意留的**跨工具入口**，Cursor、Codex 和 Copilot 按约定读这个文件名，不能为了省上下文把它拆没。

## 候选方案

### 方案 A：一刀切删 80%

- 做法：把 CLAUDE.md 压到约 30 行，只留个人语言偏好、git 格式和 DevLog 触发条件。
- 好处：省得最多。
- 代价：会删掉文档**明确建议留着**的规则。动手前查了一遍，Response style 里 8 条压啰嗦的规则正是 Anthropic 给 Opus 5 推荐的对策。`prompting-claude-opus-5` 原文写着：

  > The effort parameter controls how much the model **thinks** rather than how much it **says**: lowering effort can reduce thinking volume without reliably shortening the visible response. To control response length, prompt for it explicitly.

  这一代模型只能靠提示词压长度，调 `effort` 管不了输出字数。删掉这些规则等于帮倒忙。

### 方案 B：只删跟 harness 重复的内容

- 做法：把 CLAUDE.md 跟当前系统提示词逐行对照，只删内置提示词已经覆盖的条目。
- 好处：有据可依，不误伤。官方文档说重复或冲突的指令会**降低遵从度**，去重省的不只是行数。
- 代价：减不下来多少。

### 方案 C：在 B 基础上，把非全局内容移出全局导入

- 做法：在 B 之外处理 `AGENTS.md` 的 66 行。前 27 行是 vault 说明（vault 是什么、`Agents/` 干什么、怎么写经验笔记），只有进 DevLog 仓库才用得上；后 39 行是 8 条经验索引，在哪里都用得上。
- 好处：前 27 行在 95% 的会话里纯属噪音，挪出去是最实在的收益。
- 代价：要动 vault 结构，`@` 导入只能整份导，不能只导半份。

## 决定

选方案 C。

**淘汰 A 的原因是「官方建议保留」**：照着砍 80% 会删掉 Anthropic 明文让你留的内容。这点是查过才确认的：先翻 `prompting-claude-opus-5` 确定 Response style 得留；再看 Fable 5 迁移指南，发现 Code style 剩下的两条（不为不可能的情况写错误处理、不为一次性操作做抽象）几乎一字不差对应官方推荐提示词，一并留下。

最后 CLAUDE.md 只删了 4 项，每项在 harness 里都找得到对应内容：

| 删除内容 | 已有覆盖 |
|---|---|
| 昨天新加的 6 行 When to delegate 段 | harness 里有三处同义指令：Agent 工具说明、会话级指令、Workflow 工具文档 |
| `Don't add comments... to code I didn't change` | harness 内置 `Write code that reads like the surrounding code: match its comment density, naming, and idiom`，正是博客的「after」示例 |
| `Don't add features beyond what was asked` | harness 整段 `# Delivering work` |
| DevLog 段的写作约定（emoji / 时间线 / Glossary） | `/devlog` 第 25、28 和 38-41 行，逐字对应 |

还有一项做了改写：把原来的「never add double-check instructions」改成「strip verification scaffolding when you find it」。Opus 5 指南原话是 `**Delete** verification instructions`，把「删掉已有脚手架」写成「新禁令」，方向反了。

## 模块划分

`AGENTS.md` 拆成两份，各管一头：

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

- `AGENTS.md`（31 行）留住完整的跨工具入口职责，Index 段收成一句话指到 `Agents/INDEX.md`。
- `Agents/INDEX.md`（47 行）只放 8 条经验索引，跟经验文件同目录，链接改同级相对路径，Obsidian 照样解析。
- `~/.claude/CLAUDE.md` 的导入从 `AGENTS.md` 切到 `Agents/INDEX.md`。
- `/devlog` 补第 7 步，接手旧 `AGENTS.md` 里的 Agents/ 工作流。

常驻行数从 183 行降到 150 行。

## 数据流

最有意思的是差点漏掉的那一环。原计划直接把 `AGENTS.md` 移出全局导入，动手前扫了眼 `/devlog`，发现第 1 到第 7 步**根本没提 `Agents/`**，「写完案例再提炼英文经验」的工作流只写在 `AGENTS.md:22-26` 里。

照原计划改不会报任何错，只是 `Agents/` 从此不再长新文件，可能几周都没人发现。

于是调换了顺序：先把工作流搬进 `/devlog` 第 7 步，再改导入。挪过去也更顺理成章，它管的是 `/devlog` 跑完后的事，本就不该占常驻上下文。记忆文档正好有这么一条：

> If an entry is a **multi-step procedure** or only matters for one part of the codebase, move it to a **skill** or a path-scoped rule instead.

改完跑完整性检查，确认 8/8 个链接可达、没有孤立经验笔记：

```bash
for f in Agents/*.md; do b=$(basename "$f"); [ "$b" = "INDEX.md" ] && continue
  grep -q "($b)" Agents/INDEX.md || echo "  ORPHAN $b"; done
```

## 未做事项（YAGNI）

- **没压经验摘要。** 每条 3 到 5 行看着长，但摘要本身就是**预防触发器**，读到摘要就已经拿到了教训，不用点开文件。压成光秃秃的标题（「grep anchor vs ls trailing slash」）就失去了触发效果，读者根本想不到该点开看。47 行自己踩出来的坑值得占上下文，27 行「这个 vault 是什么」不值。
- **没建 `DevLog/CLAUDE.md`。** 官方的做法是文件里只放一行 `@AGENTS.md`，在 vault 里自动加载。但绝大多数 `/devlog` 是在**别的项目**会话里调的，根本加载不到它，建了也是摆设。
- **没用带 `paths` frontmatter 的 `~/.claude/rules/`。** 8 条经验里只有 5 条能按路径划（chezmoi / hooks / shell / React / CSS），另 3 条（`git add` pathspec、grep 锚点、MCP 配置位置）按**话题**触发，套不上路径范围。为省几百 token 引入一套符号链接加 frontmatter 机制，不划算。

## 经验

- ==动结构前先 grep 确认要搬的内容有没有第二份；只有一处的，挪错了会悄无声息消失。== 这次删的 4 项里有 3 项先在 harness 或 skill 里找到逐字副本才动手；Agents/ 工作流是孤本，多做一次 `Read` 才没丢。详见 [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]。
- **先看清官方数字量的到底是什么。** 「删 80%」和「低于 200 行」说的分别是 Claude Code 系统提示词和用户 CLAUDE.md，张冠李戴就会误删。读文档要把发布日期和指标对象一起看。
- **去重省的不只是 token。** 官方说重复或冲突的指令会拉低遵从度。「don't dispatch subagents carelessly」换着法说 3 遍，只会稀释信号，模型不会更听话。

## 相关

- [[zh/Cases/Debug/2026-07-25-subagents-disabled-by-stale-subscription-cache|2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[zh/Agents/trimming-config-files-needs-a-sole-copy-check|trimming-config-files-needs-a-sole-copy-check]]
- [[zh/Cases/Design/2026-07-07-unifying-dual-account-claude-config|2026-07-07-unifying-dual-account-claude-config]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]
