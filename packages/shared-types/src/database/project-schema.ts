/**
 * Project Database Schema Types
 * 
 * Database types for project management functionality.
 * All types include audit trail and correlation ID fields for Australian compliance.
 */

import { z } from 'zod'

/**
 * Project database document interface
 * Maps directly to Firestore document structure
 */
export interface Project {
  id: string
  name: string
  description: string
  location: string
  createdAt: Date // Will be Firestore Timestamp in database
  updatedAt: Date // Will be Firestore Timestamp in database
  userId: string
  status: 'active' | 'archived'
  correlationId: string
  auditTrail: {
    action: string
    userId: string
    timestamp: Date // Will be Firestore Timestamp in database
  }
}

/**
 * Zod validation schema for project creation
 */
export const ProjectCreateSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .default(''),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim(),
  correlationId: z.string().uuid('Invalid correlation ID format')
})

/**
 * Zod validation schema for project updates
 */
export const ProjectUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .trim()
    .optional(),
  status: z.enum(['active', 'archived']).optional(),
  correlationId: z.string().uuid('Invalid correlation ID format')
})

/**
 * File document schema for files stored in a sub-collection of a project.
 */
export const FileDocumentSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  storagePath: z.string(),
  fileType: z.string(),
  size: z.number(),
  status: z.enum(['uploaded', 'processing', 'completed', 'error']),
  createdAt: z.date(),
  userId: z.string(),
  correlationId: z.string().uuid(),
})

/**
 * Type for a file document.
 */
export type FileDocument = z.infer<typeof FileDocumentSchema>

/**
 * Type for project creation input (before database generation)
 */
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>

/**
 * Type for project update input
 */
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>

/**
 * Project status enumeration
 */
export type ProjectStatus = Project['status']

/**
 * Firestore collection name constant
 */
export const PROJECT_COLLECTION = 'projects' as const
export const FILES_SUBCOLLECTION = 'files' as const

/**
 * Audit trail action types
 */
export const AUDIT_ACTIONS = {
  CREATE: 'project_created',
  UPDATE: 'project_updated', 
  ARCHIVE: 'project_archived',
  ACCESS: 'project_accessed',
  FILE_UPLOAD: 'file_uploaded',
} as const

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]
