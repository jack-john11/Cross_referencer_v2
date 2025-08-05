"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useProjectManagementStore, useCurrentProject, useProjectOperations } from '@/lib/stores/project-management'
import { FileUploader } from '@/components/features/file-management/file-uploader'
import { 
  ArrowLeft, 
  Edit3, 
  Archive, 
  ArchiveRestore,
  Calendar, 
  MapPin, 
  FileText, 
  Settings,
  AlertCircle,
  Clock,
  User
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Project } from '@ecologen/shared-types'
import type { Timestamp } from 'firebase-admin/firestore'

// Utility function to safely convert Firebase Timestamp or Date to Date
function toDate(date: Timestamp | Date): Date {
  if (date && typeof (date as any).toDate === 'function') {
    return (date as Timestamp).toDate()
  }
  return date as Date
}

// Breadcrumb component
function ProjectBreadcrumb({ project }: { project: Project | null }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
        Projects
      </Link>
      <span>/</span>
      <span className="text-gray-900 font-medium">
        {project?.name || 'Loading...'}
      </span>
    </nav>
  )
}

// Project status badge component
function ProjectStatusBadge({ status }: { status: 'active' | 'archived' }) {
  return (
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {status === 'active' ? 'Active' : 'Archived'}
    </Badge>
  )
}

// Project actions component
function ProjectActions({ 
  project, 
  onEdit, 
  onArchive, 
  onUnarchive,
  isLoading 
}: { 
  project: Project
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
  isLoading: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={isLoading}
        aria-label={`Edit ${project.name}`}
      >
        <Edit3 className="h-4 w-4 mr-2" />
        Edit Project
      </Button>
      
      {project.status === 'active' && (
        <ConfirmationDialog
          title="Archive Project"
          description={`Are you sure you want to archive "${project.name}"? This will move it to your archived projects and it will no longer appear in your active projects list.`}
          confirmText="Archive Project"
          cancelText="Keep Active"
          variant="destructive"
          onConfirm={onArchive}
        >
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            aria-label={`Archive ${project.name}`}
          >
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
        </ConfirmationDialog>
      )}

      {project.status === 'archived' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUnarchive}
          disabled={isLoading}
          aria-label={`Restore ${project.name}`}
        >
          <ArchiveRestore className="h-4 w-4 mr-2" />
          Restore
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        aria-label={`Settings for ${project.name} (coming soon)`}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
    </div>
  )
}

export default function ProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  
  const projectId = params.id as string
  const currentProject = useCurrentProject()
  const operations = useProjectOperations()
  const { getProject, setCurrentProject, archiveProject, unarchiveProject } = useProjectManagementStore()
  
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [projectError, setProjectError] = useState<string | null>(null)

  // Load project data on mount
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return
      
      setIsLoadingProject(true)
      setProjectError(null)
      
      try {
        // Check if project is already loaded and is the current one
        if (currentProject?.id === projectId) {
          setIsLoadingProject(false)
          return
        }
        
        // Fetch the project
        const project = await getProject(projectId)
        setCurrentProject(project)
        
      } catch (error) {
        console.error('Failed to load project:', error)
        setProjectError(error instanceof Error ? error.message : 'Failed to load project')
      } finally {
        setIsLoadingProject(false)
      }
    }

    loadProject()
  }, [projectId, currentProject?.id, getProject, setCurrentProject])

  // Handle project edit
  const handleEdit = useCallback(() => {
    if (currentProject) {
      // Navigate to edit page (to be implemented)
      router.push(`/projects/${projectId}/edit`)
    }
  }, [currentProject, projectId, router])

  // Handle project archive
  const handleArchive = useCallback(async () => {
    if (!currentProject) return

    try {
      await archiveProject(currentProject.id)
      
      toast({
        title: "Project Archived",
        description: `"${currentProject.name}" has been archived.`,
        variant: "default"
      })
      
      // Navigate back to dashboard
      router.push('/dashboard')
      
    } catch (error) {
      console.error('Failed to archive project:', error)
      toast({
        title: "Archive Failed",
        description: error instanceof Error ? error.message : "Failed to archive project. Please try again.",
        variant: "destructive"
      })
    }
  }, [currentProject, archiveProject, router, toast])

  const handleUnarchive = useCallback(async () => {
    if (!currentProject) return

    try {
      await unarchiveProject(currentProject.id)
      
      toast({
        title: "Project Restored",
        description: `"${currentProject.name}" has been restored to active.`,
        variant: "default"
      })
      
      // No navigation needed, the page will re-render with the new status
    } catch (error) {
      console.error('Failed to restore project:', error)
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : "Failed to restore project. Please try again.",
        variant: "destructive"
      })
    }
  }, [currentProject, unarchiveProject, toast])

  // Loading state
  if (isLoadingProject) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
        <Header variant="authenticated" />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ProjectBreadcrumb project={null} />
            
            <div className="space-y-6">
              {/* Loading skeleton */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (projectError || !currentProject) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
        <Header variant="authenticated" />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ProjectBreadcrumb project={null} />
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {projectError || 'Project not found'}
              </AlertDescription>
            </Alert>
            
            <div className="mt-6">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <ProjectBreadcrumb project={currentProject} />
          
          <div className="space-y-6">
            {/* Project Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{currentProject.name}</h1>
                  <ProjectStatusBadge status={currentProject.status} />
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {currentProject.location as string}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {format(toDate(currentProject.createdAt), 'MMM d, yyyy')}
                  </div>
                </div>
                
                {currentProject.description && (
                  <p className="text-gray-700 max-w-2xl">{currentProject.description}</p>
                )}
              </div>
              
              <ProjectActions
                project={currentProject}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                isLoading={operations.deleting.loading || operations.updating.loading}
              />
            </div>
            
            <Separator />

            {/* Project Content Sections */}
            <div className="grid gap-6">
              <FileUploader projectId={currentProject.id} />

              <Card>
                <CardHeader>
                  <CardTitle>Reports & Documents</CardTitle>
                  <CardDescription>
                    Ecological assessment reports and related documents for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No reports generated yet</p>
                    <p className="text-sm mt-1">Generate your first ecological assessment report to get started</p>
                    <Button className="mt-4" disabled>
                      Generate Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Back Navigation */}
            <div className="pt-6">
              <Button variant="outline" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
