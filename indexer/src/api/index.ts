import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { getProfile, forceUpdateProfile } from "./profiles";
import { getSales, getSalesBySlug } from "./sales";
import { getVolumeStats, getVolumeStatsBySlug } from "./stats";
import { getScapeHistory, getTwentySevenYearScapeHistory } from "./history";
import { getAttributeCounts } from "./attributes";

const app = new Hono();

// Built-in routes
app.use("/sql/*", client({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.get("/", (c) => c.text("Scapes Indexer"));

// Profile routes
app.get("/profiles/:id", getProfile);
app.post("/profiles/:id", forceUpdateProfile);

// Seaport sales routes
app.get("/seaport/sales", getSales);
app.get("/seaport/sales/:slug", getSalesBySlug);

// Stats routes
app.get("/seaport/stats/volume", getVolumeStats);
app.get("/seaport/stats/volume/:slug", getVolumeStatsBySlug);

// Attribute counts route (must be before :tokenId routes)
app.get("/scapes/attributes", getAttributeCounts);

// History routes
app.get("/scapes/:tokenId/history", getScapeHistory);
app.get("/twenty-seven-year-scapes/:tokenId/history", getTwentySevenYearScapeHistory);

export default app;
