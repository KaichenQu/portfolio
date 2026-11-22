---
type: case-design
date: 2026-10-13
tags: [design, infra, ci, github-actions, orbstack, docker, macos]
status: solved
publish: true
---
# 在隔离的 OrbStack VM 里跑 Mac mini CI runner

某个应用仓库的四个重 [[zh/Glossary/CI-CD|CI]] job 从 Ubicloud 迁到了一台 Mac mini 上的六个 self-hosted GitHub Actions runner。**self-hosted runner** 是装在自己机器上的 GitHub runner 程序（`actions-runner`），专门接带有对应 label 的 job；label 是 job 在 `runs-on` 里写的 runner 标签。这些 runner 跑在 OrbStack VM 里，不直接跑在 macOS 上。**OrbStack** 是 macOS 上跑轻量 Linux 虚拟机和 Docker 的工具。

设计定下三个决定：

1. runner 放进 Linux，因为 job 要用 Docker service container。
2. VM 跟 Mac 的文件和网络隔开，因为 CI 会跑别人的代码。
3. ==每分钟一次的 heartbeat（定时写入的存活信号）决定 job 去哪跑；Mac 没响应时，CI 自动退回 Ubicloud。==

首次运行在 2026-10-13 21:03Z，四个 job 里三个一次过。

## 背景与约束

迁移前，重 job 跑在 Ubicloud 的 runner 上（label 是 `ubicloud-standard-2` 和 `ubicloud-standard-4`，Ubicloud 是第三方托管 runner 服务商），轻 job 跑在 GitHub 托管的 `ubuntu-latest` 上。

| 约束 | 因此 |
| --- | --- |
| job 声明了 `services: postgres`。runner 只在 Linux 支持 service container，而且 Docker daemon 要跟 job 在同一个 network namespace 里，job 才能用 `localhost:<port>` 连 postgres。 | 必须用 Linux，在 Mac 上就得开 VM。 |
| CI 会跑别人的代码。 | VM 不能看到 Mac 的文件，也不能碰主机网络。 |
| Mac 自己要留三分之一 CPU 和内存。 | VM 上限设成 18 核里的 12 核、48 GB 里的 24 GB。 |
| Mac 是 arm64。 | VM 用 Ubuntu 24.04 arm64。部署构建不放上面：`build-release.sh` 只认 Linux x86_64 加 Python 3.12。 |
| 两个 PR 要能大致并行。 | 默认六个 runner：8 个 job 分 6 个槽位，第三个 [[zh/Glossary/PR\|PR]] 等空槽。 |

**service container** 是 job 在 `services:` 下声明的 Docker 容器，runner 在 job 旁边拉起它，job 结束就删掉。**network namespace** 是 Linux 内核给进程隔离出的网络接口和端口视图，共用同一个 namespace 才能靠 `localhost:<port>` 连到容器。

## 候选方案

### 路由开关

`ci.yml` 从两个**仓库变量** `CI_RUNNER_SMALL` 和 `CI_RUNNER_LARGE` 读重 job 的 runner label。仓库变量存在仓库上，不是 secret，workflow 可以直接读。

- **方案 A，手动改变量。** `gh variable set` 把 job 切到 Mac，`gh variable delete` 切回 Ubicloud。代价：Mac 停机前必须有人手动切回，而且已经排队等 self-hosted label 的 job 会一直等着。
- **方案 B，heartbeat。** 变量一直留着，VM 每分钟把当前时间写进第三个变量 `CI_RUNNER_HEARTBEAT`。`ci.yml` 里的 `changes` job 只有在这个值不到 5 分钟时才用 self-hosted label。代价：VM 里得放能写仓库变量的 token，路由状态最多滞后 Mac 真实状态 5 分钟。

### 依赖缓存

六个 runner 共用 `/home/runner` 这个 home 目录。

