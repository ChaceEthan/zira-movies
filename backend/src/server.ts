import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import prisma from '../prisma/prisma';
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
const allowedOrigins = new Set(
	[process.env.FRONTEND_URL, ...(process.env.CORS_ORIGINS || '').split(',')]
		.map(origin => origin?.trim())
		.filter((origin): origin is string => Boolean(origin)),
);

if (isProduction && (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || !process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32)) {
	throw new Error('Production requires DATABASE_URL and separate JWT secrets of at least 32 characters.');
}
if (isProduction && allowedOrigins.size === 0) {
	throw new Error('Production requires FRONTEND_URL or CORS_ORIGINS to be configured.');
}

app.disable('x-powered-by');
app.use((req, res, next) => {
	const origin = req.header('Origin');
	if (!origin) {
		next();
		return;
	}
	if (allowedOrigins.has(origin) || (!isProduction && /^http:\/\/localhost:\d+$/.test(origin))) {
		res.setHeader('Access-Control-Allow-Origin', origin);
		res.setHeader('Vary', 'Origin');
		res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
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
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/ready', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ status: 'ready' });
	} catch {
		res.status(503).json({ status: 'unavailable', dependency: 'database' });
	}
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/series', seriesRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

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

const server = process.env.ZIRA_DISABLE_LISTEN === '1'
	? undefined
	: app.listen(port, '0.0.0.0', () => {
		console.log(`ZIRA API listening on port ${port}`);
	});

async function shutdown() {
	if (server) await new Promise<void>(resolve => server.close(() => resolve()));
	await prisma.$disconnect();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
