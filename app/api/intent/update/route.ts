import { NextRequest, NextResponse } from "next/server";
import { INSPIRATION_CARDS } from "@/lib/inspirationCards";
import { applySwipeEvent, deriveStructuredIntent } from "@/lib/mockLLM";
import { UserPreferenceProfile } from "@/lib/types";

// POST /api/intent/update — spec section 16.
// Body: { user_id, event: { type, card_id }, current_profile }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event, current_profile } = body as {
    user_id: string;
    event: { type: string; card_id: string };
    current_profile: UserPreferenceProfile;
  };

  const card = INSPIRATION_CARDS.find((c) => c.card_id === event.card_id);
  if (!card) {
    return NextResponse.json({ error: "Unknown card_id" }, { status: 400 });
  }

  const updated_profile = applySwipeEvent(
    current_profile,
    { type: event.type as any, card_id: event.card_id },
    card
  );
  const structured_intent = deriveStructuredIntent(updated_profile);

  return NextResponse.json({ updated_profile, structured_intent });
}
