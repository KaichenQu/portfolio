---
type: glossary
tags: [glossary, infra, security]
---
# age

**全称**：age（文件加密工具）

简洁的现代文件加密工具（`brew install age`），定位是在「加密单个文件」这件事上替代 gpg。它用密钥对：公钥用来加密，叫 recipient，形如 `age1...`；私钥用来解密，叫 identity，存在 `key.txt` 里。没有 gpg 的钥匙环、信任网和子密钥那套复杂结构。

![age 用接收方公钥把 x 加密成 x.age，再由对应的 key.txt 私钥解密。](../Diagrams/age.recipient-and-identity.svg)

搭配 [[zh/Glossary/chezmoi|chezmoi]] 时，在 `chezmoi.toml` 设 `encryption = "age"`，配好 identity/recipient，`chezmoi encrypt` 产出的密文（`encrypted_*.age`）就可以安全放进 git。`age` 私钥 `key.txt` 要另存，绝不提交。只有它能解密，丢了就再也解不开密文。

```bash
age-keygen -o key.txt          # generate a keypair; the public key is in the comment line
age -r age1... -o x.age x      # encrypt
age -d -i key.txt x.age        # decrypt
```

## 相关

- [[zh/Glossary/chezmoi|chezmoi]]
- [[zh/Cases/Design/2026-06-29-chezmoi-plaintext-secrets-to-age-encryption|2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
