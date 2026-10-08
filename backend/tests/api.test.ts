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
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
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
    body: JSON.stringify({ enabled: true, zoneId: 'zone_1', tagCode: '<script src="https://evil.example/tag.js" data-zone="zone_1"></script>' }),
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
    body: JSON.stringify({ name: 'Test campaign', destinationUrl: 'https://sponsor.example', startDate: '2026-09-01', endDate: '2026-10-01', placement: 'HOME_BETWEEN_RAILS', agreedPrice: 'NaN', imageUrl: 'https://media.example/banner.jpg' }),
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
    body: JSON.stringify({ filename: 'poster.webp', contentType: 'image/webp', contentId: 'demo-movie', contentTypeCategory: 'movie_poster' }),
  });
  assert.equal(response.status, 503);
  const body = await response.json() as { error: string };
  assert.match(body.error, /not configured/i);
});
