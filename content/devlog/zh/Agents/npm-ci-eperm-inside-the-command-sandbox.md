---
type: agent-lesson
date: 2026-11-09
tags: [npm, sandbox, claude-code]
---
# 命令沙箱里把 npm 缓存放到 $TMPDIR

**错误**：子代理在 Claude Code 命令沙箱里给 portfolio 仓库跑 `npm ci`，解压到一半退出码 255，留下一份残缺的 `node_modules`。npm 怪缓存目录，还给了修法：

![沙箱拦住缓存写入导致 npm ci 失败，换用临时缓存重跑就替换了不完整的安装。](../Diagrams/npm-ci-eperm-inside-the-command-sandbox.cache-path.svg)

```
npm error code EPERM
npm error path /Users/kelsonqu/.npm/_cacache/tmp/***
npm error Your cache folder contains root-owned files, due to a bug in previous versions of npm which has since been addressed.
npm error To permanently fix this problem, please run:
npm error   sudo chown -R 501:20 "/Users/kelsonqu/.npm"
```

**根因**：缓存里根本没有 root 拥有的文件。沙箱写入白名单放行了 `~/.npm/_logs`，没放行 `~/.npm/_cacache`，所以每次写缓存都报 `EPERM`，而 npm 对这里的 `EPERM` 一律按 root-owned 文件报错。

**以后的规则**：
- 沙箱里跑 `npm ci --cache "$TMPDIR/npm-cache"`（`npm install` 同样适用）。重跑后输出 `added 747 packages in 4s`，`npm ci` 会自己换掉残缺的 `node_modules`。
- 别跑 npm 建议的 `sudo chown`。它改不了沙箱策略，还会动到任务之外的文件属主。
- 工作目录外路径报 `EPERM`，先当沙箱边界看，再信工具自己的解释。

**来源**：[[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]（完整案例，含排查时间线）。
