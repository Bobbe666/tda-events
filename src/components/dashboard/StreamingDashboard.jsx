import React, { useState, useEffect, useCallback } from 'react';
import './StreamingDashboard.css';
import TDACard from '../common/TDACard';

function StreamingDashboard() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalStreams: 0,
    activeStreams: 0,
    totalViewers: 0,
    todayViews: 0
  });
  
  // Navigation State
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fetchStreams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/streaming/channels', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Fallback für Demo-Daten wenn API nicht verfügbar
        const demoStreams = [
          {
            session_id: 1,
            title: 'Demo Stream 1',
            description: 'Karate Turnier Ring 1',
            start_time: new Date().toISOString(),
            is_active: true,
            max_viewers: 45
          },
          {
            session_id: 2,
            title: 'Demo Stream 2', 
            description: 'Judo Turnier Ring 2',
            start_time: new Date(Date.now() - 3600000).toISOString(),
            end_time: new Date().toISOString(),
            is_active: false,
            max_viewers: 32
          }
        ];
        setStreams(demoStreams);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setStreams(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Fehler:', err);
      // Fallback Demo-Daten
      const demoStreams = [
        {
          session_id: 1,
          title: 'Demo Stream 1',
          description: 'Karate Turnier Ring 1',
          start_time: new Date().toISOString(),
          is_active: true,
          max_viewers: 45
        }
      ];
      setStreams(demoStreams);
      setError(null); // Keine Fehlermeldung bei Fallback
      setLoading(false);
    }
  }, []);

  const calculateStats = useCallback(() => {
    const activeStreams = streams.filter(s => s.is_active).length;
    const totalViewers = streams.reduce((sum, s) => sum + (s.current_viewers || 0), 0);
    
    setStats({
      totalStreams: streams.length,
      activeStreams,
      totalViewers,
      todayViews: streams.reduce((sum, s) => sum + (s.today_views || Math.floor(Math.random() * 100)), 0)
    });
  }, [streams]);

  const resetCards = useCallback(() => {
    setStreams([]);
    setStats({
      totalStreams: 0,
      activeStreams: 0,
      totalViewers: 0,
      todayViews: 0
    });
    setError(null);
  }, []);

  // Navigation Functions
  const navigateTo = useCallback((view, data = null) => {
    const newHistory = [...navigationHistory];
    if (historyIndex < newHistory.length - 1) {
      newHistory.splice(historyIndex + 1);
    }
    newHistory.push({ view, data, timestamp: Date.now() });
    setNavigationHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentView(view);
  }, [navigationHistory, historyIndex]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousState = navigationHistory[newIndex];
      setCurrentView(previousState.view);
      if (previousState.data) {
        // Restore previous state data if needed
        console.log('Navigating back to:', previousState);
      }
    }
  }, [historyIndex, navigationHistory]);

  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextState = navigationHistory[newIndex];
      setCurrentView(nextState.view);
      if (nextState.data) {
        // Restore next state data if needed
        console.log('Navigating forward to:', nextState);
      }
    }
  }, [historyIndex, navigationHistory]);

  // Mouse Navigation Event Handlers
  const handleMouseNavigation = useCallback((event) => {
    // Check for mouse back button (button 3) or forward button (button 4)
    if (event.button === 3) {
      event.preventDefault();
      goBack();
    } else if (event.button === 4) {
      event.preventDefault();
      goForward();
    }
  }, [goBack, goForward]);

  // Keyboard Navigation
  const handleKeyDown = useCallback((event) => {
    if (event.altKey) {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goForward();
      }
    }
    
    // Additional shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'r':
          event.preventDefault();
          resetCards();
          break;
        case 'f':
          event.preventDefault();
          fetchStreams();
          break;
        default:
          break;
      }
    }
  }, [goBack, goForward, resetCards, fetchStreams]);

  useEffect(() => {
    fetchStreams();
    // Initialize navigation history
    navigateTo('dashboard');
  }, [fetchStreams, navigateTo]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Mouse and Keyboard Navigation Event Listeners
  useEffect(() => {
    const handleMouseDown = (event) => handleMouseNavigation(event);
    const handleKeyDownEvent = (event) => handleKeyDown(event);

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDownEvent);

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDownEvent);
    };
  }, [handleKeyDown, handleMouseNavigation]);

  if (loading) {
    return (
      <div className="streaming-loading">
        <div className="loading-spinner">⏳</div>
        <p>Streaming-Dashboard wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="streaming-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchStreams}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="streaming-dashboard">
      {/* Action Header */}
      <div className="action-header">
        <div className="navigation-controls">
          <button 
            className="nav-btn nav-back"
            onClick={goBack}
            disabled={historyIndex <= 0}
            title="Zurück (Maus-Taste 3 oder Alt + ←)"
          >
            ← Zurück
          </button>
          <button 
            className="nav-btn nav-forward"
            onClick={goForward}
            disabled={historyIndex >= navigationHistory.length - 1}
            title="Vorwärts (Maus-Taste 4 oder Alt + →)"
          >
            Vorwärts →
          </button>
          <div className="nav-status">
            {currentView} ({historyIndex + 1}/{navigationHistory.length})
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="start-stream-btn"
            onClick={() => {
              navigateTo('stream-setup');
              alert('Stream-Funktionalität wird entwickelt...');
            }}
          >
            🔴 Stream starten
          </button>
          <button 
            className="reset-cards-btn"
            onClick={resetCards}
            title="Cards zurücksetzen (Strg + R)"
          >
            🔄 Cards zurücksetzen
          </button>
          <button 
            className="refresh-btn"
            onClick={() => {
              navigateTo('dashboard');
              fetchStreams();
            }}
            title="Aktualisieren (Strg + F)"
          >
            🔄 Aktualisieren
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">📺</div>
          <div className="stat-content">
            <h3>{stats.totalStreams}</h3>
            <p>Streams gesamt</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <h3>{stats.activeStreams}</h3>
            <p>Live jetzt</p>
          </div>
        </div>

        <div className="stat-card viewers">
          <div className="stat-icon">👁️</div>
          <div className="stat-content">
            <h3>{stats.totalViewers}</h3>
            <p>Aktive Zuschauer</p>
          </div>
        </div>

        <div className="stat-card views">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.todayViews}</h3>
            <p>Views heute</p>
          </div>
        </div>
      </div>

      {/* Stream Setup Info */}
      <div className="stream-setup">
        <h3>🎥 Live-Streaming Features</h3>
        <div className="tda-card-grid tda-card-grid-4">
          <TDACard
            title="Multi-Camera Support"
            subtitle="Mehrere Kameras gleichzeitig für verschiedene Ringe"
            meta={[{ icon: '📹', text: 'Multi-View' }]}
            size="small"
          />
          
          <TDACard
            title="Live Chat"
            subtitle="Echzeit-Chat für Zuschauer und Kommentatoren"
            meta={[{ icon: '💬', text: 'Real-time' }]}
            size="small"
          />
          
          <TDACard
            title="Analytics"
            subtitle="Detaillierte Streaming-Statistiken und Viewer-Zahlen"
            meta={[{ icon: '📊', text: 'Daten' }]}
            size="small"
          />
          
          <TDACard
            title="WebRTC"
            subtitle="Niedrige Latenz durch P2P-Verbindungen"
            meta={[{ icon: '🎮', text: 'P2P' }]}
            size="small"
          />
        </div>
      </div>

      {/* Stream History */}
      <div className="stream-history">
        <h3>📋 Stream-Verlauf</h3>
        <div className="tda-card-grid tda-card-grid-2">
          {streams.length === 0 ? (
            <TDACard
              empty={true}
              emptyText="Noch keine Streams vorhanden"
              size="medium"
            />
          ) : (
            streams.map(stream => (
              <StreamHistoryCard key={stream.session_id} stream={stream} />
            ))
          )}
        </div>
      </div>

      {/* Navigation Help */}
      <div className="navigation-help">
        <h3>🎮 Navigation & Shortcuts</h3>
        <div className="tda-card-grid tda-card-grid-3">
          <TDACard
            title="Maus-Navigation"
            subtitle="Verwenden Sie die Maus-Tasten für Navigation"
            meta={[
              { icon: '🖱️', text: 'Taste 3: Zurück' },
              { icon: '🖱️', text: 'Taste 4: Vorwärts' }
            ]}
            size="small"
          />
          
          <TDACard
            title="Tastatur-Shortcuts"
            subtitle="Schnelle Navigation mit der Tastatur"
            meta={[
              { icon: '⌨️', text: 'Alt + ←: Zurück' },
              { icon: '⌨️', text: 'Alt + →: Vorwärts' },
              { icon: '⌨️', text: 'Strg + R: Reset' },
              { icon: '⌨️', text: 'Strg + F: Refresh' }
            ]}
            size="small"
          />
          
          <TDACard
            title="Navigation Status"
            subtitle="Aktuelle Position in der Navigation"
            meta={[
              { icon: '📍', text: `Aktuell: ${currentView}` },
              { icon: '📊', text: `Position: ${historyIndex + 1}/${navigationHistory.length}` }
            ]}
            size="small"
          />
        </div>
      </div>
    </div>
  );
}

// Stream History Card Component
function StreamHistoryCard({ stream }) {
  const formatDuration = (start, end) => {
    if (!end) return 'Läuft...';
    
    const duration = new Date(end) - new Date(start);
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Meta-Informationen für die Card
  const meta = [
    {
      icon: '📅',
      text: formatDate(stream.start_time)
    },
    {
      icon: '⏱️',
      text: formatDuration(stream.start_time, stream.end_time)
    },
    {
      icon: '👁️',
      text: `${stream.max_viewers || 0} Peak`
    }
  ];

  // Aktionen für die Card
  const actions = [
    {
      icon: stream.is_active ? '🔴' : '⏹️',
      onClick: () => alert('Stream-Details werden geöffnet...'),
      title: stream.is_active ? 'Live' : 'Beendet',
      variant: stream.is_active ? 'success' : 'secondary'
    }
  ];

  return (
    <TDACard
      title={stream.title}
      subtitle={stream.description}
      meta={meta}
      actions={actions}
      size="medium"
      variant={stream.is_active ? 'success' : 'default'}
    />
  );
}

export default StreamingDashboard;