- **方案 A，`actions/cache` 恢复**（setup-vp 的 `cache`、setup-python 的 `cache: pip`）。每个 job 都把 tarball 解压进缓存目录。代价：这边往共享目录解压，那边别的 job 正在读，文件会写坏。
- **方案 B，共享工具自带缓存。** pnpm store、pip 缓存、Playwright 浏览器和 vite-plus 运行时都放在 `/home/runner` 下。这些工具写缓存都是原子操作，可以安全共享。代价：哪天某个 store 坏了（lock hash 校验失败、`node_modules` 里出现截断文件），得手动清。

### Heartbeat token

- **方案 A，fine-grained PAT。** PAT（personal access token）代表 GitHub 用户身份，fine-grained 版可以精确限定仓库和权限：资源所有者选组织，只勾一个仓库，只开「Variables: Read and write」，其余全关。
- **方案 B，带 `repo` scope 的 classic PAT。** 组织不让用 fine-grained PAT 时的备选。

## 决定

- runner 跑在 OrbStack 机器 `ci-runner` 里，系统 Ubuntu 24.04 arm64，内装 Docker Engine。
- **用 heartbeat 路由**（方案 B），删变量仍保留为强制切回 Ubicloud 的手动开关。
- **共享工具自带缓存**（方案 B），`ci.yml` 在 self-hosted runner 上关掉 `actions/cache` 恢复。
- heartbeat 用 **fine-grained PAT**，classic PAT 只作备选。
- 六个 runner，每个跑成独立的 systemd 服务，各自限 CPU。

Job 分配：

| Job | 原 label | 本地 | 说明 |
| --- | --- | --- | --- |
| Changed paths、Claude review、monitors | `ubuntu-latest` | 否 | GitHub 托管，每个几秒 |
| Web + Server | `ubicloud-standard-2` | 是 | 安装、typecheck、单元测试 |
| ▒▒▒▒▒▒▒▒▒▒▒▒ | `ubicloud-standard-4` | 是 | pytest + postgres service container |
| Deploy scripts | `ubicloud-standard-2` | 是 | 脚本测试 + postgres service container |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ | `ubicloud-standard-2` | 是 | [[zh/Glossary/Playwright\|Playwright]] Chromium（Linux arm64 版）+ postgres |
| Deploy builds | `ubuntu-latest` / `ubicloud-standard-2` | 否 | 只支持 x86_64 |

每个 runner 的 systemd unit 都配了 **drop-in**（放在 `<unit>.d/` 下、覆盖部分 unit 配置的文件），写上 `CPUQuota=400%`。这样单个 job 最多占 VM 12 核里的 4 核，某个 job 的 vitest 或 pytest worker 抢不光别的 job 的 CPU。

一次 CI 运行里测到的单 job 峰值：

| Job 步骤 | 内存 | CPU |
| --- | --- | --- |
| Web + Server typecheck | 3.0 GB RSS | 4.7 核 |
| Web + Server vitest | | 7 核 |
| ▒▒▒▒▒▒▒▒▒▒▒▒ pytest | 0.7 GB | 3.5 核 |
| Smoke build | 3.0 GB | |
| Smoke run（Chromium + Postgres） | ~1.5 GB | |

OrbStack 按需分内存，空闲内存会还给 macOS，所以 24 GB 是上限，不是常驻预留。

## 模块划分

四个脚本都在 Mac 上执行，靠 `orb -m ci-runner -u <user> ...` 进 VM 干活，脚本内容从 stdin 传进去。每一步都会跳过已存在项，可以放心重跑。

| 脚本 | 做什么 | 需要 |
| --- | --- | --- |
| `setup.sh` | 建并配好 VM，装工具链，把 N 个 runner 注册成 systemd 服务，装清理 cron | `orb`，以仓库管理员登录的 `gh` |
| `heartbeat.sh` | 把 token 写进 VM，缺 `CI_RUNNER_HEARTBEAT` 就创建，装每分钟一次的 heartbeat cron | fine-grained PAT，用文件参数或 `HEARTBEAT_TOKEN` 传入 |
| `status.sh` | 只读健康检查：runner 状态、heartbeat 距今多久和当前路由、OrbStack 限额、VM 负载、磁盘和缓存大小、上次清理时间、排队中的 job | `orb`、`gh` |
| `teardown.sh` | 把 CI 切回 Ubicloud，注销 runner，删 VM（`KEEP_VM=1` 时保留） | `orb`、`gh` |

