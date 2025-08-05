/**
 * Project List Component
 * 
 * Displays a grid of project cards with loading and error states
 */

'use client'

import { useState } from 'react'
import { Plus, RefreshCw, AlertCircle, FolderX } from 'lucide-react'
import { Project } from '@ecologen/shared-types'
import { ProjectCard } from './project-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProjectListProps {
  projects: Project[]
  loading: boolean
  error: string | null
  selectedProjectIds: Set<string>
  onProjectSelect: (project: Project) => void
  onProjectEdit: (project: Project) => void
  onProjectArchive: (project: Project) => void
  onRefresh: () => void
  onCreateNew: () => void
  className?: string
}

export function ProjectList({
  projects,
  loading,
  error,
  selectedProjectIds,
  onProjectSelect,
  onProjectEdit,
  onProjectArchive,
  onRefresh,
  onCreateNew,
  className = ''
}: ProjectListProps) {
  const [archiveConfirm, setArchiveConfirm] = useState<Project | null>(null)

  const handleArchiveConfirm = () => {
    if (archiveConfirm) {
      onProjectArchive(archiveConfirm)
      setArchiveConfirm(null)
    }
  }

  // Loading skeleton
  if (loading && projects.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load projects: {error}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Empty state
  if (projects.length === 0 && !loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <FolderX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No projects found
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating your first ecological assessment project.
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with refresh and create buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
            Projects ({projects.length})
          </h2>
          <Button
            onClick={onRefresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Error banner for partial failures */}
      {error && projects.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some data may be outdated: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            selected={selectedProjectIds.has(project.id)}
            onSelect={() => onProjectSelect(project)}
            onEdit={() => onProjectEdit(project)}
            onArchive={() => setArchiveConfirm(project)}
          />
        ))}
      </div>

      {/* Loading indicator for additional data */}
      {loading && projects.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      {/* Archive confirmation dialog */}
      <Dialog open={!!archiveConfirm} onOpenChange={() => setArchiveConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive "{archiveConfirm?.name}"? 
              This will move the project to your archived projects list. 
              You can restore it later if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setArchiveConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveConfirm}
            >
              Archive Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * Project Card Skeleton for loading state
 */
function ProjectCardSkeleton() {
  return (
    <div className="border border-border bg-card text-card-foreground rounded-lg p-6 space-y-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  )
}