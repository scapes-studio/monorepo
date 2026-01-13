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

// History routes
app.get("/scapes/:tokenId/history", getScapeHistory);
app.get("/twenty-seven-year-scapes/:tokenId/history", getTwentySevenYearScapeHistory);

// Activity feed route
app.get("/activity", getActivity);

export default app;
