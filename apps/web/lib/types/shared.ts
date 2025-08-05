/**
 * Shared TypeScript types for EcoloGen frontend and backend integration
 * These types ensure consistency across the entire application stack
 */

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'archived' | 'error'
export type GenerationMode = 'fast' | 'thorough'
export type ModelTier = 'mini' | 'regular' | 'deep'
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'deepseek'
export type DocumentType = 'nvr' | 'pmr' | 'bvd' | 'species_list' | 'gis_shapefile' | 'other'
export type FileType = 'pdf' | 'csv' | 'xlsx' | 'xls' | 'zip' | 'shp' | 'other'
export type TableType = 'threatened_flora' | 'threatened_fauna' | 'species_list' | 'habitat_assessment'
export type SectionImportance = 'low' | 'medium' | 'high' | 'critical'
export type ComplexityLevel = 'low' | 'medium' | 'high'

// ============================================================================
// GEOGRAPHIC & CLIENT DATA
// ============================================================================

export interface GeoLocation {
  latitude: number
  longitude: number
  address: string
  state: 'TAS' | 'VIC' | 'NSW' | 'QLD' | 'SA' | 'WA' | 'NT' | 'ACT'
  postcode: string
  region?: string
}

export interface ClientInfo {
  id: string
  name: string
  email: string
  organization?: string
  phone?: string
  address?: string
}

// ============================================================================
// PROJECT & REPORT STRUCTURE
// ============================================================================

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

// ============================================================================
// AI GENERATION SYSTEM
// ============================================================================

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

// ============================================================================
// AI QUESTION & HUMAN-IN-THE-LOOP
// ============================================================================

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

// ============================================================================
// FILE & DATA EXTRACTION
// ============================================================================

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

// ============================================================================
// VALIDATION & QUALITY ASSURANCE
// ============================================================================

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

// ============================================================================
// AI MODEL CONFIGURATION
// ============================================================================

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

// ============================================================================
// REAL-TIME COMMUNICATION
// ============================================================================

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

// ============================================================================
// FILE UPLOAD & PROGRESS
// ============================================================================

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

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: ErrorInfo
  timestamp: Date
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CreateProjectRequest = Omit<EcologicalProject, 'id' | 'createdAt' | 'updatedAt' | 'extractedData' | 'generationHistory' | 'aiInteractions'>

export type UpdateProjectRequest = Partial<Pick<EcologicalProject, 'name' | 'description' | 'location' | 'client' | 'reportSections' | 'customInstructions'>>

export type CreateDocumentRequest = Omit<DocumentInfo, 'id' | 'uploadedAt' | 'cloudStoragePath'>

// ============================================================================
// TYPE GUARDS & VALIDATION HELPERS
// ============================================================================

export function isValidProjectStatus(status: string): status is ProjectStatus {
  return ['draft', 'processing', 'ready', 'archived', 'error'].includes(status)
}

export function isValidModelTier(tier: string): tier is ModelTier {
  return ['mini', 'regular', 'deep'].includes(tier)
}

export function isValidAIProvider(provider: string): provider is AIProvider {
  return ['openai', 'claude', 'gemini', 'deepseek'].includes(provider)
}

export function isValidDocumentType(type: string): type is DocumentType {
  return ['nvr', 'pmr', 'bvd', 'species_list', 'gis_shapefile', 'other'].includes(type)
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUSTRALIAN_STATES = ['TAS', 'VIC', 'NSW', 'QLD', 'SA', 'WA', 'NT', 'ACT'] as const

export const DEFAULT_REPORT_SECTIONS = [
  'Summary',
  'Introduction', 
  'Study Area',
  'Methods',
  'Findings',
  'Discussion',
  'References'
] as const

export const ECOLOGICAL_REPORT_STRUCTURE = {
  Summary: {
    subsections: [],
    description: "Executive summary of key findings and recommendations",
    aiComplexity: "high" as const,
    dependsOn: ["Introduction", "Study Area", "Methods", "Findings", "Discussion"]
  },
  Introduction: {
    subsections: ["Purpose", "Scope", "Limitations", "Permit"] as const,
    description: "Project context, objectives, and regulatory framework",
    aiComplexity: "medium" as const,
    dependsOn: []
  },
  "Study Area": {
    subsections: ["Land use proposal", "Overview – cadastral details", "Other site features"] as const,
    description: "Site description, location, and proposed development details", 
    aiComplexity: "medium" as const,
    dependsOn: []
  },
  Methods: {
    subsections: [
      "Nomenclature",
      "Preliminary investigation", 
      "Field assessment",
      "Vegetation classification",
      "Threatened (and priority) flora",
      "Threatened fauna",
      "Weed and hygiene issues"
    ] as const,
    description: "Survey methodologies and assessment protocols",
    aiComplexity: "low" as const,
    dependsOn: []
  },
  Findings: {
    subsections: [
      "Vegetation types",
      "Comments on TASVEG mapping", 
      "Vegetation types recorded as part of the present study",
      "Conservation significance of identified vegetation types",
      "Plant species",
      "Threatened flora",
      "Threatened fauna", 
      "Other natural values",
      "Weed species",
      "Myrtle wilt",
      "Myrtle rust",
      "Rootrot pathogen, Phytophthora cinnamomi",
      "Chytrid fungus and other freshwater pathogens",
      "Additional Matters of National Environmental Significance – Threatened Ecological Communities",
      "Additional Matters of National Environmental Significance – Wetlands of International Importance"
    ] as const,
    description: "Detailed survey results and species/habitat assessments",
    aiComplexity: "high" as const,
    dependsOn: ["Methods", "Study Area"]
  },
  Discussion: {
    subsections: [
      "Summary of key findings",
      "Legislative and policy implications",
      "Recommendations"
    ] as const,
    description: "Analysis of findings, regulatory compliance, and recommendations",
    aiComplexity: "high" as const,
    dependsOn: ["Findings", "Study Area"]
  },
  References: {
    subsections: [],
    description: "Citations and bibliography",
    aiComplexity: "low" as const,
    dependsOn: []
  }
} as const

export const MODEL_TIER_THRESHOLDS = {
  mini: { maxComplexity: 'low', maxTokens: 1000 },
  regular: { maxComplexity: 'medium', maxTokens: 4000 },
  deep: { maxComplexity: 'high', maxTokens: 8000 }
} as const