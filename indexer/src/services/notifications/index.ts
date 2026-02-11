import { eq, gt, and, asc } from "drizzle-orm";
import { getViewsDb, getOffchainDb } from "../database";
import { schema } from "../../../combined.schema";
import {
  notificationState,
  ensProfile,
  twentySevenYearScapeDetail,
  seaportSale,
} from "../../../offchain.schema";
import { discordService } from "./discord";
import { twitterService } from "./twitter";
import type {
  NotificationEventType,
  NotificationChannel,
  MergeEvent,
  OfferEvent,
  SaleEvent,
  SeaportSaleEvent,
  G27BidEvent,
  G27ClaimEvent,
  AnyNotificationEvent,
} from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const MERGE_TOKEN_ID_START = 10000n;

export type { NotificationEventType, NotificationChannel };

export interface NotificationServiceOptions {
  dryRun?: boolean;
  channels?: NotificationChannel[];
}

export class NotificationService {
  private dryRun: boolean;
  private channels: NotificationChannel[];

  constructor(options: NotificationServiceOptions = {}) {
    this.dryRun = options.dryRun ?? false;
    this.channels = options.channels ?? ["discord", "twitter"];
  }

  async processNotifications(
    eventTypes?: NotificationEventType[]
  ): Promise<{ type: NotificationEventType; count: number }[]> {
    const types: NotificationEventType[] = eventTypes ?? [
      "merge",
      "offer",
      "sale",
      "seaport_sale",
      "g27_bid",
      "g27_claim",
    ];
    const results: { type: NotificationEventType; count: number }[] = [];

    for (const eventType of types) {
      const count = await this.processEventType(eventType);
      results.push({ type: eventType, count });
    }

    return results;
  }

  private async processEventType(eventType: NotificationEventType): Promise<number> {
    const state = await this.getState(eventType);
    const lastTimestamp = state?.lastNotifiedTimestamp ?? 0;

    console.log(`Processing ${eventType} (since ${lastTimestamp})...`);

    const events = await this.getNewEvents(eventType, lastTimestamp);
    console.log(`  Found ${events.length} new events`);

    let count = 0;
    for (const event of events) {
      try {
        await this.sendNotification(eventType, event);
        await this.updateState(eventType, event.timestamp, event.id);
        console.log(`  Notified: ${event.id}`);
        count++;
      } catch (error) {
        console.error(`  Failed: ${event.id}:`, error);
        // Stop processing on failure to maintain order
        throw error;
      }
    }

    return count;
  }

  private async getState(eventType: NotificationEventType) {
    const db = getOffchainDb();
    return db.query.notificationState.findFirst({
      where: eq(notificationState.eventType, eventType),
    });
  }

  private async updateState(
    eventType: NotificationEventType,
    timestamp: number,
    eventId?: string
  ) {
    if (this.dryRun) return;

    const db = getOffchainDb();
    const now = Math.floor(Date.now() / 1000);

    await db
      .insert(notificationState)
      .values({
        eventType,
        lastNotifiedTimestamp: timestamp,
        lastNotifiedId: eventId ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: notificationState.eventType,
        set: {
          lastNotifiedTimestamp: timestamp,
          lastNotifiedId: eventId ?? null,
          updatedAt: now,
        },
      });
  }

  private async getNewEvents(
    eventType: NotificationEventType,
    afterTimestamp: number
  ): Promise<AnyNotificationEvent[]> {
    switch (eventType) {
      case "merge":
        return this.getMergeEvents(afterTimestamp);
      case "offer":
        return this.getOfferEvents(afterTimestamp);
      case "sale":
        return this.getSaleEvents(afterTimestamp);
      case "seaport_sale":
        return this.getSeaportSaleEvents(afterTimestamp);
      case "g27_bid":
        return this.getG27BidEvents(afterTimestamp);
      case "g27_claim":
        return this.getG27ClaimEvents(afterTimestamp);
    }
  }

