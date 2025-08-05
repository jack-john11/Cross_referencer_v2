/**
 * TasEcoGen Cross-Referencer Shared Types
 * 
 * This package contains all shared types, interfaces, and schemas
 * used across the frontend, backend, and Firebase functions.
 * 
 * It is structured to provide clear separation between database schemas,
 * API contracts, and core application types.
 */

// --- Core Types ---
export * from './core-types'

// --- AI-Specific Types ---
export * from './ai-types'

// --- File Handling Types ---
export * from './file-types'

// --- Cross-Reference Job Types ---
export * from './database/job-schema'
export * from './api/job-types'

// --- Shared Constants ---
export * from './constants'
