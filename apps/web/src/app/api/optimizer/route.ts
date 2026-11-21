import { NextRequest, NextResponse } from "next/server";
import { optimizeCourses, type OptimizerRequest } from "@/lib/optimizer";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as OptimizerRequest;
    const result = await optimizeCourses(body, request.signal);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Optimization failed" },
      { status: 502 },
    );
  }
}
