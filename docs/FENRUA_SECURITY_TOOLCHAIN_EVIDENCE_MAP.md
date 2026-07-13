# Fenrua Security Toolchain Evidence Map

Status: public evidence map  
Last reviewed: 2026-07-12

## Machine-Readable Source

The public machine-readable source is:

- `data/toolchain-registry.json`

The public route is:

- `/toolchain/`

## Evidence Categories

| Category | Evidence Role | Public Boundary |
| --- | --- | --- |
| Solidity and EVM | Compilation, fuzzing, invariant testing, symbolic execution, static analysis | No public contract or financial-offering evidence is published |
| ZK and cryptography | Circuit compilation, inspection, witness/proof tooling, cryptographic utilities | Setup and ceremony assumptions must be stated |
| Application and web | Node validation, static links, public discovery, telemetry tests | Static website validation only |
| Native compilation | Compiler and runtime inventory for kernel research environment | Version capture is not production assurance |
| Infrastructure | Container, Supabase, chain client, and orchestration inventory | No secrets, private topology, or admin endpoints |
| Source control | Git, GitHub CLI, editor inventory | Editor presence is not security tooling |
| Supporting CLI | Search, transport, archive, signing, reproducibility support | Role must be specific and limited |

## Evidence-Producing Tools In This Website

- Node.js.
- npm.
- Repository-local validation scripts.
- Git.
- Ripgrep.

These tools produce or support current website evidence. Other tools may be
installed and executed for version capture without being part of the canonical
website validation pipeline.

## SnarkJS Note

Local `snarkjs` version capture and the inspected kernel manifest both report
`0.7.6`. The adjacent `1.13.8` version in the kernel package is `underscore`.
