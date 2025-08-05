/**
 * File upload and data extraction types
 */

import type { 
  DocumentType, 
  TableType, 
  ModelTier 
} from './core-types'

// File & Data Extraction
export interface ExtractedTableData {
  id: string
  projectId: string
  sourceDocument: DocumentInfo
  tableType: TableType
  extractionMethod: 'nvrExtractor' | 'pmrExtractor' | 'bvdExtractor' | 'manual'
  processingTier: ModelTier
  confidence: number
  rawData: TableRow[]
  processedData: StructuredEcologicalData
  validationStatus: ValidationResult
  aiModelUsed: string
  extractedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export interface DocumentInfo {
  id: string
  filename: string
  originalName: string
  fileSize: number
  mimeType: string
  documentType: DocumentType
  uploadedAt: Date
  cloudStoragePath: string
  metadata: Record<string, any>
}

export interface TableRow {
  [columnName: string]: string | number | null
}

export interface StructuredEcologicalData {
  species: SpeciesRecord[]
  habitats: HabitatRecord[]
  threats: ThreatRecord[]
  recommendations: RecommendationRecord[]
}

export interface SpeciesRecord {
  scientificName: string
  commonName?: string
  conservationStatus: string
  lastRecorded?: Date
  location?: string
  abundance?: string
  threats?: string[]
}

export interface HabitatRecord {
  habitatType: string
  area?: number
  quality: 'poor' | 'moderate' | 'good' | 'excellent'
  threats?: string[]
  managementRecommendations?: string[]
}

export interface ThreatRecord {
  threatType: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  confidence: 'low' | 'medium' | 'high'
  affectedSpecies?: string[]
  mitigationMeasures?: string[]
}

export interface RecommendationRecord {
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  timeframe?: string
  estimatedCost?: number
}

// Validation & Quality Assurance
export interface ValidationResult {
  isValid: boolean
  confidence: number
  issues: ValidationIssue[]
  reviewRequired: boolean
  validatedAt: Date
  validatedBy: 'ai' | 'human' | 'hybrid'
}

export interface ValidationIssue {
  type: 'format' | 'content' | 'consistency' | 'regulatory'
  severity: 'warning' | 'error' | 'critical'
  message: string
  field?: string
  suggestion?: string
}

// File Upload & Progress
export interface FileUploadProgress {
  fileId: string
  filename: string
  uploadProgress: number // 0-100
  extractionProgress?: number // 0-100
  currentStage: 'uploading' | 'uploaded' | 'extracting' | 'processing' | 'complete' | 'error'
  estimatedTimeRemaining?: number
  errorMessage?: string
}

export interface ExtractionProgress {
  documentId: string
  stage: 'initializing' | 'parsing' | 'extracting_tables' | 'classifying' | 'validating' | 'complete'
  progress: number // 0-100
  currentTable?: string
  tablesFound: number
  tablesProcessed: number
  modelTierUsed: ModelTier
}

// Utility types
export type CreateDocumentRequest = Omit<DocumentInfo, 'id' | 'uploadedAt' | 'cloudStoragePath'>