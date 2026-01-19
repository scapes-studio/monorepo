import crypto from "crypto";
import type {
  NotificationEventType,
  MergeEvent,
  OfferEvent,
  SaleEvent,
  G27BidEvent,
  G27ClaimEvent,
} from "./types";
import { formatEth, formatAddress } from "./formatters";

interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function getCredentials(eventType: NotificationEventType): OAuthCredentials | null {
  // G27 events use a different Twitter account
  if (eventType.startsWith("g27_")) {
    const consumerKey = process.env.G27_TWITTER_CONSUMER_KEY;
    const consumerSecret = process.env.G27_TWITTER_CONSUMER_SECRET;
    const accessToken = process.env.G27_TWITTER_OAUTH_TOKEN;
    const accessTokenSecret = process.env.G27_TWITTER_OAUTH_TOKEN_SECRET;

    if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
      return null;
    }

    return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
  }

  const consumerKey = process.env.TWITTER_CONSUMER_KEY;
  const consumerSecret = process.env.TWITTER_CONSUMER_SECRET;
  const accessToken = process.env.TWITTER_OAUTH_TOKEN;
  const accessTokenSecret = process.env.TWITTER_OAUTH_TOKEN_SECRET;

  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return null;
  }

  return { consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: OAuthCredentials
): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const signatureBaseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join("&");

  const signingKey = `${encodeURIComponent(credentials.consumerSecret)}&${encodeURIComponent(credentials.accessTokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");
}

function generateAuthHeader(
  method: string,
  url: string,
  credentials: OAuthCredentials
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: credentials.accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(method, url, oauthParams, credentials);
  oauthParams.oauth_signature = signature;

  const headerParts = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}="${encodeURIComponent(value)}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
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
    const credentials = getCredentials(eventType);
    if (!credentials) {
      console.warn(`No Twitter credentials configured for ${eventType}`);
      return;
    }

    const text = formatTweet(eventType, event);
    const url = "https://api.twitter.com/2/tweets";
    const authHeader = generateAuthHeader("POST", url, credentials);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Twitter API failed (${response.status}): ${errorText}`);
    }
  }
}

export const twitterService = new TwitterService();
