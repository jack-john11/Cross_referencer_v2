/**
 * Cross-Reference Job Database Schema Types
 * 
 * Database types for the CSV cross-referencing functionality.
 * All types include audit trail and correlation ID fields for compliance.
 */

import { z } from 'zod'

/**
 * Defines the structure for a single CSV file input, including its
 * location in storage and the column to be used for referencing.
 */
export const CsvInputSchema = z.object({
  storagePath: z.string().min(1, 'Storage path is required'),
  columnIdentifier: z.union([z.string().min(1), z.number().int().positive()]),
  fileName: z.string().min(1, 'File name is required'),
});

/**
 * Cross-Reference Job database document interface
 * Maps directly to the Firestore document structure.
 */
export interface CrossReferenceJob {
  id: string
  name: string
  userId: string
  createdAt: Date // Will be Firestore Timestamp in database
  updatedAt: Date // Will be Firestore Timestamp in database
  status: 'pending' | 'processing' | 'completed' | 'failed'
  sourceFile: CsvInput
  referenceFile: CsvInput
  results?: string[]
  error?: string
  correlationId: string
  auditTrail: {
    action: string
    userId: string
    timestamp: Date // Will be Firestore Timestamp in database
  }[]
}

/**
 * Zod validation schema for creating a new Cross-Reference Job.
 */
export const JobCreateSchema = z.object({
  name: z.string()
    .min(1, 'Job name is required')
    .max(100, 'Job name must be less than 100 characters')
    .trim(),
  sourceFile: CsvInputSchema,
  referenceFile: CsvInputSchema,
  correlationId: z.string().uuid('Invalid correlation ID format'),
});

/**
 * Zod validation schema for updating an existing Cross-Reference Job.
 * Typically only status and results are updated programmatically.
 */
export const JobUpdateSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  results: z.array(z.string()).optional(),
  error: z.string().optional(),
});

/**
 * Type for the CsvInput object.
 */
export type CsvInput = z.infer<typeof CsvInputSchema>

/**
 * Type for Job creation input (before database generation).
 */
export type JobCreateInput = z.infer<typeof JobCreateSchema>

/**
 * Type for Job update input.
 */
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>

/**
 * Job status enumeration.
 */
export type JobStatus = CrossReferenceJob['status']

/**
 * Firestore collection name constant.
 */
export const JOBS_COLLECTION = 'jobs' as const
export const FILES_SUBCOLLECTION = 'files' as const // This can remain if you store file metadata separately

/**
 * Audit trail action types for Jobs.
 */
export const AUDIT_ACTIONS = {
  CREATE: 'job_created',
  UPDATE_STATUS: 'job_status_updated', 
  COMPLETE: 'job_completed',
  FAIL: 'job_failed',
  ACCESS: 'job_accessed',
} as const

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS]
