// frontend/src/components/sync/MultiDeviceSync.jsx
// MULTI-DEVICE SYNCHRONISATION FÜR KAMPFRICHTER-SYSTEM

import React, { useState, useEffect, useContext, createContext } from 'react';
import { io } from 'socket.io-client';

// Context für Device-Synchronisation
const SyncContext = createContext({});

export const useSyncContext = () => useContext(SyncContext);

// Multi-Device Sync Provider
export const MultiDeviceSyncProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [activeDevices, setActiveDevices] = useState(new Map());
  const [syncedFights, setSyncedFights] = useState(new Map());
  const [masterDevice, setMasterDevice] = useState(null);
  const [isMaster, setIsMaster] = useState(false);
  const [deviceRole, setDeviceRole] = useState('secondary'); // 'master', 'primary', 'secondary', 'display'

  // Device-ID generieren
  useEffect(() => {
    let storedDeviceId = localStorage.getItem('deviceId');
    if (!storedDeviceId) {
      storedDeviceId = generateDeviceId();
      localStorage.setItem('deviceId', storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // WebSocket-Verbindung für Device-Sync
  useEffect(() => {
    if (!deviceId) return;

    const token = localStorage.getItem('token');
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      query: {
        deviceId,
        deviceType: getDeviceType(),
        userAgent: navigator.userAgent
      }
    });

    // Device-Authentifizierung
    newSocket.emit('authenticate', {
      token,
      userType: 'scorekeeper', // Kann auch 'referee', 'admin' sein
      deviceId,
      deviceCapabilities: getDeviceCapabilities()
    });

    // Connection Events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log(`🔗 Device ${deviceId} verbunden`);
      
      // Device registrieren
      newSocket.emit('register-device', {
        deviceId,
        type: getDeviceType(),
        capabilities: getDeviceCapabilities(),
        timestamp: new Date().toISOString()
      });
    });

    // Device-Liste aktualisieren
    newSocket.on('devices-updated', (devices) => {
      const deviceMap = new Map();
      devices.forEach(device => {
        deviceMap.set(device.deviceId, device);
      });
      setActiveDevices(deviceMap);
      
      // Master-Device ermitteln
      const master = devices.find(d => d.role === 'master');
      if (master) {
        setMasterDevice(master);
        setIsMaster(master.deviceId === deviceId);
      }
    });

    // Sync-Events
    newSocket.on('sync-state', (syncData) => {
      console.log('🔄 Sync-State empfangen:', syncData);
      handleSyncState(syncData);
    });

    newSocket.on('sync-command', (command) => {
      console.log('📡 Sync-Command:', command);
      handleSyncCommand(command);
    });

    newSocket.on('master-assignment', (data) => {
      console.log('👑 Master-Assignment:', data);
      setMasterDevice(data.master);
      setIsMaster(data.master.deviceId === deviceId);
      setDeviceRole(data.master.deviceId === deviceId ? 'master' : 'secondary');
    });

    newSocket.on('conflict-resolution', (resolution) => {
      console.log('⚖️ Conflict-Resolution:', resolution);
      handleConflictResolution(resolution);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log(`💔 Device ${deviceId} getrennt`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [deviceId]);

  // Device-ID generieren
  const generateDeviceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `device_${timestamp}_${random}`;
  };

  // Device-Typ ermitteln
  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      return /ipad|tablet/.test(userAgent) ? 'tablet' : 'mobile';
    }
    return 'desktop';
  };

  // Device-Capabilities ermitteln
  const getDeviceCapabilities = () => {
    return {
      touchSupport: 'ontouchstart' in window,
      vibration: 'vibrate' in navigator,
      orientation: 'orientation' in screen,
      fullscreen: 'requestFullscreen' in document.documentElement,
      camera: 'mediaDevices' in navigator,
      geolocation: 'geolocation' in navigator,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
  };

  // Fight-Sync starten
  const startFightSync = (kampfId, initialState = {}) => {
    if (!socket || !isConnected) return;

    const syncData = {
      kampfId,
      deviceId,
      state: initialState,
      timestamp: new Date().toISOString(),
      action: 'start_sync'
    };

    socket.emit('start-fight-sync', syncData);
    setSyncedFights(prev => new Map(prev).set(kampfId, initialState));
  };

  // Zustand synchronisieren
  const syncState = (kampfId, newState, priority = 'normal') => {
    if (!socket || !isConnected) return;

    const syncData = {
      kampfId,
      deviceId,
      state: newState,
      timestamp: new Date().toISOString(),
      priority, // 'low', 'normal', 'high', 'critical'
      checksum: calculateChecksum(newState)
    };

    socket.emit('sync-state', syncData);
    
    // Lokalen State aktualisieren
    setSyncedFights(prev => {
      const updated = new Map(prev);
      updated.set(kampfId, { ...updated.get(kampfId), ...newState });
      return updated;
    });
  };

  // Sync-State verarbeiten
  const handleSyncState = (syncData) => {
    const { kampfId, state, deviceId: sourceDevice, timestamp, priority } = syncData;
    
    // Konflikt-Erkennung
    const currentState = syncedFights.get(kampfId) || {};
    const hasConflict = detectConflict(currentState, state, sourceDevice);
    
    if (hasConflict) {
      resolveConflict(kampfId, currentState, state, sourceDevice, timestamp);
    } else {
      // State übernehmen
      setSyncedFights(prev => {
        const updated = new Map(prev);
        updated.set(kampfId, { ...updated.get(kampfId), ...state });
        return updated;
      });
    }
  };

  // Sync-Command verarbeiten
  const handleSyncCommand = (command) => {
    const { type, kampfId, data, sourceDevice } = command;
    
    switch (type) {
      case 'lock_fight':
        lockFight(kampfId, sourceDevice);
        break;
      case 'unlock_fight':
        unlockFight(kampfId, sourceDevice);
        break;
      case 'request_master':
        handleMasterRequest(sourceDevice, data);
        break;
      case 'force_sync':
        forceSyncFight(kampfId);
        break;
      default:
        console.warn('Unknown sync command:', type);
    }
  };

  // Konflikt erkennen
  const detectConflict = (currentState, incomingState, sourceDevice) => {
    // Zeitstempel-basierte Konflikt-Erkennung
    const currentTimestamp = currentState.lastUpdate ? new Date(currentState.lastUpdate) : new Date(0);
    const incomingTimestamp = incomingState.lastUpdate ? new Date(incomingState.lastUpdate) : new Date(0);
    
    // Gleichzeitige Updates (weniger als 1 Sekunde Unterschied)
    const timeDiff = Math.abs(currentTimestamp - incomingTimestamp);
    if (timeDiff < 1000) {
      // Prüfe auf unterschiedliche Werte
      return (currentState.kaempfer1Points !== incomingState.kaempfer1Points) ||
             (currentState.kaempfer2Points !== incomingState.kaempfer2Points) ||
             (currentState.status !== incomingState.status);
    }
    
    return false;
  };

  // Konflikt lösen
  const resolveConflict = (kampfId, currentState, incomingState, sourceDevice, timestamp) => {
    console.warn(`⚡ Konflikt erkannt für Kampf ${kampfId}`);
    
    // Master-Device hat Priorität
    if (isMaster) {
      console.log('👑 Als Master-Device wird lokaler State beibehalten');
      // Anderen Devices mitteilen, dass Master-State gilt
      if (socket) {
        socket.emit('resolve-conflict', {
          kampfId,
          resolution: 'master_priority',
          state: currentState,
          deviceId
        });
      }
      return;
    }
    
    // Timestamp-basierte Auflösung
    const currentTimestamp = new Date(currentState.lastUpdate || 0);
    const incomingTimestamp = new Date(timestamp);
    
    if (incomingTimestamp > currentTimestamp) {
      console.log('⏰ Incoming State ist neuer - wird übernommen');
      setSyncedFights(prev => {
        const updated = new Map(prev);
        updated.set(kampfId, { ...updated.get(kampfId), ...incomingState });
        return updated;
      });
    } else {
      console.log('⏰ Lokaler State ist neuer - wird beibehalten');
    }
  };

  // Konflikt-Resolution verarbeiten
  const handleConflictResolution = (resolution) => {
    const { kampfId, resolution: type, state, deviceId: sourceDevice } = resolution;
    
    if (type === 'master_priority' && sourceDevice !== deviceId) {
      console.log('👑 Master-Resolution akzeptiert');
      setSyncedFights(prev => {
        const updated = new Map(prev);
        updated.set(kampfId, { ...updated.get(kampfId), ...state });
        return updated;
      });
    }
  };

  // Checksum berechnen
  const calculateChecksum = (state) => {
    const str = JSON.stringify(state, Object.keys(state).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  };

  // Kampf sperren
  const lockFight = (kampfId, lockingDevice) => {
    console.log(`🔒 Kampf ${kampfId} gesperrt von ${lockingDevice}`);
    setSyncedFights(prev => {
      const updated = new Map(prev);
      const currentState = updated.get(kampfId) || {};
      updated.set(kampfId, {
        ...currentState,
        locked: true,
        lockedBy: lockingDevice,
        lockedAt: new Date().toISOString()
      });
      return updated;
    });
  };

  // Kampf entsperren
  const unlockFight = (kampfId, unlockingDevice) => {
    console.log(`🔓 Kampf ${kampfId} entsperrt von ${unlockingDevice}`);
    setSyncedFights(prev => {
      const updated = new Map(prev);
      const currentState = updated.get(kampfId) || {};
      updated.set(kampfId, {
        ...currentState,
        locked: false,
        lockedBy: null,
        lockedAt: null
      });
      return updated;
    });
  };

  // Master-Request verarbeiten
  const handleMasterRequest = (requestingDevice, data) => {
    if (isMaster) {
      // Master entscheidet über Request
      const shouldAccept = data.reason === 'device_failure' || data.priority === 'high';
      
      if (shouldAccept) {
        console.log(`👑 Master-Rechte werden an ${requestingDevice} übertragen`);
        socket.emit('transfer-master', {
          newMaster: requestingDevice,
          reason: data.reason
        });
        setIsMaster(false);
        setDeviceRole('secondary');
      }
    }
  };

  // Force-Sync für Kampf
  const forceSyncFight = (kampfId) => {
    if (socket && isConnected) {
      socket.emit('request-fight-state', { kampfId, deviceId });
    }
  };

  // Master werden
  const requestMaster = (reason = 'user_request') => {
    if (socket && isConnected && !isMaster) {
      socket.emit('request-master', {
        deviceId,
        reason,
        capabilities: getDeviceCapabilities(),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Sync-Status für Kampf abrufen
  const getFightSyncStatus = (kampfId) => {
    const fightState = syncedFights.get(kampfId) || {};
    return {
      isSynced: syncedFights.has(kampfId),
      lastUpdate: fightState.lastUpdate,
      locked: fightState.locked || false,
      lockedBy: fightState.lockedBy,
      conflicts: fightState.conflicts || 0,
      deviceCount: activeDevices.size
    };
  };

  // Context-Werte
  const contextValue = {
    // Connection State
    isConnected,
    deviceId,
    deviceRole,
    isMaster,
    masterDevice,
    
    // Device Management
    activeDevices,
    
    // Sync Functions
    startFightSync,
    syncState,
    getFightSyncStatus,
    requestMaster,
    
    // Fight Data
    syncedFights,
    
    // Utils
    lockFight: (kampfId) => {
      if (socket) {
        socket.emit('sync-command', {
          type: 'lock_fight',
          kampfId,
          sourceDevice: deviceId,
          timestamp: new Date().toISOString()
        });
      }
    },
    unlockFight: (kampfId) => {
      if (socket) {
        socket.emit('sync-command', {
          type: 'unlock_fight',
          kampfId,
          sourceDevice: deviceId,
          timestamp: new Date().toISOString()
        });
      }
    }
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

// Sync-Status Komponente
export const SyncStatusIndicator = ({ kampfId, showDetails = false }) => {
  const { isConnected, getFightSyncStatus, activeDevices, isMaster, deviceRole } = useSyncContext();
  
  const syncStatus = kampfId ? getFightSyncStatus(kampfId) : null;

  const getStatusColor = () => {
    if (!isConnected) return '#dc3545';
    if (syncStatus?.conflicts > 0) return '#ffc107';
    if (syncStatus?.isSynced) return '#28a745';
    return '#6c757d';
  };

  const getStatusText = () => {
    if (!isConnected) return 'OFFLINE';
    if (syncStatus?.conflicts > 0) return 'KONFLIKT';
    if (syncStatus?.isSynced) return 'SYNC';
    return 'NICHT SYNC';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 8px',
      backgroundColor: 'rgba(0,0,0,0.05)',
      borderRadius: '6px',
      fontSize: '12px'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor()
      }} />
      <span style={{ fontWeight: 'bold' }}>{getStatusText()}</span>
      
      {showDetails && (
        <>
          <span>|</span>
          <span>{activeDevices.size} Geräte</span>
          {isMaster && <span>| MASTER</span>}
          <span>| {deviceRole.toUpperCase()}</span>
        </>
      )}
    </div>
  );
};

export default MultiDeviceSyncProvider;