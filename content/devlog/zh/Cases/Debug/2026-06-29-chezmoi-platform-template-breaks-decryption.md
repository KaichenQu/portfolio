---
type: case-debug
date: 2026-06-29
tags: [debug, infra, chezmoi]
status: solved
---
# chezmoi 加上平台模板后报 decrypt: encryption not configured

## 现象

给 [[zh/Glossary/chezmoi|chezmoi]] 加平台判断（macOS / Termux）时，新建了配置模板 `.chezmoi.toml.tmpl` 来算 `isDarwin` 和 `isTermux`。跑完 `chezmoi init` 验证，接连碰到两个错。

![一次模板重写把数据段标题粘到注释后，又删掉手写的 age 段，造成两个独立故障。](../../Diagrams/2026-06-29-chezmoi-platform-template-breaks-decryption.generated-config.svg)

起初所有文件都渲染不出来，报错如下：

```
chezmoi: template: .chezmoiignore:6:10: executing ".chezmoiignore" at <.isDarwin>: map has no entry for key "isDarwin"
```

修好后又冒出第二个错：

```
chezmoi: .zshrc: template: dot_zshrc.tmpl:200:40: executing "dot_zshrc.tmpl" at <decrypt>: error calling decrypt: encryption not configured
```

`.zshrc` 末尾用 `{{ include "encrypted_secrets.sh.age" | decrypt }}` 解密 API key，这时解密配置却突然没了。

## 复现

源仓库 `~/.local/share/chezmoi` 原本没有配置模板，配置手写在 `~/.config/chezmoi/chezmoi.toml` 里，带着上篇 [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]] 留下的 `[age]` 块。加上 `.chezmoi.toml.tmpl` 后执行：

```bash
chezmoi init        # regenerates ~/.config/chezmoi/chezmoi.toml from the template
chezmoi cat ~/.zshrc
```

## 排查过程

1. 第一个错是 `map has no entry for key "isDarwin"`，说明 `.isDarwin` 没进到 data 里，但 `chezmoi init` 没报错。查生成的配置：

   ```bash
   cat ~/.config/chezmoi/chezmoi.toml
   chezmoi data --format=json | python3 -c "import json,sys; d=json.load(sys.stdin); print({k:d.get(k) for k in ['isDarwin','isTermux']})"
   ```

   输出如下：

   ```
   # ...com.termux/files/usr).[data]
       isDarwin = true
       isTermux = false
   ```
   ```
   {'isDarwin': None, 'isTermux': None}
   ```

   ==`[data]` 粘到了注释行末尾。== 模板开头是几行 `{{- ... -}}` 写的平台判断，后面跟着注释。最后的 `{{- end -}}` 用 `-}}` 把后面的换行也吞掉了，`[data]` 直接接在 `# ...usr).` 后面。TOML 把整行当注释，下面两个 key 成了未知的顶层 key，data 里自然没有这两项，访问 `.isDarwin` 就报找不到。这是 chezmoi 模板的 [[zh/Glossary/whitespace-trimming|whitespace-trimming]] 把结构吃掉了。

2. 改模板：把注释放到判断逻辑之后、`[data]` 之前，末尾改用 `{{- end }}`，保留前面的 `-` 消掉上方空行，去掉后面的 `-` 保住换行。重跑：

   ```bash
   chezmoi init
   chezmoi data --format=json | grep -E 'isDarwin|isTermux'   # isDarwin=true isTermux=false, correct now
   zsh -n <(chezmoi cat ~/.zshrc)
   ```

   第一个错消失了，第二个错露出来：`decrypt: encryption not configured`。

3. 回头看这两次 `chezmoi init` 干了什么。==它按新模板重写了整份 `~/.config/chezmoi/chezmoi.toml`，模板里只有 `[data]`，原来手写的 `[age]` 不在里面。== recipient 和 identity 都没了，报错说没配解密，一点没错。

4. 恢复 age 配置。identity 文件 `key.txt` 还在 `~/.config/chezmoi/`，能从它重新推导出 recipient：

   ```bash
   age-keygen -y ~/.config/chezmoi/key.txt
   # age1uf6w080k5sqjv48ey20ykklkljx7lmp8pjtrvga4c3498rwch4zqkav84h
   ```

   查一下 git，确认旧配置从未入库，也没有别的设置，只在加密那次提交里引入过：

   ```bash
   git log --oneline -- '*chezmoi.toml*'   # empty, never tracked
   ```

## 根因

「加配置模板再跑 `chezmoi init`」同时触发了两个独立问题：

- 模板的 [[zh/Glossary/whitespace-trimming|whitespace-trimming]]（`-}}`）把 `[data]` 表头拉到了注释行末尾，TOML 按错位置解析，data 丢了两个 key。
- ==`chezmoi init` 会用配置模板重写整份生成的配置。== 旧配置是手写的，新模板没带 `[age]`，跑一次 init 就把加密配置抹掉了。旧文件没进 git，找不回来，只能用 `key.txt` 重算 recipient。

## 修复

在 `~/.local/share/chezmoi/.chezmoi.toml.tmpl` 改两处：

- 注释挪到判断逻辑之后、`[data]` 之前，逻辑用 `{{- end }}` 收尾（见排查第 2 步）。
- 把 `encryption = "age"` 和 `[age]` 放到模板顶部。identity 写 `{{ .chezmoi.homeDir }}/.config/chezmoi/key.txt`，recipient 恢复为 `age1uf6w0...`。TOML 的顶层 key 必须写在所有表头之前，所以 `encryption` 要排在 `[age]` 和 `[data]` 前面。

重跑 `chezmoi init` 后，`chezmoi cat ~/.zshrc` 解密正常，`zsh -n` 也过了。用临时配置模拟 `isDarwin=false` / `isTermux=true`，渲染也能正确走 Termux 分支。

## 经验

- 给原先手写配置的工具加模板，等于把配置的唯一来源挪到了模板里。迁移前先把旧文件里的各段都搬过去（这里是 `[age]`），不然第一次 `init` 就会把它丢掉。见 [[zh/Techniques/merge-old-config-before-templating|merge-old-config-before-templating]]。
- 生成的配置看着没问题，还得验它生没生效。文件里明明写着 `isDarwin = true`，但 `[data]` 放错了位置，data 就读不到。见 [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]。
- age 的 recipient 丢了，可以用 `age-keygen -y <identity>` 从 identity 推回来。只要私钥还在，以前的密文都还能解开。见 [[zh/Glossary/age|age]]。

## 相关

- [[zh/Glossary/chezmoi|chezmoi]] [[zh/Glossary/age|age]] [[zh/Glossary/whitespace-trimming|whitespace-trimming]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]，上一篇配好的 age 配置正是这次丢掉的那份
- [[zh/Techniques/config-on-disk-is-not-config-in-effect|config-on-disk-is-not-config-in-effect]]
- [[zh/Techniques/merge-old-config-before-templating|merge-old-config-before-templating]]