heartbeat 拆成单独脚本是因为它要用第二份凭据：`setup.sh` 用操作者 Mac 上的 `gh` 登录，heartbeat token 只在 VM 里用，就存在 VM 里。

### `setup.sh` 步骤

脚本跑在 `set -Eeuo pipefail` 下（[[zh/Glossary/pipefail|pipefail]]：管道任一段失败，整条管道就算失败）。先过三项预检（`orb` 存在、`gh` 已登录、`gh` 能读仓库 runner），再按顺序走七步：

1. **VM。** `orb create ubuntu:noble ci-runner`。打开 `isolated` 和 `isolate_network` 并重启这台机器；再设 `cpu 12` 和 `memory_mib 24576`，重启 OrbStack 本身（这两个限额管的是 OrbStack 整个 VM，不只是某台机器）。
2. **软件包。** 构建工具、`libpq-dev`、`postgresql-client`、Playwright Chromium 在 Ubuntu 24.04 上要的 15 个 `lib*` 包、Docker 官方 apt 仓库的 Docker Engine、NodeSource 的 Node 22。
3. **用户。** `runner`，进 `docker` 组，免密 sudo。
4. **Runner 程序。** 拉最新 `actions-runner-linux-arm64`，按 release notes 里的 SHA-256 校验，解压到 `/home/runner/r1` 到 `rN`。
5. **注册。** 每个 runner 依次申请新 registration token，跑 `config.sh`、`svc.sh install`，加 CPU drop-in，`svc.sh start`。
6. **清理 cron。** 写入 `ci-runner-cleanup` 和对应 cron 行。
7. **状态。** 列出 runner，打印切换命令。

**registration token** 是从 GitHub API 领的令牌，`config.sh` 凭它把 runner 注册到仓库。`setup.sh` 给每个 runner 现申请一个，靠环境变量传进 VM：

```bash
TOKEN=$(gh api -X POST "repos/<owner>/<repo>/actions/runners/registration-token" --jq .token)
./config.sh --unattended --url "https://github.com/<owner>/<repo>" --token "$TOKEN" \
  --name "mac-mini-r$I" --labels "<label>" --work _work --replace
sudo ./svc.sh install runner
```

### VM 内的文件

| 路径 | 写入者 | 用途 |
| --- | --- | --- |
| `/etc/systemd/system/actions.runner.<owner>-<repo>.mac-mini-rN.service` | `svc.sh install` | 单个 runner 服务 |
| `.../<unit>.d/cpu.conf` | `setup.sh` | `CPUQuota=400%` |
| `/usr/local/bin/ci-runner-cleanup`、`/etc/cron.d/ci-runner-cleanup` | `setup.sh` | 清理，`5 13 */3 * *` |
| `/var/log/ci-runner-cleanup.last` | 清理脚本 | `status.sh` 显示的时间戳 |
| `/usr/local/bin/ci-heartbeat`、`/etc/cron.d/ci-heartbeat` | `heartbeat.sh` | 每分钟一次 heartbeat；每周日 04:17 裁剪日志 |
| `/etc/ci-heartbeat.token` | `heartbeat.sh` | PAT，属主 root，权限 600 |
| `/var/log/ci-heartbeat.log` | heartbeat | 只记失败，每周裁到 500 行 |

## 隔离

建 VM 时打开了 OrbStack 的 `isolated` 和 `isolate_network`，拿掉了 Mac 文件系统挂载（`/mnt/mac`）、`mac` 辅助命令和对宿主机网络的访问，只留着外网访问让 runner 连 GitHub。

