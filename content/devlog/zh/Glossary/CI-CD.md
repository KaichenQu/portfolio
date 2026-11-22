---
type: glossary
tags: [glossary]
---
# CI/CD

**全称**：Continuous Integration / Continuous Delivery (or Deployment)

CI 指持续集成，每次 commit 自动跑构建和测试，尽早把集成问题暴露出来。CD 指持续交付或持续部署，测试一过，改动自动进到待发布状态，或者直接推上生产。整套下来，从 commit 到上线走同一条流水线，每次都能照着重复跑。

![提交触发 CI，测试失败会让改动在进入发布阶段前停下。](../Diagrams/ci-cd.commit-to-release.svg)

用例：

> CI 红了，先别合，查查挂的是不是自己这次 PR 的测试。

## 相关

- [[zh/Glossary/PR|PR]]
- [[zh/Glossary/TDD|TDD]]
