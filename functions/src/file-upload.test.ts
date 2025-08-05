import 'jest'
import * as admin from 'firebase-admin'
import functionsTest from 'firebase-functions-test'
import { uploadFile } from './file-upload'

// Initialize the test SDK
const test = functionsTest()

// Mock Firebase services
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  storage: () => ({
    bucket: () => ({
      file: jest.fn().mockReturnThis(),
      save: jest.fn().mockResolvedValue(true),
    }),
  }),
  firestore: () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(true),
    update: jest.fn().mockResolvedValue(true),
  }),
}))

describe('Cloud Functions: File Upload', () => {
  afterEach(() => {
    test.cleanup()
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(uploadFile).toBeDefined()
  })
})
