export type VideoJobStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface VideoRendition {
  quality: '1080p' | '720p' | '480p' | '360p' | 'master.m3u8';
  url: string;
  bitrateKbps: number;
  resolution: string;
}

export interface VideoAssetJob {
  id: string;
  contentId: string;
  contentType: 'MOVIE' | 'EPISODE';
  sourceUrl: string;
  status: VideoJobStatus;
  progressPercent: number;
  renditions: VideoRendition[];
  hlsMasterUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

class VideoProcessingService {
  private jobs: Map<string, VideoAssetJob> = new Map();

  public createJob(contentId: string, contentType: 'MOVIE' | 'EPISODE', sourceUrl: string): VideoAssetJob {
    const jobId = `vjob_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: VideoAssetJob = {
      id: jobId,
      contentId,
      contentType,
      sourceUrl,
      status: 'QUEUED',
      progressPercent: 0,
      renditions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);
    
    // Simulate async background transcoding pipeline
    this.processJobAsync(jobId);

    return job;
  }

  private processJobAsync(jobId: string) {
    setTimeout(() => {
      const job = this.jobs.get(jobId);
      if (!job) return;

      job.status = 'PROCESSING';
      job.progressPercent = 25;
      job.updatedAt = new Date().toISOString();

      setTimeout(() => {
        job.progressPercent = 75;
        job.updatedAt = new Date().toISOString();

        setTimeout(() => {
          job.status = 'READY';
          job.progressPercent = 100;
          job.renditions = [
            { quality: '1080p', url: job.sourceUrl, bitrateKbps: 4500, resolution: '1920x1080' },
            { quality: '720p', url: job.sourceUrl, bitrateKbps: 2200, resolution: '1280x720' },
            { quality: '480p', url: job.sourceUrl, bitrateKbps: 1000, resolution: '854x480' },
            { quality: '360p', url: job.sourceUrl, bitrateKbps: 500, resolution: '640x360' },
            { quality: 'master.m3u8', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', bitrateKbps: 2500, resolution: 'Adaptive HLS' },
          ];
          job.hlsMasterUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
          job.updatedAt = new Date().toISOString();
        }, 800);
      }, 800);
    }, 400);
  }

  public getJob(jobId: string): VideoAssetJob | undefined {
    return this.jobs.get(jobId);
  }

  public getJobsForContent(contentId: string): VideoAssetJob[] {
    return Array.from(this.jobs.values()).filter(j => j.contentId === contentId);
  }

  public getAllJobs(): VideoAssetJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const videoProcessingService = new VideoProcessingService();
