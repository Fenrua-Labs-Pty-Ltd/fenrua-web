# Public repository secret boundary

Status: active release control
Effective: 2026-07-14

`fenrua-web` contains public source, public verification keys, sanitized
evidence, and empty configuration placeholders only. It must never contain a
gateway credential, storage credential, signing private key, account token,
password, credential-bearing URL, local environment file, vault, or encrypted
secret bundle.

Production values belong in the deployment provider's encrypted server-only
environment. Ciphertext-only recovery bundles may be retained in the separately
authorized private operations repository. The decryption identity and signing
private key remain ACL-restricted, OS-protected, and outside every repository.
Neither plaintext nor ciphertext secret bundles may enter this public source or
its release artifacts.

The release gate `npm run check:secret-boundary` scans tracked, untracked, and
ignored working-tree files, except `.git` internals and installed dependencies,
without printing matched values. It rejects
secret-bearing filenames and extensions, private-key material, known provider
credential formats, credentialed URLs, nonempty sensitive `.env` values, and
non-fixture hardcoded sensitive literals. GitHub provider secret scanning and
push protection remain enabled as an independent history and push-time control.

This local gate is defense in depth, not a claim that pattern matching can
identify every possible credential. Human review, narrowly scoped provider
credentials, rotation after suspected exposure, and platform secret scanning
remain mandatory.
