# Fenrua BlackBox Protocol — Layer 0 AI Security Architecture

Status: public architecture foundation  
Last reviewed: 2026-07-22
Maturity: reference architecture with implemented evidence surfaces

## Category

This document describes Fenrua's Layer 0 AI security-control subsystem within
the broader Fenrua BlackBox Protocol direction for privacy-preserving protocol
infrastructure, verifiable AI automation, and related technology-services scope.

Fenrua provides the identity, authority, integrity, policy, evidence,
verification, containment, and recovery layer beneath autonomous AI systems.

## Linux Analogy

Within this subsystem, Fenrua aims to do for AI security controls what Linux did
for computing infrastructure:
provide an open, modular, inspectable, composable foundation that other systems
can depend on without surrendering control to a single application vendor.

This analogy is structural, not decorative. The public interface is organized
around kernel space, user space, stable interfaces, reproducible evidence, and
maturity-labelled utilities.

## AI Stack Position

```text
USERS, OPERATORS, ORGANISATIONS
        down
AI APPLICATIONS AND WORKFLOWS
        down
AGENTS, MODELS, TOOLS, ORCHESTRATORS
        down
COMPUTE, DATA, APIS, CLOUD, CHAINS
        down
FENRUA USER-SPACE INTEGRATIONS
        down
FENRUA SECURITY KERNEL
        down
IDENTITY · AUTHORITY · INTEGRITY · POLICY
EVIDENCE · VERIFICATION · CONTAINMENT · RECOVERY
```

This subsystem secures, constrains, records, and verifies upper layers. It does
not replace them.

## Kernel Space

Kernel-space functions:

- AI entity identity.
- Artifact identity.
- Operator identity.
- Authority evaluation.
- Policy enforcement.
- Runtime integrity verification.
- Evidence creation and signing.
- Evidence verification.
- Execution gating.
- Containment, revocation, quarantine, and recovery.
- Registry anchoring where justified.
- Human approval enforcement.

## User Space

User-space modules may include:

- Coding-agent adapters.
- Model-provider adapters.
- Tool adapters.
- Repository and CI integrations.
- Cloud and database adapters.
- Wallet and chain adapters.
- Evidence explorers.
- Incident interfaces.
- Organization workflows.

Every user-space utility must carry purpose, inputs, outputs, security boundary,
maturity, repository path, schema, test evidence, relevant tools, and
limitations.

## Operating Flows

1. Pre-execution policy evaluation.
2. Tool-call authorization.
3. Runtime-integrity verification.
4. Evidence-bundle creation.
5. Revocation and quarantine.
6. Research-to-kernel translation.
7. Toolchain-to-evidence mapping.

## Non-Claims

Fenrua is an evolving research and infrastructure project. Individual
primitives, schemas, tools, utilities, contracts, and integrations may have
different maturity levels. Public evidence defines what is currently
implemented, tested, deployed, or still under development.
