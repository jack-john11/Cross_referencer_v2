/**
 * Unit tests for Project Management Store
 * 
 * Tests Zustand store actions, state updates, and async operations
 */

import { act, renderHook } from '@testing-library/react'
import { useProjectManagementStore, useProjectList, useProjectOperations } from './project-management'
import type { Project, ApiResponse } from '@ecologen/shared-types'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock UUID generation
jest.mock('uuid', () => ({
  v4: () => 'test-correlation-id-123'
}))

describe('Project Management Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProjectManagementStore.setState({
      projects: new Map(),
      currentProject: null,
      operations: {
        loading: { loading: false, error: null, lastUpdated: null },
        creating: { loading: false, error: null, lastUpdated: null },
        updating: { loading: false, error: null, lastUpdated: null },
        deleting: { loading: false, error: null, lastUpdated: null },
      },
      filters: {
        status: 'active',
        search: '',
        limit: 20,
        offset: 0,
      },
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      },
      selectedProjectIds: new Set(),
    })

    // Reset fetch mock
    mockFetch.mockReset()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProjectManagementStore())
      
      expect(result.current.projects.size).toBe(0)
      expect(result.current.currentProject).toBeNull()
      expect(result.current.operations.loading.loading).toBe(false)
      expect(result.current.filters.status).toBe('active')
      expect(result.current.selectedProjectIds.size).toBe(0)
    })
  })

  describe('Project CRUD Operations', () => {
    const mockProject: Project = {
      id: 'project-123',
      name: 'Test Ecological Project',
      description: 'A test project for species assessment',
      location: 'Brisbane, Queensland, Australia' as any, // TODO: Fix GeoLocation typing
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user-123',
      status: 'active',
      correlationId: 'test-correlation-id-123',
      auditTrail: {
        action: 'project_created',
        userId: 'user-123',
        timestamp: new Date('2024-01-01')
      }
    }

    describe('createProject', () => {
      it('should create project successfully', async () => {
        const mockResponse: ApiResponse<{ project: Project }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { project: mockProject }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          const project = await result.current.createProject({
            name: mockProject.name,
            description: mockProject.description,
            location: mockProject.location
          })

          expect(project).toEqual(mockProject)
          expect(result.current.projects.get(mockProject.id)).toEqual(mockProject)
          expect(result.current.currentProject).toEqual(mockProject)
          expect(result.current.operations.creating.loading).toBe(false)
          expect(result.current.operations.creating.error).toBeNull()
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/projects',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Correlation-ID': 'test-correlation-id-123'
            }),
            body: JSON.stringify({
              name: mockProject.name,
              description: mockProject.description,
              location: mockProject.location,
              correlationId: 'test-correlation-id-123'
            })
          })
        )
      })

      it('should handle create project error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          try {
            await result.current.createProject({
              name: 'Test Project',
              location: 'Brisbane' as any, // TODO: Fix GeoLocation typing
            })
          } catch (error) {
            expect(error).toBeInstanceOf(Error)
            expect(result.current.operations.creating.loading).toBe(false)
            expect(result.current.operations.creating.error).toBe('Network error')
          }
        })
      })
    })

    describe('getProject', () => {
      it('should return existing project from store', async () => {
        const { result } = renderHook(() => useProjectManagementStore())

        // Add project to store first
        act(() => {
          result.current.projects.set(mockProject.id, mockProject)
        })

        await act(async () => {
          const project = await result.current.getProject(mockProject.id)
          expect(project).toEqual(mockProject)
        })

        // Should not make API call since project exists in store
        expect(mockFetch).not.toHaveBeenCalled()
      })

      it('should fetch project from API if not in store', async () => {
        const mockResponse: ApiResponse<{ project: Project }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { project: mockProject }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          const project = await result.current.getProject(mockProject.id)
          expect(project).toEqual(mockProject)
          expect(result.current.projects.get(mockProject.id)).toEqual(mockProject)
        })

        expect(mockFetch).toHaveBeenCalledWith(
          `/api/projects/${mockProject.id}`,
          expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
              'X-Correlation-ID': 'test-correlation-id-123'
            })
          })
        )
      })

      it('should return null for non-existent project', async () => {
        mockFetch.mockRejectedValueOnce(new Error('404: Project not found'))

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          const project = await result.current.getProject('non-existent-id')
          expect(project).toBeNull()
        })
      })
    })

    describe('updateProject', () => {
      it('should update project successfully', async () => {
        const updatedProject = { ...mockProject, name: 'Updated Project Name' }
        const mockResponse: ApiResponse<{ project: Project }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { project: updatedProject }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          const project = await result.current.updateProject(mockProject.id, {
            name: 'Updated Project Name'
          })

          expect(project).toEqual(updatedProject)
          expect(result.current.projects.get(mockProject.id)).toEqual(updatedProject)
          expect(result.current.operations.updating.loading).toBe(false)
          expect(result.current.operations.updating.error).toBeNull()
        })
      })

      it('should update current project if it matches', async () => {
        const updatedProject = { ...mockProject, name: 'Updated Project Name' }
        const mockResponse: ApiResponse<{ project: Project }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { project: updatedProject }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        // Set current project first
        act(() => {
          result.current.setCurrentProject(mockProject)
        })

        await act(async () => {
          await result.current.updateProject(mockProject.id, {
            name: 'Updated Project Name'
          })

          expect(result.current.currentProject).toEqual(updatedProject)
        })
      })
    })

    describe('archiveProject', () => {
      it('should archive project successfully', async () => {
        const mockResponse: ApiResponse<{ projectId: string; archivedAt: string }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { 
            projectId: mockProject.id, 
            archivedAt: '2024-01-01T00:00:00.000Z' 
          }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        // Add project to store first
        act(() => {
          result.current.projects.set(mockProject.id, mockProject)
        })

        await act(async () => {
          await result.current.archiveProject(mockProject.id)

          const archivedProject = result.current.projects.get(mockProject.id)
          expect(archivedProject?.status).toBe('archived')
          expect(result.current.operations.deleting.loading).toBe(false)
          expect(result.current.operations.deleting.error).toBeNull()
        })
      })

      it('should clear current project if archived project matches', async () => {
        const mockResponse: ApiResponse<{ projectId: string; archivedAt: string }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { 
            projectId: mockProject.id, 
            archivedAt: '2024-01-01T00:00:00.000Z' 
          }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        // Set current project and add to store
        act(() => {
          result.current.projects.set(mockProject.id, mockProject)
          result.current.setCurrentProject(mockProject)
        })

        await act(async () => {
          await result.current.archiveProject(mockProject.id)
          expect(result.current.currentProject).toBeNull()
        })
      })
    })

    describe('listProjects', () => {
      it('should load projects successfully', async () => {
        const projects = [mockProject]
        const mockResponse: ApiResponse<{ 
          projects: Project[]; 
          pagination: { total: number; limit: number; offset: number; hasMore: boolean } 
        }> = {
          success: true,
          correlationId: 'test-correlation-id-123',
          timestamp: '2024-01-01T00:00:00.000Z' as any,
          data: { 
            projects,
            pagination: { total: 1, limit: 20, offset: 0, hasMore: false }
          }
        }

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse
        })

        const { result } = renderHook(() => useProjectManagementStore())

        await act(async () => {
          await result.current.listProjects()

          expect(result.current.projects.get(mockProject.id)).toEqual(mockProject)
          expect(result.current.pagination.total).toBe(1)
          expect(result.current.operations.loading.loading).toBe(false)
          expect(result.current.operations.loading.error).toBeNull()
        })
      })
    })
  })

  describe('UI State Management', () => {
    const mockProject: Project = {
      id: 'project-456',
      name: 'Another Test Project',
      description: 'Description',
      location: 'Sydney' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-123',
      status: 'active',
      correlationId: 'corr-456',
      auditTrail: {
        action: 'project_created',
        userId: 'user-123',
        timestamp: new Date()
      }
    }

    describe('setCurrentProject', () => {
      it('should set current project', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        act(() => {
          result.current.setCurrentProject(mockProject)
        })

        expect(result.current.currentProject).toEqual(mockProject)
      })
    })

    describe('setFilters', () => {
      it('should update filters and reset offset', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        // Set initial offset
        act(() => {
          result.current.setFilters({ offset: 40 })
        })

        act(() => {
          result.current.setFilters({ status: 'archived' })
        })

        expect(result.current.filters.status).toBe('archived')
        expect(result.current.filters.offset).toBe(0) // Should reset offset
      })
    })

    describe('project selection', () => {
      it('should manage project selection', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        act(() => {
          result.current.toggleProjectSelection('project-1')
          result.current.toggleProjectSelection('project-2')
        })

        expect(result.current.selectedProjectIds.has('project-1')).toBe(true)
        expect(result.current.selectedProjectIds.has('project-2')).toBe(true)

        act(() => {
          result.current.toggleProjectSelection('project-1') // Toggle off
        })

        expect(result.current.selectedProjectIds.has('project-1')).toBe(false)
        expect(result.current.selectedProjectIds.has('project-2')).toBe(true)

        act(() => {
          result.current.clearSelection()
        })

        expect(result.current.selectedProjectIds.size).toBe(0)
      })

      it('should set multiple selected projects', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        act(() => {
          result.current.setSelectedProjects(['project-1', 'project-2', 'project-3'])
        })

        expect(result.current.selectedProjectIds.size).toBe(3)
        expect(result.current.selectedProjectIds.has('project-1')).toBe(true)
        expect(result.current.selectedProjectIds.has('project-2')).toBe(true)
        expect(result.current.selectedProjectIds.has('project-3')).toBe(true)
      })
    })

    describe('search and filtering', () => {
      it('should search projects', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        act(() => {
          result.current.searchProjects('Brisbane')
        })

        expect(result.current.filters.search).toBe('Brisbane')
        expect(result.current.filters.offset).toBe(0) // Should reset offset
      })
    })

    describe('error management', () => {
      it('should clear all errors', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        // Set some errors
        act(() => {
          result.current._updateAsyncState('creating', { error: 'Create error' })
          result.current._updateAsyncState('updating', { error: 'Update error' })
        })

        expect(result.current.operations.creating.error).toBe('Create error')
        expect(result.current.operations.updating.error).toBe('Update error')

        act(() => {
          result.current.clearErrors()
        })

        expect(result.current.operations.creating.error).toBeNull()
        expect(result.current.operations.updating.error).toBeNull()
      })
    })
  })

  describe('Utility Functions', () => {
    const activeProject: Project = {
      id: 'active-1',
      name: 'Active Project',
      description: 'Active description',
      location: 'Brisbane' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-123',
      status: 'active',
      correlationId: 'corr-active',
      auditTrail: {
        action: 'project_created',
        userId: 'user-123',
        timestamp: new Date()
      }
    }

    const archivedProject: Project = {
      ...activeProject,
      id: 'archived-1',
      name: 'Archived Project',
      status: 'archived'
    }

    beforeEach(() => {
      const { result } = renderHook(() => useProjectManagementStore())
      act(() => {
        result.current.projects.set(activeProject.id, activeProject)
        result.current.projects.set(archivedProject.id, archivedProject)
      })
    })

    describe('getProjectsByStatus', () => {
      it('should filter projects by status', () => {
        const { result } = renderHook(() => useProjectManagementStore())

        const activeProjects = result.current.getProjectsByStatus('active')
        const archivedProjects = result.current.getProjectsByStatus('archived')

        expect(activeProjects).toHaveLength(1)
        expect(activeProjects[0].id).toBe(activeProject.id)
        expect(archivedProjects).toHaveLength(1)
        expect(archivedProjects[0].id).toBe(archivedProject.id)
      })
    })
  })

  describe('Selectors', () => {
    const project1: Project = {
      id: 'project-1',
      name: 'Brisbane Project',
      description: 'Located in Brisbane',
      location: 'Brisbane, Queensland' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-123',
      status: 'active',
      correlationId: 'corr-1',
      auditTrail: {
        action: 'project_created',
        userId: 'user-123',
        timestamp: new Date()
      }
    }

    const project2: Project = {
      ...project1,
      id: 'project-2',
      name: 'Sydney Project',
      description: 'Located in Sydney',
      location: 'Sydney, NSW' as any,
      status: 'archived'
    }

    beforeEach(() => {
      useProjectManagementStore.setState({
        projects: new Map([
          [project1.id, project1],
          [project2.id, project2]
        ])
      })
    })

    describe('useProjectList', () => {
      it('should return filtered project list', () => {
        const { result } = renderHook(() => useProjectList())

        // Default filter shows only active projects
        expect(result.current).toHaveLength(1)
        expect(result.current[0].id).toBe(project1.id)
      })

      it('should filter by search term', () => {
        // Set search filter
        act(() => {
          useProjectManagementStore.getState().setFilters({ 
            search: 'Brisbane',
            status: 'all' 
          })
        })

        const { result } = renderHook(() => useProjectList())

        expect(result.current).toHaveLength(1)
        expect(result.current[0].id).toBe(project1.id)
      })
    })

    describe('useProjectOperations', () => {
      it('should return operations state', () => {
        const { result } = renderHook(() => useProjectOperations())

        expect(result.current).toHaveProperty('loading')
        expect(result.current).toHaveProperty('creating')
        expect(result.current).toHaveProperty('updating')
        expect(result.current).toHaveProperty('deleting')
        expect(result.current.loading.loading).toBe(false)
      })
    })
  })
})
