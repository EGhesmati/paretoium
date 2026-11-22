import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackStudyGuide,
  buildStudyGuidePrompt,
  formatStudyGuideAsText,
  parseStudyGuide,
  type StudyGuide,
} from "@/lib/ai-study";
import { generateWithCache } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const identity = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`summary:${identity}`);
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
    studyHours?: number;
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
    studyHours: body?.studyHours,
    difficulty: body?.difficulty,
    prerequisites: Array.isArray(body?.prerequisites) ? body.prerequisites : [],
  };

  const prompt = buildStudyGuidePrompt(params);
  const fallbackGuide = buildFallbackStudyGuide(params);
  const fallbackPayload = {
    text: formatStudyGuideAsText(fallbackGuide),
    guide: fallbackGuide,
  };

  const result = await generateWithCache("node-summary", prompt, fallbackPayload);

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
  const existingGuide = (result.data as { guide?: StudyGuide | null })?.guide;
  const parsedGuide = parseStudyGuide(rawText) ?? existingGuide ?? null;

  if (parsedGuide) {
    return NextResponse.json({
      guide: parsedGuide,
      text: formatStudyGuideAsText(parsedGuide),
      fallback: false,
    });
  }

  return NextResponse.json({
    guide: fallbackGuide,
    text: rawText || fallbackPayload.text,
    fallback: true,
    errorReason: !rawText ? "Empty AI response" : undefined,
  });
}
