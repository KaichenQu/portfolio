---
type: trick
tags: [debug, hooks, agent]
---
# Agent 报权限不足时的 hook 日志

agent 说「我读不到这个文件」或「运行环境不允许读取」，只是在**转述**某条拦截消息，措辞是模型现场编的。它常把「hook 规则拦了」说成「沙箱不让读」或「容器没挂载」，排查很容易带偏。

![拦截日志给出权限拒绝背后的工具、输入和规则。](../Diagrams/check-hook-logs-when-an-agent-claims-no-permission.denial-evidence.svg)

别顺着它的措辞猜，直接看拦截方自己的日志，里面记着 `tool_name` 和完整的 `tool_input`：

```bash
docker exec <container> sh -c 'tail -5 /data/kimi-guard.log'
```

拿到原始记录，哪个工具、哪条路径、撞了哪条规则，一眼就能看清。前提是 guard 确实写了日志。写 guard 时顺手加一行只追加的日志，成本极低；没留日志，「拦太宽」和「根本没拦」从外面看一模一样。

## 相关

- [[zh/Cases/Debug/2026-08-13-feishu-image-blocked-by-overbroad-guard|2026-08-13-feishu-image-blocked-by-overbroad-guard]]
- [[zh/Agents/verify-hooks-fire-before-trusting-them|verify-hooks-fire-before-trusting-them]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
