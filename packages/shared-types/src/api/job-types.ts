/**
 * Job API Request/Response Types
 * 
 * Types for HTTP API endpoints for job management.
 * All requests include correlation IDs for audit compliance.
 */

import { CrossReferenceJob, JobCreateInput, JobUpdateInput, CsvInput } from '../database/job-schema'

/**
 * Base API request interface with correlation ID
 */
interface BaseApiRequest {
  correlationId: string
}

/**
 * Create job API request
 */
export interface CreateJobRequest extends BaseApiRequest {
  name: string
  sourceFile: CsvInput
  referenceFile: CsvInput
}

/**
 * Get job API request (path parameters)
 */
export interface GetJobRequest extends BaseApiRequest {
  jobId: string
}

/**
 * List jobs API request (query parameters)
 */
export interface ListJobsRequest extends BaseApiRequest {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'all'
  limit?: number
  offset?: number
  search?: string
}

/**
 * Delete job API request
 */
export interface DeleteJobRequest extends BaseApiRequest {
  jobId: string
}

/**
 * API Response wrapper interface
 */
interface BaseApiResponse {
  success: boolean
  correlationId: string
  timestamp: string
}

/**
 * Success response with data
 */
export interface ApiSuccessResponse<T = any> extends BaseApiResponse {
  success: true
  data: T
}

/**
 * Error response
 */
export interface ApiErrorResponse extends BaseApiResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create job API response
 */
export type CreateJobResponse = ApiResponse<{
  job: CrossReferenceJob
}>

/**
 * Get job API response
 */
export type GetJobResponse = ApiResponse<{
  job: CrossReferenceJob
}>

/**
 * List jobs API response
 */
export type ListJobsResponse = ApiResponse<{
  jobs: CrossReferenceJob[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}>

/**
 * Delete job API response
 */
export type DeleteJobResponse = ApiResponse<{
  jobId: string
  deletedAt: string
}>

/**
 * HTTP status codes for job API endpoints
 */
export const JOB_API_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202, // For async job creation
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
} as const

/**
 * Error codes for job API
 */
export const JOB_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  JOB_NOT_FOUND: 'JOB_NOT_FOUND',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_PROCESSING_ERROR: 'FILE_PROCESSING_ERROR',
} as const

export type JobErrorCode = typeof JOB_ERROR_CODES[keyof typeof JOB_ERROR_CODES]
