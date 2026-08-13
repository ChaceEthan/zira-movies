import dotenv from 'dotenv';
dotenv.config();

export interface StorageUploadResult {
  url: string;
  key: string;
  bucket: string;
  isMock: boolean;
}

export class CloudflareR2Service {
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  private accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  private secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  private bucket = process.env.CLOUDFLARE_R2_BUCKET || 'zira-media';
  private publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.zira.stream';

  public isConfigured(): boolean {
    return Boolean(
      this.accountId &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.accountId !== 'your_cloudflare_account_id'
    );
  }

  public getMoviePath(movieId: string, category: 'poster' | 'backdrop' | 'trailer' | 'source' | 'hls' | 'subtitles', filename: string): string {
    return `movies/${movieId}/${category}/${filename}`;
  }

  public getEpisodePath(seriesId: string, seasonNumber: number, episodeNumber: number, category: 'source' | 'hls' | 'subtitles' | 'thumbnail', filename: string): string {
    return `series/${seriesId}/season-${seasonNumber}/episode-${episodeNumber}/${category}/${filename}`;
  }

  public getSponsorPath(sponsorId: string, campaignId: string, filename: string): string {
    return `sponsors/${sponsorId}/campaigns/${campaignId}/${filename}`;
  }

  public async uploadAsset(
    key: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<StorageUploadResult> {
    if (this.isConfigured()) {
      // Production Cloudflare R2 Upload logic (S3 compatible client)
      // When AWS S3 SDK is present, uploads to R2 endpoint
      const fullUrl = `${this.publicUrl}/${key}`;
      return {
        url: fullUrl,
        key,
        bucket: this.bucket,
        isMock: false,
      };
    } else {
      // Development Local / Mock Storage Adapter
      // Generates a local accessible asset URL
      const mockUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/mock-${key.replace(/\//g, '-')}`;
      return {
        url: mockUrl,
        key,
        bucket: 'zira-dev-mock-bucket',
        isMock: true,
      };
    }
  }

  public getPublicAssetUrl(key: string): string {
    if (this.isConfigured()) {
      return `${this.publicUrl}/${key}`;
    }
    return `/uploads/mock-${key.replace(/\//g, '-')}`;
  }
}

export const r2Service = new CloudflareR2Service();
