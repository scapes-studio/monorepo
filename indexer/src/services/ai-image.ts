/**
 * AI Image Service
 *
 * Orchestrates AI image generation for TwentySevenYear scapes.
 * Handles the full flow: prompt generation -> Leonardo API -> S3 storage -> DB updates.
 */

import { eq } from "drizzle-orm";
import { getOffchainDb } from "./database";
import { generatePrompt, type PromptResult, type Attribute } from "./prompt-generator";
import { leonardoService } from "./leonardo";
import { s3Service } from "./s3";
import {
  twentySevenYearRequest,
  twentySevenYearScapeDetail,
  type TwentySevenYearImageInput,
} from "../../offchain.schema";

// Types
export interface GenerateForScapeParams {
  tokenId: number;
  scapeId: number;
  message?: string;
  bidderAddress?: string;
  transactionHash?: string;
  bidValue?: string;
}

export interface GenerateResult {
  requestId: number;
  taskId: string;
  prompt: PromptResult;
}

export interface LeonardoImageData {
  id: string;
  url: string;
}

export interface LeonardoWebhookData {
  type: string;
  data: {
    object: {
      id: string;
      seed?: string;
      images?: LeonardoImageData[];
      url?: string; // For upscale completion
    };
  };
}

/**
 * AI Image Service Class
 */
export class AiImageService {
  /**
   * Generate an AI image for a TwentySevenYear scape
   */
  async generateForScape(params: GenerateForScapeParams): Promise<GenerateResult> {
    const { tokenId, scapeId, message, bidderAddress, transactionHash, bidValue } = params;

    // Generate prompt
    const promptResult = generatePrompt(scapeId, message);

    // Create generation task on Leonardo
    const taskId = await leonardoService.createGeneration({
      scapeId,
      prompt: promptResult.prompt,
      initStrength: promptResult.initStrength,
    });

    // Create request record in database
    const db = getOffchainDb();
    const now = Math.floor(Date.now() / 1000);

    const imageInput: TwentySevenYearImageInput = {
      prompt: promptResult.prompt,
      systemPrompt: promptResult.systemPrompt,
      userPrompt: promptResult.userPrompt,
      attributes: promptResult.attributes as unknown as Record<string, unknown>[],
      initStrength: promptResult.initStrength,
    };

    const [request] = await db
      .insert(twentySevenYearRequest)
      .values({
        tokenId,
        from: bidderAddress ?? null,
        transactionHash: transactionHash ?? null,
        value: bidValue ?? null,
        description: message ?? null,
        imageInput,
        imageTaskId: taskId,
        createdAt: now,
        startedProcessingAt: now,
      })
      .returning();

    return {
      requestId: request!.id,
      taskId,
      prompt: promptResult,
    };
  }

