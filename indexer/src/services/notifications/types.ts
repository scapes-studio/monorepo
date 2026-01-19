export type NotificationEventType =
  | "merge"
  | "offer"
  | "sale"
  | "g27_bid"
  | "g27_claim";

export type NotificationChannel = "discord" | "twitter";

export interface NotificationEvent {
  id: string;
  timestamp: number;
  txHash: string;
}

export interface MergeEvent extends NotificationEvent {
  tokenId: bigint;
  to: string;
  scape?: {
    id: bigint;
    owner: string;
    attributes: unknown;
  };
  ownerDisplay?: string;
}

export interface OfferEvent extends NotificationEvent {
  tokenId: bigint;
  lister: string;
  price: bigint;
  scape?: {
    id: bigint;
    owner: string;
    attributes: unknown;
  };
  listerDisplay?: string;
}

export interface SaleEvent extends NotificationEvent {
  tokenId: bigint;
  seller: string;
  buyer: string;
  price: bigint;
  scape?: {
    id: bigint;
    owner: string;
    attributes: unknown;
  };
  buyerDisplay?: string;
}

export interface G27BidEvent extends NotificationEvent {
  punkScapeId: bigint;
  bidder: string;
  amount: bigint;
  message: string;
  scapeDetail?: {
    tokenId: number;
    scapeId: number | null;
    description: string | null;
    imagePath: string | null;
  };
  bidderDisplay?: string;
}

export interface G27ClaimEvent extends NotificationEvent {
  tokenId: bigint;
  to: string;
  scapeDetail?: {
    tokenId: number;
    scapeId: number | null;
    description: string | null;
    imagePath: string | null;
  };
  ownerDisplay?: string;
}

export type AnyNotificationEvent =
  | MergeEvent
  | OfferEvent
  | SaleEvent
  | G27BidEvent
  | G27ClaimEvent;

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  image?: { url: string };
  thumbnail?: { url: string; height?: number; width?: number };
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string; icon_url?: string };
  timestamp?: string;
}

export interface DiscordPayload {
  content?: string | null;
  embeds?: DiscordEmbed[];
}
