/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter, useParams } from 'next/navigation'
import ProjectPage from './page'
import { useProjectManagementStore, useCurrentProject, useProjectOperations } from '@/lib/stores/project-management'
import { useToast } from '@/components/ui/use-toast'
import { Timestamp } from 'firebase-admin/firestore'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}))

jest.mock('@/lib/stores/project-management', () => ({
  useProjectManagementStore: jest.fn(),
  useCurrentProject: jest.fn(),
  useProjectOperations: jest.fn()
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn()
}))

jest.mock('@/components/header', () => ({
  Header: ({ variant }: { variant: string }) => <div data-testid="header">{variant}</div>
}))

describe('ProjectPage', () => {
  const mockPush = jest.fn()
  const mockGetProject = jest.fn()
  const mockSetCurrentProject = jest.fn()
  const mockArchiveProject = jest.fn()
  const mockUnarchiveProject = jest.fn()
  const mockToast = jest.fn()

  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test project description',
    location: 'Test Location',
    status: 'active' as const,
    userId: 'test-user-id',
    correlationId: 'test-correlation-id',
    createdAt: Timestamp.fromDate(new Date('2024-01-01')),
    updatedAt: Timestamp.fromDate(new Date('2024-01-02')),
    auditTrail: {
      action: 'create',
      userId: 'test-user-id',
      timestamp: Timestamp.fromDate(new Date('2024-01-01'))
    }
  }

  const mockArchivedProject = { ...mockProject, status: 'archived' as const }

  const mockStore = {
    getProject: mockGetProject,
    setCurrentProject: mockSetCurrentProject,
    archiveProject: mockArchiveProject,
    unarchiveProject: mockUnarchiveProject
  }

  const mockOperations = {
    deleting: { loading: false, error: null },
    updating: { loading: false, error: null }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: 'test-project-id' })
    ;(useProjectManagementStore as unknown as jest.Mock).mockReturnValue(mockStore)
    ;(useCurrentProject as jest.Mock).mockReturnValue(mockProject)
    ;(useProjectOperations as jest.Mock).mockReturnValue(mockOperations)
    ;(useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  // ... (keep existing tests for Loading, Display, Breadcrumbs, etc.)

  describe('Project Actions', () => {
    const user = userEvent.setup()

    it('renders edit and archive buttons for active project', () => {
      render(<ProjectPage />)
      expect(screen.getByRole('button', { name: /Edit Project/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Archive/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument()
    })

    it('renders edit and restore buttons for archived project', () => {
      ;(useCurrentProject as jest.Mock).mockReturnValue(mockArchivedProject)
      render(<ProjectPage />)
      expect(screen.getByRole('button', { name: /Edit Project/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Restore/ })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Archive/ })).not.toBeInTheDocument()
    })

    it('navigates to edit page when edit button is clicked', async () => {
      render(<ProjectPage />)
      await user.click(screen.getByRole('button', { name: /Edit Project/ }))
      expect(mockPush).toHaveBeenCalledWith('/projects/test-project-id/edit')
    })
  })

  describe('Archive Functionality', () => {
    const user = userEvent.setup()
    
    it('archives project and navigates on confirmation', async () => {
      mockArchiveProject.mockResolvedValue(undefined)
      render(<ProjectPage />)
      await user.click(screen.getByRole('button', { name: /Archive/ }))
      // In a real dialog, you'd click the confirm button. Here we assume confirmation.
      const confirmationDialog = screen.getByRole('dialog')
      const confirmButton = screen.getByText('Archive Project')
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockArchiveProject).toHaveBeenCalledWith('test-project-id')
        expect(mockToast).toHaveBeenCalledWith({
          title: "Project Archived",
          description: '"Test Project" has been archived.',
          variant: "default"
        })
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('Unarchive Functionality', () => {
    const user = userEvent.setup()

    beforeEach(() => {
      ;(useCurrentProject as jest.Mock).mockReturnValue(mockArchivedProject)
    })

    it('unarchives a project successfully', async () => {
      mockUnarchiveProject.mockResolvedValue(undefined)
      render(<ProjectPage />)

      const restoreButton = screen.getByRole('button', { name: /Restore/i })
      await user.click(restoreButton)

      await waitFor(() => {
        expect(mockUnarchiveProject).toHaveBeenCalledWith('test-project-id')
        expect(mockToast).toHaveBeenCalledWith({
          title: "Project Restored",
          description: `"${mockArchivedProject.name}" has been restored to active.`,
          variant: "default"
        })
      })
      // The page should re-render, not navigate
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('handles errors during unarchive', async () => {
      const errorMessage = 'Failed to restore'
      mockUnarchiveProject.mockRejectedValue(new Error(errorMessage))
      render(<ProjectPage />)

      const restoreButton = screen.getByRole('button', { name: /Restore/i })
      await user.click(restoreButton)

      await waitFor(() => {
        expect(mockUnarchiveProject).toHaveBeenCalledWith('test-project-id')
        expect(mockToast).toHaveBeenCalledWith({
          title: "Restore Failed",
          description: errorMessage,
          variant: "destructive"
        })
      })
    })

    it('shows loading state during unarchive operation', () => {
      ;(useProjectOperations as jest.Mock).mockReturnValue({
        ...mockOperations,
        updating: { loading: true, error: null }
      })
      render(<ProjectPage />)

      expect(screen.getByRole('button', { name: /Edit Project/ })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Restore/ })).toBeDisabled()
    })
  })
})
