---
type: case-design
date: 2026-11-09
tags: [design, frontend, nextjs, seo, privacy, redaction, git, vercel]
status: solved
---
# 私有笔记库的同步脱敏与发布

个人主页（Next.js 15，公开的 GitHub 仓库，Vercel 从 `main` 部署）加了 `/blog`，发布的就是这个笔记库。笔记库是私有的，不少笔记写的是公司里的系统。==脱敏只在把笔记从库里拷进仓库的脚本里做一次，脚本里每项检查都在第一次写文件之前跑完，任何一项不过就整体中止。== 浏览器从头到尾拿不到原文。

第一次公开同步发了 113 篇笔记、18 张图。扣下了 10 篇，因为这些笔记敏感的是故事本身。上线后核对时发现了 bug，三个 PR、两轮 review、185 个测试都没拦住：`SITE_URL` 指向 `www.kelsonqu.com` ，而这个域名根本没有 [[zh/Glossary/DNS|DNS]] 记录。

![同步时先在内存中给笔记脱敏，通过十种文本视图检查后才写入镜像并发布。](../../Diagrams/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync.pipeline.svg)

## 背景与约束

- 仓库是公开的。提交进去的东西，后面再删也还留在历史里。
- 开工时有 123 篇笔记，其中 14 篇带工作系统的 `project:` 标记，正文里有环境名、环境变量和内部 PR 编号。
- 负责人先后定了四件事：自动部署；发布时脱敏，打码部分画成马赛克；以后的笔记一条命令发布；敏感在叙事上的笔记先扣住。
- 站点用的是 Tailwind 3。任务说明排除了升级 Tailwind 4，也不引入 Quartz、Fumadocs 或 Contentlayer 依赖。

## 候选方案

### 博客版式

| 候选 | 2026-11-09 的 star 数 | 结果 |
| --- | --- | --- |
| Quartz 4（`jackyzha0/quartz` ，MIT） | 13,558 | 选作版式参考，在站内原生实现 |
| fumadocs | 13,581 | 要求 Tailwind 4，站点是 Tailwind 3 |
| timlrx `tailwind-nextjs-starter-blog` | 10,555 | 看过，没选 |
| astro-paper | 5,197 | 基于 Astro，不是 Next.js |

Quartz 就是给 Obsidian 内容做的：双链、`==高亮==` 、Mermaid、按文件夹组织。它本身是独立的静态站生成器，挂不进 Next.js 应用，所以博客只照搬它的版式：左边目录树，中间正文，右边目录和反向链接，外加标签页。

### 脱敏放在哪一步

- **浏览器里用 CSS 模糊盖住原文。** 原文还在公开仓库和构建出的 HTML 里。否决。
- **同步时在拷贝脚本里做。** 仓库和构建产物里只有打过码的文本。采用。

### 规则放在哪里

- **放在公开仓库。** 规则列表本身就是敏感词清单。否决。
- **放在私有笔记库**，`_meta/redactions.txt` ，可以用 `DEVLOG_REDACTIONS` 覆盖。文件缺失或为空，同步直接中止。采用。

## 决定

`scripts/sync-devlog.mjs` 里的同步是私有文本进公开仓库的唯一关口。它读入所有笔记和图，在内存里脱敏，对输出跑一遍兜底检查，有一项不过就一个文件都不写。`npm run devlog:publish` 是镜像进 git 暂存区的唯一入口。

命中的文本换成 U+2592（中等灰度方块）组成的串。串长取命中长度向上取整到 4 的倍数，最多 24，这样藏起来的词有多长不会泄露（`scripts/sync-devlog.mjs:104-106`）。页面把每个串包进 `span.redacted` ，画成马赛克（`src/components/blog/mosaic.tsx:7-18`）。

## 文本的第二份拷贝

同样的文字在每个文件里还有别的落脚处：

