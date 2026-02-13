const { getAuth } = require('../config/firebase');

/**
 * Middleware: Verify Firebase ID token from Authorization header.
 * Attaches decoded token to req.user.
 */
async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    req.user = {
      uid: decoded.uid,
      username: decoded.username || decoded.name || decoded.uid,
      role: decoded.role || 'user',
    };
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware: Require admin role. Must be used after authenticateRequest.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticateRequest, requireAdmin };
