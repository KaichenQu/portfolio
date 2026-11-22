---
type: glossary
tags: [glossary]
---
# CI/CD

**Full name**: Continuous Integration / Continuous Delivery (or Deployment)

CI: every commit automatically triggers a build and test run, catching integration problems early. CD: once tests pass, changes move automatically to a releasable state or straight to production. Standardizes and makes repeatable the pipeline from "commit" to "live."

![A commit triggers continuous integration. A passing build and test run moves the change to a releasable state or to production.](../Diagrams/ci-cd.commit-to-release.svg)

Example usage:
> CI's red — don't merge yet, check whether it's your PR's own test that's failing.

## Related
- [[PR]]
- [[TDD]]
