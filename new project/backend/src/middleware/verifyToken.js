import * as auth from '../auth.js';

/**
 * Firebase bearer token auth. Sets req.user = { uid, email } on success.
 */
export async function verifyToken(req, res, next) {
  const header = req.headers.authorization ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = await auth.verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email ?? null };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
