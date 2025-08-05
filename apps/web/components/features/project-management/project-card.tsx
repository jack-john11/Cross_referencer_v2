/**
 * Project Card Component
 * 
 * Displays project information in a card format with actions
 */

'use client'

import { format } from 'date-fns'
import { MoreVertical, MapPin, Calendar, Archive, Edit, ExternalLink } from 'lucide-react'
import { Project } from '@ecologen/shared-types'
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

interface ProjectCardProps {
  project: Project
  onSelect?: () => void
  onEdit?: () => void
  onArchive?: () => void
  onNavigate?: () => void
  selected?: boolean
  className?: string
}

export function ProjectCard({
  project,
  onSelect,
  onEdit,
  onArchive,
  onNavigate,
  selected = false,
  className = ''
}: ProjectCardProps) {
  const router = useRouter()
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
      case 'archived':
        return 'bg-muted text-muted-foreground hover:bg-muted/80'
      default:
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
    }
  }

  const handleCardClick = () => {
    if (onNavigate) {
      onNavigate()
    } else {
      // Default navigation to project page
      router.push(`/projects/${project.id}`)
    }
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onSelect?.()
  }

  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }

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
                {getProjectInitials(project.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-foreground truncate">
                {project.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant="secondary"
                  className={getStatusColor(project.status)}
                >
                  {project.status}
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
                router.push(`/projects/${project.id}`)
              }}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Project
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
              )}
              {onArchive && project.status === 'active' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive()
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Project
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {project.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
            <span>Created {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Selection Checkbox */}
        {onSelect && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selected}
                onChange={handleSelectChange}
                onClick={handleSelectClick}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label className="ml-2 text-sm text-muted-foreground cursor-pointer" onClick={handleSelectClick}>
                Select project
              </label>
            </div>
          </div>
        )}

        {project.updatedAt !== project.createdAt && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground/70">
              Last updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}