import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";

export type GeminiKind = "node-summary" | "quiz" | "curriculum";

export interface GeminiCacheResult {
  data: unknown;
  fallback: boolean;
  rateLimited: boolean;
  errorReason?: string;
}

function cacheKey(kind: GeminiKind, prompt: string) {
  return createHash("sha256").update(`v7:${kind}:${prompt}`).digest("hex");
}

/**
 * Reads an env variable from .env.local on disk first (so live edits take effect
 * immediately without restarting next dev), falling back to process.env.
 */
function getEnvVar(key: string): string | undefined {
  try {
    const candidates = [
      resolve(process.cwd(), ".env.local"),
      resolve(process.cwd(), "apps/web/.env.local"),
    ];
    for (const filePath of candidates) {
      if (!existsSync(filePath)) continue;
      const content = readFileSync(filePath, "utf8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        if (k !== key) continue;
        const rawVal = trimmed
          .slice(eqIdx + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (rawVal) {
          process.env[key] = rawVal;
          return rawVal;
        }
      }
    }
  } catch {
    // ignore fs errors in edge/serverless runtimes
  }
  return process.env[key]?.trim();
}

function classifyAiError(error: unknown, providerLabel: string): {
  rateLimited: boolean;
  reason: string;
} {
  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();

  if (lower.includes("data policy") || lower.includes("settings/privacy")) {
    return {
      rateLimited: false,
      reason:
        "OpenRouter free tier blocked by account privacy setting — enable free endpoints at openrouter.ai/settings/privacy",
    };
  }
  if (lower.includes("401") || lower.includes("403") || lower.includes("api key") || lower.includes("unauthorized")) {
    return {
      rateLimited: false,
      reason: `API key rejected by ${providerLabel} (401/403)`,
    };
  }
  if (lower.includes("429") || lower.includes("quota") || lower.includes("rate")) {
    return {
      rateLimited: true,
      reason: `${providerLabel} rate limit: ${raw.slice(0, 180)}`,
    };
  }
  return {
    rateLimited: false,
    reason: `${providerLabel}: ${raw.slice(0, 240)}`,
  };
}

let cachedLiveFreeModels: { models: string[]; fetchedAt: number } | null = null;

async function discoverOpenRouterFreeModels(
  baseUrl: string,
  apiKey: string,
): Promise<string[]> {
  if (
    cachedLiveFreeModels &&
    Date.now() - cachedLiveFreeModels.fetchedAt < 5 * 60_000
  ) {
    return cachedLiveFreeModels.models;
  }

  try {
    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      data?: Array<{
        id?: string;
        context_length?: number;
        pricing?: { prompt?: string; completion?: string };
      }>;
    };

    const allFree = (data.data ?? [])
      .filter((m) => {
        if (typeof m.id !== "string") return false;
        const id = m.id.toLowerCase();
        if (id.includes("vision") || id.includes("audio") || id.includes("vl-")) {
          return false;
        }
        const isZeroPrice =
          Number(m.pricing?.prompt ?? "1") === 0 &&
          Number(m.pricing?.completion ?? "1") === 0;
        return id.endsWith(":free") || isZeroPrice;
      })
      .map((m) => m.id!);

    // Prefer fast non-thinking / flash instruct models first so they don't burn tokens on CoT
    const preferredFamilies = [
      "flash",
      "instruct",
      "qwen",
      "llama",
      "gemma",
      "mistral",
      "deepseek",
      "nemotron",
      "ernie",
      "flint",
    ];

    allFree.sort((a, b) => {
      const al = a.toLowerCase();
      const bl = b.toLowerCase();
      const aRank = preferredFamilies.findIndex((kw) => al.includes(kw));
      const bRank = preferredFamilies.findIndex((kw) => bl.includes(kw));
      const aScore = aRank === -1 ? 99 : aRank;
      const bScore = bRank === -1 ? 99 : bRank;
      return aScore - bScore;
    });

    const top = Array.from(new Set([...allFree, "openrouter/free"])).slice(0, 12);
    if (top.length > 0) {
      cachedLiveFreeModels = { models: top, fetchedAt: Date.now() };
    }
    return top;
  } catch {
    return ["openrouter/free"];
  }
}

function extractOpenRouterContent(choice: Record<string, unknown> | undefined): string {
  if (!choice || typeof choice !== "object") return "";

  const msg = choice.message as Record<string, unknown> | undefined;
  if (msg && typeof msg === "object") {
    const rawContent = msg.content;
    if (typeof rawContent === "string" && rawContent.trim().length > 0) {
      return rawContent.trim();
    }
    if (Array.isArray(rawContent)) {
      const joined = rawContent
        .map((part) => {
          if (typeof part === "string") return part;
          if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
            return (part as { text: string }).text;
          }
          return "";
        })
        .join("\n")
        .trim();
      if (joined.length > 0) return joined;
    }

    // Some reasoning models (Nemotron / DeepSeek R1 / QwQ / Ernie) place output in `reasoning` or `reasoning_content`
    const reasoning =
      (typeof msg.reasoning === "string" && msg.reasoning) ||
      (typeof msg.reasoning_content === "string" && msg.reasoning_content) ||
      "";
    if (reasoning) {
      const firstBrace = reasoning.indexOf("{");
      const lastBrace = reasoning.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return reasoning.slice(firstBrace, lastBrace + 1).trim();
      }
    }
  }

  if (typeof choice.text === "string" && choice.text.trim().length > 0) {
    return choice.text.trim();
  }

  return "";
}

