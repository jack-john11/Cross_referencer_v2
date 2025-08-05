/**
 * Cross-Referencer Cloud Functions
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

// --- Export Functions ---

// New CSV job processor
export { processCrossReferenceJob } from './job-processor';

// WebSocket handler for real-time updates (can be reused)
export { handleWebSocketConnection } from './websocket-handler';

// Main API handler (will need refactoring for jobs)
export { projectApi as jobApi } from './api/jobs';

// Simple hello world function for testing deployment
export const helloWorld = onRequest((request, response) => {
  response.json({ message: 'Cross-Referencer Cloud Functions are running!' });
});
