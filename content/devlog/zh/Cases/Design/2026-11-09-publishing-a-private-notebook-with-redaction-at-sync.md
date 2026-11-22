---
type: case-design
date: 2026-11-09
tags: [design, frontend, nextjs, seo, privacy, redaction, git, vercel]
status: solved
---
# 私有笔记库的同步脱敏与发布

个人主页（Next.js 15、公开 GitHub 仓库、Vercel 从 `main` 部署）加了 `/blog`，用来发这个笔记库。库本身私有，不少笔记写着公司里的系统。==脱敏只在把笔记拷进公开仓库的同步脚本里跑一次，脚本里所有检查都在第一次写文件前跑完，任何一项不过就直接中止。== 浏览器自始至终拿不到原文。

首次公开同步发了 113 篇笔记、18 张图，扣下了 10 篇，因为这些笔记敏感在故事本身。上线核对时抓出一条 bug，三个 PR、两轮 review、185 个测试全漏过去了：`SITE_URL` 指向 `www.kelsonqu.com`，这个域名根本没有 [[zh/Glossary/DNS|DNS]] 记录。

![同步时先在内存中给笔记脱敏，通过十种文本视图检查后才写入镜像并发布。](../../Diagrams/2026-11-09-publishing-a-private-notebook-with-redaction-at-sync.pipeline.svg)

## 背景与约束

- 仓库公开，提交进去的东西就算以后删了，历史里也一直在。
- 开工时共 123 篇笔记，14 篇带工作系统的 `project:` 标记，正文含环境名、环境变量和内部 PR 号。
- 负责人先后定下四条：自动部署；发布时脱敏，打码处画马赛克；后续笔记一条命令发布；敏感在故事本身的先扣下。
- 站点跑在 Tailwind 3 上，任务说明不升 Tailwind 4，也不引 Quartz、Fumadocs 或 Contentlayer 依赖。

## 候选方案

### 博客版式

| 候选 | 2026-11-09 的 star 数 | 结果 |
| --- | --- | --- |
| Quartz 4（`jackyzha0/quartz`，MIT） | 13,558 | 参考版式，站内原生实现 |
| fumadocs | 13,581 | 要 Tailwind 4，本站是 Tailwind 3 |
| timlrx `tailwind-nextjs-starter-blog` | 10,555 | 看过，没选 |
| astro-paper | 5,197 | 基于 Astro，不是 Next.js |

Quartz 专为 Obsidian 内容做：双链、`==高亮==`、Mermaid、按目录组织。但它是独立静态站生成器，嵌不进 Next.js 应用，所以只照它的布局写：左目录树、中正文、右大纲和反向链接，加标签页。

### 脱敏放在哪一步

- **浏览器用 CSS 模糊遮原文。** 原文照样留在公开仓库和构建出的 HTML 里，否决。
- **同步时在拷贝脚本里做。** 仓库和产物里只有打完码的文本，采用。

### 规则放在哪里

- **放公开仓库。** 规则清单本身就是敏感词表，否决。
- **放私有笔记库** `_meta/redactions.txt`，可用 `DEVLOG_REDACTIONS` 覆盖；文件缺或空就中止同步，采用。

## 决定

`scripts/sync-devlog.mjs` 是私有文本进公开仓库的唯一入口。它把所有笔记和图读进内存脱敏，跑一遍兜底检查，有一项不过就一个文件都不写。`npm run devlog:publish` 是镜像进 git 暂存区的唯一命令。

命中文本换成 U+2592（中等灰度方块）串，长度按命中词长向上取整到 4 的倍数、上限 24，不泄露原词长短（`scripts/sync-devlog.mjs:104-106`）。页面包成 `span.redacted` 渲染马赛克（`src/components/blog/mosaic.tsx:7-18`）。

## 文本的第二份拷贝

同样的文字在文件里还有别的位置：

