// frontend/src/components/scoring/ScorekeeperDashboard.jsx
// SCOREKEEPER-DASHBOARD FÜR KAMPFRICHTER

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ScorekeeperDashboard = ({ kampfId, kampfData, onClose }) => {
  // Zustandsverwaltung
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [kaempfer1Points, setKaempfer1Points] = useState(0);
  const [kaempfer2Points, setKaempfer2Points] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 Minuten Standard
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [fightStatus, setFightStatus] = useState('ready'); // ready, running, paused, finished
  const [eventLog, setEventLog] = useState([]);

  // Konstanten für Punktevergabe
  const POINT_VALUES = {
    SINGLE: 1,
    DOUBLE: 2,
    TECHNIQUE: 3
  };

  // WebSocket-Verbindung aufbauen
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    // Authentifizierung
    newSocket.emit('authenticate', {
      token,
      userType: 'scorekeeper',
      kampfId
    });

    // Event-Handler
    newSocket.on('connect', () => {
      console.log('🟢 Scorekeeper-Dashboard verbunden');
      setIsConnected(true);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Authentifiziert als:', data.userType);
      // Kampf-Room beitreten
      newSocket.emit('join-fight', { kampfId });
    });

    newSocket.on('joined-fight', (data) => {
      console.log('🥊 Kampf-Room beigetreten:', data.kampfId);
    });

    newSocket.on('fight-state', (state) => {
      console.log('📊 Kampf-Status erhalten:', state);
      setKaempfer1Points(state.kaempfer1Points || 0);
      setKaempfer2Points(state.kaempfer2Points || 0);
      if (state.timer) {
        setTimeRemaining(state.timer.remainingTime || 120);
        setCurrentRound(state.timer.round || 1);
        setIsTimerRunning(state.timer.isRunning || false);
      }
    });

    newSocket.on('score-update', (data) => {
      setKaempfer1Points(data.kaempfer1Points || 0);
      setKaempfer2Points(data.kaempfer2Points || 0);
      addEventToLog(`Score Update: ${data.kaempfer1Points}:${data.kaempfer2Points}`);
    });

    newSocket.on('fight-event', (event) => {
      setFightStatus(event.eventData?.status || fightStatus);
      addEventToLog(`Kampf-Event: ${event.eventType}`, event.eventData);
    });

    newSocket.on('timer-update', (timer) => {
      setTimeRemaining(timer.remainingTime);
      setCurrentRound(timer.round);
      setIsTimerRunning(timer.isRunning);
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Verbindung getrennt');
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('❌ WebSocket Fehler:', error);
      addEventToLog(`Fehler: ${error.message}`, null, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [kampfId]);

  // Event-Log hinzufügen
  const addEventToLog = (message, data = null, type = 'info') => {
    const newEvent = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      data,
      type
    };
    setEventLog(prev => [newEvent, ...prev.slice(0, 19)]); // Nur letzte 20 Events behalten
  };

  // Punkte vergeben
  const addPoints = (kaempfer, points) => {
    if (!socket || !isConnected) {
      alert('Nicht mit Server verbunden!');
      return;
    }

    const newKaempfer1Points = kaempfer === 1 ? kaempfer1Points + points : kaempfer1Points;
    const newKaempfer2Points = kaempfer === 2 ? kaempfer2Points + points : kaempfer2Points;

    socket.emit('score-update', {
      kampfId,
      kaempfer1Points: newKaempfer1Points,
      kaempfer2Points: newKaempfer2Points,
      eventType: `${points}_point_${kaempfer === 1 ? 'fighter1' : 'fighter2'}`,
      timestamp: new Date().toISOString()
    });

    addEventToLog(`+${points} Punkt${points > 1 ? 'e' : ''} für Kämpfer ${kaempfer}`);
  };

  // Punkte abziehen
  const subtractPoints = (kaempfer, points = 1) => {
    if (!socket || !isConnected) return;

    const currentPoints = kaempfer === 1 ? kaempfer1Points : kaempfer2Points;
    if (currentPoints <= 0) return;

    const newKaempfer1Points = kaempfer === 1 ? Math.max(0, kaempfer1Points - points) : kaempfer1Points;
    const newKaempfer2Points = kaempfer === 2 ? Math.max(0, kaempfer2Points - points) : kaempfer2Points;

    socket.emit('score-update', {
      kampfId,
      kaempfer1Points: newKaempfer1Points,
      kaempfer2Points: newKaempfer2Points,
      eventType: `subtract_point_${kaempfer === 1 ? 'fighter1' : 'fighter2'}`,
      timestamp: new Date().toISOString()
    });

    addEventToLog(`-${points} Punkt${points > 1 ? 'e' : ''} von Kämpfer ${kaempfer}`);
  };

  // Kampf-Events senden
  const sendFightEvent = (eventType, eventData = {}) => {
    if (!socket || !isConnected) return;

    socket.emit('fight-event', {
      kampfId,
      eventType,
      eventData,
      timestamp: new Date().toISOString()
    });

    addEventToLog(`Kampf-Event: ${eventType}`, eventData);
  };

  // Timer-Events
  const startTimer = () => {
    setIsTimerRunning(true);
    socket.emit('timer-update', {
      kampfId,
      remainingTime: timeRemaining,
      isRunning: true,
      round: currentRound
    });
    sendFightEvent('start', { status: 'running' });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    socket.emit('timer-update', {
      kampfId,
      remainingTime: timeRemaining,
      isRunning: false,
      round: currentRound
    });
    sendFightEvent('pause', { status: 'paused' });
  };

  const resetTimer = () => {
    setTimeRemaining(120);
    setIsTimerRunning(false);
    socket.emit('timer-update', {
      kampfId,
      remainingTime: 120,
      isRunning: false,
      round: currentRound
    });
    addEventToLog('Timer zurückgesetzt');
  };

  // Format Zeit anzeigen
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer-Countdown
  useEffect(() => {
    let interval;
    if (isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsTimerRunning(false);
            sendFightEvent('time_up', { round: currentRound });
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeRemaining, currentRound]);

  return (
    <div style={dashboardStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h2>Scorekeeper Dashboard</h2>
        <div style={connectionStatusStyle}>
          <span style={{ color: isConnected ? '#28a745' : '#dc3545' }}>
            ● {isConnected ? 'Verbunden' : 'Getrennt'}
          </span>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>
      </div>

      {/* Kampf-Info */}
      <div style={fightInfoStyle}>
        <h3>Kampf #{kampfId}</h3>
        <p>{kampfData?.kaempfer1?.name} vs {kampfData?.kaempfer2?.name}</p>
        <p>Runde {currentRound} • Status: {fightStatus}</p>
      </div>

      {/* Timer */}
      <div style={timerSectionStyle}>
        <div style={timerDisplayStyle}>
          {formatTime(timeRemaining)}
        </div>
        <div style={timerControlsStyle}>
          <button 
            onClick={startTimer} 
            disabled={isTimerRunning}
            style={controlButtonStyle}
          >
            Start
          </button>
          <button 
            onClick={pauseTimer} 
            disabled={!isTimerRunning}
            style={controlButtonStyle}
          >
            Pause
          </button>
          <button 
            onClick={resetTimer}
            style={controlButtonStyle}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scoring-Bereich */}
      <div style={scoringAreaStyle}>
        {/* Kämpfer 1 */}
        <div style={fighterSectionStyle}>
          <h4>{kampfData?.kaempfer1?.name || 'Kämpfer 1'}</h4>
          <div style={scoreDisplayStyle}>{kaempfer1Points}</div>
          <div style={pointButtonsStyle}>
            <button 
              onClick={() => addPoints(1, POINT_VALUES.SINGLE)}
              style={pointButtonStyle}
            >
              +1
            </button>
            <button 
              onClick={() => addPoints(1, POINT_VALUES.DOUBLE)}
              style={pointButtonStyle}
            >
              +2
            </button>
            <button 
              onClick={() => addPoints(1, POINT_VALUES.TECHNIQUE)}
              style={pointButtonStyle}
            >
              +3
            </button>
            <button 
              onClick={() => subtractPoints(1)}
              style={subtractButtonStyle}
            >
              -1
            </button>
          </div>
        </div>

        <div style={vsStyle}>VS</div>

        {/* Kämpfer 2 */}
        <div style={fighterSectionStyle}>
          <h4>{kampfData?.kaempfer2?.name || 'Kämpfer 2'}</h4>
          <div style={scoreDisplayStyle}>{kaempfer2Points}</div>
          <div style={pointButtonsStyle}>
            <button 
              onClick={() => addPoints(2, POINT_VALUES.SINGLE)}
              style={pointButtonStyle}
            >
              +1
            </button>
            <button 
              onClick={() => addPoints(2, POINT_VALUES.DOUBLE)}
              style={pointButtonStyle}
            >
              +2
            </button>
            <button 
              onClick={() => addPoints(2, POINT_VALUES.TECHNIQUE)}
              style={pointButtonStyle}
            >
              +3
            </button>
            <button 
              onClick={() => subtractPoints(2)}
              style={subtractButtonStyle}
            >
              -1
            </button>
          </div>
        </div>
      </div>

      {/* Kampf-Steuerung */}
      <div style={fightControlsStyle}>
        <button 
          onClick={() => sendFightEvent('start', { status: 'running' })}
          style={eventButtonStyle}
        >
          Kampf starten
        </button>
        <button 
          onClick={() => sendFightEvent('pause', { status: 'paused' })}
          style={eventButtonStyle}
        >
          Kampf pausieren
        </button>
        <button 
          onClick={() => sendFightEvent('end', { status: 'finished' })}
          style={endButtonStyle}
        >
          Kampf beenden
        </button>
      </div>

      {/* Event-Log */}
      <div style={eventLogStyle}>
        <h4>Event-Log</h4>
        <div style={logContainerStyle}>
          {eventLog.map(event => (
            <div 
              key={event.id} 
              style={{
                ...logEntryStyle,
                color: event.type === 'error' ? '#dc3545' : '#333'
              }}
            >
              <span style={timestampStyle}>{event.timestamp}</span>
              {event.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Styles
const dashboardStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: '#f8f9fa',
  zIndex: 1000,
  overflow: 'auto',
  padding: '20px'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
  paddingBottom: '10px',
  borderBottom: '2px solid #8B0000'
};

const connectionStatusStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const closeButtonStyle = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  fontSize: '18px',
  cursor: 'pointer'
};

const fightInfoStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const timerSectionStyle = {
  textAlign: 'center',
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const timerDisplayStyle = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#8B0000',
  marginBottom: '15px'
};

const timerControlsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px'
};

const controlButtonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '5px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer'
};

const scoringAreaStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const fighterSectionStyle = {
  textAlign: 'center',
  flex: 1
};

const scoreDisplayStyle = {
  fontSize: '64px',
  fontWeight: 'bold',
  color: '#8B0000',
  margin: '10px 0'
};

const pointButtonsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '10px',
  flexWrap: 'wrap'
};

const pointButtonStyle = {
  padding: '15px 20px',
  fontSize: '18px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#28a745',
  color: 'white',
  cursor: 'pointer',
  minWidth: '60px'
};

const subtractButtonStyle = {
  ...pointButtonStyle,
  backgroundColor: '#dc3545'
};

const vsStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#666',
  margin: '0 20px'
};

const fightControlsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  marginBottom: '30px'
};

const eventButtonStyle = {
  padding: '12px 24px',
  fontSize: '16px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#007bff',
  color: 'white',
  cursor: 'pointer'
};

const endButtonStyle = {
  ...eventButtonStyle,
  backgroundColor: '#dc3545'
};

const eventLogStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '15px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const logContainerStyle = {
  maxHeight: '200px',
  overflowY: 'auto',
  fontSize: '14px'
};

const logEntryStyle = {
  padding: '5px 0',
  borderBottom: '1px solid #eee'
};

const timestampStyle = {
  fontWeight: 'bold',
  marginRight: '10px',
  color: '#666'
};

export default ScorekeeperDashboard;