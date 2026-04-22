import type { GoogleGenAI } from "@google/genai";

export interface AIRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
  onAttempt?: (attempt: number, err: unknown) => void;
}

const DEFAULTS: Required<Omit<AIRetryOptions, "label" | "onAttempt">> = {
  maxAttempts: 4,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

export function isRetriableAIError(err: unknown): boolean {
  if (!err) return false;
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.code ?? anyErr?.response?.status;
  if (typeof status === "number") {
    if (status === 429 || status === 408) return true;
    if (status >= 500 && status < 600) return true;
    if (status >= 400 && status < 500) return false;
  }
  const msg = (anyErr?.message ?? "") + " " + safeStringify(err);
  if (/UNAVAILABLE|RESOURCE_EXHAUSTED|DEADLINE_EXCEEDED|INTERNAL/i.test(msg)) return true;
  if (/"code"\s*:\s*(429|500|502|503|504)/.test(msg)) return true;
  if (/ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|ECONNREFUSED|socket hang up|fetch failed|network error/i.test(msg)) return true;
  return false;
}

function safeStringify(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}

export async function withAIRetry<T>(
  fn: () => Promise<T>,
  opts: AIRetryOptions = {},
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };
  const label = opts.label ?? "AI";
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      opts.onAttempt?.(attempt, err);
      if (attempt === maxAttempts || !isRetriableAIError(err)) {
        break;
      }
      const exp = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      const jitter = Math.floor(Math.random() * (exp * 0.25));
      const delay = exp + jitter;
      const status = (err as any)?.status ?? (err as any)?.code ?? "?";
      console.warn(
        `[${label}] transient error (status=${status}), retry ${attempt}/${maxAttempts - 1} in ${delay}ms`,
      );
      await sleep(delay);
    }
  }
  throw lastErr;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

type AIClient = Pick<GoogleGenAI, "models">;
type GenerateContentParams = Parameters<GoogleGenAI["models"]["generateContent"]>[0];
type GenerateContentResult = Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>;

export function generateContentWithRetry(
  ai: AIClient,
  params: GenerateContentParams,
  opts: AIRetryOptions = {},
): Promise<GenerateContentResult> {
  const label = opts.label ?? `Gemini:${(params as any)?.model ?? "unknown"}`;
  return withAIRetry(() => ai.models.generateContent(params), { ...opts, label });
}

type GenerateImagesParams = Parameters<GoogleGenAI["models"]["generateImages"]>[0];
type GenerateImagesResult = Awaited<ReturnType<GoogleGenAI["models"]["generateImages"]>>;

export function generateImagesWithRetry(
  ai: AIClient,
  params: GenerateImagesParams,
  opts: AIRetryOptions = {},
): Promise<GenerateImagesResult> {
  const label = opts.label ?? `GeminiImage:${(params as any)?.model ?? "unknown"}`;
  return withAIRetry(() => ai.models.generateImages(params), { ...opts, label });
}
