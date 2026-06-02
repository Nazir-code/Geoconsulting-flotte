import admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Mission Status Controller
 * Handles mission status updates with Firestore transactions
 * Supports complete and cancel operations with proper validation
 * Includes driver and vehicle status updates in transactions
 * 
 * Requirements: 1.1, 1.2, 1.3, 4.1, 4.4
 */
export class MissionStatusController {
  
  /**
   * Complete a mission with transaction support
   * Updates mission, driver, and vehicle status atomically
   * 
   * @param {string} userId - The authenticated user ID
   * @param {string} missionId - The mission ID to complete
   * @param {Object} payload - Mission completion data
   * @param {number} [payload.distance] - Distance traveled
   * @param {number} [payload.fuelConsumed] - Fuel consumed during mission
   * @param {string} [payload.notes] - Additional notes
   * @param {string} [payload.completedBy] - User ID who completed the mission
   * @param {string} [payload.completedAt] - Completion timestamp
   * @param {string} [payload.userAgent] - User agent for audit trail
   * @param {string} [payload.ipAddress] - IP address for audit trail
   * @returns {Promise<Object>} The completed mission with hydrated data
   */
  async completeMission(userId, missionId, payload = {}) {
    try {
      // First, get the driver to validate ownership
      const driver = await this._getDriverForUser(userId);
      
      // Run the completion in a Firestore transaction
      const result = await db.runTransaction(async (transaction) => {
        // Get mission document
        const missionRef = db.collection('missions').doc(missionId);
        const missionDoc = await transaction.get(missionRef);
        
        if (!missionDoc.exists) {
          throw new Error('Mission introuvable.');
        }
        
        const mission = { id: missionDoc.id, ...missionDoc.data() };
        
        // Validate mission ownership
        if (mission.driverId !== driver.id) {
          throw new Error('Vous n\'êtes pas autorisé à modifier cette mission.');
        }
        
        // Validate mission status
        if (mission.status !== 'in_progress') {
          throw new Error('Cette mission ne peut plus être terminée.');
        }
        
        // Get vehicle document
        const vehicleRef = db.collection('vehicles').doc(mission.vehicleId);
        const vehicleDoc = await transaction.get(vehicleRef);
        
        if (!vehicleDoc.exists) {
          throw new Error('Véhicule associé introuvable.');
        }
        
        const vehicle = vehicleDoc.data();
        
        // Get driver document
        const driverRef = db.collection('drivers').doc(driver.id);
        const driverDoc = await transaction.get(driverRef);
        
        if (!driverDoc.exists) {
          throw new Error('Profil chauffeur introuvable.');
        }
        
        const driverData = driverDoc.data();
        
        // Prepare updates
        const now = payload.completedAt || new Date().toISOString();
        const completedBy = payload.completedBy || userId;
        
        // Mission updates with enhanced audit trail
        const missionUpdates = {
          status: 'completed',
          endTime: now,
          endLocation: mission.destination,
          distance: Number.isFinite(payload.distance) ? Number(payload.distance) : mission.distance,
          fuelConsumed: Number.isFinite(payload.fuelConsumed) ? Number(payload.fuelConsumed) : mission.fuelConsumed,
          notes: payload.notes ? String(payload.notes).trim() : mission.notes,
          updatedAt: now,
          lastUpdated: now,
          updatedBy: completedBy,
          syncVersion: (mission.syncVersion || 0) + 1,
          // Enhanced audit trail
          auditTrail: {
            completedBy: completedBy,
            completedAt: now,
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown',
            action: 'complete'
          }
        };
        
        // Add to status history for audit trail
        const statusHistory = mission.statusHistory || [];
        statusHistory.push({
          status: 'completed',
          timestamp: now,
          updatedBy: completedBy,
          reason: 'Mission completed by driver',
          auditInfo: {
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown',
            distance: missionUpdates.distance,
            fuelConsumed: missionUpdates.fuelConsumed,
            hasNotes: !!missionUpdates.notes
          }
        });
        missionUpdates.statusHistory = statusHistory;
        
        // Driver updates
        const driverUpdates = {
          status: 'active',
          totalMissions: (driverData.totalMissions || 0) + 1,
          currentVehicleId: admin.firestore.FieldValue.delete(),
          currentMissionId: admin.firestore.FieldValue.delete(),
          updatedAt: now,
          lastActivity: now
        };
        
        // Vehicle updates
        const mileageUpdate = Number.isFinite(payload.distance) 
          ? (vehicle.mileage || 0) + Number(payload.distance) 
          : vehicle.mileage || 0;
          
        const vehicleUpdates = {
          status: 'available',
          currentDriverId: admin.firestore.FieldValue.delete(),
          mileage: mileageUpdate,
          updatedAt: now
        };
        
        // Execute all updates in transaction
        transaction.update(missionRef, missionUpdates);
        transaction.update(driverRef, driverUpdates);
        transaction.update(vehicleRef, vehicleUpdates);
        
        // Create enhanced notification with audit information
        const notificationRef = db.collection('notifications').doc();
        transaction.set(notificationRef, {
          userId: driver.userId,
          title: 'Mission terminée',
          message: `Mission vers ${mission.destination} terminée avec succès`,
          type: 'success',
          isRead: false,
          link: '/missions',
          createdAt: now,
          metadata: {
            missionId: missionId,
            distance: missionUpdates.distance,
            fuelConsumed: missionUpdates.fuelConsumed,
            completedBy: completedBy
          }
        });
        
        // Create audit log entry
        const auditLogRef = db.collection('audit_logs').doc();
        transaction.set(auditLogRef, {
          entityType: 'mission',
          entityId: missionId,
          action: 'complete',
          userId: completedBy,
          timestamp: now,
          changes: {
            status: { from: 'in_progress', to: 'completed' },
            endTime: { from: null, to: now },
            distance: { from: mission.distance, to: missionUpdates.distance },
            fuelConsumed: { from: mission.fuelConsumed, to: missionUpdates.fuelConsumed },
            notes: { from: mission.notes, to: missionUpdates.notes }
          },
          metadata: {
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown',
            driverId: driver.id,
            vehicleId: mission.vehicleId
          }
        });
        
        // Return the updated mission data
        return {
          ...mission,
          ...missionUpdates
        };
      });
      
      // Hydrate the result with related data
      return await this._hydrateMission(result);
      
    } catch (error) {
      console.error('Error completing mission:', error);
      throw error;
    }
  }
  
