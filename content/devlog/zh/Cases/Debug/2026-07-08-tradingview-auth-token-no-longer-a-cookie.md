---
type: case-debug
date: 2026-07-08
tags: [debug, infra, auth]
status: open
---
# TradingView 的 auth_token 提不出来，原因是它已经脱离了 cookie

## 现象

`al-brooks-realtime`（PriceAction-AB）的 Python sidecar（`src/kairotrade_pa/data_sources/tradingview_feed.py`）用 `browser_cookie3` 从本地浏览器取 `auth_token` cookie，拿它连 TradingView 实时行情。想写个独立脚本复现这段逻辑，换浏览器和 profile 都取不到 `auth_token`。

![第一次查询落在错误的 Chrome 配置中，正确配置含有登录会话 Cookie，但没有 auth_token。](../../Diagrams/2026-07-08-tradingview-auth-token-no-longer-a-cookie.cookie-assumption.svg)

## 复现

```bash
.venv/bin/python3 scripts/tv-repin.py
```

```
[tv-repin] Firefox: Could not find Firefox profile directory
[tv-repin] Edge: Failed to find cookies for Edge browser
[tv-repin] no auth_token found in any browser's tradingview.com cookies...
```

Chrome 和 Safari 两个分支都没报错，也没打印匹配项。两边的 cookie 存储都能正常打开，只是里面没有这个名字。

## 排查过程

1. 先猜没登录。列出 Chrome 的 profile 目录：

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "^default$|^profile"
   ```

   只返回 `Profile 3/`。以为那就是正在用的 profile，查它的 cookie 存储，`tradingview.com` 下 0 条记录，Safari 也是 0 条。于是下结论「这台机器的两个浏览器都没登录过 TradingView」，让用户重新登录确认。

2. 用户从 DevTools 贴出完整的 `document.cookie` 和 Application 面板的 cookie 表。会话明明是活的（有 `sessionid`、`sessionid_sign` 和一堆分析 cookie），**表里确实没有 `auth_token`**。第 1 步「没登录」的判断错了：碰巧说中了读不到 token，原因却完全找错了。

3. 想用 Playwright 验证会话状态，得先把这些 cookie 写进浏览器上下文。用 `browser_cookie3` 再从 `Profile 3` 取 `tradingview.com` cookie，**结果还是 0 条**，和用户刚贴的表对不上。这时误以为新版 Chrome 换了应用绑定加密、`browser_cookie3` 解不开，差点把问题归到提取工具上。

4. 用户问 `Profile 3` 是哪里来的。回头看第 1 步，才发现这台机器的 `ls` 会在目录名末尾加 `/`，跟 `eza`、`lsd` 的输出一样，而正则写的是 `^default$`。锚定行尾后，`Default/` 匹配不上 `^default$`，过滤器悄悄把 **`Default` 那行筛掉了**，只剩 `Profile 3`。profile 从来不止一个，是自己的正则把该看的那个滤掉了。

   不加过滤再查：

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "default|profile|guest"
   ```

   4 个 profile 全列了出来。看 Chrome 自己的 `Local State` 就知道当前用的是哪个：

   ```python
   json.load(open(".../Chrome/Local State"))["profile"]["last_used"]
   # -> "Default"
   ```

   `Profile 3` 属于另一个完全不同的账号（「evenness.rocks」），前面所有测试查的都是错的账号。

5. 改从 `Default` 提取，一次拿到 4742 个 cookie。`tradingview.com` 的条目和用户在 DevTools 里看到的**完全一致**（`sessionid`、`sessionid_sign`、`device_t`、`tv_ecuid` 等）。第 3 步的加密猜测排除：提取器一直没坏，只是之前指错了账号。同时也确认了另一半事实：选对 profile 后，里面还是没有 `auth_token`。

6. 排除「没登录」和「工具坏了」，只剩两种可能：TradingView 停用了这个 cookie，或者它只在登录瞬间出现，从不落盘。用户在 DevTools 控制台给 XHR 挂钩子，拦截 URL 包含 `signin` 的请求：

   ```js
   const _send = XMLHttpRequest.prototype.send;
   XMLHttpRequest.prototype.send = function() {
     this.addEventListener("load", function() {
       if (this._url.includes("signin")) {
         const data = JSON.parse(this.responseText);
         const token = data?.user?.auth_token;
         if (token) console.log("[CAPTURED] auth_token:", token);
       }
     });
     return _send.apply(this, arguments);
   };
   ```

   `Object.keys(localStorage)` 和 `Object.keys(sessionStorage)` 返回的也都是空数组。

## 根因

==TradingView 不再把 `auth_token` 写成 cookie。它只在登录接口（URL 包含 `signin`）的 JSON 响应里出现一次，字段是 `data.user.auth_token`。前端只保存在内存里，不写 cookie、`localStorage` 或 `sessionStorage`。== 凡是靠读浏览器 cookie 存储的方案，全都拿不到，不管用 `browser_cookie3`、项目里的 `tradingview_feed.py`，还是已经删掉的 `scripts/tv-repin.py`，换浏览器、profile 或加密方案都一样。变的是 TradingView 服务端行为，本地环境没出问题。

「没登录」和「提取器坏了」两次弯路犯的其实是同一个错：**本地读出来为空，先怀疑数据源或工具，没先核对所读的身份和路径。** 带锚点的 `grep` 又因为末尾斜线悄无声息吞掉一行，一点提示没有。静默过滤比直接报错更危险，很容易让人拿着缺了一截的结果下定论。

## 修复

删掉 `scripts/tv-repin.py`（没提交过，直接从磁盘删除）。脚本照搬了 `tradingview_feed.py::_extract_browser_token()`，前提已经被推翻，给不出正确结果，留着只会误导下次排查。

`tradingview_feed.py` 里的提取路径（`_extract_browser_token` / `_ensure_token`）**还没修**。这条路径其实一直拿不到 token，部署的 sidecar 很可能一直在匿名模式下跑，没人发现。这轮只查清根因，留了手动办法：先退出再登录，用控制台钩子抓 `signin` 响应。自动提取留到下一次专门重写。

## 经验

- 本地提取或查询返回空，先确认读的是不是自己以为的目标，再怀疑数据存不存在，最后才怀疑工具。这次把顺序走反，多绕了两圈。
- 依赖第三方网站的字段或 cookie，等于押它的实现细节不变。隔段时间用真实浏览器流量（DevTools Network/Console）核对一遍，别只信写脚本那天的观察。
- 给 XHR 挂钩子看响应体，比翻 cookie 表直接。不用猜数据落进了哪种存储，盯住它经过的地方就行。下次遇到 token「应该在客户端某处」，但 cookie、`localStorage`、`sessionStorage` 都找不到，直接抓流量，省得逐个排除。

## 相关

- [[zh/Glossary/JWT|JWT]]
- [[zh/Agents/grep-anchor-vs-ls-trailing-slash|grep-anchor-vs-ls-trailing-slash]]
