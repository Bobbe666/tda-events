import React, { useState, useEffect } from 'react';
import TDACard from '../common/TDACard';
import './BracketDashboard.css';

function BracketDashboard({ selectedTurnier }) {
  const [brackets, setBrackets] = useState([]);
  const [selectedBracket, setSelectedBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [bracketDetails, setBracketDetails] = useState(null);
  const [availableFighters, setAvailableFighters] = useState([]);

  useEffect(() => {
    fetchBrackets();
    fetchAvailableFighters();
  }, []);

  const fetchBrackets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brackets', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Brackets');
      }

      const data = await response.json();
      setBrackets(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const fetchAvailableFighters = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/wettkaempfer', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const fighters = await response.json();
        setAvailableFighters(Array.isArray(fighters) ? fighters : []);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Wettkämpfer:', err);
    }
  };

  const fetchBracketDetails = async (bracketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brackets/${bracketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const details = await response.json();
        setBracketDetails(details);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Bracket-Details:', err);
    }
  };

  const handleCreateBracket = async (bracketData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/brackets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bracketData)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Brackets');
      }

      await fetchBrackets();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleAddParticipants = async (bracketId, participants) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brackets/${bracketId}/teilnehmer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          wettkaempfer_ids: participants.map(p => p.wettkaempfer_id),
          seed_positions: participants.map((_, index) => index + 1)
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Hinzufügen der Teilnehmer');
      }

      await fetchBracketDetails(bracketId);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleGenerateBracket = async (bracketId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brackets/${bracketId}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Generieren des Brackets');
      }

      await fetchBracketDetails(bracketId);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  const handleUpdateFightResult = async (fightId, result) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/brackets/kampf/${fightId}/result`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });

      if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Kampfergebnisses');
      }

      await fetchBracketDetails(selectedBracket.bracket_id);
    } catch (err) {
      console.error('Fehler:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="bracket-loading">
        <div className="loading-spinner">⏳</div>
        <p>Brackets werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bracket-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchBrackets}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="bracket-dashboard">
      {!selectedBracket ? (
        <BracketOverview
          brackets={brackets}
          onSelectBracket={(bracket) => {
            setSelectedBracket(bracket);
            fetchBracketDetails(bracket.bracket_id);
          }}
          onCreateBracket={() => setShowCreateModal(true)}
        />
      ) : (
        <BracketDetailsView
          bracket={selectedBracket}
          details={bracketDetails}
          availableFighters={availableFighters}
          onBack={() => {
            setSelectedBracket(null);
            setBracketDetails(null);
          }}
          onAddParticipants={handleAddParticipants}
          onGenerateBracket={handleGenerateBracket}
          onUpdateFightResult={handleUpdateFightResult}
        />
      )}

      {showCreateModal && (
        <CreateBracketModal
          selectedTurnier={selectedTurnier}
          onSave={handleCreateBracket}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Bracket Card Component
function BracketCard({ bracket, onSelect }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#6b7280';
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'active': return 'Aktiv';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return 'Unbekannt';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return '📝';
      case 'active': return '⚡';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '📋';
    }
  };

  // Meta-Informationen für die Card
  const meta = [
    {
      icon: getStatusIcon(bracket.status),
      text: getStatusText(bracket.status)
    },
    {
      icon: '🏆',
      text: bracket.bracket_type
    },
    {
      icon: '🎯',
      text: bracket.division_code
    },
    {
      icon: '👥',
      text: `${bracket.current_participants || 0}/${bracket.max_participants}`
    }
  ];

  // Aktionen für die Card
  const actions = [
    {
      icon: '👁️',
      onClick: onSelect,
      title: 'Anzeigen',
      variant: 'primary'
    }
  ];

  return (
    <TDACard
      title={bracket.bracket_name}
      subtitle={`${bracket.bracket_type} - ${bracket.division_code}`}
      meta={meta}
      actions={actions}
      size="medium"
      variant={bracket.status === 'active' ? 'success' : bracket.status === 'completed' ? 'default' : 'warning'}
    />
  );
}

// Bracket Overview Component
function BracketOverview({ brackets, onSelectBracket, onCreateBracket }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'created': return '#fbbf24';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'created': return 'Erstellt';
      case 'in_progress': return 'Läuft';
      case 'completed': return 'Abgeschlossen';
      default: return 'Unbekannt';
    }
  };

  return (
    <div className="bracket-overview">
      <div className="overview-header">
        <h2>🏆 Bracket-Verwaltung</h2>
        <button className="create-bracket-btn" onClick={onCreateBracket}>
          ➕ Neues Bracket
        </button>
      </div>

      <div className="tda-card-grid tda-card-grid-3">
        <TDACard
          title={brackets.length}
          subtitle="Brackets gesamt"
          meta={[{ icon: '🏆', text: 'Gesamt' }]}
          size="small"
        />
        
        <TDACard
          title={brackets.filter(b => b.status === 'in_progress' || b.status === 'active').length}
          subtitle="Aktive Brackets"
          meta={[{ icon: '🔄', text: 'Laufend' }]}
          size="small"
          variant="success"
        />
        
        <TDACard
          title={brackets.filter(b => b.status === 'completed').length}
          subtitle="Abgeschlossen"
          meta={[{ icon: '✅', text: 'Fertig' }]}
          size="small"
        />
      </div>

      <div className="tda-card-grid tda-card-grid-3">
        {brackets.map(bracket => (
          <BracketCard
            key={bracket.bracket_id}
            bracket={bracket}
            onSelect={() => onSelectBracket(bracket)}
          />
        ))}
      </div>

      {brackets.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>Noch keine Brackets vorhanden</h3>
          <p>Erstellen Sie Ihr erstes Turnier-Bracket</p>
          <button className="create-first-bracket" onClick={onCreateBracket}>
            ➕ Erstes Bracket erstellen
          </button>
        </div>
      )}
    </div>
  );
}

// Bracket Details View Component
function BracketDetailsView({ 
  bracket, 
  details, 
  availableFighters, 
  onBack, 
  onAddParticipants, 
  onGenerateBracket, 
  onUpdateFightResult 
}) {
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [showFightResult, setShowFightResult] = useState(null);

  if (!details) {
    return (
      <div className="loading-details">
        <div className="loading-spinner">⏳</div>
        <p>Bracket-Details werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="bracket-details">
      <div className="details-header">
        <button className="back-btn" onClick={onBack}>
          ← Zurück
        </button>
        <div className="bracket-title">
          <h2>{bracket.bracket_name}</h2>
          <span className="bracket-type">{bracket.bracket_type}</span>
        </div>
        <div className="header-actions">
          {details.participants && details.participants.length === 0 && (
            <button 
              className="add-participants-btn"
              onClick={() => setShowAddParticipants(true)}
            >
              👥 Teilnehmer hinzufügen
            </button>
          )}
          
          {details.participants && details.participants.length > 0 && !details.fights && (
            <button 
              className="generate-btn"
              onClick={() => onGenerateBracket(bracket.bracket_id)}
            >
              🎯 Bracket generieren
            </button>
          )}
        </div>
      </div>

      {details.participants && details.participants.length > 0 && (
        <div className="participants-section">
          <h3>👥 Teilnehmer ({details.participants.length})</h3>
          <div className="participants-list">
            {details.participants.map((participant, index) => (
              <div key={participant.wettkaempfer_id} className="participant-item">
                <span className="seed-number">#{index + 1}</span>
                <span className="participant-name">
                  {participant.vorname} {participant.nachname}
                </span>
                <span className="participant-info">
                  {participant.skill_level} • {participant.gewicht}kg
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {details.fights && details.fights.length > 0 && (
        <BracketVisualization 
          fights={details.fights}
          participants={details.participants}
          onFightClick={(fight) => setShowFightResult(fight)}
        />
      )}

      {showAddParticipants && (
        <AddParticipantsModal
          availableFighters={availableFighters}
          maxParticipants={bracket.max_participants}
          onSave={(participants) => {
            onAddParticipants(bracket.bracket_id, participants);
            setShowAddParticipants(false);
          }}
          onClose={() => setShowAddParticipants(false)}
        />
      )}

      {showFightResult && (
        <FightResultModal
          fight={showFightResult}
          participants={details.participants}
          onSave={(result) => {
            onUpdateFightResult(showFightResult.kampf_id, result);
            setShowFightResult(null);
          }}
          onClose={() => setShowFightResult(null)}
        />
      )}
    </div>
  );
}

// Bracket Visualization Component
function BracketVisualization({ fights, participants, onFightClick }) {
  const getFighterName = (fighterId) => {
    const fighter = participants.find(p => p.wettkaempfer_id === fighterId);
    return fighter ? `${fighter.vorname} ${fighter.nachname}` : 'TBD';
  };

  const getWinnerName = (fight) => {
    if (!fight.gewinner_id) return null;
    return getFighterName(fight.gewinner_id);
  };

  const groupFightsByRound = (fights) => {
    const rounds = {};
    fights.forEach(fight => {
      const round = fight.runde || 1;
      if (!rounds[round]) rounds[round] = [];
      rounds[round].push(fight);
    });
    return rounds;
  };

  const rounds = groupFightsByRound(fights);
  const roundNumbers = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="bracket-visualization">
      <h3>🏆 Turnierbaum</h3>
      
      <div className="bracket-tree">
        {roundNumbers.map(roundNum => (
          <div key={roundNum} className="bracket-round">
            <h4>Runde {roundNum}</h4>
            <div className="fights-column">
              {rounds[roundNum].map(fight => (
                <div 
                  key={fight.kampf_id} 
                  className={`fight-box ${fight.gewinner_id ? 'completed' : 'pending'}`}
                  onClick={() => onFightClick(fight)}
                >
                  <div className="fight-header">
                    <span className="fight-number">Kampf {fight.kampf_nummer}</span>
                    {fight.gewinner_id && <span className="completed-badge">✅</span>}
                  </div>
                  
                  <div className="fight-participants">
                    <div className={`fighter ${fight.gewinner_id === fight.kaempfer1_id ? 'winner' : ''}`}>
                      {getFighterName(fight.kaempfer1_id)}
                      {fight.punkte_kaempfer1 !== null && (
                        <span className="score">{fight.punkte_kaempfer1}</span>
                      )}
                    </div>
                    
                    <div className="vs">VS</div>
                    
                    <div className={`fighter ${fight.gewinner_id === fight.kaempfer2_id ? 'winner' : ''}`}>
                      {getFighterName(fight.kaempfer2_id)}
                      {fight.punkte_kaempfer2 !== null && (
                        <span className="score">{fight.punkte_kaempfer2}</span>
                      )}
                    </div>
                  </div>
                  
                  {getWinnerName(fight) && (
                    <div className="winner-info">
                      🏆 {getWinnerName(fight)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Create Bracket Modal Component
function CreateBracketModal({ selectedTurnier, onSave, onClose }) {
  const [formData, setFormData] = useState({
    turnier_id: selectedTurnier?.id || '',
    division_code: '',
    bracket_name: '',
    bracket_type: 'knockout',
    max_participants: 8
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Neues Bracket erstellen</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="create-bracket-form">
          <div className="form-group">
            <label>Bracket-Name</label>
            <input
              type="text"
              value={formData.bracket_name}
              onChange={(e) => setFormData({...formData, bracket_name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Division</label>
            <input
              type="text"
              placeholder="z.B. M-75-ADV"
              value={formData.division_code}
              onChange={(e) => setFormData({...formData, division_code: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Bracket-Typ</label>
            <select
              value={formData.bracket_type}
              onChange={(e) => setFormData({...formData, bracket_type: e.target.value})}
            >
              <option value="knockout">K.O.-System</option>
              <option value="round_robin">Jeder gegen Jeden</option>
            </select>
          </div>

          <div className="form-group">
            <label>Max. Teilnehmer</label>
            <select
              value={formData.max_participants}
              onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Abbrechen</button>
            <button type="submit" className="save-btn">Erstellen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Participants Modal Component
function AddParticipantsModal({ availableFighters, maxParticipants, onSave, onClose }) {
  const [selectedFighters, setSelectedFighters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFighters = availableFighters.filter(fighter =>
    `${fighter.vorname} ${fighter.nachname}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFighter = (fighter) => {
    const isSelected = selectedFighters.find(f => f.wettkaempfer_id === fighter.wettkaempfer_id);
    
    if (isSelected) {
      setSelectedFighters(selectedFighters.filter(f => f.wettkaempfer_id !== fighter.wettkaempfer_id));
    } else if (selectedFighters.length < maxParticipants) {
      setSelectedFighters([...selectedFighters, fighter]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3>Teilnehmer hinzufügen ({selectedFighters.length}/{maxParticipants})</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="participants-modal-body">
          <div className="search-section">
            <input
              type="text"
              placeholder="🔍 Wettkämpfer suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="fighters-grid">
            {filteredFighters.map(fighter => (
              <div 
                key={fighter.wettkaempfer_id}
                className={`fighter-item ${selectedFighters.find(f => f.wettkaempfer_id === fighter.wettkaempfer_id) ? 'selected' : ''}`}
                onClick={() => toggleFighter(fighter)}
              >
                <div className="fighter-name">
                  {fighter.vorname} {fighter.nachname}
                </div>
                <div className="fighter-info">
                  {fighter.skill_level} • {fighter.gewicht}kg
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose}>Abbrechen</button>
          <button 
            type="button" 
            className="save-btn"
            disabled={selectedFighters.length === 0}
            onClick={() => onSave(selectedFighters)}
          >
            {selectedFighters.length} Teilnehmer hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

// Fight Result Modal Component
function FightResultModal({ fight, participants, onSave, onClose }) {
  const [result, setResult] = useState({
    gewinner_id: fight.gewinner_id || '',
    punkte_kaempfer1: fight.punkte_kaempfer1 || '',
    punkte_kaempfer2: fight.punkte_kaempfer2 || '',
    kampfzeit_minuten: fight.kampfzeit_minuten || '',
    kampfzeit_sekunden: fight.kampfzeit_sekunden || '',
    notizen: fight.notizen || ''
  });

  const getFighterName = (fighterId) => {
    const fighter = participants.find(p => p.wettkaempfer_id === fighterId);
    return fighter ? `${fighter.vorname} ${fighter.nachname}` : 'Unbekannt';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(result);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Kampfergebnis - Kampf {fight.kampf_nummer}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="fight-result-form">
          <div className="fighters-info">
            <div className="fighter-option">
              <input
                type="radio"
                id="winner1"
                name="gewinner_id"
                value={fight.kaempfer1_id}
                checked={result.gewinner_id == fight.kaempfer1_id}
                onChange={(e) => setResult({...result, gewinner_id: parseInt(e.target.value)})}
              />
              <label htmlFor="winner1">
                🏆 {getFighterName(fight.kaempfer1_id)}
              </label>
            </div>
            
            <div className="fighter-option">
              <input
                type="radio"
                id="winner2"
                name="gewinner_id"
                value={fight.kaempfer2_id}
                checked={result.gewinner_id == fight.kaempfer2_id}
                onChange={(e) => setResult({...result, gewinner_id: parseInt(e.target.value)})}
              />
              <label htmlFor="winner2">
                🏆 {getFighterName(fight.kaempfer2_id)}
              </label>
            </div>
          </div>

          <div className="score-section">
            <div className="form-group">
              <label>Punkte {getFighterName(fight.kaempfer1_id)}</label>
              <input
                type="number"
                min="0"
                value={result.punkte_kaempfer1}
                onChange={(e) => setResult({...result, punkte_kaempfer1: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="form-group">
              <label>Punkte {getFighterName(fight.kaempfer2_id)}</label>
              <input
                type="number"
                min="0"
                value={result.punkte_kaempfer2}
                onChange={(e) => setResult({...result, punkte_kaempfer2: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="time-section">
            <div className="form-group">
              <label>Kampfzeit (Minuten)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={result.kampfzeit_minuten}
                onChange={(e) => setResult({...result, kampfzeit_minuten: parseInt(e.target.value) || 0})}
              />
            </div>
            
            <div className="form-group">
              <label>Kampfzeit (Sekunden)</label>
              <input
                type="number"
                min="0"
                max="59"
                value={result.kampfzeit_sekunden}
                onChange={(e) => setResult({...result, kampfzeit_sekunden: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notizen</label>
            <textarea
              value={result.notizen}
              onChange={(e) => setResult({...result, notizen: e.target.value})}
              placeholder="Zusätzliche Informationen zum Kampf..."
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose}>Abbrechen</button>
            <button 
              type="submit" 
              className="save-btn"
              disabled={!result.gewinner_id}
            >
              Ergebnis speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BracketDashboard;