import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/TurnierBearbeitenPage.css';

const TurnierBearbeitenPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract ID from URL path since MainDashboard doesn't use nested Routes
  // URL pattern: /dashboard/turnier-bearbeiten/:id
  const extractIdFromPath = () => {
    const pathParts = location.pathname.split('/');
    // Find 'turnier-bearbeiten' segment and get the next part as ID
    const bearbeitenIndex = pathParts.findIndex(part => part === 'turnier-bearbeiten');
    if (bearbeitenIndex !== -1 && pathParts[bearbeitenIndex + 1]) {
      return pathParts[bearbeitenIndex + 1];
    }
    return null;
  };

  const id = extractIdFromPath();
  const isNewTurnier = !id || id === 'neu';

  console.log('🔍 TurnierBearbeitenPage - URL:', location.pathname, '| ID:', id, '| isNew:', isNewTurnier);

  const initialTurnier = location.state?.turnier || null;

  const [activeTab, setActiveTab] = useState('grunddaten');
  const [loading, setLoading] = useState(!isNewTurnier && !initialTurnier);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Verfügbare Kategorien
  const KATEGORIEN = [
    { id: 'Kumite', label: 'Kumite', icon: '🥊' },
    { id: 'Formen', label: 'Formen / Kata', icon: '🎭' },
    { id: 'Kickboxen', label: 'Kickboxen', icon: '🦵' },
    { id: 'Selbstverteidigung', label: 'Selbstverteidigung', icon: '🛡️' },
    { id: 'Grappling', label: 'Grappling', icon: '🤼' },
    { id: 'Rumble', label: 'Rumble', icon: '⚔️' },
    { id: 'Bruchtest', label: 'Bruchtest', icon: '🧱' },
    { id: 'BJJ', label: 'Brazilian Jiu-Jitsu', icon: '🥋' }
  ];

  const [selectedKategorien, setSelectedKategorien] = useState([]);

  const [formData, setFormData] = useState({
    name: initialTurnier?.name || '',
    beschreibung: initialTurnier?.beschreibung || '',
    sportart: initialTurnier?.sportart || '',
    disziplin: initialTurnier?.disziplin || '',
    start_datum: initialTurnier?.start_datum?.split('T')[0] || initialTurnier?.datum?.split('T')[0] || '',
    end_datum: initialTurnier?.end_datum?.split('T')[0] || '',
    anmeldeschluss: initialTurnier?.anmeldeschluss?.split('T')[0] || '',
    max_teilnehmer: initialTurnier?.max_teilnehmer || '',
    anmeldegebuehr: initialTurnier?.anmeldegebuehr || '',
    ort: initialTurnier?.ort || '',
    adresse: initialTurnier?.adresse || '',
    plz: initialTurnier?.plz || '',
    stadt: initialTurnier?.stadt || '',
    land: initialTurnier?.land || 'Deutschland',
    kontakt_email: initialTurnier?.kontakt_email || '',
    kontakt_telefon: initialTurnier?.kontakt_telefon || '',
    website: initialTurnier?.website || '',
    regeln: initialTurnier?.regeln || '',
    status: initialTurnier?.status || 'Geplant',
    altersklassen: initialTurnier?.altersklassen || '',
    gewichtsklassen: initialTurnier?.gewichtsklassen || '',
    hinweise: initialTurnier?.hinweise || ''
  });

  const tabs = [
    { id: 'grunddaten', label: 'Grunddaten', icon: '📋' },
    { id: 'termin-ort', label: 'Termin & Ort', icon: '📍' },
    { id: 'teilnehmer', label: 'Teilnehmer', icon: '👥' },
    { id: 'kontakt', label: 'Kontakt & Info', icon: '📞' },
    { id: 'kategorien', label: 'Kategorien', icon: '🏷️' }
  ];

  useEffect(() => {
    if (!isNewTurnier && !initialTurnier) {
      fetchTurnier();
    }
    // Kategorien laden wenn Turnier existiert
    if (!isNewTurnier && id) {
      fetchKategorien();
    }
  }, [id, isNewTurnier, initialTurnier]);

  const fetchKategorien = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/turniere/${id}/kategorien`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedKategorien(result.data || []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Kategorien:', err);
    }
  };

  const toggleKategorie = (kategorieId) => {
    setSelectedKategorien(prev =>
      prev.includes(kategorieId)
        ? prev.filter(k => k !== kategorieId)
        : [...prev, kategorieId]
    );
  };

  const fetchTurnier = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/turniere/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Turnier konnte nicht geladen werden');

      const result = await response.json();
      const turnier = result.data || result;

      setFormData({
        name: turnier.name || '',
        beschreibung: turnier.beschreibung || '',
        sportart: turnier.sportart || '',
        disziplin: turnier.disziplin || '',
        start_datum: turnier.start_datum?.split('T')[0] || turnier.datum?.split('T')[0] || '',
        end_datum: turnier.end_datum?.split('T')[0] || '',
        anmeldeschluss: turnier.anmeldeschluss?.split('T')[0] || '',
        max_teilnehmer: turnier.max_teilnehmer || '',
        anmeldegebuehr: turnier.anmeldegebuehr || '',
        ort: turnier.ort || '',
        adresse: turnier.adresse || '',
        plz: turnier.plz || '',
        stadt: turnier.stadt || '',
        land: turnier.land || 'Deutschland',
        kontakt_email: turnier.kontakt_email || '',
        kontakt_telefon: turnier.kontakt_telefon || '',
        website: turnier.website || '',
        regeln: turnier.regeln || '',
        status: turnier.status || 'Geplant',
        altersklassen: turnier.altersklassen || '',
        gewichtsklassen: turnier.gewichtsklassen || '',
        hinweise: turnier.hinweise || ''
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setError('Bitte Turniernamen eingeben.');
      setActiveTab('grunddaten');
      return;
    }
    if (!formData.start_datum) {
      setError('Bitte Turnierdatum eingeben.');
      setActiveTab('termin-ort');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const url = isNewTurnier ? '/api/turniere' : `/api/turniere/${id}`;
      const method = isNewTurnier ? 'POST' : 'PUT';

      // Sende alle Datumsfelder an das Backend
      const apiData = {
        name: formData.name,
        start_datum: formData.start_datum,
        end_datum: formData.end_datum || formData.start_datum, // Falls kein Enddatum, nutze Startdatum
        ort: formData.ort,
        disziplin: formData.disziplin,
        anmeldeschluss: formData.anmeldeschluss,
        status: formData.status
      };

      console.log('📝 Sende an API:', method, url, apiData);

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Speichern');
      }

      const savedTurnier = await response.json();
      const turnierId = savedTurnier.data?.turnier_id || id;

      // Kategorien speichern
      if (turnierId && selectedKategorien.length >= 0) {
        await fetch(`/api/turniere/${turnierId}/kategorien`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ kategorien: selectedKategorien })
        });
      }

      setSuccessMessage(isNewTurnier ? 'Turnier erstellt!' : 'Gespeichert!');
      setTimeout(() => navigate('/dashboard/turniere'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate('/dashboard/turniere');

  if (loading) {
    return (
      <div className="turnier-edit-page">
        <div className="loading-box">
          <div className="spinner"></div>
          <span>Laden...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="turnier-edit-page">
      {/* Kompakter Header */}
      <div className="edit-header">
        <button className="back-btn" onClick={handleCancel}>← Zurück</button>
        <h1>{isNewTurnier ? 'Neues Turnier' : 'Turnier bearbeiten'}</h1>
        <div className="header-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>Abbrechen</button>
          <button type="submit" form="turnier-form" className="btn-save" disabled={saving}>
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* Meldungen */}
      {error && <div className="msg msg-error">{error}</div>}
      {successMessage && <div className="msg msg-success">{successMessage}</div>}

      {/* Tabs */}
      <div className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Formular */}
      <form id="turnier-form" onSubmit={handleSubmit} className="tab-content">

        {/* Tab: Grunddaten */}
        {activeTab === 'grunddaten' && (
          <div className="tab-panel">
            <div className="form-row">
              <div className="form-field wide">
                <label>Turniername *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="z.B. TDA Meisterschaft 2026" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Sportart</label>
                <select name="sportart" value={formData.sportart} onChange={handleChange}>
                  <option value="">-- Auswählen --</option>
                  <option value="Taekwondo">Taekwondo</option>
                  <option value="Karate">Karate</option>
                  <option value="Judo">Judo</option>
                  <option value="Kickboxen">Kickboxen</option>
                  <option value="MMA">MMA</option>
                  <option value="Andere">Andere</option>
                </select>
              </div>
              <div className="form-field">
                <label>Disziplin</label>
                <select name="disziplin" value={formData.disziplin} onChange={handleChange}>
                  <option value="">-- Auswählen --</option>
                  <option value="Vollkontakt">Vollkontakt</option>
                  <option value="Leichtkontakt">Leichtkontakt</option>
                  <option value="Semi-Kontakt">Semi-Kontakt</option>
                  <option value="Formen/Kata">Formen/Kata</option>
                  <option value="Waffen">Waffen</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div className="form-field">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="Geplant">Geplant</option>
                  <option value="Aktiv">Aktiv</option>
                  <option value="Abgeschlossen">Abgeschlossen</option>
                  <option value="Abgesagt">Abgesagt</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field wide">
                <label>Beschreibung</label>
                <textarea name="beschreibung" value={formData.beschreibung} onChange={handleChange} rows="3" placeholder="Kurze Beschreibung des Turniers..." />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Termin & Ort */}
        {activeTab === 'termin-ort' && (
          <div className="tab-panel">
            <div className="form-row">
              <div className="form-field">
                <label>Startdatum *</label>
                <input type="date" name="start_datum" value={formData.start_datum} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Enddatum *</label>
                <input type="date" name="end_datum" value={formData.end_datum} onChange={handleChange} required />
              </div>
              <div className="form-field">
                <label>Anmeldeschluss</label>
                <input type="date" name="anmeldeschluss" value={formData.anmeldeschluss} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field wide">
                <label>Veranstaltungsort / Halle</label>
                <input type="text" name="ort" value={formData.ort} onChange={handleChange} placeholder="z.B. Sporthalle Musterstadt" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field wide">
                <label>Adresse</label>
                <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="Straße und Hausnummer" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>PLZ</label>
                <input type="text" name="plz" value={formData.plz} onChange={handleChange} placeholder="12345" />
              </div>
              <div className="form-field">
                <label>Stadt</label>
                <input type="text" name="stadt" value={formData.stadt} onChange={handleChange} placeholder="Musterstadt" />
              </div>
              <div className="form-field">
                <label>Land</label>
                <input type="text" name="land" value={formData.land} onChange={handleChange} placeholder="Deutschland" />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Teilnehmer */}
        {activeTab === 'teilnehmer' && (
          <div className="tab-panel">
            <div className="form-row">
              <div className="form-field">
                <label>Max. Teilnehmer</label>
                <input type="number" name="max_teilnehmer" value={formData.max_teilnehmer} onChange={handleChange} min="1" placeholder="200" />
              </div>
              <div className="form-field">
                <label>Anmeldegebühr (EUR)</label>
                <input type="number" name="anmeldegebuehr" value={formData.anmeldegebuehr} onChange={handleChange} min="0" step="0.01" placeholder="35.00" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Altersklassen</label>
                <input type="text" name="altersklassen" value={formData.altersklassen} onChange={handleChange} placeholder="U12, U15, U18, Erwachsene" />
              </div>
              <div className="form-field">
                <label>Gewichtsklassen</label>
                <input type="text" name="gewichtsklassen" value={formData.gewichtsklassen} onChange={handleChange} placeholder="-50kg, -60kg, -70kg, +70kg" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field wide">
                <label>Turnierregeln</label>
                <textarea name="regeln" value={formData.regeln} onChange={handleChange} rows="4" placeholder="Turnierregeln und besondere Bestimmungen..." />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Kontakt & Info */}
        {activeTab === 'kontakt' && (
          <div className="tab-panel">
            <div className="form-row">
              <div className="form-field">
                <label>E-Mail</label>
                <input type="email" name="kontakt_email" value={formData.kontakt_email} onChange={handleChange} placeholder="turnier@example.com" />
              </div>
              <div className="form-field">
                <label>Telefon</label>
                <input type="tel" name="kontakt_telefon" value={formData.kontakt_telefon} onChange={handleChange} placeholder="+49 123 456789" />
              </div>
              <div className="form-field">
                <label>Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://www.turnier.de" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field wide">
                <label>Besondere Hinweise</label>
                <textarea name="hinweise" value={formData.hinweise} onChange={handleChange} rows="3" placeholder="Weitere Hinweise für Teilnehmer..." />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Kategorien */}
        {activeTab === 'kategorien' && (
          <div className="tab-panel">
            <div className="kategorien-header">
              <h3>Turnier-Kategorien</h3>
              <p>Wählen Sie die Kategorien, die bei diesem Turnier angeboten werden:</p>
            </div>
            <div className="kategorien-grid">
              {KATEGORIEN.map(kat => (
                <label
                  key={kat.id}
                  className={`kategorie-checkbox ${selectedKategorien.includes(kat.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedKategorien.includes(kat.id)}
                    onChange={() => toggleKategorie(kat.id)}
                  />
                  <span className="kategorie-icon">{kat.icon}</span>
                  <span className="kategorie-label">{kat.label}</span>
                </label>
              ))}
            </div>
            <div className="kategorien-info">
              <span className="selected-count">
                {selectedKategorien.length} von {KATEGORIEN.length} Kategorien ausgewählt
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TurnierBearbeitenPage;
