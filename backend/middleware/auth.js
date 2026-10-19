
import jwt from 'jsonwebtoken';
import db from '../db-mysql.js';

export const JWT_SECRET =
  process.env.JWT_SECRET || 'spendwise-secret-key-production-ready-2026';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token.' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}
