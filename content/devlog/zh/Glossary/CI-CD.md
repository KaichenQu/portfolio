---
type: glossary
tags: [glossary]
---
# CI/CD

**全称**：Continuous Integration / Continuous Delivery (or Deployment)

CI 是持续集成，每次 commit 自动触发构建和测试，尽早发现集成问题。CD 是持续交付或持续部署，测试通过后，改动自动进入可发布状态，或直接上生产。这样从 commit 到上线整条流程都有统一做法，能重复跑。

![提交触发 CI，测试失败会让改动在进入发布阶段前停下。](../Diagrams/ci-cd.commit-to-release.svg)

用例：

> CI 红了，先别合，查查失败的是不是自己这次 PR 的测试。

## 相关

- [[zh/Glossary/PR|PR]]
- [[zh/Glossary/TDD|TDD]]
