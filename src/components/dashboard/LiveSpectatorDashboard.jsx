// frontend/src/components/dashboard/LiveSpectatorDashboard.jsx
// LIVE-DASHBOARD FÜR ZUSCHAUER UND ÖFFENTLICHE ANZEIGE

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import TDACard from '../common/TDACard';

const LiveSpectatorDashboard = ({ turnierId, fullscreen = false, autoRotate = false }) => {
  // State Management
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeFights, setActiveFights] = useState([]);
  const [upcomingFights, setUpcomingFights] = useState([]);
  const [completedFights, setCompletedFights] = useState([]);
  const [currentFight, setCurrentFight] = useState(null);
  const [tournamentInfo, setTournamentInfo] = useState({});
  const [viewMode, setViewMode] = useState('overview'); // overview, single-fight, results
  const [autoRotateIndex, setAutoRotateIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // WebSocket-Verbindung für Zuschauer
  useEffect(() => {
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    // Authentifizierung als Zuschauer
    newSocket.emit('authenticate', {
      userType: 'spectator',
      turnierId
    });

    // Connection Events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🎭 Zuschauer-Dashboard verbunden');
    });

    newSocket.on('authenticated', () => {
      // Tournament-Updates abonnieren
      newSocket.emit('subscribe-tournament', { turnierId });
    });

    // Live-Updates empfangen
    newSocket.on('live-update', (update) => {
      handleLiveUpdate(update);
    });

    newSocket.on('fight-update', (fightData) => {
      updateFightInList(fightData);
    });

    newSocket.on('score-update', (scoreData) => {
      updateFightScore(scoreData);
      showNotification(`Kampf ${scoreData.kampfId}: ${scoreData.kaempfer1Points}:${scoreData.kaempfer2Points}`, 'score');
    });

    newSocket.on('fight-event', (event) => {
      handleFightEvent(event);
      showNotification(`Kampf ${event.kampfId}: ${formatEventType(event.eventType)}`, 'event');
    });

    newSocket.on('tournament-update', (tournamentData) => {
      setTournamentInfo(tournamentData);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('💔 Zuschauer-Dashboard getrennt');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [turnierId]);

  // Auto-Rotate für verschiedene Ansichten
  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      setAutoRotateIndex(prev => {
        const totalViews = activeFights.length + 1; // +1 für Overview
        return (prev + 1) % totalViews;
      });
    }, 10000); // 10 Sekunden pro Ansicht

    return () => clearInterval(interval);
  }, [autoRotate, activeFights.length]);

  // Auto-Rotate View-Logik
  useEffect(() => {
    if (autoRotate) {
      if (autoRotateIndex === 0) {
        setViewMode('overview');
        setCurrentFight(null);
      } else {
        const fightIndex = autoRotateIndex - 1;
        if (activeFights[fightIndex]) {
          setViewMode('single-fight');
          setCurrentFight(activeFights[fightIndex]);
        }
      }
    }
  }, [autoRotateIndex, activeFights, autoRotate]);

  // Live-Update verarbeiten
  const handleLiveUpdate = (update) => {
    const { type, kampfId, data } = update;
    
    switch (type) {
      case 'fight_started':
        moveFightToActive(kampfId, data);
        break;
      case 'fight_finished':
        moveFightToCompleted(kampfId, data);
        break;
      case 'fight_scheduled':
        addUpcomingFight(data);
        break;
      default:
        console.log('Unbekanntes Live-Update:', type);
    }
  };

  // Kampf-Event verarbeiten
  const handleFightEvent = (event) => {
    const { kampfId, eventType, eventData } = event;
    
    updateFightInList({
      kampfId,
      status: eventData?.status || 'unknown',
      lastEvent: event
    });
  };

  // Kämpfe in Listen aktualisieren
  const updateFightInList = (fightData) => {
    const updateInList = (fights) => 
      fights.map(fight => 
        fight.kampfId === fightData.kampfId 
          ? { ...fight, ...fightData }
          : fight
      );

    setActiveFights(prev => updateInList(prev));
    setUpcomingFights(prev => updateInList(prev));
    setCompletedFights(prev => updateInList(prev));
  };

  // Score in Kampf aktualisieren
  const updateFightScore = (scoreData) => {
    const { kampfId, kaempfer1Points, kaempfer2Points } = scoreData;
    
    const updateFight = (fight) => ({
      ...fight,
      kaempfer1Points,
      kaempfer2Points,
      lastUpdate: new Date().toISOString()
    });

    setActiveFights(prev => 
      prev.map(fight => 
        fight.kampfId === kampfId ? updateFight(fight) : fight
      )
    );

    // Aktuellen Kampf aktualisieren
    if (currentFight?.kampfId === kampfId) {
      setCurrentFight(prev => updateFight(prev));
    }
  };

  // Kampf zu aktiven Kämpfen verschieben
  const moveFightToActive = (kampfId, fightData) => {
    setUpcomingFights(prev => prev.filter(f => f.kampfId !== kampfId));
    setActiveFights(prev => {
      const exists = prev.find(f => f.kampfId === kampfId);
      if (exists) return prev;
      return [...prev, { kampfId, ...fightData, status: 'running' }];
    });
  };

  // Kampf zu abgeschlossenen verschieben
  const moveFightToCompleted = (kampfId, fightData) => {
    setActiveFights(prev => prev.filter(f => f.kampfId !== kampfId));
    setCompletedFights(prev => {
      const exists = prev.find(f => f.kampfId !== kampfId);
      if (exists) return prev;
      return [{ kampfId, ...fightData, status: 'finished' }, ...prev];
    });
  };

  // Bevorstehenden Kampf hinzufügen
  const addUpcomingFight = (fightData) => {
    setUpcomingFights(prev => {
      const exists = prev.find(f => f.kampfId === fightData.kampfId);
      if (exists) return prev;
      return [...prev, fightData].sort((a, b) => 
        new Date(a.geplante_zeit || 0) - new Date(b.geplante_zeit || 0)
      );
    });
  };

  // Notification anzeigen
  const showNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Event-Type formatieren
  const formatEventType = (eventType) => {
    const eventMap = {
      'start': 'Kampf gestartet',
      'pause': 'Pausiert',
      'resume': 'Fortgesetzt',
      'end': 'Kampf beendet',
      'warning': 'Verwarnung',
      'disqualification': 'Disqualifikation'
    };
    return eventMap[eventType] || eventType;
  };

  // Zeit formatieren
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Overview-Ansicht
  const OverviewView = () => (
    <div style={overviewContainerStyle}>
      {/* Tournament Header */}
      <div style={tournamentHeaderStyle}>
        <h1 style={tournamentTitleStyle}>
          {tournamentInfo.name || 'Live-Turnier'}
        </h1>
        <div style={tournamentInfoStyle}>
          <span>{tournamentInfo.datum}</span>
          <span>•</span>
          <span>{tournamentInfo.ort}</span>
          <span>•</span>
          <span style={connectionStatusStyle(isConnected)}>
            {isConnected ? '🔴 LIVE' : '⚫ OFFLINE'}
          </span>
        </div>
      </div>

      {/* Active Fights */}
      {activeFights.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>🥊 Laufende Kämpfe</h2>
          <div className="tda-card-grid tda-card-grid-3">
            {activeFights.map(fight => (
              <FightCard 
                key={fight.kampfId} 
                fight={fight} 
                type="active"
                onClick={() => {
                  setCurrentFight(fight);
                  setViewMode('single-fight');
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Fights */}
      {upcomingFights.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>⏰ Nächste Kämpfe</h2>
          <div className="tda-card-grid tda-card-grid-3">
            {upcomingFights.slice(0, 6).map(fight => (
              <FightCard 
                key={fight.kampfId} 
                fight={fight} 
                type="upcoming"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Results */}
      {completedFights.length > 0 && (
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>✅ Letzte Ergebnisse</h2>
          <div className="tda-card-grid tda-card-grid-3">
            {completedFights.slice(0, 6).map(fight => (
              <FightCard 
                key={fight.kampfId} 
                fight={fight} 
                type="completed"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Single-Fight Ansicht
  const SingleFightView = () => {
    if (!currentFight) return <OverviewView />;

    return (
      <div style={singleFightContainerStyle}>
        <div style={singleFightHeaderStyle}>
          <button 
            style={backButtonStyle}
            onClick={() => setViewMode('overview')}
          >
            ← Zurück zur Übersicht
          </button>
          <h2>Kampf #{currentFight.kampfId}</h2>
        </div>

        <div style={singleFightContentStyle}>
          {/* Fighter Information */}
          <div style={fighterComparisonStyle}>
            <div style={fighterSectionStyle}>
              <div style={fighterNameStyle}>
                {currentFight.kaempfer1_vorname} {currentFight.kaempfer1_nachname}
              </div>
              <div style={fighterDetailsStyle}>
                <div>{currentFight.kaempfer1_verein}</div>
                <div>{currentFight.kaempfer1_gewicht}kg</div>
                <div>{currentFight.kaempfer1_gurtfarbe}</div>
              </div>
            </div>

            <div style={scoreVsStyle}>
              <div style={liveScoreStyle}>
                <span style={scoreNumberStyle}>
                  {currentFight.kaempfer1Points || 0}
                </span>
                <span style={vsTextStyle}>:</span>
                <span style={scoreNumberStyle}>
                  {currentFight.kaempfer2Points || 0}
                </span>
              </div>
              <div style={fightStatusStyle}>
                {currentFight.status?.toUpperCase() || 'BEREIT'}
              </div>
            </div>

            <div style={fighterSectionStyle}>
              <div style={fighterNameStyle}>
                {currentFight.kaempfer2_vorname} {currentFight.kaempfer2_nachname}
              </div>
              <div style={fighterDetailsStyle}>
                <div>{currentFight.kaempfer2_verein}</div>
                <div>{currentFight.kaempfer2_gewicht}kg</div>
                <div>{currentFight.kaempfer2_gurtfarbe}</div>
              </div>
            </div>
          </div>

          {/* Fight Info */}
          <div style={fightInfoPanelStyle}>
            <div style={fightInfoItemStyle}>
              <strong>Kategorie:</strong> {currentFight.kategorie_name}
            </div>
            <div style={fightInfoItemStyle}>
              <strong>Runde:</strong> {currentFight.runde} / {currentFight.max_runden}
            </div>
            <div style={fightInfoItemStyle}>
              <strong>Geplante Zeit:</strong> {formatTime(currentFight.geplante_zeit)}
            </div>
            {currentFight.lastUpdate && (
              <div style={fightInfoItemStyle}>
                <strong>Letztes Update:</strong> {formatTime(currentFight.lastUpdate)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Fight-Card Komponente
  const FightCard = ({ fight, type, onClick }) => {
    // Meta-Informationen für die Card
    const meta = [
      {
        icon: '🏆',
        text: fight.kategorie_name
      },
      {
        icon: '⏰',
        text: formatTime(fight.geplante_zeit)
      },
      {
        icon: '🥋',
        text: `Runde ${fight.runde || 1}`
      }
    ];

    // Aktionen für die Card
    const actions = type === 'active' ? [
      {
        icon: '👁️',
        onClick: onClick,
        title: 'Kampf anzeigen',
        variant: 'primary'
      }
    ] : [];

    // Zusätzliche Informationen als Children
    const fightContent = (
      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <strong>{fight.kaempfer1_vorname} {fight.kaempfer1_nachname}</strong>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {fight.kaempfer1_verein}
            </div>
          </div>
          <div style={{ textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {type === 'active' && (
              <div>{fight.kaempfer1Points || 0} : {fight.kaempfer2Points || 0}</div>
            )}
            {type === 'upcoming' && (
              <div>VS</div>
            )}
            {type === 'completed' && fight.gewinner_vorname && (
              <div>🏆</div>
            )}
          </div>
          <div>
            <strong>{fight.kaempfer2_vorname} {fight.kaempfer2_nachname}</strong>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {fight.kaempfer2_verein}
            </div>
          </div>
        </div>
        {type === 'completed' && fight.gewinner_vorname && (
          <div style={{ textAlign: 'center', color: '#ffd700', fontWeight: 'bold' }}>
            🏆 Sieger: {fight.gewinner_vorname} {fight.gewinner_nachname}
          </div>
        )}
      </div>
    );

    return (
      <TDACard
        title={`Kampf #${fight.kampfId}`}
        subtitle={fight.status?.toUpperCase() || 'GEPLANT'}
        meta={meta}
        actions={actions}
        size="medium"
        variant={type === 'active' ? 'success' : type === 'completed' ? 'default' : 'warning'}
        onClick={onClick}
      >
        {fightContent}
      </TDACard>
    );
  };

  const containerStyle = {
    width: '100%',
    height: fullscreen ? '100vh' : 'auto',
    backgroundColor: '#0a0a0a',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    overflow: 'hidden',
    position: 'relative'
  };

  // Render Main Component
  return (
    <div style={containerStyle}>
      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={notificationsContainerStyle}>
          {notifications.map(notification => (
            <div 
              key={notification.id}
              style={notificationStyle(notification.type)}
            >
              {notification.message}
            </div>
          ))}
        </div>
      )}

      {/* Controls (nur wenn nicht Fullscreen) */}
      {!fullscreen && (
        <div style={controlsStyle}>
          <button 
            style={controlButtonStyle}
            onClick={() => setViewMode('overview')}
          >
            Übersicht
          </button>
          <button 
            style={controlButtonStyle}
            onClick={() => setAutoRotate(!autoRotate)}
          >
            Auto-Rotate: {autoRotate ? 'AN' : 'AUS'}
          </button>
        </div>
      )}

      {/* Main Content */}
      {viewMode === 'overview' && <OverviewView />}
      {viewMode === 'single-fight' && <SingleFightView />}
    </div>
  );
};

// Styles (Compact version - many styles defined inline above)
const overviewContainerStyle = {
  padding: '20px',
  height: '100%',
  overflowY: 'auto'
};

const tournamentHeaderStyle = {
  textAlign: 'center',
  marginBottom: '40px',
  padding: '20px',
  backgroundColor: 'rgba(139,0,0,0.1)',
  borderRadius: '12px'
};

const tournamentTitleStyle = {
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 0 10px 0',
  color: '#fff'
};

const tournamentInfoStyle = {
  fontSize: '18px',
  color: '#ccc',
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  alignItems: 'center'
};

const connectionStatusStyle = (connected) => ({
  color: connected ? '#28a745' : '#dc3545',
  fontWeight: 'bold'
});

const sectionStyle = {
  marginBottom: '40px'
};

const sectionTitleStyle = {
  fontSize: '24px',
  marginBottom: '20px',
  color: '#fff'
};

const fightsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '20px'
};

const fightCardStyle = (type) => ({
  backgroundColor: 
    type === 'active' ? 'rgba(40, 167, 69, 0.1)' :
    type === 'upcoming' ? 'rgba(0, 123, 255, 0.1)' :
    'rgba(108, 117, 125, 0.1)',
  border: '1px solid ' + (
    type === 'active' ? '#28a745' :
    type === 'upcoming' ? '#007bff' :
    '#6c757d'
  ),
  borderRadius: '12px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
});

const notificationsContainerStyle = {
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const notificationStyle = (type) => ({
  padding: '12px 20px',
  borderRadius: '8px',
  backgroundColor: type === 'score' ? '#28a745' : '#007bff',
  color: 'white',
  fontSize: '14px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  animation: 'slideIn 0.3s ease-out'
});

const controlsStyle = {
  position: 'absolute',
  top: '20px',
  left: '20px',
  zIndex: 1000,
  display: 'flex',
  gap: '10px'
};

const controlButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#8B0000',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

// Additional styles would continue here...
const fightCardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px'
};

const fightNumberStyle = {
  fontSize: '18px',
  fontWeight: 'bold'
};

const fightStatusBadgeStyle = (status) => ({
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  backgroundColor: 
    status === 'running' ? '#28a745' :
    status === 'finished' ? '#6c757d' :
    '#007bff'
});

const fightCardContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  marginBottom: '15px'
};

const cardFighterStyle = {
  flex: 1,
  textAlign: 'center'
};

const cardFighterNameStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '5px'
};

const cardFighterInfoStyle = {
  fontSize: '14px',
  color: '#ccc'
};

const cardScoreStyle = {
  textAlign: 'center',
  minWidth: '80px'
};

const liveScoreDisplayStyle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#28a745'
};

const scheduledTimeStyle = {
  fontSize: '16px',
  color: '#007bff'
};

const winnerStyle = {
  fontSize: '14px',
  color: '#ffd700'
};

const fightCardFooterStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '12px',
  color: '#999'
};

const categoryStyle = {
  fontWeight: 'bold'
};

const roundStyle = {
  color: '#ccc'
};

const singleFightContainerStyle = {
  padding: '20px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
};

const singleFightHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  marginBottom: '30px'
};

const backButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#8B0000',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const singleFightContentStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const fighterComparisonStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '40px',
  padding: '40px',
  backgroundColor: 'rgba(255,255,255,0.05)',
  borderRadius: '20px'
};

const fighterSectionStyle = {
  flex: 1,
  textAlign: 'center'
};

const fighterNameStyle = {
  fontSize: '32px',
  fontWeight: 'bold',
  marginBottom: '15px'
};

const fighterDetailsStyle = {
  fontSize: '18px',
  color: '#ccc',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const scoreVsStyle = {
  textAlign: 'center',
  minWidth: '200px'
};

const liveScoreStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  marginBottom: '15px'
};

const scoreNumberStyle = {
  fontSize: '80px',
  fontWeight: 'bold',
  color: '#28a745'
};

const vsTextStyle = {
  fontSize: '40px',
  color: '#666'
};

const fightStatusStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#007bff'
};

const fightInfoPanelStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  padding: '20px',
  backgroundColor: 'rgba(255,255,255,0.03)',
  borderRadius: '12px'
};

const fightInfoItemStyle = {
  fontSize: '16px',
  color: '#ccc'
};

export default LiveSpectatorDashboard;