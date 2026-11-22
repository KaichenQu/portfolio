---
type: agent-lesson
date: 2026-06-29
tags: [git, cli]
---
# git add 的无效 pathspec 与错提的文件树

**错误**：刚跑完 `git mv dot_zshrc dot_zshrc.tmpl`，又跑了 `git add dot_zshrc dot_zshrc.tmpl encrypted_secrets.sh.age`。旧名 `dot_zshrc` 已经不存在，git 打印 `fatal: pathspec 'dot_zshrc' did not match any files`，**3 个文件一个都没暂存**。没人注意 fatal 那行，接着照跑 `git commit`，提交的是先前 `git mv` 留下的 index：里面还是编辑前的内容（明文秘密），完全没有新的加密文件。

![git mv 后，一个旧路径参数使 git add 整批暂存失败，提交仍使用之前的索引。](../Diagrams/git-add-multi-pathspec-fails-atomically.index-unchanged.svg)

**根因**：`git add` 把 pathspec 列表当成原子操作。一个参数匹配不到，整个命令就以 fatal 中止，其他有效路径也不会暂存。把改名之前的路径混在同一条 `git add` 里，没注意报错就发现不了。

**以后的规则**：
- 改名后不要把旧名传给 `git add`，只加当前存在的路径。
- commit 前用 `git status --short` 确认实际暂存了什么，涉及改名、加密或秘密变动时尤其要查。
- 提交把秘密从明文移出去的改动时，验提交本身的文件树：`git show HEAD:<file> | grep <secret>` 必须为空，`git ls-tree HEAD --name-only | grep <encrypted-file>` 必须有结果。「命令跑了」不能证明提交内容对。

**来源**：[[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]（完整案例，含排查时间线）。
