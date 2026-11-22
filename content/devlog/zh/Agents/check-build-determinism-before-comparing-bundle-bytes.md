---
type: agent-lesson
date: 2026-11-11
tags: [frontend, build, bundler, verification]
---
# 比包体积之前先确认构建可重复

**错误**：做不改行为的代码清理时，去掉多余 `export` 的提交一构建，总 JS 比基线多 5 字节，53 个内容哈希变了。对这几处改动做二分，结果怪到其中三处头上，就把它们的 `export` 恢复回去。退回这三处后再构建一次，还是 +5 字节。拿同一个没改动的提交连续构建五次，才发现产物在两种结果间来回切换：一种跟基线的每个内容哈希完全一致，另一种里 rolldown 给 vtk 第三方 chunk 的压缩导出别名换了排序（53 个哈希变动，JS +5 字节）。前面那轮二分作废，三处改动只好重新去掉 `export`。另有一处确实变大：`const END_LABEL_LIMIT = 8` 去掉 `export` 后，rolldown 不再内联它（`e.length>8` 变成 `var ap=8;…e.length>ap`），所在 chunk 多了 10 字节。

![同一个提交构建五次得到两种产物，单次哈希或大小差异无法判定回归。](../Diagrams/check-build-determinism-before-comparing-bundle-bytes.alternating-builds.svg)

**根因**：==那台机器上构建结果不可复现，单跑一次看字节数和哈希，分不清是改动还是噪声。== 做二分的前提是同一条件跑两遍给出同样的答案。另外，打包器对导出常量和模块私有常量的内联策略不同，去掉 `export` 体积未必不变。

**以后的规则**：
- 拿包体积或内容哈希当证据前，基线 commit 先连续构建三到五次。产物有出入，就把基线跑出来的几种产物都记下来。
- 重复构建里只要有一次复现了基线的全部内容哈希，就算和基线一致；或者只比这次改动能波及的 chunk。
- 基线没确认可重复前，别拿构建产物差异做二分。对着来回切换的产物跑二分，结论直接作废，被它怪罪的改动退回「没验证过」的状态。
- 常量去掉 `export` 后，检查用到它的 chunk 大小，打包器可能就此不再内联它。

**来源**：▒▒▒▒▒▒▒▒（完整案例，含排查时间线）。同一类问题，换了个生成器：[[zh/Agents/regenerated-contract-nondeterministic-enum-order|重新生成契约后的 hunk 取舍]]。
