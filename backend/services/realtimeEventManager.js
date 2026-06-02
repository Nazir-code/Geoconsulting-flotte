/**
 * Real-time Event Manager Service
 * 
 * Manages Socket.IO event emission and client targeting for mission real-time synchronization.
 * Handles mission updates, driver status updates, and vehicle status updates with proper
 * client filtering and event logging.
 * 
 * Requirements: 2.1, 2.2, 2.3, 7.1
 */

class RealtimeEventManager {
  constructor(io) {
    this.io = io;
    this.clients = new Map(); // socketId -> { clientType, userId, connectedAt }
    this.eventLog = []; // Store recent events for debugging
    this.maxLogSize = 1000;
  }

  /**
   * Register a client for targeted event delivery
   * @param {string} socketId - Socket.IO client ID
   * @param {string} clientType - Type of client ('mobile', 'web', 'admin')
   * @param {string} userId - User ID for the client
   */
  registerClient(socketId, clientType, userId) {
    this.clients.set(socketId, {
      clientType,
      userId,
      connectedAt: new Date().toISOString()
    });
    
    this.logEvent('client_registered', {
      socketId,
      clientType,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Unregister a client
   * @param {string} socketId - Socket.IO client ID
   */
  unregisterClient(socketId) {
    const client = this.clients.get(socketId);
    if (client) {
      this.clients.delete(socketId);
      this.logEvent('client_unregistered', {
        socketId,
        clientType: client.clientType,
        userId: client.userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get targeted clients for a specific event type and data
   * @param {string} eventType - Type of event ('mission_update', 'driver_status_update', etc.)
   * @param {Object} data - Event data for filtering
   * @returns {Array} Array of socket IDs to target
   */
  getTargetedClients(eventType, data) {
    const targetedSockets = [];
    
    for (const [socketId, client] of this.clients.entries()) {
      let shouldTarget = false;
      
      switch (eventType) {
        case 'mission_update':
          // Target all web clients and the specific driver involved
          if (client.clientType === 'web' || client.clientType === 'admin') {
            shouldTarget = true;
          } else if (client.clientType === 'mobile' && data.mission && data.mission.driver) {
            // Target the specific driver's mobile app
            shouldTarget = client.userId === data.mission.driver.userId;
          }
          break;
          
        case 'driver_status_update':
          // Target all web clients and the specific driver
          if (client.clientType === 'web' || client.clientType === 'admin') {
            shouldTarget = true;
          } else if (client.clientType === 'mobile' && data.driverId) {
            // Find the driver's userId from the driverId
            shouldTarget = this.isDriverClient(client.userId, data.driverId);
          }
          break;
          
        case 'vehicle_status_update':
          // Target all web clients and drivers currently using the vehicle
          if (client.clientType === 'web' || client.clientType === 'admin') {
            shouldTarget = true;
          } else if (client.clientType === 'mobile' && data.currentDriverId) {
            shouldTarget = this.isDriverClient(client.userId, data.currentDriverId);
          }
          break;
          
        default:
          // For unknown event types, target all clients
          shouldTarget = true;
      }
      
      if (shouldTarget) {
        targetedSockets.push(socketId);
      }
    }
    
    return targetedSockets;
  }

  /**
   * Helper method to check if a userId corresponds to a driverId
   * This is a simplified check - in production, you might want to cache this mapping
   * @param {string} userId - User ID from client
   * @param {string} driverId - Driver ID from event data
   * @returns {boolean} True if the user is the driver
   */
  isDriverClient(userId, driverId) {
    // For now, we'll use a simple pattern matching
    // In production, you'd want to maintain a proper mapping
    return userId && driverId && (userId === driverId || `d${userId}` === driverId);
  }

  /**
   * Emit mission update event with complete data payload
   * @param {Object} mission - Complete mission object with hydrated data
   * @param {string|Array} targetClients - 'all' or array of specific socket IDs
   */
  emitMissionUpdate(mission, targetClients = 'all') {
    const eventData = {
      type: 'mission_update',
      data: {
        mission,
        previousStatus: mission.previousStatus, // Should be set by caller if available
        timestamp: new Date().toISOString()
      }
    };

    this.emitEvent('mission_update', eventData, targetClients);
  }

  /**
   * Emit driver status update event
   * @param {string} driverId - Driver ID
   * @param {string} status - New driver status ('active', 'on_mission', 'off')
   * @param {string} previousStatus - Previous status for comparison
   * @param {string} vehicleId - Associated vehicle ID (optional)
   * @param {string|Array} targetClients - 'all' or array of specific socket IDs
   */
  emitDriverStatusUpdate(driverId, status, previousStatus = null, vehicleId = null, targetClients = 'all') {
    const eventData = {
      type: 'driver_status_update',
      data: {
        driverId,
        status,
        previousStatus,
        vehicleId,
        timestamp: new Date().toISOString()
      }
    };

    this.emitEvent('driver_status_update', eventData, targetClients);
  }

  /**
   * Emit vehicle status update event with targeting
   * @param {string} vehicleId - Vehicle ID
   * @param {string} status - New vehicle status ('available', 'on_mission', 'maintenance')
   * @param {string} currentDriverId - Current driver ID (optional)
   * @param {string} previousStatus - Previous status for comparison
   * @param {string|Array} targetClients - 'all' or array of specific socket IDs
   */
  emitVehicleStatusUpdate(vehicleId, status, currentDriverId = null, previousStatus = null, targetClients = 'all') {
    const eventData = {
      type: 'vehicle_status_update',
      data: {
        vehicleId,
        status,
        currentDriverId,
        previousStatus,
        timestamp: new Date().toISOString()
      }
    };

    this.emitEvent('vehicle_status_update', eventData, targetClients);
  }

  /**
   * Generic event emission with targeting and logging
   * @param {string} eventName - Socket.IO event name
   * @param {Object} eventData - Event data to send
   * @param {string|Array} targetClients - 'all' or array of specific socket IDs
   */
  emitEvent(eventName, eventData, targetClients = 'all') {
    try {
      let actualTargets = [];

      if (targetClients === 'all') {
        // Emit to all connected clients
        this.io.emit(eventName, eventData);
        actualTargets = Array.from(this.clients.keys());
      } else if (Array.isArray(targetClients)) {
        // Emit to specific clients
        targetClients.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit(eventName, eventData);
            actualTargets.push(socketId);
          }
        });
      } else {
        // Use intelligent targeting based on event type and data
        const targetedSockets = this.getTargetedClients(eventName, eventData.data);
        targetedSockets.forEach(socketId => {
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit(eventName, eventData);
            actualTargets.push(socketId);
          }
        });
      }

      // Log the event emission
      this.logEvent('event_emitted', {
        eventName,
        eventType: eventData.type,
        targetCount: actualTargets.length,
        actualTargets,
        timestamp: new Date().toISOString(),
        dataKeys: Object.keys(eventData.data || {})
      });

      console.log(`✅ Emitted ${eventName} to ${actualTargets.length} clients`);
      
    } catch (error) {
      console.error(`❌ Error emitting ${eventName}:`, error);
      
      this.logEvent('event_emission_error', {
        eventName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log events for monitoring and debugging
   * @param {string} eventType - Type of log event
   * @param {Object} data - Event data to log
   */
  logEvent(eventType, data) {
    const logEntry = {
      eventType,
      ...data,
      loggedAt: new Date().toISOString()
    };

    this.eventLog.push(logEntry);

    // Keep log size manageable
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }

    // Also log to console for immediate visibility
    if (eventType === 'event_emission_error') {
      console.error('🔴 Event emission error:', data);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`📡 ${eventType}:`, data);
    }
  }

  /**
   * Get recent event logs for debugging
   * @param {number} limit - Maximum number of logs to return
   * @returns {Array} Recent event logs
   */
  getEventLogs(limit = 50) {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get current client statistics
   * @returns {Object} Client statistics
   */
  getClientStats() {
    const stats = {
      totalClients: this.clients.size,
      clientsByType: {},
      connectedClients: []
    };

    for (const [socketId, client] of this.clients.entries()) {
      // Count by type
      stats.clientsByType[client.clientType] = (stats.clientsByType[client.clientType] || 0) + 1;
      
      // Add to connected list
      stats.connectedClients.push({
        socketId,
        clientType: client.clientType,
        userId: client.userId,
        connectedAt: client.connectedAt
      });
    }

    return stats;
  }

  /**
   * Clear event logs (useful for testing or maintenance)
   */
  clearEventLogs() {
    this.eventLog = [];
    console.log('🧹 Event logs cleared');
  }
}

export { RealtimeEventManager };