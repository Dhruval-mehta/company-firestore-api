const request = require('supertest');
const app = require('../server');

describe('Company API Tests', () => {
  const testCompanyData = {
    firebase_id: 'test-company-123',
    latitude: 23.456,
    longitude: 77.123,
    googleRating: 4.2,
    googleRatingCount: 17,
    website: 'https://example.com',
    businessType: 'Restaurant',
    phone: ['+911234567890'],
    openingHours: {
      Monday: '10am–10pm',
      Tuesday: '10am–10pm'
    },
    thumbnailUrl: 'https://example.com/img.jpg',
    reviews: [{ author: 'John', text: 'Great!' }],
    images: [{ url: 'https://example.com/image1.jpg' }]
  };

  describe('POST /api/save-company', () => {
    it('should save company data successfully', async () => {
      const response = await request(app)
        .post('/api/save-company')
        .send(testCompanyData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.firebase_id).toBe(testCompanyData.firebase_id);
      expect(response.body.document_path).toBe(`companies/${testCompanyData.firebase_id}`);
    });

    it('should return error for missing firebase_id', async () => {
      const invalidData = { ...testCompanyData };
      delete invalidData.firebase_id;

      const response = await request(app)
        .post('/api/save-company')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return error for invalid latitude', async () => {
      const invalidData = { ...testCompanyData, latitude: 'invalid' };

      const response = await request(app)
        .post('/api/save-company')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return error for invalid google rating', async () => {
      const invalidData = { ...testCompanyData, googleRating: 6.0 };

      const response = await request(app)
        .post('/api/save-company')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/company/:firebase_id', () => {
    beforeAll(async () => {
      // Save test data first
      await request(app)
        .post('/api/save-company')
        .send(testCompanyData);
    });

    it('should retrieve company data successfully', async () => {
      const response = await request(app)
        .get(`/api/company/${testCompanyData.firebase_id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firebase_id).toBe(testCompanyData.firebase_id);
      expect(response.body.data.businessType).toBe(testCompanyData.businessType);
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .get('/api/company/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Company not found');
    });
  });

  describe('PUT /api/company/:firebase_id', () => {
    it('should update company data successfully', async () => {
      const updateData = {
        businessType: 'Cafe',
        googleRating: 4.5
      };

      const response = await request(app)
        .put(`/api/company/${testCompanyData.firebase_id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.updated_fields).toContain('businessType');
      expect(response.body.updated_fields).toContain('googleRating');
    });

    it('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/company/non-existent-id')
        .send({ businessType: 'Cafe' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/companies', () => {
    it('should retrieve companies with pagination', async () => {
      const response = await request(app)
        .get('/api/companies?limit=5&offset=0')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should filter companies by business type', async () => {
      const response = await request(app)
        .get('/api/companies?businessType=Restaurant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.filters.businessType).toBe('Restaurant');
    });
  });

  describe('DELETE /api/company/:firebase_id', () => {
    it('should delete company data successfully', async () => {
      const response = await request(app)
        .delete(`/api/company/${testCompanyData.firebase_id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.firebase_id).toBe(testCompanyData.firebase_id);
    });

    it('should return 404 for already deleted company', async () => {
      const response = await request(app)
        .delete(`/api/company/${testCompanyData.firebase_id}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.firebase_connected).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Endpoint not found');
    });
  });
});

// Test setup and teardown
afterAll(async () => {
  // Clean up test data if needed
  console.log('Tests completed');
});