async function tryOpenRouterBatch(
  baseUrl: string,
  apiKey: string,
  batchModels: string[],
  prompt: string,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35_000);
  try {
    const primaryModel = batchModels[0];
    const payload: Record<string, unknown> = {
      model: primaryModel,
      max_tokens: 4096,
      reasoning: { effort: "low" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert university curriculum architect and textbook author. Do NOT think at length; immediately output ONLY valid JSON matching the user's schema with no markdown fences and no extra commentary.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    };

    if (batchModels.length > 1) {
      payload.models = batchModels.slice(0, 3);
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://paretoium.local",
        "X-Title": "Paretoium Course Path Optimizer",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawBody = await res.text().catch(() => "");
    let json: {
      model?: string;
      choices?: Array<Record<string, unknown>>;
      error?: { message?: string; metadata?: { raw?: string } };
    } | null = null;
    try {
      json = JSON.parse(rawBody);
    } catch {
      json = null;
    }

    if (!res.ok) {
      const errMsg =
        json?.error?.message ||
        json?.error?.metadata?.raw ||
        rawBody.slice(0, 160);
      throw new Error(`HTTP ${res.status} (${batchModels.join(",")}): ${errMsg}`);
    }

    if (json?.error?.message) {
      throw new Error(`${primaryModel}: ${json.error.message}`);
    }

    const content = extractOpenRouterContent(json?.choices?.[0]);
    if (!content) {
      const debugChoice = JSON.stringify(json?.choices?.[0] ?? json ?? rawBody).slice(0, 140);
      throw new Error(
        `Empty content from ${json?.model ?? primaryModel} (raw: ${debugChoice})`,
      );
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateViaOpenRouter(prompt: string): Promise<string> {
  const apiKey = getEnvVar("OPENROUTER_API_KEY");
  const rawModels = getEnvVar("OPENROUTER_MODEL_ID");
  const baseUrl = (
    getEnvVar("OPENROUTER_BASE_URL") || "https://openrouter.ai/api/v1"
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const configuredModels = (rawModels ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const explicitPinned = configuredModels.filter(
    (m) => m !== "openrouter/free" && m !== "auto",
  );
  const liveFree = await discoverOpenRouterFreeModels(baseUrl, apiKey);
  const candidateModels = Array.from(
    new Set([...explicitPinned, ...liveFree, ...configuredModels]),
  ).slice(0, 12);

  if (candidateModels.length === 0) {
    throw new Error("No OpenRouter models available");
  }

  const attemptErrors: string[] = [];

  for (let i = 0; i < candidateModels.length; i += 3) {
    const batch = candidateModels.slice(i, i + 3);
    try {
      return await tryOpenRouterBatch(baseUrl, apiKey, batch, prompt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      attemptErrors.push(msg);
      if (
        msg.toLowerCase().includes("data policy") ||
        msg.toLowerCase().includes("settings/privacy") ||
        msg.includes("HTTP 401")
      ) {
        throw new Error(msg);
      }
    }
  }

  throw new Error(attemptErrors.join(" ; "));
}

export async function generateWithCache(
  kind: GeminiKind,
  prompt: string,
  fallback: unknown,
): Promise<GeminiCacheResult> {
  const key = cacheKey(kind, prompt);

  try {
    const cached = await prisma.aiResponseCache.findUnique({
      where: { cacheKey: key },
    });
    if (cached) {
      return { data: cached.response, fallback: false, rateLimited: false };
    }
  } catch {
    // Continue without cache if DB is unavailable.
  }

  const errors: string[] = [];
  let anyRateLimited = false;

  // 1. Try OpenRouter (Open-Source models) if configured
  if (getEnvVar("OPENROUTER_API_KEY")) {
    try {
      const text = await generateViaOpenRouter(prompt);
      const response = { text };
      try {
        await prisma.aiResponseCache.upsert({
          where: { cacheKey: key },
          update: { response },
          create: { kind, cacheKey: key, response },
        });
      } catch {
        // Cache write failure should not fail the response.
      }
      return { data: response, fallback: false, rateLimited: false };
    } catch (error) {
      const { rateLimited, reason } = classifyAiError(error, "OpenRouter");
      if (rateLimited) anyRateLimited = true;
      errors.push(reason);
      console.warn(`[ai] OpenRouter fallback for ${kind}: ${reason}`);
    }
  }

  // 2. Try Google Gemini if configured
  const geminiKey = getEnvVar("GEMINI_API_KEY");
  const geminiModel = getEnvVar("GEMINI_MODEL_ID");

  if (geminiKey && geminiModel) {
    try {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      const result = await generateText({
        model: google(geminiModel),
        prompt,
      });

      const response = { text: result.text };
      try {
        await prisma.aiResponseCache.upsert({
          where: { cacheKey: key },
          update: { response },
          create: { kind, cacheKey: key, response },
        });
      } catch {
        // Cache write failure should not fail the response.
      }
      return { data: response, fallback: false, rateLimited: false };
    } catch (error) {
      const { rateLimited, reason } = classifyAiError(error, geminiModel);
      if (rateLimited) anyRateLimited = true;
      errors.push(reason);
      console.warn(`[ai] Gemini fallback for ${kind}: ${reason}`);
    }
  }

  const finalReason =
    errors.length > 0
      ? errors.join(" | ")
      : "No AI provider configured (set OPENROUTER_API_KEY or GEMINI_API_KEY)";

  return {
    data: fallback,
    fallback: true,
    rateLimited: anyRateLimited,
    errorReason: finalReason,
  };
}
