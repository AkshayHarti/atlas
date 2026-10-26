/**
 * The provider seam. Everything in Atlas reaches a model through this file.
 *
 * Rule: `generate()` is LOCAL ONLY. Hosted free tiers are opt-in by name
 * (`generateHosted`) because free tiers train on inputs — see
 * docs/adr/0001-scope-and-data-boundary.md. There is deliberately no automatic
 * fallback: a silent failover from local to hosted is how real data leaves.
 */

export type GenRequest = {
  prompt: string;
  system?: string;
  model?: string;
  temperature?: number;
  topP?: number;
  seed?: number;
  maxTokens?: number;
  /** Thinking models (qwen3, gpt-oss) burn the token budget on hidden reasoning
   * before emitting an answer. Off by default: a sampling experiment must measure
   * the answer distribution, not the reasoning budget. Set true deliberately. */
  think?: boolean;
};

export type GenResult = {
  text: string;
  model: string;
  provider: "ollama" | "hosted";
  latencyMs: number;
  usage?: { promptTokens?: number; completionTokens?: number };
};

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const LOCAL_MODEL = process.env.ATLAS_MODEL ?? "qwen3:8b";

const HOSTED_BASE = process.env.OPENAI_BASE_URL ?? "";
const HOSTED_KEY = process.env.OPENAI_API_KEY ?? "";
const HOSTED_MODEL = process.env.ATLAS_HOSTED_MODEL ?? "";

const TIMEOUT_MS = Number(process.env.ATLAS_TIMEOUT_MS ?? 180_000);

const RETRYABLE = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; json: any }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

async function withRetry<T>(fn: () => Promise<{ status: number; json: any }>, parse: (j: any) => T): Promise<T> {
  let lastErr = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const { status, json } = await fn();
    if (status >= 200 && status < 300) return parse(json);
    lastErr = `HTTP ${status}: ${JSON.stringify(json).slice(0, 300)}`;
    if (!RETRYABLE.has(status)) break;
    await new Promise((r) => setTimeout(r, 2_000));
  }
  throw new Error(`provider call failed — ${lastErr}`);
}

export function localModel(): string {
  return LOCAL_MODEL;
}

/** Local inference via Ollama. The only place real data is allowed. */
export async function generate(req: GenRequest): Promise<GenResult> {
  const model = req.model ?? LOCAL_MODEL;
  const started = Date.now();

  const text = await withRetry(
    () =>
      postJson(`${OLLAMA_HOST}/api/generate`, {
        model,
        prompt: req.prompt,
        system: req.system,
        stream: false,
        think: req.think ?? false,
        options: {
          temperature: req.temperature ?? 0,
          top_p: req.topP,
          seed: req.seed,
          num_predict: req.maxTokens,
        },
      }),
    (j) => {
      if (typeof j?.response !== "string") {
        throw new Error(`ollama returned no "response" field: ${JSON.stringify(j).slice(0, 200)}`);
      }
      return j.response as string;
    },
  );

  return {
    text,
    model,
    provider: "ollama",
    latencyMs: Date.now() - started,
    usage: {
      promptTokens: undefined,
      completionTokens: undefined,
    },
  };
}

/**
 * Any OpenAI-compatible endpoint: Google AI Studio, Groq, OpenRouter, GitHub Models.
 * Synthetic data only. Requires OPENAI_BASE_URL + OPENAI_API_KEY + ATLAS_HOSTED_MODEL.
 */
export async function generateHosted(req: GenRequest): Promise<GenResult> {
  if (!HOSTED_BASE || !HOSTED_KEY) {
    throw new Error("hosted provider not configured: set OPENAI_BASE_URL and OPENAI_API_KEY");
  }
  const model = req.model ?? HOSTED_MODEL;
  if (!model) throw new Error("hosted provider not configured: set ATLAS_HOSTED_MODEL or pass model");

  const started = Date.now();
  const messages = [
    ...(req.system ? [{ role: "system", content: req.system }] : []),
    { role: "user", content: req.prompt },
  ];

  const parsed = await withRetry(
    () =>
      postJson(
        `${HOSTED_BASE.replace(/\/$/, "")}/chat/completions`,
        {
          model,
          messages,
          temperature: req.temperature ?? 0,
          top_p: req.topP,
          seed: req.seed,
          max_tokens: req.maxTokens,
        },
        { authorization: `Bearer ${HOSTED_KEY}` },
      ),
    (j) => {
      const text = j?.choices?.[0]?.message?.content;
      if (typeof text !== "string") {
        throw new Error(`hosted provider returned no message content: ${JSON.stringify(j).slice(0, 200)}`);
      }
      return { text, usage: j.usage };
    },
  );

  return {
    text: parsed.text,
    model,
    provider: "hosted",
    latencyMs: Date.now() - started,
    usage: {
      promptTokens: parsed.usage?.prompt_tokens,
      completionTokens: parsed.usage?.completion_tokens,
    },
  };
}
