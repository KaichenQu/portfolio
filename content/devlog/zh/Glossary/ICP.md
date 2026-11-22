---
type: glossary
tags: [glossary]
---
# ICP

**全称**：Internet Content Provider filing (ICP 备案)
**中文**：备案

域名解析到中国大陆的服务器或 bucket 前，要先在 MIIT 登记备案。云厂商按产品执行。2025-03-20 当天或之后开通 Alibaba Cloud OSS 的账号，要访问大陆 bucket 的数据 API，得用通过 ICP 备案的 CNAME。香港和海外区域免这项要求。Tencent COS 的大陆 bucket 仍可在默认域名上直接提供 API 下载，无需备案。

![笔记中的对象存储示例比较了需要备案 CNAME 的境内 OSS、香港 OSS，以及境内 COS 的默认端点。](../Diagrams/icp.bucket-access.svg)

用例：

> 没有 ICP 备案域名，新账号用不了 Aliyun 大陆 bucket。可以用 Tencent COS 默认域名，或选香港 bucket。
