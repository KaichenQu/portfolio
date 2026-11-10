---
type: moc
tags: [moc, debug, design, method]
---
# Debugging and design method

22 notes. The reusable procedure notes that no single incident owns; the case-specific maps
link to the cases, this one links to the method.

## Narrowing the search space

- [[binary-search-fault-localization]] — halve the suspect set until one change remains
- [[locating-regressions-with-git-bisect]] — the same idea over commit history
- [[comment-bisection-to-locate-a-crash]] — the same idea inside one file
- [[bisect]]

## Before and after the fix

- [[systematic-troubleshooting]] — symptom, hypothesis, evidence, one change at a time
- [[reproduce-before-fixing-verify-after]] — a fix without a repro is a guess
- [[read-the-last-stack-trace-line-first]] — the frame nearest the fault, not the frame nearest the top
- [[repro]] · [[RCA]]

## Making failures visible

- [[log-placement]] — log at boundaries and decisions, not at every line
- [[2026-10-16-requested-values-empty-after-pair-translation]] — two identical translation sentences made a single-match parse return `requested = null`, so the deviation check was skipped

## Design judgement

- [[drawing-module-boundaries]] — boundaries follow change frequency and ownership
- [[yagni-and-designing-for-present-requirements]] — build for the requirement in front of you
- [[2026-10-15-structure-run-parallelism-capacity]] — pool capacity stored on first use made a change of N raise `EXECUTION_RESOURCE_CONFIG_CHANGED`; a `set-capacity` CLI that refuses while permits are held, plus a `runs_ahead` that counts N slots
- [[2026-10-24-yahoo-request-budget-and-daily-bar-store]] — quote-source calls cut from ~21,600 to ~1,250 a day by slot batching, a 180-symbol Redis daily-bar library and a public cache-key convention
- [[2026-11-09-publishing-a-private-notebook-with-redaction-at-sync]] — redaction at the copy step, merged-range masking, a backstop over ten views of the output, and a split between term-level and narrative sensitivity

## Recoverable multi-step workflows

- [[2026-11-04-structure-assistant-submit-recovery-and-abandon]] — frozen snapshot, persisted ids and a server check before abandoning, so a retry never creates a second object
- [[persist-id-before-next-step]] — the ids a client holds bound what the server can hold
- [[2026-10-24-plaid-item-removal-retry-after-verification]] — keep the access token until removal succeeds; orphan queue with 3 tries and abandon on a permanent 4xx, each review round finding a flaw in the last fix

## Pools that wait on each other

- [[2026-11-05-requests-hang-then-fail-in-500-batches]] — sync routes return their connection in a teardown that needs a worker thread; a burst deadlocks the thread pool and the connection pool until `pool_timeout`
