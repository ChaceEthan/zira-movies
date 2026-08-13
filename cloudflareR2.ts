import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

dotenv.config();

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const CLOUDFLARE_R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const CLOUDFLARE_R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET;
const CLOUDFLARE_R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

let s3Client: S3Client | undefined;

if (CLOUDFLARE_R2_ACCESS_KEY_ID && CLOUDFLARE_R2_SECRET_ACCESS_KEY && CLOUDFLARE_ACCOUNT_ID) {
  s3Client = new S3Client({
    region: "auto", // R2 uses 'auto' for region
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn("Cloudflare R2 credentials not fully configured. R2 operations will be mocked or fail.");
}

export const r2Service = {
  isConfigured(): boolean {
    return !!s3Client;
  },

  // Helper to generate R2 object keys based on content type
  getMoviePath(movieId: string, type: 'poster' | 'backdrop' | 'video' | 'subtitle', filename: string): string {
    return `movies/${movieId}/${type}/${filename}`;
  },

  getSeriesPath(seriesId: string, type: 'poster' | 'backdrop', filename: string): string {
    return `series/${seriesId}/${type}/${filename}`;
  },

  getEpisodePath(seriesId: string, seasonNumber: number, episodeNumber: number, type: 'video' | 'thumbnail' | 'subtitle', filename: string): string {
    return `series/${seriesId}/season-${seasonNumber}/episode-${episodeNumber}/${type}/${filename}`;
  },

  /**
   * Uploads an object to R2.
   * @param key The object key (path/filename) in the bucket.
   * @param body The content to upload (Buffer, Readable, etc.).
   * @param contentType The MIME type of the content.
   */
  async uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!s3Client || !CLOUDFLARE_R2_BUCKET) {
      console.error("R2 not configured. Cannot upload object.");
      throw new Error("Cloudflare R2 service is not configured.");
    }

    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return this.getPublicUrl(key);
  },

  /**
   * Deletes an object from R2.
   * @param key The object key to delete.
   */
  async deleteObject(key: string): Promise<void> {
    if (!s3Client || !CLOUDFLARE_R2_BUCKET) {
      console.error("R2 not configured. Cannot delete object.");
      throw new Error("Cloudflare R2 service is not configured.");
    }

    const command = new DeleteObjectCommand({
      Bucket: CLOUDFLARE_R2_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
  },

  /**
   * Generates a pre-signed URL for uploading an object to R2.
   * @param key The object key (path/filename) in the bucket.
   * @param contentType The MIME type of the content to be uploaded.
   * @param expiresIn The URL expiration time in seconds (default: 1 hour).
   */
  async createPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600): Promise<string> {
    if (!s3Client || !CLOUDFLARE_R2_BUCKET) {
      console.error("R2 not configured. Cannot create pre-signed URL.");
      throw new Error("Cloudflare R2 service is not configured.");
    }

    const command = new PutObjectCommand({ Bucket: CLOUDFLARE_R2_BUCKET, Key: key, ContentType: contentType });
    return getSignedUrl(s3Client, command, { expiresIn });
  },

  getPublicUrl(key: string): string {
    if (!CLOUDFLARE_R2_PUBLIC_URL) {
      console.warn("CLOUDFLARE_R2_PUBLIC_URL is not set. Returning a generic R2 path.");
      return `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${CLOUDFLARE_R2_BUCKET}/${key}`;
    }
    return `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
  },
};