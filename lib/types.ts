export {};
// lib/types.ts

// 🔹 이건 서치바용 타입
export type SearchItem = {
  id: number;
  name: string;
  image: string;
  description: string;
};

// 🔹 이건 거래 아이템 (예: ProfilePage 등에서 사용)
export type TradeItem = {
  id: number;
  item_id: number;
  item_name: string;
  item_image: string;
  price: number;
  deal_type: 'buy' | 'sell';
  is_visible: boolean;
  created_at: string;
  comment?: string;
  delivery_method?: '택배' | '자유시장';
  discord_name?: string;
  discord_avatar_url?: string;
  quantity?: number;
};
