// frontend/src/components/realtime/withLiveUpdates.jsx
// HOC FÜR REAL-TIME UPDATES IN BESTEHENDEN KOMPONENTEN

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const withLiveUpdates = (WrappedComponent) => {
  return function LiveUpdatesWrapper(props) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [liveData, setLiveData] = useState({});
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
      const token = localStorage.getItem('token');
      const newSocket = io(window.location.origin, {
        transports: ['websocket', 'polling']
      });

      // Authentifizierung
      newSocket.emit('authenticate', {
        token,
        userType: 'spectator' // Default für Zuschauer
      });

      // Connection Events
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('🔗 Live-Updates verbunden');
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('💔 Live-Updates getrennt');
      });

      // Global Updates empfangen
      newSocket.on('live-update', (update) => {
        console.log('📡 Live-Update empfangen:', update);
        
        const { type, kampfId, data } = update;
        
        // Live-Daten aktualisieren
        setLiveData(prev => ({
          ...prev,
          [kampfId]: {
            ...prev[kampfId],
            ...data,
            lastUpdate: new Date().toISOString()
          }
        }));

        // Notification hinzufügen
        addNotification({
          type,
          kampfId,
          message: formatUpdateMessage(type, data),
          timestamp: new Date().toISOString()
        });
      });

      // Spezifische Fight-Updates
      newSocket.on('fight-update', (update) => {
        console.log('🥊 Kampf-Update:', update);
        setLiveData(prev => ({
          ...prev,
          [update.kampfId]: {
            ...prev[update.kampfId],
            ...update,
            lastUpdate: new Date().toISOString()
          }
        }));
      });

      // Score-Updates
      newSocket.on('score-update', (scoreData) => {
        console.log('🎯 Score-Update:', scoreData);
        setLiveData(prev => ({
          ...prev,
          [scoreData.kampfId]: {
            ...prev[scoreData.kampfId],
            kaempfer1Points: scoreData.kaempfer1Points,
            kaempfer2Points: scoreData.kaempfer2Points,
            lastScoreUpdate: scoreData.lastUpdate,
            lastUpdate: new Date().toISOString()
          }
        }));
      });

      // Fight-Events
      newSocket.on('fight-event', (event) => {
        console.log('📢 Kampf-Event:', event);
        setLiveData(prev => ({
          ...prev,
          [event.kampfId]: {
            ...prev[event.kampfId],
            lastEvent: event,
            status: event.eventData?.status,
            lastUpdate: new Date().toISOString()
          }
        }));

        addNotification({
          type: 'fight-event',
          kampfId: event.kampfId,
          message: `Kampf ${event.kampfId}: ${formatEventType(event.eventType)}`,
          timestamp: event.timestamp
        });
      });

      // Timer-Updates
      newSocket.on('timer-update', (timer) => {
        setLiveData(prev => ({
          ...prev,
          [timer.kampfId]: {
            ...prev[timer.kampfId],
            timer: timer,
            lastUpdate: new Date().toISOString()
          }
        }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }, []);

    // Notification hinzufügen
    const addNotification = (notification) => {
      const newNotification = {
        ...notification,
        id: Date.now()
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Nur 10 behalten
      
      // Auto-remove nach 5 Sekunden
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    };

    // Update-Message formatieren
    const formatUpdateMessage = (type, data) => {
      switch (type) {
        case 'score':
          return `Score: ${data.kaempfer1Points || 0}:${data.kaempfer2Points || 0}`;
        case 'event':
          return `Event: ${formatEventType(data.eventType)}`;
        case 'kampf_finished':
          return `Kampf beendet: ${data.kaempfer1Points || 0}:${data.kaempfer2Points || 0}`;
        default:
          return `Update: ${type}`;
      }
    };

    // Event-Type formatieren
    const formatEventType = (eventType) => {
      const eventMap = {
        'start': 'Kampf gestartet',
        'pause': 'Kampf pausiert',
        'resume': 'Kampf fortgesetzt',
        'end': 'Kampf beendet',
        'warning': 'Verwarnung',
        'disqualification': 'Disqualifikation',
        'time_up': 'Zeit abgelaufen'
      };
      return eventMap[eventType] || eventType;
    };

    // Spezifischen Kampf-Room beitreten
    const joinFightRoom = (kampfId) => {
      if (socket && isConnected) {
        socket.emit('join-fight', { kampfId });
        console.log(`🏟️ Kampf-Room ${kampfId} beigetreten`);
      }
    };

    // Kampf-Room verlassen
    const leaveFightRoom = (kampfId) => {
      if (socket && isConnected) {
        socket.leave(`fight_${kampfId}`);
        console.log(`🚪 Kampf-Room ${kampfId} verlassen`);
      }
    };

    // Live-Daten für spezifischen Kampf abrufen
    const getLiveDataForFight = (kampfId) => {
      return liveData[kampfId] || {};
    };

    // Notification entfernen
    const removeNotification = (id) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Props an Wrapped Component weitergeben
    const enhancedProps = {
      ...props,
      // Live-Update Funktionalität
      isLiveConnected: isConnected,
      liveData,
      notifications,
      // Utility-Funktionen
      joinFightRoom,
      leaveFightRoom,
      getLiveDataForFight,
      removeNotification,
      // Socket-Referenz für erweiterte Funktionalität
      liveSocket: socket
    };

    return (
      <div style={{ position: 'relative' }}>
        {/* Notifications Overlay */}
        {notifications.length > 0 && (
          <div style={notificationsContainerStyle}>
            {notifications.slice(0, 3).map(notification => (
              <div 
                key={notification.id} 
                style={notificationStyle(notification.type)}
                onClick={() => removeNotification(notification.id)}
              >
                <div style={notificationContentStyle}>
                  <strong>Kampf {notification.kampfId}</strong>
                  <div>{notification.message}</div>
                  <div style={notificationTimeStyle}>
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live-Status Indicator */}
        <div style={liveIndicatorStyle}>
          <div style={liveIndicatorDotStyle(isConnected)} />
          <span style={liveIndicatorTextStyle}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Wrapped Component */}
        <WrappedComponent {...enhancedProps} />
      </div>
    );
  };
};

// Styles
const notificationsContainerStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  maxWidth: '300px'
};

const notificationStyle = (type) => ({
  padding: '12px',
  borderRadius: '8px',
  backgroundColor: 
    type === 'score' ? '#28a745' :
    type === 'fight-event' ? '#007bff' :
    type === 'error' ? '#dc3545' : '#17a2b8',
  color: 'white',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  fontSize: '14px',
  animation: 'slideIn 0.3s ease-out'
});

const notificationContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const notificationTimeStyle = {
  fontSize: '11px',
  opacity: 0.8
};

const liveIndicatorStyle = {
  position: 'fixed',
  top: '10px',
  left: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  backgroundColor: 'rgba(0,0,0,0.8)',
  color: 'white',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold',
  zIndex: 999
};

const liveIndicatorDotStyle = (isConnected) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: isConnected ? '#28a745' : '#dc3545',
  animation: isConnected ? 'pulse 2s infinite' : 'none'
});

const liveIndicatorTextStyle = {
  fontSize: '11px',
  letterSpacing: '1px'
};

// Global CSS für Animationen (sollte in index.css hinzugefügt werden)
const injectGlobalStyles = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Styles beim Import injizieren
injectGlobalStyles();

export default withLiveUpdates;