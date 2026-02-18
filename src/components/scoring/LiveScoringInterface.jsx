// frontend/src/components/scoring/LiveScoringInterface.jsx
// LIVE-SCORING INTERFACE FÜR KOMPAKTE PUNKTEVERGABE

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const LiveScoringInterface = ({ kampfId, fightData, userType = 'scorekeeper', onMinimize }) => {
  // State-Management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [score, setScore] = useState({
    fighter1: 0,
    fighter2: 0
  });
  const [fightStatus, setFightStatus] = useState('ready');
  const [isMinimized, setIsMinimized] = useState(false);
  const [quickActions, setQuickActions] = useState([]);

  // Schnelle Punktevergabe-Optionen
  const QUICK_POINTS = [
    { value: 1, label: '+1', color: '#28a745', description: 'Einzeltechnik' },
    { value: 2, label: '+2', color: '#17a2b8', description: 'Kombination' },
    { value: 3, label: '+3', color: '#ffc107', description: 'Besondere Technik' },
    { value: -1, label: '-1', color: '#dc3545', description: 'Punkt abziehen' }
  ];

  // WebSocket-Verbindung
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    newSocket.emit('authenticate', {
      token,
      userType,
      kampfId
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🔗 Live-Scoring Interface verbunden');
    });

    newSocket.on('authenticated', () => {
      newSocket.emit('join-fight', { kampfId });
    });

    newSocket.on('score-update', (data) => {
      setScore({
        fighter1: data.kaempfer1Points || 0,
        fighter2: data.kaempfer2Points || 0
      });
    });

    newSocket.on('fight-event', (event) => {
      setFightStatus(event.eventData?.status || fightStatus);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('💔 Live-Scoring Interface getrennt');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [kampfId, userType]);

  // Punkte vergeben
  const scorePoint = (fighter, points) => {
    if (!socket || !isConnected) return;

    const newScore = {
      fighter1: fighter === 1 ? Math.max(0, score.fighter1 + points) : score.fighter1,
      fighter2: fighter === 2 ? Math.max(0, score.fighter2 + points) : score.fighter2
    };

    socket.emit('score-update', {
      kampfId,
      kaempfer1Points: newScore.fighter1,
      kaempfer2Points: newScore.fighter2,
      eventType: `${points > 0 ? 'add' : 'subtract'}_point_fighter${fighter}`,
      timestamp: new Date().toISOString()
    });

    // Vibrationseffekt für Mobile
    if (navigator.vibrate && points > 0) {
      navigator.vibrate(50);
    }

    // Quick Action zur Historie hinzufügen
    addQuickAction(fighter, points);
  };

  // Quick Action zur Historie hinzufügen
  const addQuickAction = (fighter, points) => {
    const action = {
      id: Date.now(),
      fighter,
      points,
      timestamp: new Date().toLocaleTimeString(),
      fighterName: fighter === 1 
        ? (fightData?.kaempfer1?.name || 'Kämpfer 1')
        : (fightData?.kaempfer2?.name || 'Kämpfer 2')
    };
    
    setQuickActions(prev => [action, ...prev.slice(0, 4)]); // Nur letzte 5 behalten
  };

  // Minimized View
  if (isMinimized) {
    return (
      <div style={minimizedStyle}>
        <div style={minimizedScoreStyle}>
          <span>{score.fighter1}</span>
          <span style={minimizedVsStyle}>:</span>
          <span>{score.fighter2}</span>
        </div>
        <div style={minimizedControlsStyle}>
          <button 
            onClick={() => setIsMinimized(false)}
            style={expandButtonStyle}
          >
            ▲
          </button>
          <div style={connectionDotStyle(isConnected)} />
        </div>
      </div>
    );
  }

  // Full Interface
  return (
    <div style={interfaceStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={titleStyle}>
          <h3>Live Scoring</h3>
          <div style={connectionStatusStyle}>
            <div style={connectionDotStyle(isConnected)} />
            <span style={statusTextStyle}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div style={headerControlsStyle}>
          <button 
            onClick={() => setIsMinimized(true)}
            style={minimizeButtonStyle}
          >
            ▼
          </button>
          {onMinimize && (
            <button 
              onClick={onMinimize}
              style={closeButtonStyle}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Kampf-Info kompakt */}
      <div style={compactFightInfoStyle}>
        <span>Kampf #{kampfId}</span>
        <span style={statusBadgeStyle(fightStatus)}>{fightStatus}</span>
      </div>

      {/* Score Display */}
      <div style={scoreDisplayStyle}>
        <div style={scoreSectionStyle}>
          <div style={fighterNameStyle}>
            {fightData?.kaempfer1?.name || 'Kämpfer 1'}
          </div>
          <div style={scoreNumberStyle}>{score.fighter1}</div>
        </div>
        
        <div style={vsDisplayStyle}>VS</div>
        
        <div style={scoreSectionStyle}>
          <div style={fighterNameStyle}>
            {fightData?.kaempfer2?.name || 'Kämpfer 2'}
          </div>
          <div style={scoreNumberStyle}>{score.fighter2}</div>
        </div>
      </div>

      {/* Quick Scoring Buttons */}
      <div style={quickScoringStyle}>
        <div style={fighterColumnStyle}>
          <div style={fighterLabelStyle}>Kämpfer 1</div>
          <div style={buttonGridStyle}>
            {QUICK_POINTS.map(point => (
              <button
                key={`f1-${point.value}`}
                onClick={() => scorePoint(1, point.value)}
                style={quickButtonStyle(point.color)}
                disabled={!isConnected}
                title={point.description}
              >
                {point.label}
              </button>
            ))}
          </div>
        </div>

        <div style={fighterColumnStyle}>
          <div style={fighterLabelStyle}>Kämpfer 2</div>
          <div style={buttonGridStyle}>
            {QUICK_POINTS.map(point => (
              <button
                key={`f2-${point.value}`}
                onClick={() => scorePoint(2, point.value)}
                style={quickButtonStyle(point.color)}
                disabled={!isConnected}
                title={point.description}
              >
                {point.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions History */}
      {quickActions.length > 0 && (
        <div style={quickHistoryStyle}>
          <div style={historyTitleStyle}>Letzte Aktionen:</div>
          {quickActions.map(action => (
            <div key={action.id} style={historyItemStyle}>
              <span style={historyTimeStyle}>{action.timestamp}</span>
              <span style={historyActionStyle}>
                {action.fighterName}: {action.points > 0 ? '+' : ''}{action.points}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const interfaceStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  width: '350px',
  backgroundColor: 'white',
  border: '2px solid #8B0000',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  zIndex: 999,
  fontFamily: 'Arial, sans-serif'
};

const minimizedStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 15px',
  backgroundColor: '#8B0000',
  color: 'white',
  borderRadius: '25px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
  zIndex: 999,
  fontSize: '18px',
  fontWeight: 'bold'
};

const minimizedScoreStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const minimizedVsStyle = {
  margin: '0 5px',
  opacity: 0.7
};

const minimizedControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const expandButtonStyle = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 15px',
  borderBottom: '1px solid #eee',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px 10px 0 0'
};

const titleStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const connectionStatusStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const connectionDotStyle = (isConnected) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: isConnected ? '#28a745' : '#dc3545'
});

const statusTextStyle = {
  fontSize: '12px',
  color: '#666'
};

const headerControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const minimizeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '12px',
  color: '#666',
  cursor: 'pointer',
  padding: '4px'
};

const closeButtonStyle = {
  background: '#dc3545',
  border: 'none',
  color: 'white',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  fontSize: '14px',
  cursor: 'pointer'
};

const compactFightInfoStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 15px',
  fontSize: '12px',
  color: '#666',
  borderBottom: '1px solid #eee'
};

const statusBadgeStyle = (status) => ({
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '10px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  backgroundColor: 
    status === 'running' ? '#28a745' :
    status === 'paused' ? '#ffc107' :
    status === 'finished' ? '#dc3545' : '#6c757d',
  color: 'white'
});

const scoreDisplayStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '15px',
  backgroundColor: '#f8f9fa'
};

const scoreSectionStyle = {
  textAlign: 'center',
  flex: 1
};

const fighterNameStyle = {
  fontSize: '12px',
  color: '#666',
  marginBottom: '5px',
  fontWeight: 'bold'
};

const scoreNumberStyle = {
  fontSize: '36px',
  fontWeight: 'bold',
  color: '#8B0000'
};

const vsDisplayStyle = {
  fontSize: '14px',
  color: '#999',
  fontWeight: 'bold',
  margin: '0 10px'
};

const quickScoringStyle = {
  display: 'flex',
  padding: '15px',
  gap: '15px'
};

const fighterColumnStyle = {
  flex: 1
};

const fighterLabelStyle = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#666',
  marginBottom: '8px',
  textAlign: 'center'
};

const buttonGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '6px'
};

const quickButtonStyle = (color) => ({
  padding: '12px 8px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: color,
  color: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s',
  minHeight: '40px'
});

const quickHistoryStyle = {
  padding: '10px 15px',
  borderTop: '1px solid #eee',
  backgroundColor: '#f8f9fa',
  borderRadius: '0 0 10px 10px',
  fontSize: '11px'
};

const historyTitleStyle = {
  fontWeight: 'bold',
  color: '#666',
  marginBottom: '5px'
};

const historyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '2px 0',
  color: '#666'
};

const historyTimeStyle = {
  color: '#999',
  fontSize: '10px'
};

const historyActionStyle = {
  fontWeight: 'bold'
};

export default LiveScoringInterface;