---
week: 1
status: in-progress
published:            # paste the URL when the Sunday note is live — the dashboard derives "shipped" from this line
---

# Week 01 — sampling, temperature, and why "more temperature" is the wrong model

## Concept

Temperature is not a creativity dial. It is a divisor applied to the logits
before softmax:

```
p_i = exp(z_i / T) / Σ_j exp(z_j / T)
```

At `T → 0` you take the argmax. At `T = 1` you sample the distribution the model
actually learned. Above 1 you flatten it toward uniform, which raises the
probability of tokens the model considers *bad*, not merely *different*.

Two consequences that are easy to state and hard to feel:

1. Distinct-output count is governed by the distribution's entropy, so it
   **saturates**. You get duplicates long before n approaches anything large.
2. `top_p` truncates **after** temperature, so changing `T` changes which tokens
   survive the nucleus. They are not independent knobs.

## Predictions — fill this in BEFORE running

Write numbers, not adjectives. Commit them. Being wrong in writing is the
calibration signal; being vague is not.

| T | distinct / 20 (predicted) | most-common share (predicted) |
|---|---|---|
| 0 | 1 | 1.00 |
| 0.3 | 3 | 0.70 |
| 0.7 | 7 | 0.35 |
| 1.0 | 12 | 0.20 |

1. Does distinct-count grow linearly with `T`, or saturate? Where is the knee?
2. At `T = 0`, how many distinct outputs? Why might it not be exactly 1?
3. Which output is most common at `T = 0.7` — and would you have predicted it?
4. What would change if the prompt had an obviously correct answer?

## Run

```bash
ollama serve &            # if not already running
ollama pull qwen3:8b
npm run exp:01            # 80 calls, ~75 s, writes experiments/01-sampling/results/
```

Seeds are `42..61` per temperature and identical **across** temperatures, so
sample *i* at each temperature shares an RNG start — differences are
attributable to temperature rather than luck.

> Trap worth knowing: a single fixed seed for every call re-seeds the sampler on
> each request and fakes determinism at *every* temperature. That is how people
> "discover" temperature does nothing.

## Results

Run date: _pending_ · Model: `qwen3:8b` · Results: `experiments/01-sampling/results/latest.md`

| T | distinct / 20 | most-common share | predicted distinct | delta |
|---|---|---|---|---|
| 0 | | | | |
| 0.3 | | | | |
| 0.7 | | | | |
| 1.0 | | | | |

## What I got wrong

_Write the one prediction that was most wrong and what assumption caused it._

## Publish (Sunday, ≤45 min)

The four numbers, the one wrong prediction, and the seed trap. No editing pass.