![运行器、心跳和 Docker 服务都在隔离的 OrbStack 虚拟机中，可访问 GitHub，无法访问 Mac 文件系统或宿主网络。](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.topology.svg)

### 隔离前探测

2026-10-13 的探测是在开隔离前在 VM 里跑的，用来看 job 原本能摸到什么。当时 `orb config show` 显示 `machine.ci-runner.isolated: false`。

| 用户 `runner` 能看到的 | 探测证据 |
| --- | --- |
| Mac 的 home 目录 | `/mnt/mac/Users/<user>` 可列可读，里面能看到 `authorized_keys` |
| 可读写的 Mac 路径 | `/mnt/mac`、`/Applications`、`/Library`、`/Users`、`/Volumes`、`/private`，全是 `type virtiofs (rw,relatime)` |
| 其他 OrbStack 机器的 Docker volume | `/mnt/machines`（tmpfs，只读）里挂着其他机器 volume 的 btrfs，含数据库 volume 以及某个 bot 的密钥和 home volume |
| OrbStack 限额 | `cpu: 18`、`memory_mib: 16384`，上限当时还没设 |

**virtiofs** 是 OrbStack 把 Mac 目录共享给 Linux 机器用的文件系统协议，表里每个 Mac 路径都是这么挂进来的。

### 隔离后检查

```bash
orb config get machine.ci-runner.isolated      # true
orb -m ci-runner -u runner ls /mnt/mac         # must be empty or missing
mount | grep -ci virtiofs                      # inside the VM: must print 0
```

==现有材料里没有隔离后的探测结果，文档写的检查也只数 virtiofs 挂载。== 这查不到 `/mnt/machines`，而探测看到那边是 tmpfs 和 btrfs 挂载。隔离有没有撤掉这些挂载，没有记录。

### 边界之内

- `runner` 有免密 sudo，也在 `docker` 组里，VM 里 job 可以拿到 root。隔离边界画在 VM 边缘，不在用户账号。
- heartbeat token 只有 root 可读（权限 600），job 借 sudo 照样能读。暴露面靠 token 的 scope 兜住：它只能改这一个仓库的变量。
- VM 的 CPU 和内存限额护着 Mac，每个 unit 的 `CPUQuota` 防止 job 互相挤占。

## 数据流

每次 CI 触发时，按 heartbeat 距今多久决定路由。

![运行器心跳未满 5 分钟且标签已设置时，CI 才会把重任务分配给虚拟机。](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.routing.svg)

`ci-heartbeat` 的行为：

- 没有任何 `actions.runner.*` systemd unit 在跑时，直接退出不发请求。停掉 runner 服务就能让 heartbeat 自然过期。
- 否则发 `PATCH` 写入当前 epoch 秒数，预期返回 HTTP 204。
- `curl -m 15 --retry 3 --retry-delay 3 --retry-all-errors` 把重试压在一分钟内，因为 GitHub API 偶尔会失败。
- 返回不是 204 时带 UTC 时间戳写入 `/var/log/ci-heartbeat.log`。cron 行丢掉了 stdout 和 stderr，这个日志是唯一记录。
- 脚本开 `set -u` 不开 `set -e`，靠日志和退出码报失败。

```bash
code=$(curl -sS -o /dev/null -w '%{http_code}' -m 15 --retry 3 --retry-delay 3 --retry-all-errors \
  -X PATCH -H "Authorization: Bearer $(cat /etc/ci-heartbeat.token)" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/<owner>/<repo>/actions/variables/CI_RUNNER_HEARTBEAT \
  -d "{\"name\":\"CI_RUNNER_HEARTBEAT\",\"value\":\"$(date +%s)\"}")
```

`status.sh` 用同一个阈值：距今不到 300 秒打印「CI routes to the Mac mini」，否则打印「CI routes to Ubicloud (heartbeat stale)」。

## 生命周期

![虚拟机运行器注册后即可接单，启用路由后接收重任务，停机后新运行回退到 Ubicloud。](../../Diagrams/2026-10-13-mac-mini-ci-runners-in-an-isolated-orbstack-vm.lifecycle.svg)