| 拷贝 | 处理 | 位置 |
| --- | --- | --- |
| frontmatter 里的 `project`、`links`、`source`、`triggers` | 镜像里直接剔除 | `scripts/sync-devlog.mjs:35` |
| 根元素 `content` 属性里的 draw.io 可编辑源码 | 剥掉 | `scripts/sync-devlog.mjs:318-331` |
| 每个 `<switch>` 里的 PNG 标签备份 | 剥掉；文本替换碰不到位图 | `scripts/sync-devlog.mjs:324-330` |
| SVG 残留的任何 `data:` 内容 | 同步中止 | `scripts/sync-devlog.mjs:434-437` |
| 输出里出现扣住笔记的文件名 | 同步中止 | `scripts/sync-devlog.mjs:287-291` |

## 两种敏感

**词级敏感**指名字、主机名、标识符这类词，靠规则就能遮住。

**叙事敏感**指故事本身就是秘密，比如客户是谁、基础设施怎么搭的。这种笔记把名词全遮掉故事还在，规则解不了，直接标 `publish: false`。

一共扣下 10 篇。先前跟负责人报的是 9 篇，漏数了一篇技巧笔记，后面消息里更正了。扣掉这 10 篇后要打的码也少了一大截：首次全量同步在 18 篇笔记和 8 张图里打了 397 处码，扣完只剩 9 篇笔记和 3 张图里的 101 处。

## 指向扣住笔记的链接

公开笔记里还有链接指着扣住的笔记：16 篇里共 26 个双链。解析不到的双链会露出目标文件名，专题页还配着一行摘要，单看链接就能猜出被扣笔记的内容。同步在套规则前先清理这些链接（`scripts/sync-devlog.mjs:187-232`）：

1. 列表行里所有链接都指向扣住笔记的，整行删。
2. 其余指向扣住笔记的链接，换成固定 8 字符的码。
3. 原本有列表项的节，经第 1 步删空后连标题和引言一起删；原本就没列表项的节保留。
4. 输出任何地方残留扣住笔记的文件名或 slug，兜底检查直接中止。

第 3 步是看镜像时补的：跑完第 1 步，专题页里冒出 5 节光秃秃的空标题。

## 独立隐私审查

独立审查拿真实笔记库跑了脱敏 PR，没查出泄露，但找出几条出错时仍会放行的口子：

| 问题 | 修法 | 测试 |
| --- | --- | --- |
| 规则逐条串行跑在上一条的输出上，前一条打码可能毁掉后一条 lookbehind 或重叠字面量的上下文；兜底检查又在打完码的文本上重跑同一批规则，抓不出漏网。 | 在原文上收齐所有规则命中区间，合并重叠区间后一次性打码（`scripts/sync-devlog.mjs:146-176`）。 | `scripts/sync-devlog.test.mjs:188`、`:198` |
| 兜底检查只看原始输出。 | 每条规则对着每个输出文件的多种视图复查一遍，命中即中止（`scripts/sync-devlog.mjs:244-293`）。 | `scripts/sync-devlog.test.mjs:499` |
| 规则解析放过了格式错的行。 | `/` 开头的行必须严格符合 `/body/flags`；行尾空白报错；报错只报行号（`scripts/sync-devlog.mjs:65-102`）。 | `scripts/sync-devlog.test.mjs:233` |
| `publish:` 什么值都收。 | 只认 `true` 或 `false`，不区分大小写，可加引号（`scripts/sync-devlog.mjs:48-58`）。 | `scripts/sync-devlog.test.mjs:277`、`:289` |
| 解析不了的 frontmatter 当成了正文，`publish: false` 随之失效。 | 直接报错（`scripts/sync-devlog.mjs:38-46`）。 | `scripts/sync-devlog.test.mjs:108` |

兜底检查的视图：

| 视图 | 还原什么 |
| --- | --- |
| raw | 原样不动 |
| tags joined、tags spaced | `<span>` 或 `<br/>` 拆开的词 |
| entities | 词里的 `&#160;` 或数字实体 |
| unicode spaces | 不换行空格和其他 Unicode 空格 |
| whitespace collapsed | 软换行 |
| percent decoded | `%20` |
| emphasis removed | `**`、`_`、`~~`、`==` |
| all, tags joined / all, tags spaced | 上面几步串起来，对付两步拆分 |

这轮审查把脱敏 PR 的测试从 148 个提到 181 个（同步测试 24 → 52，发布测试 4 → 9）；删空节修复再加 4 个，共 185 个。

