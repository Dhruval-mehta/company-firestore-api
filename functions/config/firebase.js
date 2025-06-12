const admin = require('firebase-admin');
const logger = require('../utils/logger');

let db = null;

const initializeFirebase = () => {
  try {
    // Prevent re-initialization
    if (admin.apps.length > 0) {
      db = admin.firestore();
      return db;
    }

    const env = process.env.NODE_ENV || 'development';
    logger.info(`🌍 Initializing Firebase in ${env} mode...`);

    let credentials;

    if (env === 'development') {
      try {
        // Use service account key file in dev
        const serviceAccount = require('../serviceAccountKey.json');
        credentials = admin.credential.cert(serviceAccount);
        logger.info('🔐 Using serviceAccountKey.json for Firebase Auth');
      } catch (err) {
        logger.error('❌ serviceAccountKey.json not found in development mode');
        throw err;
      }
    } else {
      // Use env vars in production
      if (
        !process.env.FB_PROJECT_ID ||
        !process.env.FB_CLIENT_EMAIL ||
        !process.env.FB_PRIVATE_KEY
      ) {
        throw new Error('Missing Firebase environment variables');
      }

      credentials = admin.credential.cert({
        projectId: process.env.FB_PROJECT_ID,
        clientEmail: process.env.FB_CLIENT_EMAIL,
        privateKey: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });

      logger.info('🔐 Using environment variables for Firebase Auth');
    }

    admin.initializeApp({
      credential: credentials,
      projectId: process.env.FB_PROJECT_ID || 'saakh-93857',
    });

    db = admin.firestore();

    // Optional Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return db;

  } catch (error) {
    logger.error('❌ Firebase initialization failed:', error.message || error);
    process.exit(1); // Crash app if Firebase fails
  }
};

const getFirestore = () => {
  if (!db) {
    return initializeFirebase();
  }
  return db;
};

module.exports = {
  initializeFirebase,
  getFirestore,
  admin
};
