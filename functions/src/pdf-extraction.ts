/**
 * PDF Table Extraction Service
 * Wraps existing Python pdfplumber script for Cloud Functions
 */

import { onCall } from 'firebase-functions/v2/https';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore } from 'firebase-admin/firestore';
import { getApp } from 'firebase-admin/app';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import pdfParse from 'pdf-parse';

interface ExtractPdfTablesRequest {
  fileUrl: string;
  documentType: 'NVR' | 'PMR' | 'BVD';
  userId: string;
  projectId: string;
  extractionId?: string;
}

interface ExtractPdfTablesResponse {
  extractionId: string;
  status: 'processing' | 'completed' | 'failed';
  tables?: TableData[];
  error?: string;
}

interface TableData {
  pageNumber: number | number[];
  tableIndex: number;
  tableName?: string;
  description?: string;
  headers: string[];
  rows: string[][];
  processed_data?: any[];
  record_count?: number;
  mergedCells: MergedCellInfo[];
  bbox: [number, number, number, number]; // x0, y0, x1, y1
  validation?: any; // Validation metrics and scores
}

interface MergedCellInfo {
  row: number;
  col: number;
  rowspan: number;
  colspan: number;
}

/**
 * Internal PDF extraction logic that can be called directly
 */
export async function extractPdfTablesInternal(
  fileUrl: string,
  documentType: string,
  userId: string,
  projectId: string,
  extractionId: string = uuidv4()
): Promise<ExtractPdfTablesResponse> {
    
    const app = getApp();
    const db = getFirestore(app);
    const storage = getStorage();
    
    try {
      // Update extraction status to processing
      await db.collection('extractions').doc(extractionId).set({
        id: extractionId,
        userId,
        projectId,
        documentType,
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Download PDF file to temporary location
      const tempDir = os.tmpdir();
      const tempPdfPath = path.join(tempDir, `${extractionId}.pdf`);
      const tempOutputPath = path.join(tempDir, `${extractionId}_output.json`);

      // Download file from Firebase Storage
      console.log(`File URL: ${fileUrl}`);
      const bucket = storage.bucket();
      
      // Parse the file URL properly
      let filePath: string;
      try {
        console.log(`Starting file URL parsing...`);
        if (fileUrl.startsWith('gs://')) {
          console.log(`Processing gs:// URL`);
          filePath = fileUrl.replace('gs://', '').split('/').slice(1).join('/');
        } else if (fileUrl.includes('firebasestorage.googleapis.com')) {
          console.log(`Processing Firebase Storage URL`);
          // Parse Firebase Storage download URL
          const urlParts = fileUrl.split('/o/')[1];
          console.log(`URL parts after /o/: ${urlParts}`);
          if (urlParts) {
            filePath = decodeURIComponent(urlParts.split('?')[0]);
            console.log(`Decoded file path: ${filePath}`);
          } else {
            throw new Error(`Invalid Firebase Storage URL: ${fileUrl}`);
          }
        } else {
          throw new Error(`Unsupported file URL format: ${fileUrl}`);
        }
        
        console.log(`Parsed file path: ${filePath}`);
        const file = bucket.file(filePath);
        
        console.log(`Downloading file to: ${tempPdfPath}`);
        await file.download({ destination: tempPdfPath });
        
        const fs = require('fs').promises;
        const stats = await fs.stat(tempPdfPath);
        console.log(`Download completed, file size: ${stats.size} bytes`);
      } catch (parseError) {
        console.error(`File parsing/download error:`, parseError);
        throw parseError;
      }

      // Extract tables using Node.js PDF libraries
      console.log(`Starting Node.js PDF extraction...`);
      
      const extractionResult = await extractTablesFromPdf(tempPdfPath, documentType);
      
      console.log(`Node.js extraction completed`);

      if (extractionResult.success) {
        // Store extraction results with enhanced NVR data
        const extractionData: any = {
          status: 'completed',
          tables: extractionResult.tables,
          tableCount: extractionResult.tables.length,
          updatedAt: new Date(),
        };

        // Add NVR-specific metadata if available
        if (extractionResult.tables.length > 0) {
          const tableNames = extractionResult.tables.map(t => t.tableName).filter(Boolean);
          const totalRecords = extractionResult.tables.reduce((sum, t) => sum + (t.record_count || 0), 0);
          
          extractionData.nvrMetadata = {
            sectionsExtracted: tableNames,
            totalRecords,
            extractionType: 'threatened_species_focus'
          };
        }

        await db.collection('extractions').doc(extractionId).update(extractionData);

        return {
          extractionId,
          status: 'completed' as const,
          tables: extractionResult.tables,
        };
      } else {
        // Store error
        await db.collection('extractions').doc(extractionId).update({
          status: 'failed',
          error: extractionResult.error,
          updatedAt: new Date(),
        });

        return {
          extractionId,
          status: 'failed' as const,
          error: extractionResult.error,
        };
      }

    } catch (error: any) {
      console.error('PDF extraction error:', error);
      
      // Update extraction status to failed
      await db.collection('extractions').doc(extractionId).update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        updatedAt: new Date(),
      });

      return {
        extractionId,
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
}

export const extractPdfTables = onCall({
  region: 'australia-southeast1',
  memory: '2GiB',
  timeoutSeconds: 540,
  cors: true,
}, async (request: any) => {
    const { fileUrl, documentType, userId, projectId, extractionId = uuidv4() } = request.data;
    
    // Call the Python extractor
    return await callPythonExtractor(fileUrl, documentType, extractionId);
});

/**
 * Call the Python Cloud Function for PDF extraction
 */
async function callPythonExtractor(
  fileUrl: string,
  documentType: string, 
  extractionId: string
): Promise<any> {
  try {
    console.log(`Calling Python extractor for: ${fileUrl}`);
    
    // Call the Python Cloud Function
    const pythonFunctionUrl = `https://extractpdftables-svcb3dmala-ts.a.run.app`; // You'll need to update this URL after deployment
    
    const response = await fetch(pythonFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileUrl,
        documentType,
        extractionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`Python function returned status ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`Python extractor returned ${result.tables?.length || 0} tables`);
    
    return result;
    
  } catch (error: any) {
    console.error(`Python extractor error: ${error.message}`);
    throw error;
  }
}

/**
 * Legacy Node.js extraction - kept as fallback
 */
async function extractTablesFromPdf(
  pdfPath: string, 
  documentType: string
): Promise<{ tables: TableData[], success: boolean, error?: string, validation?: any, debugInfo?: any }> {
  try {
    console.log(`Parsing PDF: ${pdfPath}`);
    
    // Read PDF file
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log(`PDF file size: ${pdfBuffer.length} bytes`);
    
    // Extract text from PDF
    const pdfData = await pdfParse(pdfBuffer);
    console.log(`Extracted text length: ${pdfData.text.length} characters`);
    console.log(`Number of pages: ${pdfData.numpages}`);
    
    // Parse tables from extracted text
    const tables = await parseTablesFromText(pdfData.text, documentType);
    
    console.log(`Found ${tables.length} tables`);
    
    // Debug: Save extracted text for inspection (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`DEBUG: Full extracted text (first 1000 chars):`);
      console.log(pdfData.text.substring(0, 1000));
      console.log(`DEBUG: Text length: ${pdfData.text.length} characters`);
    }
    
    // Validate extracted data quality
    const validationResult = validateExtractedData(tables, documentType);
    
    // Prepare debug info
    const lines = pdfData.text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    return {
      tables: validationResult.validTables,
      success: true,
      validation: validationResult.summary,
      debugInfo: process.env.NODE_ENV === 'development' ? {
        extractedTextPreview: pdfData.text.substring(0, 500),
        lineCount: lines.length,
        tabularLines: lines.filter(line => hasTabularStructure(line)).length
      } : undefined
    };
    
  } catch (error: any) {
    console.error(`PDF extraction error:`, error);
    return {
      tables: [],
      success: false,
      error: error.message
    };
  }
}

/**
 * Parse tables from extracted PDF text
 */
async function parseTablesFromText(text: string, documentType: string): Promise<TableData[]> {
  console.log(`Parsing tables from text for document type: ${documentType}`);
  
  const tables: TableData[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // NVR-specific table detection patterns
  if (documentType.toUpperCase() === 'NVR') {
    console.log(`DEBUG: Processing NVR document with ${lines.length} lines`);
    console.log(`DEBUG: First 10 lines:`, lines.slice(0, 10));
    console.log(`DEBUG: Sample lines containing 'species':`, lines.filter(line => line.toLowerCase().includes('species')).slice(0, 5));
    
    const nvrTables = parseNVRTables(lines);
    console.log(`DEBUG: Found ${nvrTables.length} NVR tables`);
    tables.push(...nvrTables);
  }
  
  // Generic table detection for other document types
  if (tables.length === 0) {
    console.log(`DEBUG: No NVR tables found, trying generic detection...`);
    console.log(`DEBUG: Lines with tabular structure:`, lines.filter(line => hasTabularStructure(line)).slice(0, 5));
    
    const genericTables = parseGenericTables(lines);
    console.log(`DEBUG: Found ${genericTables.length} generic tables`);
    tables.push(...genericTables);
  }
  
  return tables;
}

/**
 * Parse NVR-specific table structures
 */
function parseNVRTables(lines: string[]): TableData[] {
  const tables: TableData[] = [];
  let currentTable: any = null;
  let tableIndex = 0;
  
  // Look for table headers with species-related keywords (expanded list)
  const speciesKeywords = [
    'species', 'scientific name', 'common name', 'conservation status', 
    'threatened', 'flora', 'fauna', 'location', 'recorded', 'observed',
    'family', 'genus', 'endemic', 'native', 'exotic', 'weed', 'rare',
    'vulnerable', 'endangered', 'critically', 'habitat', 'abundance',
    'population', 'distribution', 'occurrence', 'present', 'absent'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Detect potential table headers (multiple methods)
    const isTableHeader = speciesKeywords.some(keyword => line.includes(keyword)) ||
                         line.includes('table') ||
                         line.includes('appendix') ||
                         hasTabularStructure(lines[i]) ||
                         /SpeciesCommon.*Name.*Recorded/i.test(line) || // Run-together NVR header
                         /Species.*SSN.*Bio.*Count/i.test(line) || // Another NVR pattern
                         (lines[i+1] && hasTabularStructure(lines[i+1]) && hasTabularStructure(lines[i+2]));
    
    if (isTableHeader) {
      // Start a new table
      if (currentTable && currentTable.rows.length > 0) {
        tables.push(currentTable);
      }
      
      const headers = parseTableRow(lines[i]);
      currentTable = createNewTable(headers, tableIndex++);
      console.log(`Found table header: ${lines[i]}`);
      console.log(`Parsed headers: ${JSON.stringify(headers)}`);
      
      // Look for data rows following the header
      for (let j = i + 1; j < lines.length && j < i + 50; j++) {
        const dataLine = lines[j];
        
        // Stop if we hit another table or section
        if (isLikelyNewSection(dataLine)) {
          break;
        }
        
        // Parse potential data row
        const rowData = parseTableRow(dataLine);
        if (isValidDataRow(rowData, headers)) {
          currentTable.rows.push(rowData);
          
          // Extract species information
          const speciesData = extractSpeciesFromRow(rowData, headers);
          if (speciesData) {
            currentTable.processed_data.push(speciesData);
            currentTable.record_count++;
          }
        }
      }
    }
  }
  
  // Add the last table if it exists
  if (currentTable && currentTable.rows.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Parse generic table structures
 */
function parseGenericTables(lines: string[]): TableData[] {
  const tables: TableData[] = [];
  let tableIndex = 0;
  
  // Look for lines that appear to be tabular data
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1];
    
    // Simple heuristic: lines with multiple columns separated by spaces/tabs
    if (hasTabularStructure(line) && hasTabularStructure(nextLine)) {
      const headers = parseTableRow(line);
      const table = createNewTable(headers, tableIndex++);
      
      // Collect subsequent rows
      for (let j = i + 1; j < lines.length; j++) {
        const dataLine = lines[j];
        if (!hasTabularStructure(dataLine)) break;
        
        const rowData = parseTableRow(dataLine);
        if (rowData.length === headers.length) {
          table.rows.push(rowData);
        }
      }
      
      if (table.rows.length > 0) {
        tables.push(table);
      }
    }
  }
  
  return tables;
}

/**
 * Helper functions for table parsing
 */
function createNewTable(headers: string[], tableIndex: number): TableData {
  return {
    pageNumber: 1, // PDF-parse doesn't provide page-specific data easily
    tableIndex,
    tableName: inferTableName(headers),
    headers,
    rows: [],
    processed_data: [],
    record_count: 0,
    mergedCells: [],
    bbox: [0, 0, 0, 0]
  };
}

function parseTableRow(line: string): string[] {
  // Handle both spaced and run-together text
  
  // First try normal spacing (multiple spaces, tabs, pipes)
  let parts = line.split(/\s{2,}|\t+|\|/).map(cell => cell.trim()).filter(cell => cell.length > 0);
  
  // If we get very few parts, try to split run-together NVR headers/data
  if (parts.length <= 2 && line.length > 30) {
    // Look for common NVR column patterns that might be run together
    const nvrColumnPattern = /(Species|Common Name|SSN|SBio|Observation Count|Last Recorded|Scientific Name|Status|Date|Location|Easting|Northing|Accuracy)/gi;
    const matches = [...line.matchAll(nvrColumnPattern)];
    
    if (matches.length >= 3) {
      // Use the positions of known column headers to split
      parts = [];
      let lastEnd = 0;
      
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (i > 0) {
          // Add the text before this match as a column
          const prevText = line.substring(lastEnd, match.index).trim();
          if (prevText) parts.push(prevText);
        }
        
        // Add the matched column header
        parts.push(match[0]);
        lastEnd = match.index! + match[0].length;
      }
      
      // Add any remaining text
      const remaining = line.substring(lastEnd).trim();
      if (remaining) parts.push(remaining);
    }
    
    // If still unsuccessful, try splitting on capital letters (camelCase/PascalCase boundaries)
    if (parts.length <= 2) {
      const camelSplit = line.split(/(?=[A-Z][a-z])|(?<=[a-z])(?=[A-Z])/).filter(p => p.trim().length > 0);
      if (camelSplit.length > parts.length) {
        parts = camelSplit.map(p => p.trim());
      }
    }
  }
  
  return parts.filter(cell => cell.length > 0);
}

function hasTabularStructure(line: string): boolean {
  const parts = parseTableRow(line);
  
  // Special handling for run-together NVR headers
  const isNVRHeader = /SpeciesCommon|LastRecorded|ObservationCount|ScientificName/i.test(line);
  
  return (parts.length >= 2 && parts.length <= 15) || // Normal case
         isNVRHeader || // Known NVR run-together header
         (line.length > 40 && parts.length >= 2 && // Long line with some structure
          parts.some(part => part.length > 2) && 
          !line.match(/^(page|figure|table|appendix|section|\d+\.?\s)/i));
}

function isValidDataRow(rowData: string[], headers: string[]): boolean {
  return rowData.length >= Math.floor(headers.length * 0.5); // At least half the columns filled
}

function isLikelyNewSection(line: string): boolean {
  const lowerLine = line.toLowerCase();
  return lowerLine.includes('appendix') || 
         lowerLine.includes('section') || 
         lowerLine.includes('table') ||
         lowerLine.includes('figure');
}

function inferTableName(headers: string[]): string {
  const headerText = headers.join(' ').toLowerCase();
  
  if (headerText.includes('flora') || headerText.includes('plant')) {
    return 'Threatened Flora';
  } else if (headerText.includes('fauna') || headerText.includes('animal')) {
    return 'Threatened Fauna';
  } else if (headerText.includes('species')) {
    return 'Species List';
  } else {
    return 'Data Table';
  }
}

function extractSpeciesFromRow(rowData: string[], headers: string[]): any | null {
  const speciesRecord: any = {};
  let hasSpeciesData = false;
  
  for (let i = 0; i < headers.length && i < rowData.length; i++) {
    const header = headers[i].toLowerCase();
    const value = rowData[i].trim();
    
    if (!value || value === '-' || value === 'n/a') continue;
    
    // Map headers to species data fields
    if (header.includes('species') || header.includes('scientific')) {
      speciesRecord.scientificName = value;
      hasSpeciesData = true;
    } else if (header.includes('common')) {
      speciesRecord.commonName = value;
    } else if (header.includes('status') || header.includes('conservation')) {
      speciesRecord.conservationStatus = value;
    } else if (header.includes('location') || header.includes('locality')) {
      speciesRecord.location = value;
    } else if (header.includes('date') || header.includes('recorded') || header.includes('observed')) {
      speciesRecord.lastRecorded = value;
    }
  }
  
  return hasSpeciesData ? speciesRecord : null;
}

/**
 * Validate extracted data quality and completeness
 */
function validateExtractedData(tables: TableData[], documentType: string): {
  validTables: TableData[],
  summary: {
    totalTables: number,
    validTables: number,
    totalRecords: number,
    validRecords: number,
    qualityScore: number,
    warnings: string[]
  }
} {
  const warnings: string[] = [];
  const validTables: TableData[] = [];
  let totalRecords = 0;
  let validRecords = 0;

  console.log(`Validating ${tables.length} tables for document type: ${documentType}`);

  for (const table of tables) {
    const tableValidation = validateTable(table, documentType);
    totalRecords += table.processed_data?.length || 0;
    
    if (tableValidation.isValid) {
      validTables.push({
        ...table,
        processed_data: tableValidation.validRecords,
        record_count: tableValidation.validRecords.length,
        validation: tableValidation.metrics
      });
      validRecords += tableValidation.validRecords.length;
    } else {
      warnings.push(`Table "${table.tableName || `Table ${table.tableIndex}`}": ${tableValidation.reason}`);
    }
    
    if (tableValidation.warnings.length > 0) {
      warnings.push(...tableValidation.warnings);
    }
  }

  // Calculate overall quality score
  const qualityScore = totalRecords > 0 ? (validRecords / totalRecords) * 100 : 0;

  // Add quality warnings
  if (qualityScore < 50) {
    warnings.push('⚠️ Low data quality: Less than 50% of records contain valid species information');
  } else if (qualityScore < 80) {
    warnings.push('⚠️ Moderate data quality: Some records may be incomplete');
  }

  console.log(`Validation complete: ${validRecords}/${totalRecords} valid records (${qualityScore.toFixed(1)}% quality)`);

  return {
    validTables,
    summary: {
      totalTables: tables.length,
      validTables: validTables.length,
      totalRecords,
      validRecords,
      qualityScore: Math.round(qualityScore),
      warnings
    }
  };
}

/**
 * Validate individual table data
 */
function validateTable(table: TableData, documentType: string): {
  isValid: boolean,
  reason?: string,
  validRecords: any[],
  warnings: string[],
  metrics: any
} {
  const warnings: string[] = [];
  const validRecords: any[] = [];

  // Basic table structure validation
  if (!table.headers || table.headers.length === 0) {
    return {
      isValid: false,
      reason: 'No headers found',
      validRecords: [],
      warnings: [],
      metrics: {}
    };
  }

  if (!table.processed_data || table.processed_data.length === 0) {
    return {
      isValid: false,
      reason: 'No processed data found',
      validRecords: [],
      warnings: [],
      metrics: {}
    };
  }

  // Validate each record
  for (const record of table.processed_data) {
    const recordValidation = validateSpeciesRecord(record, documentType);
    
    if (recordValidation.isValid) {
      validRecords.push(recordValidation.cleanedRecord);
    } else {
      warnings.push(`Invalid record: ${recordValidation.reason}`);
    }
  }

  // Calculate table metrics
  const metrics = {
    headerCount: table.headers.length,
    totalRows: table.rows?.length || 0,
    processedRecords: table.processed_data.length,
    validRecords: validRecords.length,
    completenessScore: validRecords.length > 0 ? 
      (validRecords.filter(r => r.scientificName && r.commonName).length / validRecords.length) * 100 : 0
  };

  // Table must have at least one valid record to be considered valid
  const isValid = validRecords.length > 0;

  return {
    isValid,
    reason: isValid ? undefined : 'No valid species records found',
    validRecords,
    warnings,
    metrics
  };
}

/**
 * Validate individual species record
 */
function validateSpeciesRecord(record: any, documentType: string): {
  isValid: boolean,
  reason?: string,
  cleanedRecord: any
} {
  if (!record || typeof record !== 'object') {
    return {
      isValid: false,
      reason: 'Record is not an object',
      cleanedRecord: null
    };
  }

  // Clean and validate scientific name
  const scientificName = cleanSpeciesName(record.scientificName);
  if (!scientificName || !isValidScientificName(scientificName)) {
    return {
      isValid: false,
      reason: `Invalid scientific name: ${record.scientificName}`,
      cleanedRecord: null
    };
  }

  // Clean other fields
  const cleanedRecord = {
    scientificName,
    commonName: cleanString(record.commonName),
    conservationStatus: cleanString(record.conservationStatus),
    location: cleanString(record.location),
    lastRecorded: cleanDate(record.lastRecorded),
    confidence: calculateRecordConfidence(record)
  };

  return {
    isValid: true,
    cleanedRecord
  };
}

/**
 * Clean and validate species names
 */
function cleanSpeciesName(name: string): string | null {
  if (!name || typeof name !== 'string') return null;
  
  // Remove extra whitespace and normalize
  const cleaned = name.trim().replace(/\s+/g, ' ');
  
  // Basic scientific name pattern (Genus species)
  if (cleaned.length < 3 || cleaned.length > 100) return null;
  
  return cleaned;
}

/**
 * Validate scientific name format
 */
function isValidScientificName(name: string): boolean {
  // Basic validation: should contain at least two words (Genus species)
  const words = name.split(' ').filter(w => w.length > 0);
  
  // Should have at least genus and species
  if (words.length < 2) return false;
  
  // First letter should be uppercase (genus)
  if (!/^[A-Z]/.test(words[0])) return false;
  
  // Should not contain numbers or special characters (basic check)
  if (/\d|[^\w\s\-\.]/.test(name)) return false;
  
  return true;
}

/**
 * Clean string fields
 */
function cleanString(value: any): string | null {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 && cleaned !== '-' && cleaned !== 'n/a' ? cleaned : null;
}

/**
 * Clean and validate dates
 */
function cleanDate(value: any): string | null {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.trim();
  
  // Basic date validation - just check if it looks like a date
  if (cleaned.length < 4 || cleaned === '-' || cleaned === 'n/a') return null;
  
  return cleaned;
}

/**
 * Calculate confidence score for a record
 */
function calculateRecordConfidence(record: any): number {
  let score = 0;
  
  if (record.scientificName) score += 40; // Most important
  if (record.commonName) score += 20;
  if (record.conservationStatus) score += 20;
  if (record.location) score += 10;
  if (record.lastRecorded) score += 10;
  
  return Math.min(score, 100);
}
