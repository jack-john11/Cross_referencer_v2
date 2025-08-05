/**
 * Job Dashboard Page
 * 
 * Main dashboard for job management with search, filtering, and CRUD operations
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  useJobManagementStore,
  useJobList,
  useJobOperations,
  useJobStoreHydrated
} from '@/lib/stores/job-management'
import { JobList } from '@/components/features/job-management/job-list'
// import { JobFilters } from '@/components/features/job-management/job-filters' // TODO: Create or refactor this component
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Separator } from '@/components/ui/separator'

export default function DashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const hydrated = useJobStoreHydrated()
  
  const jobs = useJobList()
  const operations = useJobOperations()
  
  const { listJobs, deleteJob } = useJobManagementStore()

  useEffect(() => {
    if (hydrated) {
      listJobs().catch(error => {
        toast({
          title: "Failed to load jobs",
          description: error.message,
          variant: "destructive",
        })
      })
    }
  }, [hydrated, listJobs, toast])

  const handleDelete = useCallback(async (jobId: string) => {
    try {
      await deleteJob(jobId)
      toast({
        title: "Job deleted",
        description: "The job has been successfully deleted.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to delete job",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [deleteJob, toast])

  const handleCreateNew = useCallback(() => {
    router.push('/jobs/create')
  }, [router])

  const handleRefresh = useCallback(async () => {
    try {
      await listJobs()
      toast({
        title: "Jobs refreshed",
        description: "Your job list has been updated.",
      })
    } catch (error: any) {
      toast({
        title: "Failed to refresh",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [listJobs, toast])

  if (!hydrated) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
        <Header variant="authenticated" />
        <div className="container mx-auto px-4 py-8"><p>Loading...</p></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Cross-Reference Jobs</h1>
                <p className="text-muted-foreground mt-1">
                  Manage your CSV cross-referencing jobs
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={operations.listing.loading}
                >
                  Refresh
                </Button>
                <Button onClick={handleCreateNew}>
                  Create Job
                </Button>
              </div>
            </div>

            {/* <JobFilters /> TODO */}

            <Separator />

            <JobList
              jobs={jobs}
              loading={operations.listing.loading}
              error={operations.listing.error}
              onDelete={(job) => handleDelete(job.id)}
              onRefresh={handleRefresh}
              onCreateNew={handleCreateNew}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
