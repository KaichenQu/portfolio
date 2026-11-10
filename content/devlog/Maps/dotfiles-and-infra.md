---
type: moc
tags: [moc, infra, chezmoi, config, shell, cron, macos, security]
---
# Dotfiles and infrastructure

41 notes, the largest cluster. Cross-cuts `Cases/`, `Techniques/`, `Agents/`, `Glossary/`.

## chezmoi and templated dotfiles

- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] — plaintext API keys moved behind age
- [[2026-06-29-chezmoi-platform-template-breaks-decryption]] — `decrypt: encryption not configured` after adding a platform template
- [[config-template-overwrites-handwritten-config]] — `chezmoi init` rewrites the whole config from the new template
- [[merge-old-config-before-templating]] — copy the old config into the template first
- [[chezmoi]] · [[age]] · [[whitespace-trimming]]

## Shell scripts that die without saying so

- [[2026-07-07-cron-job-appears-untriggered-script-died-silently]] — the cron job fired; the script died at line one
- [[cron-script-silent-death-under-set-e]] — the rule that prevents it
- [[command-substitution-failure-kills-script-under-set-e]] — `grep` returning 1 on no match is enough
- [[pipefail]]

## Guards that reach further than intended

- [[2026-08-13-feishu-image-blocked-by-overbroad-guard]] — a path-substring deny that also blocked the bridge's own cache
- [[env-file-protection-patterns-fire-on-non-secret-operations]] — matching a filename is not detecting secret access
- [[widening-a-hook-matcher-revisits-every-rule]]

## Reading opaque systems

- [[2026-07-08-tradingview-auth-token-no-longer-a-cookie]] — the extractor was fine; the token stopped being a cookie
- [[2026-10-26-tradingview-intraday-snapshots-stuck-pending]] — intraday series went SNAPSHOT_PENDING because the ~4 h feed JWT was never renewed; now refreshed from the session id 10 min before expiry
- [[grep-anchor-vs-ls-trailing-slash]] — an end-anchored regex silently drops decorated entries
- [[dump-then-grep-strings-from-binaries]]

## Cloud resources and teardown

- [[2026-06-19-lambda-succeeds-but-writes-no-data]] — successful run, empty table, missing trigger
- [[2026-06-19-teardown-by-prefix-instead-of-exact-name]] — delete by prefix so partial-failure leftovers still get cleaned
- [[GC]]

## Config in effect

- [[config-on-disk-is-not-config-in-effect]]
- [[2026-07-25-subagents-disabled-by-stale-subscription-cache]]
- [[mcp-server-config-location]]
- [[verify-hooks-fire-before-trusting-them]]

## Cross-border transfer and the deploy control plane

A link that throttles per TCP flow, a signed URL that expires in 10 minutes, and a server-side
controller that fails closed on any byte drift from the repo.

- [[check-signed-url-lifetime-before-designing-resume]] — the lesson
- [[SAS]] · [[ICP]] · [[OIDC]]

## Public SSH endpoints under background scanning

Port 22 on a public address gets dictionary attempts around the clock. The security question is
closed by the accepted-login list; the capacity question is `MaxStartups` against the attempt rate.

- [[fail2ban-escalating-ban-formula]] — 1 h, 1 h, then 2^n hours, capped at 30 days
- [[hand-over-full-state-config-not-deltas]] — the lesson from sending a `sed` delta to a file the user had not yet created
- [[SSH]] · [[VPS]]

## Self-hosted CI and fail-safe routing

- [[2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm]] — six self-hosted GitHub Actions runners in an isolated OrbStack VM, routed by a per-minute heartbeat that falls back to cloud runners
- [[2026-10-26-self-hosted-ci-on-shared-mac-mini]] — a billing lock moved tests to a dedicated VM on the shared Mac mini; deploys and their credentials stayed on GitHub-hosted runners

