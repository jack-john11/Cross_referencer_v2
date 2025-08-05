/**
 * EcoloGen Cloud Functions
 * Main entry point for serverless backend functions
 */

import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

// Initialize Firebase Admin
initializeApp();

// Set global options for Australian region compliance
setGlobalOptions({
  region: 'australia-southeast1',
  memory: '1GiB',
  timeoutSeconds: 540,
});

// Simple hello world function for initial deployment
export const helloWorld = onRequest((request, response) => {
  response.json({ message: 'EcoloGen Cloud Functions are running!' });
});

// Export all functions - now restored from temp
export { extractPdfTables } from './pdf-extraction';
export { processDocument } from './document-processing';  
export { generateReportSection } from './ai-generation';
export { handleWebSocketConnection } from './websocket-handler';

// Project management API
export { projectApi } from './api/projects';