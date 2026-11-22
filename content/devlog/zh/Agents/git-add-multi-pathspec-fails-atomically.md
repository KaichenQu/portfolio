---
type: agent-lesson
date: 2026-06-29
tags: [git, cli]
---
# git add 的无效 pathspec 与错提的文件树

**错误**：刚跑完 `git mv dot_zshrc dot_zshrc.tmpl`，紧接着跑了 `git add dot_zshrc dot_zshrc.tmpl encrypted_secrets.sh.age`。旧名 `dot_zshrc` 已经不在了，git 打出 `fatal: pathspec 'dot_zshrc' did not match any files`，**3 个文件一个都没暂存**。没留神那行 fatal 就直接 `git commit`，结果提上去的是前面 `git mv` 留下的 index：里头还是修改前的明文秘密，新加密文件完全没进去。

![git mv 后，一个旧路径参数使 git add 整批暂存失败，提交仍使用之前的索引。](../Diagrams/git-add-multi-pathspec-fails-atomically.index-unchanged.svg)

**根因**：`git add` 把 pathspec 列表当原子操作，只要一个参数匹配不到，整条命令就报 fatal 中止，其余有效路径也不暂存。把已改名的旧路径混进同一条 `git add`，不仔细看报错就会悄无声息带进下一步。

**以后的规则**：
- 改名后别再把旧名传给 `git add`，只加当前存在的路径。
- commit 前跑 `git status --short` 核对实际暂存了什么，涉及改名、加密或秘密变动时更要查。
- 提交移除明文秘密的改动后，直接验提交里的文件树：`git show HEAD:<file> | grep <secret>` 必须为空，`git ls-tree HEAD --name-only | grep <encrypted-file>` 必须有结果。「命令跑过」不等于「提交的内容对」。

**来源**：[[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]（完整案例，含排查时间线）。
