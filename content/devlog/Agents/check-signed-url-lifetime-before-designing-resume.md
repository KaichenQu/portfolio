---
type: agent-lesson
date: 2026-09-03
tags: [network, ci-cd, deploy]
---
# Read a signed URL's expiry before designing retry, resume, or a longer deadline

**Mistake**: a 96 MB artifact download to a deploy server died at a 15-minute deadline. The first fix added per-range resume and raised the deadline to 40 minutes (PR ▒▒▒▒). It was tested, bootstrapped and merged, and the next deploy still failed: the resume fired at minute 12 and its new request was refused.

**Root cause**: GitHub artifact download URLs are Azure [[SAS]] links valid for 10 minutes (`st=` to `se=`). Azure checks the signature per request, so existing streams continue but any reconnect after expiry is 403. Resume and a longer deadline addressed a constraint that was not the binding one. One `curl -I` on the artifact endpoint would have shown `se=` ten minutes after `st=`.

**Rule going forward**:
- Before building retry, resume or timeout changes around any pre-signed URL, fetch one and read its validity window. Design for "finish inside the window", not "survive longer".
- Keep resume as a safety net for drops inside the window, and say in the docs that a resume after expiry fails closed.
