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
import { get27yScape, get27yCurrent, get27yNext } from "./27y";
import { getSESMetadata } from "./ses";

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
app.get("/27y/:tokenId", get27yScape);

export default app;
