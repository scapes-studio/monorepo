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
  getGallery27Scape,
  getGallery27ByScapeId,
  getGallery27Current,
  getGallery27Next,
  getGallery27All,
  getGallery27InitialImage,
  getGallery27Pregenerations,
  postGallery27Pregenerate,
  postGallery27ChooseInitialImage,
  postGallery27RegenerateImage,
  getGallery27Auction,
  getGallery27Bids,
  getGallery27Metadata,
  getGallery27ScapesByOwner,
  getGallery27ClaimableByAddress,
} from "./gallery27";
import { postSignInitializeAuction, postSignClaim } from "./gallery27-actions";
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

// Gallery27 routes (must be before /gallery27/:tokenId to avoid matching)
app.get("/gallery27/current", getGallery27Current);
app.get("/gallery27/next", getGallery27Next);
app.get("/gallery27/all", getGallery27All);
app.get("/gallery27/by-scape/:scapeId", getGallery27ByScapeId);
app.get("/gallery27/:tokenId", getGallery27Scape);

// Gallery27 pregeneration routes
app.get("/gallery27/:tokenId/initial-image", getGallery27InitialImage);
app.get("/gallery27/:tokenId/pregenerations", getGallery27Pregenerations);
app.post("/gallery27/:tokenId/pregenerate", postGallery27Pregenerate);
app.post("/gallery27/:tokenId/pregenerations/choose", postGallery27ChooseInitialImage);
app.post("/gallery27/images/:taskId/regenerate", postGallery27RegenerateImage);

// Gallery27 auction and bids routes
app.get("/gallery27/:tokenId/auction", getGallery27Auction);
app.get("/gallery27/:tokenId/bids", getGallery27Bids);

// Gallery27 signature routes (for onchain actions)
app.post("/gallery27/sign-initialize-auction", postSignInitializeAuction);
app.post("/gallery27/sign-claim", postSignClaim);

// Gallery27 metadata route
app.get("/gallery27/:tokenId/metadata.json", getGallery27Metadata);

// Profile Gallery27 scapes routes
app.get("/profiles/:address/gallery27-scapes", getGallery27ScapesByOwner);
app.get("/profiles/:address/gallery27-claimable", getGallery27ClaimableByAddress);

// Webhooks
app.post("/webhooks/leonardo", handleLeonardoWebhook);

export default app;
