import * as admin from 'firebase-admin'
import {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  AUDIT_ACTIONS,
  PROJECT_COLLECTION,
} from '@ecologen/shared-types'
import { v4 as uuidv4 } from 'uuid'

export class ProjectService {
  private db: admin.firestore.Firestore

  constructor(db: admin.firestore.Firestore) {
    this.db = db
  }

  async createProject(input: ProjectCreateInput, userId: string): Promise<Project> {
    const projectId = uuidv4()
    const project: Project = {
      ...input,
      id: projectId,
      userId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      correlationId: uuidv4(),
      auditTrail: {
        action: AUDIT_ACTIONS.CREATE,
        userId,
        timestamp: new Date(),
      },
    }
    await this.db.collection(PROJECT_COLLECTION).doc(projectId).set(project)
    return project
  }

  async getProjects(userId: string): Promise<Project[]> {
    const snapshot = await this.db.collection(PROJECT_COLLECTION).where('userId', '==', userId).get()
    return snapshot.docs.map(doc => doc.data() as Project)
  }

  async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const doc = await this.db.collection(PROJECT_COLLECTION).doc(projectId).get()
    const project = doc.data() as Project | undefined
    if (!project || project.userId !== userId) {
      return null
    }
    return project
  }

  async updateProject(projectId: string, updates: ProjectUpdateInput, userId: string): Promise<Project> {
    const projectRef = this.db.collection(PROJECT_COLLECTION).doc(projectId)
    const project = await this.getProjectById(projectId, userId)
    if (!project) {
      throw new Error('Project not found or unauthorized')
    }
    await projectRef.update({
      ...updates,
      updatedAt: new Date(),
      auditTrail: {
        action: AUDIT_ACTIONS.UPDATE,
        userId,
        timestamp: new Date(),
      },
    })
    return { ...project, ...updates } as Project
  }

  handleError(error: any) {
    // Basic error handling
    return {
      statusCode: 500,
      message: error.message || 'An unexpected error occurred',
    }
  }
}
