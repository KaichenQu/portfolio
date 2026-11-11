---
type: agent-lesson
date: 2026-11-11
tags: [frontend, build, bundler, verification]
---
# Build the baseline several times before using bundle bytes as evidence

**Mistake**: in a behaviour-preserving cleanup, an un-export commit showed total JS +5 bytes and 53 changed content hashes against the baseline build. A bisect over the un-exports in that commit blamed three of them, and they were reverted. The next build of the trimmed commit showed +5 bytes again. Five builds of one unchanged commit then alternated between two outputs: one with every baseline content hash, one where rolldown ordered the minified export aliases of the vtk vendor chunks differently (53 hashes changed, JS +5 bytes). The bisect verdict was void, and the three un-exports went back in. Separately, one un-export was a real growth: dropping `export` from `const END_LABEL_LIMIT = 8` stopped rolldown inlining it (`e.length>8` became `var ap=8;…e.length>ap`), and its chunk grew 10 bytes.

**Root cause**: ==the build was nondeterministic on that machine, so a single build's bytes and hashes could not tell a change from noise.== A bisect needs a judge that gives the same answer twice. And a bundler inlines exported constants differently from module-private ones, so removing `export` is not always size-neutral.

**Rule going forward**:
- Before using bundle bytes or content hashes as evidence, build the baseline commit three to five times. If the outputs differ, record the set of baseline outputs.
- Count a build as equal to the baseline when one of its repeats reproduces every baseline content hash, or compare only the chunks the change can reach.
- Never bisect on a build-output difference until the baseline is shown to be repeatable; a bisect over an alternating output is void, and anything it blamed goes back to being untested.
- After dropping `export` from a constant, check the size of the chunk that uses it; the bundler may stop inlining it.

**Source**: ▒▒▒▒▒▒▒▒ (full case, with the investigation timeline). Same shape, different generator: [[regenerated-contract-nondeterministic-enum-order]].
