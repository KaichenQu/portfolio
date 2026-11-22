---
type: agent-lesson
date: 2026-08-13
tags: [hooks, guard, docker, lark]
---
# Hook matcher 扩大后的规则范围

**错误**：PreToolUse guard 原先用路径子串 `*lark-channel*` 保护加密密钥库，matcher 只覆盖 `Bash`。matcher 扩到 `Bash|Edit|Write|Read` 后，同样的规则开始匹配单个文件路径，不再只匹配 shell 命令字符串。bridge 又把聊天附件放到这棵树的 `profiles/<p>/media/` 下，用户发来的图片全读不了。agent 报「the media directory is off limits to my runtime」，听起来像沙箱或挂载问题，害排查在错机器上耗了 3 小时。

![把钩子从 Bash 扩展到文件工具后，同一条路径规则也拦截了受保护目录下的普通附件。](../Diagrams/widening-a-hook-matcher-revisits-every-rule.matcher-scope.svg)

**根因**：拒绝规则只写路径子串，等于默认整棵树都敏感。缓存目录和凭据存储经常共用 `HOME`，这个假设通常不成立。matcher 扩大没有新增规则，却改变了原有规则的含义，没人按新范围重读它们。

同一 guard 还有个小坑：matcher 正则没锚定（`new RegExp(pattern).test(name)`），所以 `Read` 也匹配 `ReadMediaFile`。脚本自己用精确的 `case "$TOOL" in Read|Edit|Write)` 分派，`ReadMediaFile` 进了 guard 却没进文件工具分支，最后撞上匹配整个事件 JSON 的兜底规则。

**以后的规则**：
- 扩大 hook matcher 的工具覆盖范围时，重新读每条旧规则，确认现在会匹配什么。改 matcher 就是改规则。
- 用路径子串写拒绝规则之前先 `ls` 看目录树。里面有 agent 正当需要的内容，就明确放行对应子目录，例外保持只读，路径不能有 `..`。
- 脚本里的工具分派要和 matcher 正则一致。没锚定的分支写法会放进内部 `case` 匹配不到的名字，留下进了 hook 却无人处理的工具。
- 拦截消息要告诉 agent 哪条路能走通（「read it with ReadMediaFile」）。agent 常先用 `ls` 或 `file` 探测，只收到拒绝就会放弃。
- agent 声称缺权限时，以 guard 自己的日志诊断。它会把拦截消息改述成听起来合理的解释，不能只看措辞。

**来源**：[[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]（完整案例，含排查时间线）。
