/**
 * Experiment 01 — temperature is a divisor on the logits, not a "creativity" knob.
 *
 * Prediction first: fill in docs/notes/week-01.md BEFORE running this.
 *
 * Design notes:
 * - Seeds are varied per sample (BASE_SEED + i) and held identical ACROSS
 *   temperatures. A fixed seed on every call re-seeds the sampler each request,
 *   which fakes determinism at every temperature — a common way to "discover"
 *   that temperature does nothing.
 * - Paired seeds mean sample i at T=0.3 and sample i at T=0.7 start from the
 *   same RNG stream, so differences are attributable to temperature.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generate, localModel } from "../providers.js";

export const TEMPERATURES = [0, 0.3, 0.7, 1.0] as const;
export const SAMPLES_PER_T = 20;
export const BASE_SEED = 42;

export const PROMPT =
  "Write one sentence explaining why retrieval beats fine-tuning for factual updates.";

const OUT_DIR = join(process.cwd(), "experiments", "01-sampling", "results");

export type Summary = {
  temperature: number;
  n: number;
  distinct: number;
  distinctRatio: number;
  topShare: number;
  mostCommon: string;
  errors: number;
};

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function summarise(temperature: number, samples: readonly string[]): Summary {
  const counts = new Map<string, { text: string; n: number }>();
  for (const raw of samples) {
    const key = normalise(raw);
    const hit = counts.get(key);
    if (hit) hit.n += 1;
    else counts.set(key, { text: raw.trim(), n: 1 });
  }

  const ranked = [...counts.values()].sort((a, b) => b.n - a.n);
  const top = ranked[0];
  const n = samples.length;

  return {
    temperature,
    n,
    distinct: counts.size,
    distinctRatio: n === 0 ? 0 : counts.size / n,
    topShare: n === 0 || !top ? 0 : top.n / n,
    mostCommon: top?.text ?? "",
    errors: 0,
  };
}

function markdown(summaries: readonly Summary[], model: string, failures: readonly string[]): string {
  const rows = summaries
    .map(
      (s) =>
        `| ${s.temperature} | ${s.n} | ${s.distinct} | ${s.distinctRatio.toFixed(2)} | ${s.topShare.toFixed(2)} |`,
    )
    .join("\n");

  return `# Experiment 01 — sampling spread

Model: \`${model}\` · n = ${SAMPLES_PER_T} per temperature · seeds ${BASE_SEED}–${BASE_SEED + SAMPLES_PER_T - 1}, identical across temperatures.

Prompt: "${PROMPT}"

| T | n | distinct | distinct / n | most-common share |
|---|---|---|---|---|
${rows}

${failures.length ? `\n${failures.length} call(s) failed:\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""}
Read this next to your predictions in \`docs/notes/week-01.md\`. The question is not
"did more temperature give more variety" — it is *how* distinct-count grows, and
where it saturates.
`;
}

async function main(): Promise<void> {
  const model = localModel();
  const summaries: Summary[] = [];
  const raw: Record<string, string[]> = {};
  const failures: string[] = [];

  for (const temperature of TEMPERATURES) {
    const samples: string[] = [];

    for (let i = 0; i < SAMPLES_PER_T; i++) {
      try {
        const result = await generate({
          prompt: PROMPT,
          temperature,
          seed: BASE_SEED + i,
          maxTokens: 120,
        });
        samples.push(result.text);
        process.stdout.write(".");
      } catch (err) {
        failures.push(`T=${temperature} seed=${BASE_SEED + i}: ${(err as Error).message}`);
        process.stdout.write("x");
      }
    }

    process.stdout.write(` T=${temperature}\n`);
    raw[String(temperature)] = samples;
    summaries.push({ ...summarise(temperature, samples), errors: failures.length });
  }

  await mkdir(OUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  await writeFile(
    join(OUT_DIR, `${model.replace(/[^a-z0-9.-]/gi, "_")}-${stamp}.json`),
    JSON.stringify({ model, prompt: PROMPT, summary: summaries, samples: raw, failures }, null, 2),
  );
  await writeFile(join(OUT_DIR, "latest.md"), markdown(summaries, model, failures));

  console.table(summaries.map(({ mostCommon, ...rest }) => rest));
  console.log(`\nwrote ${join(OUT_DIR, "latest.md")}`);
  if (failures.length) console.log(`${failures.length} call(s) failed — see the JSON.`);
}

// Only run when invoked directly, so the pure functions stay importable by tests.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(`\n${(err as Error).message}`);
    console.error("Is Ollama running, and is the model pulled?  ollama serve && ollama pull " + localModel());
    process.exit(1);
  });
}
