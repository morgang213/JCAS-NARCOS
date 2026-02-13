const { getFirestore } = require('../config/firebase');
const admin = require('firebase-admin');

const BOXES_COLLECTION = 'medication-boxes';

/**
 * Create a new medication box.
 */
async function createBox({ boxNumber, description, location, medications = [], createdBy }) {
  const db = getFirestore();

  // Check for duplicate box number
  const existing = await db
    .collection(BOXES_COLLECTION)
    .where('boxNumber', '==', boxNumber)
    .get();

  if (!existing.empty) {
    throw new Error(`Box number "${boxNumber}" already exists`);
  }

  const boxData = {
    boxNumber,
    description: description || '',
    location: location || '',
    medications: medications.map((med) => ({
      name: med.name,
      quantity: med.quantity || 0,
      unit: med.unit || 'units',
      expirationDate: med.expirationDate || null,
      lotNumber: med.lotNumber || '',
      controlledSubstance: med.controlledSubstance || false,
      schedule: med.schedule || '',
    })),
    assignedTo: [],
    status: 'active',
    lastInventoryDate: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: createdBy,
  };

  const docRef = await db.collection(BOXES_COLLECTION).add(boxData);
  return { id: docRef.id, ...boxData };
}

/**
 * Get all boxes. Admin sees all; users see only assigned boxes.
 */
async function getBoxes({ userId, role }) {
  const db = getFirestore();
  let query = db.collection(BOXES_COLLECTION);

  if (role !== 'admin') {
    query = query.where('assignedTo', 'array-contains', userId);
  }

  const snapshot = await query.orderBy('boxNumber').get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
    lastInventoryDate: doc.data().lastInventoryDate?.toDate?.()?.toISOString() || null,
  }));
}

/**
 * Get a single box by ID.
 */
async function getBoxById(boxId) {
  const db = getFirestore();
  const doc = await db.collection(BOXES_COLLECTION).doc(boxId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    lastInventoryDate: data.lastInventoryDate?.toDate?.()?.toISOString() || null,
  };
}

/**
 * Update a medication box.
 */
async function updateBox(boxId, updates, updatedBy) {
  const db = getFirestore();
  const boxRef = db.collection(BOXES_COLLECTION).doc(boxId);
  const boxDoc = await boxRef.get();

  if (!boxDoc.exists) {
    throw new Error('Box not found');
  }

  const updateData = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy,
  };

  // Only allow specific fields to be updated
  const allowedFields = [
    'boxNumber',
    'description',
    'location',
    'medications',
    'status',
    'lastInventoryDate',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateData[field] = updates[field];
    }
  }

  await boxRef.update(updateData);

  const updated = await boxRef.get();
  const data = updated.data();
  return {
    id: boxId,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    lastInventoryDate: data.lastInventoryDate?.toDate?.()?.toISOString() || null,
  };
}

/**
 * Delete a medication box (admin only).
 */
async function deleteBox(boxId) {
  const db = getFirestore();
  const boxRef = db.collection(BOXES_COLLECTION).doc(boxId);
  const boxDoc = await boxRef.get();

  if (!boxDoc.exists) {
    throw new Error('Box not found');
  }

  await boxRef.delete();
  return { id: boxId, deleted: true };
}

/**
 * Assign/unassign users to a box (admin only).
 */
async function updateBoxAssignment(boxId, userIds) {
  const db = getFirestore();
  const boxRef = db.collection(BOXES_COLLECTION).doc(boxId);
  const boxDoc = await boxRef.get();

  if (!boxDoc.exists) {
    throw new Error('Box not found');
  }

  await boxRef.update({
    assignedTo: userIds,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: boxId, assignedTo: userIds };
}

/**
 * Record an inventory check on a box.
 */
async function recordInventoryCheck(boxId, medications, checkedBy) {
  const db = getFirestore();
  const boxRef = db.collection(BOXES_COLLECTION).doc(boxId);
  const boxDoc = await boxRef.get();

  if (!boxDoc.exists) {
    throw new Error('Box not found');
  }

  await boxRef.update({
    medications,
    lastInventoryDate: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: checkedBy,
  });

  const updated = await boxRef.get();
  const data = updated.data();
  return {
    id: boxId,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    lastInventoryDate: data.lastInventoryDate?.toDate?.()?.toISOString() || null,
  };
}

module.exports = {
  createBox,
  getBoxes,
  getBoxById,
  updateBox,
  deleteBox,
  updateBoxAssignment,
  recordInventoryCheck,
};
