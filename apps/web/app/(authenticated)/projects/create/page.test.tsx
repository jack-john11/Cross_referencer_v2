/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import CreateProjectPage from './page'
import { useProjectManagementStore } from '@/lib/stores/project-management'
import { useToast } from '@/components/ui/use-toast'

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/lib/stores/project-management', () => ({
  useProjectManagementStore: jest.fn()
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn()
}))

jest.mock('@/components/header', () => ({
  Header: ({ variant }: { variant: string }) => <div data-testid="header">{variant}</div>
}))

// Mock window.confirm
const mockConfirm = jest.fn()
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
})

describe('CreateProjectPage', () => {
  const mockPush = jest.fn()
  const mockCreateProject = jest.fn()
  const mockToast = jest.fn()

  const mockStore = {
    createProject: mockCreateProject,
    operations: {
      creation: { loading: false, error: null },
      updating: { loading: false, error: null },
      deleting: { loading: false, error: null }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    
    ;(useProjectManagementStore as unknown as jest.Mock).mockReturnValue(mockStore)
    
    ;(useToast as jest.Mock).mockReturnValue({
      toast: mockToast
    })
    
    mockConfirm.mockReturnValue(true)
  })

  describe('Rendering', () => {
    it('renders the page with correct title and form fields', () => {
      render(<CreateProjectPage />)
      
      expect(screen.getByText('Create New Project')).toBeInTheDocument()
      expect(screen.getByText('Set up a new ecological assessment project')).toBeInTheDocument()
      
      // Check form fields
      expect(screen.getByLabelText(/Project Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Location/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
      
      // Check buttons
      expect(screen.getByRole('button', { name: /Create Project/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Clear/ })).toBeInTheDocument()
    })

    it('renders authenticated header', () => {
      render(<CreateProjectPage />)
      expect(screen.getByTestId('header')).toHaveTextContent('authenticated')
    })

    it('shows character counters for all fields', () => {
      render(<CreateProjectPage />)
      
      expect(screen.getByText('0/100 characters')).toBeInTheDocument() // name
      expect(screen.getByText('0/200 characters')).toBeInTheDocument() // location
      expect(screen.getByText('0/500 characters')).toBeInTheDocument() // description
    })
  })

  describe('Form Validation', () => {
    const user = userEvent.setup()

    it('validates required fields', async () => {
      render(<CreateProjectPage />)
      
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      // Submit button should be disabled initially
      expect(submitButton).toBeDisabled()
      
      // Try to submit with empty required fields
      await user.click(submitButton)
      
      // Should not call createProject
      expect(mockCreateProject).not.toHaveBeenCalled()
    })

    it('shows validation errors for invalid input', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      
      // Test name field - enter and then clear to trigger validation
      await user.type(nameInput, 'a')
      await user.clear(nameInput)
      
      await waitFor(() => {
        expect(screen.getByText('Project name is required')).toBeInTheDocument()
      })
      
      // Test location field
      await user.type(locationInput, 'a')
      await user.clear(locationInput)
      
      await waitFor(() => {
        expect(screen.getByText('Location is required')).toBeInTheDocument()
      })
    })

    it('validates field length limits', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const longName = 'a'.repeat(101) // Exceeds 100 character limit
      
      await user.type(nameInput, longName)
      
      await waitFor(() => {
        expect(screen.getByText('Project name must be less than 100 characters')).toBeInTheDocument()
      })
    })

    it('updates character counters as user types', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      await user.type(nameInput, 'Test Project')
      
      await waitFor(() => {
        expect(screen.getByText('12/100 characters')).toBeInTheDocument()
      })
    })

    it('enables submit button when form is valid', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      await user.type(nameInput, 'Test Project')
      await user.type(locationInput, 'Test Location')
      
      await waitFor(() => {
        expect(submitButton).toBeEnabled()
      })
    })
  })

  describe('Form Submission', () => {
    const user = userEvent.setup()

    it('submits form with valid data', async () => {
      const mockProject = {
        id: 'test-id',
        name: 'Test Project',
        location: 'Test Location',
        description: 'Test Description'
      }
      
      mockCreateProject.mockResolvedValue(mockProject)
      
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      const descriptionInput = screen.getByLabelText(/Description/)
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      await user.type(nameInput, 'Test Project')
      await user.type(locationInput, 'Test Location')
      await user.type(descriptionInput, 'Test Description')
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'Test Project',
          location: 'Test Location',
          description: 'Test Description'
        })
      })
      
      expect(mockToast).toHaveBeenCalledWith({
        title: "Project Created",
        description: '"Test Project" has been created successfully.',
        variant: "default"
      })
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('handles submission errors', async () => {
      const errorMessage = 'Creation failed'
      mockCreateProject.mockRejectedValue(new Error(errorMessage))
      
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      await user.type(nameInput, 'Test Project')
      await user.type(locationInput, 'Test Location')
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Creation Failed",
          description: errorMessage,
          variant: "destructive"
        })
      })
      
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('shows loading state during submission', async () => {
      mockCreateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      await user.type(nameInput, 'Test Project')
      await user.type(locationInput, 'Test Location')
      
      await user.click(submitButton)
      
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('handles empty description correctly', async () => {
      const mockProject = {
        id: 'test-id',
        name: 'Test Project',
        location: 'Test Location'
      }
      
      mockCreateProject.mockResolvedValue(mockProject)
      
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const locationInput = screen.getByLabelText(/Location/)
      const submitButton = screen.getByRole('button', { name: /Create Project/ })
      
      await user.type(nameInput, 'Test Project')
      await user.type(locationInput, 'Test Location')
      // Leave description empty
      
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'Test Project',
          location: 'Test Location'
          // description should be undefined for empty string
        })
      })
    })
  })

  describe('Navigation and Cancel', () => {
    const user = userEvent.setup()

    it('navigates back to dashboard on cancel with no changes', async () => {
      render(<CreateProjectPage />)
      
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      await user.click(cancelButton)
      
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockConfirm).not.toHaveBeenCalled()
    })

    it('shows confirmation when canceling with unsaved changes', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      
      // Make a change to mark form as dirty
      await user.type(nameInput, 'Test')
      await user.click(cancelButton)
      
      expect(mockConfirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to leave?')
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('does not navigate when cancel confirmation is declined', async () => {
      mockConfirm.mockReturnValue(false)
      
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const cancelButton = screen.getByRole('button', { name: /Cancel/ })
      
      await user.type(nameInput, 'Test')
      await user.click(cancelButton)
      
      expect(mockConfirm).toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('clears form when clear button is clicked', async () => {
      render(<CreateProjectPage />)
      
      const nameInput = screen.getByLabelText(/Project Name/)
      const clearButton = screen.getByRole('button', { name: /Clear/ })
      
      await user.type(nameInput, 'Test Project')
      expect(nameInput).toHaveValue('Test Project')
      
      await user.click(clearButton)
      
      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all fields?')
      
      await waitFor(() => {
        expect(nameInput).toHaveValue('')
      })
    })
  })

  describe('Store Error Display', () => {
    it('displays store creation error when present', () => {
      const storeWithError = {
        ...mockStore,
        operations: {
          ...mockStore.operations,
          creation: { loading: false, error: 'Store error message' }
        }
      }
      
      ;(useProjectManagementStore as unknown as jest.Mock).mockReturnValue(storeWithError)
      
      render(<CreateProjectPage />)
      
      expect(screen.getByText('Store error message')).toBeInTheDocument()
    })
  })
})