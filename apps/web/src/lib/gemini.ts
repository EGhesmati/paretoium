import { createHash } from "node:crypto";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";

export type GeminiKind = "node-summary" | "quiz";

function cacheKey(kind: GeminiKind, prompt: string) {
  return createHash("sha256").update(`${kind}:${prompt}`).digest("hex");
}

export async function generateWithCache(
  kind: GeminiKind,
  prompt: string,
  fallback: unknown,
) {
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

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL_ID;

  if (!apiKey || !modelId) {
    return { data: fallback, fallback: true, rateLimited: false };
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
      model: google(modelId),
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
    const rateLimited = error instanceof Error && error.message.includes("429");
    return { data: fallback, fallback: true, rateLimited };
  }
}
