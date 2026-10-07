# Cloudflare R2

Create an R2 bucket and an API token with only the required object read/write permissions. Configure these values in `backend/.env` or the backend deployment's secret manager:

```env
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=
```

`CLOUDFLARE_R2_PUBLIC_URL` must be an HTTPS base URL configured for public delivery. Credentials are never sent to the browser. The API creates signed PUT URLs after editor/admin authorization. With incomplete settings, uploads return an explicit service-unavailable response; no mock asset is claimed to exist.

Object keys are grouped under `movies/{id}/{poster|backdrop|source|subtitles}/`, `series/{id}/season-{n}/episode-{n}/{source|subtitles|thumbnail}/`, and `sponsors/{id}/campaigns/{id}/`. The bucket must allow the frontend origin to issue `PUT` requests with `Content-Type`; limit the allowed origins to the actual app domains.

R2 stores the uploaded source bytes and does not transcode them. A separate video processing service must create renditions/HLS playlists and those resulting keys must be recorded in the database before the player can offer them.
