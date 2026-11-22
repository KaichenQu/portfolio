---
type: trick
tags: [debug, hooks, agent]
---
# Agent 报权限不足时的 hook 日志

agent 说「我读不到这个文件」或「运行环境不允许读取」，是在**转述**某条拦截消息，措辞是模型现场组织的。它常把「hook 规则拦了我」说成「沙箱不允许」或「容器没挂载」，排查就容易走错方向。

![拦截日志给出权限拒绝背后的工具、输入和规则。](../Diagrams/check-hook-logs-when-an-agent-claims-no-permission.denial-evidence.svg)

不用猜它的措辞，直接查拦截方自己的日志，里面有 `tool_name` 和完整的 `tool_input`：

```bash
docker exec <container> sh -c 'tail -5 /data/kimi-guard.log'
```

原始记录在手，哪个工具、哪条路径、撞了哪条规则，一眼就能看出来。前提是 guard 真有日志。写 guard 时加上只追加的日志，成本很低。没有它，「误拦」和「压根没拦」在外面看起来一样。

## 相关

- [[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]
- [[zh/Agents/verify-hooks-fire-before-trusting-them|verify-hooks-fire-before-trusting-them]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
