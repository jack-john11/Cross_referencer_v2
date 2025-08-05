import 'jest'
import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

// Mock Firestore before importing the service
jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { ProjectService } from './project-service'

describe('ProjectService', () => {
  let projectService: ProjectService
  let mockDb: any

  beforeEach(() => {
    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      set: jest.fn(),
      update: jest.fn(),
      get: jest.fn(),
      where: jest.fn().mockReturnThis(),
    }
    ;(getFirestore as jest.Mock).mockReturnValue(mockDb)
    projectService = new ProjectService(mockDb)
  })

  it('should be defined', () => {
    expect(projectService).toBeDefined()
  })
})
