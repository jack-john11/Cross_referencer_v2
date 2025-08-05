/**
 * CSV Cross-Referencing Job Processor
 *
 * This Cloud Function is triggered when a new job document is created in Firestore.
 * It downloads two specified CSV files, parses them, finds common values in
 * the specified columns, and writes the results back to the job document.
 */

import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as Papa from 'papaparse';
import { CrossReferenceJob, CsvInput, JOBS_COLLECTION, AUDIT_ACTIONS } from 'packages/shared-types/src/index';

// Ensure Firebase is initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = getFirestore();
const storage = getStorage();

/**
 * Parses a CSV file from a local path and extracts data from a specific column.
 * @param filePath The local path to the CSV file.
 * @param columnIdentifier The name or index of the column to extract.
 * @returns A Promise that resolves to a Set of values from the specified column.
 */
const parseCsvColumn = (filePath: string, columnIdentifier: string | number): Promise<Set<string>> => {
  return new Promise((resolve, reject) => {
    const columnData = new Set<string>();
    let columnIndex = -1;

    const fileStream = fs.createReadStream(filePath);

    Papa.parse(fileStream, {
      header: true, // Assumes first row is the header
      skipEmptyLines: true,
      step: (results, parser) => {
        if (results.errors.length > 0) {
          console.error('Parsing errors:', results.errors);
        }
        
        let value: string | undefined;

        if (typeof columnIdentifier === 'string') {
          value = (results.data as any)[columnIdentifier];
        } else {
           if (columnIndex === -1) {
             columnIndex = typeof columnIdentifier === 'number' ? columnIdentifier : parseInt(columnIdentifier, 10);
           }
           const row = results.data as string[];
           value = row[columnIndex];
        }

        if (value !== undefined && value !== null && String(value).trim() !== '') {
          columnData.add(String(value).trim());
        }
      },
      complete: () => {
        console.log(`Successfully parsed ${columnData.size} unique values from ${filePath}`);
        resolve(columnData);
      },
      error: (error: Error) => {
        console.error(`Failed to parse CSV at ${filePath}:`, error);
        reject(error);
      },
    });
  });
};

/**
 * Downloads a file from Firebase Storage to a temporary local directory.
 * @param csvInput The CsvInput object containing file details.
 * @returns The local path to the downloaded file.
 */
async function downloadFile(csvInput: CsvInput): Promise<string> {
    const bucket = storage.bucket();
    const tempFilePath = path.join(os.tmpdir(), csvInput.fileName);
    
    console.log(`Downloading ${csvInput.storagePath} to ${tempFilePath}...`);
    
    await bucket.file(csvInput.storagePath).download({ destination: tempFilePath });
    
    console.log(`Successfully downloaded ${csvInput.fileName}.`);
    return tempFilePath;
}

/**
 * Updates the job document in Firestore with progress or final results.
 * @param jobId The ID of the job to update.
 * @param data The data to update.
 */
async function updateJob(jobId: string, data: Partial<Omit<CrossReferenceJob, 'auditTrail'>> & { auditTrail?: FieldValue }) {
  const jobRef = db.collection(JOBS_COLLECTION).doc(jobId);
  const updateData: { [key: string]: any } = { ...data, updatedAt: new Date() };

  if (data.auditTrail) {
    updateData.auditTrail = FieldValue.arrayUnion(data.auditTrail);
  }

  await jobRef.update(updateData);
}


export const processCrossReferenceJob = functions
  .region('australia-southeast1')
  .firestore.document(`${JOBS_COLLECTION}/{jobId}`)
  .onCreate(async (snap, context) => {
    const job = snap.data() as CrossReferenceJob;
    const { jobId } = context.params;

    console.log(`Processing new job: ${job.name} (${jobId})`);

    await updateJob(jobId, { 
      status: 'processing',
      auditTrail: {
        action: AUDIT_ACTIONS.UPDATE_STATUS,
        status: 'processing',
        timestamp: new Date(),
        userId: job.userId,
      } as any
    });

    let sourceFilePath: string | undefined;
    let referenceFilePath: string | undefined;

    try {
      // 1. Download both files
      sourceFilePath = await downloadFile(job.sourceFile);
      referenceFilePath = await downloadFile(job.referenceFile);

      // 2. Parse both files and extract column data
      const [sourceData, referenceData] = await Promise.all([
        parseCsvColumn(sourceFilePath, job.sourceFile.columnIdentifier),
        parseCsvColumn(referenceFilePath, job.referenceFile.columnIdentifier),
      ]);
      
      console.log(`Found ${sourceData.size} unique values in source and ${referenceData.size} in reference.`);

      // 3. Find the intersection (common values)
      const commonValues = new Set([...sourceData].filter(value => referenceData.has(value)));
      const results = Array.from(commonValues);
      
      console.log(`Found ${results.length} common values.`);

      // 4. Update job with results
      await updateJob(jobId, {
        status: 'completed',
        results: results,
        auditTrail: {
          action: AUDIT_ACTIONS.COMPLETE,
          resultsCount: results.length,
          timestamp: new Date(),
          userId: job.userId,
        } as any
      });

    } catch (error: any) {
      console.error(`Job ${jobId} failed:`, error);
      await updateJob(jobId, {
        status: 'failed',
        error: error.message || 'An unknown error occurred.',
        auditTrail: {
          action: AUDIT_ACTIONS.FAIL,
          error: error.message,
          timestamp: new Date(),
          userId: job.userId,
        } as any
      });
    } finally {
      // 5. Clean up temporary files
      if (sourceFilePath) fs.unlinkSync(sourceFilePath);
      if (referenceFilePath) fs.unlinkSync(referenceFilePath);
      console.log(`Finished job ${jobId} and cleaned up temp files.`);
    }
  });
