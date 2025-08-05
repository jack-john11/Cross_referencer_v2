/**
 * Jobs API Endpoint
 * 
 * Handles HTTP requests for creating, listing, and managing Cross-Reference Jobs.
 */

import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { CrossReferenceJob, JobCreateInput, JOBS_COLLECTION, AUDIT_ACTIONS } from 'shared-types'
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const db = getFirestore()

// Middleware for user authentication (placeholder)
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // TODO: Replace with actual Firebase Authentication check
  const userId = req.headers['x-user-id'] as string || 'test-user'
  if (!userId) {
    res.status(401).send({ error: 'Unauthorized' })
    return
  }
  ;(req as any).userId = userId
  next()
}

// Create a new job
app.post('/', authenticateUser, async (req, res) => {
  try {
    const jobInput: JobCreateInput = req.body
    const userId = (req as any).userId
    const jobId = uuidv4()

    const newJob: CrossReferenceJob = {
      id: jobId,
      ...jobInput,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending', // The backend function will pick up jobs in 'pending' state
      auditTrail: [{
        action: AUDIT_ACTIONS.CREATE,
        userId,
        timestamp: new Date()
      }]
    }

    await db.collection(JOBS_COLLECTION).doc(jobId).set(newJob)
    
    res.status(201).send(newJob)
  } catch (error: any) {
    console.error("Failed to create job:", error)
    res.status(500).send({ error: error.message })
  }
})

// List all jobs for the user
app.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = (req as any).userId
    const snapshot = await db.collection(JOBS_COLLECTION).where('userId', '==', userId).get()
    const jobs = snapshot.docs.map(doc => doc.data() as CrossReferenceJob)
    res.status(200).send(jobs)
  } catch (error: any) {
    console.error("Failed to list jobs:", error)
    res.status(500).send({ error: error.message })
  }
})

export const jobApi = functions.https.onRequest(app)
