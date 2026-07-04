import { NextRequest, NextResponse } from "next/server";
import { rankRecommendations } from "@/lib/ranking";
import { StructuredTravelIntent } from "@/lib/types";

// POST /api/recommendations/rank — spec section 16.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { structured_intent, limit } = body as {
    structured_intent: StructuredTravelIntent;
    inventory_results?: unknown[];
    limit?: number;
  };

  const recommendations = rankRecommendations(structured_intent, limit ?? 3);
  return NextResponse.json({ recommendations });
}
