// const { getFirestore, admin } = require('../config/firebase');
// const logger = require('../utils/logger');

// class CompanyController {
  
//   // Save company data to Firestore
//   static async saveCompany(req, res) {
//     try {
//       const { firebase_id, ...companyData } = req.body;
//       const db = getFirestore();
      
//       // Prepare the document data with timestamps
//       const documentData = {
//         ...companyData,
//         updatedAt: admin.firestore.FieldValue.serverTimestamp(),
//         lastModified: new Date().toISOString()
//       };
      
//       // Add createdAt only if document doesn't exist
//       const docRef = db.collection('companies').doc(firebase_id);
//       const existingDoc = await docRef.get();
      
//       if (!existingDoc.exists) {
//         documentData.createdAt = admin.firestore.FieldValue.serverTimestamp();
//         documentData.dateCreated = new Date().toISOString();
//       }
      
//       // Write to Firestore with merge option
//       await docRef.set(documentData, { merge: true });
      
//       logger.info(`✅ Company data saved successfully for ID: ${firebase_id}`);
      
//       res.status(200).json({
//         success: true,
//         message: 'Company data saved successfully',
//         firebase_id: firebase_id,
//         document_path: `companies/${firebase_id}`,
//         timestamp: new Date().toISOString(),
//         isNew: !existingDoc.exists
//       });
      
//     } catch (error) {
//       logger.error('❌ Error saving company data:', error);
      
//       res.status(500).json({
//         success: false,
//         error: 'Failed to save company data',
//         details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }
  
//   // Get company data by ID
//   static async getCompany(req, res) {
//     try {
//       const { firebaseId } = req.params;
//       const db = getFirestore();
      
//       const docRef = db.collection('companies').doc(firebaseId);
//       const doc = await docRef.get();
      
//       if (!doc.exists) {
//         return res.status(404).json({
//           success: false,
//           error: 'Company not found',
//           firebaseId
//         });
//       }
      
//       const data = doc.data();
      
//       // Convert Firestore timestamps to ISO strings for JSON response
//       if (data.createdAt && data.createdAt.toDate) {
//         data.createdAt = data.createdAt.toDate().toISOString();
//       }
//       if (data.updatedAt && data.updatedAt.toDate) {
//         data.updatedAt = data.updatedAt.toDate().toISOString();
//       }
      
//       logger.info(`✅ Company data retrieved for ID: ${firebaseId}`);
      
//       res.status(200).json({
//         success: true,
//         data: {
//           firebaseId,
//           ...data
//         }
//       });
      
//     } catch (error) {
//       logger.error('❌ Error fetching company data:', error);
      
//       res.status(500).json({
//         success: false,
//         error: 'Failed to fetch company data',
//         details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }
  
//   // Update specific fields of a company
//   static async updateCompany(req, res) {
//     try {
//       const { firebaseId } = req.params;
//       const updateData = req.body;
//       const db = getFirestore();
      
//       // Remove firebase_id from update data if present
//       delete updateData.firebase_id;
      
//       // Add update timestamp
//       updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
//       updateData.lastModified = new Date().toISOString();
      
//       const docRef = db.collection('companies').doc(firebaseId);
      
//       // Check if document exists
//       const doc = await docRef.get();
//       if (!doc.exists) {
//         return res.status(404).json({
//           success: false,
//           error: 'Company not found',
//           firebaseId
//         });
//       }
      
//       // Update with merge
//       await docRef.update(updateData);
      
//       logger.info(`✅ Company data updated successfully for ID: ${firebaseId}`);
      
//       res.status(200).json({
//         success: true,
//         message: 'Company data updated successfully',
//         firebaseId,
//         updated_fields: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'lastModified'),
//         timestamp: new Date().toISOString()
//       });
      
//     } catch (error) {
//       logger.error('❌ Error updating company data:', error);
      
//       res.status(500).json({
//         success: false,
//         error: 'Failed to update company data',
//         details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }
  
//   // Delete company data
//   static async deleteCompany(req, res) {
//     try {
//       const { firebaseId } = req.params;
//       const db = getFirestore();
      
//       const docRef = db.collection('companies').doc(firebaseId);
      
//       // Check if document exists
//       const doc = await docRef.get();
//       if (!doc.exists) {
//         return res.status(404).json({
//           success: false,
//           error: 'Company not found',
//           firebaseId
//         });
//       }
      
//       await docRef.delete();
      
//       logger.info(`✅ Company data deleted successfully for ID: ${firebaseId}`);
      
//       res.status(200).json({
//         success: true,
//         message: 'Company data deleted successfully',
//         firebaseId,
//         timestamp: new Date().toISOString()
//       });
      
//     } catch (error) {
//       logger.error('❌ Error deleting company data:', error);
      
//       res.status(500).json({
//         success: false,
//         error: 'Failed to delete company data',
//         details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }
  
