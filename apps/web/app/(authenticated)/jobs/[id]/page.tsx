/**
 * Job Details Page
 * 
 * Displays the status, details, and results of a single Cross-Reference Job.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CrossReferenceJob } from 'shared-types'
import { useJobManagementStore } from '@/lib/stores/job-management'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle, Loader, Download } from 'lucide-react'
import { format } from 'date-fns'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'

export default function JobDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const jobId = params.id as string

  const [job, setJob] = useState<CrossReferenceJob | null>(null)
  const [loading, setLoading] = useState(true)

  // In a real app, you'd fetch the specific job, but for now we'll find it in the store
  const jobs = useJobManagementStore(state => state.jobs)

  useEffect(() => {
    const jobFromStore = jobs.get(jobId)
    if (jobFromStore) {
      setJob(jobFromStore)
    }
    setLoading(false)
  }, [jobId, jobs])

  const getStatusInfo = (status: CrossReferenceJob['status']) => {
    switch (status) {
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4 text-green-600" /> }
      case 'failed':
        return { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4 text-red-600" /> }
      case 'processing':
        return { color: 'bg-blue-100 text-blue-800', icon: <Loader className="h-4 w-4 text-blue-600 animate-spin" /> }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <Loader className="h-4 w-4 text-gray-600" /> }
    }
  }

  const handleDownloadResults = () => {
    if (!job?.results) return
    const csvContent = "data:text/csv;charset=utf-8," + "Common Values\n" + job.results.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${job.name}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return <p>Loading job details...</p>
  }

  if (!job) {
    return <p>Job not found.</p>
  }

  const statusInfo = getStatusInfo(job.status)

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40 font-sans">
      <Header variant="authenticated" />
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{job.name}</CardTitle>
                  <CardDescription>Created on {format(new Date(job.createdAt), 'PPP')}</CardDescription>
                </div>
                <Badge className={statusInfo.color}>
                  <span className="mr-1">{statusInfo.icon}</span>
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Files</h3>
                  <p><strong>Source:</strong> {job.sourceFile.fileName} ({job.sourceFile.columnIdentifier})</p>
                  <p><strong>Reference:</strong> {job.referenceFile.fileName} ({job.referenceFile.columnIdentifier})</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Results</h3>
                  {job.status === 'completed' && (
                    <>
                      <p>{job.results?.length || 0} common values found.</p>
                      {job.results && job.results.length > 0 && (
                        <Button onClick={handleDownloadResults} className="mt-2">
                          <Download className="h-4 w-4 mr-2" />
                          Download Results
                        </Button>
                      )}
                    </>
                  )}
                   {job.status === 'failed' && <p className="text-red-500">Error: {job.error}</p>}
                   {job.status !== 'completed' && job.status !== 'failed' && <p>Results will be available upon completion.</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
