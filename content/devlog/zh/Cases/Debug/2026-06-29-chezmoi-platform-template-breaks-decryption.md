---
type: case-debug
date: 2026-06-29
tags: [debug, infra, chezmoi]
status: solved
---
# chezmoi 加上平台模板后报 decrypt: encryption not configured

## 现象

给 [[zh/Glossary/chezmoi|chezmoi]] 加平台判断（macOS / Termux）时，新建了配置模板 `.chezmoi.toml.tmpl`，计算 `isDarwin` 和 `isTermux`。跑完 `chezmoi init` 验证，先后碰到两个错误。

![一次模板重写把数据段标题粘到注释后，又删掉手写的 age 段，造成两个独立故障。](../../Diagrams/2026-06-29-chezmoi-platform-template-breaks-decryption.generated-config.svg)

起初任何文件都渲染不出来，报错如下。

```
chezmoi: template: .chezmoiignore:6:10: executing ".chezmoiignore" at <.isDarwin>: map has no entry for key "isDarwin"
```

修好后又报了第二个错。

```
chezmoi: .zshrc: template: dot_zshrc.tmpl:200:40: executing "dot_zshrc.tmpl" at <decrypt>: error calling decrypt: encryption not configured
```

`.zshrc` 末尾用 `{{ include "encrypted_secrets.sh.age" | decrypt }}` 解密 API key，这时解密配置却突然没了。

## 复现

源仓库 `~/.local/share/chezmoi` 原本没有配置模板，配置是手写在 `~/.config/chezmoi/chezmoi.toml` 里的，带有上篇 [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] 留下的 `[age]` 块。加上 `.chezmoi.toml.tmpl` 后运行：

```bash
chezmoi init        # regenerates ~/.config/chezmoi/chezmoi.toml from the template
chezmoi cat ~/.zshrc
```

## 排查过程

1. 第一处错误是 `map has no entry for key "isDarwin"`，说明 `.isDarwin` 根本没进 data，但 `chezmoi init` 没报错。检查生成的配置：

   ```bash
   cat ~/.config/chezmoi/chezmoi.toml
   chezmoi data --format=json | python3 -c "import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ['isDarwin','isTermux']})"
   ```

   关键输出如下。

   ```
   # ...com.termux/files/usr).[data]
       isDarwin = true
       isTermux = false
   ```
   ```
   {'isDarwin': None, 'isTermux': None}
   ```

   ==`[data]` 贴到了注释行的末尾。== 模板开头是几行用 `{{- ... -}}` 写的平台判断，后面跟着注释。最后的 `{{- end -}}` 用 `-}}` 吞掉了后面的换行，于是 `[data]` 直接接到 `# ...usr).` 后面。TOML 把整行当注释，两个 key 成了未知的顶层 key，data 里没有这两项，访问 `.isDarwin` 就报找不到。这是 chezmoi 模板的 [[zh/Glossary/whitespace-trimming|whitespace-trimming]] 把结构吃掉了。

2. 调整模板：把注释放到判断逻辑之后、`[data]` 之前；最后改用 `{{- end }}`。保留前面的 `-` 去掉上方空行，去掉后面的 `-` 留住换行。重跑：

   ```bash
   chezmoi init
   chezmoi data --format=json | grep -E 'isDarwin|isTermux'   # isDarwin=true isTermux=false, correct now
   zsh -n <(chezmoi cat ~/.zshrc)
   ```

   第一个错误消失，第二个错误露了出来：`decrypt: encryption not configured`。

3. 回头看这两次 `chezmoi init` 做了什么。==它按新模板重写了整份 `~/.config/chezmoi/chezmoi.toml`，而模板里只有 `[data]`，原来手写的 `[age]` 不在里面。== recipient 和 identity 都没了，报错说没配置解密，确实如此。

4. 恢复 age 配置。identity 文件 `key.txt` 还在 `~/.config/chezmoi/`，可以从它重新推导 recipient：

   ```bash
   age-keygen -y ~/.config/chezmoi/key.txt
   # age1uf6w080k5sqjv48ey20ykklkljx7lmp8pjtrvga4c3498rwch4zqkav84h
   ```

   确认旧配置从未纳入 git，也没有别的设置，只有加密那次提交才引入了它：

   ```bash
   git log --oneline -- '*chezmoi.toml*'   # empty, never tracked
   ```

## 根因

「加配置模板，再跑 `chezmoi init`」同时触发了两处独立的问题。

- 模板的 [[zh/Glossary/whitespace-trimming|whitespace-trimming]]（`-}}`）把 `[data]` 表头拖到了注释行末尾。TOML 按错了位置解析，data 丢了两个 key。
- ==`chezmoi init` 会用配置模板重写整份生成的配置。== 原有配置是手写的，新模板没有 `[age]`，只跑一次 init 就抹掉了加密配置。原来的手写内容没进 git，也就没法从 git 找回，只能用 `key.txt` 重建 recipient。

## 修复

在 `~/.local/share/chezmoi/.chezmoi.toml.tmpl` 里改两处。

- 注释放在判断逻辑之后、`[data]` 之前，逻辑以 `{{- end }}` 收尾（见排查第 2 步）。
- 把 `encryption = "age"` 和 `[age]` 放到模板顶部。identity 用 `{{ .chezmoi.homeDir }}/.config/chezmoi/key.txt`，recipient 恢复成 `age1uf6w0...`。TOML 的顶层 key 必须写在任何表头之前，所以 `encryption` 要排在 `[age]` 和 `[data]` 前面。

重跑 `chezmoi init` 后，`chezmoi cat ~/.zshrc` 正常解密，`zsh -n` 也通过。临时配置模拟 `isDarwin=false` / `isTermux=true`，渲染也正确走了 Termux 分支。

## 经验

- 给原先靠手写配置的工具引入模板，等于把配置的唯一来源从文件移到了模板。迁移前先把手写文件的各段都搬过去，这里是 `[age]`，否则第一次 `init` 就会把它丢掉。见 [[zh/Techniques/merge-old-config-before-templating|merge-old-config-before-templating]]。
- 生成的配置看起来没问题，还得验它有没有生效。文件里明明有 `isDarwin = true`，可 `[data]` 放错了，data 就读不到它。见 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- age 的 recipient 丢了可以用 `age-keygen -y <identity>` 从 identity 推回来。只要私钥还在，历史密文仍能解开。见 [[zh/Glossary/age|age]]。

## 相关

- [[zh/Glossary/chezmoi|chezmoi]] [[zh/Glossary/age|age]] [[zh/Glossary/whitespace-trimming|whitespace-trimming]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]，上一篇设置的 age 配置正是这次丢掉的那份
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/merge-old-config-before-templating|merge-old-config-before-templating]]
