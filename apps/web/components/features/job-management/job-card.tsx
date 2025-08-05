/**
 * Job Card Component
 * 
 * Displays job information in a card format with actions
 */

'use client'

import { format } from 'date-fns'
import { MoreVertical, FileText, CheckCircle, XCircle, Loader, Archive, Edit, ExternalLink, Calendar } from 'lucide-react'
import { CrossReferenceJob } from 'shared-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouter } from 'next/navigation'

interface JobCardProps {
  job: CrossReferenceJob
  onSelect?: () => void
  onDelete?: () => void
  onNavigate?: () => void
  selected?: boolean
  className?: string
}

export function JobCard({
  job,
  onSelect,
  onDelete,
  onNavigate,
  selected = false,
  className = ''
}: JobCardProps) {
  const router = useRouter()
  const getJobInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

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

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate()
    } else {
      router.push(`/jobs/${job.id}`)
    }
  }

  const statusInfo = getStatusInfo(job.status)

  return (
    <Card 
      className={`
        transition-all duration-200 hover:shadow-md cursor-pointer
        ${selected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        ${className}
      `}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getJobInitials(job.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {job.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary"
                  className={statusInfo.color}
                >
                  <span className="mr-1">{statusInfo.icon}</span>
                  {job.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                router.push(`/jobs/${job.id}`)
              }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Job
              </DropdownMenuItem>
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Delete Job
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start">
            <FileText className="mr-2 h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span><strong>Source:</strong> {job.sourceFile.fileName} ({job.sourceFile.columnIdentifier})</span>
              <span><strong>Reference:</strong> {job.referenceFile.fileName} ({job.referenceFile.columnIdentifier})</span>
            </div>
          </div>

          <div className="flex items-center">
             <CheckCircle className="mr-2 h-4 w-4 flex-shrink-0" />
             <span>
               <strong>Results:</strong> {job.status === 'completed' ? `${job.results?.length || 0} common values found` : 'Not yet processed'}
             </span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Created {format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {job.error && (
            <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-red-500">
                    <strong>Error:</strong> {job.error}
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}

}