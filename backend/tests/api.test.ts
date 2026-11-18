import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.ZIRA_DISABLE_LISTEN = '1';
process.env.JWT_SECRET = 'zira-local-api-test-secret-not-for-production';
process.env.MONETAG_ALLOWED_SCRIPT_ORIGINS = 'https://tag.monetag.test';
process.env.CLOUDFLARE_ACCOUNT_ID = '';
process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = '';
process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = '';
process.env.CLOUDFLARE_R2_BUCKET = '';
process.env.CLOUDFLARE_R2_PUBLIC_URL = '';

type ExpressApp = typeof import('../src/server').app;
let app: ExpressApp;
let editorToken: string;
let adminToken: string;
let server: ReturnType<ExpressApp['listen']>;
let baseUrl: string;

before(async () => {
  app = (await import('../src/server.js')).app;
  editorToken = jwt.sign({ role: 'EDITOR' }, process.env.JWT_SECRET!, { subject: 'test-editor' });
  adminToken = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET!, { subject: 'test-admin' });
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
});

test('health endpoint responds without a database query', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('CORS preflight allows the local Vite origin and authorization header', async () => {
  const response = await fetch(`${baseUrl}/api/movies`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:3000', 'Access-Control-Request-Method': 'GET' },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  assert.match(response.headers.get('access-control-allow-headers') || '', /Authorization/i);
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});

test('CORS rejects origins outside the configured development allowlist', async () => {
  const response = await fetch(`${baseUrl}/api/movies`, { headers: { Origin: 'https://untrusted.example' } });
  assert.equal(response.status, 403);
});

test('user and admin routes reject requests without authentication', async () => {
  const userResponse = await fetch(`${baseUrl}/api/user/watchlist`);
  const adminResponse = await fetch(`${baseUrl}/api/admin/metrics`);
  assert.equal(userResponse.status, 401);
  assert.equal(adminResponse.status, 401);
});

test('refresh requires the HttpOnly refresh session cookie', async () => {
  const response = await fetch(`${baseUrl}/api/auth/refresh`, { method: 'POST' });
  assert.equal(response.status, 401);
});

test('logout clears a refresh cookie without requiring an access token', async () => {
  const response = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST' });
  assert.equal(response.status, 204);
  assert.match(response.headers.get('set-cookie') || '', /zira_refresh=;/);
});

test('admin routes reject an authenticated editor role', async () => {
  const response = await fetch(`${baseUrl}/api/admin/metrics`, { headers: { Authorization: `Bearer ${editorToken}` } });
  assert.equal(response.status, 403);
});

test('movie create validates required fields before database access', async () => {
  const response = await fetch(`${baseUrl}/api/movies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', description: '', releaseYear: 'bad', durationMinutes: 0 }),
  });
  assert.equal(response.status, 400);
});

test('series create validates required fields before database access', async () => {
  const response = await fetch(`${baseUrl}/api/series`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '', description: '', releaseYear: 'bad' }),
  });
  assert.equal(response.status, 400);
});

test('series publication rejects invalid states before database access', async () => {
  const response = await fetch(`${baseUrl}/api/series/demo-series/state`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: 'PENDING_VERIFICATION' }),
  });
  assert.equal(response.status, 400);
});

test('Monetag placement rejects unknown placement values', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/monetag/placement?placement=NOT_A_PLACEMENT`);
  assert.equal(response.status, 400);
});

test('click tracking rejects missing and invalid campaign data', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/track-click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignId: '', type: 'UNKNOWN' }),
  });
  assert.equal(response.status, 400);
});

test('Monetag cannot be enabled without an allowlisted publisher tag and zone ID', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/monetag/placements/HOME_BETWEEN_RAILS`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: true }),
  });
  assert.equal(response.status, 400);
});

test('Monetag rejects publisher scripts outside the configured HTTPS origin allowlist', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/monetag/placements/HOME_BETWEEN_RAILS`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: true,
      zoneId: 'zone_1',
      tagCode: '<script src="https://evil.example/tag.js" data-zone="zone_1"></script>',
    }),
  });
  assert.equal(response.status, 400);
});

test('sponsor creation rejects invalid public URLs before database access', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/sponsors`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Sponsor', websiteUrl: 'javascript:alert(1)' }),
  });
  assert.equal(response.status, 400);
});

test('sponsor campaign rejects malformed contracted amounts', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/sponsors/test-sponsor/campaigns`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test campaign',
      destinationUrl: 'https://sponsor.example',
      startDate: '2026-09-01',
      endDate: '2026-10-01',
      placement: 'HOME_BETWEEN_RAILS',
      agreedPrice: 'NaN',
      imageUrl: 'https://media.example/banner.jpg',
    }),
  });
  assert.equal(response.status, 400);
});

test('affiliate conversion requires an external reference', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/affiliate/campaigns/test-campaign/conversions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ commissionRevenue: 4.5 }),
  });
  assert.equal(response.status, 400);
});

