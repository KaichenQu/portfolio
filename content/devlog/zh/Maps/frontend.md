---
type: moc
tags: [moc, frontend, react, css, three]
---
# 前端

共 22 篇，是最小的专题，几条线索都围绕比单次渲染活得更久的状态。

![重置 React 状态后，useLoader 的错误仍留在缓存里，重试要先清除该条目才能重新加载。](../Diagrams/frontend.state-boundaries.svg)

## 缓存的失败

加载失败进了缓存，看着就像 UI 坏了，因为重试根本没走到 loader。

- [[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]：原始案例。
- [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]：R3F `useLoader` / suspend-react 会永久缓存错误。
- [[zh/Agents/retry-ui-must-evict-suspense-error-cache|retry-ui-must-evict-suspense-error-cache]]：光重置 React 状态不够，还得清掉缓存条目。

## 跨 agent 的 CSS 归属

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]：4 个 agent，各自改互不重叠的文件，却共用同一个 class。
- [[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]]：文件归属只管谁改文件，管不了谁用了谁的 class。

## 多步链路的客户端持久状态

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：案例：存在 `sessionStorage` 里的 id 框住了服务端最多还持有什么，所以恢复和放弃都先看本地状态。
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]：每个服务端 id 都先写进持久存储，再发依赖它的请求。

## 清理改动的行为验证

基线本来就是红的，构建又不可重复，只能反复跑基线来证明「没有变化」。

- [[zh/Techniques/baseline-diff-verification-on-a-red-baseline|baseline-diff-verification-on-a-red-baseline]]：拿退出状态和失败清单跟基线对照，不要求全绿。
- [[zh/Agents/check-build-determinism-before-comparing-bundle-bytes|check-build-determinism-before-comparing-bundle-bytes]]：同一 commit 构建 5 次产出两种结果；去掉 `export` 后，rolldown 就不再内联常量。

## 无头浏览器的能力查询

hover 和 pointer 媒体特性由平台报告，切换它们的测试会绑在运行机器上。

- [[zh/Cases/Design/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign|2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]：案例：两条动效测试在 macOS 上绿、在 Linux runner 上红，直到集成分支跑完整层级才发现。
- [[zh/Agents/pointer-media-after-touch-emulation-differs-on-linux-headless|pointer-media-after-touch-emulation-differs-on-linux-headless]]：退出触屏模拟后，Linux 无头 Chromium 报 `pointer: none`，改用直接模拟媒体特性。

## 私有内容发布

浏览器只能藏住文字，删不掉已经发过来的内容；脱敏要放在复制文字的那一步。

- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]：案例：把私有 vault 发布到公开 Next.js 仓库，同步时脱敏，检查不过就拒绝发布，10 篇笔记留在私有侧。
- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]：canonical、`og:image` 和 sitemap URL 全用了没有 DNS 记录的主机名。

## 术语

- [[zh/Glossary/SPA|SPA]] · [[zh/Glossary/R3F|R3F]] · [[zh/Glossary/Idempotency key|Idempotency key]] · [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/SEO|SEO]] · [[zh/Glossary/DNS|DNS]]
