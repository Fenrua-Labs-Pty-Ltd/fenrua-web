# Fenrua AI Efficiency Evidence Standard

Status: research measurement standard
Last reviewed: 2026-07-14

## Purpose

This standard defines the minimum evidence required before Fenrua publishes a
performance, efficiency, or comparative capability claim. It does not publish
a benchmark result, a service-level objective, or a production-performance
assertion.

No current performance, latency, throughput, energy, cost, or comparative
efficiency result is published by this standard.

## Definition

For this standard, AI efficiency is a measured relationship between a declared
workload, the resources consumed to complete it, and a declared quality or
safety constraint. It is not a universal property of a model, a chain
observation, a release manifest, or an installed tool.

An efficiency statement is meaningful only for its exact workload, baseline,
environment, method, and uncertainty boundary.

## Required Claim Envelope

Every future public efficiency result must identify all of the following:

| Field | Required disclosure |
| --- | --- |
| Workload definition | Inputs, task, dataset or fixture provenance, expected output, and excluded cases. |
| Baseline | Named comparison method, version, configuration, and reason it is an appropriate reference. |
| Environment | Hardware, operating system, runtime, dependency versions, isolation conditions, and any network state. |
| Measurement method | Warmup, run count, timing boundary, aggregation method, instrumentation, and failure handling. |
| Quality constraint | Correctness, policy, safety, accuracy, or other result-quality condition that must remain satisfied. |
| Uncertainty | Variability, confidence method where applicable, known confounders, and limits on generalisation. |
| Reproducible artifact | Versioned source revision, fixture or dataset reference, commands, result record, and integrity digest. |

## Candidate Measures

The applicable measure must match the declared workload. Candidate measures
include median and p95 latency, throughput, compute utilisation, memory,
energy or a defensible energy estimate, model-call and token efficiency,
tool-call success and retry cost, policy-decision overhead, evidence-generation
overhead, verification overhead, false-positive and false-negative cost,
human-review burden, and containment or recovery cost.

No measure is a standalone quality claim. A lower resource figure is not an
improvement when the stated quality constraint, safety condition, or supported
workload changes.

## Measurement Protocol

1. Freeze the workload, baseline, environment, and output-quality constraint.
2. Record inputs, versions, configuration, and any network or cache state.
3. Run a declared warmup and repeated measurement procedure with a defined
   failure policy.
4. Preserve raw or safely summarised observations, aggregation steps, and the
   uncertainty calculation in an evidence bundle.
5. Re-run the procedure from a clean environment before publishing a result.
6. Record known limitations, excluded workloads, and conditions that would
   invalidate comparison.

The procedure must not hide retries, failed runs, policy denials, or material
quality regressions to improve a headline metric.

## Publication Gate

A public efficiency result may be published only when its claim record links to
the complete claim envelope, a source revision, a dated evidence record, and
an explicit limitation. Comparative wording additionally requires a named
baseline and the same quality constraint for both sides of the comparison.

Results without those inputs remain research questions, design proposals, or
unpublished measurements. They must not be described as faster, lower cost,
more efficient, production-ready, or generally available.

## Promotion Boundary

This standard is a research governance artifact. It does not promote the Local
Trust Gate, a verifier, an API, an SDK, a chain observation, or an
agreement-specific service. A product capability requires its own implementation,
threat model, evidence bundle, limitations, and release decision before any
availability change.

## Evidence Retention And Supersession

Retain the declared source revision, method, permitted result record, and
integrity digest for the stated claim lifetime. A result becomes superseded
when its workload, baseline, environment, method, or quality constraint changes
materially. Supersession does not erase the prior result; it limits the prior
result to its recorded scope.

## Non-Claims

- This document does not establish a current benchmark, performance target, or
  service-level objective.
- This document does not establish field performance, production capacity, or
  a reliability commitment.
- This document does not establish a comparison with another organisation,
  model, product, or service.
- This document does not replace independent review, operational evidence, or
  an owner-approved release decision.
