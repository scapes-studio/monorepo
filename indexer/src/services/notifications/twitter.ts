import { Client, OAuth1, type OAuth1Config, type ClientConfig } from "@xdevplatform/xdk";
import type {
  NotificationEventType,
  MergeEvent,
  OfferEvent,
  SaleEvent,
  G27BidEvent,
  G27ClaimEvent,
} from "./types";
import { formatEth, formatAddress } from "./formatters";

function getOAuth1Config(eventType: NotificationEventType): OAuth1Config | null {
  // G27 events use a different Twitter account
  if (eventType.startsWith("g27_")) {
    const apiKey = process.env.G27_TWITTER_CONSUMER_KEY;
    const apiSecret = process.env.G27_TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.G27_TWITTER_OAUTH_TOKEN;
    const accessTokenSecret = process.env.G27_TWITTER_OAUTH_TOKEN_SECRET;

    if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return null;
    }

    return { apiKey, apiSecret, accessToken, accessTokenSecret, callback: "oob" };
  }

  const apiKey = process.env.TWITTER_CONSUMER_KEY;
  const apiSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_OAUTH_TOKEN;
  const accessTokenSecret = process.env.TWITTER_OAUTH_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return { apiKey, apiSecret, accessToken, accessTokenSecret, callback: "oob" };
}

function formatTweet(
  eventType: NotificationEventType,
  event: MergeEvent | OfferEvent | SaleEvent | G27BidEvent | G27ClaimEvent
): string {
  switch (eventType) {
    case "merge": {
      const e = event as MergeEvent;
      const owner = e.ownerDisplay || formatAddress(e.to);
      return `New Merge! ${owner} just created Scape #${e.tokenId}\n\nhttps://scapes.xyz/scapes/${e.tokenId}`;
    }
    case "offer": {
      const e = event as OfferEvent;
      const lister = e.listerDisplay || formatAddress(e.lister);
      return `New Listing! ${lister} listed Scape #${e.tokenId} for ${formatEth(e.price)} ETH\n\nhttps://scapes.xyz/scapes/${e.tokenId}`;
    }
    case "sale": {
      const e = event as SaleEvent;
      const buyer = e.buyerDisplay || formatAddress(e.buyer);
      return `New Sale! ${buyer} bought Scape #${e.tokenId} for ${formatEth(e.price)} ETH\n\nhttps://scapes.xyz/scapes/${e.tokenId}`;
    }
    case "g27_bid": {
      const e = event as G27BidEvent;
      const bidder = e.bidderDisplay || formatAddress(e.bidder);
      const tokenId = e.scapeDetail?.tokenId;
      return `Auction Bid on Day ${tokenId}\n\n${formatEth(e.amount)} ETH from ${bidder}\n\nhttps://scapes.xyz/gallery27/${tokenId}`;
    }
    case "g27_claim": {
      const e = event as G27ClaimEvent;
      const owner = e.ownerDisplay || formatAddress(e.to);
      const tokenId = e.scapeDetail?.tokenId;
      const description = e.scapeDetail?.description || "";
      return `${owner} minted Day ${tokenId}: ${description}\n\nhttps://scapes.xyz/gallery27/${tokenId}`;
    }
  }
}

class TwitterService {
  async send(
    eventType: NotificationEventType,
    event: MergeEvent | OfferEvent | SaleEvent | G27BidEvent | G27ClaimEvent
  ): Promise<void> {
    const oauth1Config = getOAuth1Config(eventType);
    if (!oauth1Config) {
      console.warn(`No Twitter credentials configured for ${eventType}`);
      return;
    }

    const oauth1 = new OAuth1(oauth1Config);
    const config: ClientConfig = { oauth1 };
    const client = new Client(config);

    const text = formatTweet(eventType, event);
    await client.posts.create({ text });
  }
}

export const twitterService = new TwitterService();
