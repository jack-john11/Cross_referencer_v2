/**
 * Core domain types and enums
 */

export type ProjectStatus = 'draft' | 'processing' | 'ready' | 'archived' | 'error'
export type GenerationMode = 'fast' | 'thorough'
export type ModelTier = 'mini' | 'regular' | 'deep'
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'deepseek'
export type DocumentType = 'nvr' | 'pmr' | 'bvd' | 'species_list' | 'gis_shapefile' | 'other'
export type FileType = 'pdf' | 'csv' | 'xlsx' | 'xls' | 'zip' | 'shp' | 'other'
export type TableType = 'threatened_flora' | 'threatened_fauna' | 'species_list' | 'habitat_assessment'
export type SectionImportance = 'low' | 'medium' | 'high' | 'critical'
export type ComplexityLevel = 'low' | 'medium' | 'high'

// Geographic & Client Data
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

// Type Guards & Validation Helpers
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