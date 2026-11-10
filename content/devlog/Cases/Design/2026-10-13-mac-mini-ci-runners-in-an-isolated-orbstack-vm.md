---
type: case-design
date: 2026-10-13
tags: [design, infra, ci, github-actions, orbstack, docker, macos]
status: solved
---
# Mac mini CI runners in an isolated OrbStack VM

Four heavy [[CI-CD|CI]] jobs of one application repository moved from Ubicloud to six self-hosted GitHub Actions runners on a Mac mini. A **self-hosted runner** is GitHub's runner agent (`actions-runner`) installed on a machine you own; it takes the jobs that ask for its label. The runners do not run on macOS. They run inside an OrbStack VM. **OrbStack** is a macOS app that runs lightweight Linux machines and Docker.

Three decisions carry the design:

1. The runners live in Linux, because the jobs need Docker service containers.
2. The VM is cut off from the Mac's files and network, because CI runs other people's code.
3. ==A per-minute heartbeat decides where jobs go, so CI falls back to Ubicloud by itself when the Mac stops answering.==

The first run was on 2026-10-13 at 21:03Z. Three of the four jobs passed on the first attempt.

## Background and constraints

Before the move, the heavy jobs ran on Ubicloud runners (labels `ubicloud-standard-2` and `ubicloud-standard-4`). Ubicloud is a third-party provider of hosted runners. The light jobs ran on GitHub-hosted `ubuntu-latest`.

| Constraint | Consequence |
| --- | --- |
| The jobs declare `services: postgres`. The runner supports service containers only on Linux, with a Docker daemon in the same network namespace; the job reaches postgres at `localhost:<port>`. | Linux is required. On a Mac that means a VM. |
| CI runs other people's code. | The VM must not see the Mac's files or the host network. |
| The Mac keeps a third of its CPU and memory. | The VM is capped at 12 of 18 cores and 24 GB of 48 GB. |
| The Mac is arm64. | The VM is Ubuntu 24.04 arm64. Deploy builds stay off it: `build-release.sh` refuses anything but Linux x86_64 with Python 3.12. |
| Two PRs should run nearly in parallel. | Six runners by default: 6 slots for 8 jobs. A third [[PR]] waits for free slots. |

A **service container** is a Docker container a job declares under `services:`; the runner starts it next to the job and removes it when the job ends. A **network namespace** is the Linux kernel's per-process view of network interfaces and ports. Sharing one is what makes `localhost:<port>` reach the container.

## Candidate options

### Routing switch

`ci.yml` reads the runner label for the heavy jobs from two **repository variables**, `CI_RUNNER_SMALL` and `CI_RUNNER_LARGE`. A repository variable is a plain, non-secret value stored on the repository and readable by workflows.

- **Option A, manual variables.** `gh variable set` routes jobs to the Mac; `gh variable delete` sends them back to Ubicloud. Cost: someone has to switch back before the Mac goes down, and jobs already queued for the self-hosted label keep waiting for it.
- **Option B, a heartbeat.** The variables stay set. The VM writes the current time into a third variable, `CI_RUNNER_HEARTBEAT`, every minute. The `changes` job in `ci.yml` uses the self-hosted label only while that value is under 5 minutes old. Cost: a token with write access to the repository's variables has to live in the VM, and routing can lag the Mac's real state by up to 5 minutes.

### Dependency caches

The six runners share one home directory, `/home/runner`.

- **Option A, `actions/cache` restores** (setup-vp `cache`, setup-python `cache: pip`). Each job extracts a tarball into the cache directory. Cost: extracting into a shared cache while sibling jobs read it corrupts files.
- **Option B, the tools' native caches, shared.** pnpm store, pip cache, Playwright browsers and the vite-plus runtime live under `/home/runner`. The tools write them atomically, so sharing is safe. Cost: if a store ever breaks (a lock hash failure, a truncated `node_modules` file), it is purged by hand.

### Heartbeat token

