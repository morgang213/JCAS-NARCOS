const { getFirestore } = require('../config/firebase');

const AUDIT_COLLECTION = 'audit-logs';

/**
 * Write an audit log entry. Only called server-side (Admin SDK).
 */
async function writeAuditLog({
  userId,
  username,
  action,
  targetType,
  targetId,
  details = {},
  ipAddress = '',
  success = true,
}) {
  const db = getFirestore();

  const entry = {
    userId,
    username,
    action,
    targetType,
    targetId: targetId || null,
    details,
    ipAddress,
    success,
    timestamp: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection(AUDIT_COLLECTION).add(entry);
  return docRef.id;
}

/**
 * Get audit logs with optional filters.
 * Admin sees all; standard users filtered to their own actions.
 */
async function getAuditLogs({ userId, role, filters = {}, limit = 50, startAfter = null }) {
  const db = getFirestore();
  let query = db.collection(AUDIT_COLLECTION);

  // Standard users can only see their own logs
  if (role !== 'admin') {
    query = query.where('userId', '==', userId);
  }

  // Apply filters
  if (filters.action) {
    query = query.where('action', '==', filters.action);
  }
  if (filters.targetId) {
    query = query.where('targetId', '==', filters.targetId);
  }
  if (filters.userId && role === 'admin') {
    query = query.where('userId', '==', filters.userId);
  }

  // Order and paginate
  query = query.orderBy('timestamp', 'desc').limit(limit);

  if (startAfter) {
    const startDoc = await db.collection(AUDIT_COLLECTION).doc(startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
  }));
}

module.exports = { writeAuditLog, getAuditLogs };
