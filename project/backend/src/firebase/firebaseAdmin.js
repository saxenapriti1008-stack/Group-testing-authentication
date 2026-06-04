import path from 'path';
import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';

let initialized = false;

function hasCredentials() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  return !!(json || file);
}

function initFromEnv() {
  if (initialized) return;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(rawJson)) });
    initialized = true;
    return;
  }

  let keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (keyPath) {
    if (!path.isAbsolute(keyPath)) {
      keyPath = path.resolve(process.cwd(), keyPath);
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
    const cred = JSON.parse(readFileSync(keyPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    initialized = true;
    return;
  }

  throw new Error(
    'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS in backend/.env (see backend/.env.example).',
  );
}

/**
 * @param {string} idToken
 * @returns {Promise<import('firebase-admin/auth').DecodedIdToken>}
 */
export async function verifyIdToken(idToken) {
  if (!hasCredentials()) {
    throw new Error('Firebase Admin is not configured.');
  }
  initFromEnv();
  return admin.auth().verifyIdToken(idToken);
}
