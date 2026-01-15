import { db } from "ponder:api";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import * as ponderSchema from "../../ponder.schema";
import { schema as combinedSchema } from "../../combined.schema";
import { getProfile, forceUpdateProfile } from "./profiles";
import { getSales, getSalesBySlug } from "./sales";
import { getVolumeStats, getVolumeStatsBySlug } from "./stats";
import { getScapeHistory, getTwentySevenYearScapeHistory } from "./history";
import { getAttributeCounts } from "./attributes";
import { getActivity } from "./activity";
import { getListings, getListingByTokenId } from "./listings";
import { getScapeImage } from "./images";
import {
  get27yScape,
  get27yByScapeId,
  get27yCurrent,
  get27yNext,
  get27yAll,
  get27yInitialImage,
  get27yPregenerations,
  post27yPregenerate,
  post27yChooseInitialImage,
  post27yRegenerateImage,
  get27yAuction,
  get27yBids,
  get27yMetadata,
  get27yScapesByOwner,
} from "./27y";
import { getSESMetadata } from "./ses";
import { handleLeonardoWebhook } from "./webhooks";

const app = new Hono();

// Built-in routes - combined schema for full access
app.use("/sql/*", client({ db, schema: combinedSchema }));
app.use("/graphql", graphql({ db, schema: combinedSchema }));

app.get("/", (c) => c.text("Scapes Indexer"));

// Profile routes
app.get("/profiles/:id", getProfile);
app.post("/profiles/:id", forceUpdateProfile);

// Seaport sales routes
app.get("/seaport/sales", getSales);
app.get("/seaport/sales/:slug", getSalesBySlug);

// Unified listings routes (onchain + seaport)
app.get("/listings", getListings);
app.get("/listings/:tokenId", getListingByTokenId);

// Stats routes
app.get("/seaport/stats/volume", getVolumeStats);
app.get("/seaport/stats/volume/:slug", getVolumeStatsBySlug);

// Attribute counts route (must be before :tokenId routes)
app.get("/scapes/attributes", getAttributeCounts);

// Image route (for merge previews)
app.get("/scapes/:tokenId/image", getScapeImage);

// History routes
app.get("/scapes/:tokenId/history", getScapeHistory);
app.get("/twenty-seven-year-scapes/:tokenId/history", getTwentySevenYearScapeHistory);

// Activity feed route
app.get("/activity", getActivity);

// SES metadata route
app.get("/ses/:tokenId", getSESMetadata);

// TwentySevenYear routes (must be before /27y/:tokenId to avoid matching)
app.get("/27y/current", get27yCurrent);
app.get("/27y/next", get27yNext);
app.get("/27y/all", get27yAll);
app.get("/27y/by-scape/:scapeId", get27yByScapeId);
app.get("/27y/:tokenId", get27yScape);

// TwentySevenYear pregeneration routes
app.get("/27y/:tokenId/initial-image", get27yInitialImage);
app.get("/27y/:tokenId/pregenerations", get27yPregenerations);
app.post("/27y/:tokenId/pregenerate", post27yPregenerate);
app.post("/27y/:tokenId/pregenerations/choose", post27yChooseInitialImage);
app.post("/27y/images/:taskId/regenerate", post27yRegenerateImage);

// TwentySevenYear auction and bids routes
app.get("/27y/:tokenId/auction", get27yAuction);
app.get("/27y/:tokenId/bids", get27yBids);

// Gallery27 metadata route (legacy API path)
app.get("/gallery27/:tokenId/metadata.json", get27yMetadata);

// Profile 27Y scapes route
app.get("/profiles/:address/27y-scapes", get27yScapesByOwner);

// Webhooks
app.post("/webhooks/leonardo", handleLeonardoWebhook);

export default app;
