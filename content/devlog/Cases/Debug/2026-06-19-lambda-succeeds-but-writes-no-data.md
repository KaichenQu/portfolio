---
type: case-debug
date: 2026-06-19
tags: [debug, aws, lambda, infra]
status: solved
---
# Successful driver run, empty DynamoDB, blank plot

CS6620 assignment 2: an S3 size-tracking application. A driver lambda adds and removes S3 objects, a size-tracking lambda is supposed to fire on the S3 event and write the bucket's total size into DynamoDB, and a plotting lambda reads that table and renders a chart. The driver reported success, but the chart came out empty.

The data flow, with the broken segment in red:

```mermaid
flowchart LR
    D[driver lambda] -->|add/remove objects| S3[(S3 bucket)]
    S3 -. trigger never wired .-x ST[size-tracking lambda]
    ST -->|should write| DB[(DynamoDB)]
    DB --> P[plotting lambda] --> IMG([empty chart])

    classDef broken fill:#fdecea,stroke:#dc4c5a,stroke-width:2px,color:#b3261e;
    class ST,IMG broken;
```

## Symptom
The driver invocation returned success with no errors, and the plot was empty. The original report was blunt: "success, but there's nothing there."

## Reproduction
Run the driver lambda, then look at the plot — reliably empty.

## Investigation timeline

1. Establish whether the data layer is empty before blaming the plotting step. Check DynamoDB:
   ```bash
   aws dynamodb scan --table-name S3-object-size-history --select COUNT
   ```
   Zero items. **So this is not a plotting problem — nothing is being written at all.** That narrows it to the size-tracking lambda either never firing or failing outright.

2. Hypothesis: the lambda is never invoked. Check the bucket's event notifications and the lambda's policy:
   ```bash
   aws s3api get-bucket-notification-configuration --bucket cs6620-assignment2-$ACC
   aws lambda get-policy --function-name cs6620-a2-size-tracking
   ```
   The notification config is empty and `get-policy` returns ResourceNotFound. **First read on the root cause: the S3 -> lambda trigger was never created.** The lambda has no invoke permission for `s3.amazonaws.com` and the bucket has no event notification. The driver itself is fine; nothing is triggering size-tracking.

3. The deploy script does contain trigger-wiring logic — `grep -n -i "notif\|put-bucket\|add-permission"` finds it — but the bucket carries none of it, so `setup_s3_trigger` did not succeed at deploy time.

4. Wiring the trigger by hand hit a tooling trap: while assembling the lambda ARN in the shell, the characters `:fu` were swallowed by some rewriting layer, turning `...726031:function` into `...726031nction`. Going around the shell — boto3, a JSON file, or calling directly through `rtk proxy` — avoided the rewrite.

5. With the trigger in place, rerunning the driver still left the scan at 0. A contradiction: trigger wired, still no writes. Pull the size-tracking logs:
   ```bash
   aws logs get-log-events --log-group-name /aws/lambda/cs6620-a2-size-tracking --log-stream-name '<latest-stream>'
   ```
   The logs show the lambda running, size and count correct, and put_item reaching its success branch. The table scan is still 0. Logs claiming a successful write against an empty table is stranger than the original symptom.

6. Falsify hypothesis one: TTL is deleting the rows immediately.
   ```bash
   rtk proxy aws dynamodb describe-time-to-live --table-name S3-object-size-history
   ```
   TTL is off, and an item written by hand shows up in a scan immediately. The table itself is healthy. Ruled out.

7. Falsify hypothesis two: the deployed code differs from local — swallowing an exception, or writing to a different table name. Download the zip that is actually deployed and compare:
   ```bash
   URL=$(rtk proxy aws lambda get-function --function-name cs6620-a2-size-tracking --query 'Code.Location' --output text)
   ```
   Identical, and by the code's own logic that log line only prints once put_item has succeeded. Ruled out.

8. Test end to end in real time instead of leaning on the driver again: put one object into the bucket by hand, wait a few seconds, then scan with a consistent read.
   ```bash
   echo probe > /tmp/probe.txt
   rtk proxy aws s3api put-object --bucket "$B" --key probe.txt --body /tmp/probe.txt
   # then wait and run a consistent scan
   ```
   This write lands and persists. The trigger chain works.

Looking back from here, the step-5 contradiction — logs reporting a successful write while the table stayed empty — came from the timing and caching between wiring the trigger and rerunning, compounded by the corrupted readings the rewritten commands had produced earlier. Measured with a clean live probe, the chain was intact. The one real root cause is the one already found in step 2: the trigger was never created at deploy time.

## Root cause
==The S3 -> size-tracking lambda trigger was never successfully created at deploy time: the lambda lacked invoke permission for `s3.amazonaws.com`, and the bucket's event notification configuration was empty.== So every time the driver added or removed an object, size-tracking was never invoked, DynamoDB stayed empty, and the plot had nothing to draw. **The driver's success return is misleading — it covers only its own S3 operations and says nothing about whether anything downstream fired.**

## Fix
Add the two missing pieces by hand: grant the lambda S3 invoke permission with `add-permission`, and configure the bucket's event notification to point at the lambda ARN. Clear the test data, rerun the driver, and the result is `plotted_points: 5` with real data behind the chart.

One side question got answered along the way — why the total size was so large. The plotting lambda writes a 22-33 KB PNG (key `plot`) back into the same bucket on every run, and size-tracking measures the whole bucket, so nearly all of the total is that one image; the txt files are a few bytes each. Self-reference in the design, not a bug.

## Lessons
- **When something reports success but produces no result, first work out which layer actually succeeded.** The driver's success covers only its own step and implies nothing about downstream triggering. Walk the data flow one segment at a time rather than trusting the top-level success. This is [[binary-search-fault-localization]] applied along a pipeline.
- **When the output is illogical enough to be impossible, suspect the tooling.** A command rewritten somewhere in the stack — here, characters eaten out of an ARN — manufactures false evidence. Route around it with `rtk proxy`, boto3, or a file, and rule out the observation tools themselves.
- **Verify a pipeline with the smallest live probe you can.** Dropping in one object by hand beats rerunning a complex driver, and it is both faster and more trustworthy. See [[reproduce-before-fixing-verify-after]].
- **Contradictory evidence deserves one falsified hypothesis at a time** — TTL, then code drift — instead of stopping at the first plausible explanation. See [[systematic-troubleshooting]].

## Related
- [[systematic-troubleshooting]]
- [[binary-search-fault-localization]]
- [[log-placement]]
- [[reproduce-before-fixing-verify-after]]
- [[RCA]]
