/**
 * Unit tests for Project Card Component
 */

import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Project } from '@ecologen/shared-types'
import { ProjectCard } from './project-card'

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => 'Jan 1, 2024')
}))

const mockProject: Project = {
  id: 'project-123',
  name: 'Test Ecological Project',
  description: 'A comprehensive ecological assessment project for the Brisbane area',
  location: 'Brisbane, Queensland, Australia' as any,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-15'),
  userId: 'user-123',
  status: 'active',
  correlationId: 'corr-123',
  auditTrail: {
    action: 'project_created',
    userId: 'user-123',
    timestamp: new Date('2024-01-01')
  }
}

describe('ProjectCard', () => {
  const defaultProps = {
    project: mockProject,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onArchive: jest.fn(),
    selected: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders project information correctly', () => {
      render(<ProjectCard {...defaultProps} />)

      expect(screen.getByText(mockProject.name)).toBeInTheDocument()
      expect(screen.getByText(mockProject.description)).toBeInTheDocument()
      expect(screen.getByText(mockProject.location as string)).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
    })

    it('displays project initials in avatar', () => {
      render(<ProjectCard {...defaultProps} />)
      
      // "Test Ecological Project" should show "TE"
      expect(screen.getByText('TE')).toBeInTheDocument()
    })

    it('shows creation date', () => {
      render(<ProjectCard {...defaultProps} />)
      
      expect(screen.getByText(/Created/)).toBeInTheDocument()
    })

    it('shows last updated date when different from creation', () => {
      render(<ProjectCard {...defaultProps} />)
      
      expect(screen.getByText(/Last updated/)).toBeInTheDocument()
    })

    it('does not show last updated when same as creation', () => {
      const projectSameDate = {
        ...mockProject,
        updatedAt: mockProject.createdAt
      }
      
      render(<ProjectCard {...defaultProps} project={projectSameDate} />)
      
      expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('displays active status with green styling', () => {
      render(<ProjectCard {...defaultProps} />)
      
      const statusBadge = screen.getByText('active')
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('displays archived status with gray styling', () => {
      const archivedProject = { ...mockProject, status: 'archived' as const }
      
      render(<ProjectCard {...defaultProps} project={archivedProject} />)
      
      const statusBadge = screen.getByText('archived')
      expect(statusBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Selection State', () => {
    it('applies selected styling when selected=true', () => {
      const { container } = render(<ProjectCard {...defaultProps} selected={true} />)
      
      const card = container.firstChild as HTMLElement
      expect(card).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50')
    })

    it('does not apply selected styling when selected=false', () => {
      const { container } = render(<ProjectCard {...defaultProps} selected={false} />)
      
      const card = container.firstChild as HTMLElement
      expect(card).not.toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50')
    })
  })

  describe('Interactions', () => {
    it('calls onSelect when card is clicked', () => {
      const onSelect = jest.fn()
      render(<ProjectCard {...defaultProps} onSelect={onSelect} />)
      
      const card = screen.getByText(mockProject.name).closest('[role="button"], [tabindex], div')
      if (card) {
        fireEvent.click(card)
        expect(onSelect).toHaveBeenCalledTimes(1)
      }
    })

    it('shows edit option in dropdown menu', () => {
      render(<ProjectCard {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Edit Project')).toBeInTheDocument()
    })

    it('shows archive option for active projects', () => {
      render(<ProjectCard {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.getByText('Archive Project')).toBeInTheDocument()
    })

    it('does not show archive option for archived projects', () => {
      const archivedProject = { ...mockProject, status: 'archived' as const }
      render(<ProjectCard {...defaultProps} project={archivedProject} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.queryByText('Archive Project')).not.toBeInTheDocument()
    })

    it('calls onEdit when edit is clicked', () => {
      const onEdit = jest.fn()
      render(<ProjectCard {...defaultProps} onEdit={onEdit} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      const editButton = screen.getByText('Edit Project')
      fireEvent.click(editButton)
      
      expect(onEdit).toHaveBeenCalledTimes(1)
    })

    it('calls onArchive when archive is clicked', () => {
      const onArchive = jest.fn()
      render(<ProjectCard {...defaultProps} onArchive={onArchive} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      const archiveButton = screen.getByText('Archive Project')
      fireEvent.click(archiveButton)
      
      expect(onArchive).toHaveBeenCalledTimes(1)
    })

    it('prevents event propagation when dropdown menu is clicked', () => {
      const onSelect = jest.fn()
      render(<ProjectCard {...defaultProps} onSelect={onSelect} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      // onSelect should not be called when menu button is clicked
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Optional Props', () => {
    it('renders without onEdit handler', () => {
      const { onEdit, ...propsWithoutEdit } = defaultProps
      render(<ProjectCard {...propsWithoutEdit} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.queryByText('Edit Project')).not.toBeInTheDocument()
    })

    it('renders without onArchive handler', () => {
      const { onArchive, ...propsWithoutArchive } = defaultProps
      render(<ProjectCard {...propsWithoutArchive} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      fireEvent.click(menuButton)
      
      expect(screen.queryByText('Archive Project')).not.toBeInTheDocument()
    })

    it('renders without description', () => {
      const projectWithoutDescription = { ...mockProject, description: '' }
      render(<ProjectCard {...defaultProps} project={projectWithoutDescription} />)
      
      expect(screen.queryByText(mockProject.description)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('projestdes proper screen reader labels', () => {
      render(<ProjectCard {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument()
    })

    it('maintains focus management for keyboard najestgation', () => {
      render(<ProjectCard {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: /open menu/i })
      expect(menuButton).toBeInTheDocument()
      
      // Menu button should be focusable
      menuButton.focus()
      expect(document.activeElement).toBe(menuButton)
    })
  })
})
