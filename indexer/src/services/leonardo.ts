/**
 * Leonardo AI Service
 *
 * Handles communication with Leonardo AI API for image generation.
 * Uses native fetch instead of external SDK for simplicity.
 */

const LEONARDO_API = "https://cloud.leonardo.ai/api/rest/v1";
const SCAPE_CDN = "https://punkscape.nyc3.digitaloceanspaces.com";

// Fixed generation parameters
const MODEL_ID = "1e60896f-3c26-4296-8ecc-53e2afecc132";
const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 576;
const NEGATIVE_PROMPT = "signature | watermark";
const NUM_INFERENCE_STEPS = 30;

// Response types
interface UploadInitImageResponse {
  uploadInitImage: {
    id: string;
    url: string;
    fields: string;
  };
}

interface CreateGenerationResponse {
  sdGenerationJob: {
    generationId: string;
  };
}

interface CreateUpscaleResponse {
  sdUpscaleJob: {
    id: string;
  };
}

export interface GenerationParams {
  scapeId: number;
  prompt: string;
  initStrength: number;
}

/**
 * Get Leonardo API key from environment
 */
function getApiKey(): string {
  const key = process.env.LEONARDO_KEY;
  if (!key) {
    throw new Error("LEONARDO_KEY environment variable is required");
  }
  return key;
}

/**
 * Make authenticated request to Leonardo API
 */
async function leonardoFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${LEONARDO_API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Leonardo API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Download PunkScape image from CDN
 */
async function downloadScapeImage(scapeId: number): Promise<Buffer> {
  const url = `${SCAPE_CDN}/scapes/40h/${scapeId}.png`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download scape image: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Leonardo AI Service Class
 */
export class LeonardoService {
  /**
   * Upload a PunkScape image as an init image for img2img generation
   */
  async uploadInitImage(scapeId: number): Promise<string> {
    // Download the scape image
    const imageBuffer = await downloadScapeImage(scapeId);

    // Get upload credentials from Leonardo
    const uploadResponse = await leonardoFetch<UploadInitImageResponse>(
      "/init-image",
      {
        method: "POST",
        body: JSON.stringify({ extension: "png" }),
      },
    );

    const { id, url, fields } = uploadResponse.uploadInitImage;
    const parsedFields = JSON.parse(fields) as Record<string, string>;

    // Upload image to Leonardo's S3
    const formData = new FormData();
    for (const [key, value] of Object.entries(parsedFields)) {
      formData.append(key, value);
    }
    formData.append("file", new Blob([imageBuffer]), "init.png");

    const uploadResult = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!uploadResult.ok) {
      throw new Error(`Failed to upload init image: ${uploadResult.status}`);
    }

    return id;
  }

  /**
   * Create an image generation task
   */
  async createGeneration(params: GenerationParams): Promise<string> {
    // Upload init image first
    const initImageId = await this.uploadInitImage(params.scapeId);

    // Create generation
    const response = await leonardoFetch<CreateGenerationResponse>(
      "/generations",
      {
        method: "POST",
        body: JSON.stringify({
          modelId: MODEL_ID,
          prompt: params.prompt,
          negative_prompt: NEGATIVE_PROMPT,
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          init_image_id: initImageId,
          init_strength: params.initStrength,
          num_inference_steps: NUM_INFERENCE_STEPS,
          num_images: 1,
          alchemy: false,
          promptMagic: false,
        }),
      },
    );

    const generationId = response.sdGenerationJob?.generationId;
    if (!generationId) {
      throw new Error("No generation ID returned from Leonardo");
    }

    return generationId;
  }

  /**
   * Create an upscale task for a generated image
   */
  async createUpscale(imageId: string): Promise<string> {
    const response = await leonardoFetch<CreateUpscaleResponse>(
      "/variations/upscale",
      {
        method: "POST",
        body: JSON.stringify({ id: imageId }),
      },
    );

    const upscaleId = response.sdUpscaleJob?.id;
    if (!upscaleId) {
      throw new Error("No upscale ID returned from Leonardo");
    }

    return upscaleId;
  }
}

// Export singleton instance
export const leonardoService = new LeonardoService();
