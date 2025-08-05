/**
 * Project Dashboard Page
 * 
 * Main dashboard for project management with search, filtering, and CRUD operations
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@ecologen/shared-types'
import { 
  useProjectManagementStore,
  useProjectList,
  useProjectOperations,
  useCurrentProject,
  useProjectStoreHydrated
} from '@/lib/stores/project-management'
import { ProjectList } from '@/components/features/project-management/project-list'
import { ProjectFilters, FilterSummary } from '@/components/features/project-management/project-filters'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // Check if store is hydrated (SSR safety)
  const hydrated = useProjectStoreHydrated()
  
  // Store state - always call hooks to maintain hook order
  const projects = useProjectList()
  const operations = useProjectOperations()
  const currentProject = useCurrentProject()
  
  // Store actions - get them once and memoize
  const store = useProjectManagementStore()
  const {
    filters,
    selectedProjectIds,
    setCurrentProject,
    setFilters,
    toggleProjectSelection,
    clearSelection,
    searchProjects,
    refreshProjects,
    archiveProject,
    clearErrors,
    listProjects
  } = store

  // Local state
  const [isInitialized, setIsInitialized] = useState(false)

  // Memoized initialization function to prevent recreation
  const initializeDashboard = useCallback(async () => {
    if (!hydrated || isInitialized) return
    
    try {
      await listProjects()
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize dashboard:', error)
      toast({
        title: "Failed to load projects",
        description: "There was an error loading your projects. Please try again.",
        variant: "destructive",
      })
      setIsInitialized(true) // Set to true even on error to prevent retry loops
    }
  }, [hydrated, isInitialized, listProjects, toast])

  // Initialize data on mount - only after hydration
  useEffect(() => {
    initializeDashboard()
  }, [initializeDashboard])

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      if (hydrated) {
        clearErrors()
      }
    }
  }, [clearErrors, hydrated])

  // Memoized handlers to prevent unnecessary re-renders
  const handleProjectSelect = useCallback((project: Project) => {
    setCurrentProject(project)
    // Navigate to project details page (to be implemented in future tasks)
    router.push(`/projects/${project.id}`)
  }, [setCurrentProject, router])

  const handleProjectEdit = useCallback((project: Project) => {
    // Navigate to project edit page (to be implemented in future tasks)
    router.push(`/projects/${project.id}/edit`)
  }, [router])

  const handleProjectArchive = useCallback(async (project: Project) => {
    try {
      await archiveProject(project.id)
      toast({
        title: "Project archived",
        description: `"${project.name}" has been moved to archived projects.`,
      })
      
      // Refresh the list to reflect changes
      await refreshProjects()
    } catch (error) {
      console.error('Failed to archive project:', error)
      toast({
        title: "Failed to archive project",
        description: "There was an error archiving the project. Please try again.",
        variant: "destructive",
      })
    }
  }, [archiveProject, refreshProjects, toast])

  const handleCreateNew = useCallback(() => {
    // Navigate to project creation page (to be implemented in future tasks)
    router.push('/projects/create')
  }, [router])

  const handleRefresh = useCallback(async () => {
    try {
      await refreshProjects()
      toast({
        title: "Projects refreshed",
        description: "Your project list has been updated.",
      })
    } catch (error) {
      console.error('Failed to refresh projects:', error)
      toast({
        title: "Failed to refresh",
        description: "There was an error refreshing your projects.",
        variant: "destructive",
      })
    }
  }, [refreshProjects, toast])

  const handleSearchChange = useCallback((searchTerm: string) => {
    searchProjects(searchTerm)
    // No need to refresh - useProjectList will filter client-side
  }, [searchProjects])

  const handleStatusChange = useCallback((status: 'active' | 'archived' | 'all') => {
    setFilters({ status })
    // No need to refresh - useProjectList will filter client-side
  }, [setFilters])

  // Show loading state during hydration or initialization
  if (!hydrated || !isInitialized) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
        <Header variant="authenticated" />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Projects</h1>
                  <p className="text-muted-foreground mt-1">
                    Manage your ecological assessment projects
                  </p>
                </div>
              </div>
              
              <ProjectList
                projects={[]}
                loading={true}
                error={null}
                selectedProjectIds={new Set()}
                onProjectSelect={() => {}}
                onProjectEdit={() => {}}
                onProjectArchive={() => {}}
                onRefresh={() => {}}
                onCreateNew={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Projects</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your ecological assessment projects
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={operations.loading.loading}
                >
                  Refresh
                </Button>
                <Button onClick={handleCreateNew}>
                  Create Project
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              <ProjectFilters
                searchTerm={filters.search}
                onSearchChange={handleSearchChange}
                statusFilter={filters.status}
                onStatusChange={handleStatusChange}
              />
              
              <FilterSummary
                searchTerm={filters.search}
                statusFilter={filters.status}
                onSearchChange={handleSearchChange}
                onStatusChange={handleStatusChange}
              />
            </div>

            <Separator />

            {/* Project List */}
            <ProjectList
              projects={projects}
              loading={operations.loading.loading}
              error={operations.loading.error}
              selectedProjectIds={selectedProjectIds}
              onProjectSelect={handleProjectSelect}
              onProjectEdit={handleProjectEdit}
              onProjectArchive={handleProjectArchive}
              onRefresh={handleRefresh}
              onCreateNew={handleCreateNew}
            />

            {/* Selection Actions (when projects are selected) */}
            {selectedProjectIds.size > 0 && (
                          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground">
                  {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} selected
                </span>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={clearSelection}>
                      Clear Selection
                    </Button>
                    {/* Future bulk actions can be added here */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}