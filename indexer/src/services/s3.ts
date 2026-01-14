import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const getS3Client = (): S3Client => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION || "nyc3";
  const accessKeyId = process.env.S3_KEY;
  const secretAccessKey = process.env.S3_SECRET;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("S3_KEY and S3_SECRET are required");
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });
};

export class S3Service {
  private client: S3Client | null = null;

  private get bucket(): string {
    return process.env.S3_BUCKET || "";
  }

  private get publicUrl(): string {
    return process.env.S3_PUBLIC_URL || "";
  }

  private getClient(): S3Client {
    if (!this.client) {
      this.client = getS3Client();
    }
    return this.client;
  }

  async uploadFile(
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.bucket) {
      throw new Error("S3_BUCKET is required");
    }

    const client = this.getClient();

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return this.getPublicUrl(path);
  }

  async downloadFile(path: string): Promise<Buffer> {
    if (!this.bucket) {
      throw new Error("S3_BUCKET is required");
    }

    const client = this.getClient();

    const response = await client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: path,
      }),
    );

    if (!response.Body) {
      throw new Error(`No body in response for ${path}`);
    }

    const bytes = await response.Body.transformToByteArray();
    return Buffer.from(bytes);
  }

  getPublicUrl(path: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${path}`;
    }
    // Fallback to direct bucket URL
    const region = process.env.S3_REGION || "nyc3";
    return `https://${this.bucket}.${region}.digitaloceanspaces.com/${path}`;
  }
}

export const s3Service = new S3Service();
