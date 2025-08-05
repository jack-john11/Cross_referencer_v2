import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { getFirestore } from 'firebase-admin/firestore'
import { ProjectService } from '../../services/data-management/project-service'

import express from 'express'
import cors from 'cors'

// Initialize Express app
const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// Initialize Firestore and Project Service
const db = getFirestore()
const projectService = new ProjectService(db)

// Middleware for user authentication (placeholder)
const authenticateUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // TODO: Replace with actual Firebase Authentication check
  const userId = req.headers['x-user-id']
  if (!userId || typeof userId !== 'string') {
    res.status(401).send('Unauthorized')
    return
  }
  ;(req as any).userId = userId
  next()
}

// Routes
app.post('/', authenticateUser, async (req, res) => {
  try {
    const project = await projectService.createProject(req.body, (req as any).userId)
    res.status(201).send(project)
  } catch (error) {
    const { statusCode, message } = projectService.handleError(error)
    res.status(statusCode).send({ error: message })
  }
})

app.get('/', authenticateUser, async (req, res) => {
  try {
    const projects = await projectService.getProjects((req as any).userId)
    res.status(200).send(projects)
  } catch (error) {
    const { statusCode, message } = projectService.handleError(error)
    res.status(statusCode).send({ error: message })
  }
})

app.get('/:id', authenticateUser, async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id, (req as any).userId)
    if (!project) {
      res.status(404).send({ error: 'Project not found' })
    } else {
      res.status(200).send(project)
    }
  } catch (error) {
    const { statusCode, message } = projectService.handleError(error)
    res.status(statusCode).send({ error: message })
  }
})

app.patch('/:id', authenticateUser, async (req, res) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, (req as any).userId)
    res.status(200).send(project)
  } catch (error) {
    const { statusCode, message } = projectService.handleError(error)
    res.status(statusCode).send({ error: message })
  }
})

// Export the Express API as a Cloud Function
export const projectApi = functions.https.onRequest(app)
