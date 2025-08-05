/**
 * Project Management Store - Handles project CRUD operations and dashboard state
 * Integrates with backend API for project management with real-time state tracking
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import { useState, useEffect } from 'react'
import { 
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ListProjectsRequest,
  CreateProjectResponse,
  GetProjectResponse,
  UpdateProjectResponse,
  ListProjectsResponse,
  ArchiveProjectResponse,
  ApiResponse,
  PROJECT_API_STATUS,
  PROJECT_ERROR_CODES
} from '@ecologen/shared-types'

/**
 * Async operation states
 */
interface AsyncState {
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

/**
 * Project filters and search state
 */
interface ProjectFilters {
  status: 'active' | 'archived' | 'all'
  search: string
  limit: number
  offset: number
}

/**
 * Pagination state
 */
interface PaginationState {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Project Management Store State
 */
interface ProjectManagementState {
  // Core State
  projects: Map<string, Project>
  currentProject: Project | null
  
  // Async operation states
  operations: {
    loading: AsyncState
    creating: AsyncState
    updating: AsyncState
    deleting: AsyncState
  }
  
  // UI State
  filters: ProjectFilters
  pagination: PaginationState
  selectedProjectIds: Set<string>
  
  // Actions - Project CRUD
  createProject: (data: Omit<CreateProjectRequest, 'correlationId'>) => Promise<Project>
  getProject: (projectId: string) => Promise<Project | null>
  updateProject: (projectId: string, data: Omit<UpdateProjectRequest, 'correlationId'>) => Promise<Project>
  archiveProject: (projectId: string) => Promise<void>
  unarchiveProject: (projectId: string) => Promise<void>
  listProjects: (options?: Partial<ListProjectsRequest>) => Promise<void>
  
  // Actions - UI State Management
  setCurrentProject: (project: Project | null) => void
  setFilters: (filters: Partial<ProjectFilters>) => void
  setSelectedProjects: (projectIds: string[]) => void
  toggleProjectSelection: (projectId: string) => void
  clearSelection: () => void
  
  // Actions - Utility
  searchProjects: (searchTerm: string) => void
  refreshProjects: () => Promise<void>
  getProjectsByStatus: (status: 'active' | 'archived') => Project[]
  clearErrors: () => void
  
