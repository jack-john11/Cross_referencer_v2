/**
 * API response and request types
 */

import type { ErrorInfo } from './ai-types'

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: ErrorInfo
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}