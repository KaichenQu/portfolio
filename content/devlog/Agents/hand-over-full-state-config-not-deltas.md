---
type: agent-lesson
date: 2026-09-05
tags: [infra, shell, sudo, fail2ban, sshd]
---
# When the user executes the commands, send the whole target state, not an edit that assumes an earlier step ran

**Mistake**: on a box where the agent had no sudo, fail2ban and sshd changes were handed to the teammate as command blocks across several chat turns. Turn N introduced `bantime.increment`, `bantime.maxtime` and `bantime.formula` in `jail.local`; turn N+1, after the teammate changed the numbers, sent a `sed -i 's|^bantime.maxtime = .*|...|'` delta. The teammate had skipped turn N. `sed` matched nothing and exited 0, and `fail2ban-client` chained onto `systemctl restart` in the same line printed `Failed to access socket path:/var/run/fail2ban/fail2ban.sock` because the daemon was still starting. The teammate read that as "it broke".

**Root cause**:
- A delta encodes an assumption about the file's current content. The agent cannot see which of its earlier blocks a user actually pasted, so the assumption is unverifiable at the moment it is sent.
- `sed -i` with a non-matching pattern is a silent no-op; nothing tells either party the edit did not land.
- `fail2ban-client` needs the daemon's socket, which appears a moment after `systemctl restart` returns.

**Rule going forward**:
- When someone else runs the commands, every block writes the complete target state (`tee file <<'EOF' ... EOF`, a whole drop-in under `conf.d/`), so it is correct whether or not any earlier block ran. Deltas are for files the agent can read back first.
- Before sending any edit to a remote file, `cat` the current content over the read-only channel that is available and quote the relevant lines in the reply.
- Separate "restart" from "query" with `&& sleep 3 &&`, or put the query on its own line, and say in advance that the socket error means "too early", not "failed".
- End every hand-over block with one verification command whose expected output is stated, so a silent no-op is caught on the spot.
