---
type: glossary
tags: [glossary]
---
# VPS

**全称**：Virtual Private Server
**中文**：虚拟专用服务器

从托管商租来的虚拟机，比如 OVH、GoDaddy、Tencent Cloud、Baidu Cloud，常见价格每月几美元。便宜、用完即弃、匿名性也够，所以公网上大多数 SSH 字典扫描都来自 VPS，有的是专门租来扫的，有的是已经失陷的机器。查攻击 IP 的地理归属，看到 `hosting: true` 就说明来源是数据中心机器，不是个人。

![词条示例中，fail2ban 封禁的六个地址均为托管 IP，分布在五个国家。](../Diagrams/vps.hosting-source.svg)

用例：

> fail2ban 现在封着的 6 个 IP 全是 VPS，分布在 5 个国家，没有一个是家庭网络。

## 相关

- [[zh/Glossary/SSH|SSH]]
