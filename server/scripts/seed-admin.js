/**
 * Seed Admin Script
 *
 * Creates the first admin user in Firestore and Firebase Auth.
 * Run once after setting up your Firebase project:
 *
 *   node scripts/seed-admin.js
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH in server/.env
 */

const readline = require('readline');
const path = require('path');

// Load env from server/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n=== JCAS-NARCOS Admin Seed Script ===\n');

  // Initialize Firebase
  const { initializeFirebase } = require('../src/config/firebase');
  initializeFirebase();
  const { createUser } = require('../src/services/authService');

  // Gather admin details
  const username = await ask('Admin username (2-30 alphanumeric chars): ');
  if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
    console.error('Invalid username. Must be 2-30 alphanumeric characters or underscores.');
    process.exit(1);
  }

  const displayName = await ask('Display name: ');
  if (!displayName || displayName.length > 50) {
    console.error('Display name must be 1-50 characters.');
    process.exit(1);
  }

  const pin = await ask('4-digit PIN: ');
  if (!/^\d{4}$/.test(pin)) {
    console.error('PIN must be exactly 4 digits.');
    process.exit(1);
  }

  const confirmPin = await ask('Confirm 4-digit PIN: ');
  if (pin !== confirmPin) {
    console.error('PINs do not match.');
    process.exit(1);
  }

  console.log('\nCreating admin user...');

  try {
    const user = await createUser({
      username,
      pin,
      role: 'admin',
      displayName,
      createdBy: 'seed-script',
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user.id}`);
    console.log('\nYou can now log in with this username and PIN.\n');
  } catch (err) {
    console.error('\n❌ Failed to create admin user:', err.message);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
