// src/pages/Club/VereineListePage.jsx - Dashboard Card Style
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/VereineListePage.css'; // Neues CSS für Card-Design

const VereineListePage = () => {
  const navigate = useNavigate();
  const [vereine, setVereine] = useState([]);
  const [archivedVereine, setArchivedVereine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [letterFilter, setLetterFilter] = useState('Alle');
  const [stats, setStats] = useState({
    gesamt: 0,
    aktive: 0,
    archiviert: 0,
    totalWettkaempfer: 0
  });

  useEffect(() => {
    fetchVereine();
    fetchArchivedVereine();
    fetchWettkaempferStats();
  }, []);

  const fetchVereine = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch('/api/vereine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      let vereineData = [];
      if (data.success && Array.isArray(data.data)) {
        vereineData = data.data;
      } else if (Array.isArray(data)) {
        vereineData = data;
      }

      setVereine(vereineData);

      // Berechne Statistiken
      setStats(prevStats => ({
        ...prevStats,
        gesamt: vereineData.length,
        aktive: vereineData.filter(v => v.rolle === 'verein' || !v.rolle).length
      }));

    } catch (err) {
      console.error('❌ Fehler beim Laden der Vereine:', err);
      setError('Fehler beim Laden der Vereine: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedVereine = async () => {
    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch('/api/vereine/archived', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      let archivedData = [];
      if (data.success && Array.isArray(data.data)) {
        archivedData = data.data;
      } else if (Array.isArray(data)) {
        archivedData = data;
      }

      setArchivedVereine(archivedData);
      setStats(prevStats => ({
        ...prevStats,
        archiviert: archivedData.length
      }));

    } catch (err) {
      console.error('❌ Fehler beim Laden archivierter Vereine:', err);
    }
  };

  const fetchWettkaempferStats = async () => {
    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch('/api/wettkaempfer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      let wettkaempferData = [];
      if (data.success && Array.isArray(data.data)) {
        wettkaempferData = data.data;
      } else if (Array.isArray(data)) {
        wettkaempferData = data;
      }

      setStats(prevStats => ({
        ...prevStats,
        totalWettkaempfer: wettkaempferData.length
      }));

    } catch (err) {
      console.error('❌ Fehler beim Laden der Wettkämpfer-Statistik:', err);
    }
  };

  const handleArchive = async (vereinId, vereinName) => {
    if (!window.confirm(`Verein "${vereinName}" wirklich archivieren?\n\nDer Verein und alle Wettkämpfer werden archiviert und aus der aktiven Liste entfernt.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch(`/api/vereine/${vereinId}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grund: 'Archiviert durch Admin'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Verein "${vereinName}" erfolgreich archiviert!`);
        fetchVereine();
        fetchArchivedVereine();
      } else {
        throw new Error(data.error || 'Archivierung fehlgeschlagen');
      }

    } catch (err) {
      console.error('❌ Fehler beim Archivieren:', err);
      alert('Fehler beim Archivieren: ' + err.message);
    }
  };

  const handlePermanentDelete = async (vereinId, vereinName) => {
    if (!window.confirm(`ACHTUNG: Verein "${vereinName}" PERMANENT löschen?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!\nAlle Daten inkl. Wettkämpfer und Archiv-Einträge werden gelöscht.`)) {
      return;
    }

    const confirmText = prompt('Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen:');
    if (confirmText !== 'LÖSCHEN') {
      alert('Löschung abgebrochen.');
      return;
    }

    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch(`/api/vereine/${vereinId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Verein "${vereinName}" permanent gelöscht!`);
        fetchVereine();
        fetchArchivedVereine();
      } else {
        throw new Error(data.error || 'Löschung fehlgeschlagen');
      }

    } catch (err) {
      console.error('❌ Fehler beim Löschen:', err);
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handleRestore = async (archivId, vereinName) => {
    if (!window.confirm(`Verein "${vereinName}" aus dem Archiv wiederherstellen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch(`/api/vereine/archived/${archivId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Verein "${vereinName}" erfolgreich wiederhergestellt!`);
        fetchVereine();
        fetchArchivedVereine();
      } else {
        throw new Error(data.error || 'Wiederherstellung fehlgeschlagen');
      }

    } catch (err) {
      console.error('❌ Fehler beim Wiederherstellen:', err);
      alert('Fehler beim Wiederherstellen: ' + err.message);
    }
  };

  const handleVereinClick = (vereinId) => {
    navigate(`/dashboard/vereine/${vereinId}`);
  };

  // Ermittle alle verfügbaren Anfangsbuchstaben
  const availableLetters = React.useMemo(() => {
    const letters = new Set();
    vereine.forEach(verein => {
      if (verein.name) {
        const firstLetter = verein.name.charAt(0).toUpperCase();
        if (firstLetter.match(/[A-Z]/)) {
          letters.add(firstLetter);
        }
      }
    });
    return Array.from(letters).sort();
  }, [vereine]);

  const filteredVereine = vereine
    .filter(verein => {
      // Suchfilter
      const matchesSearch = verein.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verein.ort?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verein.ansprechpartner?.toLowerCase().includes(searchTerm.toLowerCase());

      // Buchstabenfilter
      const matchesLetter = letterFilter === 'Alle' ||
        verein.name?.charAt(0).toUpperCase() === letterFilter;

      return matchesSearch && matchesLetter;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'ort-asc':
          return (a.ort || '').localeCompare(b.ort || '');
        case 'ort-desc':
          return (b.ort || '').localeCompare(a.ort || '');
        case 'newest':
          return new Date(b.erstellt_am || 0) - new Date(a.erstellt_am || 0);
        case 'oldest':
          return new Date(a.erstellt_am || 0) - new Date(b.erstellt_am || 0);
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="vereine-page">
        <div className="page-header">
          <h1>🏛️ Vereine verwalten</h1>
          <p>Zentrale Verwaltung aller registrierten Vereine</p>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Vereine werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vereine-page">
        <div className="page-header">
          <h1>🏛️ Vereine verwalten</h1>
          <p>Zentrale Verwaltung aller registrierten Vereine</p>
        </div>
        <div className="error-container">
          <h2>❌ Fehler beim Laden</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchVereine}>
            🔄 Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vereine-page">
      {/* ✅ Dashboard-Style Header ohne Back-Button */}
      <div className="page-header">
        <h1>🏛️ Vereine verwalten</h1>
        <p>Zentrale Verwaltung aller registrierten Vereine</p>
      </div>

      {/* ✅ Statistik-Cards wie im Dashboard */}
      <div className="stats-grid compact">
        <div className="stat-card compact">
          <div className="stat-icon">🏛️</div>
          <div className="stat-content">
            <h3>{stats.gesamt}</h3>
            <p>Vereine</p>
          </div>
        </div>
        <div className="stat-card compact">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.aktive}</h3>
            <p>Aktiv</p>
          </div>
        </div>
        <div className="stat-card compact">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.archiviert}</h3>
            <p>Archiviert</p>
          </div>
        </div>
        <div className="stat-card compact">
          <div className="stat-icon">🥋</div>
          <div className="stat-content">
            <h3>{stats.totalWettkaempfer}</h3>
            <p>Wettkämpfer</p>
          </div>
        </div>
        <div className="stat-card compact">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <h3>{filteredVereine.length}</h3>
            <p>Gefiltert</p>
          </div>
        </div>
      </div>

      {/* ✅ Such- und Filter-Bereich */}
      <div className="controls-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Vereine durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="sort-container">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="name-asc">🔤 Name (A-Z)</option>
            <option value="name-desc">🔤 Name (Z-A)</option>
            <option value="ort-asc">📍 Ort (A-Z)</option>
            <option value="ort-desc">📍 Ort (Z-A)</option>
            <option value="newest">📅 Neueste zuerst</option>
            <option value="oldest">📅 Älteste zuerst</option>
          </select>
        </div>
        <div className="letter-filter-container">
          <button
            className={`letter-filter-btn ${letterFilter === 'Alle' ? 'active' : ''}`}
            onClick={() => setLetterFilter('Alle')}
          >
            Alle
          </button>
          {availableLetters.map(letter => (
            <button
              key={letter}
              className={`letter-filter-btn ${letterFilter === letter ? 'active' : ''}`}
              onClick={() => setLetterFilter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>
        <div className="actions-container">
          <button
            className="action-button primary"
            onClick={() => {
              fetchVereine();
              fetchArchivedVereine();
              fetchWettkaempferStats();
            }}
          >
            🔄 Aktualisieren
          </button>
          <button
            className="action-button secondary"
            onClick={() => navigate('/dashboard/vereine/neu')}
          >
            ➕ Neuer Verein
          </button>
        </div>
      </div>

      {/* ✅ Vereine-Grid im Dashboard-Card-Style */}
      {filteredVereine.length === 0 ? (
        <div className="no-results">
          <div className="no-results-content">
            <h3>🔍 Keine Vereine gefunden</h3>
            <p>
              {searchTerm 
                ? `Keine Vereine entsprechen dem Suchbegriff "${searchTerm}"`
                : 'Noch keine Vereine registriert'
              }
            </p>
            {searchTerm && (
              <button 
                className="clear-search-button"
                onClick={() => setSearchTerm('')}
              >
                ❌ Suche löschen
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="vereine-grid">
          {filteredVereine.map((verein) => (
            <div 
              key={verein.vereins_id} 
              className="verein-card clickable"
              onClick={() => handleVereinClick(verein.vereins_id)}
            >
              {/* ✅ Card Header */}
              <div className="verein-card-header">
                <div className="verein-title">
                  <h3>{verein.name}</h3>
                  <span className="verein-id">ID: {verein.vereins_id}</span>
                </div>
                <div className="verein-status">
                  {verein.rolle === 'admin' ? (
                    <span className="status-badge admin">👑 Admin</span>
                  ) : (
                    <span className="status-badge verein">🏛️ Verein</span>
                  )}
                </div>
              </div>

              {/* ✅ Card Body */}
              <div className="verein-card-body">
                <div className="verein-info">
                  <div className="info-item">
                    <span className="info-icon">👤</span>
                    <span className="info-text">{verein.ansprechpartner || 'Nicht angegeben'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <span className="info-text">{verein.ort || 'Nicht angegeben'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📧</span>
                    <span className="info-text">{verein.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📞</span>
                    <span className="info-text">{verein.telefon || 'Nicht angegeben'}</span>
                  </div>
                </div>
              </div>

              {/* ✅ Card Footer */}
              <div className="verein-card-footer">
                <button
                  className="card-action-button primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVereinClick(verein.vereins_id);
                  }}
                >
                  👁️ Details
                </button>
                <button
                  className="card-action-button secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/vereine/${verein.vereins_id}/bearbeiten`);
                  }}
                >
                  ✏️ Bearbeiten
                </button>
                <button
                  className="card-action-button archive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleArchive(verein.vereins_id, verein.name);
                  }}
                >
                  📦 Archivieren
                </button>
                <button
                  className="card-action-button danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePermanentDelete(verein.vereins_id, verein.name);
                  }}
                >
                  🗑️ Löschen
                </button>
              </div>

              {/* ✅ Hover-Effekt Indikator */}
              <div className="card-hover-indicator">
                <span>Klicken für Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Footer-Info für aktive Vereine */}
      <div className="page-footer">
        <p>
          <strong>{filteredVereine.length}</strong> von <strong>{vereine.length}</strong> Vereinen angezeigt
          {searchTerm && ` • Filter: "${searchTerm}"`}
        </p>
      </div>

      {/* ✅ ARCHIVIERTE VEREINE SECTION */}
      {archivedVereine.length > 0 && (
        <>
          <div className="archived-section-header">
            <h2>📦 Archivierte Vereine ({archivedVereine.length})</h2>
            <p>Vereine, die archiviert wurden und wiederhergestellt werden können</p>
          </div>

          <div className="vereine-grid archived">
            {archivedVereine.map((verein) => (
              <div
                key={verein.archiv_id}
                className="verein-card archived-card"
              >
                {/* Card Header */}
                <div className="verein-card-header">
                  <div className="verein-title">
                    <h3>{verein.name}</h3>
                    <span className="verein-id">Archiv-ID: {verein.archiv_id}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="verein-card-body">
                  <div className="verein-info">
                    <div className="info-item">
                      <span className="info-icon">👤</span>
                      <span className="info-text">{verein.ansprechpartner || 'Nicht angegeben'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">📍</span>
                      <span className="info-text">{verein.ort || 'Nicht angegeben'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">📦</span>
                      <span className="info-text">
                        Archiviert: {new Date(verein.archiviert_am).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-icon">👥</span>
                      <span className="info-text">
                        {verein.anzahl_wettkaempfer || 0} Wettkämpfer
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="verein-card-footer">
                  <button
                    className="card-action-button restore"
                    onClick={() => handleRestore(verein.archiv_id, verein.name)}
                  >
                    ♻️ Wiederherstellen
                  </button>
                  <button
                    className="card-action-button danger"
                    onClick={() => handlePermanentDelete(verein.original_vereins_id, verein.name)}
                  >
                    🗑️ Permanent löschen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VereineListePage;