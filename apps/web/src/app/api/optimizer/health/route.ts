import { NextResponse } from "next/server";
import { getOptimizerHealth } from "@/lib/optimizer";

export async function GET() {
  try {
    const health = await getOptimizerHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json(
      { status: "unavailable", error: error instanceof Error ? error.message : "Unavailable" },
      { status: 503 },
    );
  }
}
