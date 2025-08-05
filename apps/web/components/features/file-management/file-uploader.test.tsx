'use client'

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FileUploader } from './file-uploader'
import { useFileManagementStore } from '@/lib/stores/file-management'
import { FileUploadService } from '@/lib/services/file-upload'

// Mock the store
const mockAddStagedFiles = jest.fn()
const mockRemoveStagedFile = jest.fn()
const mockUploadStagedFiles = jest.fn()
const mockClearStagedFiles = jest.fn()

jest.mock('@/lib/stores/file-management', () => ({
  useFileManagementStore: jest.fn(),
}))

// Mock the service
jest.mock('@/lib/services/file-upload', () => ({
  FileUploadService: {
    upload: jest.fn(),
  },
}))

describe('FileUploader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFileManagementStore as unknown as jest.Mock).mockReturnValue({
      stagedFiles: [],
      isUploading: false,
      uploadProgress: new Map(),
      addStagedFiles: mockAddStagedFiles,
      removeStagedFile: mockRemoveStagedFile,
      uploadStagedFiles: mockUploadStagedFiles,
      clearStagedFiles: mockClearStagedFiles,
    })
  })

  it('renders the dropzone correctly', () => {
    render(<FileUploader projectId="test-project" />)
    expect(screen.getByText(/Drag 'n' drop some files here/)).toBeInTheDocument()
  })

  it('handles file selection', async () => {
    render(<FileUploader projectId="test-project" />)
    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const input = screen.getByTestId('file-dropzone-input') as HTMLInputElement
    
    await waitFor(() =>
      fireEvent.change(input, {
        target: { files: [file] },
      })
    )

    expect(mockAddStagedFiles).toHaveBeenCalledWith([file])
  })

  it('displays staged files', () => {
    (useFileManagementStore as unknown as jest.Mock).mockReturnValue({
      stagedFiles: [new File([''], 'test.pdf')],
      isUploading: false,
      uploadProgress: new Map(),
      removeStagedFile: mockRemoveStagedFile,
    })

    render(<FileUploader projectId="test-project" />)
    expect(screen.getByText('test.pdf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /upload 1 file/i })).toBeInTheDocument()
  })

  it('removes a staged file', () => {
    (useFileManagementStore as unknown as jest.Mock).mockReturnValue({
      stagedFiles: [new File([''], 'test.pdf')],
      isUploading: false,
      uploadProgress: new Map(),
      removeStagedFile: mockRemoveStagedFile,
    })

    render(<FileUploader projectId="test-project" />)
    fireEvent.click(screen.getByRole('button', { name: /remove file/i }))
    expect(mockRemoveStagedFile).toHaveBeenCalledWith(0)
  })

  it('calls uploadStagedFiles on upload button click', () => {
    (useFileManagementStore as unknown as jest.Mock).mockReturnValue({
      stagedFiles: [new File([''], 'test.pdf')],
      isUploading: false,
      uploadProgress: new Map(),
      uploadStagedFiles: mockUploadStagedFiles,
    })

    render(<FileUploader projectId="test-project" />)
    fireEvent.click(screen.getByRole('button', { name: /upload 1 file/i }))
    expect(mockUploadStagedFiles).toHaveBeenCalled()
  })

  it('shows uploading state', () => {
    (useFileManagementStore as unknown as jest.Mock).mockReturnValue({
      stagedFiles: [new File([''], 'test.pdf')],
      isUploading: true,
      uploadProgress: new Map([['test.pdf', 50]]),
    })

    render(<FileUploader projectId="test-project" />)
    expect(screen.getByText('Uploading...')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
