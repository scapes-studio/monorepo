// ============================================
// Type Definitions
// ============================================

// Price structure stored as JSON
export type Price = {
  wei: string;
  eth: number;
  usd: number;
  currency?: {
    symbol: string;
    amount: string;
  };
};

// Volume stats structure
export type VolumeStats = {
  volume: {
    total: { eth: string; usd: string };
    sixMonth: { eth: string; usd: string };
    month: { eth: string; usd: string };
    day: { eth: string; usd: string };
  };
  count: {
    total: number;
    sixMonth: number;
    month: number;
    day: number;
  };
};

export type EnsProfileData = {
  avatar: string;
  description: string;
  links: {
    url: string;
    email: string;
    twitter: string;
    github: string;
  };
};
