/**
 * Constants and configuration values
 */

// Constants
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