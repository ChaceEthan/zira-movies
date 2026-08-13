# Cloudflare R2 Storage Setup Guide

To configure Cloudflare R2 object storage for video files, posters, and trailers:

1. Log into the Cloudflare Dashboard and navigate to **R2 Storage**.
2. Create a new bucket named `zira-media`.
3. Generate API tokens with **Object Read & Write** permissions.
4. Set the following environment variables in `.env`:
   ```env
   CLOUDFLARE_ACCOUNT_ID="your_account_id"
   CLOUDFLARE_R2_ACCESS_KEY_ID="your_access_key"
   CLOUDFLARE_R2_SECRET_ACCESS_KEY="your_secret_key"
   CLOUDFLARE_R2_BUCKET="zira-media"
   CLOUDFLARE_R2_PUBLIC_URL="https://media.zira.stream"
   ```
5. Structure for uploads:
   - `movies/{movieId}/poster/`
   - `movies/{movieId}/backdrop/`
   - `movies/{movieId}/source/`
   - `series/{seriesId}/season-{season}/episode-{ep}/source/`
