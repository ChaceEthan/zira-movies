import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/+$/, '');

const client = accountId && accessKeyId && secretAccessKey
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : undefined;

function requireConfiguration(): { client: S3Client; bucket: string; publicUrl: string } {
  if (!client || !bucket || !publicUrl || !isHttpsUrl(publicUrl)) throw new Error('Cloudflare R2 is not configured with a valid HTTPS public URL.');
  return { client, bucket, publicUrl };
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function publicObjectUrl(baseUrl: string, key: string): string {
  return `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export const r2Service = {
  isConfigured(): boolean {
    return Boolean(client && bucket && publicUrl && isHttpsUrl(publicUrl));
  },

  getMoviePath(movieId: string, category: 'poster' | 'backdrop' | 'trailer' | 'source' | 'hls' | 'subtitles', filename: string): string {
    return `movies/${movieId}/${category}/${filename}`;
  },

  getSeriesPath(seriesId: string, category: 'poster' | 'backdrop' | 'trailer', filename: string): string {
    return `series/${seriesId}/${category}/${filename}`;
  },

  getEpisodePath(seriesId: string, seasonNumber: number, episodeNumber: number, category: 'source' | 'hls' | 'subtitles' | 'thumbnail', filename: string): string {
    return `series/${seriesId}/season-${seasonNumber}/episode-${episodeNumber}/${category}/${filename}`;
  },

  getSponsorPath(sponsorId: string, campaignId: string, filename: string): string {
    return `sponsors/${sponsorId}/campaigns/${campaignId}/${filename}`;
  },

  async uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
    const configuration = requireConfiguration();
    await configuration.client.send(new PutObjectCommand({ Bucket: configuration.bucket, Key: key, Body: body, ContentType: contentType }));
    return publicObjectUrl(configuration.publicUrl, key);
  },

  async deleteObject(key: string): Promise<void> {
    const configuration = requireConfiguration();
    await configuration.client.send(new DeleteObjectCommand({ Bucket: configuration.bucket, Key: key }));
  },

  async createPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const configuration = requireConfiguration();
    const command = new PutObjectCommand({ Bucket: configuration.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(configuration.client, command, { expiresIn });
  },

  getPublicUrl(key: string): string {
    const configuration = requireConfiguration();
    return publicObjectUrl(configuration.publicUrl, key);
  },
};
