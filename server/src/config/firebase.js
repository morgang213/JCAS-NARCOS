const admin = require('firebase-admin');
const path = require('path');

function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin;
  }

  // In production (Cloud Run), use Secret Manager-injected env var
  // In development, use a service account key file
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const keyPath = path.resolve(__dirname, '..', '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = require(keyPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback: try default credentials (e.g., when running on GCP)
    admin.initializeApp();
  }

  console.log('Firebase Admin SDK initialized');
  return admin;
}

function getFirestore() {
  return admin.firestore();
}

function getAuth() {
  return admin.auth();
}

module.exports = { initializeFirebase, getFirestore, getAuth };
