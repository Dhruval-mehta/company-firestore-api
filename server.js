const express = require('express');
// const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { initializeFirebase } = require('./config/firebase');
const companyRoutes = require('./routes/companyRoutes');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Firebase on startup
try {
  initializeFirebase();
} catch (error) {
  logger.error('Failed to initialize Firebase. Exiting...', error);
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   maxAge: 86400 // 24 hours
// }));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.logRequest(req, res);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    firebase_connected: true
  });
});

// API routes
app.use('/api', companyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  const docsUrl = process.env.API_DOCS_URL || '/api/docs';
  res.status(200).json({
    message: 'Company Firestore API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      saveCompany: 'POST /api/save-company',
      getCompany: 'GET /api/company/:firebase_id',
      updateCompany: 'PUT /api/company/:firebase_id',
      deleteCompany: 'DELETE /api/company/:firebase_id',
      getCompanies: 'GET /api/companies',
      batchSave: 'POST /api/companies/batch'
    },
    documentation: docsUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler - using explicit path instead of wildcard
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: [
      'GET /health',
      'POST /api/save-company',
      'GET /api/company/:firebase_id',
      'PUT /api/company/:firebase_id',
      'DELETE /api/company/:firebase_id',
      'GET /api/companies'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logger.success(`🚀 Company API server running on port ${port}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📍 Main endpoint: POST /api/save-company`);
  logger.info(`🏥 Health check: GET /health`);
  logger.info(`📚 API Documentation: GET /`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;