---
type: glossary
tags: [glossary, llm, infra]
---
# newapi

**Full name**: new-api (also written new api; a fork of one-api)
**Category**: LLM API aggregation/distribution gateway

An open-source LLM API aggregation gateway that unifies models from different vendors (OpenAI / Claude / Gemini / domestic Chinese models) behind an OpenAI-compatible (and Claude-, Gemini-compatible) interface, handling key management, grouping, billing, and channel (distributor) routing. Many vendors selling "proxy API" access are just running a newapi instance in front of assorted upstreams — official APIs, other proxies, scraped-together subscription quota.

Identifying marks:

- Error JSON shaped like `{"error":{...,"type":"new_api_error"}}`, with a `request id`.
- Response headers include `x-new-api-version`, `x-oneapi-request-id`.
- Typical error codes: `503` no available channel (distributor), `403` no access to group X, `402 Insufficient USD balance`, `500 bad_response_body`.

Key thing to know: its `/v1/models` is a declarative listing, decoupled from whether the backend actually has a working channel. Listed does not mean callable.

Example usage:
> This newapi gateway returns `bad_response_body` for the entire gemini family — the upstream is sending back HTML, not JSON.

## Related
- [[2026-06-25-newapi-model-listed-but-unusable]]
- [[verifying-an-llm-proxy-serves-the-real-model]]
- [[MCP]]