| 拷贝 | 处理 | 位置 |
| --- | --- | --- |
| frontmatter 里的 `project` 、`links` 、`source` 、`triggers` | 镜像里直接去掉 | `scripts/sync-devlog.mjs:35` |
| 根元素 `content` 属性里的 draw.io 可编辑源码 | 剥掉 | `scripts/sync-devlog.mjs:318-331` |
| 每个 `<switch>` 里的 PNG 标签备份 | 剥掉；文本替换碰不到位图 | `scripts/sync-devlog.mjs:324-330` |
| SVG 里残留的任何 `data:` 内容 | 同步中止 | `scripts/sync-devlog.mjs:434-437` |
| 输出里出现扣住笔记的文件名 | 同步中止 | `scripts/sync-devlog.mjs:287-291` |

## 两种敏感

**词级敏感**是名字、主机名、标识符这类东西，一条规则就能盖住。

**叙事敏感**是故事本身就是秘密：客户是谁，基础设施怎么布的。这种笔记把名词全打上码，故事还在，规则解决不了。这些笔记加 `publish: false` 。

扣住的是 10 篇。之前跟负责人说的是 9 篇，漏数的那篇是技巧笔记，后来的消息里改正了。扣住它们以后要打码的地方也少了很多：第一次全量同步在 18 篇笔记和 8 张图里打了 397 处码，扣住之后只剩 9 篇笔记和 3 张图里的 101 处。

## 指向扣住笔记的链接

已发布的笔记里还有链接指向扣住的笔记：16 篇笔记里共 26 个双链。解析不到的链接会显示目标的文件名，专题页还在每个链接旁边配一句摘要，光凭链接就能看出被扣笔记写了什么。同步在套用规则之前先处理这些链接（`scripts/sync-devlog.mjs:187-232`）：

1. 列表行里的链接全部指向扣住的笔记，整行去掉。
2. 其余指向扣住笔记的链接，换成固定 8 个字符的码。
3. 某一节原本有列表项、第 1 步后一项不剩，连标题和引言一起删。从来没有列表项的节保留。
4. 输出里任何地方还留着扣住笔记的文件名或 slug，兜底检查就中止。

第 3 步是看了镜像才加的：第 1 步之后，专题页里有 5 节只剩光秃秃的标题。

## 独立隐私审查

独立审查用真实笔记库跑了脱敏 PR，没有发现泄露，但找出几条出错时会放行的路径：

| 问题 | 修法 | 测试 |
| --- | --- | --- |
| 规则一条接一条地跑，每条都作用在上一条的输出上。前面打的码可能抹掉后面 lookbehind 或重叠字面量需要的上下文；兜底检查又在打过码的文本上重跑同一批规则，看不出漏网的。 | 在原文上收集所有规则的命中区间，合并重叠区间，只打一次码（`scripts/sync-devlog.mjs:146-176`）。 | `scripts/sync-devlog.test.mjs:188` 、`:198` |
| 兜底检查只看原始输出。 | 每条规则都在每个输出文件的多种视图上再查一遍，命中就中止（`scripts/sync-devlog.mjs:244-293`）。 | `scripts/sync-devlog.test.mjs:499` |
| 规则解析放过了格式不对的行。 | 以 `/` 开头的行必须正好是 `/body/flags` ；行尾空白直接报错；报错只给行号（`scripts/sync-devlog.mjs:65-102`）。 | `scripts/sync-devlog.test.mjs:233` |
| `publish:` 什么值都收。 | 只收 `true` 或 `false` ，不分大小写，可加引号（`scripts/sync-devlog.mjs:48-58`）。 | `scripts/sync-devlog.test.mjs:277` 、`:289` |
| 解析不了的 frontmatter 被当成正文，`publish: false` 就失效了。 | 直接报错（`scripts/sync-devlog.mjs:38-46`）。 | `scripts/sync-devlog.test.mjs:108` |

兜底检查的视图：

| 视图 | 还原什么 |
| --- | --- |
| raw | 什么都不做 |
| tags joined、tags spaced | `<span>` 或 `<br/>` 拆开的词 |
| entities | 词中间的 `&#160;` 或数字实体 |
| unicode spaces | 不换行空格和其他 Unicode 空格 |
| whitespace collapsed | 软换行 |
| percent decoded | `%20` |
| emphasis removed | `**` 、`_` 、`~~` 、`==` |
| all, tags joined / all, tags spaced | 上面几步串起来，对付要两步才能还原的拆分 |

审查这一轮让脱敏 PR 的测试从 148 个涨到 181 个（同步测试从 24 到 52，发布测试从 4 到 9）。删空节的修复又加了 4 个，共 185 个。

