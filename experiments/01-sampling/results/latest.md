# Experiment 01 — sampling spread

Model: `qwen3:8b` · n = 20 per temperature · seeds 42–61, identical across temperatures.

Prompt: "Write one sentence explaining why retrieval beats fine-tuning for factual updates."

| T | n | distinct | distinct / n | most-common share |
|---|---|---|---|---|
| 0 | 20 | 1 | 0.05 | 1.00 |
| 0.3 | 20 | 2 | 0.10 | 0.95 |
| 0.7 | 20 | 11 | 0.55 | 0.40 |
| 1 | 20 | 13 | 0.65 | 0.20 |


Read this next to your predictions in `docs/notes/week-01.md`. The question is not
"did more temperature give more variety" — it is *how* distinct-count grows, and
where it saturates.
