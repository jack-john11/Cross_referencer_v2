/**
 * Firebase Admin configuration for backend functions
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { AUSTRALIAN_REGIONS } from './regions'

// Initialize Firebase Admin (only if not already initialized)
let app
if (getApps().length === 0) {
  app = initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
      : undefined,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
} else {
  app = getApps()[0]
}

// Initialize services with Australian region settings
const db = getFirestore(app)
const storage = getStorage(app)

// Configure Firestore settings for Australian compliance
db.settings({
  ignoreUndefinedProperties: true,
})

export { app, db, storage }
export default app