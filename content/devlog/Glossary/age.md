---
type: glossary
tags: [glossary, infra, security]
---
# age

**Full name**: age (file encryption tool)

A minimal, modern file encryption tool (`brew install age`), positioned as a replacement for gpg for the narrow job of "encrypt one file." Uses a keypair: the public key (recipient, `age1...`) encrypts, the private key (identity, stored in `key.txt`) decrypts. None of gpg's keyring, web-of-trust, or subkey complexity.

Paired with [[chezmoi]]: set `encryption = "age"` in `chezmoi.toml` with an identity/recipient, and the ciphertext `chezmoi encrypt` produces (`encrypted_*.age`) can go safely into git. The `age` private key `key.txt` is kept separately and never committed — it's the only thing that can decrypt; lose it and the ciphertext is gone for good.

```bash
age-keygen -o key.txt          # generate a keypair; the public key is in the comment line
age -r age1... -o x.age x      # encrypt
age -d -i key.txt x.age        # decrypt
```

## Related
- [[chezmoi]]
- [[2026-06-29-chezmoi-plaintext-secrets-to-age-encryption]]
