/**
 * Job List Component
 * 
 * Displays a grid of job cards with loading and error states
 */

'use client'

import { useState } from 'react'
import { Plus, RefreshCw, AlertCircle, FolderX } from 'lucide-react'
import { CrossReferenceJob } from 'shared-types'
import { JobCard } from './job-card'
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

interface JobListProps {
  jobs: CrossReferenceJob[]
  loading: boolean
  error: string | null
  onDelete: (job: CrossReferenceJob) => void
  onRefresh: () => void
  onCreateNew: () => void
  className?: string
}

export function JobList({
  jobs,
  loading,
  error,
  onDelete,
  onRefresh,
  onCreateNew,
  className = ''
}: JobListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<CrossReferenceJob | null>(null)

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm)
      setDeleteConfirm(null)
    }
  }

  // Loading skeleton
  if (loading && jobs.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error && jobs.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load jobs: {error}
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
  if (jobs.length === 0 && !loading) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <FolderX className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No jobs found
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by creating your first cross-reference job.
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Job
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">
            Jobs ({jobs.length})
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
          New Job
        </Button>
      </div>

      {error && jobs.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some data may be outdated: {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onDelete={() => setDeleteConfirm(job)}
          />
        ))}
      </div>

      {loading && jobs.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteConfirm?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function JobCardSkeleton() {
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
