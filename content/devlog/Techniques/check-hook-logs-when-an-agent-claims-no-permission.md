---
type: trick
tags: [debug, hooks, agent]
---
# When an agent says it lacks permission, check the hook log first

When an agent reports "I can't read this file" or "my runtime forbids reads," that sentence is its own **paraphrase** of some block message — the wording is made up by the model on the spot. It often turns "a hook rule blocked me" into "the sandbox doesn't allow this" or "the container isn't mounted," sending you off in a completely wrong direction.

Don't guess from the wording — go straight to the blocking side's own log, which has `tool_name` and the full `tool_input`:

```bash
docker exec <container> sh -c 'tail -5 /data/kimi-guard.log'
```

With the raw record in hand, which tool, which path, and which rule it hit is obvious at a glance. This depends on the guard actually logging — add an append-only log line while you write the guard, it costs almost nothing — otherwise "blocked too aggressively" and "not blocked at all" look identical from the outside.

## Related
- [[2026-08-13-feishu-image-blocked-by-overbroad-guard]]
- [[verify-hooks-fire-before-trusting-them]]
- [[config-on-disk-is-not-config-in-effect]]
