const express = require('express');
const { authenticateRequest, requireAdmin } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  updateBoxAssignment,
  recordInventoryCheck,
} = require('../services/boxService');
const { writeAuditLog } = require('../services/auditService');

const router = express.Router();

// All box routes require authentication
router.use(authenticateRequest);

// Validation schemas
const createBoxSchema = {
  boxNumber: {
    required: true,
    type: 'string',
    validate: (val) => val.length >= 1 && val.length <= 50,
    message: 'Box number must be 1-50 characters',
  },
};

/**
 * GET /api/boxes - List medication boxes
 * Admin sees all; standard users see only their assigned boxes.
 */
router.get('/', async (req, res) => {
  try {
    const boxes = await getBoxes({
      userId: req.user.uid,
      role: req.user.role,
    });
    res.json(boxes);
  } catch (err) {
    console.error('Error fetching boxes:', err);
    res.status(500).json({ error: 'Failed to fetch medication boxes' });
  }
});

/**
 * GET /api/boxes/:id - Get a single box
 */
router.get('/:id', async (req, res) => {
  try {
    const box = await getBoxById(req.params.id);

    if (!box) {
      return res.status(404).json({ error: 'Box not found' });
    }

    // Standard users can only view assigned boxes
    if (req.user.role !== 'admin' && !box.assignedTo?.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(box);
  } catch (err) {
    console.error('Error fetching box:', err);
    res.status(500).json({ error: 'Failed to fetch medication box' });
  }
});

/**
 * POST /api/boxes - Create a new medication box
 */
router.post('/', validateBody(createBoxSchema), async (req, res) => {
  try {
    const box = await createBox({
      ...req.body,
      createdBy: req.user.uid,
    });

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'BOX_CREATE',
      targetType: 'medication-box',
      targetId: box.id,
      details: { boxNumber: box.boxNumber },
      ipAddress: req.ip,
    });

    res.status(201).json(box);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PUT /api/boxes/:id - Update a medication box
 */
router.put('/:id', async (req, res) => {
  try {
    const existing = await getBoxById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Box not found' });
    }

    // Standard users can only update assigned boxes
    if (req.user.role !== 'admin' && !existing.assignedTo?.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const box = await updateBox(req.params.id, req.body, req.user.uid);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'BOX_UPDATE',
      targetType: 'medication-box',
      targetId: req.params.id,
      details: { changes: Object.keys(req.body) },
      ipAddress: req.ip,
    });

    res.json(box);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/boxes/:id - Delete a medication box (admin only)
 */
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await getBoxById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Box not found' });
    }

    await deleteBox(req.params.id);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'BOX_DELETE',
      targetType: 'medication-box',
      targetId: req.params.id,
      details: { boxNumber: existing.boxNumber },
      ipAddress: req.ip,
    });

    res.json({ message: 'Box deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/boxes/:id/assign - Update box user assignments (admin only)
 */
router.post('/:id/assign', requireAdmin, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const result = await updateBoxAssignment(req.params.id, userIds);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'BOX_ASSIGN',
      targetType: 'medication-box',
      targetId: req.params.id,
      details: { assignedTo: userIds },
      ipAddress: req.ip,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/boxes/:id/inventory - Record an inventory check
 */
router.post('/:id/inventory', async (req, res) => {
  try {
    const existing = await getBoxById(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Box not found' });
    }

    // Standard users can only check assigned boxes
    if (req.user.role !== 'admin' && !existing.assignedTo?.includes(req.user.uid)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { medications } = req.body;

    if (!Array.isArray(medications)) {
      return res.status(400).json({ error: 'medications must be an array' });
    }

    const box = await recordInventoryCheck(req.params.id, medications, req.user.uid);

    await writeAuditLog({
      userId: req.user.uid,
      username: req.user.username,
      action: 'INVENTORY_CHECK',
      targetType: 'medication-box',
      targetId: req.params.id,
      details: { medicationCount: medications.length },
      ipAddress: req.ip,
    });

    res.json(box);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
