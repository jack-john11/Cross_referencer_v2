/**
 * Firebase configuration for EcoLogen with Australian compliance
 */

// Client-side exports (for frontend)
export { 
  app as clientApp, 
  auth, 
  db as clientDb, 
  storage as clientStorage 
} from './client-config'

// Admin exports (for backend functions)
export { 
  app as adminApp, 
  db as adminDb, 
  storage as adminStorage 
} from './admin-config'

// Region configuration
export * from './regions'