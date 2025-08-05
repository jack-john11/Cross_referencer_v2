/**
 * Project and report structure types
 */

import type { 
  ProjectStatus, 
  GeoLocation, 
  ClientInfo, 
  SectionImportance,
  ModelTier,
  AIProvider,
  GenerationMode
} from './core-types'
import type { ExtractedTableData } from './file-types'
import type { AIQuestion, GenerationRun } from './ai-types'

export interface EcologicalProject {
  id: string
  name: string
  description?: string
  location: GeoLocation
  client: ClientInfo
  createdAt: Date
  updatedAt: Date
  status: ProjectStatus
  reportSections: ReportSection[]
  extractedData: ExtractedTableData[]
  generationHistory: GenerationRun[]
  aiInteractions: AIQuestion[]
  templateDocument?: string
  customInstructions?: string
}

export interface ReportSection {
  id: string
  name: string
  order: number
  isEnabled: boolean
  importance: SectionImportance
  content?: string
  generatedAt?: Date
  modelTierUsed?: ModelTier
  providerUsed?: AIProvider
  wordCount?: number
  dependencies: string[] // Other section IDs this depends on
}

// Utility types
export type CreateProjectRequest = Omit<EcologicalProject, 'id' | 'createdAt' | 'updatedAt' | 'extractedData' | 'generationHistory' | 'aiInteractions'>

export type UpdateProjectRequest = Partial<Pick<EcologicalProject, 'name' | 'description' | 'location' | 'client' | 'reportSections' | 'customInstructions'>>