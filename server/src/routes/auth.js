const express = require('express');
const rateLimit = require('express-rate-limit');
const { validateLogin } = require('../services/authService');
const { writeAuditLog } = require('../services/auditService');
const { validateBody } = require('../middleware/validate');

const router = express.Router();

// Auth-specific rate limiter: 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts from this IP. Try again later.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation schema for login
const loginSchema = {
  username: {
    required: true,
    type: 'string',
    validate: (val) => val.length >= 2 && val.length <= 30,
    message: 'Username must be 2-30 characters',
  },
  pin: {
    required: true,
    type: 'string',
    validate: (val) => /^\d{4}$/.test(val),
    message: 'PIN must be exactly 4 digits',
  },
};

/**
 * POST /api/auth/login
 * Authenticate user with username + 4-digit PIN
 */
router.post('/login', authLimiter, validateBody(loginSchema), async (req, res) => {
  const { username, pin } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    const { user, customToken } = await validateLogin(username, pin);

    // Log successful login
    await writeAuditLog({
      userId: user.id,
      username: user.username,
      action: 'LOGIN',
      targetType: 'user',
      targetId: user.id,
      details: { method: 'pin' },
      ipAddress,
      success: true,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
      customToken,
    });
  } catch (err) {
    // Log failed login attempt
    await writeAuditLog({
      userId: username.toLowerCase(),
      username: username.toLowerCase(),
      action: 'LOGIN_FAILED',
      targetType: 'user',
      targetId: username.toLowerCase(),
      details: { reason: err.message },
      ipAddress,
      success: false,
    }).catch(() => {}); // Don't fail the response if audit logging fails

    res.status(401).json({ error: err.message });
  }
});

module.exports = router;
