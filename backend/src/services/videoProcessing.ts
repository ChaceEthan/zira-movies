export type VideoJobStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';
export type VideoQuality = '360p' | '480p' | '720p' | '1080p';

export interface VideoRendition {
  quality: VideoQuality;
  key: string;
  url: string;
  bitrateKbps?: number;
  width?: number;
  height?: number;
}

export interface HlsRendition {
  key: string;
  url: string;
}

export interface VideoProcessingResult {
  status: VideoJobStatus;
  renditions: VideoRendition[];
  hlsMaster?: HlsRendition;
  errorMessage?: string;
}

export interface VideoProcessingProvider {
  submit(input: { contentId: string; contentType: 'MOVIE' | 'EPISODE'; sourceKey: string }): Promise<VideoProcessingResult>;
}

export class VideoProcessingService {
  constructor(private readonly provider?: VideoProcessingProvider) {}

  public isConfigured(): boolean {
    return Boolean(this.provider);
  }

  public async submit(input: { contentId: string; contentType: 'MOVIE' | 'EPISODE'; sourceKey: string }): Promise<VideoProcessingResult> {
    if (!this.provider) {
      throw new Error('Video processing is not configured. R2 stores source media but does not transcode it.');
    }
    return this.provider.submit(input);
  }
}

export const videoProcessingService = new VideoProcessingService();
