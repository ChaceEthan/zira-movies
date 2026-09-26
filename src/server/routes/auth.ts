import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../../prisma/prisma';
import { authenticateUser, type AuthenticatedRequest } from '../../../auth';

const router = Router();
const TOKEN_TTL = '7d';

function issueToken(user: { id: string; role: string }): string {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error('JWT_SECRET is not configured.');
	return jwt.sign({ role: user.role }, secret, { subject: user.id, expiresIn: TOKEN_TTL });
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
		res.status(201).json({ user: publicUser(user), token: issueToken(user) });
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
		res.json({ user: publicUser(user), token: issueToken(user) });
	} catch (error) {
		next(error);
	}
});

router.post('/demo-login', (_req, res) => {
	res.status(404).json({ error: 'Demo sign-in is not available.' });
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
