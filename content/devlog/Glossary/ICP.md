---
type: glossary
tags: [glossary]
---
# ICP

**Full name**: Internet Content Provider filing (ICP 备案)
**Chinese**: 备案

The MIIT registration a domain needs before it may resolve to a server or bucket in mainland China. Cloud providers enforce it at the product level: Alibaba Cloud OSS mainland buckets require an ICP-filed CNAME for data-API access on accounts that activated OSS on or after 2025-03-20; Hong Kong and overseas regions are exempt; Tencent COS mainland buckets still serve API downloads on their default domain without it.

![The note's storage examples place the ICP filing check at the provider and region boundary. The stated mainland OSS rule applies to accounts activated on or after 2025-03-20.](../Diagrams/icp.bucket-access.svg)

Usage example:
> No ICP-filed domain means no Aliyun mainland bucket on a new account; use a Tencent COS default domain or a Hong Kong bucket.
