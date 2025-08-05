/**
 * Shared TypeScript types for EcoLogen frontend and backend integration
 * These types ensure consistency across the entire application stack
 */

// Re-export all types from modules
export * from './core-types'
export * from './project-types'
export * from './ai-types'
export * from './file-types'
export * from './api-types'
export * from './constants'

// Re-export database schema types
export type { ProjectStatus } from './database/project-schema'
export * from './database/project-schema'

// Re-export API types
export type { CreateProjectRequest, UpdateProjectRequest } from './api/project-types'
export * from './api/project-types'