  /**
   * Cancel a mission with transaction support
   * Updates mission, driver, and vehicle status atomically
   * 
   * @param {string} userId - The authenticated user ID
   * @param {string} missionId - The mission ID to cancel
   * @param {Object} payload - Mission cancellation data
   * @param {string} payload.reason - Reason for cancellation
   * @param {string} [payload.cancelledBy] - User ID who cancelled the mission
   * @param {string} [payload.cancelledAt] - Cancellation timestamp
   * @param {string} [payload.userAgent] - User agent for audit trail
   * @param {string} [payload.ipAddress] - IP address for audit trail
   * @returns {Promise<Object>} The cancelled mission with hydrated data
   */
  async cancelMission(userId, missionId, payload = {}) {
    try {
      // Validate required fields
      if (!payload.reason || !String(payload.reason).trim()) {
        throw new Error('La raison de l\'annulation est obligatoire.');
      }
      
      // First, get the driver to validate ownership
      const driver = await this._getDriverForUser(userId);
      
      // Run the cancellation in a Firestore transaction
      const result = await db.runTransaction(async (transaction) => {
        // Get mission document
        const missionRef = db.collection('missions').doc(missionId);
        const missionDoc = await transaction.get(missionRef);
        
        if (!missionDoc.exists) {
          throw new Error('Mission introuvable.');
        }
        
        const mission = { id: missionDoc.id, ...missionDoc.data() };
        
        // Validate mission ownership
        if (mission.driverId !== driver.id) {
          throw new Error('Vous n\'êtes pas autorisé à modifier cette mission.');
        }
        
        // Validate mission status
        if (mission.status !== 'in_progress') {
          throw new Error('Cette mission ne peut plus être annulée.');
        }
        
        // Get vehicle document
        const vehicleRef = db.collection('vehicles').doc(mission.vehicleId);
        const vehicleDoc = await transaction.get(vehicleRef);
        
        if (!vehicleDoc.exists) {
          throw new Error('Véhicule associé introuvable.');
        }
        
        // Get driver document
        const driverRef = db.collection('drivers').doc(driver.id);
        const driverDoc = await transaction.get(driverRef);
        
        if (!driverDoc.exists) {
          throw new Error('Profil chauffeur introuvable.');
        }
        
        // Prepare updates
        const now = payload.cancelledAt || new Date().toISOString();
        const cancelledBy = payload.cancelledBy || userId;
        const reason = String(payload.reason).trim();
        
        // Mission updates with enhanced audit trail
        const missionUpdates = {
          status: 'cancelled',
          endTime: now,
          endLocation: mission.startLocation, // Return to start location
          notes: reason,
          updatedAt: now,
          lastUpdated: now,
          updatedBy: cancelledBy,
          syncVersion: (mission.syncVersion || 0) + 1,
          // Enhanced audit trail
          auditTrail: {
            cancelledBy: cancelledBy,
            cancelledAt: now,
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown',
            action: 'cancel',
            reason: reason
          }
        };
        
        // Add to status history for audit trail
        const statusHistory = mission.statusHistory || [];
        statusHistory.push({
          status: 'cancelled',
          timestamp: now,
          updatedBy: cancelledBy,
          reason: reason,
          auditInfo: {
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown'
          }
        });
        missionUpdates.statusHistory = statusHistory;
        
        // Driver updates
        const driverUpdates = {
          status: 'active',
          currentVehicleId: admin.firestore.FieldValue.delete(),
          currentMissionId: admin.firestore.FieldValue.delete(),
          updatedAt: now,
          lastActivity: now
        };
        
        // Vehicle updates
        const vehicleUpdates = {
          status: 'available',
          currentDriverId: admin.firestore.FieldValue.delete(),
          updatedAt: now
        };
        
        // Execute all updates in transaction
        transaction.update(missionRef, missionUpdates);
        transaction.update(driverRef, driverUpdates);
        transaction.update(vehicleRef, vehicleUpdates);
        
        // Create enhanced notification with audit information
        const notificationRef = db.collection('notifications').doc();
        transaction.set(notificationRef, {
          userId: driver.userId,
          title: 'Mission annulée',
          message: `Mission vers ${mission.destination} annulée: ${reason}`,
          type: 'warning',
          isRead: false,
          link: '/missions',
          createdAt: now,
          metadata: {
            missionId: missionId,
            reason: reason,
            cancelledBy: cancelledBy
          }
        });
        
        // Create audit log entry
        const auditLogRef = db.collection('audit_logs').doc();
        transaction.set(auditLogRef, {
          entityType: 'mission',
          entityId: missionId,
          action: 'cancel',
          userId: cancelledBy,
          timestamp: now,
          changes: {
            status: { from: 'in_progress', to: 'cancelled' },
            endTime: { from: null, to: now },
            notes: { from: mission.notes, to: reason }
          },
          metadata: {
            userAgent: payload.userAgent || 'Unknown',
            ipAddress: payload.ipAddress || 'Unknown',
            driverId: driver.id,
            vehicleId: mission.vehicleId,
            reason: reason
          }
        });
        
        // Return the updated mission data
        return {
          ...mission,
          ...missionUpdates
        };
      });
      
      // Hydrate the result with related data
      return await this._hydrateMission(result);
      
    } catch (error) {
      console.error('Error cancelling mission:', error);
      throw error;
    }
  }
  
