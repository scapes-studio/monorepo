import { eq, or } from "drizzle-orm";
import { type Context } from "hono";
import { publicClients } from "ponder:api";
import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { ensProfile } from "../../ponder.schema";
import { getViewsDb, withTriggersDisabled } from "../services/database";

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const client = publicClients["ethereum"]!;
const db = getViewsDb();

type ProfileResult = {
  address: `0x${string}` | null;
  ensName: string | null;
  cachedProfile: any | null;
  isFresh: boolean;
};

export const getProfile = async (c: Context) => {
  const identifier = c.req.param("id");
  const result = await resolveProfile(identifier);

  if (!result.address) {
    return c.json({ error: "Invalid address or ENS name" }, 400);
  }

  if (result.cachedProfile && result.isFresh) {
    return c.json(result.cachedProfile);
  }

  await updateProfile(result.address, result.ensName);
  return c.json(await fetchProfile(result.address));
};

export const forceUpdateProfile = async (c: Context) => {
  const identifier = c.req.param("id");
  const result = await resolveProfile(identifier);

  if (!result.address) {
    return c.json({ error: "Invalid address or ENS name" }, 400);
  }

  await updateProfile(result.address, result.ensName);
  return c.json(await fetchProfile(result.address));
};

async function resolveProfile(identifier: string): Promise<ProfileResult> {
  if (!identifier) {
    return { address: null, ensName: null, cachedProfile: null, isFresh: false };
  }

  if (isAddress(identifier)) {
    const address = identifier.toLowerCase() as `0x${string}`;
    const cachedProfile = await fetchProfile(address);

    if (cachedProfile) {
      return {
        address,
        ensName: cachedProfile.ens,
        cachedProfile,
        isFresh: isFresh(cachedProfile.updatedAt),
      };
    }

    const ensName = (await client.getEnsName({ address })) || null;
    return { address, ensName, cachedProfile: null, isFresh: false };
  }

  try {
    const normalizedEns = identifier.toLowerCase();
    const cachedProfile = await fetchProfile(normalizedEns);

    if (cachedProfile) {
      return {
        address: cachedProfile.address as `0x${string}`,
        ensName: normalizedEns,
        cachedProfile,
        isFresh: isFresh(cachedProfile.updatedAt),
      };
    }

    const address = await client.getEnsAddress({
      name: normalize(normalizedEns),
    });

    if (!address) {
      throw new Error(`No address found for ENS name ${normalizedEns}`);
    }

    const normalizedAddress = address.toLowerCase() as `0x${string}`;
    return {
      address: normalizedAddress,
      ensName: normalizedEns,
      cachedProfile: null,
      isFresh: false,
    };
  } catch (error) {
    return { address: null, ensName: null, cachedProfile: null, isFresh: false };
  }
}

function isFresh(timestamp: number | null): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp * 1000 < ONE_MONTH_MS;
}

const fetchProfile = async (identifier: string) => {
  const normalizedIdentifier = isAddress(identifier) ? identifier.toLowerCase() : identifier;

  return await db.query.ensProfile.findFirst({
    where: or(
      eq(ensProfile.address, normalizedIdentifier),
      eq(ensProfile.ens, normalizedIdentifier),
    ),
  });
};

const updateProfile = async (address: `0x${string}`, providedEns: string | null = null) => {
  const normalizedAddress = address.toLowerCase() as `0x${string}`;

  let ens = providedEns || (await client.getEnsName({ address: normalizedAddress })) || null;
  if (ens) {
    ens = ens.toLowerCase();
  }

  const data = {
    avatar: "",
    description: "",
    links: {
      url: "",
      email: "",
      twitter: "",
      github: "",
    },
  };

  if (ens) {
    const normalizedEns = normalize(ens);
    const [avatar, description, url, email, twitter, github] = await Promise.all([
      client.getEnsAvatar({ name: normalizedEns }),
      client.getEnsText({ name: normalizedEns, key: "description" }),
      client.getEnsText({ name: normalizedEns, key: "url" }),
      client.getEnsText({ name: normalizedEns, key: "email" }),
      client.getEnsText({ name: normalizedEns, key: "com.twitter" }),
      client.getEnsText({ name: normalizedEns, key: "com.github" }),
    ]);

    if (avatar) data.avatar = avatar;
    if (description) data.description = description;
    if (url) data.links.url = url;
    if (email) data.links.email = email;
    if (twitter) data.links.twitter = twitter;
    if (github) data.links.github = github;
  }

  const insertData = {
    ens,
    data,
    updatedAt: Math.floor(Date.now() / 1000),
  };

  await withTriggersDisabled(async (db) => {
    await db
      .insert(ensProfile)
      .values({
        address: normalizedAddress,
        ...insertData,
      })
      .onConflictDoUpdate({
        target: ensProfile.address,
        set: insertData,
      });
  });
};
