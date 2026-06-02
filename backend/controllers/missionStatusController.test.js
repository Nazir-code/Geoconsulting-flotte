const { jest } = require('@jest/globals');
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

describe('MissionStatusController', () => {
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
      id: 'test-id',
      data: jest.fn(),
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

  describe('completeMission', () => {
    const userId = 'user123';
    const missionId = 'mission123';
    const payload = {
      distance: 150,
      fuelConsumed: 25,
      notes: 'Mission completed successfully'
    };

    beforeEach(() => {
      // Mock driver lookup
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'driver123',
          data: () => ({ userId: 'user123', status: 'on_mission' })
        }]
      });

      // Mock mission document
      mockTransaction.get.mockImplementation((ref) => {
        if (ref === mockDoc) {
          return Promise.resolve({
            exists: true,
            id: 'mission123',
            data: () => ({
              driverId: 'driver123',
              vehicleId: 'vehicle123',
              status: 'in_progress',
              destination: 'Test Destination',
              startLocation: 'Test Start',
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
              status: 'on_mission',
              mileage: 1000,
              currentDriverId: 'driver123'
            })
          });
        }
        // Driver document
        if (ref.path && ref.path.includes('drivers')) {
          return Promise.resolve({
            exists: true,
            data: () => ({
              status: 'on_mission',
              totalMissions: 5,
              userId: 'user123'
            })
          });
        }
        return Promise.resolve({ exists: false });
      });

      // Mock hydration methods
      controller._getUserById = jest.fn().mockResolvedValue({
        id: 'user123',
        firstName: 'Test',
        lastName: 'User'
      });
      
      controller._getDriverById = jest.fn().mockResolvedValue({
        id: 'driver123',
        userId: 'user123',
        status: 'active'
      });
      
      controller._getVehicleById = jest.fn().mockResolvedValue({
        id: 'vehicle123',
        plateNumber: 'V-123',
        status: 'available'
      });
    });

    it('should complete mission successfully with valid data', async () => {
      const result = await controller.completeMission(userId, missionId, payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.distance).toBe(150);
      expect(result.fuelConsumed).toBe(25);
      expect(result.notes).toBe('Mission completed successfully');
      expect(result.endTime).toBeDefined();
      expect(result.syncVersion).toBe(2);
      
      // Verify transaction calls
      expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(3); // mission, driver, vehicle
      expect(mockTransaction.set).toHaveBeenCalledTimes(1); // notification
    });

    it('should throw error if mission not found', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: false
      });

      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Mission introuvable.');
    });

    it('should throw error if user is not mission owner', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: true,
        id: 'mission123',
        data: () => ({
          driverId: 'different-driver',
          status: 'in_progress'
        })
      });

      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Vous n\'êtes pas autorisé à modifier cette mission.');
    });

    it('should throw error if mission is not in progress', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: true,
        id: 'mission123',
        data: () => ({
          driverId: 'driver123',
          status: 'completed'
        })
      });

      await expect(controller.completeMission(userId, missionId, payload))
        .rejects.toThrow('Cette mission ne peut plus être terminée.');
    });

    it('should handle missing optional payload fields', async () => {
      const minimalPayload = {};
      
      const result = await controller.completeMission(userId, missionId, minimalPayload);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      // Should preserve existing values when payload fields are missing
    });

    it('should update status history with audit trail', async () => {
      await controller.completeMission(userId, missionId, payload);

      const updateCall = mockTransaction.update.mock.calls.find(call => 
        call[1].statusHistory !== undefined
      );
      
      expect(updateCall).toBeDefined();
      expect(updateCall[1].statusHistory).toHaveLength(1);
      expect(updateCall[1].statusHistory[0]).toMatchObject({
        status: 'completed',
        updatedBy: userId,
        reason: 'Mission completed by driver'
      });
    });
  });

  describe('cancelMission', () => {
    const userId = 'user123';
    const missionId = 'mission123';
    const payload = {
      reason: 'Vehicle breakdown'
    };

    beforeEach(() => {
      // Mock driver lookup
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'driver123',
          data: () => ({ userId: 'user123', status: 'on_mission' })
        }]
      });

      // Mock documents
      mockTransaction.get.mockImplementation((ref) => {
        if (ref === mockDoc) {
          return Promise.resolve({
            exists: true,
            id: 'mission123',
            data: () => ({
              driverId: 'driver123',
              vehicleId: 'vehicle123',
              status: 'in_progress',
              destination: 'Test Destination',
              startLocation: 'Test Start',
              syncVersion: 1,
              statusHistory: []
            })
          });
        }
        return Promise.resolve({
          exists: true,
          data: () => ({})
        });
      });

      // Mock hydration methods
      controller._getUserById = jest.fn().mockResolvedValue({ id: 'user123' });
      controller._getDriverById = jest.fn().mockResolvedValue({ id: 'driver123' });
      controller._getVehicleById = jest.fn().mockResolvedValue({ id: 'vehicle123' });
    });

    it('should cancel mission successfully with valid reason', async () => {
      const result = await controller.cancelMission(userId, missionId, payload);

      expect(result).toBeDefined();
      expect(result.status).toBe('cancelled');
      expect(result.notes).toBe('Vehicle breakdown');
      expect(result.endTime).toBeDefined();
      expect(result.syncVersion).toBe(2);
      
      // Verify transaction calls
      expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction.update).toHaveBeenCalledTimes(3); // mission, driver, vehicle
      expect(mockTransaction.set).toHaveBeenCalledTimes(1); // notification
    });

    it('should throw error if reason is missing', async () => {
      const invalidPayload = {};

      await expect(controller.cancelMission(userId, missionId, invalidPayload))
        .rejects.toThrow('La raison de l\'annulation est obligatoire.');
    });

    it('should throw error if reason is empty string', async () => {
      const invalidPayload = { reason: '   ' };

      await expect(controller.cancelMission(userId, missionId, invalidPayload))
        .rejects.toThrow('La raison de l\'annulation est obligatoire.');
    });

    it('should update status history with cancellation reason', async () => {
      await controller.cancelMission(userId, missionId, payload);

      const updateCall = mockTransaction.update.mock.calls.find(call => 
        call[1].statusHistory !== undefined
      );
      
      expect(updateCall).toBeDefined();
      expect(updateCall[1].statusHistory).toHaveLength(1);
      expect(updateCall[1].statusHistory[0]).toMatchObject({
        status: 'cancelled',
        updatedBy: userId,
        reason: 'Vehicle breakdown'
      });
    });
  });

  describe('getMissionStatus', () => {
    const userId = 'user123';
    const missionId = 'mission123';

    beforeEach(() => {
      // Mock driver lookup
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{
          id: 'driver123',
          data: () => ({ userId: 'user123' })
        }]
      });

      // Mock mission document
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'mission123',
        data: () => ({
          driverId: 'driver123',
          vehicleId: 'vehicle123',
          status: 'in_progress',
          destination: 'Test Destination'
        })
      });

      // Mock hydration methods
      controller._hydrateMission = jest.fn().mockResolvedValue({
        id: 'mission123',
        status: 'in_progress',
        destination: 'Test Destination',
        driver: { id: 'driver123' },
        vehicle: { id: 'vehicle123' }
      });
    });

    it('should return mission status for authorized user', async () => {
      const result = await controller.getMissionStatus(userId, missionId);

      expect(result).toBeDefined();
      expect(result.id).toBe('mission123');
      expect(result.status).toBe('in_progress');
      expect(result.driver).toBeDefined();
      expect(result.vehicle).toBeDefined();
    });

    it('should throw error if mission not found', async () => {
      mockDoc.get.mockResolvedValue({
        exists: false
      });

      await expect(controller.getMissionStatus(userId, missionId))
        .rejects.toThrow('Mission introuvable.');
    });

    it('should throw error if user is not mission owner', async () => {
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: 'mission123',
        data: () => ({
          driverId: 'different-driver',
          status: 'in_progress'
        })
      });

      await expect(controller.getMissionStatus(userId, missionId))
        .rejects.toThrow('Vous n\'êtes pas autorisé à consulter cette mission.');
    });
  });

  describe('Error Handling', () => {
    const userId = 'user123';
    const missionId = 'mission123';

    it('should handle driver not found error', async () => {
      mockCollection.where().limit().get.mockResolvedValue({
        empty: true,
        docs: []
      });

      await expect(controller.completeMission(userId, missionId, {}))
        .rejects.toThrow('Chauffeur introuvable pour cet utilisateur.');
    });

    it('should handle Firestore transaction errors', async () => {
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'driver123', data: () => ({ userId: 'user123' }) }]
      });

      mockDb.runTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(controller.completeMission(userId, missionId, {}))
        .rejects.toThrow('Transaction failed');
    });

    it('should handle missing vehicle error', async () => {
      mockCollection.where().limit().get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'driver123', data: () => ({ userId: 'user123' }) }]
      });

      mockTransaction.get.mockImplementation((ref) => {
        if (ref === mockDoc) {
          return Promise.resolve({
            exists: true,
            id: 'mission123',
            data: () => ({
              driverId: 'driver123',
              vehicleId: 'vehicle123',
              status: 'in_progress'
            })
          });
        }
        // Return non-existent vehicle
        if (ref.path && ref.path.includes('vehicles')) {
          return Promise.resolve({ exists: false });
        }
        return Promise.resolve({ exists: true, data: () => ({}) });
      });

      await expect(controller.completeMission(userId, missionId, {}))
        .rejects.toThrow('Véhicule associé introuvable.');
    });
  });
});