  /**
   * Get mission status with real-time data
   * 
   * @param {string} userId - The authenticated user ID
   * @param {string} missionId - The mission ID to retrieve
   * @returns {Promise<Object>} The mission with hydrated data
   */
  async getMissionStatus(userId, missionId) {
    try {
      // Get the driver to validate ownership
      const driver = await this._getDriverForUser(userId);
      
      // Get mission document
      const missionDoc = await db.collection('missions').doc(missionId).get();
      
      if (!missionDoc.exists) {
        throw new Error('Mission introuvable.');
      }
      
      const mission = { id: missionDoc.id, ...missionDoc.data() };
      
      // Validate mission ownership
      if (mission.driverId !== driver.id) {
        throw new Error('Vous n\'êtes pas autorisé à consulter cette mission.');
      }
      
      // Hydrate and return the mission
      return await this._hydrateMission(mission);
      
    } catch (error) {
      console.error('Error getting mission status:', error);
      throw error;
    }
  }
  
  // Private helper methods
  
  /**
   * Get driver for user with validation
   * @private
   */
  async _getDriverForUser(userId) {
    const snapshot = await db.collection('drivers')
      .where('userId', '==', userId)
      .limit(1)
      .get();
      
    if (snapshot.empty) {
      throw new Error('Chauffeur introuvable pour cet utilisateur.');
    }
    
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  
  /**
   * Get user by ID
   * @private
   */
  async _getUserById(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? doc.data() : null;
  }
  
  /**
   * Get driver by ID
   * @private
   */
  async _getDriverById(driverId) {
    const doc = await db.collection('drivers').doc(driverId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  
  /**
   * Get vehicle by ID
   * @private
   */
  async _getVehicleById(vehicleId) {
    const doc = await db.collection('vehicles').doc(vehicleId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }
  
  /**
   * Sanitize user data by removing sensitive fields
   * @private
   */
  _sanitizeUser(user) {
    if (!user) return null;
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
  }
  
  /**
   * Hydrate driver with user and vehicle data
   * @private
   */
  async _hydrateDriver(driver) {
    if (!driver) return null;
    
    const [user, currentVehicle] = await Promise.all([
      driver.userId ? this._getUserById(driver.userId) : Promise.resolve(null),
      driver.currentVehicleId ? this._getVehicleById(driver.currentVehicleId) : Promise.resolve(null),
    ]);

    return {
      ...driver,
      user: user ? this._sanitizeUser(user) : null,
      currentVehicle: currentVehicle || undefined,
    };
  }
  
  /**
   * Hydrate vehicle with driver data
   * @private
   */
  async _hydrateVehicle(vehicle) {
    if (!vehicle) return null;

    let currentDriver = null;
    if (vehicle.currentDriverId) {
      currentDriver = await this._getDriverById(vehicle.currentDriverId);
      if (currentDriver) {
        currentDriver = await this._hydrateDriver(currentDriver);
      }
    }

    return {
      ...vehicle,
      currentDriver: currentDriver || undefined,
    };
  }
  
  /**
   * Hydrate mission with driver and vehicle data
   * @private
   */
  async _hydrateMission(mission) {
    if (!mission) return null;

    const [driver, vehicle] = await Promise.all([
      mission.driverId ? this._getDriverById(mission.driverId) : Promise.resolve(null),
      mission.vehicleId ? this._getVehicleById(mission.vehicleId) : Promise.resolve(null),
    ]);

    return {
      ...mission,
      driver: driver ? await this._hydrateDriver(driver) : null,
      vehicle: vehicle ? await this._hydrateVehicle(vehicle) : undefined,
    };
  }
}