  // Internal helpers
  _generateCorrelationId: () => string
  _updateAsyncState: (operation: keyof ProjectManagementState['operations'], state: Partial<AsyncState>) => void
  _handleApiResponse: <T>(response: ApiResponse<T>) => T
}

/**
 * API base URL - would be configured based on environment
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development'

/**
 * Mock data for development when backend isn't running
 */
const MOCK_PROJECTS: Project[] = [
  {
    id: 'mock-project-1',
    name: 'Brisbane Wetlands Assessment',
    description: 'Comprehensive ecological assessment of wetland areas in Brisbane region including flora and fauna surveys.',
    location: 'Brisbane, Queensland, Australia',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    userId: 'mock-user-123',
    status: 'active',
    correlationId: 'mock-corr-1',
    auditTrail: {
      action: 'project_created',
      userId: 'mock-user-123',
      timestamp: new Date('2024-01-15')
    }
  },
  {
    id: 'mock-project-2',
    name: 'Sydney Harbour Biodiversity Study',
    description: 'Marine biodiversity assessment focusing on conservation areas around Sydney Harbour.',
    location: 'Sydney, New South Wales, Australia',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    userId: 'mock-user-123',
    status: 'active',
    correlationId: 'mock-corr-2',
    auditTrail: {
      action: 'project_created',
      userId: 'mock-user-123',
      timestamp: new Date('2024-01-10')
    }
  },
  {
    id: 'mock-project-3',
    name: 'Archived Pilot Study',
    description: 'Pilot study that has been completed and archived for reference.',
    location: 'Melbourne, Victoria, Australia',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-05'),
    userId: 'mock-user-123',
    status: 'archived',
    correlationId: 'mock-corr-3',
    auditTrail: {
      action: 'project_archived',
      userId: 'mock-user-123',
      timestamp: new Date('2024-01-05')
    }
  }
]

/**
 * HTTP client for API calls
 */
class ProjectApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    correlationId: string
  ): Promise<ApiResponse<T>> {
    // In development, check if backend is available, otherwise use mock data
    if (IS_DEVELOPMENT) {
      try {
        const url = `${API_BASE_URL}${endpoint}`
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
            // TODO: Add authentication header
            // 'Authorization': `Bearer ${authToken}`,
            ...options.headers,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response.json()
      } catch (error) {
        console.warn('Backend not available, using mock data:', error)
        return this.getMockResponse(endpoint, options, correlationId)
      }
    }

    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        // TODO: Add authentication header
        // 'Authorization': `Bearer ${authToken}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  private getMockResponse<T>(endpoint: string, options: RequestInit, correlationId: string): Promise<ApiResponse<T>> {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        if (endpoint === '/projects' && options.method === 'GET') {
          resolve({
            success: true,
            correlationId,
            timestamp: new Date().toISOString(),
            data: {
              projects: MOCK_PROJECTS,
              pagination: {
                total: MOCK_PROJECTS.length,
                limit: 20,
                offset: 0,
                hasMore: false
              }
            }
          } as any)
        } else if (endpoint === '/projects' && options.method === 'POST') {
          const newProject: Project = {
            id: `mock-project-${Date.now()}`,
            name: 'New Mock Project',
            description: 'A new project created in development mode',
            location: 'Brisbane, Australia',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'mock-user-123',
            status: 'active',
            correlationId,
            auditTrail: {
              action: 'project_created',
              userId: 'mock-user-123',
              timestamp: new Date()
            }
          }
          resolve({
            success: true,
            correlationId,
            timestamp: new Date().toISOString(),
            data: { project: newProject }
          } as any)
        } else {
          resolve({
            success: true,
            correlationId,
            timestamp: new Date().toISOString(),
            data: {} as any
          })
        }
      }, 500) // Simulate 500ms delay
    })
  }

  async createProject(data: CreateProjectRequest, correlationId?: string): Promise<CreateProjectResponse> {
    const corrId = correlationId || (data as any).correlationId
    return this.request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }, corrId)
  }

  async getProject(projectId: string, correlationId: string): Promise<GetProjectResponse> {
    return this.request<{ project: Project }>(`/projects/${projectId}`, {
      method: 'GET',
    }, correlationId)
  }

  async updateProject(projectId: string, data: UpdateProjectRequest, correlationId?: string): Promise<UpdateProjectResponse> {
    const corrId = correlationId || (data as any).correlationId
    return this.request<{ project: Project }>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, corrId)
  }

  async listProjects(params: ListProjectsRequest): Promise<ListProjectsResponse> {
    const queryParams = new URLSearchParams()
    if (params.status && params.status !== 'all') queryParams.set('status', params.status)
    if (params.limit) queryParams.set('limit', params.limit.toString())
    if (params.offset) queryParams.set('offset', params.offset.toString())
    if (params.search) queryParams.set('search', params.search)

    const url = `/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    
    return this.request<{ projects: Project[]; pagination: PaginationState }>(
      url,
      { method: 'GET' },
      params.correlationId
    )
  }

  async unarchiveProject(projectId: string, correlationId: string): Promise<ApiResponse<{}>> {
    return this.request<{}>(`/projects/${projectId}/unarchive`, {
      method: 'POST',
    }, correlationId)
  }

  async archiveProject(projectId: string, correlationId: string): Promise<ArchiveProjectResponse> {
    return this.request<{ projectId: string; archivedAt: string }>(`/projects/${projectId}`, {
      method: 'DELETE',
    }, correlationId)
  }
}

const apiClient = new ProjectApiClient()

/**
 * Project Management Zustand Store
 */
export const useProjectManagementStore = create<ProjectManagementState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
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

    // Project CRUD Actions
    createProject: async (data) => {
      const correlationId = get()._generateCorrelationId()
      get()._updateAsyncState('creating', { loading: true, error: null })

      try {
        const response = await apiClient.createProject({
          ...data,
          correlationId,
        } as CreateProjectRequest, correlationId)

        const projectData = get()._handleApiResponse(response)
        const project = projectData.project

        // Update store state
        set(state => ({
          projects: new Map(state.projects.set(project.id, project)),
          currentProject: project,
        }))

        get()._updateAsyncState('creating', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })

        return project

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
        get()._updateAsyncState('creating', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        throw error
      }
    },

    getProject: async (projectId) => {
      const correlationId = get()._generateCorrelationId()
      
      // Check if project is already in store
      const existingProject = get().projects.get(projectId)
      if (existingProject) {
        return existingProject
      }

      get()._updateAsyncState('loading', { loading: true, error: null })

      try {
        const response = await apiClient.getProject(projectId, correlationId)
        const projectData = get()._handleApiResponse(response)
        const project = projectData.project

        // Update store state
        set(state => ({
          projects: new Map(state.projects.set(project.id, project)),
        }))

        get()._updateAsyncState('loading', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })

        return project

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project'
        get()._updateAsyncState('loading', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        
        // Return null for not found, throw for other errors
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          return null
        }
        throw error
      }
    },

    updateProject: async (projectId, data) => {
      const correlationId = get()._generateCorrelationId()
      get()._updateAsyncState('updating', { loading: true, error: null })

      try {
        const response = await apiClient.updateProject(projectId, {
          ...data,
          correlationId,
        } as UpdateProjectRequest, correlationId)

        const projectData = get()._handleApiResponse(response)
        const project = projectData.project

        // Update store state
        set(state => ({
          projects: new Map(state.projects.set(project.id, project)),
          currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
        }))

        get()._updateAsyncState('updating', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })

        return project

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project'
        get()._updateAsyncState('updating', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        throw error
      }
    },

    archiveProject: async (projectId) => {
      const correlationId = get()._generateCorrelationId()
      get()._updateAsyncState('deleting', { loading: true, error: null })

      try {
        await apiClient.archiveProject(projectId, correlationId)

        // Update project status in store (soft delete)
        const project = get().projects.get(projectId)
        if (project) {
          const archivedProject = { ...project, status: 'archived' as const }
          set(state => ({
            projects: new Map(state.projects.set(projectId, archivedProject)),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            selectedProjectIds: new Set([...state.selectedProjectIds].filter(id => id !== projectId)),
          }))
        }

        get()._updateAsyncState('deleting', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to archive project'
        get()._updateAsyncState('deleting', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        throw error
      }
    },

    unarchiveProject: async (projectId) => {
      const correlationId = get()._generateCorrelationId()
      get()._updateAsyncState('updating', { loading: true, error: null })

      try {
        await apiClient.unarchiveProject(projectId, correlationId)

        const project = get().projects.get(projectId)
        if (project) {
          const unarchivedProject = { ...project, status: 'active' as const }
          set(state => ({
            projects: new Map(state.projects.set(projectId, unarchivedProject)),
            currentProject: state.currentProject?.id === projectId ? unarchivedProject : state.currentProject,
          }))
        }

        get()._updateAsyncState('updating', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to unarchive project'
        get()._updateAsyncState('updating', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        throw error
      }
    },

    listProjects: async (options = {}) => {
      const filters = get().filters
      const correlationId = get()._generateCorrelationId()
      
      const params: ListProjectsRequest = {
        correlationId,
        status: options.status || filters.status,
        limit: options.limit || filters.limit,
        offset: options.offset || filters.offset,
        search: options.search || filters.search || undefined,
      }

      get()._updateAsyncState('loading', { loading: true, error: null })

      try {
        const response = await apiClient.listProjects(params)
        const data = get()._handleApiResponse(response)

        // Update store state
        const projectsMap = new Map(get().projects)
        data.projects.forEach(project => {
          projectsMap.set(project.id, project)
        })

        set({
          projects: projectsMap,
          pagination: data.pagination,
        })

        get()._updateAsyncState('loading', { 
          loading: false, 
          error: null, 
          lastUpdated: new Date() 
        })

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load projects'
        get()._updateAsyncState('loading', { 
          loading: false, 
          error: errorMessage, 
          lastUpdated: new Date() 
        })
        throw error
      }
    },

    // UI State Management Actions
    setCurrentProject: (project) => {
      set({ currentProject: project })
    },

    setFilters: (newFilters) => {
      set(state => ({
        filters: { ...state.filters, ...newFilters, offset: 0 }, // Reset offset when filters change
      }))
      
      // Don't auto-refresh here to prevent infinite loops
      // Components should manually call listProjects when needed
    },

    setSelectedProjects: (projectIds) => {
      set({ selectedProjectIds: new Set(projectIds) })
    },

    toggleProjectSelection: (projectId) => {
      set(state => {
        const newSelection = new Set(state.selectedProjectIds)
        if (newSelection.has(projectId)) {
          newSelection.delete(projectId)
        } else {
          newSelection.add(projectId)
        }
        return { selectedProjectIds: newSelection }
      })
    },

    clearSelection: () => {
      set({ selectedProjectIds: new Set() })
    },

    // Utility Actions
    searchProjects: (searchTerm) => {
      get().setFilters({ search: searchTerm })
      // Note: Components should call listProjects after this if needed
    },

    refreshProjects: async () => {
      await get().listProjects()
    },

    getProjectsByStatus: (status) => {
      const projects = Array.from(get().projects.values())
      return projects.filter(project => project.status === status)
    },

    clearErrors: () => {
      set(state => ({
        operations: {
          loading: { ...state.operations.loading, error: null },
          creating: { ...state.operations.creating, error: null },
          updating: { ...state.operations.updating, error: null },
          deleting: { ...state.operations.deleting, error: null },
        }
      }))
    },

    // Internal helpers
    _generateCorrelationId: () => uuidv4(),

    _updateAsyncState: (operation, state) => {
      set(currentState => ({
        operations: {
          ...currentState.operations,
          [operation]: { ...currentState.operations[operation], ...state }
        }
      }))
    },

    _handleApiResponse: <T>(response: ApiResponse<T>): T => {
      if (!response.success) {
        const errorResponse = response as any
        throw new Error(errorResponse.error?.message || 'API request failed')
      }
      return response.data
    },
  }))
)

// Selectors for common use cases with SSR safety
export const useProjectList = () => {
  const projects = useProjectManagementStore(state => state.projects)
  const filters = useProjectManagementStore(state => state.filters)
  
  // Convert Map to Array and filter - memoized to prevent infinite loops
  const projectList = Array.from(projects.values())
  
  // Filter projects based on current filters
  return projectList.filter(project => {
    if (filters.status !== 'all' && project.status !== filters.status) {
      return false
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        project.name.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower) ||
        project.location.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })
}

export const useProjectOperations = () => {
  return useProjectManagementStore(state => state.operations)
}

export const useCurrentProject = () => {
  return useProjectManagementStore(state => state.currentProject)
}

// SSR-safe hook to check if store is hydrated
export const useProjectStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false)
  
  useEffect(() => {
    // Only set hydrated to true after client-side mounting
    setHydrated(true)
  }, [])
  
  return hydrated
}

