// src/pages/Admin/AnmeldungenUebersicht.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/AnmeldungenUebersicht.css';

const AnmeldungenUebersicht = () => {
  const [anmeldungen, setAnmeldungen] = useState({});
  const [turniere, setTurniere] = useState([]);
  const [selectedTurnier, setSelectedTurnier] = useState('');
  const [selectedVerein, setSelectedVerein] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [vereine, setVereine] = useState([]);

  useEffect(() => {
    fetchTurniere();
    fetchStats();
    fetchVereine();
  }, []);

  useEffect(() => {
    if (selectedTurnier) {
      fetchAnmeldungen();
    }
  }, [selectedTurnier, selectedVerein]);

  const fetchTurniere = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/turniere', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTurniere(data);
        
        // Automatisch das neueste Turnier auswählen
        if (data.length > 0) {
          const neuestesTurnier = data.sort((a, b) => new Date(b.datum) - new Date(a.datum))[0];
          setSelectedTurnier(neuestesTurnier.id.toString());
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Turniere:', err);
    }
  };

  const fetchVereine = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/vereine', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVereine(data);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Vereine:', err);
    }
  };

  const fetchAnmeldungen = async () => {
    if (!selectedTurnier) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      let url = `/api/anmeldungen/turnier/${selectedTurnier}`;
      
      if (selectedVerein) {
        url += `?verein_id=${selectedVerein}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Anmeldungen');
      }

      const data = await response.json();
      setAnmeldungen(data.anmeldungen || {});
      
    } catch (err) {
      console.error('Fehler beim Laden der Anmeldungen:', err);
      setError('Fehler beim Laden der Anmeldungen');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/anmeldungen/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Statistiken:', err);
    }
  };

  const handleStorno = async (anmeldungId) => {
    if (!window.confirm('Möchten Sie diese Anmeldung wirklich stornieren?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const grund = prompt('Grund für die Stornierung (optional):') || 'Admin-Stornierung';
      
      const response = await fetch(`/api/anmeldungen/cancel/${anmeldungId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grund })
      });

      if (response.ok) {
        fetchAnmeldungen(); // Daten neu laden
        fetchStats(); // Statistiken aktualisieren
      } else {
        alert('Fehler beim Stornieren der Anmeldung');
      }
    } catch (err) {
      console.error('Fehler beim Stornieren:', err);
      alert('Fehler beim Stornieren der Anmeldung');
    }
  };

  const exportToCSV = () => {
    if (!anmeldungen || Object.keys(anmeldungen).length === 0) {
      alert('Keine Daten zum Exportieren vorhanden');
      return;
    }

    const csvRows = [];
    csvRows.push(['Verein', 'Ort', 'Wettkämpfer', 'Geschlecht', 'Alter', 'Gewicht', 'Graduierung', 'Anmeldedatum', 'Status']);

    Object.values(anmeldungen).forEach(vereinData => {
      vereinData.wettkampfer.forEach(wettkampfer => {
        const alter = new Date().getFullYear() - new Date(wettkampfer.geburtsdatum).getFullYear();
        csvRows.push([
          vereinData.verein.name,
          vereinData.verein.ort,
          `${wettkampfer.vorname} ${wettkampfer.nachname}`,
          wettkampfer.geschlecht === 'M' ? 'Männlich' : 'Weiblich',
          alter,
          wettkampfer.gewicht,
          wettkampfer.graduierung,
          new Date(wettkampfer.anmeldedatum).toLocaleDateString('de-DE'),
          wettkampfer.status
        ]);
      });
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `anmeldungen_turnier_${selectedTurnier}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const gesamtAnmeldungen = Object.values(anmeldungen).reduce((sum, verein) => sum + verein.anzahl, 0);
  const anzahlVereine = Object.keys(anmeldungen).length;

  return (
    <div className="anmeldungen-uebersicht">
      <div className="page-header">
        <h1>Anmeldungen Übersicht</h1>
        <p>Verwaltung aller Turnier-Anmeldungen</p>
      </div>

      {/* Statistiken Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-number">{stats.gesamt?.gesamt_anmeldungen || 0}</div>
            <div className="stat-label">Gesamt Anmeldungen</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.gesamt?.aktive_turniere || 0}</div>
            <div className="stat-label">Aktive Turniere</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.gesamt?.teilnehmende_vereine || 0}</div>
            <div className="stat-label">Teilnehmende Vereine</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.gesamt?.angemeldete_wettkampfer || 0}</div>
            <div className="stat-label">Angemeldete Wettkämpfer</div>
          </div>
        </div>
      )}

      {/* Filter und Controls */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label>Turnier auswählen:</label>
            <select 
              value={selectedTurnier} 
              onChange={(e) => setSelectedTurnier(e.target.value)}
            >
              <option value="">-- Turnier wählen --</option>
              {turniere.map(turnier => (
                <option key={turnier.id} value={turnier.id}>
                  {turnier.turnier_name} ({new Date(turnier.datum).toLocaleDateString('de-DE')})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Verein filtern:</label>
            <select 
              value={selectedVerein} 
              onChange={(e) => setSelectedVerein(e.target.value)}
            >
              <option value="">-- Alle Vereine --</option>
              {vereine.map(verein => (
                <option key={verein.vereins_id} value={verein.vereins_id}>
                  {verein.vereinsname} ({verein.ort})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="actions">
          <button onClick={exportToCSV} className="export-btn" disabled={!selectedTurnier}>
            📊 CSV Export
          </button>
          <button onClick={fetchAnmeldungen} className="refresh-btn" disabled={!selectedTurnier}>
            🔄 Aktualisieren
          </button>
        </div>
      </div>

      {/* Turnier Info */}
      {selectedTurnier && (
        <div className="turnier-summary">
          <h2>
            {turniere.find(t => t.id.toString() === selectedTurnier)?.turnier_name}
          </h2>
          <div className="summary-stats">
            <span className="summary-item">
              📊 {gesamtAnmeldungen} Anmeldungen
            </span>
            <span className="summary-item">
              🏛️ {anzahlVereine} Vereine
            </span>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Anmeldungen Liste */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Anmeldungen werden geladen...</p>
        </div>
      ) : selectedTurnier && Object.keys(anmeldungen).length > 0 ? (
        <div className="anmeldungen-liste">
          {Object.entries(anmeldungen).map(([vereinId, vereinData]) => (
            <div key={vereinId} className="verein-section">
              <div className="verein-header">
                <h3>
                  🏛️ {vereinData.verein.name}
                  <span className="verein-ort">({vereinData.verein.ort})</span>
                </h3>
                <div className="verein-stats">
                  {vereinData.anzahl} Wettkämpfer
                </div>
              </div>

              <div className="wettkampfer-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Geschlecht</th>
                      <th>Alter</th>
                      <th>Gewicht</th>
                      <th>Graduierung</th>
                      <th>Anmeldedatum</th>
                      <th>Status</th>
                      <th>Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vereinData.wettkampfer.map(wettkampfer => (
                      <tr key={wettkampfer.anmeldung_id}>
                        <td>
                          <strong>{wettkampfer.vorname} {wettkampfer.nachname}</strong>
                        </td>
                        <td>
                          <span className={`gender-badge ${wettkampfer.geschlecht}`}>
                            {wettkampfer.geschlecht === 'M' ? '♂' : '♀'}
                          </span>
                        </td>
                        <td>{calculateAge(wettkampfer.geburtsdatum)} Jahre</td>
                        <td>{wettkampfer.gewicht} kg</td>
                        <td>
                          <span className="graduation-badge">
                            {wettkampfer.graduierung}
                          </span>
                        </td>
                        <td>
                          {new Date(wettkampfer.anmeldedatum).toLocaleDateString('de-DE')}
                        </td>
                        <td>
                          <span className={`status-badge ${wettkampfer.status.toLowerCase()}`}>
                            {wettkampfer.status}
                          </span>
                        </td>
                        <td>
                          {wettkampfer.status === 'Angemeldet' && (
                            <button 
                              onClick={() => handleStorno(wettkampfer.anmeldung_id)}
                              className="storno-btn"
                              title="Anmeldung stornieren"
                            >
                              🚫
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : selectedTurnier ? (
        <div className="no-data">
          <div className="no-data-icon">📋</div>
          <h3>Keine Anmeldungen gefunden</h3>
          <p>
            {selectedVerein 
              ? 'Für den ausgewählten Verein liegen keine Anmeldungen vor.' 
              : 'Für dieses Turnier sind noch keine Anmeldungen eingegangen.'
            }
          </p>
        </div>
      ) : (
        <div className="select-turnier">
          <div className="select-icon">🏆</div>
          <h3>Turnier auswählen</h3>
          <p>Bitte wählen Sie ein Turnier aus, um die Anmeldungen anzuzeigen.</p>
        </div>
      )}
    </div>
  );
};

export default AnmeldungenUebersicht;