## 发布命令

两个镜像目录仍然在 gitignore 里（`.gitignore:44-46`）。`npm run devlog:publish` 用 `git add -f -A -- <两个目录>` 强制加入，所以别处随手一个 `git add -A` 也暂存不了镜像。

| 守卫 | 位置 |
| --- | --- |
| 不在 `main` 上就拒绝 | `scripts/publish-devlog.mjs:36-38` |
| 两个目录之外有暂存就拒绝，`git add` 前后各用 `--no-renames` 查一次 | `scripts/publish-devlog.mjs:26-34` 、`:39` 、`:52` |
| `origin/main..HEAD` 不为空就拒绝，免得之前的本地提交搭车 | `scripts/publish-devlog.mjs:40-44` |
| 磁盘上和暂存区里都没有的目录跳过，因为 pathspec 一个都匹配不上时 `git add` 会失败 | `scripts/publish-devlog.mjs:47-51` |
| 提交后确认和 `origin/main` 的 diff 只落在两个目录里，否则撤销提交 | `scripts/publish-devlog.mjs:57-68` |
| push 被拒就撤销提交，下次能从干净状态重跑 | `scripts/publish-devlog.mjs:69-76` |

## 无人值守发布

当天负责人又要求发布不再手动跑命令。现在笔记库 `main` 每次有新提交，GitHub Actions 就跑一遍 `npm run devlog:publish` ：检出笔记库和站点两个仓库，把 `DEVLOG_DIR` 指向笔记库的检出目录，再用 deploy key（只对单个仓库生效的 SSH 密钥，这里只能写站点仓库）推送镜像。

新笔记上线前不再有人看，所以案例单独加了关口。`Cases/` 下的笔记，或者 `type: case-*` 的笔记，frontmatter 里写了 `publish: true` 才发布。没写这行的和 `publish: false` 一样扣住，并计入 `held for review` 那一行（`scripts/sync-devlog.mjs` 里的 `holdReason` ）。关口同时看目录和类型，`type` 漏写或拼错也放不过去。它不看 `project:` ，因为有 18 篇案例没有这个字段。其他类型的笔记照旧发布，除非写了 `publish: false` 。

已经公开的 24 篇案例补了 `publish: true` ，两个案例模板默认 `publish: false` 。CI 里第一次运行打印的是 `held for review: 0` 和 `devlog: nothing changed, nothing committed` 。

## 模块划分

| 单元 | 职责 |
| --- | --- |
| `loadPatterns` | 解析笔记库里的规则文件；有歧义就报错 |
| `hideUnpublished` | 去掉或打码指向扣住笔记的链接；删掉删空了的节 |
| `maskText` | 合并区间后打码；SVG 还要在解码实体后的视图上查 |
| `stripSvg` | 去掉注释、根元素的 `content` 属性和 PNG 标签备份 |
| `assertClean` | 兜底检查：每条规则、每个扣住的文件名，在每种视图上都查 |
| `syncDevlog` | 先读入并检查全部内容，再写入、清理两个目标目录，只打印计数 |
| `publishDevlog` | 上面那些 git 守卫 |

## 数据流

1. 读规则文件；缺失、为空或格式不对就中止。
2. 读入发布目录里的每篇笔记。带 `publish: false` 的记为扣住，不拷贝。
3. 每篇要发布的笔记：规则命中它的文件名或 slug，或者源文件里已经有 U+2592，就中止；去掉私有字段，隐藏扣住笔记的链接，打码；跑兜底检查。
4. 已发布笔记引用的每张 SVG：剥离，打码，还有 `data:` URI 就中止，跑兜底检查。
5. 到这一步才写 `content/devlog/` 和 `public/blog/diagrams/` ，并删掉不再发布的文件。
6. `devlog:publish` 提交这两个目录并 push `main` ，Vercel 随之部署。

## 结果

```
notes: 113 copied, 10 skipped, 0 removed; diagrams: 18 copied, 0 removed
redacted: 101 matches in 9 notes and 3 diagrams (0 entity-encoded in SVGs)
held-back links: 21 list lines dropped, 5 links masked, 5 sections removed
```

