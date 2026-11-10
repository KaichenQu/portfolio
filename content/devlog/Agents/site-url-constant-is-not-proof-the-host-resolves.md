---
type: agent-lesson
date: 2026-11-09
tags: [seo, dns, nextjs, deploy]
---
# Resolve the site's host before shipping canonical, Open Graph or sitemap URLs

**Mistake**: the portfolio's `SITE_URL` was `https://www.kelsonqu.com`, and every canonical link, `og:url`, `og:image` and sitemap entry was built from it. Three PRs, two reviews and 185 tests passed. The tests compared URLs against the constant, so they agreed with it. Post-deploy verification found the host does not resolve: `dig +short www.kelsonqu.com` printed nothing and `curl` exited with code 6, `Could not resolve host`. The apex `kelsonqu.com` serves the site.

**Root cause**: the constant predated the work and was trusted as a fact about DNS. Nothing in the build or the tests resolves a host. The session's first `dig` had timed out inside the command sandbox and was never rerun.

**Rule going forward**:
- Before shipping canonical, Open Graph or sitemap URLs, resolve the host (`dig +short <host>`) and fetch one page from it (`curl -sS -o /dev/null -w '%{http_code}\n' https://<host>/`). Empty output or curl exit 6 means the host is wrong.
- If `dig` times out in the sandbox, rerun it with the network allowed; a timeout is not an answer.
- After deploy, read the live `<link rel="canonical">` and fetch the `og:image` URL it names; expect 200.

**Source**: [[2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]] (full case, with the investigation timeline).
