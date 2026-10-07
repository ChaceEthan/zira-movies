import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma/prisma';
import { authenticateUser, type AuthenticatedRequest } from '../auth';

const router = Router();
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_DAYS = 30;
const REFRESH_COOKIE = 'zira_refresh';

function issueAccessToken(user: { id: string; role: string }): string {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error('JWT_SECRET is not configured.');
	return jwt.sign({ role: user.role }, secret, { subject: user.id, expiresIn: ACCESS_TOKEN_TTL });
}

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

function refreshSecret(): string {
	const secret = process.env.JWT_REFRESH_SECRET;
	if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured.');
	return secret;
}

function refreshCookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: (process.env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
		path: '/api/auth',
		maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
	};
}

function readRefreshCookie(cookieHeader: string | undefined): string | undefined {
	for (const part of cookieHeader?.split(';') || []) {
		const [name, ...value] = part.trim().split('=');
		if (name === REFRESH_COOKIE) return decodeURIComponent(value.join('='));
	}
	return undefined;
}

async function issueSession(user: { id: string; role: string }, res: import('express').Response) {
	const refreshId = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
	const refreshToken = jwt.sign({ jti: refreshId }, refreshSecret(), { subject: user.id, expiresIn: `${REFRESH_TOKEN_DAYS}d` });
	await prisma.session.create({ data: { userId: user.id, sessionToken: hashToken(refreshId), expires } });
	res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
	return issueAccessToken(user);
}

function publicUser(user: { id: string; email: string; displayName: string; avatar: string | null; role: string; emailVerified: boolean; playbackPreference: string; notificationEmail: boolean; notificationPush: boolean; createdAt: Date }) {
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		avatar: user.avatar,
		role: user.role,
		emailVerified: user.emailVerified,
		playbackPreference: user.playbackPreference,
		notificationEmail: user.notificationEmail,
		notificationPush: user.notificationPush,
		createdAt: user.createdAt,
	};
}

router.post('/register', async (req, res, next) => {
	try {
		const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
		const password = typeof req.body.password === 'string' ? req.body.password : '';
		const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : '';

		if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 10 || displayName.length < 2 || displayName.length > 80) {
			res.status(400).json({ error: 'Provide a valid email, a password of at least 10 characters, and a display name.' });
			return;
		}

		const passwordHash = await bcrypt.hash(password, 12);
		const user = await prisma.user.create({ data: { email, passwordHash, displayName } });
		const token = await issueSession(user, res);
		res.status(201).json({ user: publicUser(user), token });
	} catch (error) {
		next(error);
	}
});

router.post('/login', async (req, res, next) => {
	try {
		const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
		const password = typeof req.body.password === 'string' ? req.body.password : '';
		const user = await prisma.user.findUnique({ where: { email } });
		if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
			res.status(401).json({ error: 'Invalid email or password.' });
			return;
		}
		const token = await issueSession(user, res);
		res.json({ user: publicUser(user), token });
	} catch (error) {
		next(error);
	}
});

router.post('/demo-login', (_req, res) => {
	res.status(404).json({ error: 'Demo sign-in is not available.' });
});

router.post('/refresh', async (req, res, next) => {
	try {
		const refreshToken = readRefreshCookie(req.headers.cookie);
		if (!refreshToken) {
			res.status(401).json({ error: 'Refresh session is unavailable.' });
			return;
		}
		const payload = jwt.verify(refreshToken, refreshSecret()) as jwt.JwtPayload;
		if (typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
			res.status(401).json({ error: 'Invalid refresh session.' });
			return;
		}
		const session = await prisma.session.findUnique({ where: { sessionToken: hashToken(payload.jti) } });
		if (!session || session.userId !== payload.sub || session.expires <= new Date()) {
			res.status(401).json({ error: 'Refresh session has expired.' });
			return;
		}
		const user = await prisma.user.findUnique({ where: { id: session.userId } });
		if (!user) {
			res.status(401).json({ error: 'Account no longer exists.' });
			return;
		}
		await prisma.session.delete({ where: { id: session.id } });
		const token = await issueSession(user, res);
		res.json({ user: publicUser(user), token });
	} catch (error) {
		if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
			res.status(401).json({ error: 'Refresh session is invalid or expired.' });
			return;
		}
		next(error);
	}
});

router.post('/logout', async (req, res, next) => {
	try {
		const refreshToken = readRefreshCookie(req.headers.cookie);
		if (refreshToken) {
			const payload = jwt.decode(refreshToken);
			if (payload && typeof payload !== 'string' && typeof payload.jti === 'string') {
				await prisma.session.deleteMany({ where: { sessionToken: hashToken(payload.jti) } });
			}
		}
		const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions();
		res.clearCookie(REFRESH_COOKIE, clearOptions);
		res.status(204).end();
	} catch (error) {
		next(error);
	}
});

router.get('/me', authenticateUser, async (req: AuthenticatedRequest, res, next) => {
	try {
		const user = await prisma.user.findUnique({ where: { id: req.auth!.userId } });
		if (!user) {
			res.status(401).json({ error: 'Account no longer exists.' });
			return;
		}
		res.json({ user: publicUser(user) });
	} catch (error) {
		next(error);
	}
});

export default router;
