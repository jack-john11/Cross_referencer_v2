/**
 * Firebase Configuration for EcoloGen
 * Client-side Firebase setup for frontend integration
 */

import { initializeApp } from 'firebase/app'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// Firebase configuration
const firebaseConfig = {
  // Add your actual Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const storage = getStorage(app)
export const functions = getFunctions(app, 'australia-southeast1') // Use Australian region
export const db = getFirestore(app)

// Connect to emulators in development (if enabled)
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Connect to Firebase emulators
    connectStorageEmulator(storage, 'localhost', 9199)
    connectFunctionsEmulator(functions, 'localhost', 5001)
    connectFirestoreEmulator(db, 'localhost', 8080)
  } catch (error) {
    // Emulators might already be connected or not available
    console.log('Firebase emulators not available:', error)
  }
}

export { app }