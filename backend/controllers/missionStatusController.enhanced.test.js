/**
 * Unit tests for enhanced mission status controller
 * Tests the new distance, fuel consumed, and notes parameters
 * Validates error handling and audit trail recording
 * 
 * Requirements: 1.1, 1.4, 8.1, 8.2
 */

const { MissionStatusController } = require('./missionStatusController.js');

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    runTransaction: jest.fn(),
  })),
  FieldValue: {
    delete: jest.fn(() => 'DELETE_FIELD'),
  },
}));

const admin = require('firebase-admin');

describe('Enhanced MissionStatusController', () => {
  let controller;
  let mockDb;
  let mockTransaction;
  let mockCollection;
  let mockDoc;

  beforeEach(() => {
    controller = new MissionStatusController();
    
    // Setup mocks
    mockDoc = {
      get: jest.fn(),
      exists: true,
      id: 'test-mission-1',
      data: jest.fn(() => ({
        id: 'test-mission-1',
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
      })),
    };
    
    mockCollection = {
      doc: jest.fn(() => mockDoc),
      where: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
    };
    
    mockTransaction = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
    };
    
    mockDb = {
      collection: jest.fn(() => mockCollection),
      runTransaction: jest.fn((callback) => callback(mockTransaction)),
    };
    
    admin.firestore.mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('completeMission with enhanced parameters', () => {
    const userId = 'test-user-1';
    const missionId = 'test-mission-1';

    beforeEach(() => {
      // Mock driver lookup
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'test-driver-1',
          data: () => ({ 
            id: 'test-driver-1',
            userId: 'test-user-1', 
            status: 'on_mission',
            totalMissions: 5,
            currentVehicleId: 'test-vehicle-1',
            currentMissionId: 'test-mission-1'
          })
        }]
      });

      // Mock transaction documents
      mockTransaction.get.mockImplementation((ref) => {
        if (ref === mockDoc || (ref.path && ref.path.includes('missions'))) {
          return Promise.resolve({
            exists: true,
            id: 'test-mission-1',
            data: () => ({
              id: 'test-mission-1',
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
          });
        }
        // Vehicle document
        if (ref.path && ref.path.includes('vehicles')) {
          return Promise.resolve({
            exists: true,
            data: () => ({
              id: 'test-vehicle-1',
              status: 'in_use',
              mileage: 1000,
              currentDriverId: 'test-driver-1'
            })
          });
        }
        // Driver document
        if (ref.path && ref.path.includes('drivers')) {
          return Promise.resolve({
            exists: true,
            data: () => ({
              id: 'test-driver-1',
              userId: 'test-user-1',
              status: 'on_mission',
              totalMissions: 5,
              currentVehicleId: 'test-vehicle-1',
              currentMissionId: 'test-mission-1'
            })
          });
        }
        return Promise.resolve({ exists: false });
      });

      // Mock hydration methods
      controller._hydrateMission = jest.fn().mockImplementation((mission) => 
        Promise.resolve({
          ...mission,
          driver: { id: 'test-driver-1', userId: 'test-user-1' },
          vehicle: { id: 'test-vehicle-1', plateNumber: 'V-123' }
        })
      );
    });

    it('should complete mission with distance, fuel consumed, and notes', async () => {
      // Arrange
      const payload = {
        distance: 25.5,
        fuelConsumed: 3.2,
        notes: 'Mission completed successfully',
        completedBy: userId,
        completedAt: '2025-01-15T10:30:00.000Z',
        userAgent: 'Test-Client/1.0',
        ipAddress: '192.168.1.100'
      };

      // Act
      const result = await controller.completeMission(userId, missionId, payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.distance).toBe(25.5);
      expect(result.fuelConsumed).toBe(3.2);
      expect(result.notes).toBe('Mission completed successfully');
      expect(result.auditTrail).toBeDefined();
      expect(result.auditTrail.completedBy).toBe(userId);
      expect(result.auditTrail.userAgent).toBe('Test-Client/1.0');
      expect(result.auditTrail.ipAddress).toBe('192.168.1.100');

      // Verify transaction calls
      expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(3); // mission, driver, vehicle
      expect(mockTransaction.set).toHaveBeenCalledTimes(2); // notification, audit log
    });

    it('should handle optional parameters correctly', async () => {
      // Arrange
      const payload = {
        notes: 'Only notes provided'
      };

      // Act
      const result = await controller.completeMission(userId, missionId, payload);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.notes).toBe('Only notes provided');
      expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
    });

    it('should create proper audit trail entries', async () => {
      // Arrange
      const payload = {
        distance: 15.0,
        fuelConsumed: 2.0,
        notes: 'Audit trail test',
        userAgent: 'Mobile-App/2.0',
        ipAddress: '10.0.0.1'
      };

      // Act
      await controller.completeMission(userId, missionId, payload);

      // Assert - Check that audit log was created
      const auditLogCalls = mockTransaction.set.mock.calls.filter(call => 
        call[1] && call[1].entityType === 'mission'
      );
      
      expect(auditLogCalls).toHaveLength(1);
      const auditLogData = auditLogCalls[0][1];
      expect(auditLogData.action).toBe('complete');
      expect(auditLogData.userId).toBe(userId);
      expect(auditLogData.metadata.userAgent).toBe('Mobile-App/2.0');
      expect(auditLogData.metadata.ipAddress).toBe('10.0.0.1');
      expect(auditLogData.changes.status.from).toBe('in_progress');
      expect(auditLogData.changes.status.to).toBe('completed');
    });

    it('should update vehicle mileage when distance is provided', async () => {
      // Arrange
      const payload = { distance: 50.0 };

      // Act
      await controller.completeMission(userId, missionId, payload);

      // Assert - Check vehicle update call
      const vehicleUpdateCalls = mockTransaction.update.mock.calls.filter(call =>
        call[1] && call[1].mileage !== undefined
      );
      
      expect(vehicleUpdateCalls).toHaveLength(1);
      expect(vehicleUpdateCalls[0][1].mileage).toBe(1050); // 1000 + 50
    });

    it('should include enhanced status history with audit info', async () => {
      // Arrange
      const payload = {
        distance: 20.0,
        fuelConsumed: 2.5,
        notes: 'Enhanced audit test',
        userAgent: 'Mobile-App/3.0',
        ipAddress: '172.16.0.1'
      };

      // Act
      await controller.completeMission(userId, missionId, payload);

      // Assert - Check status history in mission update
      const missionUpdateCalls = mockTransaction.update.mock.calls.filter(call =>
        call[1] && call[1].statusHistory !== undefined
      );
      
      expect(missionUpdateCalls).toHaveLength(1);
      const statusHistory = missionUpdateCalls[0][1].statusHistory;
      expect(statusHistory).toHaveLength(1);
      expect(statusHistory[0]).toMatchObject({
        status: 'completed',
        updatedBy: userId,
        reason: 'Mission completed by driver'
      });
      expect(statusHistory[0].auditInfo).toBeDefined();
      expect(statusHistory[0].auditInfo.userAgent).toBe('Mobile-App/3.0');
      expect(statusHistory[0].auditInfo.ipAddress).toBe('172.16.0.1');
      expect(statusHistory[0].auditInfo.distance).toBe(20.0);
      expect(statusHistory[0].auditInfo.fuelConsumed).toBe(2.5);
      expect(statusHistory[0].auditInfo.hasNotes).toBe(true);
    });

    it('should create enhanced notification with metadata', async () => {
      // Arrange
      const payload = {
        distance: 30.0,
        fuelConsumed: 4.0,
        notes: 'Notification test'
      };

      // Act
      await controller.completeMission(userId, missionId, payload);

      // Assert - Check notification creation
      const notificationCalls = mockTransaction.set.mock.calls.filter(call =>
        call[1] && call[1].title === 'Mission terminée'
      );
      
      expect(notificationCalls).toHaveLength(1);
      const notificationData = notificationCalls[0][1];
      expect(notificationData.metadata).toBeDefined();
      expect(notificationData.metadata.missionId).toBe(missionId);
      expect(notificationData.metadata.distance).toBe(30.0);
      expect(notificationData.metadata.fuelConsumed).toBe(4.0);
      expect(notificationData.metadata.completedBy).toBe(userId);
    });
  });

  describe('Error handling and validation', () => {
    const userId = 'test-user-1';
    const missionId = 'test-mission-1';

    beforeEach(() => {
      // Mock driver lookup
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'test-driver-1',
          data: () => ({ userId: 'test-user-1', status: 'on_mission' })
        }]
      });
    });

    it('should handle database transaction failures gracefully', async () => {
      // Arrange
      const payload = { notes: 'Transaction failure test' };
      mockDb.runTransaction.mockRejectedValue(new Error('Transaction failed'));

      // Act & Assert
      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Transaction failed');
    });

    it('should handle missing vehicle gracefully', async () => {
      // Arrange
      const payload = { notes: 'Missing vehicle test' };

      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path && ref.path.includes('missions')) {
          return Promise.resolve({
            exists: true,
            id: 'test-mission-1',
            data: () => ({
              driverId: 'test-driver-1',
              vehicleId: 'test-vehicle-1',
              status: 'in_progress'
            })
          });
        }
        if (ref.path && ref.path.includes('drivers')) {
          return Promise.resolve({
            exists: true,
            data: () => ({ status: 'on_mission' })
          });
        }
        if (ref.path && ref.path.includes('vehicles')) {
          return Promise.resolve({ exists: false });
        }
        return Promise.resolve({ exists: false });
      });

      // Act & Assert
      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Véhicule associé introuvable.');
    });

    it('should reject mission completion for wrong driver', async () => {
      // Arrange
      const payload = { notes: 'Unauthorized attempt' };

      // Mock driver not found
      mockCollection.where().limit().get.mockResolvedValue({
        empty: true,
        docs: []
      });

      // Act & Assert
      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Chauffeur introuvable pour cet utilisateur.');
    });

    it('should reject completion of already completed mission', async () => {
      // Arrange
      const payload = { notes: 'Already completed' };

      mockTransaction.get.mockImplementation((ref) => {
        if (ref.path && ref.path.includes('missions')) {
          return Promise.resolve({
            exists: true,
            id: 'test-mission-1',
            data: () => ({
              driverId: 'test-driver-1',
              vehicleId: 'test-vehicle-1',
              status: 'completed' // Already completed
            })
          });
        }
        return Promise.resolve({ exists: true, data: () => ({}) });
      });

      // Act & Assert
      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Cette mission ne peut plus être terminée.');
    });
  });
});