//   // Get multiple companies with pagination
//   static async getCompanies(req, res) {
//     try {
//       const { limit = 10, offset = 0, city, businessType } = req.query;
//       const db = getFirestore();
      
//       let query = db.collection('companies');
      
//       // Add filters
//       if (city) {
//         query = query.where('city', '==', city);
//       }
      
//       if (businessType) {
//         query = query.where('businessType', '==', businessType);
//       }
      
//       // Add pagination
//       query = query.orderBy('createdAt', 'desc')
//                   .limit(parseInt(limit))
//                   .offset(parseInt(offset));
      
//       const snapshot = await query.get();
//       const companies = [];
      
//       snapshot.forEach(doc => {
//         const data = doc.data();
        
//         // Convert timestamps
//         if (data.createdAt && data.createdAt.toDate) {
//           data.createdAt = data.createdAt.toDate().toISOString();
//         }
//         if (data.updatedAt && data.updatedAt.toDate) {
//           data.updatedAt = data.updatedAt.toDate().toISOString();
//         }
        
//         companies.push({
//           firebaseId: doc.id,
//           ...data
//         });
//       });
      
//       logger.info(`✅ Retrieved ${companies.length} companies`);
      
//       res.status(200).json({
//         success: true,
//         data: companies,
//         pagination: {
//           limit: parseInt(limit),
//           offset: parseInt(offset),
//           count: companies.length
//         },
//         filters: { city, businessType }
//       });
      
//     } catch (error) {
//       logger.error('❌ Error fetching companies:', error);
      
//       res.status(500).json({
//         success: false,
//         error: 'Failed to fetch companies',
//         details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//       });
//     }
//   }
// }

// module.exports = CompanyController;


const { getFirestore, admin } = require('../config/firebase');
const logger = require('../utils/logger');

class CompanyController {
  
