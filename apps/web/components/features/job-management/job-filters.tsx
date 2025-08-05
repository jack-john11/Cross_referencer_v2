/**
 * Project Filters Component
 * 
 * Provides search and filtering capabilities for the project dashboard
 */

'use client'

import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ProjectFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: 'active' | 'archived' | 'all'
  onStatusChange: (value: 'active' | 'archived' | 'all') => void
  className?: string
}

export function ProjectFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  className = ''
}: ProjectFiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const hasActiveFilters = statusFilter !== 'active' || searchTerm.length > 0

  const clearFilters = () => {
    onSearchChange('')
    onStatusChange('active')
    setIsFiltersOpen(false)
  }

  const getStatusLabel = (status: 'active' | 'archived' | 'all') => {
    switch (status) {
      case 'active':
        return 'Active Projects'
      case 'archived':
        return 'Archived Projects'
      case 'all':
        return 'All Projects'
      default:
        return 'All Projects'
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects by name, description, or location..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSearchChange('')}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="archived">Archived Only</SelectItem>
            <SelectItem value="all">All Projects</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Popover */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className={hasActiveFilters ? 'bg-blue-50 border-blue-200' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {(statusFilter !== 'active' ? 1 : 0) + (searchTerm ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Project Status
                  </label>
                  <Select value={statusFilter} onValueChange={onStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Projects</SelectItem>
                      <SelectItem value="archived">Archived Projects</SelectItem>
                      <SelectItem value="all">All Projects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Future filter options can be added here */}
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    More filter options coming soon...
                  </p>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button (when filters are active) */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Filter Summary Component
 * Shows active filters as removable badges
 */
interface FilterSummaryProps {
  searchTerm: string
  statusFilter: 'active' | 'archived' | 'all'
  onSearchChange: (value: string) => void
  onStatusChange: (value: 'active' | 'archived' | 'all') => void
  className?: string
}

export function FilterSummary({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
  className = ''
}: FilterSummaryProps) {
  const activeFilters = []

  if (searchTerm) {
    activeFilters.push({
      label: `Search: "${searchTerm}"`,
      onRemove: () => onSearchChange('')
    })
  }

  if (statusFilter !== 'active') {
    activeFilters.push({
      label: `Status: ${statusFilter}`,
      onRemove: () => onStatusChange('active')
    })
  }

  if (activeFilters.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
              <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilters.map((filter, index) => (
        <Badge 
          key={index}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          {filter.label}
          <Button
            variant="ghost"
            size="sm"
            onClick={filter.onRemove}
            className="h-4 w-4 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove filter</span>
          </Button>
        </Badge>
      ))}
    </div>
  )
}