test('affiliate conversion rejects malformed commission amounts', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/affiliate/campaigns/test-campaign/conversions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalReference: 'partner-ref-1', commissionRevenue: 'NaN' }),
  });
  assert.equal(response.status, 400);
});

test('sponsor administration remains protected', async () => {
  const response = await fetch(`${baseUrl}/api/monetization/sponsors`);
  assert.equal(response.status, 401);
});

test('uploads are explicitly disabled when R2 credentials are absent', async () => {
  const response = await fetch(`${baseUrl}/api/upload/presigned-url`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: 'poster.webp',
      contentType: 'image/webp',
      contentId: 'demo-movie',
      contentTypeCategory: 'movie_poster',
    }),
  });
  assert.equal(response.status, 503);
  const body = (await response.json()) as { error: string };
  assert.match(body.error, /not configured/i);
});

test('public catalog returns 5 published open-licensed demo movies and admin catalog returns all 6 demo movies', async () => {
  const [moviesRes, seriesRes, adminCatalogRes] = await Promise.all([
    fetch(`${baseUrl}/api/movies`),
    fetch(`${baseUrl}/api/series`),
    fetch(`${baseUrl}/api/admin/catalog`, { headers: { Authorization: `Bearer ${adminToken}` } }),
  ]);
  assert.equal(moviesRes.status, 200);
  assert.equal(seriesRes.status, 200);
  assert.equal(adminCatalogRes.status, 200);
  const moviesData = (await moviesRes.json()) as { movies: Array<{ slug: string; state: string }> };
  const seriesData = (await seriesRes.json()) as { series: unknown[] };
  const adminData = (await adminCatalogRes.json()) as { movies: Array<{ slug: string; state: string }> };

  assert.equal(moviesData.movies.length, 5);
  assert.equal(seriesData.series.length, 2);
  assert.equal(adminData.movies.length, 6);
  const draftDemo = adminData.movies.find(m => m.slug === 'kigali-horizon-demo');
  assert.ok(draftDemo);
  assert.equal(draftDemo.state, 'DRAFT');
});

