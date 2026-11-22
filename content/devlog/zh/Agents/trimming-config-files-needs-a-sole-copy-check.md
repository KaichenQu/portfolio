---
type: agent-lesson
date: 2026-07-25
tags: [config, context-engineering, claude-code]
---
# 常驻指令文件中的唯一副本

**错误**：缩减全局加载的上下文时，原计划从 `~/.claude/CLAUDE.md` 去掉 `@/Users/kelsonqu/Obsidian/DevLog/AGENTS.md`。那份文件 66 行里有 27 行是 vault 说明，在 vault 外用不上。同批另外 3 项删除都确认过，harness 系统提示词或 `/devlog` 命令里已经有副本。这里想当然当成同一类改动，差点没核对。先读 `/devlog` 才发现里面压根没提 `Agents/`。「写完案例，在 `Agents/` 提炼英文经验」只在 `AGENTS.md:22-26` 有。

![删除全局导入会抹掉 Agents 经验工作流的唯一副本，因此应先迁移，再移除导入。](../Diagrams/trimming-config-files-needs-a-sole-copy-check.import-contents.svg)

**根因**：删重复内容和删导入是两回事，在 diff 里却长得一样。重复内容别处还有副本，删了没损失。导入是个容器，一删就连带删掉所有内容，包括碰巧只有这一份的部分。两种改法都不会报错，编辑时看不出区别。唯一副本没了还会延迟暴露：没有报错，也不缺文件，就是工作流悄悄停了，几个月后才有人发现目录不再增长。

**以后的规则**：
- 从常驻指令文件删段落前，用有辨识度的短语去同一上下文会加载的其他文件里 grep，比如 harness 提示词、skill、斜杠命令和其他导入。只删找到第二份的内容。
- 去掉 `@import` 或整个文件之前，先读完并逐段核对。有副本的可以删，只有一份的先搬走。`@` 导入只能整份导，没法导半份。
- 先迁后删。把唯一副本移到真正会触发它的地方，多步流程该放在触发它的 skill 里，不用每个会话都加载。确认迁到位，再改导入。
- 优先搬到触发条件比原位置更精确的地方。这里写的是 `/devlog` 的后续动作，直接放进 `/devlog` 比全局常驻更合适。

**来源**：[[zh/Cases/Design/2026-07-25-trimming-claude-md-and-splitting-agents-index|2026-07-25-trimming-claude-md-and-splitting-agents-index]]（完整案例，含排查时间线）。
相关但问题不同：[[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]] 说的是删掉了别的*使用方*仍依赖的东西，这里说的是删掉了东西的*唯一副本*。
