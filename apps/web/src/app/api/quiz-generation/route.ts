import { NextRequest, NextResponse } from "next/server";
import { generateWithCache } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const identity = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`quiz:${identity}`);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => null) as
    | { nodeName?: string; description?: string }
    | null;
  const nodeName = body?.nodeName?.trim();
  if (!nodeName) {
    return NextResponse.json({ error: "nodeName is required" }, { status: 400 });
  }

  const prompt = `Create 3 short multiple-choice quiz questions about "${nodeName}". Include 4 options and the correct answer for each. Context: ${body?.description ?? "No additional context."}`;
  const fallback = {
    text: `1. What is the main purpose of ${nodeName}? Answer: ${nodeName} concepts. 2. Which prerequisite helps with ${nodeName}? Answer: its required earlier topic. 3. How should you practice ${nodeName}? Answer: with focused exercises.`,
  };
  const response = await generateWithCache("quiz", prompt, fallback);
  return NextResponse.json({
    ...(response as Record<string, unknown>),
    fallback: false,
  });
}
