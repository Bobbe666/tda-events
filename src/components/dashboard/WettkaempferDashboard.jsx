import React, { useState, useEffect } from 'react';
import TDACard from '../common/TDACard';
import './WettkaempferDashboard.css';

function WettkaempferDashboard() {
  const [wettkaempfer, setWettkaempfer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWettkaempfer, setEditingWettkaempfer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGeschlecht, setFilterGeschlecht] = useState('');
  const [filterSkillLevel, setFilterSkillLevel] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    male: 0,
    female: 0,
    anfaenger: 0,
    fortgeschritten: 0,
    experte: 0
  });

  useEffect(() => {
    fetchWettkaempfer();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [wettkaempfer]);

  const fetchWettkaempfer = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wettkaempfer', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Wettkämpfer');
      }

      const result = await response.json();
      console.log('🎯 Wettkämpfer API Response:', result);
      
      // Handle new API response format
      if (result.success && result.data) {
        setWettkaempfer(Array.isArray(result.data) ? result.data : []);
      } else if (Array.isArray(result)) {
        // Fallback for old format
        setWettkaempfer(result);
      } else {
        console.warn('Unerwartetes API-Format:', result);
        setWettkaempfer([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!wettkaempfer.length) return;

    const newStats = {
      total: wettkaempfer.length,
      male: wettkaempfer.filter(k => k.geschlecht === 'männlich' || k.geschlecht === 'male').length,
      female: wettkaempfer.filter(k => k.geschlecht === 'weiblich' || k.geschlecht === 'female').length,
      anfaenger: wettkaempfer.filter(k => k.skill_level === 'anfaenger').length,
      fortgeschritten: wettkaempfer.filter(k => k.skill_level === 'fortgeschritten').length,
      experte: wettkaempfer.filter(k => k.skill_level === 'experte').length
    };

    setStats(newStats);
  };

  const handleAddWettkaempfer = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wettkaempfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen des Wettkämpfers');
      }

      await fetchWettkaempfer();
      setShowAddModal(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleEditWettkaempfer = async (id, formData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wettkaempfer/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Bearbeiten des Wettkämpfers');
      }

      await fetchWettkaempfer();
      setEditingWettkaempfer(null);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleDeleteWettkaempfer = async (id) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Wettkämpfer löschen möchten?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/wettkaempfer/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen des Wettkämpfers');
      }

      await fetchWettkaempfer();
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const getFilteredWettkaempfer = () => {
    return wettkaempfer.filter(k => {
      const matchesSearch = `${k.vorname} ${k.nachname}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Geschlecht-Filter mit verschiedenen Formaten
      const matchesGeschlecht = !filterGeschlecht || 
        (filterGeschlecht === 'male' && (k.geschlecht === 'männlich' || k.geschlecht === 'male')) ||
        (filterGeschlecht === 'female' && (k.geschlecht === 'weiblich' || k.geschlecht === 'female')) ||
        (filterGeschlecht === 'divers' && k.geschlecht === 'divers');
      
      const matchesSkillLevel = !filterSkillLevel || k.skill_level === filterSkillLevel;
      
      return matchesSearch && matchesGeschlecht && matchesSkillLevel;
    });
  };

  if (loading) {
    return (
      <div className="wettkaempfer-loading">
        <div className="loading-spinner">⏳</div>
        <p>Wettkämpfer werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wettkaempfer-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchWettkaempfer}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="wettkaempfer-dashboard">
      {/* Add Button */}
      <div className="action-header">
        <button 
          className="add-btn"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Neuer Wettkämpfer
        </button>
      </div>

      {/* Statistics */}
      <div className="stats-overview">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Wettkämpfer gesamt</p>
          </div>
        </div>

        <div className="stat-card male">
          <div className="stat-icon">👨</div>
          <div className="stat-content">
            <h3>{stats.male}</h3>
            <p>Männlich</p>
          </div>
        </div>

        <div className="stat-card female">
          <div className="stat-icon">👩</div>
          <div className="stat-content">
            <h3>{stats.female}</h3>
            <p>Weiblich</p>
          </div>
        </div>

        <div className="stat-card skill">
          <div className="stat-icon">🥋</div>
          <div className="stat-content">
            <h3>{stats.experte}</h3>
            <p>Experten</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Name suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterGeschlecht}
          onChange={(e) => setFilterGeschlecht(e.target.value)}
        >
          <option value="">Alle Geschlechter</option>
          <option value="male">Männlich</option>
          <option value="female">Weiblich</option>
          <option value="divers">Divers</option>
        </select>

        <select
          value={filterSkillLevel}
          onChange={(e) => setFilterSkillLevel(e.target.value)}
        >
          <option value="">Alle Skill Level</option>
          <option value="anfaenger">Anfänger</option>
          <option value="fortgeschritten">Fortgeschritten</option>
          <option value="experte">Experte</option>
        </select>
      </div>

      {/* Wettkämpfer Liste */}
      <div className="tda-card-grid tda-card-grid-6">
        {getFilteredWettkaempfer().map(k => (
          <WettkaempferCard
            key={k.wettkaempfer_id}
            wettkaempfer={k}
            onEdit={setEditingWettkaempfer}
            onDelete={handleDeleteWettkaempfer}
          />
        ))}
      </div>

      {/* Modals */}
      {showAddModal && (
        <WettkaempferModal
          title="Neuer Wettkämpfer"
          onSave={handleAddWettkaempfer}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingWettkaempfer && (
        <WettkaempferModal
          title="Wettkämpfer bearbeiten"
          wettkaempfer={editingWettkaempfer}
          onSave={(formData) => handleEditWettkaempfer(editingWettkaempfer.wettkaempfer_id, formData)}
          onClose={() => setEditingWettkaempfer(null)}
        />
      )}
    </div>
  );
}

// Wettkämpfer Card Component
function WettkaempferCard({ wettkaempfer, onEdit, onDelete }) {
  const getSkillLevelIcon = (level) => {
    switch (level) {
      case 'anfaenger': return '🟢';
      case 'fortgeschritten': return '🟡';
      case 'experte': return '🔴';
      default: return '⚪';
    }
  };

  const getGeschlechtIcon = (geschlecht) => {
    switch (geschlecht) {
      case 'male':
      case 'männlich': return '👨';
      case 'female':
      case 'weiblich': return '👩';
      case 'divers': return '⚧';
      default: return '👤';
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Meta-Informationen für die Card
  const meta = [
    {
      icon: getGeschlechtIcon(wettkaempfer.geschlecht),
      text: `${calculateAge(wettkaempfer.geburtsdatum)} Jahre`
    },
    {
      icon: getSkillLevelIcon(wettkaempfer.skill_level),
      text: wettkaempfer.skill_level
    }
  ];

  // Aktionen für die Card
  const actions = [
    {
      icon: '✏️',
      onClick: () => onEdit(wettkaempfer),
      title: 'Bearbeiten',
      variant: 'edit'
    },
    {
      icon: '🗑️',
      onClick: () => onDelete(wettkaempfer.wettkaempfer_id),
      title: 'Löschen',
      variant: 'delete'
    }
  ];

  return (
    <TDACard
      title={`${wettkaempfer.vorname} ${wettkaempfer.nachname}`}
      subtitle={wettkaempfer.vereins_name || 'Unbekannt'}
      meta={meta}
      actions={actions}
      size="medium"
    />
  );
}

// Wettkämpfer Modal Component
function WettkaempferModal({ title, wettkaempfer = null, onSave, onClose }) {
  const [formData, setFormData] = useState({
    vorname: wettkaempfer?.vorname || '',
    nachname: wettkaempfer?.nachname || '',
    geburtsdatum: wettkaempfer?.geburtsdatum?.split('T')[0] || '',
    geschlecht: wettkaempfer?.geschlecht || 'male',
    skill_level: wettkaempfer?.skill_level || 'anfaenger',
    gewicht: wettkaempfer?.gewicht || '',
    email: wettkaempfer?.email || '',
    vereins_id: wettkaempfer?.vereins_id || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.vorname.trim() || !formData.nachname.trim() || !formData.geburtsdatum) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    onSave(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="wettkaempfer-form">
          <div className="form-row">
            <div className="form-group">
              <label>Vorname *</label>
              <input
                type="text"
                name="vorname"
                value={formData.vorname}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Nachname *</label>
              <input
                type="text"
                name="nachname"
                value={formData.nachname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Geburtsdatum *</label>
              <input
                type="date"
                name="geburtsdatum"
                value={formData.geburtsdatum}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Geschlecht</label>
              <select
                name="geschlecht"
                value={formData.geschlecht}
                onChange={handleChange}
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="divers">Divers</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Skill Level</label>
              <select
                name="skill_level"
                value={formData.skill_level}
                onChange={handleChange}
              >
                <option value="anfaenger">Anfänger</option>
                <option value="fortgeschritten">Fortgeschritten</option>
                <option value="experte">Experte</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Gewicht (kg)</label>
              <input
                type="number"
                name="gewicht"
                value={formData.gewicht}
                onChange={handleChange}
                min="20"
                max="200"
              />
            </div>
          </div>

          <div className="form-group">
            <label>E-Mail</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>
              Abbrechen
            </button>
            <button type="submit" className="save-btn">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default WettkaempferDashboard;