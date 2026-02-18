import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './TurnierDashboard.css';

function TurnierDashboard() {
  const navigate = useNavigate();
  const [turniere, setTurniere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    active: 0,
    completed: 0,
    participants: 0
  });
  const [kategorienMap, setKategorienMap] = useState({});

  useEffect(() => {
    fetchTurniere();
  }, []);

  // Kategorien für alle Turniere laden
  const fetchAllKategorien = async (turniereList) => {
    const token = localStorage.getItem('token');
    const kategorienObj = {};

    await Promise.all(
      turniereList.map(async (t) => {
        try {
          const response = await fetch(`/api/turniere/${t.turnier_id}/kategorien`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const result = await response.json();
            kategorienObj[t.turnier_id] = result.data || [];
          }
        } catch (err) {
          console.error(`Fehler beim Laden der Kategorien für Turnier ${t.turnier_id}:`, err);
        }
      })
    );

    setKategorienMap(kategorienObj);
  };

  useEffect(() => {
    calculateStats();
  }, [turniere]);

  const fetchTurniere = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/turniere', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Turniere');
      }

      const result = await response.json();
      console.log('🏆 Turniere API Response:', result);
      
      // Handle new API response format
      let turniereList = [];
      if (result.success && result.data) {
        turniereList = Array.isArray(result.data) ? result.data : [];
      } else if (Array.isArray(result)) {
        // Fallback for old format
        turniereList = result;
      } else {
        console.warn('Unerwartetes API-Format:', result);
      }
      setTurniere(turniereList);

      // Kategorien für alle Turniere laden
      if (turniereList.length > 0) {
        fetchAllKategorien(turniereList);
      }

      setLoading(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!turniere.length) return;

    const now = new Date();
    const newStats = {
      total: turniere.length,
      upcoming: turniere.filter(t => new Date(t.start_datum) > now).length,
      active: turniere.filter(t => {
        const start = new Date(t.start_datum);
        const end = new Date(t.end_datum);
        return start <= now && now <= end;
      }).length,
      completed: turniere.filter(t => new Date(t.end_datum) < now).length,
      participants: turniere.reduce((sum, t) => sum + (t.max_teilnehmer || 0), 0)
    };

    setStats(newStats);
  };

  // Navigation zu neuer Seite statt Modal
  const handleAddTurnier = () => {
    navigate('/dashboard/turnier-bearbeiten/neu');
  };

  const handleEditTurnier = (turnier) => {
    navigate(`/dashboard/turnier-bearbeiten/${turnier.turnier_id}`, {
      state: { turnier }
    });
  };

  const handleDeleteTurnier = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Turnier löschen möchten?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/turniere/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Turniers');
      }

      await fetchTurniere();
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const getFilteredTurniere = () => {
    return turniere.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || getTurnierStatus(t) === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getTurnierStatus = (turnier) => {
    const now = new Date();
    const start = new Date(turnier.start_datum || turnier.datum);
    const end = new Date(turnier.end_datum || turnier.datum);
    
    if (start > now) return 'upcoming';
    if (start <= now && now <= end) return 'active';
    return 'completed';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return '📅';
      case 'active': return '⚡';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#3182ce';
      case 'active': return '#38a169';
      case 'completed': return '#718096';
      default: return '#4a5568';
    }
  };

  if (loading) {
    return (
      <div className="turnier-loading">
        <div className="loading-spinner">⏳</div>
        <p>Turniere werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="turnier-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchTurniere}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="turnier-dashboard">
      {/* Header mit Button und Filtern */}
      <div className="action-header">
        <button
          className="add-btn"
          onClick={handleAddTurnier}
        >
          + Neues Turnier
        </button>

        <div className="header-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Turnier suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Alle Status</option>
            <option value="upcoming">Geplant</option>
            <option value="active">Laufend</option>
            <option value="completed">Abgeschlossen</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Turniere gesamt</p>
          </div>
        </div>

        <div className="stat-card upcoming">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.upcoming}</h3>
            <p>Geplant</p>
          </div>
        </div>

        <div className="stat-card active">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Laufend</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Abgeschlossen</p>
          </div>
        </div>
      </div>

      {/* Turniere Liste */}
      <div className="turnier-grid">
        {getFilteredTurniere().map(t => (
          <TurnierCard
            key={t.turnier_id}
            turnier={t}
            kategorien={kategorienMap[t.turnier_id] || []}
            onEdit={handleEditTurnier}
            onDelete={handleDeleteTurnier}
          />
        ))}
      </div>
    </div>
  );
}