## 发布命令

两个镜像目录仍留在 gitignore（`.gitignore:44-46`）。`npm run devlog:publish` 用 `git add -f -A -- <两个目录>` 强加，别处随手跑 `git add -A` 不会误暂存镜像。

| 守卫 | 位置 |
| --- | --- |
| 不在 `main` 上拒绝 | `scripts/publish-devlog.mjs:36-38` |
| 两目录外有暂存就拒绝，`git add` 前后各用 `--no-renames` 查一次 | `scripts/publish-devlog.mjs:26-34`、`:39`、`:52` |
| `origin/main..HEAD` 非空就拒绝，防本地旧提交搭车 | `scripts/publish-devlog.mjs:40-44` |
| 磁盘和暂存区都没的目录跳过，因空匹配 pathspec 会让 `git add` 失败 | `scripts/publish-devlog.mjs:47-51` |
| 提交后确认跟 `origin/main` 的 diff 全落在两目录里，否则撤回提交 | `scripts/publish-devlog.mjs:57-68` |
| push 遭拒就撤回提交，下次从干净状态重跑 | `scripts/publish-devlog.mjs:69-76` |

## 无人值守发布

当天负责人要求发布去掉手工步骤。现在笔记库 `main` 每次推新提交，GitHub Actions 就跑 `npm run devlog:publish`：检出笔记库和站点两仓库，把 `DEVLOG_DIR` 指向笔记库检出目录，拿 deploy key（只限单个仓库的 SSH 密钥，这里仅可写站点仓库）推镜像。

新笔记发出去前不再有人盯，案例因此单独设关口：`Cases/` 下或 `type: case-*` 的笔记，必须 frontmatter 写了 `publish: true` 才发；没写的一律按 `publish: false` 扣住，计入 `held for review`（`scripts/sync-devlog.mjs` 的 `holdReason`）。关口同时看目录和类型，漏写或拼错 `type` 也滑不过去；不看 `project:`，因为 18 篇案例没有该字段。其余类型默认发布，除非标 `publish: false`。

已公开的 24 篇案例补了 `publish: true`，两个案例模板默认 `publish: false`。CI 首跑打印 `held for review: 0` 和 `devlog: nothing changed, nothing committed`。

## 模块划分

| 单元 | 职责 |
| --- | --- |
| `loadPatterns` | 解析笔记库规则文件，有歧义就报错 |
| `hideUnpublished` | 删或打码指向扣住笔记的链接，清理删空的节 |
| `maskText` | 合并区间后打码；SVG 另查实体解码视图 |
| `stripSvg` | 剥注释、根元素 `content` 属性和 PNG 标签备份 |
| `assertClean` | 兜底检查：每条规则、每个扣住文件名在每种视图上复查 |
| `syncDevlog` | 先全量读入检查，再写并清理两目标目录，只打计数 |
| `publishDevlog` | 上述 git 守卫 |

## 数据流

1. 读规则文件，缺、空或格式错直接中止。
2. 读发布目录下每篇笔记，标 `publish: false` 的记为扣住不拷。
3. 每篇待发笔记：规则命中文件名或 slug、或源文件已有 U+2592 即中止；剔私有字段、藏扣住链接、打码、跑兜底检查。
4. 已发笔记引用的每张 SVG：剥离、打码、残余 `data:` URI 即中止、跑兜底检查。
5. 到这里才写 `content/devlog/` 和 `public/blog/diagrams/`，并删掉不再发的文件。
6. `devlog:publish` 提交两目录并推 `main`，Vercel 自动部署。

## 结果

```
notes: 113 copied, 10 skipped, 0 removed; diagrams: 18 copied, 0 removed
redacted: 101 matches in 9 notes and 3 diagrams (0 entity-encoded in SVGs)
held-back links: 21 list lines dropped, 5 links masked, 5 sections removed
```

| 检查 | 结果 |
| --- | --- |
| 131 个镜像文件兜底视图 | 每种视图 0 命中 |
| `npm test` | 27 个文件，185 个测试 |
| 线上 `/sitemap.xml` | 201 个 URL，113 个笔记页 |
| 两篇扣住笔记 URL | 404 |
| `/blog` HTML 里扣住笔记文件名 | 0 |

