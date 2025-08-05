/**
 * Job Management Store - Handles job CRUD operations and dashboard state
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { useState, useEffect } from 'react'
import { 
  CrossReferenceJob,
  CreateJobRequest,
  ListJobsRequest,
  CreateJobResponse,
  GetJobResponse,
  ListJobsResponse,
  DeleteJobResponse,
  ApiResponse,
} from 'shared-types'

interface AsyncState {
  loading: boolean
  error: string | null
}

interface JobFilters {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'all'
  search: string
}

interface JobManagementState {
  jobs: Map<string, CrossReferenceJob>
  operations: {
    listing: AsyncState
    creating: AsyncState
    deleting: AsyncState
  }
  filters: JobFilters
  createJob: (data: Omit<CreateJobRequest, 'correlationId'>) => Promise<CrossReferenceJob>
  listJobs: () => Promise<void>
  deleteJob: (jobId: string) => Promise<void>
  setFilters: (filters: Partial<JobFilters>) => void
  _generateCorrelationId: () => string
  _updateAsyncState: (operation: keyof JobManagementState['operations'], state: Partial<AsyncState>) => void
  _handleApiResponse: <T>(response: ApiResponse<T>) => T
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

class JobApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    correlationId: string
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        ...options.headers,
      },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    return response.json()
  }

  async createJob(data: CreateJobRequest): Promise<CreateJobResponse> {
    return this.request<{ job: CrossReferenceJob }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }, data.correlationId)
  }

  async listJobs(params: ListJobsRequest): Promise<ListJobsResponse> {
    const queryParams = new URLSearchParams()
    if (params.status && params.status !== 'all') queryParams.set('status', params.status)
    if (params.search) queryParams.set('search', params.search)
    const url = `/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<{ jobs: CrossReferenceJob[]; pagination: any }>(url, { method: 'GET' }, params.correlationId)
  }

  async deleteJob(jobId: string, correlationId: string): Promise<DeleteJobResponse> {
    return this.request<{ jobId: string; deletedAt: string }>(`/jobs/${jobId}`, {
      method: 'DELETE',
    }, correlationId)
  }
}

const apiClient = new JobApiClient()

export const useJobManagementStore = create<JobManagementState>((set, get) => ({
  jobs: new Map(),
  operations: {
    listing: { loading: false, error: null },
    creating: { loading: false, error: null },
    deleting: { loading: false, error: null },
  },
  filters: {
    status: 'all',
    search: '',
  },
  createJob: async (data) => {
    const correlationId = get()._generateCorrelationId()
    get()._updateAsyncState('creating', { loading: true, error: null })
    try {
      const response = await apiClient.createJob({ ...data, correlationId })
      const { job } = get()._handleApiResponse(response)
      set(state => ({ jobs: new Map(state.jobs.set(job.id, job)) }))
      get()._updateAsyncState('creating', { loading: false })
      return job
    } catch (error: any) {
      get()._updateAsyncState('creating', { loading: false, error: error.message })
      throw error
    }
  },
  listJobs: async () => {
    const correlationId = get()._generateCorrelationId()
    get()._updateAsyncState('listing', { loading: true, error: null })
    try {
      const response = await apiClient.listJobs({ ...get().filters, correlationId })
      const { jobs } = get()._handleApiResponse(response)
      const jobsMap = new Map<string, CrossReferenceJob>()
      jobs.forEach(job => jobsMap.set(job.id, job))
      set({ jobs: jobsMap })
      get()._updateAsyncState('listing', { loading: false })
    } catch (error: any) {
      get()._updateAsyncState('listing', { loading: false, error: error.message })
      throw error
    }
  },
  deleteJob: async (jobId) => {
    const correlationId = get()._generateCorrelationId()
    get()._updateAsyncState('deleting', { loading: true, error: null })
    try {
      await apiClient.deleteJob(jobId, correlationId)
      set(state => {
        const newJobs = new Map(state.jobs)
        newJobs.delete(jobId)
        return { jobs: newJobs }
      })
      get()._updateAsyncState('deleting', { loading: false })
    } catch (error: any) {
      get()._updateAsyncState('deleting', { loading: false, error: error.message })
      throw error
    }
  },
  setFilters: (newFilters) => {
    set(state => ({ filters: { ...state.filters, ...newFilters } }))
  },
  _generateCorrelationId: () => uuidv4(),
  _updateAsyncState: (operation, state) => {
    set(currentState => ({
      operations: {
        ...currentState.operations,
        [operation]: { ...currentState.operations[operation], ...state },
      },
    }))
  },
  _handleApiResponse: (response) => {
    if (!response.success) throw new Error(response.error?.message || 'API request failed')
    return response.data
  },
}))

export const useJobList = () => {
  const jobs = useJobManagementStore(state => state.jobs)
  const filters = useJobManagementStore(state => state.filters)
  const jobList = Array.from(jobs.values())
  return jobList.filter(job => {
    if (filters.status !== 'all' && job.status !== filters.status) return false
    if (filters.search && !job.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })
}

export const useJobOperations = () => useJobManagementStore(state => state.operations)

export const useJobStoreHydrated = () => {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  return hydrated
}
