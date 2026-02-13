const bcrypt = require('bcrypt');
const { getFirestore, getAuth } = require('../config/firebase');
const admin = require('firebase-admin');

const USERS_COLLECTION = 'users';
const SALT_ROUNDS = 12;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Create a new user with a hashed PIN.
 */
async function createUser({ username, pin, role = 'user', displayName, createdBy }) {
  const db = getFirestore();

  // Check username uniqueness
  const existing = await db
    .collection(USERS_COLLECTION)
    .where('username', '==', username.toLowerCase())
    .get();

  if (!existing.empty) {
    throw new Error('Username already exists');
  }

  // Hash the PIN
  const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);

  // Create Firebase Auth user
  const uid = username.toLowerCase();
  try {
    await getAuth().createUser({
      uid,
      displayName: displayName || username,
    });
  } catch (err) {
    // User might already exist in Auth
    if (err.code !== 'auth/uid-already-exists') {
      throw err;
    }
  }

  // Set custom claims (role)
  await getAuth().setCustomUserClaims(uid, { role, username: username.toLowerCase() });

  // Create Firestore user document
  const userData = {
    username: username.toLowerCase(),
    displayName: displayName || username,
    hashedPin,
    role,
    failedAttempts: 0,
    lastFailedAt: null,
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: createdBy || 'system',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection(USERS_COLLECTION).doc(uid).set(userData);

  // Return user info (without hashedPin)
  const { hashedPin: _, ...safeUser } = userData;
  return { id: uid, ...safeUser };
}

/**
 * Validate a login attempt. Returns { user, customToken } on success.
 */
async function validateLogin(username, pin) {
  const db = getFirestore();
  const uid = username.toLowerCase();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('Invalid username or PIN');
  }

  const userData = userDoc.data();

  // Check if user is active
  if (!userData.isActive) {
    throw new Error('Account is disabled. Contact an administrator.');
  }

  // Check account lockout
  if (userData.failedAttempts >= MAX_ATTEMPTS) {
    const lastFailed = userData.lastFailedAt?.toMillis?.() || 0;
    const lockoutExpiry = lastFailed + LOCKOUT_DURATION_MS;

    if (Date.now() < lockoutExpiry) {
      const remainingSeconds = Math.ceil((lockoutExpiry - Date.now()) / 1000);
      throw new Error(
        `Account locked. Too many failed attempts. Try again in ${remainingSeconds} seconds.`
      );
    }

    // Lockout expired — reset attempts
    await userRef.update({ failedAttempts: 0 });
  }

  // Validate PIN
  const isValid = await bcrypt.compare(pin, userData.hashedPin);

  if (!isValid) {
    // Record failed attempt
    await userRef.update({
      failedAttempts: admin.firestore.FieldValue.increment(1),
      lastFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const attempts = (userData.failedAttempts || 0) + 1;
    const remaining = MAX_ATTEMPTS - attempts;

    if (remaining <= 0) {
      throw new Error('Account locked. Too many failed attempts. Try again in 15 minutes.');
    }

    throw new Error(`Invalid username or PIN. ${remaining} attempt(s) remaining.`);
  }

  // Success — reset failed attempts
  await userRef.update({
    failedAttempts: 0,
    lastFailedAt: null,
  });

  // Mint a Firebase custom token
  const customToken = await getAuth().createCustomToken(uid, {
    role: userData.role,
    username: userData.username,
  });

  const { hashedPin: _, ...safeUser } = userData;
  return {
    user: { id: uid, ...safeUser },
    customToken,
  };
}

/**
 * Get all users (admin only). Returns users without hashedPin.
 */
async function getAllUsers() {
  const db = getFirestore();
  const snapshot = await db
    .collection(USERS_COLLECTION)
    .where('isActive', '==', true)
    .orderBy('username')
    .get();

  return snapshot.docs.map((doc) => {
    const { hashedPin, ...safeData } = doc.data();
    return {
      id: doc.id,
      ...safeData,
      createdAt: safeData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: safeData.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });
}

/**
 * Get a single user by ID.
 */
async function getUserById(uid) {
  const db = getFirestore();
  const doc = await db.collection(USERS_COLLECTION).doc(uid).get();

  if (!doc.exists) {
    return null;
  }

  const { hashedPin, ...safeData } = doc.data();
  return { id: doc.id, ...safeData };
}

/**
 * Update user role.
 */
async function updateUserRole(uid, newRole) {
  const db = getFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  await userRef.update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update Firebase Auth custom claims
  await getAuth().setCustomUserClaims(uid, {
    role: newRole,
    username: userDoc.data().username,
  });

  return { id: uid, role: newRole };
}

/**
 * Soft-delete a user (set isActive = false).
 */
async function deactivateUser(uid) {
  const db = getFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  await userRef.update({
    isActive: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: uid, isActive: false };
}

/**
 * Reset user PIN (admin action).
 */
async function resetUserPin(uid, newPin) {
  const db = getFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(uid);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const hashedPin = await bcrypt.hash(newPin, SALT_ROUNDS);

  await userRef.update({
    hashedPin,
    failedAttempts: 0,
    lastFailedAt: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { id: uid, pinReset: true };
}

module.exports = {
  createUser,
  validateLogin,
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  resetUserPin,
};
