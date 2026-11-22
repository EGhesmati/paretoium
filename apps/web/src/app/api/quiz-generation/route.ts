import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackQuiz,
  buildQuizPrompt,
  formatQuizAsText,
  parseQuizQuestions,
} from "@/lib/ai-study";
import { generateWithCache } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const identity = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`quiz:${identity}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", fallback: true },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    nodeName?: string;
    description?: string;
    topic?: string;
    difficulty?: number;
    prerequisites?: string[];
  } | null;

  const nodeName = body?.nodeName?.trim();
  if (!nodeName) {
    return NextResponse.json({ error: "nodeName is required" }, { status: 400 });
  }

  const params = {
    nodeName,
    description: body?.description,
    topic: body?.topic,
    difficulty: body?.difficulty,
    prerequisites: Array.isArray(body?.prerequisites) ? body.prerequisites : [],
  };

  const prompt = buildQuizPrompt(params);
  const fallbackQuestions = buildFallbackQuiz(params);
  const fallbackPayload = {
    questions: fallbackQuestions,
    text: formatQuizAsText(fallbackQuestions),
  };

  const result = await generateWithCache("quiz", prompt, fallbackPayload);

  if (result.fallback) {
    return NextResponse.json({
      ...fallbackPayload,
      fallback: true,
      rateLimited: result.rateLimited,
      errorReason: result.errorReason,
    });
  }

  const rawText =
    typeof (result.data as { text?: unknown })?.text === "string"
      ? (result.data as { text: string }).text
      : "";
  const parsedQuestions = parseQuizQuestions(rawText);

  if (parsedQuestions) {
    return NextResponse.json({
      questions: parsedQuestions,
      text: formatQuizAsText(parsedQuestions),
      fallback: false,
    });
  }

  return NextResponse.json({
    ...fallbackPayload,
    fallback: true,
    errorReason: "AI returned unstructured quiz output; showing fallback questions",
  });
}
