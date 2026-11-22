---
type: glossary
tags: [glossary, llm, infra]
---
# newapi

**全称**：new-api（也写作 new api，fork 自 one-api）
**类别**：LLM API 聚合与分发网关

开源 LLM API 聚合网关，把各家供应商的模型（OpenAI / Claude / Gemini / 国产模型）统一接到兼容 OpenAI、Claude 和 Gemini 的接口后面，负责 key 管理、分组、计费和渠道（distributor）路由。不少卖「代理 API」的商家其实就是拿 newapi 给各种上游套了层入口，后面混着官方 API、其他代理以及东拼西凑的订阅额度。

![Gemini 模型 ID 出现在 newapi 目录中，但上游返回 HTML，实际补全得到 bad_response_body。](../Diagrams/newapi.catalogue-and-routing.svg)

识别特征：

- 错误 JSON 形如 `{"error":{...,"type":"new_api_error"}}`，带 `request id`。
- 响应头含 `x-new-api-version`、`x-oneapi-request-id`。
- 常见错误码：`503` 没有可用渠道（distributor），`403` 无权访问 X 分组，`402 Insufficient USD balance`，`500 bad_response_body`。

`/v1/models` 只是声明式清单，跟后端有没有可用渠道没关系：列出来了不代表调得通。

用例：

> 这个 newapi 网关对整个 gemini 系列全报 `bad_response_body`，上游回的是 HTML，不是 JSON。

## 相关

- [[zh/Cases/Debug/2026-06-25-newapi-model-listed-but-unusable|2026-06-25-newapi-model-listed-but-unusable]]
- [[zh/Techniques/verifying-an-llm-proxy-serves-the-real-model|verifying-an-llm-proxy-serves-the-real-model]]
- [[zh/Glossary/MCP|MCP]]