test('movie upload workflow enforces rights verification before publishing and supports archive and permanent delete', async () => {
  // 1. Rejects publishing a movie with PENDING_VERIFICATION rights
  const blockedPublishRes = await fetch(`${baseUrl}/api/movies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unverified Submission',
      slug: 'unverified-submission',
      description: 'Test movie with pending rights verification',
      releaseYear: 2026,
      durationMinutes: 95,
      rightsStatus: 'PENDING_VERIFICATION',
      state: 'PUBLISHED',
    }),
  });
  assert.equal(blockedPublishRes.status, 409);

  // 2. Creates movie with full metadata, R2 media URLs, subtitles, and verified rights
  const createRes = await fetch(`${baseUrl}/api/movies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Spring Open Short',
      slug: 'spring-open-short',
      description: 'Poetic open-licensed fantasy short by Blender Studio.',
      releaseYear: 2019,
      durationMinutes: 8,
      maturityRating: 'G',
      language: 'English',
      territories: ['GLOBAL', 'RW'],
      subtitlesAvailable: ['en', 'rw', 'fr'],
      genres: ['animation', 'fantasy'],
      posterUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg',
      backdropUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Big.Buck.Bunny.-.Opening.Screen.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      rightsStatus: 'LICENSED',
      rightsHolder: 'Blender Studio (CC-BY 4.0)',
      licenseReference: 'CC-BY-4.0-BLENDER-SPRING',
      state: 'PUBLISHED',
      isFeatured: true,
    }),
  });
  assert.equal(createRes.status, 201);
  const createdData = (await createRes.json()) as { movie: { id: string; slug: string; state: string; rights?: { licenseReference?: string } } };
  assert.equal(createdData.movie.slug, 'spring-open-short');
  assert.equal(createdData.movie.state, 'PUBLISHED');
  assert.equal(createdData.movie.rights?.licenseReference, 'CC-BY-4.0-BLENDER-SPRING');

  const movieId = createdData.movie.id;

  // 3. Soft-delete (Archive) hides movie from public catalog while preserving record in Admin Console
  const archiveRes = await fetch(`${baseUrl}/api/movies/${movieId}?mode=archive`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  assert.equal(archiveRes.status, 200);
  const archiveBody = (await archiveRes.json()) as { mode: string; movie: { state: string } };
  assert.equal(archiveBody.mode, 'archive');
  assert.equal(archiveBody.movie.state, 'ARCHIVED');

  const publicLookup = await fetch(`${baseUrl}/api/movies/slug/spring-open-short`);
  assert.equal(publicLookup.status, 404);

  // 4. Permanent deletion requires ADMIN or SUPER_ADMIN (rejects EDITOR with 403)
  const editorPermDelete = await fetch(`${baseUrl}/api/movies/${movieId}?mode=permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${editorToken}` },
  });
  assert.equal(editorPermDelete.status, 403);

  // 5. ADMIN permanently deletes the movie and records audit log
  const adminPermDelete = await fetch(`${baseUrl}/api/movies/${movieId}?mode=permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminPermDelete.status, 200);

  const metricsRes = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const metricsData = (await metricsRes.json()) as { auditLogs: Array<{ action: string; entityId: string }> };
  assert.ok(metricsData.auditLogs.some(log => log.action === 'ARCHIVE_MOVIE' && log.entityId === movieId));
  assert.ok(metricsData.auditLogs.some(log => log.action === 'DELETE_MOVIE' && log.entityId === movieId));
});

test('initial administrator bootstrap creates SUPER_ADMIN once and blocks subsequent unauthenticated bootstrap attempts', async () => {
  const statusBefore = (await (await fetch(`${baseUrl}/api/auth/admin-status`)).json()) as {
    hasAdmin: boolean;
    bootstrapAvailable: boolean;
  };
  assert.equal(statusBefore.bootstrapAvailable, true);

  const bootRes = await fetch(`${baseUrl}/api/auth/bootstrap-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@zira.com',
      displayName: 'ZIRA Owner',
      password: 'StrongOwnerPassword2026!',
    }),
  });
  assert.equal(bootRes.status, 201);
  const bootData = (await bootRes.json()) as { user: { role: string }; token: string };
  assert.equal(bootData.user.role, 'SUPER_ADMIN');
  assert.ok(bootData.token);

  const secondBootRes = await fetch(`${baseUrl}/api/auth/bootstrap-admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'intruder@zira.com',
      displayName: 'Intruder',
      password: 'IntruderPassword2026!',
    }),
  });
  assert.equal(secondBootRes.status, 403);
});

test('interpreter profiles API returns seeded illustrative profiles with content counts and supports admin creation', async () => {
  const listRes = await fetch(`${baseUrl}/api/interpreters`);
  assert.equal(listRes.status, 200);
  const listData = (await listRes.json()) as {
    interpreters: Array<{ displayName: string; slug: string; isExampleProfile: boolean; totalContentCount: number }>;
  };
  assert.ok(listData.interpreters.length >= 7);
  const rocky = listData.interpreters.find(i => i.slug === 'rocky');
  assert.ok(rocky);
  assert.equal(rocky.displayName, 'Rocky');
  assert.equal(rocky.isExampleProfile, true);
  assert.ok(rocky.totalContentCount >= 1);

  const profileRes = await fetch(`${baseUrl}/api/interpreters/rocky`);
  assert.equal(profileRes.status, 200);
  const profileData = (await profileRes.json()) as {
    interpreter: { slug: string; publishedMovies: unknown[]; totalContentCount: number };
  };
  assert.equal(profileData.interpreter.slug, 'rocky');
  assert.ok(Array.isArray(profileData.interpreter.publishedMovies));

  const createRes = await fetch(`${baseUrl}/api/interpreters`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Yanga Classic',
      slug: 'yanga-classic',
      biography: 'Authorized Kinyarwanda film narrator profile.',
      isFeatured: true,
    }),
  });
  assert.equal(createRes.status, 201);
});

test('VIP membership API guarantees free viewing, allows admin benefit configuration, and never fakes payment success', async () => {
  const getRes = await fetch(`${baseUrl}/api/vip`);
  assert.equal(getRes.status, 200);
  const getData = (await getRes.json()) as {
    freeViewingGuaranteed: boolean;
    paymentGatewayConfigured: boolean;
    vipConfig: { benefits: Array<{ id: string; enabled: boolean }>; plans: Array<{ id: string; priceRwf: number }> };
  };
  assert.equal(getData.freeViewingGuaranteed, true);
  assert.equal(getData.paymentGatewayConfigured, false);
  assert.ok(getData.vipConfig.benefits.length >= 5);
  assert.ok(getData.vipConfig.plans.length >= 3);

  const checkoutRes = await fetch(`${baseUrl}/api/vip/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: 'vip-monthly', paymentMethod: 'MTN_MOMO' }),
  });
  assert.equal(checkoutRes.status, 503);
  const checkoutBody = (await checkoutRes.json()) as { verifiedPayment: boolean };
  assert.equal(checkoutBody.verifiedPayment, false);
});

test('movie upload blocks publication when only narrator permission is checked without underlying film rights', async () => {
  const res = await fetch(`${baseUrl}/api/movies`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Narration Only Test Film',
      slug: 'narration-only-test-film',
      description: 'Testing that narrator permission alone cannot publish an unlicensed underlying film.',
      releaseYear: 2026,
      durationMinutes: 90,
      rightsStatus: 'LICENSED',
      narrationPermissionOnly: true,
      state: 'PUBLISHED',
    }),
  });
  assert.equal(res.status, 409);
  const body = (await res.json()) as { error: string };
  assert.match(body.error, /narration/i);
});