| 状态切换 | 命令 | 对路由的影响 |
| --- | --- | --- |
| 创建 | `bash setup.sh`（两个 runner 用 `RUNNERS=2 bash setup.sh`） | runner 在线但空闲 |
| 切到这里 | `gh variable set CI_RUNNER_SMALL` 和 `CI_RUNNER_LARGE` 设成该 label，再跑 `bash heartbeat.sh <token-file>` | 重 job 进 VM 跑 |
| 暂停 | `orb stop ci-runner` | runner 离线，heartbeat 过期，5 分钟后退回 Ubicloud |
| 恢复 | `orb start ci-runner` | 服务随 VM 一起起来 |
| 强制走 Ubicloud | `gh variable delete CI_RUNNER_SMALL` 和 `CI_RUNNER_LARGE` | 新运行立刻生效 |
| 只注销 | `KEEP_VM=1 bash teardown.sh` | 删变量，留 VM |
| 移除 | `bash teardown.sh` | 删变量、注销 runner、删 VM |
| 完全重置 | 先 `teardown.sh` 再 `setup.sh` | 约 15 分钟 |

### Heartbeat 失效

文档记了 heartbeat 停掉的两种情况：VM 或 Mac 宕机，或者 runner 服务停了。看脚本还能推出第三种：探测检查 token 时返回的过期头大约在一年后，而且没有任何逻辑给它续期。token 一过期，`PATCH` 失败记入日志，路由同样退回 Ubicloud。

退回后还有两个限制：

- 已经排队等 self-hosted label 的 job 会继续留在队列里，只能手动取消或重跑。
- 正在跑的 job 会在 runner 失联约 10 分钟后失败，重跑时会切去 Ubicloud。

探测也记下了主机电源状态：关了系统睡眠（`sleep 0`，由 `caffeinate` 维持）、`autorestart 1`，以及 OrbStack 的 `power.pause_in_sleep: true`。

### 拆除顺序

`teardown.sh` 先撤路由，再撤 runner：

1. 删掉 `CI_RUNNER_SMALL`、`CI_RUNNER_LARGE` 和 `CI_RUNNER_HEARTBEAT`，CI 从这步起回到 Ubicloud。
2. 清掉 VM 里的 heartbeat cron、脚本和 token。
3. 对每个 `/home/runner/rN`：申请 **remove token**（`config.sh remove` 注销 runner 要用的令牌），停掉并卸载服务，跑 `config.sh remove`。
4. 调 API 删掉列表里名字以 `mac-mini-` 开头的残留 runner，VM 已经删掉的旧 runner 靠这步清。
5. `orb delete -f ci-runner`，设了 `KEEP_VM=1` 时跳过。

第 4 步按主机标签前缀匹配，跟 [[zh/Cases/Design/2026-06-19-teardown-by-prefix-instead-of-exact-name|2026-06-19-teardown-by-prefix-instead-of-exact-name]] 同一个套路。

### 清理与磁盘

`ci-runner-cleanup` 每 3 天在 13:05 PT（北京时间 04:00）跑一次。只要 runner 还有 `Runner.Worker` 进程在跑就不碰，共享 store 也只在完全没 job 时才清，随时跑都安全。

| 动作 | 条件 |
| --- | --- |
| `docker system prune -af --filter until=168h` | 总是执行 |
| 删除 `rN/_work/_temp/*` | runner 空闲 |
| 删除 `rN/_diag` 里超过 14 天的文件 | runner 空闲 |
| `docker volume prune -af` | 没有 job 在跑 |
| `pnpm store prune` | 没有 job 在跑 |
| 删除超过 30 天的 Playwright 浏览器目录 | 没有 job 在跑 |

手动执行：`orb -m ci-runner -u root /usr/local/bin/ci-runner-cleanup`。