  // Helper function to convert arrays to JSON strings
  static convertArraysToStrings(obj) {
    const converted = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        // Convert array to JSON string with proper formatting
        converted[key] = JSON.stringify(value);
        logger.info(`✅ Converted array field '${key}' to string (length: ${value.length})`);
      } else if (value !== null && typeof value === 'object' && !value.toDate) {
        // Recursively handle nested objects (but skip Firestore timestamps)
        converted[key] = this.convertArraysToStrings(value);
      } else {
        // Keep primitive values as they are
        converted[key] = value;
      }
    }
    
    return converted;
  }
  
  // Helper function to convert JSON strings back to arrays (for retrieval)
  static convertStringsToArrays(obj) {
    const converted = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        try {
          // Try to parse as JSON - if it's a valid JSON array, convert it back
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            converted[key] = parsed;
            logger.info(`✅ Converted string field '${key}' back to array`);
          } else {
            converted[key] = value; // Keep as string if not an array
          }
        } catch (e) {
          // If parsing fails, keep as string
          converted[key] = value;
        }
      } else if (value !== null && typeof value === 'object' && !value.toDate) {
        // Recursively handle nested objects (but skip Firestore timestamps)
        converted[key] = this.convertStringsToArrays(value);
      } else {
        converted[key] = value;
      }
    }
    
    return converted;
  }
  
  // Save company data to Firestore
  static async saveCompany(req, res) {
    try {
      const { firebase_id, ...companyData } = req.body;
      const db = getFirestore();
      
      // Convert arrays to strings before storing
      const processedData = CompanyController.convertArraysToStrings(companyData);;
      
      // Prepare the document data with timestamps
      const documentData = {
        ...processedData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastModified: new Date().toISOString()
      };
      
      // Add createdAt only if document doesn't exist
      const docRef = db.collection('companies').doc(firebase_id);
      const existingDoc = await docRef.get();
      
      if (!existingDoc.exists) {
        documentData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        documentData.dateCreated = new Date().toISOString();
      }
      
      // Write to Firestore with merge option
      await docRef.set(documentData, { merge: true });
      
      logger.info(`✅ Company data saved successfully for ID: ${firebase_id}`);
      
      res.status(200).json({
        success: true,
        message: 'Company data saved successfully',
        firebase_id: firebase_id,
        document_path: `companies/${firebase_id}`,
        timestamp: new Date().toISOString(),
        isNew: !existingDoc.exists,
        processedFields: Object.keys(processedData)
      });
      
    } catch (error) {
      logger.error('❌ Error saving company data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to save company data',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  // Get company data by ID
  static async getCompany(req, res) {
    try {
      const { firebaseId } = req.params;
      const { returnArraysAsStrings = false } = req.query; // Optional query parameter
      const db = getFirestore();
      
      const docRef = db.collection('companies').doc(firebaseId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          firebaseId
        });
      }
      
      let data = doc.data();
      
      // Convert Firestore timestamps to ISO strings for JSON response
      if (data.createdAt && data.createdAt.toDate) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.updatedAt && data.updatedAt.toDate) {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      
      // Convert strings back to arrays unless specifically requested to keep as strings
      if (!returnArraysAsStrings) {
        data = CompanyController.convertStringsToArrays(data);
      }
      
      logger.info(`✅ Company data retrieved for ID: ${firebaseId}`);
      
      res.status(200).json({
        success: true,
        data: {
          firebaseId,
          ...data
        }
      });
      
    } catch (error) {
      logger.error('❌ Error fetching company data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch company data',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  // Update specific fields of a company
  static async updateCompany(req, res) {
    try {
      const { firebaseId } = req.params;
      let updateData = req.body;
      const db = getFirestore();
      
      // Remove firebase_id from update data if present
      delete updateData.firebase_id;
      
      // Convert arrays to strings before updating
      updateData = CompanyController.convertArraysToStrings(updateData)
      
      // Add update timestamp
      updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      updateData.lastModified = new Date().toISOString();
      
      const docRef = db.collection('companies').doc(firebaseId);
      
      // Check if document exists
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          firebaseId
        });
      }
      
      // Update with merge
      await docRef.update(updateData);
      
      logger.info(`✅ Company data updated successfully for ID: ${firebaseId}`);
      
      res.status(200).json({
        success: true,
        message: 'Company data updated successfully',
        firebaseId,
        updated_fields: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'lastModified'),
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Error updating company data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to update company data',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  // Delete company data
  static async deleteCompany(req, res) {
    try {
      const { firebaseId } = req.params;
      const db = getFirestore();
      
      const docRef = db.collection('companies').doc(firebaseId);
      
      // Check if document exists
      const doc = await docRef.get();
      if (!doc.exists) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          firebaseId
        });
      }
      
      await docRef.delete();
      
      logger.info(`✅ Company data deleted successfully for ID: ${firebaseId}`);
      
      res.status(200).json({
        success: true,
        message: 'Company data deleted successfully',
        firebaseId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Error deleting company data:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete company data',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  // Get multiple companies with pagination
  static async getCompanies(req, res) {
    try {
      const { limit = 10, offset = 0, city, businessType, returnArraysAsStrings = false } = req.query;
      const db = getFirestore();
      
      let query = db.collection('companies');
      
      // Add filters
      if (city) {
        query = query.where('city', '==', city);
      }
      
      if (businessType) {
        query = query.where('businessType', '==', businessType);
      }
      
      // Add pagination
      query = query.orderBy('createdAt', 'desc')
                  .limit(parseInt(limit))
                  .offset(parseInt(offset));
      
      const snapshot = await query.get();
      const companies = [];
      
      snapshot.forEach(doc => {
        let data = doc.data();
        
        // Convert timestamps
        if (data.createdAt && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && data.updatedAt.toDate) {
          data.updatedAt = data.updatedAt.toDate().toISOString();
        }
        
        // Convert strings back to arrays unless specifically requested to keep as strings
        if (!returnArraysAsStrings) {
          data = CompanyController.convertStringsToArrays(data);
        }
        
        companies.push({
          firebaseId: doc.id,
          ...data
        });
      });
      
      logger.info(`✅ Retrieved ${companies.length} companies`);
      
      res.status(200).json({
        success: true,
        data: companies,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: companies.length
        },
        filters: { city, businessType }
      });
      
    } catch (error) {
      logger.error('❌ Error fetching companies:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to fetch companies',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
  
  // Batch save multiple companies
  static async batchSave(req, res) {
    try {
      const { companies } = req.body;
      
      if (!Array.isArray(companies) || companies.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Companies array is required and must not be empty'
        });
      }
      
      const db = getFirestore();
      const batch = db.batch();
      const results = [];
      
      for (const company of companies) {
        const { firebase_id, ...companyData } = company;
        
        if (!firebase_id) {
          results.push({
            success: false,
            error: 'firebase_id is required for each company'
          });
          continue;
        }
        
        // Convert arrays to strings before storing
        const processedData = CompanyController.convertArraysToStrings(companyData);
        
        const docRef = db.collection('companies').doc(firebase_id);
        const documentData = {
          ...processedData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastModified: new Date().toISOString()
        };
        
        // Check if document exists (for batch operations, we'll assume new docs need createdAt)
        const existingDoc = await docRef.get();
        if (!existingDoc.exists) {
          documentData.createdAt = admin.firestore.FieldValue.serverTimestamp();
          documentData.dateCreated = new Date().toISOString();
        }
        
        batch.set(docRef, documentData, { merge: true });
        results.push({
          success: true,
          firebase_id,
          isNew: !existingDoc.exists
        });
      }
      
      await batch.commit();
      
      logger.info(`✅ Batch save completed for ${companies.length} companies`);
      
      res.status(200).json({
        success: true,
        message: 'Batch save completed',
        results,
        total: companies.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Error in batch save:', error);
      
      res.status(500).json({
        success: false,
        error: 'Failed to batch save companies',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CompanyController;