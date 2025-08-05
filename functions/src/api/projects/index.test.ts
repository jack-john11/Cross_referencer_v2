import 'jest'
import * as admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { projectApi } from './index'

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

describe('Project API', () => {
  it('should be defined', () => {
    expect(projectApi).toBeDefined()
  })
})