// Kategorie Icons
const KATEGORIE_ICONS = {
  'Kumite': '🥊',
  'Formen': '🎭',
  'Kickboxen': '🦵',
  'Selbstverteidigung': '🛡️',
  'Grappling': '🤼',
  'Rumble': '⚔️',
  'Bruchtest': '🧱',
  'BJJ': '🥋'
};

// Turnier Card Component
function TurnierCard({ turnier, kategorien = [], onEdit, onDelete }) {
  // Helper functions first
  const getTurnierStatus = (turnier) => {
    const now = new Date();
    const start = new Date(turnier.start_datum || turnier.datum);
    const end = new Date(turnier.end_datum || turnier.datum);
    
    if (start > now) return 'upcoming';
    if (start <= now && now <= end) return 'active';
    return 'completed';
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'TBD';
      
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Datum konnte nicht formatiert werden:', dateString, error);
      return 'TBD';
    }
  };

  const status = getTurnierStatus(turnier);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'upcoming': return '📅';
      case 'active': return '⚡';
      case 'completed': return '✅';
      default: return '📋';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Geplant';
      case 'active': return 'Laufend';
      case 'completed': return 'Abgeschlossen';
      default: return 'Unbekannt';
    }
  };

  return (
    <div className={`turnier-card ${status}`}>
      <div className="card-header">
        <div className="name-section">
          <h3>{turnier.name}</h3>
          <div className="meta-info">
            <span>{getStatusIcon(status)} {getStatusText(status)}</span>
            <span>🎯 {turnier.sportart || 'Unbekannt'}</span>
          </div>
        </div>
      </div>

      {/* Kategorien Badges */}
      {kategorien.length > 0 && (
        <div className="kategorien-badges">
          {kategorien.map(kat => (
            <span key={kat} className="kategorie-badge">
              {KATEGORIE_ICONS[kat] || '🏷️'} {kat}
            </span>
          ))}
        </div>
      )}

      <div className="card-body">
        <div className="info-row">
          <span className="label">Zeitraum:</span>
          <span className="value">
            {formatDate(turnier.datum || turnier.start_datum)}
            {(turnier.end_datum && turnier.end_datum !== turnier.datum) 
              ? ` - ${formatDate(turnier.end_datum)}` 
              : ''
            }
          </span>
        </div>
        
        <div className="info-row">
          <span className="label">Max. Teilnehmer:</span>
          <span className="value">{turnier.max_teilnehmer || 'Unbegrenzt'}</span>
        </div>
        
        <div className="info-row">
          <span className="label">Anmeldegebühr:</span>
          <span className="value">{turnier.anmeldegebuehr || 0}€</span>
        </div>
        
        {turnier.beschreibung && (
          <div className="info-row">
            <span className="label">Beschreibung:</span>
            <span className="value description">{turnier.beschreibung}</span>
          </div>
        )}
      </div>

      <div className="card-actions">
        <button
          className="edit-btn"
          onClick={() => onEdit(turnier)}
        >
          ✏️ Bearbeiten
        </button>
        <button
          className="delete-btn"
          onClick={() => onDelete(turnier.turnier_id)}
        >
          🗑️ Löschen
        </button>
      </div>
    </div>
  );
}

export default TurnierDashboard;