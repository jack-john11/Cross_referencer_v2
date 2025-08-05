/**
 * Australian region settings for Firebase services
 */

export const AUSTRALIAN_REGIONS = {
  primary: 'australia-southeast1',
  backup: 'australia-southeast2',
  displayName: 'Australia Southeast (Sydney)',
  backupDisplayName: 'Australia Southeast (Melbourne)',
} as const

export const COMPLIANCE_SETTINGS = {
  dataResidency: 'australia',
  allowedRegions: [
    AUSTRALIAN_REGIONS.primary,
    AUSTRALIAN_REGIONS.backup,
  ],
  auditRequired: true,
  encryptionAtRest: true,
} as const

export function validateRegion(region: string): boolean {
  return COMPLIANCE_SETTINGS.allowedRegions.includes(region as any)
}

export function getDefaultRegion(): string {
  return AUSTRALIAN_REGIONS.primary
}