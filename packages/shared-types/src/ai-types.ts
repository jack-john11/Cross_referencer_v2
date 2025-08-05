/**
 * AI generation system types
 */

import type { 
  ModelTier, 
  AIProvider, 
  GenerationMode 
} from './core-types'

// AI Generation System
export interface ReportGenerationRequest {
  projectId: string
  sectionsToGenerate: string[]
  generationMode: GenerationMode
  templateDocument?: string
  customInstructions?: string
  regenerateAll?: boolean
}

export interface AIGenerationProgress {
  projectId: string
  generationId: string
  currentSection: string
  overallProgress: number
  sectionProgress: number
  modelTierUsed: ModelTier
  providerUsed: AIProvider
  estimatedTimeRemaining: number
  status: 'initializing' | 'extracting' | 'classifying' | 'generating' | 'validating' | 'complete' | 'error'
  currentTask?: string
  startedAt: Date
  completedAt?: Date
  errorMessage?: string
}

export interface GenerationRun {
  id: string
  projectId: string
  sectionsGenerated: string[]
  generationMode: GenerationMode
  startedAt: Date
  completedAt?: Date
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  totalCost?: number
  modelUsageStats: ModelUsageStats
  errorMessage?: string
}

export interface ModelUsageStats {
  miniTokens: number
  regularTokens: number
  deepTokens: number
  totalCost: number
  averageResponseTime: number
  escalationRate: number // Percentage of tasks that needed tier escalation
}

// AI Question & Human-in-the-Loop
export interface AIQuestion {
  id: string
  projectId: string
  sectionId: string
  question: string
  context: string
  urgency: 'low' | 'medium' | 'high'
  modelTierRequired: ModelTier
  responses: UserResponse[]
  resolvedAt?: Date
  createdAt: Date
  requiresEcologicalExpertise: boolean
}

export interface UserResponse {
  id: string
  response: string
  confidence: 'low' | 'medium' | 'high'
  providedAt: Date
  userId: string
  additionalContext?: string
}

// AI Model Configuration
export interface AIModel {
  modelId: string
  provider: AIProvider
  tier: ModelTier
  maxTokens: number
  costPerToken: number
  avgResponseTime: number
  capabilities: ModelCapability[]
  thinkingStyle: 'fast' | 'balanced' | 'deep_reasoning'
  supportsJSONOutput: boolean
}

export type ModelCapability = 
  | 'json_output' 
  | 'function_calling' 
  | 'code_generation' 
  | 'reasoning' 
  | 'analysis' 
  | 'creative_writing'
  | 'ecological_expertise'
  | 'regulatory_compliance'

export interface AIProviderConfig {
  name: AIProvider
  models: {
    mini: AIModel
    regular: AIModel
    deep: AIModel
  }
  healthStatus: 'healthy' | 'degraded' | 'down'
  lastHealthCheck: Date
  australianCompliant: boolean
}

// Real-time Communication
export interface WebSocketMessage {
  type: 'progress_update' | 'ai_question' | 'generation_complete' | 'error'
  projectId: string
  data: AIGenerationProgress | AIQuestion | GenerationRun | ErrorInfo
  timestamp: Date
}

export interface ErrorInfo {
  code: string
  message: string
  details?: Record<string, any>
  recoverable: boolean
  suggestedAction?: string
}