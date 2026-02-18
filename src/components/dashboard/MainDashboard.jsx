import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WettkaempferDashboard from './WettkaempferDashboard';
import BracketDashboard from './BracketDashboard';
import TurnierDashboard from './TurnierDashboard';
import StreamingDashboard from './StreamingDashboard';
import AnmeldeDashboard from './AnmeldeDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import DivisionDashboard from './DivisionDashboard';
import WettkaempferRegistrieren from './WettkaempferRegistrieren';
import VereineListePage from '../../pages/Club/VereineListePage';
import VereinDetailPage from '../../pages/Club/VereinDetailPage';
import VereinCreatePage from '../../pages/Club/VereinCreatePage';
import TurnierBearbeitenPage from '../../pages/Turniere/TurnierBearbeitenPage';
// import TurnierListe from '../turnier/TurnierListe';
// import LiveStreamingManager from '../streaming/LiveStreamingManager';
import SportsManager from '../sports/SportsManager';
import './MainDashboard.css';

function MainDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Bestimme activeView aus der URL
  const getViewFromPath = () => {
    const path = location.pathname.replace('/dashboard', '').replace('/', '');
    return path || 'overview';
  };

  const [activeView, setActiveView] = useState(getViewFromPath());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showInfoDropdown, setShowInfoDropdown] = useState(false);
  const [selectedTurnier, setSelectedTurnier] = useState(null);
  const [turniere, setTurniere] = useState([]);
  const [modulesExpanded, setModulesExpanded] = useState(true);
  const [berichteExpanded, setBerichteExpanded] = useState(true);

  // App Version
  const APP_VERSION = '2.1.0';

  // Funktion zum Wechseln der Ansicht mit URL-Update
  const changeView = useCallback((view) => {
    setActiveView(view);
    const path = view === 'overview' ? '/dashboard' : `/dashboard/${view}`;
    navigate(path);
  }, [navigate]);

  // Synchronisiere activeView mit URL-Änderungen (z.B. Zurück-Button)
  useEffect(() => {
    const path = location.pathname.replace('/dashboard', '').replace('/', '');
    const viewFromPath = path || 'overview';
    if (viewFromPath !== activeView) {
      setActiveView(viewFromPath);
    }
  }, [location.pathname, activeView]);

  const handleLogout = useCallback(() => {
      localStorage.clear();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const checkAuthStatus = useCallback(() => {
    try {
      const adminData = localStorage.getItem('adminData');
      const clubData = localStorage.getItem('clubData');
      const token = localStorage.getItem('token');

      // Check if token exists (accept both JWT and dummy tokens)
      if (!token || token.trim() === '') {
        console.log('🔑 Invalid or missing token - clearing localStorage');
        handleLogout();
        return;
      }

      // Accept both JWT format and dummy tokens (admin-auth-token, user-auth-token)
      const isJWT = token.split('.').length === 3;
      const isDummyToken = token.startsWith('admin-auth-token') || token.startsWith('user-auth-token');

      if (!isJWT && !isDummyToken) {
        console.log('🔑 Invalid token format - clearing localStorage');
        handleLogout();
        return;
      }

      if (adminData) {
        const admin = JSON.parse(adminData);
        setUser({ ...admin.user, isAdmin: true });
      } else if (clubData) {
        const club = JSON.parse(clubData);
        setUser({ ...club.user, isAdmin: false });
      } else {
        navigate('/login');
        return;
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Auth-Fehler:', error);
      handleLogout();
    }
  }, [navigate, handleLogout]);

  useEffect(() => {
    checkAuthStatus();
    fetchTurniere();
  }, [checkAuthStatus, navigate]);

  const fetchTurniere = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/turniere', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTurniere(result.data);
          // Erstes Turnier automatisch auswählen
          if (result.data.length > 0) {
            setSelectedTurnier(result.data[0]);
          }
        } else if (Array.isArray(result)) {
          setTurniere(result);
          if (result.length > 0) {
            setSelectedTurnier(result[0]);
          }
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Turniere:', error);
    }
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-dropdown')) {
        setShowUserDropdown(false);
      }
      if (!event.target.closest('.info-dropdown-container')) {
        setShowInfoDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">⏳</div>
        <p>Dashboard wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="main-dashboard">
      {/* COMPLETELY REMOVE ALL OLD HEADERS - ONLY ONE UNIFIED HEADER */}
      <div className="unified-dashboard-header">
        <div className="header-content">
          <div className="header-brand">
            <img src="/logo.png" alt="Tournament Software Logo" className="header-logo" />
          </div>
          
          <div className="header-center">
            <div className="welcome-message">
              <h2>Willkommen zurück, {user?.name}! 👋</h2>
              <p className="welcome-text">
                {user?.isAdmin
                  ? 'Sie haben Vollzugriff auf alle Systeme und Funktionen.'
                  : 'Verwalten Sie Ihre Turniere und Wettkämpfer.'
                }
              </p>
            </div>
          </div>

          <div className="header-actions">
            <button className="dashboard-btn" onClick={() => changeView('overview')}>
              🏠 Dashboard
            </button>
          </div>

          {/* Info/Hilfe Dropdown */}
          <div className="info-dropdown-container">
            <button
              className="info-btn"
              onClick={() => setShowInfoDropdown(!showInfoDropdown)}
              title="Info & Hilfe"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </button>
            {showInfoDropdown && (
              <div className="info-dropdown">
                <div className="info-dropdown-content">
                  <div className="info-dropdown-header">
                    <span className="info-title">Info & Hilfe</span>
                    <span className="info-version">v{APP_VERSION}</span>
                  </div>

                  <div className="info-section">
                    <div className="info-section-title">Letzte Updates</div>
                    <div className="info-changelog-item">
                      <span className="changelog-date">Feb 2026</span>
                      <span className="changelog-text">Neue Bracket-Funktionen</span>
                    </div>
                    <div className="info-changelog-item">
                      <span className="changelog-date">Jan 2026</span>
                      <span className="changelog-text">Live-Streaming verbessert</span>
                    </div>
                  </div>

                  <div className="info-section">
                    <div className="info-section-title">Hilfe</div>
                    <a href="https://tda-intl.org/faq" className="info-link" target="_blank" rel="noopener noreferrer">
                      FAQ / Häufige Fragen
                    </a>
                    <a href="https://tda-intl.org/kontakt" className="info-link" target="_blank" rel="noopener noreferrer">
                      Dokumentation & Hilfe
                    </a>
                  </div>

                  <div className="info-section info-support">
                    <div className="info-section-title">Support-Kontakt</div>
                    <a href="mailto:support@tda-intl.org" className="info-link">
                      support@tda-intl.org
                    </a>
                    <p className="info-support-text">
                      Bei technischen Problemen erreichen Sie uns auch unter +49 8741 967740
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="header-user">
            <div className="user-dropdown" onClick={() => setShowUserDropdown(!showUserDropdown)}>
              <div className="user-info">
                <span className="user-name">TDA Administrator</span>
                <span className="user-role">Verein</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              
              {showUserDropdown && (
                <div className="dropdown-menu">
                  {/* Navigation Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-title">Navigation</div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard'); setShowUserDropdown(false); }}>
                      <span>🏠 Übersicht</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/wettkaempfer'); setShowUserDropdown(false); }}>
                      <span>🥊 Wettkämpfer</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/turniere'); setShowUserDropdown(false); }}>
                      <span>🏆 Turniere</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/vereine'); setShowUserDropdown(false); }}>
                      <span>🏛️ Vereine</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/brackets'); setShowUserDropdown(false); }}>
                      <span>🏅 Brackets</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/anmeldungen'); setShowUserDropdown(false); }}>
                      <span>📝 Anmeldungen</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/streaming'); setShowUserDropdown(false); }}>
                      <span>🎥 Live-Streaming</span>
                    </div>
                    <div className="dropdown-item" onClick={() => { navigate('/dashboard/analytics'); setShowUserDropdown(false); }}>
                      <span>📈 Statistiken</span>
                    </div>
                    {user?.isAdmin && (
                      <React.Fragment key="admin-dropdown">
                        <div className="dropdown-item" onClick={() => { navigate('/dashboard/sports'); setShowUserDropdown(false); }}>
                          <span>🥋 Multi-Sport</span>
                        </div>
                        <div className="dropdown-item" onClick={() => { navigate('/dashboard/admin'); setShowUserDropdown(false); }}>
                          <span>⚙️ Administration</span>
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                  
                  <div className="dropdown-divider"></div>
                  
                  {/* User Section */}
                  <div className="dropdown-section">
                    <div className="dropdown-section-title">Benutzer</div>
                    <div className="dropdown-item">
                      <span>⚙️ Einstellungen</span>
                    </div>
                    <div className="dropdown-item">
                      <span>👤 Profil</span>
                    </div>
                    <div className="dropdown-item logout" onClick={handleLogout}>
                      <span>🚪 Abmelden</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {activeView === 'overview' && (
          <DashboardOverview user={user} setActiveView={changeView} onLogout={handleLogout} selectedTurnier={selectedTurnier} turniere={turniere} setSelectedTurnier={setSelectedTurnier} modulesExpanded={modulesExpanded} setModulesExpanded={setModulesExpanded} berichteExpanded={berichteExpanded} setBerichteExpanded={setBerichteExpanded} />
        )}
        
        {activeView === 'wettkaempfer-registrieren' && (
          <div className="dashboard-module">
            <WettkaempferRegistrieren />
          </div>
        )}
        
        {activeView === 'wettkaempfer' && (
          <div className="dashboard-module">
            <WettkaempferDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}
        
        {activeView === 'turniere' && (
          <div className="dashboard-module">
            <TurnierDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}

        {activeView.startsWith('turnier-bearbeiten') && (
          <div className="dashboard-module full-width">
            <TurnierBearbeitenPage />
          </div>
        )}
        
        {activeView === 'brackets' && (
          <div className="dashboard-module">
            <BracketDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}
        
        {activeView === 'anmeldungen' && (
          <div className="dashboard-module">
            <AnmeldeDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}
        
        {activeView === 'streaming' && (
          <div className="dashboard-module">
            <StreamingDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}
        
        {activeView === 'analytics' && (
          <div className="dashboard-module">
            <AnalyticsDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}
        
        {activeView === 'divisionen' && (
          <div className="dashboard-module">
            <DivisionDashboard selectedTurnier={selectedTurnier} />
          </div>
        )}

        {(activeView === 'vereine' || activeView.startsWith('vereine/')) && (
          <div className="dashboard-module">
            {(() => {
              const path = location.pathname;

              // Check for /dashboard/vereine/neu first (before numeric check)
              if (path === '/dashboard/vereine/neu' || activeView === 'vereine/neu') {
                return <VereinCreatePage />;
              }

              // Extract vereinId from activeView if it's a detail view
              if (activeView.startsWith('vereine/')) {
                const vereinId = activeView.split('/')[1];
                return <VereinDetailPage vereinId={vereinId} />;
              }

              return <VereineListePage />;
            })()}
          </div>
        )}

        {activeView === 'paarungen' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>⚔️ Paarungen erstellen</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Automatische Paarungsgenerierung</li>
                  <li>Manuelle Paarungsanpassung</li>
                  <li>Bracket-Systeme verwalten</li>
                  <li>Kampfreihenfolge festlegen</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'zeitplan' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>⏰ Zeitplan verwalten</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Turnier-Zeitplan erstellen</li>
                  <li>Kampfzeiten planen</li>
                  <li>Pausen und Pufferzeiten</li>
                  <li>Live-Zeitplan anzeigen</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'ergebnisse' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>📊 Ergebnisse eingeben</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Kampfergebnisse erfassen</li>
                  <li>Punkte und Bewertungen</li>
                  <li>Platzierungen berechnen</li>
                  <li>Ergebnis-Validierung</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'urkunden' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>🏅 Urkunden drucken</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Sieger-Urkunden generieren</li>
                  <li>Platzierungs-Urkunden</li>
                  <li>Teilnahme-Zertifikate</li>
                  <li>PDF-Export und Druck</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'live-ergebnisse' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>📺 Live-Ergebnisse</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Echtzeit-Ergebnisanzeige</li>
                  <li>Live-Scoreboard</li>
                  <li>Zuschauer-Interface</li>
                  <li>Mobile Optimierung</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'turnier-einstellungen' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>⚙️ Turnier Einstellungen</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Turnier-Konfiguration</li>
                  <li>Regeln und Kriterien</li>
                  <li>System-Einstellungen</li>
                  <li>Benutzer-Berechtigungen</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'staff-management' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>👥 Staff Management</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Personal und Helfer verwalten</li>
                  <li>Schichtpläne erstellen</li>
                  <li>Berechtigungen zuweisen</li>
                  <li>Kontaktinformationen verwalten</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'siegerehrung' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>🏆 Siegerehrung</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Preise und Medaillen verwalten</li>
                  <li>Siegerehrungs-Planung</li>
                  <li>Preisverleihung organisieren</li>
                  <li>Ehrungen dokumentieren</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'kampfflaechen' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>🥋 Kampfflächen</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Matten und Arenen verwalten</li>
                  <li>Kampfbereiche zuweisen</li>
                  <li>Ausstattung verwalten</li>
                  <li>Belegungspläne erstellen</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'platzierung' && (
          <div className="dashboard-module">
            <div className="coming-soon">
              <h2>🥇 Platzierung finden</h2>
              <p>Dieses Modul wird in Kürze verfügbar sein.</p>
              <div className="feature-preview">
                <h3>Geplante Funktionen:</h3>
                <ul>
                  <li>Ranglisten und Tabellen</li>
                  <li>Platzierungen berechnen</li>
                  <li>Ergebnis-Übersichten</li>
                  <li>Statistiken und Analysen</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'sports' && user?.isAdmin && (
          <div className="dashboard-module">
            <SportsManager />
          </div>
        )}
        
        {activeView === 'admin' && user?.isAdmin && (
          <div className="dashboard-module">
            <AdminPanel user={user} />
          </div>
        )}
      </div>
    </div>
  );
}

// Admin Panel Component
function AdminPanel({ user }) {
  return (
    <div className="admin-panel">
      <h2>⚙️ Administration</h2>
      
      <div className="admin-sections">
        <div className="admin-section">
          <h3>👥 Benutzerverwaltung</h3>
          <p>Vereine und Benutzer verwalten</p>
          <button className="admin-btn">Benutzer verwalten</button>
        </div>
        
        <div className="admin-section">
          <h3>🗄️ Systemkonfiguration</h3>
          <p>Globale Einstellungen und Parameter</p>
          <button className="admin-btn">Einstellungen</button>
        </div>
        
        <div className="admin-section">
          <h3>📊 System-Monitoring</h3>
          <p>Server-Status und Performance-Metriken</p>
          <button className="admin-btn">Monitoring</button>
        </div>
        
        <div className="admin-section">
          <h3>🔄 Datenbank-Tools</h3>
          <p>Backup, Export und Wartung</p>
          <button className="admin-btn">DB-Tools</button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Overview Component
function DashboardOverview({ user, setActiveView, onLogout, selectedTurnier, turniere, setSelectedTurnier, modulesExpanded, setModulesExpanded, berichteExpanded, setBerichteExpanded }) {
  const [modulesTab, setModulesTab] = useState('organisation');
  const [berichteTab, setBerichteTab] = useState('organisation');
  const [stats, setStats] = useState({
    turniere: 0,
    wettkaempfer: 0,
    anmeldungen: 0,
    activeStreams: 0
  });

  const fetchDashboardStats = useCallback(async () => {
    if (!selectedTurnier) {
      setStats({ turniere: 0, wettkaempfer: 0, anmeldungen: 0, activeStreams: 0 });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Turniere laden (nur das ausgewählte)
      setStats(prev => ({ ...prev, turniere: 1 }));

      // Wettkämpfer für das ausgewählte Turnier laden
      const wettkaempferResponse = await fetch(`/api/wettkaempfer?turnierId=${selectedTurnier.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (wettkaempferResponse.ok) {
        const wettkaempferResult = await wettkaempferResponse.json();
        console.log('📊 Wettkämpfer Stats Response:', wettkaempferResult);
        
        // Handle new API response format  
        if (wettkaempferResult.success && wettkaempferResult.data) {
          setStats(prev => ({ ...prev, wettkaempfer: wettkaempferResult.data.length }));
        } else if (Array.isArray(wettkaempferResult)) {
          // Fallback for old format
          setStats(prev => ({ ...prev, wettkaempfer: wettkaempferResult.length }));
        } else {
          setStats(prev => ({ ...prev, wettkaempfer: 0 }));
        }
      }

      // Anmeldungen-Statistiken für das ausgewählte Turnier laden
      const anmeldungenResponse = await fetch(`/api/anmeldungen/stats?turnierId=${selectedTurnier.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (anmeldungenResponse.ok) {
        const anmeldungStats = await anmeldungenResponse.json();
        setStats(prev => ({ ...prev, anmeldungen: anmeldungStats.total || 0 }));
      }

      // Live Streams für das ausgewählte Turnier laden
      const streamsResponse = await fetch(`/api/streaming/analytics?turnierId=${selectedTurnier.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (streamsResponse.ok) {
        const streamStats = await streamsResponse.json();
        setStats(prev => ({ ...prev, activeStreams: streamStats.activeStreams || 0 }));
      }
      
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Statistiken:', error);
    }
  }, [selectedTurnier]);

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedTurnier, fetchDashboardStats]);

  return (
    <div className="dashboard-overview">
      {/* Kombinierter Container: Turnier-Auswahl + Statistik-Karten */}
      {turniere.length > 0 && (
        <div className="turnier-stats-combined">
          {/* Turnier-Auswahl - 2 Zeilen */}
          <div className="turnier-selection-compact">
            <label htmlFor="turnier-select" className="turnier-label">
              🏆 Aktuelles Turnier:
            </label>
            <select
              id="turnier-select"
              value={selectedTurnier?.id || ''}
              onChange={(e) => {
                const turnier = turniere.find(t => t.id === parseInt(e.target.value));
                setSelectedTurnier(turnier);
              }}
              className="turnier-select"
            >
              {turniere.map(turnier => (
                <option key={turnier.id} value={turnier.id}>
                  {turnier.name} - {new Date(turnier.datum).toLocaleDateString('de-DE')}
                </option>
              ))}
            </select>
          </div>

          {/* Kompakte Statistik-Karten */}
          <div className="stats-grid-compact">
            <div className="stat-card-compact">
              <div className="stat-icon-compact">🏆</div>
              <div className="stat-content-compact">
                <h3>{stats.turniere}</h3>
                <p>Aktive Turniere</p>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-icon-compact">🥊</div>
              <div className="stat-content-compact">
                <h3>{stats.wettkaempfer}</h3>
                <p>Wettkämpfer</p>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-icon-compact">📝</div>
              <div className="stat-content-compact">
                <h3>{stats.anmeldungen}</h3>
                <p>Anmeldungen</p>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-icon-compact">🎥</div>
              <div className="stat-content-compact">
                <h3>{stats.activeStreams}</h3>
                <p>Live Streams</p>
              </div>
            </div>

            {/* Letzte Aktivitäten - Kompakte Version */}
            <div className="stat-card-compact activity-card-compact">
              <div className="activity-content-compact">
                <h3>Letzte Aktivitäten</h3>
                <div className="activity-list-compact">
                  <div className="activity-item-compact">
                    <span className="activity-icon-compact">🏆</span>
                    <span className="activity-text-compact">Turnier erstellt</span>
                  </div>
                  <div className="activity-item-compact">
                    <span className="activity-icon-compact">🥊</span>
                    <span className="activity-text-compact">5 neue Kämpfer</span>
                  </div>
                  <div className="activity-item-compact">
                    <span className="activity-icon-compact">🎥</span>
                    <span className="activity-text-compact">Stream beendet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Modules */}
      <div className="dashboard-modules">
        
        {/* Turnier Einstellungen Überschrift - Klickbar */}
        <div className="turnier-einstellungen-header" onClick={() => setModulesExpanded(!modulesExpanded)}>
          <h3>Turnier Einstellungen</h3>
          <div className={`toggle-arrow ${modulesExpanded ? 'expanded' : 'collapsed'}`}>
            ▼
          </div>
        </div>

        {/* Module Container - Einklappbar */}
        <div className={`modules-container ${modulesExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Tabs Navigation */}
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${modulesTab === 'organisation' ? 'active' : ''}`}
              onClick={() => setModulesTab('organisation')}
            >
              🏛️ Organisation
            </button>
            <button
              className={`dashboard-tab ${modulesTab === 'wettkampf' ? 'active' : ''}`}
              onClick={() => setModulesTab('wettkampf')}
            >
              ⚔️ Wettkampf
            </button>
            <button
              className={`dashboard-tab ${modulesTab === 'ergebnisse' ? 'active' : ''}`}
              onClick={() => setModulesTab('ergebnisse')}
            >
              🏆 Ergebnisse
            </button>
          </div>

          {/* Organisation Tab */}
          {modulesTab === 'organisation' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('turniere')}>
                <div className="module-icon">🏆</div>
                <div className="module-content">
                  <h4>Turniere</h4>
                  <p>Turniere erstellen und verwalten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('vereine')}>
                <div className="module-icon">🏛️</div>
                <div className="module-content">
                  <h4>Vereine</h4>
                  <p>Vereine verwalten und organisieren</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('divisionen')}>
                <div className="module-icon">🥋</div>
                <div className="module-content">
                  <h4>Divisionen</h4>
                  <p>Kategorien und Disziplinen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('turnier-einstellungen')}>
                <div className="module-icon">⚙️</div>
                <div className="module-content">
                  <h4>Turnier Einstellungen</h4>
                  <p>Konfiguration und Verwaltung</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('staff-management')}>
                <div className="module-icon">👥</div>
                <div className="module-content">
                  <h4>Staff Management</h4>
                  <p>Personal und Helfer verwalten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('kampfflaechen')}>
                <div className="module-icon">🥋</div>
                <div className="module-content">
                  <h4>Kampfflächen</h4>
                  <p>Matten und Arenen verwalten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              {user?.isAdmin && (
                <React.Fragment key="admin-modules-org">
                  <div className="module-card admin" onClick={() => setActiveView('sports')}>
                    <div className="module-icon">🥋</div>
                    <div className="module-content">
                      <h4>Multi-Sport</h4>
                      <p>Verschiedene Sportarten verwalten</p>
                    </div>
                    <div className="module-arrow">→</div>
                  </div>

                  <div className="module-card admin" onClick={() => setActiveView('admin')}>
                    <div className="module-icon">⚙️</div>
                    <div className="module-content">
                      <h4>Administration</h4>
                      <p>System-Einstellungen und Tools</p>
                    </div>
                    <div className="module-arrow">→</div>
                  </div>
                </React.Fragment>
              )}
            </div>
          )}

          {/* Wettkampf Tab */}
          {modulesTab === 'wettkampf' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('wettkaempfer-registrieren')}>
                <div className="module-icon">📝</div>
                <div className="module-content">
                  <h4>Wettkämpfer registrieren</h4>
                  <p>Neue Kämpfer anmelden</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('wettkaempfer')}>
                <div className="module-icon">🥊</div>
                <div className="module-content">
                  <h4>Wettkämpfer</h4>
                  <p>Kämpfer verwalten und organisieren</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('brackets')}>
                <div className="module-icon">🏅</div>
                <div className="module-content">
                  <h4>Brackets</h4>
                  <p>K.O.-Systeme und Turnierbäume</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('anmeldungen')}>
                <div className="module-icon">📝</div>
                <div className="module-content">
                  <h4>Anmeldungen</h4>
                  <p>Teilnehmer-Anmeldungen verwalten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('paarungen')}>
                <div className="module-icon">⚔️</div>
                <div className="module-content">
                  <h4>Paarungen erstellen</h4>
                  <p>Kämpfe und Matches organisieren</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('zeitplan')}>
                <div className="module-icon">⏰</div>
                <div className="module-content">
                  <h4>Zeitplan verwalten</h4>
                  <p>Turnier-Ablauf planen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('streaming')}>
                <div className="module-icon">🎥</div>
                <div className="module-content">
                  <h4>Live-Streaming</h4>
                  <p>Live-Übertragungen und Chat</p>
                </div>
                <div className="module-arrow">→</div>
              </div>
            </div>
          )}

          {/* Ergebnisse Tab */}
          {modulesTab === 'ergebnisse' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('ergebnisse')}>
                <div className="module-icon">📊</div>
                <div className="module-content">
                  <h4>Ergebnisse eingeben</h4>
                  <p>Wettkampf-Ergebnisse erfassen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('urkunden')}>
                <div className="module-icon">🏅</div>
                <div className="module-content">
                  <h4>Urkunden drucken</h4>
                  <p>Sieger-Urkunden erstellen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('live-ergebnisse')}>
                <div className="module-icon">📺</div>
                <div className="module-content">
                  <h4>Live-Ergebnisse</h4>
                  <p>Echtzeit-Anzeige für Zuschauer</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('siegerehrung')}>
                <div className="module-icon">🏆</div>
                <div className="module-content">
                  <h4>Siegerehrung</h4>
                  <p>Preise und Ehrungen verwalten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('platzierung')}>
                <div className="module-icon">🥇</div>
                <div className="module-content">
                  <h4>Platzierung finden</h4>
                  <p>Ranglisten und Tabellen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('analytics')}>
                <div className="module-icon">📈</div>
                <div className="module-content">
                  <h4>Statistiken</h4>
                  <p>Berichte und Analytics</p>
                </div>
                <div className="module-arrow">→</div>
              </div>
            </div>
          )}
        </div>

        {/* Berichte Überschrift - Klickbar */}
        <div className="berichte-header" onClick={() => setBerichteExpanded(!berichteExpanded)}>
          <h3>Berichte</h3>
          <div className={`toggle-arrow ${berichteExpanded ? 'expanded' : 'collapsed'}`}>
            ▼
          </div>
        </div>

        {/* Berichte Container - Einklappbar */}
        <div className={`berichte-container ${berichteExpanded ? 'expanded' : 'collapsed'}`}>
          {/* Tabs Navigation */}
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${berichteTab === 'organisation' ? 'active' : ''}`}
              onClick={() => setBerichteTab('organisation')}
            >
              🏛️ Organisation
            </button>
            <button
              className={`dashboard-tab ${berichteTab === 'wettkampf' ? 'active' : ''}`}
              onClick={() => setBerichteTab('wettkampf')}
            >
              ⚔️ Wettkampf
            </button>
            <button
              className={`dashboard-tab ${berichteTab === 'ergebnisse' ? 'active' : ''}`}
              onClick={() => setBerichteTab('ergebnisse')}
            >
              🏆 Ergebnisse
            </button>
          </div>

          {/* Organisation Tab (Berichte) */}
          {berichteTab === 'organisation' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('bericht-mitgliedschaft')}>
                <div className="module-icon">🆔</div>
                <div className="module-content">
                  <h4>Bericht Mitgliedschaft</h4>
                  <p>Vereins-Mitglieder</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('bericht-offizielle')}>
                <div className="module-icon">👔</div>
                <div className="module-content">
                  <h4>Bericht Offizielle</h4>
                  <p>Schiedsrichter und Kampfrichter</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('event-schule-bericht')}>
                <div className="module-icon">🏫</div>
                <div className="module-content">
                  <h4>Event Schule Bericht</h4>
                  <p>Schul-Veranstaltungen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('staff-checkin-bericht')}>
                <div className="module-icon">👍</div>
                <div className="module-content">
                  <h4>Staff Check-in Bericht</h4>
                  <p>Personal Anwesenheit</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('staff-aktivitaetenbericht')}>
                <div className="module-icon">👥</div>
                <div className="module-content">
                  <h4>Staff Aktivitätenbericht</h4>
                  <p>Personal-Aktivitäten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('geo-report')}>
                <div className="module-icon">📍</div>
                <div className="module-content">
                  <h4>Geo Report</h4>
                  <p>Geografische Verteilung</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('rings-berichte')}>
                <div className="module-icon">🎯</div>
                <div className="module-content">
                  <h4>Rings Berichte</h4>
                  <p>Kampfbereiche</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('accreditation-cards')}>
                <div className="module-icon">🆔</div>
                <div className="module-content">
                  <h4>Accreditation Cards</h4>
                  <p>Ausweise drucken</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('print-envelopes')}>
                <div className="module-icon">✉️</div>
                <div className="module-content">
                  <h4>Print Envelopes</h4>
                  <p>Briefumschläge drucken</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('limits-report')}>
                <div className="module-icon">🚫</div>
                <div className="module-content">
                  <h4>Limits Report</h4>
                  <p>Grenzen und Limits</p>
                </div>
                <div className="module-arrow">→</div>
              </div>
            </div>
          )}

          {/* Wettkampf Tab (Berichte) */}
          {berichteTab === 'wettkampf' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('wettbewerber-divisionen')}>
                <div className="module-icon">👥</div>
                <div className="module-content">
                  <h4>Wettbewerber nach Divisionen</h4>
                  <p>Kämpfer nach Kategorien</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('bericht-wettkaempfer')}>
                <div className="module-icon">👤</div>
                <div className="module-content">
                  <h4>Bericht Wettkämpfer</h4>
                  <p>Teilnehmer-Übersicht</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('hinzugefuegte-wettkaempfer')}>
                <div className="module-icon">➕</div>
                <div className="module-content">
                  <h4>hinzugefügte Wettkämpfer</h4>
                  <p>Neue Teilnehmer</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('teilnehmerbericht')}>
                <div className="module-icon">📊</div>
                <div className="module-content">
                  <h4>Teilnehmerbericht</h4>
                  <p>Teilnehmer-Statistiken</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('restrictions-bericht')}>
                <div className="module-icon">⚠️</div>
                <div className="module-content">
                  <h4>Restrictions Bericht</h4>
                  <p>Einschränkungen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('medizinisches-formular-bericht')}>
                <div className="module-icon">🏥</div>
                <div className="module-content">
                  <h4>Medizinisches Formular Bericht</h4>
                  <p>Gesundheitsdaten</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('medizinische-notizen-bericht')}>
                <div className="module-icon">💬</div>
                <div className="module-content">
                  <h4>Medizinische Notizen Bericht</h4>
                  <p>Gesundheitsnotizen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>
            </div>
          )}

          {/* Ergebnisse Tab (Berichte) */}
          {berichteTab === 'ergebnisse' && (
            <div className="modules-grid">
              <div className="module-card" onClick={() => setActiveView('finanzbericht')}>
                <div className="module-icon">💰</div>
                <div className="module-content">
                  <h4>Finanzbericht</h4>
                  <p>Einnahmen und Ausgaben</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('bericht-ergebnisse')}>
                <div className="module-icon">🏆</div>
                <div className="module-content">
                  <h4>Bericht Ergebnisse</h4>
                  <p>Turnier-Ergebnisse</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('medaillenbericht')}>
                <div className="module-icon">🥇</div>
                <div className="module-content">
                  <h4>Medaillenbericht</h4>
                  <p>Sieger und Platzierungen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('divisions-preisgeldbericht')}>
                <div className="module-icon">🎁</div>
                <div className="module-content">
                  <h4>Divisions Preisgeldbericht</h4>
                  <p>Preisgelder nach Divisionen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('merchandise-bericht')}>
                <div className="module-icon">🛍️</div>
                <div className="module-content">
                  <h4>Merchandise Bericht</h4>
                  <p>Verkäufe und Bestände</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('tournament-performance')}>
                <div className="module-icon">⏱️</div>
                <div className="module-content">
                  <h4>Tournament Performance</h4>
                  <p>Turnier-Leistung</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              <div className="module-card" onClick={() => setActiveView('bericht-teilzahlungen')}>
                <div className="module-icon">📅</div>
                <div className="module-content">
                  <h4>Bericht Teilzahlungen</h4>
                  <p>Ratenzahlungen</p>
                </div>
                <div className="module-arrow">→</div>
              </div>

              {/* Spezieller blauer Button */}
              <div className="module-card special-blue" onClick={() => setActiveView('startgelder-id-cards')}>
                <div className="module-icon">⬇️</div>
                <div className="module-content">
                  <h4>Startgelder / Id-Cards</h4>
                  <p>Eintrittsgelder und Ausweise</p>
                </div>
                <div className="module-arrow">▲</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainDashboard;