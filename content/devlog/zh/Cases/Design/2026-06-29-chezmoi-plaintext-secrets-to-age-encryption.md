---
type: case-design
date: 2026-06-29
tags: [design, infra, chezmoi, git, security]
status: solved
---
# chezmoi 仓库里的明文 API key 迁到 age 加密

## 背景与约束

本来想跑 `chezmoi status` 查本地改动、同步回 dotfiles 源仓库，结果发现本地有 5 个文件比源仓库新，源仓库的 git 工作树却是干净的。`chezmoi diff` 显示本地 `.zshrc` 多了一行 `APIROUTER_API_KEY`，顺带翻出源仓库的 `dot_zshrc` 一直明文存着 `DEEPSEEK_API_KEY` 和 `ODYSSEUS_API_TOKEN`。

用 `gh repo view` 确认 `github.com:KaichenQu/dotfiles.git` 是私有仓库，没有正在发生的公开泄露，但 git 历史里的明文 key 始终是隐患。

约束：

- 只有 1 台 macOS 机器，不想为此装一堆工具。
- key 要跟着 dotfiles 走，换机器能恢复。
- `.zshrc` 大部分是普通配置，只有 3 行是 key。整份文件变成密文、没法看 diff，不能接受。

## 候选方案

有 3 个可行方向：

### 方案 A：macOS 钥匙串加 chezmoi 模板

- 做法：用 `security add-generic-password` 把 key 存进登录钥匙串，在 `dot_zshrc.tmpl` 里用 chezmoi 内置 `keyring` 函数读取。
- 好处：系统原生支持，不用多装工具。
- 代价：key 不跟仓库走，换机器得重新填钥匙串，也没有备份介质。

### 方案 B：age 加密

- 做法：`brew install age`，生成 age 密钥对，在 chezmoi 配 `encryption = "age"`，key 以密文进仓库，age 私钥留在本地。
- 好处：密文随仓库同步，换机器只要有 age 私钥就能解开，chezmoi 原生支持。
- 代价：多装个工具，还得另行保管 age 私钥。

### 方案 C：拆到 `~/.zshrc.local`，让 chezmoi 忽略

- 做法：key 挪到本地文件，`.zshrc` 里 source 它，`.chezmoiignore` 排除掉。
- 好处：改动最小，key 不进 git。
- 代价：脱离 chezmoi 管理，换机器要手动重建，本地仍是明文。

## 决定

==选方案 B，用 age 加密。== 拍板的条件是「key 要跟仓库走，换机器能恢复」。A 和 C 都把 key 留在单机上，既不随仓库同步也没备份；B 把密文放进仓库，只需单独留好 age 私钥，正好满足要求。多装 `age` 可以接受。

历史里已经暴露过的旧 key，选择重写历史（`git filter-repo`），没重新签发。代价见下文「未做事项」。

## 实现

只想加密文件里的几行，其余照常保留，所以没用 `chezmoi add --encrypt`（它会把整份 `.zshrc` 加密）。把 3 行 `export` 拆成独立加密片段，模板渲染时解密拼回去：

```bash
# 1. Tooling and keys
brew install age git-filter-repo
age-keygen -o ~/.config/chezmoi/key.txt    # private key, chmod 600, outside the source dir
# chezmoi.toml: encryption="age" + [age] identity/recipient(public key)

# 2. Encrypt the three keys into a single fragment
chezmoi encrypt secrets.sh > ~/.local/share/chezmoi/encrypted_secrets.sh.age

# 3. Templatize dot_zshrc: drop the three plaintext lines, append the decrypt
git mv dot_zshrc dot_zshrc.tmpl
# {{ include "encrypted_secrets.sh.age" | decrypt -}}

# 4. Check the render, then apply
chezmoi cat ~/.zshrc   # confirm the three keys decrypt correctly
chezmoi apply ~/.zshrc
```

渲染时的数据流：

```mermaid
flowchart LR
  K["~/.config/chezmoi/key.txt<br/>age 私钥（不进 git）"]
  E["encrypted_secrets.sh.age<br/>密文（存于仓库）"]
  T["dot_zshrc.tmpl<br/>include | decrypt"]
  Z["~/.zshrc<br/>明文 export"]
  E --> T
  K -. 解密 .-> T
  T -- chezmoi apply --> Z
```

## 弯路：缺失的 pathspec 让整次 git add 失效

跑完 `git mv dot_zshrc dot_zshrc.tmpl`，习惯性地把新旧文件名写进了同一条 add：

```
git add dot_zshrc dot_zshrc.tmpl encrypted_secrets.sh.age
# fatal: pathspec 'dot_zshrc' did not match any files
```

`dot_zshrc` 已经改名，旧路径不存在。==这一个匹配不到的 pathspec 让整条 `git add` 报 fatal，另外两个文件也没暂存。== 没留意那行 fatal 就直接提交了，提交里只剩 `git mv` 留在 index 里的旧内容，明文还在，加密文件没进去。直到跑 `git show HEAD:dot_zshrc.tmpl | grep` 才发现明文还在。

修法是单独跑 `git add dot_zshrc.tmpl encrypted_secrets.sh.age` 再 `git commit --amend`，最后用 `git show HEAD:` 核对模板里没了明文，用 `git ls-tree HEAD` 确认加密文件已入库。

还有个小坑：`git filter-repo` 跑完会删掉 `origin` remote，防误推回原仓库。先记下 URL，跑完用 `git remote add` 加回再 force push。

清理历史并验证：

```bash
git filter-repo --replace-text replacements.txt --force   # three plaintext values ==> ***REMOVED***
git log --all -S '<key string>' --oneline | wc -l         # all three should be 0
git push --force origin main
```

重写了全部 17 个 commit。逐个搜 3 个明文字符串，结果全是 0 个 commit，force push 完成。

## 未做事项（YAGNI）

- 没重新签发 key。重写历史和 force push 只管得到分支，==旧 commit 在一段时间内仍可能按旧 SHA 从 GitHub 访问到==，这些值确实曾以明文存在过。想彻底放心只能轮换 key，这里明确接受了剩余风险。
- `.claude/plugins/*.json` 这类日常状态变动没进提交，只改了 key 相关文件。
- 没接钥匙串或 1Password CLI。单机加 age 已经够用，真有多机或团队需求再看。

## 经验

- 用 chezmoi 加密文件的*一部分*，正确做法是把秘密拆成独立加密片段（`chezmoi encrypt` → `encrypted_*.age`），模板里用 `{{ include "..." | decrypt }}` 拼回去。对整份文件用 `--encrypt` 会让整份文件的 diff 都没法看。
- age 私钥 `key.txt` 是唯一能解密的东西，必须单独备份、绝不进 git。放到 `~/.config/chezmoi/` 而不是源目录，chezmoi 就不会托管它。
- 改完先用 `chezmoi cat` 看渲染结果，确认后再 `chezmoi apply` 写盘，不要直接应用。见 [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]。
- 多个 pathspec 里只要有一个匹配不到，整条 `git add` 就报 fatal、什么也不暂存。提交前先看 `git status`，或者 add 时别带已经改掉的旧名。详见 [[zh/Agents/git-add-multi-pathspec-fails-atomically|git-add-multi-pathspec-fails-atomically]]。

## 相关

- [[zh/Glossary/chezmoi|chezmoi]] [[zh/Glossary/age|age]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Cheatsheets/git|git]]：历史重写、force push
- [[zh/Agents/git-add-multi-pathspec-fails-atomically|git-add-multi-pathspec-fails-atomically]]
