const express = require('express');
const CompanyController = require('../controllers/companyController');
const { validateCompanyData, sanitizeCompanyData, rateLimit } = require('../middleware/validation');
const { downloadPdf } = require('../controllers/pdf');

const router = express.Router();

// Apply rate limiting to all routes
router.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// Main endpoint - Save company data (used by Make.com)
router.post('/save-company',
  validateCompanyData,
  sanitizeCompanyData,
  CompanyController.saveCompany
);

// Get single company by ID
router.get('/company/:firebaseId', CompanyController.getCompany);

// Update company data
router.put('/company/:firebaseId',
  sanitizeCompanyData,
  CompanyController.updateCompany
);

// Delete company data
router.delete('/company/:firebaseId', CompanyController.deleteCompany);

// Get multiple companies with filters and pagination
router.get('/companies', CompanyController.getCompanies);

router.post('/download', downloadPdf);

// Batch operations endpoint
router.post('/companies/batch', async (req, res) => {
  try {
    const { companies } = req.body;

    if (!Array.isArray(companies)) {
      return res.status(400).json({
        success: false,
        error: 'Companies must be an array'
      });
    }

    if (companies.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 companies allowed per batch'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < companies.length; i++) {
      try {
        const company = companies[i];

        if (!company.firebase_id) {
          errors.push({ index: i, error: 'Missing firebase_id' });
          continue;
        }

        // Simulate the save operation (you'd call the actual save logic here)
        req.body = company;

        // This is a simplified version - in a real implementation,
        // you'd want to use transactions for batch operations
        await CompanyController.saveCompany(req, {
          status: () => ({ json: (data) => results.push({ index: i, ...data }) })
        });

      } catch (error) {
        errors.push({ index: i, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Batch operation completed',
      results: {
        successful: results.length,
        failed: errors.length,
        total: companies.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Batch operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;