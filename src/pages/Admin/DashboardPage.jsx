// src/pages/Admin/DashboardPage.jsx - MIT OUTLET für Nested Routes
import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import '../../styles/Dashboard.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    turniere: 0,
    vereine: 0,
    wettkampfer: 0,
    kategorien: 0,
    anmeldungen: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('tda-theme') || 'dark';
  });

  // Theme beim Laden anwenden
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tda-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Simulierte Daten erstmal
  const fetchDashboardStats = async () => {
    setLoading(true);
    setTimeout(() => {
      setStats({
        turniere: 5,
        vereine: 12,
        wettkampfer: 87,
        kategorien: 775,
        anmeldungen: 23
      });
      setLoading(false);
    }, 500);
    console.log('📊 Dashboard-Statistiken (Simuliert)');
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('clubData');
    navigate('/login');
  };

  // Navigation-Handler mit Debug
  const handleNavigation = (path) => {
    console.log('🎯 Navigiere zu:', path);
    navigate(path);
  };

  // Prüfe ob wir auf der Dashboard-Hauptseite sind
  const isMainDashboard = location.pathname === '/dashboard';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🛡️ TDA Admin Dashboard</h1>
          <p>Zentrale Verwaltung des Turnierverwaltungssystems</p>
        </div>
        <div className="header-actions">
          {/* Back to Dashboard Button (wenn nicht auf Hauptseite) */}
          {!isMainDashboard && (
            <button
              onClick={() => navigate('/dashboard')}
              className="back-to-dashboard-btn"
            >
              ← Dashboard
            </button>
          )}
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? '☀️ Hell' : '🌙 Dunkel'}
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Zeige Dashboard-Inhalte nur auf der Hauptseite */}
      {isMainDashboard ? (
        <>
          {/* Statistiken Übersicht */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-number">{loading ? '...' : stats.turniere}</div>
                <div className="stat-label">Turniere</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏛️</div>
              <div className="stat-content">
                <div className="stat-number">{loading ? '...' : stats.vereine}</div>
                <div className="stat-label">Vereine</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👤</div>
              <div className="stat-content">
                <div className="stat-number">{loading ? '...' : stats.wettkampfer}</div>
                <div className="stat-label">Wettkämpfer</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🥋</div>
              <div className="stat-content">
                <div className="stat-number">{loading ? '...' : stats.kategorien}</div>
                <div className="stat-label">Kategorien</div>
              </div>
            </div>

            <div className="stat-card highlight">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-number">{loading ? '...' : stats.anmeldungen}</div>
                <div className="stat-label">Anmeldungen</div>
              </div>
            </div>
          </div>

          {/* Hauptnavigation */}
          <div className="dashboard-navigation">
            <div className="nav-section">
              <h2>🔧 Verwaltung</h2>
              <div className="nav-cards">
                <div 
                  onClick={() => handleNavigation('/dashboard/turniere')}
                  className="nav-card clickable"
                >
                  <div className="nav-icon">🏆</div>
                  <div className="nav-content">
                    <h3>Turniere verwalten</h3>
                    <p>Erstellen, bearbeiten und verwalten Sie Turniere</p>
                  </div>
                  <div className="nav-arrow">→</div>
                </div>

                <div 
                  onClick={() => handleNavigation('/dashboard/vereine')}
                  className="nav-card clickable"
                >
                  <div className="nav-icon">🏛️</div>
                  <div className="nav-content">
                    <h3>Vereine verwalten</h3>
                    <p>Überblick über alle registrierten Vereine</p>
                  </div>
                  <div className="nav-arrow">→</div>
                </div>

                <div 
                  onClick={() => handleNavigation('/dashboard/kategorien')}
                  className="nav-card clickable"
                >
                  <div className="nav-icon">🥋</div>
                  <div className="nav-content">
                    <h3>Kategorien verwalten</h3>
                    <p>Wettkampf-Kategorien und Divisionen</p>
                  </div>
                  <div className="nav-arrow">→</div>
                </div>
              </div>
            </div>

            {/* Registration & Anmeldungen Sektion */}
            <div className="nav-section">
              <h2>📝 Anmeldungen & Registration</h2>
              <div className="nav-cards">
                <div 
                  onClick={() => handleNavigation('/dashboard/registration')}
                  className="nav-card featured clickable"
                >
                  <div className="nav-icon">🎯</div>
                  <div className="nav-content">
                    <h3>Turnier-Registration</h3>
                    <p>Anmeldung für verfügbare Turniere</p>
                    <div className="nav-badge">Neu</div>
                  </div>
                  <div className="nav-arrow">→</div>
                </div>

                <div 
                  onClick={() => handleNavigation('/dashboard/anmeldungen')}
                  className="nav-card featured clickable"
                >
                  <div className="nav-icon">📊</div>
                  <div className="nav-content">
                    <h3>Anmeldungen verwalten</h3>
                    <p>Übersicht aller Turnier-Anmeldungen</p>
                    <div className="nav-badge">Live</div>
                  </div>
                  <div className="nav-arrow">→</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="nav-section">
              <h2>⚡ Quick Actions</h2>
              <div className="quick-actions">
                <button 
                  onClick={() => handleNavigation('/dashboard/turniere')}
                  className="quick-action-btn"
                >
                  ➕ Neues Turnier
                </button>
                <button 
                  onClick={() => handleNavigation('/dashboard/vereine')}
                  className="quick-action-btn"
                >
                  👥 Verein hinzufügen
                </button>
                <button 
                  onClick={() => handleNavigation('/dashboard/anmeldungen')}
                  className="quick-action-btn highlight"
                >
                  📝 Anmeldungen prüfen
                </button>
                <button 
                  onClick={fetchDashboardStats}
                  className="quick-action-btn"
                  disabled={loading}
                >
                  🔄 {loading ? 'Lädt...' : 'Aktualisieren'}
                </button>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="debug-info" style={{
            background: '#f0f0f0',
            padding: '1rem',
            borderRadius: '8px',
            margin: '2rem 0',
            fontSize: '0.9rem',
            color: '#666'
          }}>

          </div>

          {/* Footer */}
          <div className="dashboard-footer">
            <p>TDA Turnierverwaltungssystem - Admin Dashboard</p>
            <p>Version 2.0 mit Registration-System</p>
	    <p> Copyright by Sascha Schreiner</p>
          </div>
        </>
      ) : (
        /* Hier werden die Child-Routes gerendert */
        <div className="dashboard-content">
          <Outlet />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;