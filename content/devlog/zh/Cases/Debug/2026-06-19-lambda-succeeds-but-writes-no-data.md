---
type: case-debug
date: 2026-06-19
tags: [debug, aws, lambda, infra]
status: solved
---
# Driver 跑完了，DynamoDB 和图表却是空的

CS6620 assignment 2 要做 S3 大小跟踪应用。driver lambda 往 S3 增删对象，size-tracking lambda 本该响应 S3 事件把 bucket 总大小写进 DynamoDB，再由 plotting lambda 读表出图。结果 driver 报了成功，画出来的却是空图。

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

调 driver 返回成功，没报错，图表却是空的。最初反馈很直接：「说是成功了，里面什么都没有。」

## 复现

跑完 driver lambda 再看图，每次都是空的。

## 排查过程

1. 先查数据层有没有数据，再怀疑画图环节。扫描 DynamoDB：
   ```bash
   aws dynamodb scan --table-name S3-object-size-history --select COUNT
   ```

   条数是 0。**画图本身没问题，表里根本没写入数据。** 范围缩到 size-tracking lambda：要么从没触发，要么一跑就失败。

2. 先验没触发的猜测，查 bucket 事件通知和 lambda 策略：
   ```bash
   aws s3api get-bucket-notification-configuration --bucket cs6620-assignment2-$ACC
   aws lambda get-policy --function-name cs6620-a2-size-tracking
   ```

   通知配置是空的，`get-policy` 返回 ResourceNotFound。**初步定位：S3 -> lambda 触发器一直没建起来。** lambda 没给 `s3.amazonaws.com` 授予调用权限，bucket 也没配事件通知。driver 自身没毛病，只是没有事件触发 size-tracking。

3. 部署脚本里确实写了配触发器的逻辑，用 `grep -n -i "notif\|put-bucket\|add-permission"` 能搜到。但 bucket 上什么都没有，说明部署时 `setup_s3_trigger` 没跑成。

4. 手动配触发器时遇到工具坑：在 shell 里拼 lambda ARN，中间某层改写吞掉了 `:fu`，把 `...726031:function` 改成了 `...726031nction`。绕开 shell，改用 boto3、JSON 文件或直接走 `rtk proxy`，避开了这层改写。

5. 接好触发器重跑 driver，扫描结果还是 0，和预期对不上。拉 size-tracking 的日志来看：
   ```bash
   aws logs get-log-events --log-group-name /aws/lambda/cs6620-a2-size-tracking --log-stream-name '<latest-stream>'
   ```

   日志显示 lambda 确实跑了，大小和数量都对，put_item 也走到了成功分支，可扫描结果还是 0。日志报写入成功、表里却没数据，比最初的现象还奇怪。

6. 先排除第一个猜测：TTL 立刻把数据删掉了。
   ```bash
   rtk proxy aws dynamodb describe-time-to-live --table-name S3-object-size-history
   ```

   TTL 没开，手动写一条进去立刻就能扫到。表本身正常，排除。

7. 再排除第二个猜测：线上部署的代码和本地不一致，吞了异常，或者写进了另一张表。把实际部署的 zip 下载下来比对：
   ```bash
   URL=$(rtk proxy aws lambda get-function --function-name cs6620-a2-size-tracking --query 'Code.Location' --output text)
   ```

   两边一模一样。按代码逻辑，只有 put_item 成功后才会打那行日志。排除。

8. 不再重跑 driver，直接做实时端到端验证。手动往 bucket 放 1 个对象，等几秒，再用一致性读取扫描：
   ```bash
   echo probe > /tmp/probe.txt
   rtk proxy aws s3api put-object --bucket "$B" --key probe.txt --body /tmp/probe.txt
   # then wait and run a consistent scan
   ```

   这条写入落到表里并且留了下来，触发链路是通的。

回头看，第 5 步日志报成功、表里却没数据，是接好触发器到重跑之间的时序和缓存引起的，加上前面命令改写产生的错误读数，把判断搅乱了。用干净的实时探针一测，链路正常。真正的根因第 2 步就找到了：部署时根本没建好触发器。

## 根因

==部署时没有建好 S3 -> size-tracking lambda 触发器：lambda 没给 `s3.amazonaws.com` 授予调用权限，bucket 的事件通知配置也是空的。== 所以 driver 每次增删对象，size-tracking 都不会触发，DynamoDB 一直空着，图表自然没数据可画。**driver 返回成功很容易误导人，它只覆盖自己的 S3 操作，说明不了下游有没有触发。**

## 修复

手动补齐两处：用 `add-permission` 给 S3 授予调用 lambda 的权限，再把 bucket 的事件通知指向 lambda ARN。清掉测试数据后重跑 driver，返回 `plotted_points: 5`，图表也有了真实数据。

顺带查清了总大小为什么那么大：plotting lambda 每跑一次，就往同一个 bucket 写回一张 22-33 KB 的 PNG，key 是 `plot`。size-tracking 统计整个 bucket，体积几乎全来自这张图，txt 文件只有几字节。这是设计里的自引用，符合预期。

## 经验

- **报成功却没产出，先查成功的是哪一层。** driver 的成功只管它自己这一步，说明不了下游有没有触发。别光信顶层的成功返回，沿数据流逐段验证，这就是把 [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]] 用在流水线上。
- **输出反常到不可能，先怀疑取证工具。** 命令在中间某层改写（比如这次 ARN 少了几个字符），就会造出假证据。换 `rtk proxy`、boto3 或文件绕过这一层，把观察工具本身也排除掉。
- **用最小的实时探针验证流水线。** 手动放 1 个对象比重跑整套 driver 更快，结论也更可靠。见 [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]。
- **证据互相矛盾时，一次排除一个猜测。** 先排 TTL，再排代码漂移，别碰到听起来合理的解释就收手。见 [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]。

## 相关

- [[zh/Techniques/systematic-troubleshooting|systematic-troubleshooting]]
- [[zh/Techniques/binary-search-fault-localization|binary-search-fault-localization]]
- [[zh/Techniques/log-placement|log-placement]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Glossary/RCA|RCA]]
