# Atlas

Learning platform for the AI-engineering / FDE track. One system, grown stage by
stage — not a folder of tutorials.

The rule that keeps it honest: **every experiment produces a number, and every
number is published.** Predictions are written before the run, in `docs/notes/`.

## Status

| Stage | What exists | Week |
|---|---|---|
| 1 · Primitives | `src/providers.ts` (local-only seam), experiment 01 (sampling spread) | 1 |
| 2 · Behaviour | — | 2–3 |
| 3 · Retrieval | — | 3–5 |
| 4 · Evals | — | 6–9 |
| 5 · Production | — | 10–12 |
| 6 · FDE | — | month 4+ |

## Commands

```bash
npm install
npm test                     # build + offline unit tests (no network)
npm run exp:01               # sampling experiment → experiments/01-sampling/results/
```

`npm run exp:01` needs Ollama running with `qwen3:8b` pulled. It makes 80 calls
and takes ~75 s on an M4 Pro. Predictions first: `docs/notes/week-01.md`.

## Layout

```
src/providers.ts              the only place a model is called
src/experiments/01-sampling.ts
test/                         offline unit tests (node:test)
docs/adr/                     decisions with their trade-off
docs/notes/                   weekly predictions and findings
experiments/<n>/results/      committed evidence: JSON + latest.md
```

`packages/` arrives when there is a second deployable. Until then a single
package is the smaller lie — see ADR 0001.

## Rules

- **Local by default.** `generate()` only talks to Ollama. Hosted free tiers are
  opt-in by name, synthetic data only. Free tiers train on what you send them.
- **Public repo, cleared data only.** No customer data, ever, in any file here.
- **No agent framework for the first 8 weeks.** Primitives first.
- **A week without an artifact is a week that did not happen.**
