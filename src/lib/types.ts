export interface Article {
  id: string;
  title: string;
  description: string;
  body: string;
  price_usdc: number; // in smallest units (6 decimals), e.g. 1000000 = 1 USDC
  author: string; // wallet pubkey
  author_name: string;
  created_at: string;
  category: string;
  cover_emoji: string;
  read_time: number; // minutes
}

export interface UnlockRecord {
  articleId: string;
  reader: string; // wallet pubkey
  txSignature: string;
  unlocked_at: string;
}

export type ArticleCategory =
  | 'Solana'
  | 'DeFi'
  | 'NFTs'
  | 'Development'
  | 'Security'
  | 'Trading'
  | 'General';

export const CATEGORIES: ArticleCategory[] = [
  'Solana',
  'DeFi',
  'NFTs',
  'Development',
  'Security',
  'Trading',
  'General',
];

export const CATEGORY_EMOJIS: Record<ArticleCategory, string> = {
  Solana: '⚡',
  DeFi: '🏦',
  NFTs: '🎨',
  Development: '💻',
  Security: '🔒',
  Trading: '📈',
  General: '📝',
};
