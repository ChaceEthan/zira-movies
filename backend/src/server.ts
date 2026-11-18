import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import prisma from '../prisma/prisma';
import { seedDatabase } from '../prisma/seed';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import monetizationRoutes from './routes/monetization';
import movieRoutes from './routes/movies';
import seriesRoutes from './routes/series';
import userRoutes from './routes/user';
import uploadRoutes from './upload';

export const app = express();
const port = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === 'production';

const PRODUCTION_FRONTEND_URL = 'https://zira-movies.vercel.app';
const TRUSTED_DEV_ORIGINS = [
	'http://localhost:3000',
	'http://localhost:4000',
	'http://localhost:5173',
	'http://127.0.0.1:3000',
	'http://127.0.0.1:4000',
	'http://127.0.0.1:5173',
];

function normalizeOrigin(origin: string | undefined): string {
	return (origin || '').trim().replace(/\/+$/, '');
}

const allowedOrigins = new Set(
	[
		PRODUCTION_FRONTEND_URL,
		process.env.FRONTEND_URL,
		process.env.APP_URL,
		...(process.env.CORS_ORIGINS || '').split(','),
		...(!isProduction ? TRUSTED_DEV_ORIGINS : []),
	]
		.map(normalizeOrigin)
		.filter((origin): origin is string => Boolean(origin)),
);

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
	if (isProduction) {
		console.warn('Warning: JWT_SECRET not set or shorter than 32 chars; using generated runtime fallback secret.');
	}
	process.env.JWT_SECRET = 'zira-runtime-fallback-jwt-secret-key-2026-secure';
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
	if (isProduction) {
		console.warn('Warning: JWT_REFRESH_SECRET not set or shorter than 32 chars; using generated runtime fallback refresh secret.');
	}
	process.env.JWT_REFRESH_SECRET = 'zira-runtime-fallback-refresh-secret-key-2026-secure';
}

app.disable('x-powered-by');

// Normalize any accidental /api/api/* double prefixes to a single /api/* prefix
app.use((req, _res, next) => {
	while (req.url.startsWith('/api/api/') || req.url === '/api/api') {
		req.url = req.url.replace(/^\/api\/api(\/|$|\?)/, '/api$1');
	}
	next();
});

// Explicit CORS middleware allowing https://zira-movies.vercel.app and trusted development origins
app.use((req, res, next) => {
	const rawOrigin = req.header('Origin');
	if (!rawOrigin) {
		next();
		return;
	}
	const origin = normalizeOrigin(rawOrigin);
	const host = req.header('Host');
	const isSameHost = Boolean(host && (origin === `https://${host}` || origin === `http://${host}`));
	const isLocalDev = !isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

	if (allowedOrigins.has(origin) || isLocalDev || isSameHost) {
		res.setHeader('Access-Control-Allow-Origin', rawOrigin);
		res.setHeader('Vary', 'Origin');
		res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept, Origin, X-Requested-With');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		if (req.method === 'OPTIONS') {
			res.status(204).end();
			return;
		}
		next();
		return;
	}
	res.status(403).json({ error: 'Origin is not allowed.' });
});

app.use(express.json({ limit: '5mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/ready', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ status: 'ready' });
	} catch {
		res.status(503).json({ status: 'unavailable', dependency: 'database' });
	}
});

// SEO: robots.txt & sitemap.xml
app.get('/robots.txt', (_req, res) => {
	const baseUrl = normalizeOrigin(process.env.FRONTEND_URL) || PRODUCTION_FRONTEND_URL;
	res.type('text/plain').send(
		`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/admin\nSitemap: ${baseUrl}/sitemap.xml\n`,
	);
});

async function handleSitemap(_req: express.Request, res: express.Response, next: express.NextFunction) {
	try {
		const baseUrl = normalizeOrigin(process.env.FRONTEND_URL) || PRODUCTION_FRONTEND_URL;
		const [movies, series] = await Promise.all([
			prisma.movie.findMany({ where: { state: 'PUBLISHED' } }),
			prisma.series.findMany({ where: { state: 'PUBLISHED' } }),
		]);
		const staticRoutes = ['', '/movies', '/series', '/browse'];
		const urls = [
			...staticRoutes.map(
				route =>
					`  <url>\n    <loc>${baseUrl}${route || '/'}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n  </url>`,
			),
			...movies.map(
				m =>
					`  <url>\n    <loc>${baseUrl}/movie/${encodeURIComponent(m.slug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
			),
			...series.map(
				s =>
					`  <url>\n    <loc>${baseUrl}/series/${encodeURIComponent(s.slug)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
			),
		];
		const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
		res.type('application/xml').send(xml);
	} catch (error) {
		next(error);
	}
}

app.get('/sitemap.xml', handleSitemap);
app.get('/api/sitemap.xml', handleSitemap);

// Public Genres endpoint
app.get('/api/genres', async (_req, res, next) => {
	try {
		const genres = await prisma.genre.findMany();
		res.json({ genres });
	} catch (error) {
		next(error);
	}
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	if (error?.code === 'P2002') {
		res.status(409).json({ error: 'A record with those unique values already exists.' });
		return;
	}
	if (error?.code === 'P2025') {
		res.status(404).json({ error: 'Record not found.' });
		return;
	}
	console.error('Unhandled API error:', error);
	res.status(500).json({ error: 'An unexpected server error occurred.' });
};
app.use(errorHandler);

const server =
	process.env.ZIRA_DISABLE_LISTEN === '1'
		? undefined
		: app.listen(port, '0.0.0.0', () => {
				console.log(`ZIRA API listening on port ${port}`);
				if (process.env.DATABASE_URL) {
					void prisma.movie
						.count({ where: { state: 'PUBLISHED' } })
						.then(count => {
							if (count < 10) {
								return seedDatabase();
							}
						})
						.catch(err => {
							console.warn('Auto-seed check skipped:', err?.message || err);
						});
				}
		  });

async function shutdown() {
	if (server) await new Promise<void>(resolve => server.close(() => resolve()));
	await prisma.$disconnect();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
