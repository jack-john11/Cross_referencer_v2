"use client"

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import { useProjectManagementStore, useCurrentProject } from '@/lib/stores/project-management'
import EditProjectPage from './page'
import { Project } from '@ecologen/shared-types'
import { useToast } from '@/components/ui/use-toast'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

jest.mock('@/lib/stores/project-management', () => ({
  useProjectManagementStore: jest.fn(),
  useCurrentProject: jest.fn(),
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
}
const mockParams = { id: 'project-1' }
const mockToast = jest.fn()

const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  location: 'Test Location',
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'user-1',
  status: 'active',
  correlationId: 'corr-1',
  auditTrail: { action: 'created', userId: 'user-1', timestamp: new Date() }
}

describe('EditProjectPage', () => {
  let updateProjectMock: jest.Mock

  beforeEach(() => {
    updateProjectMock = jest.fn()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useParams as jest.Mock).mockReturnValue(mockParams);
    (useCurrentProject as jest.Mock).mockReturnValue(mockProject);
    (useProjectManagementStore as unknown as jest.Mock).mockReturnValue({
      getProject: jest.fn().mockResolvedValue(mockProject),
      updateProject: updateProjectMock,
      operations: { updating: { error: null } },
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders a loading state initially', () => {
    (useProjectManagementStore as unknown as jest.Mock).mockReturnValueOnce({
      getProject: jest.fn(() => new Promise(() => {})), // Never resolves
      operations: { updating: { error: null } },
    });
    render(<EditProjectPage />)
    expect(screen.getByText(/Loading project details.../i)).toBeInTheDocument()
  })

  it('fetches project data and populates the form', async () => {
    render(<EditProjectPage />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Name/i)).toHaveValue(mockProject.name)
      expect(screen.getByLabelText(/Location/i)).toHaveValue(mockProject.location)
      expect(screen.getByLabelText(/Description/i)).toHaveValue(mockProject.description)
    })
  })

  it('handles successful form submission', async () => {
    updateProjectMock.mockResolvedValue({})
    render(<EditProjectPage />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Name/i)).toHaveValue(mockProject.name)
    })

    const nameInput = screen.getByLabelText(/Project Name/i)
    fireEvent.change(nameInput, { target: { value: 'Updated Project Name' } })

    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalledWith(mockProject.id, {
        name: 'Updated Project Name',
        description: mockProject.description,
        location: mockProject.location
      })
      expect(mockToast).toHaveBeenCalledWith({
        title: "Project Updated",
        description: `"Updated Project Name" has been updated successfully.`,
        variant: "default",
      })
      expect(mockRouter.push).toHaveBeenCalledWith(`/projects/${mockProject.id}`)
    })
  })

  it('handles failed form submission', async () => {
    const errorMessage = 'Update failed spectacularly'
    updateProjectMock.mockRejectedValue(new Error(errorMessage))
    render(<EditProjectPage />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Name/i)).toHaveValue(mockProject.name)
    })

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: 'A new name' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }))

    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalled()
      expect(mockToast).toHaveBeenCalledWith({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      })
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  it('disables the submit button when form is invalid or not dirty', async () => {
    render(<EditProjectPage />)
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Project Name/i)).toHaveValue(mockProject.name)
    })
    
    const saveButton = screen.getByRole('button', { name: /Save Changes/i })
    expect(saveButton).toBeDisabled() // Not dirty yet

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: 'New Name' } })
    expect(saveButton).not.toBeDisabled() // Dirty and valid

    fireEvent.change(screen.getByLabelText(/Project Name/i), { target: { value: '' } })
    expect(saveButton).toBeDisabled() // Dirty but invalid
  })
})
