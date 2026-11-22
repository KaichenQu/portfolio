---
type: case-debug
date: 2026-06-19
tags: [debug, aws, lambda, infra]
status: solved
---
# Driver 跑完了，DynamoDB 和图表却是空的

CS6620 assignment 2 要做 S3 大小跟踪应用。driver lambda 往 S3 添加和删除对象，size-tracking lambda 应该响应 S3 事件，把 bucket 的总大小写入 DynamoDB，再由 plotting lambda 读表出图。driver 报告成功，画出来的却是空图。

下图用红色标出数据流断开的地方。

```mermaid
flowchart LR
    D[driver lambda] -->|添加或删除对象| S3[(S3 bucket)]
    S3 -. 未配置触发器 .-x ST[size-tracking lambda]
    ST -->|应当写入| DB[(DynamoDB)]
    DB --> P[plotting lambda] --> IMG([空图表])

    classDef broken fill:#fdecea,stroke:#dc4c5a,stroke-width:2px,color:#b3261e;
    class ST,IMG broken;
```

## 现象

调用 driver 返回成功，没报错，图表却是空的。最初的反馈很直接：「说是成功了，里面什么都没有。」

## 复现

跑完 driver lambda 再看图，每次都是空的。

## 排查过程

1. 先查数据层有没有东西，再怀疑画图环节。扫描 DynamoDB：
   ```bash
   aws dynamodb scan --table-name S3-object-size-history --select COUNT
   ```

   数据条数是 0。**画图本身没问题，根本没写入数据。** 范围缩到 size-tracking lambda：它要么从没触发，要么一跑就失败。

2. 先验证没触发的猜测。查 bucket 的事件通知和 lambda 的策略：
   ```bash
   aws s3api get-bucket-notification-configuration --bucket cs6620-assignment2-$ACC
   aws lambda get-policy --function-name cs6620-a2-size-tracking
   ```

   通知配置是空的，`get-policy` 返回 ResourceNotFound。**初步定位：S3 -> lambda 触发器从来没有建起来。** lambda 没有授予 `s3.amazonaws.com` 调用权限，bucket 也没配置事件通知。driver 本身没问题，只是没有东西触发 size-tracking。

3. 部署脚本确实写了配置触发器的逻辑，用 `grep -n -i "notif\|put-bucket\|add-permission"` 能找到。但 bucket 里没有相应配置，说明部署时 `setup_s3_trigger` 没跑成。

4. 手动配置时遇到工具陷阱：在 shell 里拼 lambda ARN，某一层改写吞掉了 `:fu`，把 `...726031:function` 变成 `...726031nction`。换 boto3、用 JSON 文件，或者直接走 `rtk proxy`，都能绕开这层改写。

5. 接好触发器再跑 driver，扫描结果仍是 0。这里对不上：触发器已经接好，怎么还是没写入？拉 size-tracking 的日志：
   ```bash
   aws logs get-log-events --log-group-name /aws/lambda/cs6620-a2-size-tracking --log-stream-name '<latest-stream>'
   ```

   日志显示 lambda 确实跑了，大小和数量都对，put_item 也走到了成功分支。可扫描结果还是 0。日志说写入成功、表里却没数据，比最初的现象更奇怪。

6. 排除第一个猜测：TTL 把数据立刻删了。
   ```bash
   rtk proxy aws dynamodb describe-time-to-live --table-name S3-object-size-history
   ```

   TTL 没开，手动写入的数据立刻就能扫到。表本身正常，排除。

7. 排除第二个猜测：线上代码和本地不一样，吞掉了异常，或写的是另一张表。下载实际部署的 zip 来比：
   ```bash
   URL=$(rtk proxy aws lambda get-function --function-name cs6620-a2-size-tracking --query 'Code.Location' --output text)
   ```

   两边完全一样。按代码逻辑，只有 put_item 成功后才会打那行日志。排除。

8. 先不重跑 driver，直接做实时端到端验证。手动往 bucket 放 1 个对象，等几秒，再用一致性读取扫描：
   ```bash
   echo probe > /tmp/probe.txt
   rtk proxy aws s3api put-object --bucket "$B" --key probe.txt --body /tmp/probe.txt
   # then wait and run a consistent scan
   ```

   这次写入落到了表里，也保留了下来。触发链路能通。

回过头看，第 5 步日志报写入成功、表里却没数据，来自接好触发器到重跑这段时间里的时序和缓存，前面命令改写造成的错误读数又让判断更乱。用干净的实时探针测，链路是通的。真正的根因在第 2 步就找到了：部署时根本没建好触发器。

## 根因

==部署时没有建好 S3 -> size-tracking lambda 触发器：lambda 没有授予 `s3.amazonaws.com` 调用权限，bucket 的事件通知配置也是空的。== 所以 driver 每次添加或删除对象，都不会调用 size-tracking，DynamoDB 一直是空的，图表也就没数据可画。**driver 的成功返回容易误导人，只能说明它自己的 S3 操作成功，不能说明下游有没有触发。**

## 修复

手动补齐两处：用 `add-permission` 授予 S3 调用 lambda 的权限，再把 bucket 的事件通知指向 lambda ARN。清掉测试数据后重跑 driver，返回 `plotted_points: 5`，图表也有实际数据了。

顺手查清了总大小为何那么大：plotting lambda 每跑一次就往同一个 bucket 写回 22-33 KB 的 PNG，key 是 `plot`。size-tracking 算整个 bucket，大小几乎全来自这张图，txt 文件只有几字节。这是设计里的自引用，符合预期。

## 经验

- **报成功却没产出，先看成功的是哪一层。** driver 的成功只覆盖它自己这一步，说明不了下游有没有触发。沿数据流逐段验证，这就是把 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 用在流水线上。
- **输出反常到不可能，先怀疑取证工具。** 命令在某一层遭改写，比如这次 ARN 少了几个字符，就会制造假证据。用 `rtk proxy`、boto3 或文件绕过这一层，把观察工具也排除掉。
- **用最小的实时探针验证流水线。** 手动放 1 个对象比重跑复杂的 driver 更快，结果也更可信。见 [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]。
- **证据互相矛盾时，逐个排除猜测。** 先排除 TTL，再排除代码漂移，不能碰到看似合理的解释就停。见 [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Glossary/RCA|RCA]]
