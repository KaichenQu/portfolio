---
type: moc
tags: [moc, frontend, react, css, three]
---
# 前端

22 篇笔记，是最小的专题。几条线索都围绕比单次渲染活得更久的状态。

![重置 React 状态后，useLoader 的错误仍留在缓存里，重试要先清除该条目才能重新加载。](../Diagrams/frontend.state-boundaries.svg)

## 缓存的失败

加载失败进了缓存，看起来就像 UI 坏了，因为重试根本没到 loader。

- [[zh/Cases/Debug/2026-07-13-stl-viewer-retry-button-does-nothing|2026-07-13-stl-viewer-retry-button-does-nothing]]：原始案例。
- [[zh/Techniques/useloader-failures-are-cached-forever|useloader-failures-are-cached-forever]]：R3F `useLoader` / suspend-react 会永久缓存错误。
- [[zh/Agents/retry-ui-must-evict-suspense-error-cache|retry-ui-must-evict-suspense-error-cache]]：重置 React 状态还不够，得清掉缓存条目。

## 跨 agent 的 CSS 归属

- [[zh/Cases/Design/2026-07-10-quiet-desk-redesign-four-parallel-agents|2026-07-10-quiet-desk-redesign-four-parallel-agents]]：4 个 agent，文件集互不重叠，却共用同一 class。
- [[zh/Agents/multi-agent-dead-code-deletion-needs-repo-wide-grep|multi-agent-dead-code-deletion-needs-repo-wide-grep]]：文件归属只管谁写文件，管不了谁用哪个 class。

## 多步链路的客户端持久状态

- [[zh/Cases/Design/2026-11-04-structure-assistant-submit-recovery-and-abandon|2026-11-04-structure-assistant-submit-recovery-and-abandon]]：案例。保存在 `sessionStorage` 的 id 决定服务端可能还持有什么，恢复和放弃都先看本地状态。
- [[zh/Techniques/persist-id-before-next-step|persist-id-before-next-step]]：每个服务端 id 都要先写入持久存储，再发依赖它的请求。

## 清理改动的行为验证

基线本来就红，构建也不可重复，所以要反复跑基线来衡量「没有变化」。

- [[zh/Techniques/baseline-diff-verification-on-a-red-baseline|baseline-diff-verification-on-a-red-baseline]]：把退出状态和失败清单跟基线对照，即使检查不是全绿也能验证。
- [[zh/Agents/check-build-determinism-before-comparing-bundle-bytes|check-build-determinism-before-comparing-bundle-bytes]]：同一 commit 构建 5 次得到两种产物。去掉 `export`，rolldown 就不再内联常量。

## 无头浏览器的能力查询

hover 和 pointer 媒体特性由平台报告，切换这些值的测试会受运行机器影响。

- [[zh/Cases/Design/2026-11-21-acceptance-gates-for-a-delegated-ui-redesign|2026-11-21-acceptance-gates-for-a-delegated-ui-redesign]]：案例。两项动效测试在 macOS 上绿，在 Linux runner 上红，直到集成分支跑完整层级才发现。
- [[zh/Agents/pointer-media-after-touch-emulation-differs-on-linux-headless|pointer-media-after-touch-emulation-differs-on-linux-headless]]：退出触屏模拟后，Linux 无头 Chromium 报 `pointer: none`，应直接模拟媒体特性。

## 私有内容发布

浏览器只能把文字藏起来，删不掉已经发来的内容。脱敏要放在复制文字的地方。

- [[zh/Cases/Design/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync|2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]]：案例。把私有 vault 发布到公开的 Next.js 仓库，同步时脱敏，检查失败就拒绝发布，10 篇笔记留在私有侧。
- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]：canonical、`og:image` 和 sitemap URL 都用了没有 DNS 记录的主机名。

## 术语

- [[zh/Glossary/SPA|SPA]] · [[zh/Glossary/R3F|R3F]] · [[zh/Glossary/Idempotency key|Idempotency key]] · [[zh/Glossary/Lease|Lease]] · [[zh/Glossary/Playwright|Playwright]] · [[zh/Glossary/SEO|SEO]] · [[zh/Glossary/DNS|DNS]]