  private async getMergeEvents(afterTimestamp: number): Promise<MergeEvent[]> {
    const viewsDb = getViewsDb();

    const results = await viewsDb
      .select({
        id: schema.transferEvent.id,
        timestamp: schema.transferEvent.timestamp,
        tokenId: schema.transferEvent.scape,
        to: schema.transferEvent.to,
        txHash: schema.transferEvent.txHash,
      })
      .from(schema.transferEvent)
      .where(
        and(
          eq(schema.transferEvent.from, ZERO_ADDRESS),
          gt(schema.transferEvent.timestamp, afterTimestamp),
          gt(schema.transferEvent.scape, MERGE_TOKEN_ID_START)
        )
      )
      .orderBy(asc(schema.transferEvent.timestamp));

    return Promise.all(
      results.map(async (r) => {
        const scape = await viewsDb.query.scape.findFirst({
          where: eq(schema.scape.id, r.tokenId),
        });
        const ownerDisplay = await this.getDisplayName(r.to);
        return {
          id: r.id,
          timestamp: r.timestamp,
          tokenId: r.tokenId,
          to: r.to,
          txHash: r.txHash,
          scape: scape ?? undefined,
          ownerDisplay,
        };
      })
    );
  }

  private async getOfferEvents(afterTimestamp: number): Promise<OfferEvent[]> {
    const viewsDb = getViewsDb();

    const results = await viewsDb
      .select({
        tokenId: schema.offer.tokenId,
        timestamp: schema.offer.createdAt,
        lister: schema.offer.lister,
        price: schema.offer.price,
        txHash: schema.offer.txHash,
      })
      .from(schema.offer)
      .where(
        and(
          eq(schema.offer.isActive, true),
          gt(schema.offer.createdAt, afterTimestamp)
        )
      )
      .orderBy(asc(schema.offer.createdAt));

    return Promise.all(
      results.map(async (r) => {
        const scape = await viewsDb.query.scape.findFirst({
          where: eq(schema.scape.id, r.tokenId),
        });
        const listerDisplay = await this.getDisplayName(r.lister);
        return {
          id: `offer-${r.tokenId}-${r.timestamp}`,
          timestamp: r.timestamp,
          tokenId: r.tokenId,
          lister: r.lister,
          price: r.price,
          txHash: r.txHash,
          scape: scape ?? undefined,
          listerDisplay,
        };
      })
    );
  }

  private async getSaleEvents(afterTimestamp: number): Promise<SaleEvent[]> {
    const viewsDb = getViewsDb();

    const results = await viewsDb
      .select({
        id: schema.sale.id,
        timestamp: schema.sale.timestamp,
        tokenId: schema.sale.tokenId,
        seller: schema.sale.seller,
        buyer: schema.sale.buyer,
        price: schema.sale.price,
        txHash: schema.sale.txHash,
      })
      .from(schema.sale)
      .where(gt(schema.sale.timestamp, afterTimestamp))
      .orderBy(asc(schema.sale.timestamp));

    return Promise.all(
      results.map(async (r) => {
        const scape = await viewsDb.query.scape.findFirst({
          where: eq(schema.scape.id, r.tokenId),
        });
        const buyerDisplay = await this.getDisplayName(r.buyer);
        return {
          ...r,
          scape: scape ?? undefined,
          buyerDisplay,
        };
      })
    );
  }

  private async getSeaportSaleEvents(afterTimestamp: number): Promise<SeaportSaleEvent[]> {
    const offchainDb = getOffchainDb();
    const viewsDb = getViewsDb();

    const results = await offchainDb
      .select({
        id: seaportSale.id,
        timestamp: seaportSale.timestamp,
        tokenId: seaportSale.tokenId,
        slug: seaportSale.slug,
        seller: seaportSale.seller,
        buyer: seaportSale.buyer,
        price: seaportSale.price,
        txHash: seaportSale.txHash,
      })
      .from(seaportSale)
      .where(gt(seaportSale.timestamp, afterTimestamp))
      .orderBy(asc(seaportSale.timestamp));

    return Promise.all(
      results.map(async (r) => {
        const scape =
          r.slug === "scapes"
            ? await viewsDb.query.scape.findFirst({
                where: eq(schema.scape.id, BigInt(r.tokenId)),
              })
            : undefined;
        const buyerDisplay = await this.getDisplayName(r.buyer);
        return {
          id: r.id,
          timestamp: r.timestamp,
          tokenId: r.tokenId,
          slug: r.slug,
          seller: r.seller,
          buyer: r.buyer,
          price: r.price,
          txHash: r.txHash,
          scape: scape ?? undefined,
          buyerDisplay,
        };
      })
    );
  }

