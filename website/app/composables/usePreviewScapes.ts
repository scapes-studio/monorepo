import { and, desc, eq, isNull, lte, sql } from "@ponder/client";
import type { ScapeRecord } from "~/composables/useScapesByOwner";

export type ScapeOnMarket = ScapeRecord & {
  price: bigint;
};

const PAGE_SIZE = 500;

export const usePreviewScapes = () => {
  const client = usePonderClient();

  const fetchScapes = async () => {
    const result = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
        price: schema.offer.price,
      })
      .from(schema.offer)
      .innerJoin(schema.scape, eq(schema.offer.tokenId, schema.scape.id))
      .where(and(eq(schema.offer.isActive, true), isNull(schema.offer.specificBuyer), lte(schema.scape.id, 10_000n)))
      .orderBy(desc(schema.offer.price))
      .limit(PAGE_SIZE);

    return result as ScapeOnMarket[];
  };

  const { data, pending, error } = useAsyncData("preview-scapes", fetchScapes, {
    server: true,
  });

  const scapes = computed(() => data.value ?? []);

  return {
    scapes,
    loading: pending,
    error,
  };
};

export const useRandomScapes = () => {
  const client = usePonderClient();

  const fetchScapes = async () => {
    const result = await client.db
      .select({
        id: schema.scape.id,
        owner: schema.scape.owner,
        attributes: schema.scape.attributes,
        rarity: schema.scape.rarity,
      })
      .from(schema.scape)
      .where(lte(schema.scape.id, 10_000n))
      .orderBy(sql`RANDOM()`)
      .limit(PAGE_SIZE);

    return result as ScapeRecord[];
  };

  const { data, pending, error } = useAsyncData("random-scapes", fetchScapes, {
    server: true,
  });

  const scapes = computed(() => data.value ?? []);

  return {
    scapes,
    loading: pending,
    error,
  };
};
