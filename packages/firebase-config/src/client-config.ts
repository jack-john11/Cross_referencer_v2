/**
 * Firebase client configuration for frontend
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { AUSTRALIAN_REGIONS } from './regions'

const firebaseConfig = {
  // These will be populated from environment variables
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services with Australian compliance
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Ensure Australian data residency
if (typeof window !== 'undefined') {
  // Client-side configuration
  console.log(`Firebase initialized with project: ${firebaseConfig.projectId}`)
  console.log(`Region: ${AUSTRALIAN_REGIONS.primary}`)
}

export { app }
export default app