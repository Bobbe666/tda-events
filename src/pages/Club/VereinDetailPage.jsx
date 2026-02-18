import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVereinById } from '../../api/vereineApi';
import { getWettkaempferByVerein, addWettkaempfer } from '../../api/wettkaempferApi';
import '../../styles/VereinDetailPage.css';

// Dropdown-Optionen wie in der DB!
const skillLevels = ["Beginner", "Intermediate", "Advanced", "Black Belt"];
const gurtfarben = [
  "Weiß", "Weiß/Gelb", "Gelb", "Orange", "Grün", "Grün/Blau", "Blau",
  "Lila", "Blau/Rot", "Rot", "Braun", "Schwarz"
];

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function VereinDetailPage({ vereinId: propVereinId }) {
  const { id: paramId } = useParams();
  const navigate = useNavigate();

  // Use prop vereinId if provided, otherwise fall back to URL param
  const id = propVereinId || paramId;

  const [verein, setVerein] = useState(null);
  const [wettkaempfer, setWettkaempfer] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [vereinDetailsCollapsed, setVereinDetailsCollapsed] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedVerein, setEditedVerein] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWettkaempfer, setEditingWettkaempfer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailWettkaempfer, setDetailWettkaempfer] = useState(null);

  // Dojo Sync State
  const [hasDojo, setHasDojo] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // State für das neue Mitglied
  const [newMember, setNewMember] = useState({
    vorname: "",
    nachname: "",
    geburtsdatum: "",
    gewicht: "",
    skill_level: "",
    email: "",
    handy: "",
    vereins_id: id,
    geschlecht: "",
    nationalitaet: "",
    gurtfarbe: "",
    kampfstil: ""
  });

  useEffect(() => {
    getVereinById(id)
      .then(data => {
        console.log('🏢 Vereinsdaten geladen:', data);
        setVerein(data);
      })
      .catch(e => console.error('Fehler beim Laden der Vereinsdetails:', e));
    getWettkaempferByVerein(id)
      .then(setWettkaempfer)
      .catch(() => setWettkaempfer([]));

    // Check for Dojo integration
    checkDojoIntegration();
  }, [id]);

  const checkDojoIntegration = async () => {
    try {
      const response = await fetch(`/api/dojo-sync/check-updates/${id}`);
      const data = await response.json();

      if (data.success && data.has_integration) {
        setHasDojo(true);
        setLastSync(data.last_sync);
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Error checking dojo integration:', error);
    }
  };

  const handleDojoSync = async () => {
    setSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/dojo-sync/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verein_id: id })
      });

      const data = await response.json();

      if (data.success) {
        setSyncMessage({
          type: 'success',
          text: `✅ Sync erfolgreich! ${data.imported} neue, ${data.updated} aktualisiert${data.errors > 0 ? `, ${data.errors} Fehler` : ''}`
        });
        setLastSync(data.last_sync);

        // Reload wettkaempfer list
        const list = await getWettkaempferByVerein(id);
        setWettkaempfer(list);

        // Refresh sync status
        checkDojoIntegration();
      } else {
        setSyncMessage({
          type: 'error',
          text: `❌ Sync fehlgeschlagen: ${data.message}`
        });
      }
    } catch (error) {
      setSyncMessage({
        type: 'error',
        text: `❌ Fehler beim Sync: ${error.message}`
      });
    } finally {
      setSyncing(false);

      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleStartEdit = () => {
    setEditedVerein({ ...verein });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedVerein(null);
    setIsEditing(false);
  };

  const handleSaveVerein = async () => {
    try {
      setSaving(true);
      const { updateVerein } = await import('../../api/vereineApi');
      await updateVerein(id, editedVerein);
      setVerein(editedVerein);
      setIsEditing(false);
      setEditedVerein(null);
    } catch (error) {
      console.error('Fehler beim Speichern der Vereinsdaten:', error);
      alert('Fehler beim Speichern: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddModal = () => {
    setNewMember({
      vorname: "",
      nachname: "",
      geburtsdatum: "",
      gewicht: "",
      skill_level: "",
      email: "",
      handy: "",
      vereins_id: id,
      geschlecht: "",
      nationalitaet: "",
      gurtfarbe: "",
      kampfstil: ""
    });
    setModalError('');
    setShowAddModal(true);
  };

  // Formular absenden
  const handleWettkaempferSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSaving(true);

    // Pflichtfelder prüfen
    if (!newMember.vorname || !newMember.nachname || !newMember.geburtsdatum || !newMember.skill_level || !newMember.geschlecht || !newMember.gurtfarbe) {
      setModalError("❌ Bitte alle Pflichtfelder ausfüllen!");
      setSaving(false);
      return;
    }

    try {
      // Vereinside IMMER mitgeben!
      const saveObj = { ...newMember, vereins_id: id };
      const saved = await addWettkaempfer(saveObj);
      if (saved && (saved.id || saved.wettkaempfer_id)) {
        const list = await getWettkaempferByVerein(id);
        setWettkaempfer(list);
        setShowAddModal(false);
      } else {
        setModalError("⚠️ Speichern fehlgeschlagen.");
      }
    } catch (err) {
      setModalError("⚠️ Fehler beim Speichern: " + (err.message || ""));
    }
    setSaving(false);
  };

  // Alphabetische Filterung
  const getAvailableLetters = () => {
    const letters = new Set();
    wettkaempfer.forEach(wk => {
      const firstLetter = (wk.nachname || '').charAt(0).toUpperCase();
      if (firstLetter >= 'A' && firstLetter <= 'Z') {
        letters.add(firstLetter);
      }
    });
    return Array.from(letters).sort();
  };

  const filteredWettkaempfer = wettkaempfer.filter(wk => {
    // Filter by letter
    const firstLetter = (wk.nachname || '').charAt(0).toUpperCase();
    const letterMatch = selectedLetter === 'ALL' || firstLetter === selectedLetter;

    // Filter by search query
    const searchMatch = searchQuery === '' ||
      `${wk.vorname} ${wk.nachname}`.toLowerCase().includes(searchQuery.toLowerCase());

    return letterMatch && searchMatch;
  });

  const availableLetters = getAvailableLetters();

  if (!verein) {
    return (
      <div className="verein-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Lade Vereinsdaten...</p>
        </div>
      </div>
    );
  }


  // ===== WETTKÄMPFER ACTION HANDLERS =====
  const handleEditWettkaempfer = (wk) => {
    const formattedDate = wk.geburtsdatum ? wk.geburtsdatum.split('T')[0] : '';
    setEditingWettkaempfer({...wk, geburtsdatum: formattedDate});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWettkaempfer) return;
    setSaving(true);
    setModalError('');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`/api/wettkaempfer/${editingWettkaempfer.wettkaempfer_id}`, {
        method: 'PUT',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify(editingWettkaempfer)
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Fehler');
      setWettkaempfer(await getWettkaempferByVerein(id));
      setShowEditModal(false);
      setEditingWettkaempfer(null);
      alert('✅ Wettkämpfer aktualisiert');
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleShowDetail = (wk) => {
    const formattedDate = wk.geburtsdatum ? wk.geburtsdatum.split('T')[0] : '';
    setDetailWettkaempfer({...wk, geburtsdatum: formattedDate});
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    setEditingWettkaempfer(detailWettkaempfer);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleArchiveWettkaempfer = async (wkId) => {
    const grund = prompt('Grund für Archivierung:');
    if (grund === null) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`/api/wettkaempfer/${wkId}/archive`, {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({ grund })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Fehler');
      setWettkaempfer(await getWettkaempferByVerein(id));
      alert('✅ Archiviert');
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };

  const handleDeleteWettkaempfer = async (wkId) => {
    if (!window.confirm('Wettkämpfer löschen?')) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`/api/wettkaempfer/${wkId}`, {
        method: 'DELETE',
        headers: {'Authorization': `Bearer ${token}`}
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Fehler');
      setWettkaempfer(await getWettkaempferByVerein(id));
      alert('✅ Gelöscht');
    } catch (err) {
      alert('❌ ' + err.message);
    }
  };
  return (
    <div className="verein-detail-page">
      {/* Main Content Layout */}
      <div className={`detail-layout ${vereinDetailsCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Left Sidebar - Vereinsdaten */}
        <div className={`verein-sidebar ${vereinDetailsCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-header-left" onClick={() => setVereinDetailsCollapsed(!vereinDetailsCollapsed)}>
              <span className="toggle-icon">{vereinDetailsCollapsed ? '▶' : '◀'}</span>
              <h2>Vereinsdaten</h2>
            </div>
            {!vereinDetailsCollapsed && !isEditing && (
              <button className="edit-button" onClick={handleStartEdit}>
                ✏️ Bearbeiten
              </button>
            )}
            {!vereinDetailsCollapsed && isEditing && (
              <div className="edit-actions">
                <button className="save-button" onClick={handleSaveVerein} disabled={saving}>
                  {saving ? '💾 Speichern...' : '💾 Speichern'}
                </button>
                <button className="cancel-button" onClick={handleCancelEdit} disabled={saving}>
                  ❌ Abbrechen
                </button>
              </div>
            )}
          </div>

          {!vereinDetailsCollapsed && (
            <div className="sidebar-content">
              <div className="info-section">
                <h3>Allgemeines</h3>
                <div className="info-item">
                  <span className="info-label">Name:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.name || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, name: e.target.value})}
                    />
                  ) : (
                    <span className="info-value">{verein.name}</span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">Ansprechpartner:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.ansprechpartner || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, ansprechpartner: e.target.value})}
                    />
                  ) : (
                    <span className="info-value">{verein.ansprechpartner}</span>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>Kontakt</h3>
                <div className="info-item">
                  <span className="info-label">📧 Email:</span>
                  {isEditing ? (
                    <input
                      type="email"
                      className="info-input"
                      value={editedVerein?.email || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, email: e.target.value})}
                    />
                  ) : (
                    <span className="info-value">{verein.email}</span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">📞 Telefon:</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      className="info-input"
                      value={editedVerein?.telefon || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, telefon: e.target.value})}
                    />
                  ) : (
                    <span className="info-value">{verein.telefon}</span>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>Adresse</h3>
                <div className="info-item">
                  <span className="info-label">Straße:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.strasse || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, strasse: e.target.value})}
                      placeholder="Straße"
                    />
                  ) : (
                    <span className="info-value">{verein.strasse} {verein.hausnummer}</span>
                  )}
                </div>
                {isEditing && (
                  <div className="info-item">
                    <span className="info-label">Hausnummer:</span>
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.hausnummer || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, hausnummer: e.target.value})}
                      placeholder="Nr."
                    />
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">PLZ:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.plz || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, plz: e.target.value})}
                      placeholder="PLZ"
                    />
                  ) : (
                    <span className="info-value">{verein.plz}</span>
                  )}
                </div>
                <div className="info-item">
                  <span className="info-label">Ort:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="info-input"
                      value={editedVerein?.ort || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, ort: e.target.value})}
                      placeholder="Ort"
                    />
                  ) : (
                    <span className="info-value">{verein.ort}</span>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>Sonstiges</h3>
                <div className="info-item">
                  <span className="info-label">Benutzername:</span>
                  <span className="info-value">{verein.benutzername}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Homepage:</span>
                  {isEditing ? (
                    <input
                      type="url"
                      className="info-input"
                      value={editedVerein?.homepage || ''}
                      onChange={(e) => setEditedVerein({...editedVerein, homepage: e.target.value})}
                      placeholder="https://..."
                    />
                  ) : verein.homepage ? (
                    <span className="info-value">
                      <a href={verein.homepage} target="_blank" rel="noopener noreferrer">
                        {verein.homepage}
                      </a>
                    </span>
                  ) : (
                    <span className="info-value">-</span>
                  )}
                </div>
                {verein.logo && !isEditing && (
                  <div className="info-item">
                    <span className="info-label">Logo:</span>
                    <img src={verein.logo} alt="Logo" className="verein-logo" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Content - Wettkämpfer */}
        <div className="wettkaempfer-content">
          {/* Actions Bar */}
          <div className="actions-bar">
            <h2>Wettkämpfer ({wettkaempfer.length})</h2>
            <div className="actions-buttons">
              <button className="back-button" onClick={() => navigate(-1)} title="Zurück">
                ← Zurück
              </button>
              <button className="add-button" onClick={handleOpenAddModal}>
                ➕ Wettkämpfer hinzufügen
              </button>
            </div>
          </div>

          {/* Dojo Sync Widget - Compact One-Line Layout */}
          {hasDojo && (
            <div className="dojo-sync-widget-compact">
              <div className="sync-widget-title">
                <span className="sync-icon">🔄</span>
                <span>Dojosoftware Synchronisation</span>
              </div>
              <button
                className="sync-button-compact"
                onClick={handleDojoSync}
                disabled={syncing}
              >
                {syncing ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Synchronisiere...
                  </>
                ) : (
                  '🔄 Jetzt synchronisieren'
                )}
              </button>
              <div className="sync-last-info">
                <span className="info-label">Letzter Sync:</span>
                <span className="info-value">
                  {lastSync ? new Date(lastSync).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Noch nicht synchronisiert'}
                </span>
              </div>
            </div>
          )}

          {syncMessage && (
            <div className={`sync-message ${syncMessage.type}`}>
              {syncMessage.text}
            </div>
          )}

          {/* Filter Bar - Search + Alphabetical */}
          <div className="filter-bar">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Suche nach Namen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {availableLetters.length > 0 && (
              <div className="letter-filter-inline">
                <button
                  className={`letter-button ${selectedLetter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedLetter('ALL')}
                >
                  Alle
                </button>
                {availableLetters.map(letter => (
                  <button
                    key={letter}
                    className={`letter-button ${selectedLetter === letter ? 'active' : ''}`}
                    onClick={() => setSelectedLetter(letter)}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Wettkämpfer Liste */}
          <div className="wettkaempfer-list">
            {filteredWettkaempfer.length === 0 ? (
              <div className="no-results">
                <p>
                  {selectedLetter === 'ALL'
                    ? 'Noch keine Wettkämpfer angelegt.'
                    : `Keine Wettkämpfer mit Anfangsbuchstabe "${selectedLetter}".`}
                </p>
              </div>
            ) : (
              <div className="wettkaempfer-grid">
                {filteredWettkaempfer.map((wk) => (
                  <div key={wk.wettkaempfer_id || wk.id} className="wettkaempfer-card">
                    <div className="wettkaempfer-header">
                      <h3>{wk.vorname} {wk.nachname}</h3>
                      {wk.gurtfarbe && (
                        <span className="gurtfarbe-badge">{wk.gurtfarbe}</span>
                      )}
                    </div>
                    <div className="wettkaempfer-info">
                      <div className="info-row-dual">
                        {wk.geburtsdatum && (
                          <div className="info-item">
                            <span className="icon">🎂</span>
                            <span>{formatDate(wk.geburtsdatum)}</span>
                          </div>
                        )}
                        {wk.geschlecht && (
                          <div className="info-item">
                            <span className="icon">👤</span>
                            <span>{wk.geschlecht}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="wettkaempfer-actions">
                      <button className="action-btn detail-btn" onClick={() => handleShowDetail(wk)} title="Details">
                        👁️
                      </button>
                      <button className="action-btn edit-btn" onClick={() => handleEditWettkaempfer(wk)} title="Bearbeiten">
                        ✏️
                      </button>
                      <button className="action-btn archive-btn" onClick={() => handleArchiveWettkaempfer(wk.wettkaempfer_id || wk.id)} title="Archivieren">
                        📦
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteWettkaempfer(wk.wettkaempfer_id || wk.id)} title="Löschen">
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal für neues Mitglied */}
      <Modal open={showAddModal} title="Wettkämpfer anlegen" onClose={() => setShowAddModal(false)}>
        <form onSubmit={handleWettkaempferSubmit} className="wettkaempfer-form">
          <div className="form-grid">
            <div className="form-column">
              <label>
                Vorname *
                <input
                  type="text"
                  value={newMember.vorname}
                  onChange={e => setNewMember({...newMember, vorname: e.target.value})}
                  required
                />
              </label>
              <label>
                Nachname *
                <input
                  type="text"
                  value={newMember.nachname}
                  onChange={e => setNewMember({...newMember, nachname: e.target.value})}
                  required
                />
              </label>
              <label>
                Geburtsdatum *
                <input
                  type="date"
                  value={newMember.geburtsdatum}
                  onChange={e => setNewMember({...newMember, geburtsdatum: e.target.value})}
                  required
                />
              </label>
              <label>
                Gewicht (kg)
                <input
                  type="number"
                  value={newMember.gewicht}
                  onChange={e => setNewMember({...newMember, gewicht: e.target.value})}
                  min="0"
                  step="0.1"
                />
              </label>
              <label>
                Skill Level *
                <select
                  value={newMember.skill_level}
                  onChange={e => setNewMember({...newMember, skill_level: e.target.value})}
                  required
                >
                  <option value="">Bitte wählen</option>
                  {skillLevels.map(level => <option key={level} value={level}>{level}</option>)}
                </select>
              </label>
              <label>
                Geschlecht *
                <select
                  value={newMember.geschlecht}
                  onChange={e => setNewMember({...newMember, geschlecht: e.target.value})}
                  required
                >
                  <option value="">Bitte wählen</option>
                  <option value="männlich">männlich</option>
                  <option value="weiblich">weiblich</option>
                  <option value="divers">divers</option>
                </select>
              </label>
            </div>
            <div className="form-column">
              <label>
                Nationalität
                <input
                  type="text"
                  value={newMember.nationalitaet}
                  onChange={e => setNewMember({...newMember, nationalitaet: e.target.value})}
                />
              </label>
              <label>
                Gurtfarbe *
                <select
                  value={newMember.gurtfarbe}
                  onChange={e => setNewMember({...newMember, gurtfarbe: e.target.value})}
                  required
                >
                  <option value="">Bitte wählen</option>
                  {gurtfarben.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </label>
              <label>
                Kampfstil
                <input
                  type="text"
                  value={newMember.kampfstil}
                  onChange={e => setNewMember({...newMember, kampfstil: e.target.value})}
                />
              </label>
              <label>
                E-Mail
                <input
                  type="email"
                  value={newMember.email}
                  onChange={e => setNewMember({...newMember, email: e.target.value})}
                />
              </label>
              <label>
                Handy
                <input
                  type="tel"
                  value={newMember.handy}
                  onChange={e => setNewMember({...newMember, handy: e.target.value})}
                />
              </label>
              <button className="submit-button" type="submit" disabled={saving}>
                {saving ? "Speichern..." : "Speichern"}
              </button>
              {modalError && <div className="error-message">{modalError}</div>}
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} title="Wettkämpfer bearbeiten" onClose={() => setShowEditModal(false)}>
        {editingWettkaempfer && (
          <form onSubmit={handleSaveEdit} className="wettkaempfer-form">
            {modalError && <div className="error-message">{modalError}</div>}
            <div className="form-grid">
              <div className="form-column">
                <label>
                  Vorname *
                  <input type="text" value={editingWettkaempfer.vorname} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, vorname: e.target.value})} required />
                </label>
                <label>
                  Nachname *
                  <input type="text" value={editingWettkaempfer.nachname} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, nachname: e.target.value})} required />
                </label>
                <label>
                  Geburtsdatum *
                  <input type="date" value={editingWettkaempfer.geburtsdatum} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, geburtsdatum: e.target.value})} required />
                </label>
                <label>
                  Geschlecht *
                  <select value={editingWettkaempfer.geschlecht || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, geschlecht: e.target.value})} required>
                    <option value="">Bitte wählen</option>
                    <option value="M">Männlich</option>
                    <option value="W">Weiblich</option>
                    <option value="divers">Divers</option>
                  </select>
                </label>
                <label>
                  Gewicht (kg) *
                  <input type="number" step="0.1" value={editingWettkaempfer.gewicht || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, gewicht: e.target.value})} required />
                </label>
                <label>
                  Skill Level *
                  <select value={editingWettkaempfer.skill_level || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, skill_level: e.target.value})} required>
                    <option value="">Bitte wählen</option>
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-column">
                <label>
                  Gurtfarbe
                  <select value={editingWettkaempfer.gurtfarbe || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, gurtfarbe: e.target.value})}>
                    <option value="">Bitte wählen</option>
                    {gurtfarben.map(farbe => (
                      <option key={farbe} value={farbe}>{farbe}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Kampfstil
                  <input type="text" value={editingWettkaempfer.kampfstil || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, kampfstil: e.target.value})} />
                </label>
                <label>
                  Nationalität
                  <input type="text" value={editingWettkaempfer.nationalitaet || 'DE'} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, nationalitaet: e.target.value})} />
                </label>
                <label>
                  E-Mail
                  <input type="email" value={editingWettkaempfer.email || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, email: e.target.value})} />
                </label>
                <label>
                  Handy
                  <input type="tel" value={editingWettkaempfer.handy || ''} onChange={e => setEditingWettkaempfer({...editingWettkaempfer, handy: e.target.value})} />
                </label>
              </div>
            </div>
            <button className="submit-button" type="submit" disabled={saving}>
              {saving ? "Speichere..." : "Änderungen speichern"}
            </button>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={showDetailModal} title="Wettkämpfer Details" onClose={() => setShowDetailModal(false)}>
        {detailWettkaempfer && (
          <div className="detail-view">
            <div className="detail-header">
              <h2>{detailWettkaempfer.vorname} {detailWettkaempfer.nachname}</h2>
              <button className="action-btn edit-btn" onClick={handleEditFromDetail}>
                ✏️ Bearbeiten
              </button>
            </div>
            <div className="detail-grid">
              <div className="detail-section">
                <h3>📋 Persönliche Daten</h3>
                <div className="detail-row"><strong>Geburtsdatum:</strong> {formatDate(detailWettkaempfer.geburtsdatum)}</div>
                <div className="detail-row"><strong>Geschlecht:</strong> {detailWettkaempfer.geschlecht}</div>
                <div className="detail-row"><strong>Nationalität:</strong> {detailWettkaempfer.nationalitaet || 'DE'}</div>
                {detailWettkaempfer.email && <div className="detail-row"><strong>E-Mail:</strong> {detailWettkaempfer.email}</div>}
                {detailWettkaempfer.handy && <div className="detail-row"><strong>Handy:</strong> {detailWettkaempfer.handy}</div>}
              </div>
              <div className="detail-section">
                <h3>🥋 Kampfsport-Daten</h3>
                <div className="detail-row"><strong>Gewicht:</strong> {detailWettkaempfer.gewicht} kg</div>
                <div className="detail-row"><strong>Skill Level:</strong> {detailWettkaempfer.skill_level}</div>
                {detailWettkaempfer.gurtfarbe && <div className="detail-row"><strong>Gurtfarbe:</strong> {detailWettkaempfer.gurtfarbe}</div>}
                {detailWettkaempfer.kampfstil && <div className="detail-row"><strong>Kampfstil:</strong> {detailWettkaempfer.kampfstil}</div>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