- **Option A, a fine-grained PAT.** A PAT (personal access token) is a token that acts as a GitHub user. The fine-grained kind is limited to chosen repositories and permissions: here the organisation as resource owner, one repository, "Variables: Read and write", nothing else.
- **Option B, a classic PAT with the `repo` scope.** The fallback if the organisation does not allow fine-grained PATs.

## Decision

- Runners in an OrbStack machine `ci-runner`, Ubuntu 24.04 arm64, with Docker Engine installed inside it.
- **Routing by heartbeat** (option B). Deleting the variables stays as the manual way to force Ubicloud.
- **Native shared caches** (option B). The `actions/cache` restores are disabled on self-hosted runners in `ci.yml`.
- **Fine-grained PAT** for the heartbeat, classic PAT only as the fallback.
- Six runners, each a systemd service with its own CPU cap.

Job placement:

| Job | Label before | Local | Note |
| --- | --- | --- | --- |
| Changed paths, Claude review, monitors | `ubuntu-latest` | no | GitHub-hosted, seconds each |
| Web + Server | `ubicloud-standard-2` | yes | install, typecheck, unit tests |
| ▒▒▒▒▒▒▒▒▒▒▒▒ | `ubicloud-standard-4` | yes | pytest + postgres service container |
| Deploy scripts | `ubicloud-standard-2` | yes | script tests + postgres service container |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ | `ubicloud-standard-2` | yes | [[Playwright]] Chromium (Linux arm64 build) + postgres |
| Deploy builds | `ubuntu-latest` / `ubicloud-standard-2` | no | x86_64 only |

Each runner's systemd unit gets a **drop-in**, a file under `<unit>.d/` that overrides part of the unit, with `CPUQuota=400%`. That caps one job at 4 of the VM's 12 cores, so one job's vitest or pytest workers cannot starve the others.

Measured per-job peaks, from one CI run:

| Job step | Memory | CPU |
| --- | --- | --- |
| Web + Server typecheck | 3.0 GB RSS | 4.7 cores |
| Web + Server vitest | | 7 cores |
| ▒▒▒▒▒▒▒▒▒▒▒▒ pytest | 0.7 GB | 3.5 cores |
| Smoke build | 3.0 GB | |
| Smoke run (Chromium + Postgres) | ~1.5 GB | |

OrbStack allocates memory on demand and returns idle memory to macOS, so the 24 GB cap is a ceiling, not a reservation.

## Module breakdown

Four scripts, all run from the Mac. They act inside the VM through `orb -m ci-runner -u <user> ...`, feeding a script on stdin. Every step skips what already exists, so each script is safe to re-run.

| Script | Does | Needs |
| --- | --- | --- |
| `setup.sh` | creates and configures the VM, installs the toolchain, registers N runners as systemd services, installs the cleanup cron | `orb`, `gh` logged in as a repository admin |
| `heartbeat.sh` | stores the token in the VM, creates `CI_RUNNER_HEARTBEAT` if missing, installs the per-minute heartbeat cron | the fine-grained PAT, as a file argument or `HEARTBEAT_TOKEN` |
| `status.sh` | read-only health check: runner states, heartbeat age and routing, OrbStack limits, VM load, disk and cache sizes, last cleanup, queued jobs | `orb`, `gh` |
| `teardown.sh` | routes CI back to Ubicloud, unregisters the runners, deletes the VM (`KEEP_VM=1` keeps it) | `orb`, `gh` |

The heartbeat is a separate script because it needs a second credential. `setup.sh` uses the operator's `gh` login on the Mac. The heartbeat token is used only inside the VM, so it is stored there.

### `setup.sh` steps

