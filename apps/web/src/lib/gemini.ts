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

  const cached = await prisma.aiResponseCache.findUnique({
    where: { cacheKey: key },
  });
  if (cached) {
    return { data: cached.response, fallback: false };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const modelId = process.env.GEMINI_MODEL_ID;

  if (!apiKey || !modelId) {
    return { data: fallback, fallback: true };
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
      model: google(modelId),
      prompt,
    });

    const response = { text: result.text };
    await prisma.aiResponseCache.upsert({
      where: { cacheKey: key },
      update: { response },
      create: { kind, cacheKey: key, response },
    });
    return { data: response, fallback: false };
  } catch (error) {
    if (error instanceof Error && error.message.includes("429")) {
      throw new Error("Gemini rate limit reached");
    }
    return { data: fallback, fallback: true };
  }
}
