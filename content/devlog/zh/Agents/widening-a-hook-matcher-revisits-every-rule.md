---
type: agent-lesson
date: 2026-08-13
tags: [hooks, guard, docker, lark]
---
# Hook matcher 扩大后的规则范围

**错误**：PreToolUse guard 原先用路径子串 `*lark-channel*` 保护加密密钥库，matcher 只覆盖 `Bash`。后来把 matcher 扩到 `Bash|Edit|Write|Read`，同一套规则开始去匹单个文件路径，不再只匹 shell 命令字符串。偏偏 bridge 把聊天附件也存在这棵树的 `profiles/<p>/media/` 下，用户发来的图片全读不到了。agent 回了一句「the media directory is off limits to my runtime」，听着像沙箱或挂载问题，排查白白在错机器上绕了 3 小时。

![把钩子从 Bash 扩展到文件工具后，同一条路径规则也拦截了受保护目录下的普通附件。](../Diagrams/widening-a-hook-matcher-revisits-every-rule.matcher-scope.svg)

**根因**：拿路径子串写拒绝规则，等于默认整棵目录树都敏感。缓存目录和凭据库经常共用同一个 `HOME`，这个前提通常不成立。扩大 matcher 没添新规则，却把旧规则的含义全变了，当时没人按新范围把它们重读一遍。

同一个 guard 里还有个小坑：matcher 正则没加锚定（`new RegExp(pattern).test(name)`），所以 `Read` 把 `ReadMediaFile` 也匹配上了。脚本内部却用精确的 `case "$TOOL" in Read|Edit|Write)` 分派，结果 `ReadMediaFile` 进了 guard，没进文件工具分支，落到后面匹配整段事件 JSON 的兜底规则上。

**以后的规则**：
- 扩大 hook matcher 覆盖的工具范围时，把每条旧规则重读一遍，确认它现在会匹到什么。改 matcher 就是改规则。
- 用路径子串写拒绝规则前，先 `ls` 看目录树。里面有 agent 正当需要的内容时，别放开整棵树，只明确豁免对应子目录，并且限定只读、路径里不能带 `..`。
- 脚本里的工具分派要和 matcher 正则一致。没锚定的分支写法会把内部 `case` 匹配不到的名字放进来，留下进了 hook 却无人处理的工具。
- 拦截提示要指明能走通的路（「read it with ReadMediaFile」），别光给一句拒绝。agent 常先用 `ls` 或 `file` 试探，只收到拒绝就直接放弃。
- agent 声称缺权限时，以 guard 自己的日志为准，别只看它的措辞：它会把拦截提示改写成一套听着很合理的解释。

**来源**：[[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]（完整案例，含排查时间线）。
