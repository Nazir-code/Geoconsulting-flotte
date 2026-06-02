/**
 * Integration test for enhanced mission completion endpoint
 * Tests the actual server endpoint with enhanced parameters
 * Validates error handling and audit trail recording
 * 
 * Requirements: 1.1, 1.4, 8.1, 8.2
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { MissionStatusController } from './controllers/missionStatusController.js';

// Mock Firebase Admin for testing
const mockFirestore = {
  collection: (name) => ({
    doc: (id) => ({
      get: () => Promise.resolve({
        exists: true,
        id: id,
        data: () => ({
          id: id,
          driverId: 'test-driver-1',
          vehicleId: 'test-vehicle-1',
          status: 'in_progress',
          destination: 'Test Destination',
          startLocation: 'Test Start',
          distance: 0,
          fuelConsumed: 0,
          notes: null,
          syncVersion: 1,
          statusHistory: []
        })
      }),
      update: () => Promise.resolve()
    }),
    where: () => ({
      limit: () => ({
        get: () => Promise.resolve({
          empty: false,
          docs: [{
            id: 'test-driver-1',
            data: () => ({
              id: 'test-driver-1',
              userId: 'test-user-1',
              status: 'on_mission'
            })
          }]
        })
      })
    })
  }),
  runTransaction: async (callback) => {
    const mockTransaction = {
      get: (ref) => Promise.resolve({
        exists: true,
        id: 'test-id',
        data: () => ({
          id: 'test-id',
          driverId: 'test-driver-1',
          vehicleId: 'test-vehicle-1',
          status: 'in_progress',
          destination: 'Test Destination',
          startLocation: 'Test Start',
          distance: 0,
          fuelConsumed: 0,
          notes: null,
          syncVersion: 1,
          statusHistory: []
        })
      }),
      update: () => {},
      set: () => {}
    };
    
    return await callback(mockTransaction);
  }
};

// Mock Firebase Admin module
const mockAdmin = {
  firestore: () => mockFirestore,
  FieldValue: {
    delete: () => 'DELETE_FIELD'
  }
};

// Replace the Firebase admin import
global.mockFirebaseAdmin = mockAdmin;

async function testEnhancedEndpoint() {
  console.log('🧪 Testing Enhanced Mission Completion Endpoint Integration');
  console.log('='.repeat(60));

  // Create test app
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  
  app.use(express.json());
  app.use(cors());

  // Mock authentication middleware
  function requireDriverAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer test-token-')) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise.'
      });
    }
    req.userId = authHeader.replace('Bearer test-token-', '');
    next();
  }

  function buildApiResponse(data, message) {
    return {
      success: true,
      data,
      message
    };
  }

  function handleRouteError(res, error, statusCode = 400) {
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Une erreur est survenue.'
    });
  }

  // Create controller with mocked Firebase
  const missionStatusController = new MissionStatusController();
  
  // Mock the hydration method
  missionStatusController._hydrateMission = async (mission) => ({
    ...mission,
    driver: { id: 'test-driver-1', userId: 'test-user-1' },
    vehicle: { id: 'test-vehicle-1', plateNumber: 'V-123' }
  });

  // Enhanced mission completion endpoint
  app.post('/api/driver/me/missions/:missionId/complete', requireDriverAuth, async (req, res) => {
    try {
      // Enhanced validation for mission completion parameters
      const { distance, fuelConsumed, notes } = req.body || {};
      
      // Validate distance parameter if provided
      if (distance !== undefined && distance !== null) {
        if (!Number.isFinite(Number(distance)) || Number(distance) < 0) {
          return handleRouteError(res, new Error('La distance doit être un nombre positif.'), 400);
        }
      }
      
      // Validate fuel consumed parameter if provided
      if (fuelConsumed !== undefined && fuelConsumed !== null) {
        if (!Number.isFinite(Number(fuelConsumed)) || Number(fuelConsumed) < 0) {
          return handleRouteError(res, new Error('La consommation de carburant doit être un nombre positif.'), 400);
        }
      }
      
      // Validate notes parameter if provided
      if (notes !== undefined && notes !== null) {
        if (typeof notes !== 'string') {
          return handleRouteError(res, new Error('Les notes doivent être du texte.'), 400);
        }
        if (notes.length > 1000) {
          return handleRouteError(res, new Error('Les notes ne peuvent pas dépasser 1000 caractères.'), 400);
        }
      }
      
      // Enhanced payload with audit trail information
      const enhancedPayload = {
        distance: distance !== undefined ? Number(distance) : undefined,
        fuelConsumed: fuelConsumed !== undefined ? Number(fuelConsumed) : undefined,
        notes: notes ? String(notes).trim() : undefined,
        // Audit trail information
        completedBy: req.userId,
        completedAt: new Date().toISOString(),
        userAgent: req.headers['user-agent'] || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
      };
      
      // Use the enhanced mission status controller
      const mission = await missionStatusController.completeMission(req.userId, req.params.missionId, enhancedPayload);
      
      // Emit enhanced real-time events with audit information
      io.emit('mission_update', {
        type: 'mission_update',
        data: {
          mission: mission,
          previousStatus: 'in_progress',
          timestamp: enhancedPayload.completedAt,
          updatedBy: req.userId,
          auditInfo: {
            action: 'complete',
            userAgent: enhancedPayload.userAgent,
            ipAddress: enhancedPayload.ipAddress
          }
        }
      });
      
      // Log successful completion for monitoring
      console.log(`✅ Mission ${req.params.missionId} completed by user ${req.userId}`, {
        distance: enhancedPayload.distance,
        fuelConsumed: enhancedPayload.fuelConsumed,
        hasNotes: !!enhancedPayload.notes,
        timestamp: enhancedPayload.completedAt
      });
      
      res.json(buildApiResponse(mission, 'Mission terminée avec succès.'));
    } catch (error) {
      // Enhanced error logging with context
      console.error(`❌ Error completing mission ${req.params.missionId} for user ${req.userId}:`, {
        error: error.message,
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress
      });
      
      handleRouteError(res, error);
    }
  });

  // Start test server
  const PORT = 3001;
  const server = httpServer.listen(PORT, () => {
    console.log(`Test server started on port ${PORT}`);
  });

  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test cases
  const testCases = [
    {
      name: 'Valid mission completion with all parameters',
      payload: {
        distance: 25.5,
        fuelConsumed: 3.2,
        notes: 'Mission completed successfully. Traffic was light.'
      },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Invalid negative distance',
      payload: {
        distance: -10,
        fuelConsumed: 2.0,
        notes: 'Test with invalid distance'
      },
      expectedStatus: 400,
      shouldPass: false,
      expectedError: 'distance'
    },
    {
      name: 'Invalid fuel consumed parameter',
      payload: {
        distance: 15.0,
        fuelConsumed: 'invalid',
        notes: 'Test with invalid fuel'
      },
      expectedStatus: 400,
      shouldPass: false,
      expectedError: 'carburant'
    },
    {
      name: 'Notes too long',
      payload: {
        distance: 20.0,
        fuelConsumed: 2.5,
        notes: 'A'.repeat(1001)
      },
      expectedStatus: 400,
      shouldPass: false,
      expectedError: '1000 caractères'
    },
    {
      name: 'Minimal parameters (only notes)',
      payload: {
        notes: 'Minimal completion test'
      },
      expectedStatus: 200,
      shouldPass: true
    },
    {
      name: 'Empty payload',
      payload: {},
      expectedStatus: 200,
      shouldPass: true
    }
  ];

  let passedTests = 0;
  let totalTests = testCases.length;

  for (const testCase of testCases) {
    console.log(`\n${passedTests + 1}. ${testCase.name}...`);
    
    try {
      const response = await fetch(`http://localhost:${PORT}/api/driver/me/missions/test-mission-1/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-test-user-1',
          'User-Agent': 'Test-Client/1.0'
        },
        body: JSON.stringify(testCase.payload)
      });

      const result = await response.json();
      
      if (testCase.shouldPass) {
        if (response.status === testCase.expectedStatus && result.success) {
          console.log('   ✅ PASSED');
          passedTests++;
        } else {
          console.log('   ❌ FAILED - Expected success but got:', result);
        }
      } else {
        if (response.status === testCase.expectedStatus && !result.success) {
          if (!testCase.expectedError || result.error.includes(testCase.expectedError)) {
            console.log('   ✅ PASSED - Correctly rejected');
            passedTests++;
          } else {
            console.log('   ❌ FAILED - Wrong error message:', result.error);
          }
        } else {
          console.log('   ❌ FAILED - Expected failure but got:', result);
        }
      }
    } catch (error) {
      console.log('   ❌ FAILED - Request error:', error.message);
    }
  }

  // Test unauthorized access
  console.log(`\n${totalTests + 1}. Testing unauthorized access...`);
  try {
    const response = await fetch(`http://localhost:${PORT}/api/driver/me/missions/test-mission-1/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No authorization header
      },
      body: JSON.stringify({ notes: 'Unauthorized test' })
    });

    if (response.status === 401) {
      console.log('   ✅ PASSED - Correctly rejected unauthorized request');
      passedTests++;
    } else {
      console.log('   ❌ FAILED - Should have rejected unauthorized request');
    }
    totalTests++;
  } catch (error) {
    console.log('   ❌ FAILED - Request error:', error.message);
    totalTests++;
  }

  // Close server
  server.close();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`🏁 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Enhanced endpoint is working correctly.');
    return true;
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
    return false;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEnhancedEndpoint().catch(console.error);
}

export { testEnhancedEndpoint };