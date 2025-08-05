/**
 * Unit tests for project schema types and validation
 */

import { describe, it, expect } from '@jest/globals'
import { 
  ProjectCreateSchema, 
  ProjectUpdateSchema,
  PROJECT_COLLECTION,
  AUDIT_ACTIONS,
  type Project,
  type ProjectCreateInput,
  type ProjectUpdateInput
} from './project-schema'

describe('Project Schema Types', () => {
  describe('Project interface', () => {
    it('should have all required fields', () => {
      const project: Project = {
        id: 'test-id',
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

      expect(project.id).toBe('test-id')
      expect(project.status).toBe('active')
      expect(project.auditTrail.action).toBe('project_created')
    })
  })

  describe('ProjectCreateSchema validation', () => {
    it('should validate valid project creation input', () => {
      const validInput: ProjectCreateInput = {
        name: 'Test Project',
        description: 'A test project for ecological assessment',
        location: 'Brisbane, Queensland, Australia',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = ProjectCreateSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.name).toBe('Test Project')
        expect(result.data.description).toBe('A test project for ecological assessment')
        expect(result.data.location).toBe('Brisbane, Queensland, Australia')
      }
    })

    it('should provide default empty description when not provided', () => {
      const inputWithoutDescription = {
        name: 'Test Project',
        location: 'Brisbane, Australia',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = ProjectCreateSchema.safeParse(inputWithoutDescription)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.description).toBe('')
      }
    })

    it('should fail validation for invalid input', () => {
      const invalidInputs = [
        {
          // Missing name
          description: 'Test',
          location: 'Brisbane',
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          // Empty name
          name: '',
          location: 'Brisbane',
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          // Name too long
          name: 'A'.repeat(101),
          location: 'Brisbane',
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          // Missing location
          name: 'Test Project',
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        },
        {
          // Invalid correlation ID
          name: 'Test Project',
          location: 'Brisbane',
          correlationId: 'invalid-uuid'
        }
      ]

      invalidInputs.forEach((input, index) => {
        const result = ProjectCreateSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    it('should trim whitespace from string fields', () => {
      const inputWithWhitespace = {
        name: '  Test Project  ',
        description: '  Test description  ',
        location: '  Brisbane, Australia  ',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = ProjectCreateSchema.safeParse(inputWithWhitespace)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.name).toBe('Test Project')
        expect(result.data.description).toBe('Test description')
        expect(result.data.location).toBe('Brisbane, Australia')
      }
    })
  })

  describe('ProjectUpdateSchema validation', () => {
    it('should validate valid project update input', () => {
      const validUpdate: ProjectUpdateInput = {
        name: 'Updated Project Name',
        description: 'Updated description',
        location: 'Sydney, Australia',
        status: 'archived',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = ProjectUpdateSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate partial updates', () => {
      const partialUpdate = {
        name: 'Just updating the name',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }

      const result = ProjectUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate status enum values', () => {
      const validStatuses = ['active', 'archived']
      
      validStatuses.forEach(status => {
        const update = {
          status,
          correlationId: '123e4567-e89b-12d3-a456-426614174000'
        }
        const result = ProjectUpdateSchema.safeParse(update)
        expect(result.success).toBe(true)
      })

      // Test invalid status
      const invalidUpdate = {
        status: 'invalid-status',
        correlationId: '123e4567-e89b-12d3-a456-426614174000'
      }
      const result = ProjectUpdateSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe('Constants', () => {
    it('should have correct collection name', () => {
      expect(PROJECT_COLLECTION).toBe('projects')
    })

    it('should have all required audit actions', () => {
      expect(AUDIT_ACTIONS.CREATE).toBe('project_created')
      expect(AUDIT_ACTIONS.UPDATE).toBe('project_updated')
      expect(AUDIT_ACTIONS.ARCHIVE).toBe('project_archived')
      expect(AUDIT_ACTIONS.ACCESS).toBe('project_accessed')
    })
  })
})