| 检查 | 结果 |
| --- | --- |
| 131 个镜像文件上的兜底视图 | 每种视图都是 0 命中 |
| `npm test` | 27 个文件，185 个测试 |
| 线上 `/sitemap.xml` | 201 个 URL，113 个是笔记页 |
| 两篇扣住笔记的 URL | 404 |
| `/blog` HTML 里扣住笔记的文件名 | 0 |

## 上线核对时才发现的问题

`src/lib/seo.ts:3` 里的 `SITE_URL` 原来是 `https://www.kelsonqu.com` 。这个地址 2025 年就进了仓库，比这次的工作早。`www` 没有 DNS 记录，提供站点的是主域。所有 canonical 链接、`og:url` 、`og:image` 和 sitemap 条目都指向解析不了的域名，分享卡片也就加载不出图。

三个 PR、两轮 review、185 个测试都没拦住，因为没有哪一步去解析这个域名。测试拿 URL 和这个常量比，自然一致。会话一开始、还没写代码时跑过一次 `dig` ，在命令沙箱里超时了，之后没人重跑：

```
$ dig +short blog.kelsonqu.com www.kelsonqu.com kelsonqu.com
;; connection timed out; no servers could be reached
```

部署后的核对抓到了它：

```
$ for h in kelsonqu.com www.kelsonqu.com; do printf '%s: ' "$h"; dig +short "$h" | tr '\n' ' '; echo; done
kelsonqu.com: 172.67.161.130 104.21.65.89
www.kelsonqu.com:
$ curl -sS -o /dev/null -w '%{http_code} %{remote_ip}\n' https://www.kelsonqu.com/blog
curl: (6) Could not resolve host: www.kelsonqu.com
000
```

修复把 `SITE_URL` 、`public/robots.txt` 、README 里的链接和 `src/app/sitemap.test.ts` 都改成了主域。部署之后：

```
<link rel="canonical" href="https://kelsonqu.com"/>
og:image fetch: 200 image/png 24878
sitemap www entries: 0
```

## 未决事项

- **未决：** Shiki 的正则引擎（oniguruma wasm）在 jsdom 下跑不起来，所以 `src/lib/devlog.test.ts` 固定用 node 环境（`src/lib/devlog.test.ts:1`），组件测试没法渲染整篇笔记。真要写这种测试时，把 Shiki 换成 JavaScript 正则引擎就行。
- **未决：** `www.kelsonqu.com` 还是没有 DNS 记录，手敲这个地址打不开。加一条指向主域的 CNAME 就能解决。

## 范围之外（YAGNI）

- 不引入 Quartz、Fumadocs 或 Contentlayer，不升级 Tailwind 4。
- 不处理 `<switch>` 里的 `<text>` 备份：笔记库的图里没有这种情况。
- 两个目标目录不处理符号链接。
- 扣住的笔记不改写成能发布的版本；要放出某篇，删掉它的 `publish: false` ，再跑发布命令。

参见 [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]。

## 经验与小技巧

- 脱敏放在拷贝文本的地方，不放在显示文本的地方。浏览器藏起来的东西，仓库和 HTML 里照样有。
- 规则列表留在私有的源头，别放在它要保护的代码旁边。
- 说一个文件脱敏完了之前，先把文本的每份拷贝列全：frontmatter、内嵌的编辑器源码、位图备份、链接目标。
- 所有规则在同一组区间上打码，区间从原文上取。一条规则跑在另一条规则的输出上，测的就不是作者写它时针对的那段文本。
- 兜底检查要是在打过码的文本上重跑同一批规则，什么新东西也查不出来。得给它换几种视图看输出。
- 每篇笔记先判断敏感的是词还是故事。只有前一种是脱敏能解决的。
- 站点 URL 常量不能证明域名解析得了。见 [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]，还有 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- 命令沙箱里跑 `npm ci` ，缓存要放到 `$TMPDIR` 下面。见 [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]。

## 相关

- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]
- [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]
- [[zh/Agents/git-add-multi-pathspec-fails-atomically|git-add-multi-pathspec-fails-atomically]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
- [[zh/Glossary/DNS|DNS]] · [[zh/Glossary/SEO|SEO]] · [[zh/Glossary/PR|PR]]
