export interface Gallery27ScapeDetail {
  tokenId: number;
  scapeId: number | null;
  date: number | null;
  auctionEndsAt: number | null;
  description: string | null;
  imagePath: string | null;
  imageCid: string | null;
  owner: string | null;
  initialRenderId: number | null;
  completedAt: number | null;
  isMinted: boolean;
}

export interface Gallery27AuctionState {
  tokenId: number;
  punkScapeId: number;
  latestBidder: string | null;
  latestBid: string | null;
  startTimestamp: number | null;
  endTimestamp: number | null;
  bidCount: number;
  settled: boolean;
}

export interface Gallery27Image {
  id: number;
  path: string;
  steps: number | null;
}

export interface Gallery27Bid {
  id: string;
  bidder: string;
  bidderEns: string | null;
  amount: string;
  message: string;
  timestamp: number;
  txHash: string;
  image: Gallery27Image | null;
}

export interface Gallery27BidsResponse {
  bids: Gallery27Bid[];
  initialRender: Gallery27Image | null;
  acceptedImage: Gallery27Image | null;
}

export interface Gallery27OwnedScape {
  tokenId: number;
  scapeId: number | null;
  date: number | null;
  description: string | null;
  imagePath: string | null;
  step: number | null;
  owner: string;
}

export interface Gallery27OwnedScapesResponse {
  scapes: Gallery27OwnedScape[];
}

export interface Gallery27ListItem {
  tokenId: number;
  date: number | null;
  scapeId: number | null;
  imagePath: string | null;
  initialRenderPath: string | null;
}

export interface Gallery27ListResponse {
  scapes: Gallery27ListItem[];
  total: number;
  hasMore: boolean;
}
