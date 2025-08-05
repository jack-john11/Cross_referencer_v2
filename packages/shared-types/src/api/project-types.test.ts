/**
 * Unit tests for project API request/response types
 */

import { describe, it, expect } from '@jest/globals'
import {
  PROJECT_API_STATUS,
  PROJECT_ERROR_CODES,
  type CreateProjectRequest,
  type UpdateProjectRequest,
  type ListProjectsRequest,
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type CreateProjectResponse,
  type ListProjectsResponse
} from './project-types'
import type { Project } from '../database/project-schema'

describe('Project API Types', () => {
  describe('Request Types', () => {
    it('should define CreateProjectRequest correctly', () => {
      const request: CreateProjectRequest = {
        name: 'New Ecological Project',
        description: 'Project description',
        location: 'Brisbane, Australia',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      expect(request.name).toBe('New Ecological Project')
      expect(request.correlationId).toBe('123e4567-e89b-12d3-a456-426614174000')
    })

    it('should define UpdateProjectRequest with optional fields', () => {
      const partialUpdate: UpdateProjectRequest = {
        name: 'Updated Name',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const fullUpdate: UpdateProjectRequest = {
        name: 'Updated Name',
        description: 'Updated description',
        location: 'Updated location',
        status: 'archived',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      expect(partialUpdate.name).toBe('Updated Name')
      expect(partialUpdate.description).toBeUndefined()
      expect(fullUpdate.status).toBe('archived')
    })

    it('should define ListProjectsRequest with query parameters', () => {
      const basicRequest: ListProjectsRequest = {
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const fullRequest: ListProjectsRequest = {
        status: 'active',
        limit: 20,
        offset: 0,
        search: 'Brisbane',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      expect(basicRequest.correlationId).toBeDefined()
      expect(fullRequest.limit).toBe(20)
      expect(fullRequest.search).toBe('Brisbane')
    })
  })

  describe('Response Types', () => {
    it('should define successful API response', () => {
      const mockProject: Project = {
        id: 'project-123',
        name: 'Test Project',
        description: 'Test description',
        location: 'Brisbane, Australia',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-123',
        status: 'active',
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        auditTrail: {
          action: 'project_created',
          userId: 'user-123',
          timestamp: new Date()
        }
      }

      const successResponse: ApiSuccessResponse<{ project: Project }> = {
        success: true,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          project: mockProject
        }
      }

      expect(successResponse.success).toBe(true)
      expect(successResponse.data.project.id).toBe('project-123')
    })

    it('should define error API response', () => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        error: {
          code: 'PROJECT_NOT_FOUND',
          message: 'Project with specified ID was not found',
          details: {
            projectId: 'non-existent-id'
          }
        }
      }

      expect(errorResponse.success).toBe(false)
      expect(errorResponse.error.code).toBe('PROJECT_NOT_FOUND')
      expect(errorResponse.error.details.projectId).toBe('non-existent-id')
    })

    it('should define CreateProjectResponse type', () => {
      const mockProject: Project = {
        id: 'project-123',
        name: 'New Project',
        description: 'New description',
        location: 'Brisbane, Australia',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-123',
        status: 'active',
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        auditTrail: {
          action: 'project_created',
          userId: 'user-123',
          timestamp: new Date()
        }
      }

      const createResponse: CreateProjectResponse = {
        success: true,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          project: mockProject
        }
      }

      expect(createResponse.success).toBe(true)
      expect(createResponse.data.project.name).toBe('New Project')
    })

    it('should define ListProjectsResponse with pagination', () => {
      const mockProjects: Project[] = [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'Description 1',
          location: 'Brisbane',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-123',
          status: 'active',
          correlationId: '123e4567-e89b-12d3-a456-426614174000',
          auditTrail: {
            action: 'project_created',
            userId: 'user-123',
            timestamp: new Date()
          }
        }
      ]

      const listResponse: ListProjectsResponse = {
        success: true,
        correlationId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          projects: mockProjects,
          pagination: {
            total: 1,
            limit: 20,
            offset: 0,
            hasMore: false
          }
        }
      }

      expect(listResponse.success).toBe(true)
      expect(listResponse.data.projects).toHaveLength(1)
      expect(listResponse.data.pagination.total).toBe(1)
      expect(listResponse.data.pagination.hasMore).toBe(false)
    })
  })

  describe('Constants', () => {
    it('should have correct HTTP status codes', () => {
      expect(PROJECT_API_STATUS.OK).toBe(200)
      expect(PROJECT_API_STATUS.CREATED).toBe(201)
      expect(PROJECT_API_STATUS.BAD_REQUEST).toBe(400)
      expect(PROJECT_API_STATUS.UNAUTHORIZED).toBe(401)
      expect(PROJECT_API_STATUS.FORBIDDEN).toBe(403)
      expect(PROJECT_API_STATUS.NOT_FOUND).toBe(404)
      expect(PROJECT_API_STATUS.CONFLICT).toBe(409)
      expect(PROJECT_API_STATUS.INTERNAL_ERROR).toBe(500)
    })

    it('should have correct error codes', () => {
      expect(PROJECT_ERROR_CODES.INVALID_INPUT).toBe('INVALID_INPUT')
      expect(PROJECT_ERROR_CODES.PROJECT_NOT_FOUND).toBe('PROJECT_NOT_FOUND')
      expect(PROJECT_ERROR_CODES.PROJECT_EXISTS).toBe('PROJECT_EXISTS')
      expect(PROJECT_ERROR_CODES.UNAUTHORIZED_ACCESS).toBe('UNAUTHORIZED_ACCESS')
      expect(PROJECT_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
      expect(PROJECT_ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR')
    })
  })
})