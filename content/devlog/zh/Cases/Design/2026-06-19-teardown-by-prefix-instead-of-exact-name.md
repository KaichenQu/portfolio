---
type: case-design
date: 2026-06-19
tags: [design, aws, infra]
status: solved
---
# Teardown 按前缀清理资源

CS6620 的 teardown 脚本负责清理这次作业创建的 AWS 资源，包括 Lambda 函数、IAM role、layer 和 REST API。最初脚本按 `config.py` 里写死的全名逐个删。

## 背景与约束

起因是一次清理失败：teardown 报 `Role not found: cs6620-a2-size-tracking-role`，函数本身却删掉了。查实际账号：

```bash
aws iam list-roles --profile admin --query "Roles[].RoleName" --output text
```

role 的实际名字是 `cs6620-a2-size-tracking-role-l9kbz5d9`。==AWS 给 role 加了随机后缀，teardown 按写死的全名永远匹配不上。==

约束：

- 改名后照样能清干净，「随我起什么名字都能删」。
- 不能碰 AWS 自带的服务关联角色，也就是 5 个 `AWSServiceRoleFor*`。
- 沿用原有结构，继续读 `config.py`，用同一个 boto3 session。

## 候选方案

### 方案 A：保留全名，清理前列举并模糊匹配

- 做法：列出账号下所有 role，名字包含作业名就删。
- 好处：改动小。
- 代价：「包含」匹配太宽，容易误删，逻辑也会散到各处。

### 方案 B：按前缀匹配（采用）

- 做法：定义 `RESOURCE_PREFIX = 'cs6620-a2'`，名字以它开头的函数、role、layer 和 API 全删，不管 AWS 后缀加了什么。
- 好处：不受随机后缀影响；只要建资源都用同一前缀，部署和清理天然对得上，判断也集中在一处。
- 代价：前缀太短可能扫到无关资源，得加白名单保护默认资源。

## 决定

**选方案 B。** 问题根源在 AWS 的随机后缀，前缀匹配正好对症。「我起什么名字都能清干净」说到底只需要把匹配条件放宽到前缀。

![部署和清理共用资源前缀，角色名加上随机后缀也能匹配，服务关联角色始终排除在删除范围外。](../../Diagrams/2026-06-19-teardown-by-prefix-instead-of-exact-name.deletion-boundary.svg)

两道安全边界：

1. 只删指定前缀开头的资源。`str.startswith` 支持传元组，后来 assignment1 的遗留资源（前缀 `size-tracking-lambda-`）也要清，往元组加个前缀就行，逻辑不用动。
2. 始终跳过路径为 `/aws-service-role/` 的服务关联角色，不碰 AWS 内置角色。

## 模块划分

- `config.py` 是命名的唯一来源，新增 `RESOURCE_PREFIX`。部署和清理都只从这里读，改名只需改一处。
- `teardown_lambdas.py` 枚举 4 类资源，按前缀删。删 role 前先解绑附加策略、移除内联策略，不然 AWS 会拒绝删除。枚举走 paginator，防止漏掉第一页之后的资源。

## 数据流

`config.RESOURCE_PREFIX` → teardown 用 paginator 列出各类资源 → 名字符合 `startswith(prefix)` 且不属于服务关联角色 → 删除。

## 未做事项（YAGNI）

没做可配置的「匹配规则引擎」，也没上正则。前缀加服务关联角色白名单已经够用，多一层抽象只会增加阅读负担。

## 经验

- **平台生成的名字可能带随机后缀，匹配时认稳定的前缀，不认全名。**
- **批量删除要明确划出绝不能删的范围**（这里是服务关联角色）。边界要一眼看懂，不能指望前缀碰巧匹配不上。
- **部署和清理共用命名来源**（`config.py`），从源头杜绝创建和删除对不上的问题，正是 [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]] 说的按变化原因归组。
- 枚举云资源用 SDK 的 paginator，别假定一页装得下。

## 相关

- [[zh/Techniques/drawing-module-boundaries|drawing-module-boundaries]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Cases/Debug/2026-06-19-lambda-succeeds-but-writes-no-data|2026-06-19-lambda-succeeds-but-writes-no-data]]
