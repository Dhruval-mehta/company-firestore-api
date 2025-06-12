const { initializeFirebase } = require('../config/firebase');

// Mock Firebase for testing
jest.mock('../config/firebase', () => ({
  initializeFirebase: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(() => Promise.resolve({
          exists: true,
          data: () => ({ test: 'data' })
        })),
        update: jest.fn(() => Promise.resolve()),
        delete: jest.fn(() => Promise.resolve())
      }))
    }))
  })),
  admin: {
    firestore: {
      FieldValue: {
        serverTimestamp: () => new Date()
      }
    }
  }
}));

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.FIREBASE_PROJECT_ID = 'test-project';
});