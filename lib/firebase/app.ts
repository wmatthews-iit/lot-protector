'use client';

import { initializeApp, getApps } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { DEVELOPMENT, firebaseConfig } from './config';

export const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = (() => {
  const auth = getAuth(firebaseApp);
  if (DEVELOPMENT) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  return auth;
})();
export const db = (() => {
  const db = getFirestore(firebaseApp);
  if (DEVELOPMENT) connectFirestoreEmulator(db, '127.0.0.1', 8080);
  return db;
})();
export const storage = (() => {
  const storage = getStorage(firebaseApp);
  if (DEVELOPMENT) connectStorageEmulator(storage, '127.0.0.1', 9199);
  return storage;
})();
export const functions = (() => {
  const functions = getFunctions(firebaseApp);
  if (DEVELOPMENT) connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  return functions;
})();