  /**
   * Handle Leonardo image generation completion webhook
   */
  async handleGenerationComplete(
    taskId: string,
    data: LeonardoWebhookData,
  ): Promise<void> {
    const db = getOffchainDb();

    // Find the request by task ID
    const request = await db.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.imageTaskId, taskId),
    });

    if (!request) {
      throw new Error(`Request not found for task ID: ${taskId}`);
    }

    const generationData = data.data.object;
    const imageData = generationData.images?.[0];

    if (!imageData) {
      throw new Error(`No image data in webhook for task ID: ${taskId}`);
    }

    // Get scapeId from the scape detail
    const scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
      where: eq(twentySevenYearScapeDetail.tokenId, request.tokenId),
    });

    const scapeId = scapeDetail?.scapeId ?? request.tokenId;

    // Download image from Leonardo
    const imageResponse = await fetch(imageData.url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to S3
    const s3Path = `ai-scapes/${scapeId}/${generationData.id}`;
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";
    await s3Service.uploadFile(s3Path, imageBuffer, contentType);

    // Update request with completion data
    const now = Math.floor(Date.now() / 1000);
    const updatedInput = {
      ...(request.imageInput as TwentySevenYearImageInput),
      seed: generationData.seed,
      imageId: imageData.id,
    };

    await db
      .update(twentySevenYearRequest)
      .set({
        imagePath: s3Path,
        imageInput: updatedInput,
        completedAt: now,
      })
      .where(eq(twentySevenYearRequest.id, request.id));

    // Update scape detail initialRenderId if this is the first render
    if (scapeDetail && !scapeDetail.initialRenderId) {
      await db
        .update(twentySevenYearScapeDetail)
        .set({ initialRenderId: request.id })
        .where(eq(twentySevenYearScapeDetail.tokenId, request.tokenId));
    }

    // Trigger upscale if we have the image ID
    if (imageData.id) {
      try {
        const upscaleTaskId = await leonardoService.createUpscale(imageData.id);
        // Store upscale task ID in imageInput
        await db
          .update(twentySevenYearRequest)
          .set({
            imageInput: {
              ...updatedInput,
              upscaleTaskId,
            },
          })
          .where(eq(twentySevenYearRequest.id, request.id));
      } catch (error) {
        console.error("Failed to start upscale:", error);
        // Don't fail the whole operation if upscale fails
      }
    }
  }

  /**
   * Handle Leonardo upscale completion webhook
   */
  async handleUpscaleComplete(
    upscaleTaskId: string,
    imageUrl: string,
  ): Promise<void> {
    const db = getOffchainDb();

    // Find request by upscale task ID in imageInput JSON
    // This requires a raw query since we're searching inside JSON
    const pool = await import("./database").then((m) => m.getOffchainPool());
    const result = await pool.query<{ id: number; image_path: string; token_id: number }>(
      `SELECT id, image_path, token_id FROM twenty_seven_year_request
       WHERE image_input->>'upscaleTaskId' = $1
       LIMIT 1`,
      [upscaleTaskId],
    );

    const request = result.rows[0];
    if (!request) {
      throw new Error(`Request not found for upscale task ID: ${upscaleTaskId}`);
    }

    // Download upscaled image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download upscaled image: ${imageResponse.status}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Upload to S3 with _upscaled suffix
    const s3Path = `${request.image_path}_upscaled`;
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";
    await s3Service.uploadFile(s3Path, imageBuffer, contentType);
  }

  /**
   * Get a request by ID
   */
  async getRequest(requestId: number) {
    const db = getOffchainDb();
    return db.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.id, requestId),
    });
  }

  /**
   * Get completed pregenerations for a token
   */
  async getPregenerations(tokenId: number, limit: number = 10) {
    const db = getOffchainDb();
    const pool = await import("./database").then((m) => m.getOffchainPool());

    // Get pregenerations (completed, no bid value)
    const result = await pool.query(
      `SELECT * FROM twenty_seven_year_request
       WHERE token_id = $1
       AND completed_at IS NOT NULL
       AND value IS NULL
       ORDER BY created_at DESC
       LIMIT $2`,
      [tokenId, limit],
    );

    return result.rows;
  }

  /**
   * Choose initial image for a scape
   */
  async chooseInitialImage(tokenId: number, taskId: string): Promise<void> {
    const db = getOffchainDb();

    // Find the request by task ID
    const request = await db.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.imageTaskId, taskId),
    });

    if (!request) {
      throw new Error(`Request not found for task ID: ${taskId}`);
    }

    // Get the scape detail
    const scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
      where: eq(twentySevenYearScapeDetail.tokenId, tokenId),
    });

    if (!scapeDetail) {
      throw new Error(`Scape detail not found for token ID: ${tokenId}`);
    }

    // Check if auction has started and initial render already set
    const now = Math.floor(Date.now() / 1000);
    if (scapeDetail.date && scapeDetail.date <= now && scapeDetail.initialRenderId) {
      throw new Error("Day has already started");
    }

    // Update the initial render ID
    await db
      .update(twentySevenYearScapeDetail)
      .set({ initialRenderId: request.id })
      .where(eq(twentySevenYearScapeDetail.tokenId, tokenId));
  }

  /**
   * Regenerate an image with the same parameters
   */
  async regenerateImage(taskId: string): Promise<GenerateResult> {
    const db = getOffchainDb();

    // Find the request by task ID
    const request = await db.query.twentySevenYearRequest.findFirst({
      where: eq(twentySevenYearRequest.imageTaskId, taskId),
    });

    if (!request) {
      throw new Error(`Request not found for task ID: ${taskId}`);
    }

    // Get the scape detail to find scapeId
    const scapeDetail = await db.query.twentySevenYearScapeDetail.findFirst({
      where: eq(twentySevenYearScapeDetail.tokenId, request.tokenId),
    });

    const scapeId = scapeDetail?.scapeId ?? request.tokenId;
    const imageInput = request.imageInput as TwentySevenYearImageInput;

    // Create new generation with same prompt and initStrength
    const newTaskId = await leonardoService.createGeneration({
      scapeId,
      prompt: imageInput.prompt ?? "",
      initStrength: (imageInput.initStrength as number) ?? 0.25,
    });

    // Update the request with new task ID
    const now = Math.floor(Date.now() / 1000);
    await db
      .update(twentySevenYearRequest)
      .set({
        imageTaskId: newTaskId,
        startedProcessingAt: now,
        completedAt: null,
        imagePath: null,
      })
      .where(eq(twentySevenYearRequest.id, request.id));

    return {
      requestId: request.id,
      taskId: newTaskId,
      prompt: {
        systemPrompt: (imageInput.systemPrompt as string) ?? "",
        userPrompt: (imageInput.userPrompt as string) ?? "",
        prompt: imageInput.prompt ?? "",
        attributes: (imageInput.attributes as Attribute[]) ?? [],
        initStrength: (imageInput.initStrength as number) ?? 0.25,
      },
    };
  }
}

// Export singleton instance
export const aiImageService = new AiImageService();
