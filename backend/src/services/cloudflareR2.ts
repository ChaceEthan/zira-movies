import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function getEnvConfig() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim().replace(/\/+$/, '');
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let cachedClientKey = '';
let cachedClient: S3Client | undefined;

function getS3Client(): S3Client | undefined {
  const { accountId, accessKeyId, secretAccessKey } = getEnvConfig();
  if (!accountId || !accessKeyId || !secretAccessKey) return undefined;
  const key = `${accountId}:${accessKeyId}:${secretAccessKey}`;
  if (cachedClient && cachedClientKey === key) {
    return cachedClient;
  }
  cachedClientKey = key;
  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function requireConfiguration(): { client: S3Client; bucket: string; publicUrl: string } {
  const { bucket, publicUrl } = getEnvConfig();
  const client = getS3Client();
  if (!client || !bucket || !publicUrl || !isHttpsUrl(publicUrl)) {
    throw new Error('Cloudflare R2 is not configured with a valid HTTPS public URL.');
  }
  return { client, bucket, publicUrl };
}

function publicObjectUrl(baseUrl: string, key: string): string {
  return `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export const r2Service = {
  isConfigured(): boolean {
    const { bucket, publicUrl } = getEnvConfig();
    const client = getS3Client();
    return Boolean(client && bucket && publicUrl && isHttpsUrl(publicUrl));
  },

  getMoviePath(
    movieId: string,
    category: 'poster' | 'backdrop' | 'trailer' | 'source' | 'hls' | 'subtitles',
    filename: string,
  ): string {
    return `movies/${movieId}/${category}/${filename}`;
  },

  getSeriesPath(seriesId: string, category: 'poster' | 'backdrop' | 'trailer', filename: string): string {
    return `series/${seriesId}/${category}/${filename}`;
  },

  getEpisodePath(
    seriesId: string,
    seasonNumber: number,
    episodeNumber: number,
    category: 'source' | 'hls' | 'subtitles' | 'thumbnail',
    filename: string,
  ): string {
    return `series/${seriesId}/season-${seasonNumber}/episode-${episodeNumber}/${category}/${filename}`;
  },

  getSponsorPath(sponsorId: string, campaignId: string, filename: string): string {
    return `sponsors/${sponsorId}/campaigns/${campaignId}/${filename}`;
  },

  extractObjectKeyFromUrl(urlOrKey: string | null | undefined): string | null {
    if (!urlOrKey || typeof urlOrKey !== 'string') return null;
    const trimmed = urlOrKey.trim();
    if (!trimmed || trimmed.startsWith('data:')) return null;
    const { publicUrl } = getEnvConfig();
    if (publicUrl && trimmed.startsWith(`${publicUrl}/`)) {
      const rawKey = trimmed.slice(publicUrl.length + 1);
      try {
        return rawKey.split('/').map(decodeURIComponent).join('/');
      } catch {
        return rawKey;
      }
    }
    if (/^(movies|series|sponsors)\/[a-zA-Z0-9._/-]+$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  },

  async uploadObject(key: string, body: Buffer, contentType: string): Promise<string> {
    const configuration = requireConfiguration();
    await configuration.client.send(
      new PutObjectCommand({ Bucket: configuration.bucket, Key: key, Body: body, ContentType: contentType }),
    );
    return publicObjectUrl(configuration.publicUrl, key);
  },

  async deleteObject(key: string): Promise<void> {
    const configuration = requireConfiguration();
    await configuration.client.send(new DeleteObjectCommand({ Bucket: configuration.bucket, Key: key }));
  },

  async createPresignedUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
    const configuration = requireConfiguration();
    const command = new PutObjectCommand({
      Bucket: configuration.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(configuration.client, command, { expiresIn });
  },

  getPublicUrl(key: string): string {
    const configuration = requireConfiguration();
    return publicObjectUrl(configuration.publicUrl, key);
  },
};
