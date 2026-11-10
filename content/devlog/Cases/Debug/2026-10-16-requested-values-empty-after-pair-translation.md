---
type: case-debug
date: 2026-10-16
tags: [debug, frontend, backend, protocol, cad, regression]
status: solved
---
# Requested values empty after a pair translation

A run that moved two weld marks by +Y 1 mm succeeded, but its result screen showed every requested value as empty. ==The B1 request format repeated the requirement sentence for each of the two translations. ▒▒▒▒▒▒▒▒ accepts exactly one matching sentence, so `requested` became null, and the independent deviation assertion was skipped.==

The run still looked correct, with all four Y measurements at +1 mm, but the check that would have caught a wrong measurement did not run.

The fix, [[PR]] ▒▒▒▒, merges translations on the same axis, in the same direction and by the same distance into one requirement sentence.

## Observed symptoms

Found during local integration acceptance of the structure workbench, the app's UI around the ▒▒▒▒▒▒▒▒ engine:

| Item | Value |
| --- | --- |
| Release | `▒▒▒▒▒▒▒▒▒▒▒▒` |
| ▒▒▒▒▒▒▒▒ | `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒` |
| Planner | real Qwen3.8-27B |
| Settings | generated edits off, concurrency 1 |
| Request | two rows in the modification definition (修改定义), each +Y 1 mm |
| Run | succeeded, 113.24 s |
| Result screen | modification result first, assembly re-check passed |
| Measurements | four weld-mark Y measurements, all +1 mm |
| Requested values | all empty |

The modification definition is the workbench's structured form for an edit: one row per part and action. The UI side passed: missing actions blocked submit, and undo and redo restored the same request. The acceptance report logged the empty requested values as **P1**, a protocol regression: a break in the request contract between the workbench and ▒▒▒▒▒▒▒▒.

## Investigation timeline

The source brief records the cause and the fix, not the steps between. One earlier sighting is on record. In the 10/14 replay review (see ▒▒▒▒▒▒▒▒), candidate 8, a group target, also had an empty requested column, and the page said 「多目标请求暂不提取要求值」 (requested values are not yet extracted for multi-target requests). That review listed it as a ▒▒▒▒▒▒▒▒▒▒▒▒ item, pointing at `requested_translation` in `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`. The briefs do not say whether that case had the same cause.

## Root cause

![Where requested becomes null](../../Diagrams/2026-10-16-requested-values-empty-after-pair-translation.data-flow.svg)

1. The two rows were serialized in the B1 request format, the text a run is submitted with. B1 generated the requirement sentence once per translation, so the request held it twice.
2. ▒▒▒▒▒▒▒▒ takes the requested value from a matching requirement sentence, and it accepts only one match.
3. With two matches it set `requested` to null.
4. The **independent deviation assertion** compares each measured change with its requested value. With no requested value it had nothing to compare, so it was skipped.

The result screen then showed correct measurements next to empty requested values. The deviation check never ran, so it reported neither a pass nor a failure.

## Fix

▒▒▒▒, 「合并同向成对平移要求以恢复独立复测」, merged as `▒▒▒▒▒▒▒▒▒▒▒▒`.

| Case | Request text after ▒▒▒▒ |
| --- | --- |
| single-axis translations, same axis, same direction, same distance | merged into one requirement sentence |
| mixed vectors | original text kept |
| consecutive actions on the same part | original text kept |

None of the 43 original replay expectations had to change.

Verification run `▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒`: succeeded in 116.99 s. All four requested values came back, each with deviation 0, unit mm.

| Measurement | Requested after ▒▒▒▒ (mm) |
| --- | --- |
| weld mark 1 ymin | -13.999984664000014 |
| weld mark 1 ymax | -8.999984664199985 |
| weld mark 2 ymin | 11.0000153358 |
| weld mark 2 ymax | 16.0000153358 |

| Check | Result |
| --- | --- |
| Tier 1 | 3 files / 153 tests pass; typecheck, format and diff checks pass |
| Replay expectations | 43 original, 0 modified |
| Pre-review | first round `BLOCKERS=1`, fixed; final `BLOCKERS=0` |
| Screenshots | 4 added for the fix |

## Open items

- **Old B1 drafts.** Recovering an old structured B1 draft falls back to parsing, and that path may lose the `inst` identity and the dimension actions. Medium risk, kept out of ▒▒▒▒ because recovery logic is beyond a serialization fix.
- **Mixed vectors.** Mixed-vector requests and similar ones still cannot be re-measured independently by the current ▒▒▒▒▒▒▒▒. The engine is frozen until 2026-10-31; how to accept these is decided after that.

## Lessons and small tricks

- **A skipped assertion looks like a pass.** Correct measurements next to empty requested values meant the check had not run. Treat a missing expected value as a failure of the check, not as nothing to report.
- **When one side accepts exactly one match, the other side must emit exactly one.** To a parser that requires a unique match, two identical sentences make the value unreadable.
- **Fix a serializer as narrowly as the bug.** Merging only same-axis, same-direction, same-distance translations left the 43 original replay expectations unchanged.
- **Check the requested column, not only the measured one, in acceptance.** A run that "succeeded" with empty requested values carried no independent check of its geometry.

## Related

- [[2026-10-15-structure-run-parallelism-capacity]]
- [[reproduce-before-fixing-verify-after]]
- [[regression]] · [[PR]]
