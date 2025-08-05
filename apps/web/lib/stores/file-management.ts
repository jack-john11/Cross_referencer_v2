/**
 * File Management Store - Handles file uploads, PDF extraction, and document processing
 * Integrates with Firebase Storage and Cloud Functions for real-time progress tracking
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  DocumentInfo, 
  ExtractedTableData, 
  FileUploadProgress, 
  ExtractionProgress,
  DocumentType,
  ModelTier,
  APIResponse 
} from '../types/shared'
import { FileUploadService } from '../services/file-upload'

interface FileManagementState {
  // State
  stagedFiles: File[]
  isUploading: boolean
  uploadProgress: Map<string, number>
  uploadingFiles: Map<string, FileUploadProgress>
  extractionProgress: Map<string, ExtractionProgress>
  documents: Map<string, DocumentInfo>
  extractedData: Map<string, ExtractedTableData[]>
  
  // Internal caches to prevent infinite loops
  _documentCache?: Map<string, DocumentInfo[]>
  _extractionCache?: Map<string, ExtractedTableData[]>
  
  // Actions
  addStagedFile: (file: File) => void
  addStagedFiles: (files: File[]) => void
  removeStagedFile: (index: number) => void
  clearStagedFiles: () => void
  uploadStagedFiles: (projectId: string) => Promise<void>
  
  startFileUpload: (file: File, projectId: string) => Promise<string>
  updateUploadProgress: (fileId: string, progress: number) => void
  completeFileUpload: (fileId: string, document: DocumentInfo) => void
  failFileUpload: (fileId: string, error: string) => void
  
  startExtraction: (documentId: string) => Promise<void>
  updateExtractionProgress: (documentId: string, progress: ExtractionProgress) => void
  completeExtraction: (documentId: string, extractedData: ExtractedTableData[]) => void
  failExtraction: (documentId: string, error: string) => void
  
  // Firebase Integration
  subscribeToExtractionProgress: (documentId: string) => () => void
  unsubscribeAll: () => void
  
  // Utility
  getDocumentsByProject: (projectId: string) => DocumentInfo[]
  getExtractionsByProject: (projectId: string) => ExtractedTableData[]
  isFileUploading: (fileId: string) => boolean
  isExtracting: (documentId: string) => boolean
}

export const useFileManagementStore = create<FileManagementState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    stagedFiles: [],
    isUploading: false,
    uploadProgress: new Map(),
    uploadingFiles: new Map(),
    extractionProgress: new Map(),
    documents: new Map(),
    extractedData: new Map(),
    
    // Staged file actions
    addStagedFile: (file) => set(state => ({ stagedFiles: [...state.stagedFiles, file] })),
    addStagedFiles: (files) => set(state => ({ stagedFiles: [...state.stagedFiles, ...files] })),
    removeStagedFile: (index) => set(state => ({ stagedFiles: state.stagedFiles.filter((_, i) => i !== index) })),
    clearStagedFiles: () => set({ stagedFiles: [], uploadProgress: new Map() }),

    uploadStagedFiles: async (projectId) => {
      const { stagedFiles, clearStagedFiles } = get()
      if (stagedFiles.length === 0) return

      set({ isUploading: true, uploadProgress: new Map() })

      const uploadPromises = stagedFiles.map(file => 
        FileUploadService.upload(file, projectId, (progress) => {
          set(state => ({
            uploadProgress: new Map(state.uploadProgress).set(file.name, progress)
          }))
        })
      )

      try {
        await Promise.all(uploadPromises)
        // In a real scenario, you'd get document info back and add it to the 'documents' state
      } catch (error) {
        console.error("Upload failed", error)
        // Handle error state appropriately
      } finally {
        set({ isUploading: false })
        clearStagedFiles()
      }
    },

    // File upload actions
    startFileUpload: async (file: File, projectId: string) => {
      const fileId = `${projectId}_${Date.now()}_${file.name}`
      
      const uploadProgress: FileUploadProgress = {
        fileId,
        filename: file.name,
        uploadProgress: 0,
        currentStage: 'uploading',
        estimatedTimeRemaining: undefined
      }
      
      set(state => ({
        uploadingFiles: new Map(state.uploadingFiles.set(fileId, uploadProgress))
      }))
      
      try {
        // Start upload to Firebase Storage
        const response = await uploadToFirebaseStorage(file, projectId, (progress) => {
          get().updateUploadProgress(fileId, progress)
        })
        
        if (response.success && response.data) {
          get().completeFileUpload(fileId, response.data)
          return fileId
        } else {
          throw new Error(response.error?.message || 'Upload failed')
        }
      } catch (error) {
        get().failFileUpload(fileId, error instanceof Error ? error.message : 'Unknown error')
        throw error
      }
    },
    
    updateUploadProgress: (fileId: string, progress: number) => {
      set(state => {
        const current = state.uploadingFiles.get(fileId)
        if (!current) return state
        
        const updated = { ...current, uploadProgress: progress }
        return {
          uploadingFiles: new Map(state.uploadingFiles.set(fileId, updated))
        }
      })
    },
    
    completeFileUpload: (fileId: string, document: DocumentInfo) => {
      set(state => {
        const uploadingFiles = new Map(state.uploadingFiles)
        uploadingFiles.delete(fileId)
        
        return {
          uploadingFiles,
          documents: new Map(state.documents.set(document.id, document))
        }
      })
      
      // Automatically start extraction for supported document types
      const supportedTypes: DocumentType[] = ['nvr', 'pmr', 'bvd']
      if (supportedTypes.includes(document.documentType)) {
        get().startExtraction(document.id)
      }
    },
    
    failFileUpload: (fileId: string, error: string) => {
      set(state => {
        const current = state.uploadingFiles.get(fileId)
        if (!current) return state
        
        const updated = { 
          ...current, 
          currentStage: 'error' as const,
          errorMessage: error 
        }
        return {
          uploadingFiles: new Map(state.uploadingFiles.set(fileId, updated))
        }
      })
    },
    
    // PDF extraction actions
    startExtraction: async (documentId: string) => {
      const document = get().documents.get(documentId)
      if (!document) {
        throw new Error('Document not found')
      }
      
      const progress: ExtractionProgress = {
        documentId,
        stage: 'initializing',
        progress: 0,
        tablesFound: 0,
        tablesProcessed: 0,
        modelTierUsed: 'mini' // Start with classification
      }
      
      set(state => ({
        extractionProgress: new Map(state.extractionProgress.set(documentId, progress))
      }))
      
      try {
        // Trigger Cloud Function for extraction
        const response = await triggerExtraction(document)
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Extraction failed to start')
        }
        
        // Set up real-time progress subscription
        get().subscribeToExtractionProgress(documentId)
        
      } catch (error) {
        get().failExtraction(documentId, error instanceof Error ? error.message : 'Unknown error')
      }
    },
    
    updateExtractionProgress: (documentId: string, progress: ExtractionProgress) => {
      set(state => ({
        extractionProgress: new Map(state.extractionProgress.set(documentId, progress))
      }))
    },
    
    completeExtraction: (documentId: string, extractedData: ExtractedTableData[]) => {
      set(state => {
        const extractionProgress = new Map(state.extractionProgress)
        extractionProgress.delete(documentId)
        
        return {
          extractionProgress,
          extractedData: new Map(state.extractedData.set(documentId, extractedData))
        }
      })
    },
    
    failExtraction: (documentId: string, error: string) => {
      set(state => {
        const current = state.extractionProgress.get(documentId)
        if (!current) return state
        
        const updated = { 
          ...current, 
          stage: 'complete' as const,
          progress: 100 
        }
        return {
          extractionProgress: new Map(state.extractionProgress.set(documentId, updated))
        }
      })
    },
    
    // Firebase real-time subscriptions
    subscribeToExtractionProgress: (documentId: string) => {
      // This will be implemented with Firebase Firestore real-time listeners
      // For now, return a no-op unsubscribe function
      return () => {}
    },
    
    unsubscribeAll: () => {
      // Unsubscribe from all Firebase listeners
      // Implementation will be added when Firebase is integrated
    },
    
    // Utility functions with memoization to prevent infinite loops
    getDocumentsByProject: (projectId: string) => {
      const state = get()
      const cacheKey = `docs_${projectId}_${state.documents.size}`
      
      // Simple memoization based on project ID and document count
      if (!state._documentCache) state._documentCache = new Map()
      if (state._documentCache.has(cacheKey)) {
        return state._documentCache.get(cacheKey)!
      }
      
      const result = Array.from(state.documents.values()).filter(doc => 
        doc.cloudStoragePath.includes(projectId)
      )
      state._documentCache.set(cacheKey, result)
      return result
    },
    
    getExtractionsByProject: (projectId: string) => {
      const state = get()
      const cacheKey = `extractions_${projectId}_${state.extractedData.size}`
      
      // Simple memoization based on project ID and extraction count  
      if (!state._extractionCache) state._extractionCache = new Map()
      if (state._extractionCache.has(cacheKey)) {
        return state._extractionCache.get(cacheKey)!
      }
      
      const allExtractions: ExtractedTableData[] = []
      for (const extractions of state.extractedData.values()) {
        allExtractions.push(...extractions.filter(e => e.projectId === projectId))
      }
      
      state._extractionCache.set(cacheKey, allExtractions)
      return allExtractions
    },
    
    isFileUploading: (fileId: string) => {
      const upload = get().uploadingFiles.get(fileId)
      return upload?.currentStage === 'uploading'
    },
    
    isExtracting: (documentId: string) => {
      const progress = get().extractionProgress.get(documentId)
      return Boolean(progress && progress.stage !== 'complete')
    }
  }))
)

// ============================================================================
// FIREBASE INTEGRATION FUNCTIONS (to be implemented)
// ============================================================================

async function uploadToFirebaseStorage(
  file: File, 
  projectId: string, 
  onProgress: (progress: number) => void
): Promise<APIResponse<DocumentInfo>> {
  // TODO: Implement Firebase Storage upload with progress tracking
  // This will use Firebase Storage uploadBytesResumable
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Firebase integration pending', recoverable: false },
    timestamp: new Date()
  }
}

async function triggerExtraction(document: DocumentInfo): Promise<APIResponse> {
  // TODO: Implement Cloud Function trigger for PDF extraction
  // This will call the Cloud Function that wraps the Python script
  return {
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Cloud Function integration pending', recoverable: false },
    timestamp: new Date()
  }
}

// ============================================================================
// STORE SELECTORS WITH PROPER MEMOIZATION
// ============================================================================



export const useUploadProgress = (fileId: string) => 
  useFileManagementStore(state => state.uploadingFiles.get(fileId))

export const useExtractionProgress = (documentId: string) => 
  useFileManagementStore(state => state.extractionProgress.get(documentId))

// Simple selectors that don't create new objects
export const useProjectDocuments = (projectId: string) => 
  useFileManagementStore(state => state.getDocumentsByProject(projectId))

export const useProjectExtractions = (projectId: string) => 
  useFileManagementStore(state => state.getExtractionsByProject(projectId))

export const useFileUploadActions = () => {
  const startFileUpload = useFileManagementStore(state => state.startFileUpload)
  const updateUploadProgress = useFileManagementStore(state => state.updateUploadProgress)
  const completeFileUpload = useFileManagementStore(state => state.completeFileUpload)
  const failFileUpload = useFileManagementStore(state => state.failFileUpload)
  
  return { startFileUpload, updateUploadProgress, completeFileUpload, failFileUpload }
}

export const useExtractionActions = () => {
  const startExtraction = useFileManagementStore(state => state.startExtraction)
  const updateExtractionProgress = useFileManagementStore(state => state.updateExtractionProgress)
  const completeExtraction = useFileManagementStore(state => state.completeExtraction)
  const failExtraction = useFileManagementStore(state => state.failExtraction)
  
  return { startExtraction, updateExtractionProgress, completeExtraction, failExtraction }
}