The script runs under `set -Eeuo pipefail` ([[pipefail]]). After three preflight checks (`orb` present, `gh` logged in, `gh` can read the repository's runners), it runs seven steps:

1. **VM.** `orb create ubuntu:noble ci-runner`. Then set `isolated` and `isolate_network` and restart the machine. Then set `cpu 12` and `memory_mib 24576` and restart OrbStack itself, because those caps apply to OrbStack's whole VM, not to one machine.
2. **Packages.** Build tools, `libpq-dev`, `postgresql-client`, 15 `lib*` packages Playwright Chromium needs on Ubuntu 24.04, Docker Engine from Docker's apt repository, Node 22 from NodeSource.
3. **User.** `runner`, in the `docker` group, with passwordless sudo.
4. **Runner binary.** Latest `actions-runner-linux-arm64`, checked against the SHA-256 printed in the release notes, unpacked into `/home/runner/r1` to `rN`.
5. **Registration.** For each runner: a fresh registration token, `config.sh`, `svc.sh install`, the CPU drop-in, `svc.sh start`.
6. **Cleanup cron.** Writes `ci-runner-cleanup` and its cron line.
7. **Status.** Lists the runners and prints the switch commands.

A **registration token** is a token from the GitHub API that `config.sh` presents to register a runner with a repository. `setup.sh` requests a new one per runner and passes it into the VM as an environment variable:

```bash
TOKEN=$(gh api -X POST "repos/<owner>/<repo>/actions/runners/registration-token" --jq .token)
./config.sh --unattended --url "https://github.com/<owner>/<repo>" --token "$TOKEN" \
  --name "mac-mini-r$I" --labels "<label>" --work _work --replace
sudo ./svc.sh install runner
```

### Files inside the VM

| Path | Written by | Purpose |
| --- | --- | --- |
| `/etc/systemd/system/actions.runner.<owner>-<repo>.mac-mini-rN.service` | `svc.sh install` | one runner service |
| `.../<unit>.d/cpu.conf` | `setup.sh` | `CPUQuota=400%` |
| `/usr/local/bin/ci-runner-cleanup`, `/etc/cron.d/ci-runner-cleanup` | `setup.sh` | cleanup, `5 13 */3 * *` |
| `/var/log/ci-runner-cleanup.last` | cleanup | timestamp `status.sh` shows |
| `/usr/local/bin/ci-heartbeat`, `/etc/cron.d/ci-heartbeat` | `heartbeat.sh` | heartbeat every minute; log trim Sundays 04:17 |
| `/etc/ci-heartbeat.token` | `heartbeat.sh` | the PAT, root, mode 600 |
| `/var/log/ci-heartbeat.log` | heartbeat | failures only, trimmed to 500 lines weekly |

## Isolation

The VM is created with OrbStack's `isolated` and `isolate_network` settings. Together they remove the Mac filesystem mount (`/mnt/mac`), the `mac` helper commands, and access to the host network. Internet access stays, which the runners need to reach GitHub.

![Topology and isolation boundary](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.topology.svg)

### Probe before isolation

The probe of 2026-10-13 ran inside the VM before isolation was set. It shows what a job could have seen. `orb config show` at that point read `machine.ci-runner.isolated: false`.

| Visible to user `runner` | Probe evidence |
| --- | --- |
| The Mac home directory | `/mnt/mac/Users/<user>` listed and readable; a listing that includes `authorized_keys` |
| Mac paths, read-write | `/mnt/mac`, `/Applications`, `/Library`, `/Users`, `/Volumes`, `/private`, all `type virtiofs (rw,relatime)` |
| Other OrbStack machines' Docker volumes | `/mnt/machines` (tmpfs, read-only) holding btrfs mounts of other machines' volumes, including database volumes and a bot's key and home volumes |
| OrbStack limits | `cpu: 18`, `memory_mib: 16384`: the caps were not yet set |

**virtiofs** is the shared-filesystem protocol OrbStack uses to expose Mac directories inside a Linux machine. Every Mac path in the table arrived that way.

### Check after isolation

```bash
orb config get machine.ci-runner.isolated      # true
orb -m ci-runner -u runner ls /mnt/mac         # must be empty or missing
mount | grep -ci virtiofs                      # inside the VM: must print 0
```

==The files hold no probe taken after isolation, and the documented check counts virtiofs mounts only.== It would not show `/mnt/machines`, which the probe found as tmpfs and btrfs mounts. Whether isolation removes those is not recorded.

### Inside the boundary

- `runner` has passwordless sudo and is in the `docker` group. Inside the VM a job can act as root. The isolation boundary is the VM edge, not the user account.
- The heartbeat token is root-only (mode 600), but a job can read it through sudo. The token's scope limits the exposure: it covers the variables of one repository.
- The VM's CPU and memory caps protect the Mac. The per-unit `CPUQuota` protects jobs from each other.

## Data flow

Routing is decided per run, from the heartbeat's age.

![Heartbeat routing](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.routing.svg)

`ci-heartbeat` behaves like this:

- If no `actions.runner.*` systemd unit is active, it exits without sending anything. Stopping the runners is enough to let the heartbeat go stale.
- Otherwise it sends a `PATCH` with the current epoch seconds and expects HTTP 204.
- `curl -m 15 --retry 3 --retry-delay 3 --retry-all-errors` keeps the retries inside one minute, because GitHub's API fails transiently.
- A non-204 response is logged with a UTC timestamp to `/var/log/ci-heartbeat.log`. The cron line discards stdout and stderr, so the log file is the only record.
- The script runs with `set -u`, not `set -e`, and reports failure through the log and its exit code.

```bash
code=$(curl -sS -o /dev/null -w '%{http_code}' -m 15 --retry 3 --retry-delay 3 --retry-all-errors \
  -X PATCH -H "Authorization: Bearer $(cat /etc/ci-heartbeat.token)" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<owner>/<repo>/actions/variables/CI_RUNNER_HEARTBEAT \
  -d "{\"name\":\"CI_RUNNER_HEARTBEAT\",\"value\":\"$(date +%s)\"}")
```

`status.sh` applies the same threshold: an age under 300 seconds prints "CI routes to the Mac mini", otherwise "CI routes to Ubicloud (heartbeat stale)".

## Lifecycle

![Runner lifecycle](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.lifecycle.svg)

| Transition | Command | Effect on routing |
| --- | --- | --- |
| create | `bash setup.sh` (`RUNNERS=2 bash setup.sh` for two) | runners online but idle |
| route here | `gh variable set CI_RUNNER_SMALL` and `CI_RUNNER_LARGE` to the label, then `bash heartbeat.sh <token-file>` | heavy jobs run in the VM |
| pause | `orb stop ci-runner` | runners offline, heartbeat stale, Ubicloud after 5 min |
| resume | `orb start ci-runner` | services come up with the VM |
| force Ubicloud | `gh variable delete CI_RUNNER_SMALL` and `CI_RUNNER_LARGE` | immediate for new runs |
| unregister only | `KEEP_VM=1 bash teardown.sh` | variables gone, VM kept |
| remove | `bash teardown.sh` | variables gone, runners unregistered, VM deleted |
| full reset | `teardown.sh` then `setup.sh` | about 15 minutes |

### Heartbeat failure modes

The heartbeat stops in two documented cases: the VM or the Mac is down, or the runner services are stopped. A third follows from the scripts. The probe's token check returned an expiration header about a year ahead, and nothing renews the token. When it lapses, the `PATCH` fails, the failure is logged, and routing falls back the same way.

Two limits remain after a fallback:

- Jobs already queued for the self-hosted label stay queued until cancelled or re-run.
- A running job fails about 10 minutes after its runner stops answering. A re-run then goes to Ubicloud.

The probe also recorded the host's power state: system sleep off (`sleep 0`, held by `caffeinate`), `autorestart 1`, and OrbStack's `power.pause_in_sleep: true`.

### Teardown order

`teardown.sh` removes routing before it removes runners:

1. Delete `CI_RUNNER_SMALL`, `CI_RUNNER_LARGE` and `CI_RUNNER_HEARTBEAT`. CI is back on Ubicloud from here.
2. Remove the heartbeat cron, script and token from the VM.
3. For each `/home/runner/rN`: request a **remove token** (the token `config.sh remove` needs to unregister a runner), stop and uninstall the service, run `config.sh remove`.
4. Delete through the API any runner still listed whose name starts with `mac-mini-`. This catches runners whose VM is already gone.
5. `orb delete -f ci-runner`, unless `KEEP_VM=1`.

Step 4 matches by host-tag prefix, the same move as [[2026-06-19-teardown-by-prefix-instead-of-exact-name]].

### Cleanup and disk

`ci-runner-cleanup` runs every 3 days at 13:05 PT (04:00 Beijing). It never touches a runner whose `Runner.Worker` process is running, and it prunes the shared stores only when no job runs at all, so it is safe at any hour.

| Action | Condition |
| --- | --- |
| `docker system prune -af --filter until=168h` | always |
| delete `rN/_work/_temp/*` | runner idle |
| delete `rN/_diag` files older than 14 days | runner idle |
| `docker volume prune -af` | no job running |
| `pnpm store prune` | no job running |
| delete Playwright browser directories older than 30 days | no job running |

Manual run: `orb -m ci-runner -u root /usr/local/bin/ci-runner-cleanup`.

The volume prune was added after the probe. At probe time the cleanup script had only the image prune and the `_temp` delete, and `docker system df` showed 8 local volumes (640.6 MB, 100% reclaimable) with no containers. The script's comment gives the cause: each CI job leaves one anonymous Postgres volume behind.

| Item | README estimate | Probe, 10/13 |
| --- | --- | --- |
| VM image | 2-3 GB after setup | 14.2 GB (`orb list`) |
| Checkout per runner, `rN/_work` | ~1.5 GB, reused across jobs | 2.2-2.5 GB (r1-r3), 0 (r4) |
| Playwright Chromium, `~/.cache/ms-playwright` | ~400 MB | 956 MB |
| pnpm store | | 1.7 GB |
| Docker images | ~100 MB | 411.7 MB |

`~/.cache/pip`, `~/.local/share/pnpm` and `~/.cache/ms-playwright` are safe to delete by hand; the next job downloads again. The `_work` checkouts are not: they are reused, and deleting them only slows the next job.

## Verification

First run, 2026-10-13 21:03Z:

| Job | Result |
| --- | --- |
| Web + Server | passed, 66 s |
| ▒▒▒▒▒▒▒▒▒▒▒▒ | passed, 109 s |
| Deploy scripts | passed, 92 s |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ | failed: Chromium's shared libraries missing |

`playwright-core install chromium` downloads the browser only, not the system libraries it links against. The fix was to apt-install the 15 `lib*` packages, now part of `setup.sh` step 2. The probe's runner logs (`Worker_20261013-210316-utc.log` and two later) match that run.

## Out of scope (YAGNI)

- **Deploy builds.** `build-release.sh` accepts only Linux x86_64 with Python 3.12; the VM is arm64.
- **Light jobs.** They take seconds on GitHub-hosted runners and stay there.
- **Re-routing queued jobs.** A job already queued for the self-hosted label waits for it; switching routing does not move it. Cancel and re-run.
- **`actions/cache` on self-hosted runners.** Disabled in `ci.yml` in favour of the shared native caches.
- **Hand-scheduled maintenance.** The cleanup cron runs by itself and the runner binary updates itself; `status.sh` is the tool for when something looks off.

## Lessons and small tricks

- A routing value that has to be kept fresh fails safe. Every way the host can fail (power, VM, services, token) ends the refreshes, and the workflow falls back without anyone switching it.
- Probe what a VM can see before running untrusted code in it, and make the after-check cover every mount type the probe found, not only the one that prompted it.
- Several runners on one home directory can share caches that the tools write atomically, but not caches restored by extracting a tarball.
- Some OrbStack settings apply only after a restart of OrbStack itself; `setup.sh` reads each value with `orb config get` and restarts only when it changed. See [[config-on-disk-is-not-config-in-effect]].
- A cron script whose output is discarded logs its own failures to a file. See [[cron-script-silent-death-under-set-e]].

## Related

- [[2026-06-19-teardown-by-prefix-instead-of-exact-name]]
- [[config-on-disk-is-not-config-in-effect]]
- [[cron-script-silent-death-under-set-e]]
- [[2026-07-07-cron-job-appears-untriggered-script-died-silently]]
- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[2026-10-26-self-hosted-ci-on-shared-mac-mini]]
- [[CI-CD]] · [[PR]] · [[Playwright]] · [[pipefail]]
