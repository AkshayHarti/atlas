# AGENTS.md — atlas

Repo-local agent rules. Read before editing.

## Stack

Node.js 20+ / TypeScript, ESM (`"type": "module"`), `node:test` for tests.
No runtime dependencies so far — that is deliberate, not an oversight.

## Commands

- Install: `npm install`
- Build: `npm run build`
- Test: `npm test` (must pass offline — network calls belong in `src/experiments/`, never in `test/`)
- Experiment 01: `npm run exp:01`

## Conventions

- All model calls go through `src/providers.ts`. Do not `fetch` a provider anywhere else.
- `generate()` is local-only. Adding an implicit hosted fallback is a data-leak bug, not a feature.
- Experiments export pure functions and guard their `main()` so they stay unit-testable.
- New decision with a trade-off → `docs/adr/NNNN-title.md`. Weekly finding → `docs/notes/week-NN.md`.
- Never hand-`mkdir` sibling repos; create via `scripts/ws-new.sh` + skill only.
- Keep `REGISTRY.json` in sync via `scripts/ws-register.sh`.
