import { NextRequest, NextResponse } from "next/server";
import { searchInventory } from "@/lib/ranking";
import { StructuredTravelIntent } from "@/lib/types";

// POST /api/inventory/search — spec section 16.
// This is the ONLY place prices/dates/availability come from.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { structured_intent, limit = 5 } = body as {
    structured_intent: StructuredTravelIntent;
    limit?: number;
  };

  const results = searchInventory(structured_intent)
    .slice(0, Math.min(limit, 5))
    .map((pkg) => ({
      package_id: pkg.package_id,
      price_pp: pkg.price_pp,
      availability_status: pkg.availability_status,
    }));

  return NextResponse.json({ results, last_checked: new Date().toISOString() });
}
