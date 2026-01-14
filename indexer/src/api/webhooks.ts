/**
 * Webhook Handlers
 *
 * Handles incoming webhooks from external services like Leonardo AI.
 */

import type { Context } from "hono";
import { aiImageService, type LeonardoWebhookData } from "../services/ai-image";

/**
 * Verify team token authentication
 */
function verifyTeamToken(c: Context): boolean {
  const teamToken = process.env.TEAM_TOKEN;
  if (!teamToken) {
    console.warn("TEAM_TOKEN not configured, webhook auth disabled");
    return true;
  }

  const authHeader = c.req.header("authorization");
  return authHeader === `Bearer ${teamToken}`;
}

/**
 * POST /webhooks/leonardo
 * Handle Leonardo AI webhooks for image generation completion
 */
export async function handleLeonardoWebhook(c: Context) {
  // Verify authentication
  if (!verifyTeamToken(c)) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await c.req.json<LeonardoWebhookData>();

    if (!body.type || !body.data?.object) {
      return c.json({ error: "Invalid webhook payload" }, 400);
    }

    const taskId = body.data.object.id;

    if (body.type === "image_generation.complete") {
      // Image generation completed
      console.log(`Leonardo webhook: Generation complete for task ${taskId}`);
      await aiImageService.handleGenerationComplete(taskId, body);
      return c.json({ status: "ok" });
    }

    if (body.type === "post_processing.completed") {
      // Upscale completed
      console.log(`Leonardo webhook: Upscale complete for task ${taskId}`);
      const imageUrl = body.data.object.url;
      if (!imageUrl) {
        return c.json({ error: "Missing image URL in upscale webhook" }, 400);
      }
      await aiImageService.handleUpscaleComplete(taskId, imageUrl);
      return c.json({ status: "ok" });
    }

    console.warn(`Leonardo webhook: Unknown type ${body.type}`);
    return c.json({ error: "Unknown webhook type" }, 400);
  } catch (error) {
    console.error("Leonardo webhook error:", error);
    return c.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
}