## 上线核对时才发现的问题

`src/lib/seo.ts:3` 的 `SITE_URL` 原先写着 `https://www.kelsonqu.com`，2025 年就进了仓库。但 `www` 没配 DNS 记录，站点走的是主域。所有 canonical 链接、`og:url`、`og:image` 和 sitemap 全指向解析不了的域名，分享卡片自然刷不出图。

三个 PR、两轮 review、185 个测试全放过了，因为没一步真去解析这个域名，测试只拿 URL 跟这个常量比，自然全对。会话开头写代码前跑过一次 `dig`，在命令沙箱里超时，后面没人补跑：

```
$ dig +short blog.kelsonqu.com www.kelsonqu.com kelsonqu.com
;; connection timed out; no servers could be reached
```

部署后核查抓了出来：

```
$ for h in kelsonqu.com www.kelsonqu.com; do printf '%s: ' "$h"; dig +short "$h" | tr '\n' ' '; echo; done
kelsonqu.com: 172.67.161.130 104.21.65.89
www.kelsonqu.com:
$ curl -sS -o /dev/null -w '%{http_code} %{remote_ip}\n' https://www.kelsonqu.com/blog
curl: (6) Could not resolve host: www.kelsonqu.com
000
```

修复把 `SITE_URL`、`public/robots.txt`、README 链接和 `src/app/sitemap.test.ts` 都改成了主域。上线后再验：

```
<link rel="canonical" href="https://kelsonqu.com"/>
og:image fetch: 200 image/png 24878
sitemap www entries: 0
```

## 未决事项

- **未决：** Shiki 正则引擎（oniguruma wasm）在 jsdom 里跑不起来，`src/lib/devlog.test.ts` 固定跑 node 环境（`src/lib/devlog.test.ts:1`），组件测试没法渲染整篇笔记。真要写时把 Shiki 切 JavaScript 正则引擎就行。
- **未决：** `www.kelsonqu.com` 仍没 DNS 记录，手敲打不开；加一条指向主域的 CNAME 即可。

## 范围之外（YAGNI）

- 不引 Quartz、Fumadocs 或 Contentlayer，不升 Tailwind 4。
- 不处理 `<switch>` 里的 `<text>` 备份：库里的图没有这种结构。
- 两目标目录不处理符号链接。
- 扣住的笔记不改写发布版；要放行就删掉 `publish: false` 再跑发布命令。

参见 [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]。

## 经验与小技巧

- 脱敏放在拷贝文本的环节，别放显示环节。浏览器遮住的东西，仓库和 HTML 里原样躺着。
- 规则表留私有源头，别跟它保护的代码放一起。
- 判一份文件脱敏完前，先列全文本的第二份拷贝：frontmatter、内嵌编辑器源码、位图备份、链接目标。
- 所有规则从原文取区间合并后一次打码。一条规则跑在另一条规则的输出上，测的就不是作者写它时针对的那段文本。
- 兜底检查在打完码的文本上重跑同一批规则查不出新东西，得换多种视图查输出。
- 每篇笔记先分清敏感的是词还是故事，只有前者靠脱敏解得掉。
- 站点 URL 常量证明不了域名能解析。见 [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]] 和 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- 命令沙箱里跑 `npm ci`，缓存改到 `$TMPDIR` 下。见 [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]。

## 相关

- [[zh/Agents/site-url-constant-is-not-proof-the-host-resolves|site-url-constant-is-not-proof-the-host-resolves]]
- [[zh/Agents/npm-ci-eperm-inside-the-command-sandbox|npm-ci-eperm-inside-the-command-sandbox]]
- [[zh/Agents/git-add-multi-pathspec-fails-atomically|git-add-multi-pathspec-fails-atomically]]
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/reproduce-before-fixing-verify-after|reproduce-before-fixing-verify-after]]
- [[zh/Techniques/yagni-and-designing-for-present-requirements|yagni-and-designing-for-present-requirements]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
- [[zh/Glossary/DNS|DNS]] · [[zh/Glossary/SEO|SEO]] · [[zh/Glossary/PR|PR]]
