# ADR 0001 — Scope, visibility, and the data boundary

**Date:** 2026-10-27 · **Status:** accepted

## Context

Atlas is a public learning platform built by someone between roles, with a $0
compute budget: Ollama locally on an M4 Pro (24 GB unified), free hosted tiers
for anything local can't do, Kaggle for training. It doubles as portfolio
evidence for senior AI-engineer and forward-deployed-engineer roles.

Three constraints collide: the repo must be public to be evidence, free hosted
tiers train on inputs to subsidise themselves, and the eventual capstone (P6)
touches a real organisation's real workflow.

## Decisions

1. **The repository is public.** Portfolio value comes from being checkable. A
   private repo of impressive work is a rumour.
2. **No real customer, colleague, or personal data enters this repo — in any
   file, at any time** — including fixtures, test data, prompts, traces, and
   screenshots. Real engagements run in a separate, private, org-controlled
   environment; only sanitised artefacts (numbers, diagrams, described
   workflows) are published, and only with written permission.
3. **`generate()` is local-only.** `generateHosted()` must be called explicitly.
   There is no automatic failover, because a silent failover from local to
   hosted is exactly how data leaves.
4. **One package until there is a second deployable.** The planned
   `packages/{lab,knowledge,actions,eval,platform}` layout appears when the
   first genuinely independent deployable exists. Premature workspace tooling is
   boilerplate that teaches nothing.
5. **No agent framework for the first 8 weeks.** ReAct loops, tool calling, and
   retrieval are built from primitives first. Frameworks hide the failure modes
   that stages 3–4 exist to teach.

## Consequences

- Anything worth publishing from a real engagement has to be expressible as a
  number, a diagram, or a described workflow. That is a constraint on what can
  be shown — and it is the same constraint regulated customers impose anyway.
- Local-only means slower and weaker than a frontier model. Accepted: eval
  design (deterministic suite in full, judged subset, cached) is what makes a
  14B judge viable, and model quality is not the lesson in weeks 3–6.
- A single package will need restructuring around month 3. That is a planned
  cost, paid once, at the point where the second deployable justifies it.