volume 清理是探测完补上的。探测时脚本只有 image prune 和 `_temp` 清理，`docker system df` 查出 8 个本地 volume（640.6 MB，100% 可回收），没有容器。脚本注释写着原因：每个 CI job 都会留下一个匿名 Postgres volume。

| 项目 | README 估算 | 探测，10/13 |
| --- | --- | --- |
| VM 镜像 | setup 后 2-3 GB | 14.2 GB（`orb list`） |
| 每个 runner 的 checkout，`rN/_work` | ~1.5 GB，多 job 复用 | 2.2-2.5 GB（r1-r3），0（r4） |
| Playwright Chromium，`~/.cache/ms-playwright` | ~400 MB | 956 MB |
| pnpm store | | 1.7 GB |
| Docker 镜像 | ~100 MB | 411.7 MB |

`~/.cache/pip`、`~/.local/share/pnpm` 和 `~/.cache/ms-playwright` 可以手动删，下个 job 会重下；`_work` 里的 checkout 别删，后续 job 复用，删了只会拖慢下一个 job。

## 验证

首次运行，2026-10-13 21:03Z：

| Job | 结果 |
| --- | --- |
| Web + Server | 通过，66 s |
| ▒▒▒▒▒▒▒▒▒▒▒▒ | 通过，109 s |
| Deploy scripts | 通过，92 s |
| ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ | 失败：缺 Chromium 共享库 |

`playwright-core install chromium` 只下浏览器，不装它依赖的系统库。修法是用 apt 装上那 15 个 `lib*` 包，现已写进 `setup.sh` 第 2 步。探测拿到的 runner 日志（`Worker_20261013-210316-utc.log` 及后续两份）和这次运行吻合。

## 不做的事（YAGNI）

YAGNI 是 You Aren't Gonna Need It，眼下用不上的就不做。

- **部署构建。** `build-release.sh` 只认 Linux x86_64 加 Python 3.12，VM 是 arm64。
- **轻 job。** 在 GitHub 托管 runner 上几秒跑完，继续留在那里。
- **给排队中的 job 改道。** 已排队等 self-hosted label 的 job 切路由挪不动，只能取消重跑。
- **self-hosted runner 上的 `actions/cache`。** `ci.yml` 里关掉了，换共享工具自带缓存。
- **人工定期维护。** 清理 cron 自己跑，runner 程序自己更新，看着不对再跑 `status.sh`。

## 经验与技巧

- 需要持续刷新的路由值天然故障安全：主机断电、VM 挂、服务停或 token 过期，刷新一断，workflow 不用人切就退回备选。
- 在 VM 里跑不受信任的代码前，先探测它能看到什么；隔离后的检查要盖住探测出的每一种挂载类型，别只查引出这次检查的那一种。
- 多 runner 共用 home 目录时，只能共享工具原子写入的缓存，不能共享靠解压 tarball 恢复的缓存。
- 部分 OrbStack 设置要重启 OrbStack 本身才生效；`setup.sh` 用 `orb config get` 读当前值，有变化才重启。参见 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- cron 行把输出丢掉的脚本，得自己把失败写进日志文件。参见 [[zh/Agents/cron-script-silent-death-under-set-e|cron-script-silent-death-under-set-e]]。

## 相关

- [[zh/Cases/Design/2026-06-19-teardown-by-prefix-instead-of-exact-name|2026-06-19-teardown-by-prefix-instead-of-exact-name]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Agents/cron-script-silent-death-under-set-e|cron-script-silent-death-under-set-e]]
- [[zh/Cases/Debug/2026-07-07-cron-job-appears-untriggered-script-died-silently|2026-07-07-cron-job-appears-untriggered-script-died-silently]]
- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]
- [[zh/Cases/Design/2026-10-26-self-hosted-ci-on-shared-mac-mini|2026-10-26-self-hosted-ci-on-shared-mac-mini]]
- [[zh/Glossary/CI-CD|CI-CD]] · [[zh/Glossary/PR|PR]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/pipefail|pipefail]]
