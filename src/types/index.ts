export interface Card {
  id: string;
  name_pt: string;
  name_en: string;
  set_pt: string;
  set_en: string;
  set_code: string;
  set_name?: string;
  card_number: string;
  total_in_set: string;
  quantity: number;
  quality: string;
  language: string;
  rarity_code: string;
  rarity_name: string;
  color_code: string;
  color_name: string;
  color_slug: string;
  color_bg: string;
  card_category: 'Pokémon' | 'Trainer' | 'Energy';
  is_foil: boolean;
  extras: string;
  comment: string;
  image_url: string;
  local_image?: string;
  image_filename?: string;
  decks: string[];
}

export interface DeckCardItem {
  section: 'pokemon' | 'trainers' | 'energies';
  name: string;
  set: string;
  count: number;
  owned: number;
  rarity?: string;
  type?: string;
}

export interface DeckStrategyGuide {
  opening: {
    title: string;
    steps: string[];
  };
  midgame: {
    title: string;
    steps: string[];
  };
  lategame: {
    title: string;
    steps: string[];
  };
}

export interface Deck {
  id: string;
  name: string;
  format: string;
  format_slug: 'expanded' | 'casual' | 'standard';
  archetype: string;
  badge_color: string;
  accent_color: string;
  summary: string;
  win_condition: string;
  stats: {
    pokemon: number;
    trainers: number;
    energies: number;
    total: number;
  };
  energy_breakdown: {
    owned: string;
    needed: string;
    missing_count: number;
  };
  cards: DeckCardItem[];
  strategy_guide: DeckStrategyGuide;
  prize_trade_tip: string;
}

export interface CardTypeInfo {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  color: string;
  gradient: string;
  description: string;
  description_pt?: string;
  sample_card: string;
  strengths: string[];
  strengths_pt?: string[];
  weakness: string;
  weakness_pt?: string;
  resistance: string;
  resistance_pt?: string;
}

export interface FormatRule {
  id: string;
  name: string;
  name_pt?: string;
  tag: string;
  tag_pt?: string;
  status_badge: string;
  status_badge_pt?: string;
  description: string;
  description_pt?: string;
  deck_size: string;
  deck_size_pt?: string;
  copy_limit: string;
  copy_limit_pt?: string;
  prizes: string;
  prizes_pt?: string;
  advantages: string[];
  advantages_pt?: string[];
  disadvantages: string[];
  disadvantages_pt?: string[];
}

export interface DeckBuildingRule {
  title: string;
  title_pt?: string;
  content: string;
  content_pt?: string;
}

export interface TrainerTypeRule {
  type: string;
  type_pt?: string;
  rule: string;
  rule_pt?: string;
  examples: string;
  examples_pt?: string;
}

export interface SpecialConditionRule {
  name: string;
  name_pt?: string;
  effect: string;
  effect_pt?: string;
  cure: string;
  cure_pt?: string;
}

export interface CardRarityInfo {
  id: string;
  symbol_type: string;
  symbol_name: string;
  symbol_name_en?: string;
  name: string;
  name_en?: string;
  code: string;
  rate: string;
  rate_en?: string;
  reference?: string | null;
  reference_en?: string | null;
  description: string;
  description_en?: string;
  color: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAllowed: boolean;
  token?: string;
}

export interface RpcCallRecord {
  id: string;
  timestamp: string;
  service: string;
  method: string;
  format: 'Protobuf (Binary)' | 'JSON (Connect)';
  status: 'SUCCESS' | 'ERROR';
  durationMs: number;
  payloadSizeBytes: number;
  jsonEquivalentBytes: number;
  savingsPercentage: number;
  requestPayload: any;
  responseData: any;
  headers: Record<string, string>;
}
