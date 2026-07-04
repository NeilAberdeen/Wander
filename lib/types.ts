// Core data model — see product spec section 7.
// The LLM only ever produces UserPreferenceProfile / StructuredTravelIntent / chat text.
// Everything else (InventoryPackage, prices, dates, availability) comes from inventory.

export type Mood =
  | "adventure"
  | "relaxation"
  | "culture"
  | "food"
  | "nightlife"
  | "romance"
  | "wellness";

export type MoodScores = Record<Mood, number>;

export interface UserPreferenceProfile {
  user_id: string;
  moods: MoodScores;
  constraints: {
    budget_per_person_max: number | null;
    departure_airports: string[];
    travel_months: string[];
    max_flight_hours: number | null;
    party_type: "adult" | "family" | "any";
    children: boolean;
  };
  positive_signals: string[];
  negative_signals: string[];
}

export interface InspirationCard {
  card_id: string;
  headline: string;
  destination_id: string;
  destination_name: string;
  country: string;
  media_url: string;
  vibe_tags: string[];
  inventory_status: "available" | "idea_only" | "limited";
  lowest_price_pp: number | null;
  currency: string;
  source_package_ids: string[];
  moods: Partial<MoodScores>;
}

export interface StructuredTravelIntent {
  summary: string;
  must_have: string[];
  nice_to_have: string[];
  avoid: string[];
  search_parameters: {
    departure_airports: string[];
    date_range: { start: string; end: string };
    max_budget_pp: number | null;
    max_flight_duration_minutes: number | null;
    temperature_min_c: number | null;
    party_type: "adult" | "family" | "any";
  };
}

export type AvailabilityStatus = "available" | "limited" | "sold_out";

export interface InventoryPackage {
  package_id: string;
  destination_id: string;
  hotel_id: string;
  destination_name: string;
  country: string;
  hotel_name: string;
  hotel_type: "boutique" | "resort" | "family" | "adult-only" | "city";
  adult_only: boolean;
  departure_airport: "LGW" | "LHR" | "STN";
  departure_date: string;
  return_date: string;
  nights: number;
  flight_duration_minutes: number;
  price_pp: number;
  currency: string;
  availability_status: AvailabilityStatus;
  rooms_remaining: number;
  board_basis: string;
  image_url: string;
  booking_url: string;
  last_checked: string;
  supplier_id: string;
  avg_temp_c: number;
  moods: MoodScores;
  description: string;
  vibe_tags: string[];
}

export interface RecommendationResult {
  package_id: string;
  rank: number;
  match_score: number;
  destination_name: string;
  country: string;
  price_pp: number;
  match_reasons: string[];
  trade_offs: string[];
  availability_status: AvailabilityStatus;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export type SwipeEventType = "card_liked" | "card_disliked" | "card_saved" | "card_info_viewed";

export interface SwipeEvent {
  type: SwipeEventType;
  card_id: string;
}
