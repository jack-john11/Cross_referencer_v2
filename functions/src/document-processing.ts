/**
 * Document Processing Orchestrator
 * Handles file uploads, processing, and data preparation for AI generation
 */

import { onCall } from 'firebase-functions/v2/https';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';

import { v4 as uuidv4 } from 'uuid';
import { sendProgressUpdate } from './websocket-handler';

interface ProcessDocumentRequest {
  fileUrl: string;
  fileName: string;
  documentType: 'NVR' | 'PMR' | 'BVD' | 'Species' | 'GIS_Shapefile';
  fileType: 'pdf' | 'csv' | 'zip' | 'xlsx' | 'other';
  userId: string;
  projectId: string;
}

interface ProcessDocumentResponse {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  extractionId?: string;
  processedData?: any;
  error?: string;
}

interface DocumentMetadata {
  id: string;
  fileName: string;
  documentType: string;
  fileUrl: string;
  userId: string;
  projectId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  extractionId?: string;
  processingSteps: ProcessingStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  output?: any;
}

interface ProcessingStepTemplate {
  name: string;
  description: string;
  critical: boolean;
  executor: string;
}

export const processDocument = onCall({
  region: 'australia-southeast1',
  memory: '1GiB',
  timeoutSeconds: 540,
  cors: true,
}, async (request: any) => {
    const { fileUrl, fileName, documentType, fileType, userId, projectId } = request.data;
    console.log('Processing document:', fileName, documentType, fileType);
    const documentId = uuidv4();
    
    const app = getApp();
    const db = getFirestore(app);

    try {
      // Initialize document record
      const documentMetadata: DocumentMetadata = {
        id: documentId,
        fileName,
        documentType,
        fileUrl,
        userId,
        projectId,
        status: 'processing',
        processingSteps: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('documents').doc(documentId).set(documentMetadata);

      // Send initial progress update
      await sendProgressUpdate(projectId, userId, {
        type: 'file_upload',
        stage: 'processing_started',
        progress: 10,
        message: `Started processing ${fileName}`,
        timestamp: new Date(),
        metadata: { documentId, documentType },
      });

      // Define processing pipeline based on document type and file type
      const processingPipeline = getProcessingPipeline(documentType, fileType);
      
      let processedData: any = {};
      let extractionId: string | undefined;

      // Execute processing steps
      console.log(`Processing pipeline for ${documentType} ${fileType}:`, processingPipeline.map(s => s.name));
      
      for (let i = 0; i < processingPipeline.length; i++) {
        const step = processingPipeline[i];
        const progress = 10 + ((i + 1) / processingPipeline.length) * 80;

        console.log(`Starting step ${i + 1}/${processingPipeline.length}: ${step.name} (${step.executor})`);

        // Update step status
        await updateProcessingStep(db, documentId, step.name, 'processing');
        
        await sendProgressUpdate(projectId, userId, {
          type: 'file_upload',
          stage: step.name,
          progress,
          message: step.description,
          timestamp: new Date(),
          metadata: { documentId, step: step.name },
        });

        try {
          console.log(`Executing step: ${step.executor} for ${documentType}`);
          const stepResult = await executeProcessingStep(
            step,
            fileUrl,
            documentType,
            userId,
            projectId,
            processedData
          );
          console.log(`Step ${step.name} completed successfully:`, stepResult);

          processedData = { ...processedData, ...stepResult };
          
          if (stepResult.extractionId) {
            extractionId = stepResult.extractionId;
          }

          await updateProcessingStep(db, documentId, step.name, 'completed', stepResult);

        } catch (stepError) {
          console.error(`Processing step ${step.name} failed:`, stepError);
          console.error(`Step error details:`, {
            step: step.name,
            executor: step.executor,
            critical: step.critical,
            error: stepError instanceof Error ? stepError.message : 'Unknown error',
            stack: stepError instanceof Error ? stepError.stack : undefined
          });
          
          await updateProcessingStep(
            db, 
            documentId, 
            step.name, 
            'failed', 
            undefined, 
            stepError instanceof Error ? stepError.message : 'Unknown error'
          );

          // Continue with other steps if this one is not critical
          if (step.critical) {
            console.error(`Critical step ${step.name} failed, aborting processing`);
            throw stepError;
          } else {
            console.warn(`Non-critical step ${step.name} failed, continuing with next step`);
          }
        }
      }

      // Update final document status
      const updateData: any = {
        status: 'completed',
        processedAt: new Date(),
        updatedAt: new Date(),
        processedData,
      };
      
      // Only include extractionId if it's defined
      if (extractionId) {
        updateData.extractionId = extractionId;
      }
      
      await db.collection('documents').doc(documentId).update(updateData);

      await sendProgressUpdate(projectId, userId, {
        type: 'file_upload',
        stage: 'completed',
        progress: 100,
        message: `Successfully processed ${fileName}`,
        timestamp: new Date(),
        metadata: { documentId, ...(extractionId && { extractionId }) },
      });

      return {
        documentId,
        status: 'completed' as const,
        ...(extractionId && { extractionId }),
        processedData,
      };

    } catch (error) {
      console.error('Document processing error:', error);

      // Update document status to failed
      await db.collection('documents').doc(documentId).update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      });

      await sendProgressUpdate(projectId, userId, {
        type: 'file_upload',
        stage: 'failed',
        progress: 0,
        message: `Failed to process ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { documentId, error: error instanceof Error ? error.message : 'Unknown error' },
      });

      return {
        documentId,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
);

interface ProcessingStep {
  name: string;
  description: string;
  critical: boolean;
  executor: string;
}

function getProcessingPipeline(documentType: string, fileType: string): ProcessingStepTemplate[] {
  const basePipeline: ProcessingStepTemplate[] = [
    {
      name: 'file_validation',
      description: 'Validating file format and structure',
      critical: true,
      executor: 'validate_file',
    },
    {
      name: 'metadata_extraction',
      description: 'Extracting file metadata',
      critical: false,
      executor: 'extract_metadata',
    },
  ];

  switch (documentType.toUpperCase()) {
    case 'NVR':
      if (fileType === 'csv') {
        return [
          ...basePipeline,
          {
            name: 'nvr_csv_extraction',
            description: 'Extracting NVR data from CSV file',
            critical: true,
            executor: 'extract_nvr_csv',
          },
          {
            name: 'nvr_data_validation',
            description: 'Validating NVR-specific data structure',
            critical: false,
            executor: 'validate_nvr_data',
          },
          {
            name: 'content_redaction',
            description: 'Redacting sensitive information',
            critical: false,
            executor: 'redact_sensitive_content',
          },
        ];
      } else if (fileType === 'pdf') {
        return [
          ...basePipeline,
          {
            name: 'pdf_table_extraction',
            description: 'Extracting tables from NVR PDF document',
            critical: true,
            executor: 'extract_pdf_tables',
          },
          {
            name: 'nvr_pdf_validation',
            description: 'Validating NVR PDF table structure',
            critical: false,
            executor: 'validate_nvr_pdf_data',
          },
          {
            name: 'content_redaction',
            description: 'Redacting sensitive information',
            critical: false,
            executor: 'redact_sensitive_content',
          },
        ];
      }
      break;

    case 'PMR':
    case 'BVD':
      return [
        ...basePipeline,
        {
          name: 'pdf_table_extraction',
          description: 'Extracting tables from PDF document',
          critical: true,
          executor: 'extract_pdf_tables',
        },
        {
          name: 'data_validation',
          description: 'Validating extracted table data',
          critical: false,
          executor: 'validate_extracted_data',
        },
        {
          name: 'content_redaction',
          description: 'Redacting sensitive information',
          critical: false,
          executor: 'redact_sensitive_content',
        },
      ];

    case 'Species':
      return [
        ...basePipeline,
        {
          name: 'species_data_parsing',
          description: 'Parsing species data from file',
          critical: true,
          executor: 'parse_species_data',
        },
        {
          name: 'taxonomy_validation',
          description: 'Validating taxonomic information',
          critical: false,
          executor: 'validate_taxonomy',
        },
      ];

    case 'GIS_Shapefile':
      return [
        ...basePipeline,
        {
          name: 'shapefile_extraction',
          description: 'Extracting GIS data from shapefile',
          critical: true,
          executor: 'extract_shapefile_data',
        },
        {
          name: 'coordinate_validation',
          description: 'Validating coordinate system and geometry',
          critical: true,
          executor: 'validate_coordinates',
        },
        {
          name: 'map_generation_prep',
          description: 'Preparing data for map generation',
          critical: false,
          executor: 'prepare_map_data',
        },
      ];

    default:
      return basePipeline;
  }
  
  return basePipeline;
}

async function executeProcessingStep(
  step: ProcessingStepTemplate,
  fileUrl: string,
  documentType: string,
  userId: string,
  projectId: string,
  existingData: any
): Promise<any> {
  
  switch (step.executor) {
    case 'validate_file':
      return await validateFile(fileUrl, documentType);
    
    case 'extract_metadata':
      return await extractMetadata(fileUrl);
    
    case 'extract_pdf_tables':
      // Call the PDF extraction Cloud Function via HTTPS
      return await callPdfExtractionFunction(fileUrl, documentType, userId, projectId);
    
    case 'extract_nvr_csv':
      return await extractNVRFromCSV(fileUrl, userId, projectId);
    
    case 'validate_nvr_data':
      return await validateNVRData(existingData.nvrData);
    
    case 'validate_nvr_pdf_data':
      return await validateNVRPDFData(existingData.tables);
    
    case 'validate_extracted_data':
      return await validateExtractedData(existingData.tables);
    
    case 'redact_sensitive_content':
      return await redactSensitiveContent(existingData);
    
    case 'parse_species_data':
      return await parseSpeciesData(fileUrl);
    
    case 'validate_taxonomy':
      return await validateTaxonomy(existingData.species);
    
    case 'extract_shapefile_data':
      return await extractShapefileData(fileUrl);
    
    case 'validate_coordinates':
      return await validateCoordinates(existingData.gisData);
    
    case 'prepare_map_data':
      return await prepareMapData(existingData.gisData);
    
    default:
      throw new Error(`Unknown processing step executor: ${step.executor}`);
  }
}

async function updateProcessingStep(
  db: any,
  documentId: string,
  stepName: string,
  status: string,
  output?: any,
  error?: string
) {
  const updateData: any = {
    [`processingSteps.${stepName}.status`]: status,
    [`processingSteps.${stepName}.${status === 'processing' ? 'startedAt' : 'completedAt'}`]: new Date(),
    updatedAt: new Date(),
  };

  if (output) {
    updateData[`processingSteps.${stepName}.output`] = output;
  }

  if (error) {
    updateData[`processingSteps.${stepName}.error`] = error;
  }

  await db.collection('documents').doc(documentId).update(updateData);
}

// Processing step implementations
async function validateFile(fileUrl: string, documentType: string): Promise<any> {
  // Basic file validation logic
  return { valid: true, fileSize: 0, mimeType: 'application/pdf' };
}

async function extractMetadata(fileUrl: string): Promise<any> {
  return { createdDate: new Date(), author: 'Unknown', pages: 0 };
}

async function validateExtractedData(tables: any[]): Promise<any> {
  return { tablesValid: true, validationErrors: [] };
}

async function redactSensitiveContent(data: any): Promise<any> {
  // Implement sensitive data redaction
  return { redacted: false, redactionCount: 0 };
}

async function parseSpeciesData(fileUrl: string): Promise<any> {
  return { species: [], speciesCount: 0 };
}

async function validateTaxonomy(species: any[]): Promise<any> {
  return { taxonomyValid: true, invalidSpecies: [] };
}

async function extractShapefileData(fileUrl: string): Promise<any> {
  return { gisData: {}, features: [], coordinateSystem: 'WGS84' };
}

async function validateCoordinates(gisData: any): Promise<any> {
  return { coordinatesValid: true, bounds: {} };
}

async function prepareMapData(gisData: any): Promise<any> {
  return { mapReady: true, layers: [] };
}

async function extractNVRFromCSV(fileUrl: string, userId: string, projectId: string): Promise<any> {
  const storage = getStorage();
  const fs = require('fs/promises');
  // const csv = require('csv-parser'); // Will be used when implementing CSV parsing
  const path = require('path');
  const os = require('os');
  const { v4: uuidv4 } = require('uuid');

  const extractionId = uuidv4();
  const tempDir = os.tmpdir();
  const tempCsvPath = path.join(tempDir, `${extractionId}.csv`);

  try {
    // Download CSV file from Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(fileUrl.replace('gs://', '').split('/').slice(1).join('/'));
    
    await file.download({ destination: tempCsvPath });

    // Parse CSV file with NVR-specific structure
    const nvrData = await parseNVRCSV(tempCsvPath);

    // Store extraction results in Firestore
    const app = getApp();
    const db = getFirestore(app);
    await db.collection('extractions').doc(extractionId).set({
      id: extractionId,
      userId,
      projectId,
      documentType: 'NVR',
      fileType: 'csv',
      status: 'completed',
      nvrData,
      recordCount: nvrData.records.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Cleanup temp file
    await fs.unlink(tempCsvPath);

    return { 
      extractionId, 
      nvrData,
      recordCount: nvrData.records.length 
    };

  } catch (error) {
    console.error('NVR CSV extraction error:', error);
    
    // Store error in Firestore
    const app = getApp();
    const db = getFirestore(app);
    await db.collection('extractions').doc(extractionId).set({
      id: extractionId,
      userId,
      projectId,
      documentType: 'NVR',
      fileType: 'csv',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    throw error;
  }
}

async function parseNVRCSV(csvPath: string): Promise<any> {
  const fs = require('fs');
  const csv = require('csv-parser');
  
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    const headers: string[] = [];
    // let isFirstRow = true; // Will be used for header detection

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('headers', (headerList: string[]) => {
        headers.push(...headerList);
      })
      .on('data', (data: any) => {
        // NVR CSV specific parsing logic
        const processedRecord = processNVRRecord(data, headers);
        if (processedRecord) {
          records.push(processedRecord);
        }
      })
      .on('end', () => {
        const result = {
          headers,
          records,
          metadata: {
            totalRecords: records.length,
            parsedAt: new Date(),
            source: 'NVR_CSV'
          },
          // NVR-specific data structure
          species: extractSpeciesFromNVR(records),
          habitats: extractHabitatsFromNVR(records),
          threats: extractThreatsFromNVR(records),
          locations: extractLocationsFromNVR(records),
        };
        resolve(result);
      })
      .on('error', (error: any) => {
        reject(error);
      });
  });
}

function processNVRRecord(data: any, headers: string[]): any {
  // NVR-specific field processing
  const processed: any = {};
  
  for (const header of headers) {
    const value = data[header];
    
    // Clean and standardize field names
    const cleanHeader = header.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Process specific NVR fields
    switch (cleanHeader) {
      case 'species_name':
      case 'scientific_name':
        processed.speciesName = value?.trim();
        break;
      case 'common_name':
        processed.commonName = value?.trim();
        break;
      case 'conservation_status':
      case 'status':
        processed.conservationStatus = value?.trim();
        break;
      case 'habitat':
      case 'habitat_type':
        processed.habitat = value?.trim();
        break;
      case 'location':
      case 'locality':
        processed.location = value?.trim();
        break;
      case 'coordinates':
      case 'lat_long':
        processed.coordinates = parseCoordinates(value);
        break;
      case 'threat_level':
      case 'threat':
        processed.threatLevel = value?.trim();
        break;
      case 'population_estimate':
      case 'population':
        processed.populationEstimate = parseNumeric(value);
        break;
      default:
        processed[cleanHeader] = value;
    }
  }
  
  return processed;
}

function extractSpeciesFromNVR(records: any[]): any[] {
  const speciesMap = new Map();
  
  records.forEach(record => {
    if (record.speciesName) {
      const key = record.speciesName.toLowerCase();
      if (!speciesMap.has(key)) {
        speciesMap.set(key, {
          scientificName: record.speciesName,
          commonName: record.commonName,
          conservationStatus: record.conservationStatus,
          recordCount: 0,
          locations: new Set(),
          habitats: new Set(),
        });
      }
      
      const species = speciesMap.get(key);
      species.recordCount++;
      if (record.location) species.locations.add(record.location);
      if (record.habitat) species.habitats.add(record.habitat);
    }
  });
  
  return Array.from(speciesMap.values()).map(species => ({
    ...species,
    locations: Array.from(species.locations),
    habitats: Array.from(species.habitats),
  }));
}

function extractHabitatsFromNVR(records: any[]): any[] {
  const habitatMap = new Map();
  
  records.forEach(record => {
    if (record.habitat) {
      const key = record.habitat.toLowerCase();
      if (!habitatMap.has(key)) {
        habitatMap.set(key, {
          name: record.habitat,
          speciesCount: new Set(),
          locations: new Set(),
        });
      }
      
      const habitat = habitatMap.get(key);
      if (record.speciesName) habitat.speciesCount.add(record.speciesName);
      if (record.location) habitat.locations.add(record.location);
    }
  });
  
  return Array.from(habitatMap.values()).map(habitat => ({
    ...habitat,
    speciesCount: habitat.speciesCount.size,
    species: Array.from(habitat.speciesCount),
    locations: Array.from(habitat.locations),
  }));
}

function extractThreatsFromNVR(records: any[]): any[] {
  const threatMap = new Map();
  
  records.forEach(record => {
    if (record.threatLevel) {
      const key = record.threatLevel.toLowerCase();
      if (!threatMap.has(key)) {
        threatMap.set(key, {
          level: record.threatLevel,
          affectedSpecies: new Set(),
          locations: new Set(),
        });
      }
      
      const threat = threatMap.get(key);
      if (record.speciesName) threat.affectedSpecies.add(record.speciesName);
      if (record.location) threat.locations.add(record.location);
    }
  });
  
  return Array.from(threatMap.values()).map(threat => ({
    ...threat,
    affectedSpeciesCount: threat.affectedSpecies.size,
    affectedSpecies: Array.from(threat.affectedSpecies),
    locations: Array.from(threat.locations),
  }));
}

function extractLocationsFromNVR(records: any[]): any[] {
  const locationMap = new Map();
  
  records.forEach(record => {
    if (record.location) {
      const key = record.location.toLowerCase();
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          name: record.location,
          coordinates: record.coordinates,
          species: new Set(),
          habitats: new Set(),
        });
      }
      
      const location = locationMap.get(key);
      if (record.speciesName) location.species.add(record.speciesName);
      if (record.habitat) location.habitats.add(record.habitat);
    }
  });
  
  return Array.from(locationMap.values()).map(location => ({
    ...location,
    speciesCount: location.species.size,
    species: Array.from(location.species),
    habitats: Array.from(location.habitats),
  }));
}

function parseCoordinates(coordString: string): { lat: number; lng: number } | null {
  if (!coordString) return null;
  
  // Try to parse various coordinate formats
  const coordPatterns = [
    /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/, // Decimal degrees
    /(\d+)°\s*(\d+)'?\s*(\d+\.?\d*)"?\s*([NS])[,\s]+(\d+)°\s*(\d+)'?\s*(\d+\.?\d*)"?\s*([EW])/, // DMS
  ];
  
  for (const pattern of coordPatterns) {
    const match = coordString.match(pattern);
    if (match) {
      if (pattern === coordPatterns[0]) {
        // Decimal degrees
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      } else if (pattern === coordPatterns[1]) {
        // DMS format
        const latDeg = parseInt(match[1]);
        const latMin = parseInt(match[2]);
        const latSec = parseFloat(match[3]);
        const latDir = match[4];
        
        const lngDeg = parseInt(match[5]);
        const lngMin = parseInt(match[6]);
        const lngSec = parseFloat(match[7]);
        const lngDir = match[8];
        
        let lat = latDeg + latMin/60 + latSec/3600;
        let lng = lngDeg + lngMin/60 + lngSec/3600;
        
        if (latDir === 'S') lat = -lat;
        if (lngDir === 'W') lng = -lng;
        
        return { lat, lng };
      }
    }
  }
  
  return null;
}

function parseNumeric(value: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

async function validateNVRData(nvrData: any): Promise<any> {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    statistics: {
      totalRecords: nvrData.records?.length || 0,
      speciesCount: nvrData.species?.length || 0,
      habitatCount: nvrData.habitats?.length || 0,
      locationCount: nvrData.locations?.length || 0,
    }
  };
  
  // Validate required fields
  if (!nvrData.records || nvrData.records.length === 0) {
    validation.errors.push('No records found in NVR data');
    validation.isValid = false;
  }
  
  // Check for species data
  if (!nvrData.species || nvrData.species.length === 0) {
    validation.warnings.push('No species information extracted');
  }
  
  // Validate coordinates if present
  let validCoordinates = 0;
  nvrData.records?.forEach((record: any, index: number) => {
    if (record.coordinates) {
      if (record.coordinates.lat < -90 || record.coordinates.lat > 90) {
        validation.errors.push(`Invalid latitude in record ${index + 1}`);
        validation.isValid = false;
      }
      if (record.coordinates.lng < -180 || record.coordinates.lng > 180) {
        validation.errors.push(`Invalid longitude in record ${index + 1}`);
        validation.isValid = false;
      }
      if (validation.isValid) validCoordinates++;
    }
  });
  
  (validation.statistics as any).validCoordinates = validCoordinates;
  
  return validation;
}

async function validateNVRPDFData(tables: any[]): Promise<any> {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    nvrSpecificChecks: {
      hasSpeciesTable: false,
      hasLocationTable: false,
      hasConservationStatusTable: false,
    }
  };
  
  if (!tables || tables.length === 0) {
    validation.errors.push('No tables found in NVR PDF');
    validation.isValid = false;
    return validation;
  }
  
  // Check for NVR-specific table structures
  tables.forEach((table: any) => {
    const headers = table.headers?.map((h: string) => h.toLowerCase()) || [];
    
    // Check for species information table
    if (headers.some((h: string) => h.includes('species') || h.includes('scientific'))) {
      validation.nvrSpecificChecks.hasSpeciesTable = true;
    }
    
    // Check for location/coordinates table
    if (headers.some((h: string) => h.includes('location') || h.includes('coordinate') || h.includes('lat'))) {
      validation.nvrSpecificChecks.hasLocationTable = true;
    }
    
    // Check for conservation status table
    if (headers.some((h: string) => h.includes('conservation') || h.includes('status') || h.includes('threat'))) {
      validation.nvrSpecificChecks.hasConservationStatusTable = true;
    }
  });
  
  // Add warnings for missing NVR-specific data
  if (!validation.nvrSpecificChecks.hasSpeciesTable) {
    validation.warnings.push('No species information table detected');
  }
  if (!validation.nvrSpecificChecks.hasLocationTable) {
    validation.warnings.push('No location/coordinate table detected');
  }
  if (!validation.nvrSpecificChecks.hasConservationStatusTable) {
    validation.warnings.push('No conservation status table detected');
  }
  
  return validation;
}

/**
 * Call the PDF extraction function by importing and executing it directly
 */
async function callPdfExtractionFunction(
  fileUrl: string, 
  documentType: string, 
  userId: string, 
  projectId: string
): Promise<any> {
  try {
    console.log(`=== STARTING PDF EXTRACTION ===`);
    console.log(`Document Type: ${documentType}`);
    console.log(`File URL: ${fileUrl}`);
    console.log(`User ID: ${userId}`);
    console.log(`Project ID: ${projectId}`);
    
    // Import the PDF extraction function module
    console.log(`Importing PDF extraction module...`);
    const pdfExtractionModule = await import('./pdf-extraction');
    console.log(`PDF extraction module imported successfully`);
    
    // Call the internal function directly 
    console.log(`Calling extractPdfTablesInternal...`);
    const result = await pdfExtractionModule.extractPdfTablesInternal(fileUrl, documentType, userId, projectId);
    
    console.log(`=== PDF EXTRACTION COMPLETED ===`);
    console.log(`Result status: ${result.status}`);
    console.log(`Result extractionId: ${result.extractionId}`);
    console.log(`Result tables count: ${result.tables ? result.tables.length : 0}`);
    console.log(`Full result:`, JSON.stringify(result, null, 2));
    
    return { 
      extractionId: result.extractionId, 
      tables: result.tables || [],
      success: result.status === 'completed'
    };
    
  } catch (error) {
    console.error(`=== PDF EXTRACTION FAILED ===`);
    console.error(`Error type: ${error?.constructor?.name}`);
    console.error(`Error message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`Error stack:`, error instanceof Error ? error.stack : undefined);
    console.error(`Full error:`, error);
    throw new Error(`PDF table extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
