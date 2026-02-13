const express = require('express');
const { authenticateRequest } = require('../middleware/auth');
const { getAuditLogs } = require('../services/auditService');

const router = express.Router();

// All audit log routes require authentication
router.use(authenticateRequest);

/**
 * GET /api/audit-logs - Get audit logs
 * Admin sees all logs; standard users see only their own actions.
 * Query params: action, targetId, userId (admin only), limit, startAfter
 */
router.get('/', async (req, res) => {
  try {
    const { action, targetId, userId, limit, startAfter } = req.query;

    const logs = await getAuditLogs({
      userId: req.user.uid,
      role: req.user.role,
      filters: {
        action: action || null,
        targetId: targetId || null,
        userId: userId || null,
      },
      limit: Math.min(parseInt(limit) || 50, 100),
      startAfter: startAfter || null,
    });

    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
