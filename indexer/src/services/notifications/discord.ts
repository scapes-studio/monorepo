import type {
  NotificationEventType,
  DiscordPayload,
  MergeEvent,
  OfferEvent,
  SaleEvent,
  SeaportSaleEvent,
  G27BidEvent,
  G27ClaimEvent,
} from "./types";
import { formatEth, formatPrice, formatAddress } from "./formatters";

function getWebhookUrl(eventType: NotificationEventType): string | undefined {
  switch (eventType) {
    case "merge":
    case "sale":
    case "seaport_sale":
      return process.env.DISCORD_WEBHOOK_MAIN;
    case "offer":
      return process.env.DISCORD_WEBHOOK_LISTINGS;
    case "g27_bid":
    case "g27_claim":
      return process.env.DISCORD_WEBHOOK_G27;
    default:
      return process.env.DISCORD_WEBHOOK_MAIN;
  }
}

function formatMergePayload(event: MergeEvent): DiscordPayload {
  const owner = event.ownerDisplay || formatAddress(event.to);
  return {
    embeds: [
      {
        color: 0xeeeeee,
        title: `New Merge! Scape #${event.tokenId}`,
        url: `https://scapes.xyz/${event.tokenId}`,
        image: {
          url: `https://cdn.scapes.xyz/scapes/lg/${event.tokenId}.png`,
        },
        fields: [
          {
            name: "Scapoor",
            value: `[${owner}](https://scapes.xyz/people/${event.to})`,
            inline: true,
          },
        ],
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      },
    ],
  };
}

function formatOfferPayload(event: OfferEvent): DiscordPayload {
  const lister = event.listerDisplay || formatAddress(event.lister);
  return {
    embeds: [
      {
        color: 0xeeeeee,
        title: `New Listing! Scape #${event.tokenId}`,
        url: `https://scapes.xyz/${event.tokenId}`,
        image: {
          url: `https://cdn.scapes.xyz/scapes/lg/${event.tokenId}.png`,
        },
        fields: [
          {
            name: "Scapoor",
            value: `[${lister}](https://scapes.xyz/people/${event.lister})`,
            inline: true,
          },
          {
            name: "Price",
            value: `${formatEth(event.price)} ETH`,
            inline: true,
          },
        ],
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      },
    ],
  };
}

function formatSalePayload(event: SaleEvent): DiscordPayload {
  const buyer = event.buyerDisplay || formatAddress(event.buyer);
  return {
    embeds: [
      {
        color: 0xeeeeee,
        title: `New Sale! Scape #${event.tokenId}`,
        url: `https://scapes.xyz/${event.tokenId}`,
        image: {
          url: `https://cdn.scapes.xyz/scapes/lg/${event.tokenId}.png`,
        },
        fields: [
          {
            name: "Scapoor",
            value: `[${buyer}](https://scapes.xyz/people/${event.buyer})`,
            inline: true,
          },
          {
            name: "Price",
            value: `${formatEth(event.price)} ETH`,
            inline: true,
          },
        ],
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      },
    ],
  };
}

function formatSeaportSalePayload(event: SeaportSaleEvent): DiscordPayload {
  const buyer = event.buyerDisplay || formatAddress(event.buyer);
  const isScapes = event.slug === "scapes";
  return {
    embeds: [
      {
        color: 0xeeeeee,
        title: `New Sale! Scape #${event.tokenId}`,
        url: isScapes
          ? `https://scapes.xyz/${event.tokenId}`
          : `https://scapes.xyz/${event.tokenId}`,
        image: { url: `https://cdn.scapes.xyz/scapes/lg/${event.tokenId}.png` },
        fields: [
          {
            name: "Scapoor",
            value: `[${buyer}](https://scapes.xyz/people/${event.buyer})`,
            inline: true,
          },
          {
            name: "Price",
            value: `${formatPrice(event.price)} ETH`,
            inline: true,
          },
        ],
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      },
    ],
  };
}

function formatG27BidPayload(event: G27BidEvent): DiscordPayload {
  const bidder = event.bidderDisplay || formatAddress(event.bidder);
  const tokenId = event.scapeDetail?.tokenId;
  const punkScapeId = event.scapeDetail?.scapeId;
  const imagePath = event.scapeDetail?.imagePath;

  return {
    embeds: [
      {
        title: `Auction Bid on Day ${tokenId}`,
        url: `https://scapes.xyz/gallery27/${tokenId}`,
        color: 0xff00cc,
        image: imagePath ? { url: `https://cdn.scapes.xyz/${imagePath}` } : undefined,
        fields: [
          {
            name: "Bid",
            value: `${formatEth(event.amount)} ETH from [${bidder}](https://scapes.xyz/gallery27/accounts/${event.bidder})`,
            inline: true,
          },
          {
            name: "Message",
            value: `\`${event.message}\``,
            inline: event.message.length < 80,
          },
        ],
        footer: punkScapeId
          ? {
            text: `Derived from Scape #${punkScapeId}`,
            icon_url: `https://cdn.punkscape.xyz/scapes/sm/${punkScapeId}.png`,
          }
          : undefined,
        timestamp: new Date(event.timestamp * 1000).toISOString(),
      },
    ],
  };
}

function formatG27ClaimPayload(event: G27ClaimEvent): DiscordPayload {
  const owner = event.ownerDisplay || formatAddress(event.to);
  const tokenId = event.scapeDetail?.tokenId;
  const description = event.scapeDetail?.description || "";

  return {
    content: `[${owner} minted *Day ${tokenId}: ${description}*](https://scapes.xyz/gallery27/${tokenId})`,
  };
}

function formatPayload(
  eventType: NotificationEventType,
  event: MergeEvent | OfferEvent | SaleEvent | SeaportSaleEvent | G27BidEvent | G27ClaimEvent
): DiscordPayload {
  switch (eventType) {
    case "merge":
      return formatMergePayload(event as MergeEvent);
    case "offer":
      return formatOfferPayload(event as OfferEvent);
    case "sale":
      return formatSalePayload(event as SaleEvent);
    case "seaport_sale":
      return formatSeaportSalePayload(event as SeaportSaleEvent);
    case "g27_bid":
      return formatG27BidPayload(event as G27BidEvent);
    case "g27_claim":
      return formatG27ClaimPayload(event as G27ClaimEvent);
  }
}

class DiscordService {
  async send(
    eventType: NotificationEventType,
    event: MergeEvent | OfferEvent | SaleEvent | SeaportSaleEvent | G27BidEvent | G27ClaimEvent
  ): Promise<void> {
    const webhookUrl = getWebhookUrl(eventType);
    if (!webhookUrl) {
      console.warn(`No Discord webhook configured for ${eventType}`);
      return;
    }

    const payload = formatPayload(eventType, event);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Discord webhook failed (${response.status}): ${text}`);
    }
  }
}

export const discordService = new DiscordService();
