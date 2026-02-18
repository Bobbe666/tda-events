// frontend/src/components/tournament/SeedingManager.jsx
// SEED-SYSTEM FÜR TEILNEHMER-POSITIONIERUNG

import React, { useState, useEffect } from 'react';

const SeedingManager = ({ turnier, onClose }) => {
  const [weightClasses, setWeightClasses] = useState([]);
  const [selectedWeightClass, setSelectedWeightClass] = useState(null);
  const [seeds, setSeeds] = useState([]);
  const [eloRatings, setEloRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('combined');

  // Seeding-Methoden
  const SEEDING_METHODS = {
    elo: { name: 'ELO-Rating', description: 'Basierend auf aktuellen ELO-Ratings' },
    tournament_wins: { name: 'Turniersiege', description: 'Basierend auf gewonnenen Turnieren' },
    combined: { name: 'Kombiniert', description: 'ELO + Turniersiege (empfohlen)' },
    manual: { name: 'Manuell', description: 'Manuelle Setzung durch Admin' },
    random: { name: 'Zufällig', description: 'Zufällige Setzung für Testzwecke' }
  };

  // Lade initiale Daten
  useEffect(() => {
    loadWeightClasses();
    loadELORatings();
  }, [turnier.turnier_id]);

  useEffect(() => {
    if (selectedWeightClass) {
      loadSeeds();
    }
  }, [selectedWeightClass]);

  const loadWeightClasses = async () => {
    try {
      const response = await fetch(`/api/pairing/tournaments/${turnier.turnier_id}/weight-assignments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Gruppiere nach Gewichtsklassen
        const grouped = {};
        data.data.forEach(assignment => {
          const key = assignment.gewichtsklasse_id;
          if (!grouped[key]) {
            grouped[key] = {
              ...assignment,
              participants: []
            };
          }
          grouped[key].participants.push(assignment);
        });
        
        setWeightClasses(Object.values(grouped));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gewichtsklassen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadELORatings = async () => {
    try {
      const response = await fetch('/api/pairing/elo-ratings?limit=100');
      const data = await response.json();
      
      if (data.success) {
        setEloRatings(data.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der ELO-Ratings:', error);
    }
  };

  const loadSeeds = async () => {
    if (!selectedWeightClass) return;
    
    try {
      const response = await fetch(
        `/api/pairing/tournaments/${turnier.turnier_id}/weight-classes/${selectedWeightClass.gewichtsklasse_id}/seeds`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setSeeds(data.data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Seeds:', error);
    }
  };

  // Automatisches Seeding starten
  const handleAutoSeed = async () => {
    if (!selectedWeightClass) return;
    
    setSeedingLoading(true);
    try {
      const response = await fetch(
        `/api/pairing/tournaments/${turnier.turnier_id}/weight-classes/${selectedWeightClass.gewichtsklasse_id}/auto-seed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            seeding_method: selectedMethod
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Automatisches Seeding erfolgreich!\n${data.seeds.length} Teilnehmer geseedet.`);
        loadSeeds();
      } else {
        alert(`❌ Fehler beim Seeding: ${data.message}`);
      }
    } catch (error) {
      console.error('Fehler beim automatischen Seeding:', error);
      alert('❌ Fehler bei der Verbindung zum Server.');
    } finally {
      setSeedingLoading(false);
    }
  };

  // Gewichtsklassen-Übersicht
  const WeightClassSelection = () => (
    <div style={selectionContainerStyle}>
      <h3>Gewichtsklasse für Seeding auswählen</h3>
      <div style={weightClassListStyle}>
        {weightClasses.map(weightClass => (
          <div
            key={weightClass.gewichtsklasse_id}
            onClick={() => setSelectedWeightClass(weightClass)}
            style={{
              ...weightClassItemStyle,
              ...(selectedWeightClass?.gewichtsklasse_id === weightClass.gewichtsklasse_id ? selectedWeightClassStyle : {})
            }}
          >
            <div style={weightClassHeaderStyle}>
              <h4>{weightClass.division_code}</h4>
              <span style={participantBadgeStyle}>
                {weightClass.participants.length} Teilnehmer
              </span>
            </div>
            <div style={weightClassDetailsStyle}>
              <div>{weightClass.klassen_name}</div>
              <div style={weightClassRangeStyle}>
                {weightClass.min_gewicht || 'Min'} - {weightClass.max_gewicht || 'Max'} kg
              </div>
            </div>
            <div style={participantsPreviewStyle}>
              {weightClass.participants.slice(0, 3).map(p => (
                <span key={p.wettkaempfer_id} style={participantTagStyle}>
                  {p.vorname} {p.nachname}
                </span>
              ))}
              {weightClass.participants.length > 3 && (
                <span style={moreParticipantsTagStyle}>
                  +{weightClass.participants.length - 3}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Seeding-Management für ausgewählte Gewichtsklasse
  const SeedingManagement = () => (
    <div style={seedingContainerStyle}>
      <div style={seedingHeaderStyle}>
        <div>
          <h3>Seeding: {selectedWeightClass.division_code}</h3>
          <p>{selectedWeightClass.klassen_name}</p>
        </div>
        <button 
          onClick={() => setSelectedWeightClass(null)}
          style={backButtonStyle}
        >
          ← Zurück
        </button>
      </div>

      <div style={seedingControlsStyle}>
        <div style={methodSelectorStyle}>
          <label>Seeding-Methode:</label>
          <select 
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            style={methodSelectStyle}
          >
            {Object.entries(SEEDING_METHODS).map(([key, method]) => (
              <option key={key} value={key}>{method.name}</option>
            ))}
          </select>
          <small style={methodDescriptionStyle}>
            {SEEDING_METHODS[selectedMethod].description}
          </small>
        </div>
        
        <button 
          onClick={handleAutoSeed}
          disabled={seedingLoading}
          style={seedButtonStyle}
        >
          {seedingLoading ? '⏳ Wird geseedet...' : '🎯 Automatisches Seeding'}
        </button>
      </div>

      {seeds.length > 0 ? (
        <SeedsTable />
      ) : (
        <div style={noSeedsStyle}>
          <p>🌱 Noch keine Seeds vorhanden.</p>
          <p>Verwende das automatische Seeding um die Teilnehmer zu setzen.</p>
        </div>
      )}
    </div>
  );

  // Seeds-Tabelle
  const SeedsTable = () => (
    <div style={seedsTableContainerStyle}>
      <div style={seedsTableHeaderStyle}>
        <div>Seed</div>
        <div>Teilnehmer</div>
        <div>ELO-Rating</div>
        <div>Bilanz</div>
        <div>Score</div>
        <div>Grund</div>
      </div>
      {seeds.map(seed => {
        const eloData = eloRatings.find(r => r.wettkaempfer_id === seed.wettkaempfer_id);
        return (
          <div key={seed.seed_id} style={seedsTableRowStyle}>
            <div style={seedPositionStyle}>
              <div style={seedNumberStyle}>#{seed.seed_position}</div>
              {seed.seed_position <= 4 && (
                <div style={topSeedBadgeStyle}>TOP</div>
              )}
            </div>
            <div style={participantInfoStyle}>
              <strong>{seed.vorname} {seed.nachname}</strong>
              <small>{seed.verein_name}</small>
            </div>
            <div style={eloInfoStyle}>
              {eloData ? (
                <>
                  <div style={eloRatingStyle}>{Math.round(eloData.current_rating)}</div>
                  <small>{eloData.is_provisional ? 'Provisional' : 'Etabliert'}</small>
                </>
              ) : (
                <span style={noDataStyle}>Kein Rating</span>
              )}
            </div>
            <div style={recordInfoStyle}>
              {eloData ? (
                <>
                  <div>{eloData.wins}W - {eloData.losses}L</div>
                  <small>{eloData.games_played} Kämpfe</small>
                </>
              ) : (
                <span style={noDataStyle}>Keine Daten</span>
              )}
            </div>
            <div style={seedScoreStyle}>
              {Math.round(seed.seed_score)}
            </div>
            <div style={seedReasonStyle}>
              {seed.seed_reason}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={loadingContainerStyle}>
            <div style={loadingSpinnerStyle}></div>
            <p>Lade Seeding-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2>Seeding-Management</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={modalBodyStyle}>
          {!selectedWeightClass ? (
            <WeightClassSelection />
          ) : (
            <SeedingManagement />
          )}
        </div>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '1200px',
  height: '85%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #eee',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px 12px 0 0'
};

const closeButtonStyle = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  width: '32px',
  height: '32px',
  fontSize: '18px',
  cursor: 'pointer'
};

const modalBodyStyle = {
  flex: 1,
  padding: '20px',
  overflow: 'auto'
};

const selectionContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const weightClassListStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gap: '16px'
};

const weightClassItemStyle = {
  border: '2px solid #e9ecef',
  borderRadius: '8px',
  padding: '20px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: 'white'
};

const selectedWeightClassStyle = {
  borderColor: '#8B0000',
  backgroundColor: '#fff5f5'
};

const weightClassHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const participantBadgeStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const weightClassDetailsStyle = {
  marginBottom: '12px'
};

const weightClassRangeStyle = {
  fontSize: '14px',
  color: '#6c757d',
  fontWeight: 'bold'
};

const participantsPreviewStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px'
};

const participantTagStyle = {
  backgroundColor: '#f8f9fa',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
  color: '#495057'
};

const moreParticipantsTagStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const seedingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const seedingHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const backButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const seedingControlsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const methodSelectorStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const methodSelectStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '14px'
};

const methodDescriptionStyle = {
  color: '#6c757d',
  fontSize: '13px'
};

const seedButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const noSeedsStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#6c757d'
};

const seedsTableContainerStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden'
};

const seedsTableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '80px 2fr 1fr 1fr 100px 2fr',
  backgroundColor: '#f8f9fa',
  padding: '12px',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd'
};

const seedsTableRowStyle = {
  display: 'grid',
  gridTemplateColumns: '80px 2fr 1fr 1fr 100px 2fr',
  padding: '12px',
  borderBottom: '1px solid #eee',
  alignItems: 'center'
};

const seedPositionStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px'
};

const seedNumberStyle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#8B0000'
};

const topSeedBadgeStyle = {
  backgroundColor: '#ffd700',
  color: '#000',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 'bold'
};

const participantInfoStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const eloInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const eloRatingStyle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#007bff'
};

const recordInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  fontSize: '14px'
};

const seedScoreStyle = {
  textAlign: 'center',
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#28a745'
};

const seedReasonStyle = {
  fontSize: '12px',
  color: '#6c757d'
};

const noDataStyle = {
  color: '#6c757d',
  fontStyle: 'italic',
  fontSize: '13px'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px'
};

const loadingSpinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #8B0000',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '20px'
};

export default SeedingManager;