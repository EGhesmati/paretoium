import { NextRequest, NextResponse } from "next/server";
import {
  buildFallbackCurriculum,
  sanitizeGeneratedCurriculum,
} from "@/lib/curriculum-generator";
import { generateWithCache } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const identity = request.headers.get("x-forwarded-for") ?? "local";
  const limit = checkRateLimit(`curriculum:${identity}`, 8, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many curriculum requests", fallback: true },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    topic?: string;
    maxHours?: number;
    maxDifficulty?: number;
    maxDepth?: number;
  } | null;

  const topic = body?.topic?.trim();
  if (!topic || topic.length > 120) {
    return NextResponse.json(
      { error: "topic is required (1-120 characters)" },
      { status: 400 },
    );
  }

  const maxHours =
    typeof body?.maxHours === "number" && body.maxHours > 0
      ? Math.round(body.maxHours)
      : 210;
  const maxDifficulty =
    typeof body?.maxDifficulty === "number" && body.maxDifficulty > 0
      ? Math.round(body.maxDifficulty)
      : 15;
  const maxDepth =
    typeof body?.maxDepth === "number" && body.maxDepth >= 2
      ? Math.round(body.maxDepth)
      : 8;

  const prompt = [
    `You are a university department chair designing a rigorous, authentic 9-to-11 course prerequisite DAG for the discipline "${topic}".`,
    `Learner constraints: Time Budget = ${maxHours}h, Cumulative Difficulty Cap = ${maxDifficulty}, Max Path Depth = ${maxDepth} courses.`,
    `CRITICAL QUALITY RULES:`,
    `1. Every course title MUST name real, concrete sub-fields, techniques, or canonical subjects of "${topic}" (for example, if the topic is "English", use real courses like "Morphology & English Syntax", "Phonetics & Spoken Prosody", "Rhetorical Argumentation & Prose Style", "Shakespearean & Modernist Close Reading"—NEVER use lazy generic placeholders like "Foundations of ${topic}", "Core Concepts", "Applied ${topic}", "Tooling & Workflows", or "Advanced ${topic}").`,
    `2. Structure the DAG across 4 tiers: Tier 1 (100-level foundational prerequisites, difficulty 1-2), Tier 2 (200-level core specializations across 2-3 parallel tracks, difficulty 2-3), Tier 3 (300-level advanced synthesis, difficulty 3-5), and Tier 4 (one 400/500-level culminating Capstone course that the parallel tracks converge into).`,
    `3. Ensure there is both an Express route (fewer courses, ~50-65% of ${maxHours}h) and a Deep Mastery route (up to ${maxDepth} courses, near ${maxHours}h and difficulty ${maxDifficulty}).`,
    `Return ONLY valid JSON with no markdown fences and no extra text.`,
    `Exact JSON Schema: {"courses":[{"code":"SUBJ101","title":"Specific Concrete Course Title","studyHours":20,"difficulty":2}],"edges":[{"from":"SUBJ101","to":"SUBJ201"}]}`,
  ].join("\n");

  const fallbackData = buildFallbackCurriculum(topic, {
    maxHours,
    maxDifficulty,
    maxDepth,
  });
  const result = await generateWithCache("curriculum", prompt, {
    text: JSON.stringify(fallbackData),
  });

  const rawText = (result.data as { text?: string } | null)?.text ?? "";
  const sanitized = sanitizeGeneratedCurriculum(rawText, topic);

  if (!sanitized) {
    return NextResponse.json({
      ...fallbackData,
      fallback: true,
      errorReason: result.errorReason,
    });
  }

  return NextResponse.json({
    ...sanitized,
    fallback: result.fallback,
    errorReason: result.errorReason,
  });
}
