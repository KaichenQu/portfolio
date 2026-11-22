---
type: case-debug
date: 2026-07-08
tags: [debug, infra, auth]
status: open
---
# TradingView 的 auth_token 提不出来，原因是它已经脱离了 cookie

## 现象

`al-brooks-realtime`（PriceAction-AB）的 Python sidecar（`src/kairotrade_pa/data_sources/tradingview_feed.py`）用 `browser_cookie3` 从本地浏览器取 `auth_token` cookie，拿它连 TradingView 的实时行情。我想写个独立脚本复现这段逻辑，换浏览器和 profile 都取不到 `auth_token`。

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

Chrome 和 Safari 两个分支都没有异常，也没有打印匹配项。两边都能打开 cookie 存储，只是里面都没有这个名字。

## 排查过程

1. 先猜没登录。列出 Chrome 的 profile 目录：

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "^default$|^profile"
   ```

   只返回 `Profile 3/`。我以为那就是正在用的 profile，查它的 cookie 存储，`tradingview.com` 下有 0 条记录。Safari 也是 0 条。我断定「这台机器的两个浏览器都没登录过 TradingView」，让用户重新登录确认。

2. 用户从 DevTools 贴出完整的 `document.cookie` 和 Application 面板的 cookie 表。会话明明是活的（有 `sessionid`、`sessionid_sign` 和一堆分析用的 cookie），**表里确实没有 `auth_token`**。第 1 步关于「没登录」的判断错了。碰巧说中了 token 读不出来，原因却完全找错了。

3. 想用 Playwright 验证会话状态，得先把这些 cookie 传进浏览器上下文。用 `browser_cookie3` 再从 `Profile 3` 取 `tradingview.com` cookie，**结果还是 0 条**，和用户刚贴的表对不上。我误以为新版 Chrome 换了应用绑定加密，`browser_cookie3` 已经解不开，差点把问题归到提取工具头上。

4. 用户问 `Profile 3` 是哪儿来的。回看第 1 步，才发现这里的 `ls` 会在目录名末尾加 `/`，和 `eza`、`lsd` 的输出一样，但我用的模式是 `^default$`。锚定行尾后，`Default/` 匹配不了 `^default$`，所以 **`Default` 那行悄悄让过滤器删了**，只剩 `Profile 3`。profile 从来就不止一个，是我自己的正则扔掉了该看的那个。

   不加过滤：

   ```bash
   ls "$HOME/Library/Application Support/Google/Chrome" | grep -iE "default|profile|guest"
   ```

   4 个 profile 全出现了。看 Chrome 自己的 `Local State` 就知道实际用的是哪个：

   ```python
   json.load(open(".../Chrome/Local State"))["profile"]["last_used"]
   # -> "Default"
   ```

   `Profile 3` 属于完全不同的账号（「evenness.rocks」）。此前每次测试都查错了身份。

5. 改从 `Default` 提取，一次拿到 4742 个 cookie。`tradingview.com` 的那些和用户在 DevTools 里看的**完全一致**（`sessionid`、`sessionid_sign`、`device_t`、`tv_ecuid` 等）。第 3 步的加密猜测排除：提取器一直没坏，只是始终指着错误的身份。这次也确认了另一点：即使 profile 选对，还是没有 `auth_token`。

6. 排除「没登录」和「工具坏了」后只剩两种可能：TradingView 停用了这个 cookie，或它只在登录瞬间出现，从来不落盘。用户直接在 DevTools 控制台挂钩子，观察 URL 包含 `signin` 的所有 XHR：

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

   `Object.keys(localStorage)` 和 `Object.keys(sessionStorage)` 都是空数组。

## 根因

==TradingView 已不再把 `auth_token` 写成 cookie。它只在登录端点（URL 包含 `signin`）的 JSON 响应体里出现一次，字段是 `data.user.auth_token`。前端将它留在内存里，不写 cookie、`localStorage` 或 `sessionStorage`。== 只要方案靠读浏览器 cookie 存储，就一定拿不到，无论是 `browser_cookie3`、本项目的 `tradingview_feed.py`，还是已删除的 `scripts/tv-repin.py`。换浏览器、profile 或加密方案也一样。变的是 TradingView 服务端行为，本地环境没出故障。

「没登录」和「提取器坏了」两次都犯了同样的错：**本地读出来是空的，先怀疑数据源或工具，却没先核对所读的身份或路径。** 带锚点的 `grep` 又因为这里的末尾斜线吞了一行，半点提示都没有。静默过滤比报错更危险，容易让人对缺了数据的结果下定论。

## 修复

删除 `scripts/tv-repin.py`。它没提交过，直接从磁盘删了。这份脚本忠实照搬了 `tradingview_feed.py::_extract_browser_token()`，但前提已经推翻，脚本给不出正确结果，留着只会误导下次排查。

`tradingview_feed.py` 的实际提取路径（`_extract_browser_token` / `_ensure_token`）**还没修**。这条路径实际上一直拿不到东西，部署的 sidecar 很可能在没人察觉的情况下始终处于匿名模式。这轮只查清根因，留了手动办法：先退出，再重新登录，用控制台钩子捕获 `signin` 响应。自动提取留到下一次专门重写。

## 经验

- 本地提取或查询返回空，先确认读的是自己以为的目标，再怀疑数据存不存在，最后才怀疑工具。我把顺序走反，多绕了两圈才回到这里。
- 依赖第三方网站的字段或 cookie，等于押它的实现细节一直不变。隔段时间用真实浏览器流量（DevTools Network/Console）核对，别只信脚本写成那天的观察。
- 给 XHR 挂钩子看响应体，比翻 cookie 表直接。不用猜数据进了哪种存储，只看它经过的地方。下次 token「应该在客户端某处」，但 cookie、`localStorage`、`sessionStorage` 都找不到，就直接看流量，省去逐个排除。

## 相关

- [[zh/Glossary/JWT|JWT]]
- [[zh/Agents/grep-anchor-vs-ls-trailing-slash|grep-anchor-vs-ls-trailing-slash]]
