import { NextRequest, NextResponse } from "next/server";
import { deriveStructuredIntent, interpretChatMessage } from "@/lib/mockLLM";
import { UserPreferenceProfile } from "@/lib/types";

// POST /api/chat — spec section 16.
// The assistant text + intent update are LLM-owned; nothing here touches
// price, dates or availability.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, current_profile } = body as {
    user_id: string;
    message: string;
    current_profile: UserPreferenceProfile;
    current_recommendations?: unknown[];
  };

  const { assistantMessage, updatedProfile, requiresInventoryRefresh } = interpretChatMessage(
    message,
    current_profile
  );
  const updated_intent = deriveStructuredIntent(updatedProfile);

  return NextResponse.json({
    assistant_message: assistantMessage,
    updated_intent,
    requires_inventory_refresh: requiresInventoryRefresh,
  });
}
