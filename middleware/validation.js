const logger = require('../utils/logger');

// Validation middleware for company data
const validateCompanyData = (req, res, next) => {
  const { firebase_id, latitude, longitude, googleRating, googleRatingCount } = req.body;
  const errors = [];
  
  // Required field validation
  if (!firebase_id) {
    errors.push('firebase_id is required');
  } else if (typeof firebase_id !== 'string' || firebase_id.length < 3) {
    errors.push('firebase_id must be a string with at least 3 characters');
  }
  
  // Optional field validation
  if (latitude && (isNaN(parseFloat(latitude)) || Math.abs(parseFloat(latitude)) > 90)) {
    errors.push('latitude must be a valid number between -90 and 90');
  }
  
  if (longitude && (isNaN(parseFloat(longitude)) || Math.abs(parseFloat(longitude)) > 180)) {
    errors.push('longitude must be a valid number between -180 and 180');
  }
  
  if (googleRating && (isNaN(parseFloat(googleRating)) || parseFloat(googleRating) < 0 || parseFloat(googleRating) > 5)) {
    errors.push('googleRating must be a number between 0 and 5');
  }
  
  if (googleRatingCount && (isNaN(parseInt(googleRatingCount)) || parseInt(googleRatingCount) < 0)) {
    errors.push('googleRatingCount must be a non-negative integer');
  }
  
  // Email validation for contact emails
  if (req.body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
    errors.push('email must be a valid email address');
  }
  
  // Phone validation (basic)
  if (req.body.phone && Array.isArray(req.body.phone)) {
    req.body.phone.forEach((phone, index) => {
      if (typeof phone !== 'string' || phone.length < 10) {
        errors.push(`phone[${index}] must be a valid phone number`);
      }
    });
  }
  
  // Website URL validation
  if (req.body.website && typeof req.body.website === 'string') {
    try {
      new URL(req.body.website);
    } catch (error) {
      errors.push('website must be a valid URL');
    }
  }
  
  if (errors.length > 0) {
    logger.warn('Validation failed:', errors);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// Sanitize and format data
const sanitizeCompanyData = (req, res, next) => {
  const data = req.body;
  
  // Convert string numbers to actual numbers
  if (data.latitude) data.latitude = parseFloat(data.latitude);
  if (data.longitude) data.longitude = parseFloat(data.longitude);
  if (data.googleRating) data.googleRating = parseFloat(data.googleRating);
  if (data.googleRatingCount) data.googleRatingCount = parseInt(data.googleRatingCount);
  
  // Ensure arrays are properly formatted
  if (data.phone && !Array.isArray(data.phone)) {
    data.phone = [data.phone];
  }
  
  if (data.reviews && !Array.isArray(data.reviews)) {
    data.reviews = [];
  }
  
  if (data.images && !Array.isArray(data.images)) {
    data.images = [];
  }
  
  // Trim string fields
  const stringFields = ['businessType', 'website', 'thumbnailUrl'];
  stringFields.forEach(field => {
    if (data[field] && typeof data[field] === 'string') {
      data[field] = data[field].trim();
    }
  });
  
  req.body = data;
  next();
};

// Rate limiting validation (simple implementation)
const rateLimitMap = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, []);
    }
    
    const requests = rateLimitMap.get(clientId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      logger.warn(`Rate limit exceeded for client: ${clientId}`);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    rateLimitMap.set(clientId, validRequests);
    
    next();
  };
};

module.exports = {
  validateCompanyData,
  sanitizeCompanyData,
  rateLimit
};