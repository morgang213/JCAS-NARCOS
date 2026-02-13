const express = require('express');
const { authenticateRequest, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  resetUserPin,
} = require('../services/authService');
const { writeAuditLog } = require('../services/auditService');

const router = express.Router();

// All user management routes require admin
router.use(authenticateRequest);
router.use(requireAdmin);

// Validation schemas
const createUserSchema = {
  username: {
    required: true,
    type: 'string',
    validate: (val) => /^[a-zA-Z0-9_]{2,30}$/.test(val),
    message: 'Username must be 2-30 alphanumeric characters or underscores',
  },
  pin: {
    required: true,
    type: 'string',
    validate: (val) => /^\d{4}$/.test(val),
    message: 'PIN must be exactly 4 digits',
  },
  displayName: {
    required: true,
    type: 'string',
    validate: (val) => val.length >= 1 && val.length <= 50,
    message: 'Display name must be 1-50 characters',
  },
  role: {
    required: true,
    type: 'string',
    validate: (val) => ['admin', 'user'].includes(val),
    message: 'Role must be "admin" or "user"',
  },
};

const updateRoleSchema = {
  role: {
    required: true,
    type: 'string',
    validate: (val) => ['admin', 'user'].includes(val),
    message: 'Role must be "admin" or "user"',
  },
};

const resetPinSchema = {
  pin: {
    required: true,
    type: 'string',
    validate: (val) => /^\d{4}$/.test(val),
    message: 'PIN must be exactly 4 digits',
  },
};

/**
 * POST /api/users - Create a new user
 */
router.post('/', validateBody(createUserSchema), async (req, res) => {
  try {
    const { username, pin, displayName, role } = req.body;

    const user = await createUser({
      username,
      pin,
      role,
      displayName,
      createdBy: req.user.uid,
    });

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'USER_CREATE',
      targetType: 'user',
      targetId: user.id,
      details: { newUsername: username, role },
      ipAddress: req.ip,
    });

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/users - List all active users
 */
router.get('/', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id - Get a single user
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/users/:id/role - Update user role
 */
router.put('/:id/role', validateBody(updateRoleSchema), async (req, res) => {
  try {
    const result = await updateUserRole(req.params.id, req.body.role);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'USER_ROLE_CHANGE',
      targetType: 'user',
      targetId: req.params.id,
      details: { newRole: req.body.role },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/users/:id/reset-pin - Reset user PIN
 */
router.put('/:id/reset-pin', validateBody(resetPinSchema), async (req, res) => {
  try {
    const result = await resetUserPin(req.params.id, req.body.pin);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'USER_PIN_RESET',
      targetType: 'user',
      targetId: req.params.id,
      details: {},
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/users/:id - Deactivate a user (soft delete)
 */
router.delete('/:id', async (req, res) => {
  try {
    // Prevent self-deactivation
    if (req.params.id === req.user.uid) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const result = await deactivateUser(req.params.id);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'USER_DELETE',
      targetType: 'user',
      targetId: req.params.id,
      details: {},
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
