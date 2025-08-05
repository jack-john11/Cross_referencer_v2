/**
 * Unit tests for Project List Component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Project } from '@ecologen/shared-types'
import { ProjectList } from './project-list'

// Mock child components
jest.mock('./project-card', () => ({
  ProjectCard: ({ project, onSelect, onEdit, onArchive, selected }: any) => (
    <div data-testid={`project-card-${project.id}`}>
      <h3>{project.name}</h3>
      <span data-testid="status">{selected ? 'selected' : 'not-selected'}</span>
      <button onClick={() => onSelect?.()} data-testid={`select-${project.id}`}>
        Select
      </button>
      <button onClick={() => onEdit?.()} data-testid={`edit-${project.id}`}>
        Edit
      </button>
      <button onClick={() => onArchive?.()} data-testid={`archive-${project.id}`}>
        Archive
      </button>
    </div>
  )
}))

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Brisbane Wetlands Assessment',
    description: 'Ecological assessment of Brisbane wetlands',
    location: 'Brisbane, QLD' as any,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    userId: 'user-123',
    status: 'active',
    correlationId: 'corr-1',
    auditTrail: {
      action: 'project_created',
      userId: 'user-123',
      timestamp: new Date('2024-01-01')
    }
  },
  {
    id: 'project-2',
    name: 'Sydney Flora Survey',
    description: 'Flora diversity survey in Sydney area',
    location: 'Sydney, NSW' as any,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    userId: 'user-123',
    status: 'active',
    correlationId: 'corr-2',
    auditTrail: {
      action: 'project_created',
      userId: 'user-123',
      timestamp: new Date('2024-01-02')
    }
  }
]

describe('ProjectList', () => {
  const defaultProps = {
    projects: mockProjects,
    loading: false,
    error: null,
    selectedProjectIds: new Set<string>(),
    onProjectSelect: jest.fn(),
    onProjectEdit: jest.fn(),
    onProjectArchive: jest.fn(),
    onRefresh: jest.fn(),
    onCreateNew: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading States', () => {
    it('shows loading skeleton when loading and no projects', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          projects={[]} 
          loading={true} 
        />
      )

      // Should show skeleton elements
      expect(screen.getAllByRole('generic')).toHaveLength(expect.any(Number))
    })

    it('shows loading indicator when loading with existing projects', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          loading={true} 
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByText('Brisbane Wetlands Assessment')).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('shows error message when error and no projects', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          projects={[]} 
          error="Failed to load projects" 
        />
      )

      expect(screen.getByText(/Failed to load projects/)).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('shows error banner when error with existing projects', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          error="Some data may be outdated" 
        />
      )

      expect(screen.getByText(/Some data may be outdated/)).toBeInTheDocument()
      expect(screen.getByText('Brisbane Wetlands Assessment')).toBeInTheDocument()
    })

    it('calls onRefresh when try again is clicked', () => {
      const onRefresh = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          projects={[]} 
          error="Failed to load" 
          onRefresh={onRefresh}
        />
      )

      fireEvent.click(screen.getByText('Try Again'))
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no projects and not loading', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          projects={[]} 
          loading={false} 
        />
      )

      expect(screen.getByText('No projects found')).toBeInTheDocument()
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument()
    })

    it('calls onCreateNew when create first project is clicked', () => {
      const onCreateNew = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          projects={[]} 
          onCreateNew={onCreateNew}
        />
      )

      fireEvent.click(screen.getByText('Create Your First Project'))
      expect(onCreateNew).toHaveBeenCalledTimes(1)
    })
  })

  describe('Project Display', () => {
    it('renders all projects', () => {
      render(<ProjectList {...defaultProps} />)

      expect(screen.getByText('Brisbane Wetlands Assessment')).toBeInTheDocument()
      expect(screen.getByText('Sydney Flora Survey')).toBeInTheDocument()
    })

    it('shows project count in header', () => {
      render(<ProjectList {...defaultProps} />)

      expect(screen.getByText('Projects (2)')).toBeInTheDocument()
    })

    it('shows refresh and new project buttons', () => {
      render(<ProjectList {...defaultProps} />)

      expect(screen.getByText('Refresh')).toBeInTheDocument()
      expect(screen.getByText('New Project')).toBeInTheDocument()
    })
  })

  describe('Project Selection', () => {
    it('shows selected state for selected projects', () => {
      const selectedIds = new Set(['project-1'])
      render(
        <ProjectList 
          {...defaultProps} 
          selectedProjectIds={selectedIds} 
        />
      )

      expect(screen.getByTestId('project-card-project-1')).toContainHTML('selected')
      expect(screen.getByTestId('project-card-project-2')).toContainHTML('not-selected')
    })

    it('calls onProjectSelect when project is selected', () => {
      const onProjectSelect = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onProjectSelect={onProjectSelect} 
        />
      )

      fireEvent.click(screen.getByTestId('select-project-1'))
      expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0])
    })
  })

  describe('Project Actions', () => {
    it('calls onProjectEdit when edit is clicked', () => {
      const onProjectEdit = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onProjectEdit={onProjectEdit} 
        />
      )

      fireEvent.click(screen.getByTestId('edit-project-1'))
      expect(onProjectEdit).toHaveBeenCalledWith(mockProjects[0])
    })

    it('shows archive confirmation dialog when archive is clicked', async () => {
      render(<ProjectList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('archive-project-1'))

      await waitFor(() => {
        expect(screen.getByText('Archive Project')).toBeInTheDocument()
        expect(screen.getByText(/Are you sure you want to archive/)).toBeInTheDocument()
      })
    })

    it('calls onProjectArchive when archive is confirmed', async () => {
      const onProjectArchive = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onProjectArchive={onProjectArchive} 
        />
      )

      fireEvent.click(screen.getByTestId('archive-project-1'))

      await waitFor(() => {
        expect(screen.getByText('Archive Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'Archive Project' }))
      expect(onProjectArchive).toHaveBeenCalledWith(mockProjects[0])
    })

    it('cancels archive when cancel is clicked', async () => {
      const onProjectArchive = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onProjectArchive={onProjectArchive} 
        />
      )

      fireEvent.click(screen.getByTestId('archive-project-1'))

      await waitFor(() => {
        expect(screen.getByText('Archive Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Cancel'))
      expect(onProjectArchive).not.toHaveBeenCalled()
    })
  })

  describe('Refresh Functionality', () => {
    it('calls onRefresh when refresh button is clicked', () => {
      const onRefresh = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onRefresh={onRefresh} 
        />
      )

      fireEvent.click(screen.getByText('Refresh'))
      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('disables refresh button when loading', () => {
      render(
        <ProjectList 
          {...defaultProps} 
          loading={true} 
        />
      )

      const refreshButton = screen.getByText('Refresh')
      expect(refreshButton).toBeDisabled()
    })
  })

  describe('Create New Project', () => {
    it('calls onCreateNew when new project button is clicked', () => {
      const onCreateNew = jest.fn()
      render(
        <ProjectList 
          {...defaultProps} 
          onCreateNew={onCreateNew} 
        />
      )

      fireEvent.click(screen.getByText('New Project'))
      expect(onCreateNew).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('projestdes proper ARIA labels and roles', () => {
      render(<ProjectList {...defaultProps} />)

      // Check that buttons have proper roles
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument()
    })

    it('maintains focus management for dialogs', async () => {
      render(<ProjectList {...defaultProps} />)

      fireEvent.click(screen.getByTestId('archive-project-1'))

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
      })
    })
  })
})
