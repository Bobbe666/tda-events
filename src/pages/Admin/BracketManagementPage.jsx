// frontend/src/pages/Admin/BracketManagementPage.jsx
// BRACKET MANAGEMENT PAGE - Admin-Interface für K.O.-System

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BracketVisualization from '../../components/bracket/BracketVisualization';
import {
  getBracketsByTurnier,
  getBracketById,
  createBracket,
  addTeilnehmerToBracket,
  generateBracketKaempfe,
  updateKampfResult
} from '../../api/bracketApi';
// Verwende direkte API-Calls vorerst
// import { getTurnierById } from '../../api/turnierApi';
// import { getAnmeldungenByTurnier } from '../../api/anmeldungenApi';
import './BracketManagementPage.css';

const BracketManagementPage = () => {
  const { turnierId } = useParams();
  const navigate = useNavigate();
  
  const [turnier, setTurnier] = useState(null);
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [bracketDetails, setBracketDetails] = useState(null);
  const [anmeldungen, setAnmeldungen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddParticipantsModal, setShowAddParticipantsModal] = useState(false);
  const [error, setError] = useState(null);

  // Daten laden beim Mount
  useEffect(() => {
    loadData();
  }, [turnierId]);

  // Bracket-Details laden wenn Bracket ausgewählt wird
  useEffect(() => {
    if (selectedBracket) {
      loadBracketDetails(selectedBracket.bracket_id);
    }
  }, [selectedBracket]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Turnier-Details laden (vereinfacht für Demo)
      setTurnier({ 
        turnier_id: turnierId, 
        name: `Turnier ${turnierId}`, 
        datum: new Date().toISOString() 
      });

      // Brackets für Turnier laden
      const bracketsResponse = await getBracketsByTurnier(turnierId);
      if (bracketsResponse.success) {
        setBrackets(bracketsResponse.data);
        if (bracketsResponse.data.length > 0) {
          setSelectedBracket(bracketsResponse.data[0]);
        }
      }

      // Anmeldungen für Teilnehmer-Pool laden (vereinfacht)
      setAnmeldungen([]);

    } catch (error) {
      console.error('❌ Fehler beim Laden der Daten:', error);
      setError('Fehler beim Laden der Turnier-Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadBracketDetails = async (bracketId) => {
    try {
      const response = await getBracketById(bracketId);
      if (response.success) {
        setBracketDetails(response.data);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der Bracket-Details:', error);
    }
  };

  const handleCreateBracket = async (bracketData) => {
    try {
      const response = await createBracket(bracketData);
      if (response.success) {
        await loadData(); // Daten neu laden
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Brackets:', error);
      alert('Fehler beim Erstellen des Brackets: ' + error.message);
    }
  };

  const handleGenerateKaempfe = async (bracketId) => {
    try {
      const response = await generateBracketKaempfe(bracketId);
      if (response.success) {
        await loadBracketDetails(bracketId); // Bracket-Details neu laden
        alert('Kämpfe erfolgreich generiert!');
      }
    } catch (error) {
      console.error('❌ Fehler beim Generieren der Kämpfe:', error);
      alert('Fehler beim Generieren der Kämpfe: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bracket-management-loading">
        <div className="loading-spinner"></div>
        <h3>Lade Bracket-Management...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bracket-management-error">
        <h3>❌ {error}</h3>
        <button onClick={() => navigate('/admin/turniere')} className="btn btn-secondary">
          Zurück zu Turnieren
        </button>
      </div>
    );
  }

  return (
    <div className="bracket-management-page">
      <div className="bracket-management-header">
        <div className="header-content">
          <button onClick={() => navigate('/admin/turniere')} className="btn-back">
            ← Zurück
          </button>
          <div className="header-info">
            <h1>🥊 Bracket-Management</h1>
            {turnier && (
              <p>{turnier.name} • {new Date(turnier.datum).toLocaleDateString('de-DE')}</p>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            + Neues Bracket
          </button>
        </div>
      </div>

      <div className="bracket-management-content">
        {/* Bracket-Liste (Sidebar) */}
        <div className="bracket-sidebar">
          <h3>Brackets ({brackets.length})</h3>
          
          {brackets.length === 0 ? (
            <div className="no-brackets">
              <p>Noch keine Brackets erstellt</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm"
              >
                Erstes Bracket erstellen
              </button>
            </div>
          ) : (
            <div className="bracket-list">
              {brackets.map(bracket => (
                <BracketListItem
                  key={bracket.bracket_id}
                  bracket={bracket}
                  isSelected={selectedBracket?.bracket_id === bracket.bracket_id}
                  onSelect={() => setSelectedBracket(bracket)}
                  onGenerateKaempfe={handleGenerateKaempfe}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bracket-Visualisierung (Hauptbereich) */}
        <div className="bracket-main">
          {selectedBracket && bracketDetails ? (
            <BracketVisualization bracketData={bracketDetails} />
          ) : (
            <div className="no-bracket-selected">
              <h3>Kein Bracket ausgewählt</h3>
              <p>Wählen Sie links ein Bracket aus oder erstellen Sie ein neues.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Bracket Modal */}
      {showCreateModal && (
        <CreateBracketModal
          turnierId={turnierId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBracket}
          existingBrackets={brackets}
        />
      )}

      {/* Add Participants Modal */}
      {showAddParticipantsModal && (
        <AddParticipantsModal
          bracket={selectedBracket}
          availableParticipants={anmeldungen}
          onClose={() => setShowAddParticipantsModal(false)}
          onSubmit={async (data) => {
            await addTeilnehmerToBracket(selectedBracket.bracket_id, data);
            await loadBracketDetails(selectedBracket.bracket_id);
            setShowAddParticipantsModal(false);
          }}
        />
      )}
    </div>
  );
};

// Bracket-Liste Item Komponente
const BracketListItem = ({ bracket, isSelected, onSelect, onGenerateKaempfe }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#f39c12';
      case 'ready': return '#2ecc71';
      case 'running': return '#e74c3c';
      case 'finished': return '#34495e';
      default: return '#95a5a6';
    }
  };

  return (
    <div 
      className={`bracket-list-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="bracket-item-header">
        <h4>{bracket.bracket_name}</h4>
        <span 
          className="bracket-status-dot"
          style={{ backgroundColor: getStatusColor(bracket.status) }}
        ></span>
      </div>
      
      <div className="bracket-item-info">
        <span className="division-code">{bracket.division_code}</span>
        <span className="participant-count">
          {bracket.aktuelle_teilnehmer || 0}/{bracket.max_participants}
        </span>
      </div>

      <div className="bracket-item-stats">
        <span className="kaempfe-count">
          {bracket.abgeschlossene_kaempfe || 0}/{bracket.total_kaempfe || 0} Kämpfe
        </span>
      </div>

      {bracket.status === 'open' && bracket.aktuelle_teilnehmer >= 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerateKaempfe(bracket.bracket_id);
          }}
          className="btn btn-sm btn-success generate-btn"
        >
          Kämpfe generieren
        </button>
      )}
    </div>
  );
};

// Create Bracket Modal
const CreateBracketModal = ({ turnierId, onClose, onSubmit, existingBrackets }) => {
  const [formData, setFormData] = useState({
    bracket_name: '',
    division_code: '',
    bracket_type: 'knockout',
    max_participants: 8
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      turnier_id: parseInt(turnierId)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Neues Bracket erstellen</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Bracket-Name:</label>
            <input
              type="text"
              value={formData.bracket_name}
              onChange={(e) => setFormData({...formData, bracket_name: e.target.value})}
              placeholder="z.B. Herren -75kg Fortgeschritten"
              required
            />
          </div>

          <div className="form-group">
            <label>Division-Code:</label>
            <input
              type="text"
              value={formData.division_code}
              onChange={(e) => setFormData({...formData, division_code: e.target.value})}
              placeholder="z.B. M-75-ADV"
              required
            />
          </div>

          <div className="form-group">
            <label>Turnier-Typ:</label>
            <select
              value={formData.bracket_type}
              onChange={(e) => setFormData({...formData, bracket_type: e.target.value})}
            >
              <option value="knockout">K.O.-System</option>
              <option value="double_elimination">Doppel-Elimination</option>
              <option value="round_robin">Jeder gegen Jeden</option>
            </select>
          </div>

          <div className="form-group">
            <label>Max. Teilnehmer:</label>
            <select
              value={formData.max_participants}
              onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
            >
              <option value={4}>4 Teilnehmer</option>
              <option value={8}>8 Teilnehmer</option>
              <option value={16}>16 Teilnehmer</option>
              <option value={32}>32 Teilnehmer</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn btn-primary">
              Bracket erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Participants Modal (Platzhalter - kann später erweitert werden)
const AddParticipantsModal = ({ bracket, availableParticipants, onClose, onSubmit }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Teilnehmer hinzufügen</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <p>Feature wird in Phase 2 implementiert...</p>
        <button onClick={onClose} className="btn btn-secondary">
          Schließen
        </button>
      </div>
    </div>
  );
};

export default BracketManagementPage;