  private async getG27BidEvents(afterTimestamp: number): Promise<G27BidEvent[]> {
    const viewsDb = getViewsDb();
    const offchainDb = getOffchainDb();

    const results = await viewsDb
      .select({
        id: schema.gallery27Bid.id,
        timestamp: schema.gallery27Bid.timestamp,
        punkScapeId: schema.gallery27Bid.punkScapeId,
        bidder: schema.gallery27Bid.bidder,
        amount: schema.gallery27Bid.amount,
        message: schema.gallery27Bid.message,
        txHash: schema.gallery27Bid.txHash,
      })
      .from(schema.gallery27Bid)
      .where(gt(schema.gallery27Bid.timestamp, afterTimestamp))
      .orderBy(asc(schema.gallery27Bid.timestamp));

    return Promise.all(
      results.map(async (r) => {
        const detail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
          where: eq(twentySevenYearScapeDetail.scapeId, Number(r.punkScapeId)),
        });
        const bidderDisplay = await this.getDisplayName(r.bidder);
        return {
          ...r,
          scapeDetail: detail
            ? {
                tokenId: detail.tokenId,
                scapeId: detail.scapeId,
                description: detail.description,
                imagePath: detail.imagePath,
              }
            : undefined,
          bidderDisplay,
        };
      })
    );
  }

  private async getG27ClaimEvents(afterTimestamp: number): Promise<G27ClaimEvent[]> {
    const viewsDb = getViewsDb();
    const offchainDb = getOffchainDb();

    const results = await viewsDb
      .select({
        id: schema.twentySevenYearTransferEvent.id,
        timestamp: schema.twentySevenYearTransferEvent.timestamp,
        tokenId: schema.twentySevenYearTransferEvent.scape,
        to: schema.twentySevenYearTransferEvent.to,
        txHash: schema.twentySevenYearTransferEvent.txHash,
      })
      .from(schema.twentySevenYearTransferEvent)
      .where(
        and(
          eq(schema.twentySevenYearTransferEvent.from, ZERO_ADDRESS),
          gt(schema.twentySevenYearTransferEvent.timestamp, afterTimestamp)
        )
      )
      .orderBy(asc(schema.twentySevenYearTransferEvent.timestamp));

    return Promise.all(
      results.map(async (r) => {
        const detail = await offchainDb.query.twentySevenYearScapeDetail.findFirst({
          where: eq(twentySevenYearScapeDetail.tokenId, Number(r.tokenId)),
        });
        const ownerDisplay = await this.getDisplayName(r.to);
        return {
          ...r,
          scapeDetail: detail
            ? {
                tokenId: detail.tokenId,
                scapeId: detail.scapeId,
                description: detail.description,
                imagePath: detail.imagePath,
              }
            : undefined,
          ownerDisplay,
        };
      })
    );
  }

  private async getDisplayName(address: string): Promise<string | undefined> {
    const offchainDb = getOffchainDb();
    const profile = await offchainDb.query.ensProfile.findFirst({
      where: eq(ensProfile.address, address.toLowerCase()),
    });
    return profile?.ens ?? undefined;
  }

  private async sendNotification(
    eventType: NotificationEventType,
    event: AnyNotificationEvent
  ): Promise<void> {
    if (this.dryRun) {
      console.log(`  [DRY RUN] Would send ${eventType}:`, JSON.stringify(event, null, 2));
      return;
    }

    const results: { channel: NotificationChannel; success: boolean; error?: Error }[] = [];

    if (this.channels.includes("discord")) {
      try {
        await discordService.send(eventType, event as any);
        results.push({ channel: "discord", success: true });
      } catch (error) {
        console.warn(`    Discord failed: ${(error as Error).message}`);
        results.push({ channel: "discord", success: false, error: error as Error });
      }
    }

    if (this.channels.includes("twitter")) {
      try {
        await twitterService.send(eventType, event as any);
        results.push({ channel: "twitter", success: true });
      } catch (error) {
        console.warn(`    Twitter failed: ${(error as Error).message}`);
        results.push({ channel: "twitter", success: false, error: error as Error });
      }
    }

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    // Only throw if ALL channels failed
    if (successes.length === 0 && failures.length > 0) {
      throw new Error(
        `All notification channels failed: ${failures.map((f) => `${f.channel}: ${f.error?.message}`).join("; ")}`
      );
    }
  }
}
