---
type: glossary
tags: [glossary]
---
# CL

**Full name**: Changelist

A self-contained code change submitted for review or for merging into the repo. Used in the Google/Phabricator world; equivalent to GitHub's [[PR]]. "Send up a CL" means opening a change for review.

![A branch opens a pull request for review and merge. WIP defers review, PTAL asks for it, NIT records optional feedback and LGTM signals approval. Merge request and changelist are equivalent review submissions.](../Diagrams/pr.review-flow.svg)

Example usage:
> Split this into two CLs — the first does the refactor, the second adds the feature, so review is easier.

## Related
- [[PR]]
- [[MR]]
- [[LGTM]]
