// frontend/src/components/mobile/MobileRefereeApp.jsx
// MOBILE-OPTIMIERTE KAMPFRICHTER-APP

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const MobileRefereeApp = ({ kampfId, onClose }) => {
  // State Management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [fightData, setFightData] = useState({});
  const [score, setScore] = useState({ fighter1: 0, fighter2: 0 });
  const [timer, setTimer] = useState({ time: 120, isRunning: false, round: 1 });
  const [selectedFighter, setSelectedFighter] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [currentView, setCurrentView] = useState('scoring'); // scoring, timer, history

  // WebSocket-Verbindung
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    // Authentifizierung als Kampfrichter
    newSocket.emit('authenticate', {
      token,
      userType: 'referee',
      kampfId
    });

    // Connection Events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('📱 Mobile Referee App verbunden');
    });

    newSocket.on('authenticated', () => {
      newSocket.emit('join-fight', { kampfId });
    });

    newSocket.on('joined-fight', (data) => {
      console.log(`🏟️ Kampf-Room ${data.kampfId} beigetreten`);
    });

    newSocket.on('fight-state', (state) => {
      setScore({
        fighter1: state.kaempfer1Points || 0,
        fighter2: state.kaempfer2Points || 0
      });
      if (state.timer) {
        setTimer({
          time: state.timer.remainingTime || 120,
          isRunning: state.timer.isRunning || false,
          round: state.timer.round || 1
        });
      }
    });

    newSocket.on('score-update', (data) => {
      setScore({
        fighter1: data.kaempfer1Points || 0,
        fighter2: data.kaempfer2Points || 0
      });
      vibrate(100);
    });

    newSocket.on('timer-update', (timerData) => {
      setTimer({
        time: timerData.remainingTime,
        isRunning: timerData.isRunning,
        round: timerData.round
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [kampfId]);

  // Timer-Countdown
  useEffect(() => {
    let interval;
    if (timer.isRunning && timer.time > 0) {
      interval = setInterval(() => {
        setTimer(prev => ({
          ...prev,
          time: Math.max(0, prev.time - 1)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.time]);

  // Vibration-Funktion
  const vibrate = (duration) => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  };

  // Punkte vergeben
  const awardPoints = (fighter, points) => {
    if (!socket || !isConnected) return;

    const newScore = {
      fighter1: fighter === 1 ? score.fighter1 + points : score.fighter1,
      fighter2: fighter === 2 ? score.fighter2 + points : score.fighter2
    };

    socket.emit('score-update', {
      kampfId,
      kaempfer1Points: newScore.fighter1,
      kaempfer2Points: newScore.fighter2,
      eventType: `referee_award_${points}_points`,
      timestamp: new Date().toISOString()
    });

    // Action zur Historie hinzufügen
    addAction(`+${points} Punkt${points > 1 ? 'e' : ''} Kämpfer ${fighter}`, 'point');
    vibrate([50, 100, 50]);
  };

  // Timer-Steuerung
  const toggleTimer = () => {
    const newRunning = !timer.isRunning;
    setTimer(prev => ({ ...prev, isRunning: newRunning }));

    socket.emit('timer-update', {
      kampfId,
      remainingTime: timer.time,
      isRunning: newRunning,
      round: timer.round
    });

    socket.emit('fight-event', {
      kampfId,
      eventType: newRunning ? 'start' : 'pause',
      eventData: { status: newRunning ? 'running' : 'paused' },
      timestamp: new Date().toISOString()
    });

    addAction(newRunning ? 'Timer gestartet' : 'Timer pausiert', 'timer');
    vibrate(newRunning ? 200 : 100);
  };

  // Timer zurücksetzen
  const resetTimer = () => {
    setTimer(prev => ({ ...prev, time: 120, isRunning: false }));
    
    socket.emit('timer-update', {
      kampfId,
      remainingTime: 120,
      isRunning: false,
      round: timer.round
    });

    addAction('Timer zurückgesetzt', 'timer');
    vibrate([100, 50, 100]);
  };

  // Kampfrichter-Aktionen
  const refereeAction = (action, target, reason = '') => {
    if (!socket || !isConnected) return;

    socket.emit('referee-action', {
      kampfId,
      action, // 'warning', 'point-deduction', 'disqualification'
      target, // 'fighter1', 'fighter2'
      reason
    });

    const actionMap = {
      'warning': 'Verwarnung',
      'point-deduction': 'Punktabzug',
      'disqualification': 'Disqualifikation'
    };

    addAction(`${actionMap[action]} - Kämpfer ${target === 'fighter1' ? '1' : '2'}`, 'referee');
    vibrate([200, 100, 200]);
  };

  // Aktion zur Historie hinzufügen
  const addAction = (description, type) => {
    const newAction = {
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      description,
      type
    };
    setActionHistory(prev => [newAction, ...prev.slice(0, 19)]);
  };

  // Zeit formatieren
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // View-Navigation
  const ViewTabs = () => (
    <div style={tabsStyle}>
      <button 
        style={tabButtonStyle(currentView === 'scoring')}
        onClick={() => setCurrentView('scoring')}
      >
        🎯 Punkte
      </button>
      <button 
        style={tabButtonStyle(currentView === 'timer')}
        onClick={() => setCurrentView('timer')}
      >
        ⏱️ Timer
      </button>
      <button 
        style={tabButtonStyle(currentView === 'history')}
        onClick={() => setCurrentView('history')}
      >
        📋 Historie
      </button>
    </div>
  );

  // Scoring View
  const ScoringView = () => (
    <div style={viewContainerStyle}>
      {/* Live Score Display */}
      <div style={scoreboardStyle}>
        <div style={scoreSectionStyle}>
          <div style={fighterLabelStyle}>Kämpfer 1</div>
          <div style={scoreDisplayStyle}>{score.fighter1}</div>
        </div>
        <div style={vsStyle}>VS</div>
        <div style={scoreSectionStyle}>
          <div style={fighterLabelStyle}>Kämpfer 2</div>
          <div style={scoreDisplayStyle}>{score.fighter2}</div>
        </div>
      </div>

      {/* Quick Scoring Buttons */}
      <div style={scoringButtonsStyle}>
        <div style={fighterButtonsStyle}>
          <div style={fighterHeaderStyle}>Kämpfer 1</div>
          <div style={pointButtonsGridStyle}>
            <button 
              style={pointButtonStyle('#28a745')}
              onClick={() => awardPoints(1, 1)}
              disabled={!isConnected}
            >
              +1
            </button>
            <button 
              style={pointButtonStyle('#17a2b8')}
              onClick={() => awardPoints(1, 2)}
              disabled={!isConnected}
            >
              +2
            </button>
            <button 
              style={pointButtonStyle('#ffc107')}
              onClick={() => awardPoints(1, 3)}
              disabled={!isConnected}
            >
              +3
            </button>
          </div>
        </div>

        <div style={fighterButtonsStyle}>
          <div style={fighterHeaderStyle}>Kämpfer 2</div>
          <div style={pointButtonsGridStyle}>
            <button 
              style={pointButtonStyle('#28a745')}
              onClick={() => awardPoints(2, 1)}
              disabled={!isConnected}
            >
              +1
            </button>
            <button 
              style={pointButtonStyle('#17a2b8')}
              onClick={() => awardPoints(2, 2)}
              disabled={!isConnected}
            >
              +2
            </button>
            <button 
              style={pointButtonStyle('#ffc107')}
              onClick={() => awardPoints(2, 3)}
              disabled={!isConnected}
            >
              +3
            </button>
          </div>
        </div>
      </div>

      {/* Referee Actions */}
      <div style={refereeActionsStyle}>
        <div style={actionGroupStyle}>
          <button 
            style={warningButtonStyle}
            onClick={() => refereeAction('warning', selectedFighter || 'fighter1')}
            disabled={!isConnected}
          >
            ⚠️ Verwarnung
          </button>
          <button 
            style={penaltyButtonStyle}
            onClick={() => refereeAction('point-deduction', selectedFighter || 'fighter1')}
            disabled={!isConnected}
          >
            📉 Punktabzug
          </button>
        </div>
        <button 
          style={disqualifyButtonStyle}
          onClick={() => refereeAction('disqualification', selectedFighter || 'fighter1')}
          disabled={!isConnected}
        >
          🚫 Disqualifikation
        </button>
      </div>
    </div>
  );

  // Timer View
  const TimerView = () => (
    <div style={viewContainerStyle}>
      <div style={timerDisplayStyle}>
        <div style={roundDisplayStyle}>Runde {timer.round}</div>
        <div style={timeDisplayStyle}>{formatTime(timer.time)}</div>
        <div style={timerStatusStyle}>
          {timer.isRunning ? '⏯️ LÄUFT' : '⏸️ PAUSIERT'}
        </div>
      </div>
      
      <div style={timerControlsStyle}>
        <button 
          style={timerButtonStyle('#007bff')}
          onClick={toggleTimer}
          disabled={!isConnected}
        >
          {timer.isRunning ? '⏸️ Pause' : '▶️ Start'}
        </button>
        <button 
          style={timerButtonStyle('#6c757d')}
          onClick={resetTimer}
          disabled={!isConnected}
        >
          🔄 Reset
        </button>
      </div>
    </div>
  );

  // History View
  const HistoryView = () => (
    <div style={viewContainerStyle}>
      <div style={historyContainerStyle}>
        {actionHistory.length === 0 ? (
          <div style={emptyHistoryStyle}>
            <p>Keine Aktionen bisher</p>
          </div>
        ) : (
          actionHistory.map(action => (
            <div key={action.id} style={historyItemStyle(action.type)}>
              <span style={historyTimeStyle}>{action.time}</span>
              <span style={historyDescStyle}>{action.description}</span>
            </div>
          ))
        )}
      </div>
      
      <button 
        style={clearHistoryButtonStyle}
        onClick={() => setActionHistory([])}
      >
        🗑️ Historie leeren
      </button>
    </div>
  );

  return (
    <div style={appContainerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={headerTitleStyle}>
          <h3>Kampfrichter #{kampfId}</h3>
          <div style={connectionStatusStyle}>
            <div style={connectionDotStyle(isConnected)} />
            <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>
        <div style={headerControlsStyle}>
          <button 
            style={vibrationToggleStyle(vibrationEnabled)}
            onClick={() => setVibrationEnabled(!vibrationEnabled)}
          >
            {vibrationEnabled ? '📳' : '🔇'}
          </button>
          <button 
            style={closeButtonStyle}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <ViewTabs />

      {/* Current View */}
      <div style={contentStyle}>
        {currentView === 'scoring' && <ScoringView />}
        {currentView === 'timer' && <TimerView />}
        {currentView === 'history' && <HistoryView />}
      </div>
    </div>
  );
};

// Mobile-First Styles
const appContainerStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: '#fff',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '15px 20px',
  backgroundColor: '#8B0000',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

const headerTitleStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const headerControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const connectionStatusStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '12px'
};

const connectionDotStyle = (connected) => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  backgroundColor: connected ? '#28a745' : '#dc3545'
});

const vibrationToggleStyle = (enabled) => ({
  background: enabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
  border: 'none',
  color: 'white',
  fontSize: '18px',
  padding: '8px',
  borderRadius: '6px',
  cursor: 'pointer'
});

const closeButtonStyle = {
  background: 'rgba(255,255,255,0.2)',
  border: 'none',
  color: 'white',
  fontSize: '20px',
  width: '32px',
  height: '32px',
  borderRadius: '6px',
  cursor: 'pointer'
};

const tabsStyle = {
  display: 'flex',
  backgroundColor: '#f8f9fa',
  borderBottom: '1px solid #dee2e6'
};

const tabButtonStyle = (active) => ({
  flex: 1,
  padding: '15px 10px',
  border: 'none',
  backgroundColor: active ? 'white' : 'transparent',
  color: active ? '#8B0000' : '#6c757d',
  fontWeight: active ? 'bold' : 'normal',
  fontSize: '14px',
  cursor: 'pointer',
  borderBottom: active ? '3px solid #8B0000' : 'none'
});

const contentStyle = {
  flex: 1,
  overflow: 'auto',
  padding: '20px'
};

const viewContainerStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const scoreboardStyle = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const scoreSectionStyle = {
  textAlign: 'center'
};

const fighterLabelStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  marginBottom: '8px'
};

const scoreDisplayStyle = {
  fontSize: '48px',
  fontWeight: 'bold',
  color: '#8B0000'
};

const vsStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#999'
};

const scoringButtonsStyle = {
  display: 'flex',
  gap: '15px'
};

const fighterButtonsStyle = {
  flex: 1
};

const fighterHeaderStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333',
  marginBottom: '10px',
  textAlign: 'center'
};

const pointButtonsGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '8px'
};

const pointButtonStyle = (color) => ({
  padding: '16px',
  fontSize: '18px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: color,
  color: 'white',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

const refereeActionsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '20px'
};

const actionGroupStyle = {
  display: 'flex',
  gap: '10px'
};

const warningButtonStyle = {
  flex: 1,
  padding: '14px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#ffc107',
  color: '#212529',
  cursor: 'pointer'
};

const penaltyButtonStyle = {
  flex: 1,
  padding: '14px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#fd7e14',
  color: 'white',
  cursor: 'pointer'
};

const disqualifyButtonStyle = {
  padding: '14px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: '#dc3545',
  color: 'white',
  cursor: 'pointer'
};

const timerDisplayStyle = {
  textAlign: 'center',
  padding: '30px',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px'
};

const roundDisplayStyle = {
  fontSize: '16px',
  color: '#666',
  marginBottom: '10px'
};

const timeDisplayStyle = {
  fontSize: '64px',
  fontWeight: 'bold',
  color: '#8B0000',
  marginBottom: '10px'
};

const timerStatusStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#333'
};

const timerControlsStyle = {
  display: 'flex',
  gap: '15px'
};

const timerButtonStyle = (color) => ({
  flex: 1,
  padding: '16px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: 'none',
  borderRadius: '8px',
  backgroundColor: color,
  color: 'white',
  cursor: 'pointer'
});

const historyContainerStyle = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '15px'
};

const historyItemStyle = (type) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px',
  marginBottom: '8px',
  backgroundColor: 'white',
  borderRadius: '6px',
  borderLeft: `4px solid ${
    type === 'point' ? '#28a745' :
    type === 'timer' ? '#007bff' :
    type === 'referee' ? '#dc3545' : '#6c757d'
  }`
});

const historyTimeStyle = {
  fontSize: '12px',
  color: '#666',
  fontWeight: 'bold'
};

const historyDescStyle = {
  fontSize: '14px',
  color: '#333'
};

const emptyHistoryStyle = {
  textAlign: 'center',
  color: '#666',
  padding: '40px 20px'
};

const clearHistoryButtonStyle = {
  padding: '12px',
  fontSize: '14px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#6c757d',
  color: 'white',
  cursor: 'pointer'
};

export default MobileRefereeApp;