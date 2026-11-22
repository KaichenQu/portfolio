---
type: agent-lesson
date: 2026-07-25
tags: [config, context-engineering, claude-code]
---
# 常驻指令文件中的唯一副本

**错误**：缩减全局常驻上下文时，原本打算从 `~/.claude/CLAUDE.md` 去掉 `@/Users/kelsonqu/Obsidian/DevLog/AGENTS.md`，因为那份文件 66 行里有 27 行是 vault 说明，出了 vault 用不上。同批另外 3 处删除都核对过，harness 系统提示词或 `/devlog` 命令里已有副本，于是想当然把这条当成同一类改动，差点没核对就删。先读了一遍 `/devlog` 才发现里面根本没提 `Agents/`：「写完案例，在 `Agents/` 提炼英文经验」只在 `AGENTS.md:22-26` 写着。

![删除全局导入会抹掉 Agents 经验工作流的唯一副本，因此应先迁移，再移除导入。](../Diagrams/trimming-config-files-needs-a-sole-copy-check.import-contents.svg)

**根因**：删重复内容和删导入在 diff 里长得一样，实际是两回事。重复内容别处还有副本，删了不丢东西；导入是个容器，一删就把里面的内容全带走，包括碰巧只有一份的段落。两种改法都不会报错，改的时候看不出差别，但删掉唯一副本的后果会拖很久才露出来：不报错、不缺文件，只是那套流程悄无声息停了，过几个月才有人发现目录再也没涨过。

**以后的规则**：
- 从常驻指令文件删段落前，挑有辨识度的短语，去同一上下文会加载的其他文件里 grep（harness 提示词、skill、斜杠命令和其他导入）。确认找到第二份再删。
- 去掉 `@import` 或整个文件前，先通读一遍，逐段清点：有副本的可以删，只有一份的先搬走。`@` 导入是全有或全无，没法只导半份。
- 先迁后删，绝不倒过来。把唯一副本移到真正触发它的地方（多步流程该放进触发它的 skill，不要每个会话都加载），确认落位后再动导入。
- 优先搬到触发条件更准的位置。这条流程写的是 `/devlog` 的后续动作，放进 `/devlog` 比全局常驻合适得多。

**来源**：[[zh/Cases/Design/2026-07-25-trimming-claude-md-and-splitting-agents-index|2026-07-25-trimming-claude-md-and-splitting-agents-index]]（完整案例，含排查时间线）。
相关但不是一回事：[[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]] 讲的是删掉了别的*使用方*还在依赖的东西，这里讲的是删掉了东西的*唯一副本*。
