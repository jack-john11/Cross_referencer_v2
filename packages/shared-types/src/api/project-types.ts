/**
 * Project API Request/Response Types
 * 
 * Types for HTTP API endpoints for project management.
 * All requests include correlation IDs for audit compliance.
 */

import { Project, ProjectCreateInput, ProjectUpdateInput } from '../database/project-schema'

/**
 * Base API request interface with correlation ID
 */
interface BaseApiRequest {
  correlationId: string
}

/**
 * Create project API request
 */
export interface CreateProjectRequest extends BaseApiRequest {
  name: string
  description?: string
  location: string
}

/**
 * Update project API request
 */
export interface UpdateProjectRequest extends BaseApiRequest {
  name?: string
  description?: string
  location?: string
  status?: 'active' | 'archived'
}

/**
 * Get project API request (path parameters)
 */
export interface GetProjectRequest extends BaseApiRequest {
  projectId: string
}

/**
 * List projects API request (query parameters)
 */
export interface ListProjectsRequest extends BaseApiRequest {
  status?: 'active' | 'archived' | 'all'
  limit?: number
  offset?: number
  search?: string
}

/**
 * Delete/Archive project API request
 */
export interface ArchiveProjectRequest extends BaseApiRequest {
  projectId: string
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
 * Create project API response
 */
export type CreateProjectResponse = ApiResponse<{
  project: Project
}>

/**
 * Get project API response
 */
export type GetProjectResponse = ApiResponse<{
  project: Project
}>

/**
 * Update project API response
 */
export type UpdateProjectResponse = ApiResponse<{
  project: Project
}>

/**
 * List projects API response
 */
export type ListProjectsResponse = ApiResponse<{
  projects: Project[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}>

/**
 * Archive project API response
 */
export type ArchiveProjectResponse = ApiResponse<{
  projectId: string
  archivedAt: string
}>

/**
 * HTTP status codes for project API endpoints
 */
export const PROJECT_API_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
} as const

/**
 * Error codes for project API
 */
export const PROJECT_ERROR_CODES = {
  INVALID_INPUT: 'INVALID_INPUT',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_EXISTS: 'PROJECT_EXISTS',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const

export type ProjectErrorCode = typeof PROJECT_ERROR_CODES[keyof typeof PROJECT_ERROR_CODES]