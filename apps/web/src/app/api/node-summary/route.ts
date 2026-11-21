import { NextRequest, NextResponse } from "next/server";
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

  const body = await request.json().catch(() => null) as
    | { nodeName?: string; description?: string }
    | null;
  const nodeName = body?.nodeName?.trim();
  if (!nodeName) {
    return NextResponse.json({ error: "nodeName is required" }, { status: 400 });
  }

  const prompt = `Explain "${nodeName}" for a learner in 3 short paragraphs. Context: ${body?.description ?? "No additional context."}`;
  const fallback = {
    text: `${nodeName} is part of the course learning path. Review its prerequisites before studying it, then practice by completing focused exercises.`,
  };
  const response = await generateWithCache("node-summary", prompt, fallback);
  return NextResponse.json({
    ...(response as Record<string, unknown>),
    fallback: false,
  });
}
