import React, { useState, useEffect, useCallback } from 'react';
import TDACard from '../common/TDACard';
import './AnmeldeDashboard.css';

function AnmeldeDashboard({ selectedTurnier }) {
  const [anmeldungen, setAnmeldungen] = useState([]);
  const [turniere, setTurniere] = useState([]);
  const [vereine, setVereine] = useState([]);
  const [wettkampfer, setWettkampfer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurnier, setFilterTurnier] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVerein, setFilterVerein] = useState('');
  const [filterGeschlecht, setFilterGeschlecht] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterAlter, setFilterAlter] = useState('');
  const [filterGewicht, setFilterGewicht] = useState('');
  const [filterKampfstil, setFilterKampfstil] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterAnmeldeDatum, setFilterAnmeldeDatum] = useState('');
  const [sortBy, setSortBy] = useState('anmeldedatum');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnmeldung, setEditingAnmeldung] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    if (selectedTurnier) {
      fetchAnmeldungen();
      fetchTurniere();
      fetchVereine();
      fetchWettkampfer();
    }
  }, [selectedTurnier, fetchAnmeldungen]);

  useEffect(() => {
    calculateStats();
  }, [anmeldungen, calculateStats]);

  const fetchAnmeldungen = useCallback(async () => {
    if (!selectedTurnier) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/anmeldungen/admin/all?turnierId=${selectedTurnier.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Anmeldungen');
      }

      const result = await response.json();
      console.log('📝 Anmeldungen API Response:', result);
      
      if (result.success && result.data) {
        setAnmeldungen(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        setAnmeldungen(result);
      } else {
        setAnmeldungen([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [selectedTurnier]);

  const fetchTurniere = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/turniere', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTurniere(Array.isArray(result.data) ? result.data : []);
        } else if (Array.isArray(result)) {
          setTurniere(result);
        } else {
          setTurniere([]);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Turniere:', err);
    }
  };

  const fetchVereine = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/vereine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setVereine(Array.isArray(result.data) ? result.data : []);
        } else if (Array.isArray(result)) {
          setVereine(result);
        } else {
          setVereine([]);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Vereine:', err);
    }
  };

  const fetchWettkampfer = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wettkaempfer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setWettkampfer(Array.isArray(result.data) ? result.data : []);
        } else if (Array.isArray(result)) {
          setWettkampfer(result);
        } else {
          setWettkampfer([]);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Wettkämpfer:', err);
    }
  };

  const calculateStats = useCallback(() => {
    if (!anmeldungen.length) return;

    const newStats = {
      total: anmeldungen.length,
      pending: anmeldungen.filter(a => a.status === 'Angemeldet').length,
      confirmed: anmeldungen.filter(a => a.status === 'Bestätigt').length,
      cancelled: anmeldungen.filter(a => a.status === 'Storniert' || a.status === 'Abgemeldet').length,
      totalRevenue: anmeldungen
        .filter(a => a.status === 'Bestätigt')
        .reduce((sum, a) => sum + (a.startgebuehr || 0), 0)
    };

    setStats(newStats);
  }, [anmeldungen]);

  const handleStatusChange = async (anmeldungId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/anmeldungen/${anmeldungId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Anmeldung');
      }

      await fetchAnmeldungen();
    } catch (err) {
      console.error('Fehler:', err);
      alert('Fehler beim Aktualisieren der Anmeldung');
    }
  };

  const handleDeleteAnmeldung = async (anmeldungId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Anmeldung löschen möchten?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/anmeldungen/${anmeldungId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Anmeldung');
      }

      await fetchAnmeldungen();
    } catch (err) {
      console.error('Fehler:', err);
      alert('Fehler beim Löschen der Anmeldung');
    }
  };

  const handleEditAnmeldung = (anmeldung) => {
    setEditingAnmeldung({
      ...anmeldung,
      originalStatus: anmeldung.status
    });
  };

  const handleSaveEdit = async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/anmeldungen/${editingAnmeldung.anmeldung_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Anmeldung');
      }

      setEditingAnmeldung(null);
      await fetchAnmeldungen();
    } catch (err) {
      console.error('Fehler:', err);
      alert('Fehler beim Aktualisieren der Anmeldung');
    }
  };

  const handleCreateAnmeldung = async (anmeldungData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/anmeldungen', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anmeldungData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Anmeldung');
      }

      setShowAddModal(false);
      await fetchAnmeldungen();
      alert('Anmeldung erfolgreich erstellt!');
    } catch (err) {
      console.error('Fehler:', err);
      alert('Fehler beim Erstellen der Anmeldung: ' + err.message);
    }
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setFilterTurnier('');
    setFilterStatus('');
    setFilterVerein('');
    setFilterGeschlecht('');
    setFilterLevel('');
    setFilterAlter('');
    setFilterGewicht('');
    setFilterKampfstil('');
    setFilterDivision('');
    setFilterAnmeldeDatum('');
    setSortBy('anmeldedatum');
    setSortOrder('desc');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filterTurnier) count++;
    if (filterStatus) count++;
    if (filterVerein) count++;
    if (filterGeschlecht) count++;
    if (filterLevel) count++;
    if (filterAlter) count++;
    if (filterGewicht) count++;
    if (filterKampfstil) count++;
    if (filterDivision) count++;
    if (filterAnmeldeDatum) count++;
    return count;
  };

  const getFilteredAnmeldungen = () => {
    let filtered = anmeldungen.filter(a => {
      const wettkampferName = `${a.vorname || ''} ${a.nachname || ''}`.trim();
      const matchesSearch = 
        wettkampferName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.turnier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.verein_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.division_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.kampfstil?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTurnier = !filterTurnier || a.turnier_name === filterTurnier;
      const matchesStatus = !filterStatus || a.status === filterStatus;
      const matchesVerein = !filterVerein || a.verein_name === filterVerein;
      const matchesGeschlecht = !filterGeschlecht || a.geschlecht === filterGeschlecht;
      const matchesLevel = !filterLevel || a.skill_level === filterLevel;
      const matchesAlter = !filterAlter || a.alter === filterAlter;
      const matchesGewicht = !filterGewicht || a.gewicht === filterGewicht;
      const matchesKampfstil = !filterKampfstil || a.kampfstil === filterKampfstil;
      const matchesDivision = !filterDivision || a.division_code === filterDivision;
      
      // Datum-Filter
      let matchesAnmeldeDatum = true;
      if (filterAnmeldeDatum) {
        const anmeldeDatum = new Date(a.anmeldedatum);
        const filterDatum = new Date(filterAnmeldeDatum);
        matchesAnmeldeDatum = anmeldeDatum.toDateString() === filterDatum.toDateString();
      }
      
      return matchesSearch && matchesTurnier && matchesStatus && matchesVerein && 
             matchesGeschlecht && matchesLevel && matchesAlter && matchesGewicht && 
             matchesKampfstil && matchesDivision && matchesAnmeldeDatum;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'nachname':
          aVal = `${a.nachname || ''} ${a.vorname || ''}`.toLowerCase();
          bVal = `${b.nachname || ''} ${b.vorname || ''}`.toLowerCase();
          break;
        case 'anmeldedatum':
          aVal = new Date(a.anmeldedatum || 0);
          bVal = new Date(b.anmeldedatum || 0);
          break;
        case 'turnier_name':
          aVal = (a.turnier_name || '').toLowerCase();
          bVal = (b.turnier_name || '').toLowerCase();
          break;
        case 'verein_name':
          aVal = (a.verein_name || '').toLowerCase();
          bVal = (b.verein_name || '').toLowerCase();
          break;
        case 'skill_level':
          aVal = (a.skill_level || '').toLowerCase();
          bVal = (b.skill_level || '').toLowerCase();
          break;
        default:
          aVal = new Date(a.anmeldedatum || 0);
          bVal = new Date(b.anmeldedatum || 0);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  if (loading) {
    return (
      <div className="anmelde-loading">
        <div className="loading-spinner">⏳</div>
        <p>Anmeldungen werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="anmelde-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchAnmeldungen}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="anmelde-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h2>📝 Anmeldungen verwalten</h2>
        <div className="header-actions">
          <button 
            className="add-btn"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Neue Anmeldung
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="tda-card-grid tda-card-grid-4">
        <TDACard
          title={stats.total}
          subtitle="Anmeldungen gesamt"
          meta={[{ icon: '📝', text: 'Gesamt' }]}
          size="small"
        />

        <TDACard
          title={stats.pending}
          subtitle="Ausstehend"
          meta={[{ icon: '⏳', text: 'Warten' }]}
          size="small"
          variant="warning"
        />

        <TDACard
          title={stats.confirmed}
          subtitle="Bestätigt"
          meta={[{ icon: '✅', text: 'OK' }]}
          size="small"
          variant="success"
        />

        <TDACard
          title={`${stats.totalRevenue}€`}
          subtitle="Einnahmen"
          meta={[{ icon: '💰', text: 'Umsatz' }]}
          size="small"
        />
      </div>

      {/* Compact Filters */}
      <div className="filters-compact">
        <div className="filters-header">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Teilnehmer, Turnier oder Verein suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-actions">
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              ⚙️ Filter {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </button>
            <button 
              className="filter-reset-btn"
              onClick={resetAllFilters}
              disabled={getActiveFilterCount() === 0}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Basic Filters Row */}
        <div className="filters-row">
          <div className="filter-group">
            <label>🏆 Turnier</label>
            <select
              className="filter-select"
              value={filterTurnier}
              onChange={(e) => setFilterTurnier(e.target.value)}
            >
              <option value="">Alle Turniere</option>
              {turniere.map(t => (
                <option key={t.turnier_id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>📊 Status</label>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Alle Status</option>
              <option value="Angemeldet">📝 Angemeldet</option>
              <option value="Bestätigt">✅ Bestätigt</option>
              <option value="Storniert">❌ Storniert</option>
              <option value="Abgemeldet">🚫 Abgemeldet</option>
            </select>
          </div>

          <div className="filter-group">
            <label>🏛️ Verein</label>
            <select
              className="filter-select"
              value={filterVerein}
              onChange={(e) => setFilterVerein(e.target.value)}
            >
              <option value="">Alle Vereine</option>
              {Array.from(new Set(anmeldungen.map(a => a.verein_name).filter(Boolean))).map(verein => (
                <option key={verein} value={verein}>
                  {verein}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>👥 Geschlecht</label>
            <select
              className="filter-select"
              value={filterGeschlecht}
              onChange={(e) => setFilterGeschlecht(e.target.value)}
            >
              <option value="">Alle Geschlechter</option>
              <option value="männlich">♂ Herren</option>
              <option value="weiblich">♀ Damen</option>
            </select>
          </div>

          <div className="filter-group">
            <label>📈 Sortierung</label>
            <select
              className="filter-select sort-select"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="anmeldedatum-desc">🕒 Neuste zuerst</option>
              <option value="anmeldedatum-asc">🕒 Älteste zuerst</option>
              <option value="nachname-asc">👤 Name A-Z</option>
              <option value="nachname-desc">👤 Name Z-A</option>
              <option value="turnier_name-asc">🏆 Turnier A-Z</option>
              <option value="turnier_name-desc">🏆 Turnier Z-A</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="filters-advanced">
            <div className="filters-row">
              <div className="filter-group">
                <label>🥋 Level</label>
                <select
                  className="filter-select"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="">Alle Level</option>
                  {Array.from(new Set(anmeldungen.map(a => a.skill_level).filter(Boolean))).map(level => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>🎯 Division</label>
                <select
                  className="filter-select"
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                >
                  <option value="">Alle Divisionen</option>
                  {Array.from(new Set(anmeldungen.map(a => a.division_code).filter(Boolean))).map(division => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>🥊 Kampfstil</label>
                <select
                  className="filter-select"
                  value={filterKampfstil}
                  onChange={(e) => setFilterKampfstil(e.target.value)}
                >
                  <option value="">Alle Kampfstile</option>
                  {Array.from(new Set(anmeldungen.map(a => a.kampfstil).filter(Boolean))).map(kampfstil => (
                    <option key={kampfstil} value={kampfstil}>
                      {kampfstil}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>🎂 Alter</label>
                <select
                  className="filter-select"
                  value={filterAlter}
                  onChange={(e) => setFilterAlter(e.target.value)}
                >
                  <option value="">Alle Altersgruppen</option>
                  {Array.from(new Set(anmeldungen.map(a => a.alter).filter(Boolean))).sort((a, b) => a - b).map(alter => (
                    <option key={alter} value={alter}>
                      {alter} Jahre
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>⚖️ Gewicht</label>
                <select
                  className="filter-select"
                  value={filterGewicht}
                  onChange={(e) => setFilterGewicht(e.target.value)}
                >
                  <option value="">Alle Gewichtsklassen</option>
                  {Array.from(new Set(anmeldungen.map(a => a.gewicht).filter(Boolean))).sort((a, b) => a - b).map(gewicht => (
                    <option key={gewicht} value={gewicht}>
                      {gewicht} kg
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>📅 Anmeldedatum</label>
                <input
                  type="date"
                  className="filter-date"
                  value={filterAnmeldeDatum}
                  onChange={(e) => setFilterAnmeldeDatum(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Anmeldungen Liste - ULTRA REDUZIERT */}
      <div className="tda-card-grid tda-card-grid-5">
        {getFilteredAnmeldungen().length === 0 ? (
          <TDACard
            empty={true}
            emptyText="Keine Anmeldungen gefunden"
            size="small"
          />
        ) : (
          getFilteredAnmeldungen().map(a => (
            <AnmeldeCard
              key={a.anmeldung_id}
              anmeldung={a}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteAnmeldung}
              onEdit={handleEditAnmeldung}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingAnmeldung && (
        <EditAnmeldungModal
          anmeldung={editingAnmeldung}
          onSave={handleSaveEdit}
          onCancel={() => setEditingAnmeldung(null)}
        />
      )}

      {/* Add New Anmeldung Modal */}
      {showAddModal && (
        <AddAnmeldungModal
          turniere={turniere}
          vereine={vereine}
          wettkampfer={wettkampfer}
          onSave={handleCreateAnmeldung}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// Anmelde Card Component
function AnmeldeCard({ anmeldung, onStatusChange, onDelete, onEdit }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Angemeldet': return '⏳';
      case 'Bestätigt': return '✅';
      case 'Storniert': return '❌';
      case 'Abgemeldet': return '🚫';
      default: return '📋';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Angemeldet': return 'Angemeldet';
      case 'Bestätigt': return 'Bestätigt';
      case 'Storniert': return 'Storniert';
      case 'Abgemeldet': return 'Abgemeldet';
      default: return 'Unbekannt';
    }
  };

  // Meta-Informationen für die Card
  const meta = [
    {
      icon: '🏆',
      text: anmeldung.turnier_name || 'Unbekanntes Turnier'
    },
    {
      icon: '🏛️',
      text: anmeldung.verein_name || 'Unbekannter Verein'
    },
    {
      icon: getStatusIcon(anmeldung.status),
      text: getStatusText(anmeldung.status)
    },
    {
      icon: '💰',
      text: `${anmeldung.startgebuehr || 0}€`
    }
  ];

  // Aktionen für die Card
  const actions = [
    {
      icon: '✏️',
      onClick: () => onEdit(anmeldung),
      title: 'Bearbeiten',
      variant: 'edit'
    },
    {
      icon: '🗑️',
      onClick: () => onDelete(anmeldung.anmeldung_id),
      title: 'Löschen',
      variant: 'delete'
    }
  ];

  // Zusätzliche Informationen als Children
  const additionalInfo = (
    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
      <div>📅 {formatDate(anmeldung.anmeldedatum)}</div>
      {anmeldung.gewicht && (
        <div>⚖️ {anmeldung.gewicht}kg</div>
      )}
      {anmeldung.skill_level && (
        <div>🥋 {anmeldung.skill_level}</div>
      )}
    </div>
  );

  return (
    <TDACard
      title={`${anmeldung.vorname || ''} ${anmeldung.nachname || ''}`.trim() || 'Unbekannt'}
      subtitle={anmeldung.turnier_name || 'Unbekanntes Turnier'}
      meta={meta}
      actions={actions}
      size="small"
      variant={anmeldung.status === 'Bestätigt' ? 'success' : anmeldung.status === 'Angemeldet' ? 'warning' : 'error'}
    >
      {additionalInfo}
    </TDACard>
  );
}

// Placeholder Modal Components (simplified for migration)
function EditAnmeldungModal({ anmeldung, onSave, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Anmeldung bearbeiten</h3>
        <p>Modal-Funktionalität wird implementiert...</p>
        <button onClick={onCancel}>Schließen</button>
      </div>
    </div>
  );
}

function AddAnmeldungModal({ turniere, vereine, wettkampfer, onSave, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Neue Anmeldung</h3>
        <p>Modal-Funktionalität wird implementiert...</p>
        <button onClick={onCancel}>Schließen</button>
      </div>
    </div>
  );
}

export default AnmeldeDashboard;
