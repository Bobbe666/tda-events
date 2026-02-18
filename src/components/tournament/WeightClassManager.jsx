// frontend/src/components/tournament/WeightClassManager.jsx
// GEWICHTSKLASSEN-MANAGEMENT MIT AUTOMATISCHER ZUORDNUNG

import React, { useState, useEffect } from 'react';

const WeightClassManager = ({ turnier, onClose }) => {
  const [weightClasses, setWeightClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availableParticipants, setAvailableParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState('karate');
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview, assignments, manual

  // Lade initiale Daten
  useEffect(() => {
    loadData();
  }, [turnier.turnier_id, selectedSport]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Lade Gewichtsklassen
      const weightResponse = await fetch(`/api/pairing/weight-classes?sport=${selectedSport}`);
      const weightData = await weightResponse.json();
      
      if (weightData.success) {
        setWeightClasses(weightData.data);
      }

      // Lade vorhandene Zuordnungen
      const assignResponse = await fetch(`/api/pairing/tournaments/${turnier.turnier_id}/weight-assignments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const assignData = await assignResponse.json();
      
      if (assignData.success) {
        setAssignments(assignData.data);
      }

      // Lade verfügbare Teilnehmer (Anmeldungen)
      const participantsResponse = await fetch(`/api/anmeldungen/turnier/${turnier.turnier_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const participantsData = await participantsResponse.json();
      
      if (participantsData.success) {
        setAvailableParticipants(participantsData.data);
      }

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatische Zuordnung starten
  const handleAutoAssign = async (forceReassign = false) => {
    setAutoAssignLoading(true);
    try {
      const response = await fetch(`/api/pairing/tournaments/${turnier.turnier_id}/auto-assign-weights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sport_art: selectedSport,
          force_reassign: forceReassign
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Automatische Zuordnung erfolgreich!\n${data.assignments.length} Teilnehmer zugeordnet.`);
        loadData(); // Reload data to show new assignments
      } else {
        alert(`❌ Fehler bei automatischer Zuordnung: ${data.message}`);
      }
    } catch (error) {
      console.error('Fehler bei automatischer Zuordnung:', error);
      alert('❌ Fehler bei der Verbindung zum Server.');
    } finally {
      setAutoAssignLoading(false);
    }
  };

  // Zuordnungs-Übersicht
  const OverviewView = () => {
    const groupedAssignments = {};
    assignments.forEach(assignment => {
      const key = assignment.division_code;
      if (!groupedAssignments[key]) {
        groupedAssignments[key] = {
          weightClass: assignment,
          participants: []
        };
      }
      groupedAssignments[key].participants.push(assignment);
    });

    return (
      <div style={overviewContainerStyle}>
        <div style={statsContainerStyle}>
          <div style={statCardStyle}>
            <h3>Teilnehmer Gesamt</h3>
            <div style={statNumberStyle}>{availableParticipants.length}</div>
          </div>
          <div style={statCardStyle}>
            <h3>Zugeordnet</h3>
            <div style={statNumberStyle}>{assignments.length}</div>
          </div>
          <div style={statCardStyle}>
            <h3>Nicht zugeordnet</h3>
            <div style={statNumberStyle}>{availableParticipants.length - assignments.length}</div>
          </div>
          <div style={statCardStyle}>
            <h3>Gewichtsklassen</h3>
            <div style={statNumberStyle}>{Object.keys(groupedAssignments).length}</div>
          </div>
        </div>

        <div style={actionButtonsStyle}>
          <button 
            onClick={() => handleAutoAssign(false)}
            disabled={autoAssignLoading}
            style={primaryButtonStyle}
          >
            {autoAssignLoading ? '⏳ Wird zugeordnet...' : '🤖 Automatische Zuordnung'}
          </button>
          <button 
            onClick={() => handleAutoAssign(true)}
            disabled={autoAssignLoading}
            style={warningButtonStyle}
          >
            🔄 Neu zuordnen (alle)
          </button>
          <button 
            onClick={() => setViewMode('assignments')}
            style={secondaryButtonStyle}
          >
            📋 Details anzeigen
          </button>
        </div>

        {Object.keys(groupedAssignments).length > 0 && (
          <div style={weightClassGridStyle}>
            {Object.entries(groupedAssignments).map(([divisionCode, group]) => (
              <WeightClassCard 
                key={divisionCode}
                divisionCode={divisionCode}
                weightClass={group.weightClass}
                participants={group.participants}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Detaillierte Zuordnungsansicht
  const AssignmentsView = () => (
    <div style={assignmentsContainerStyle}>
      <div style={assignmentsHeaderStyle}>
        <h3>Gewichtsklassen-Zuordnungen</h3>
        <button 
          onClick={() => setViewMode('overview')}
          style={backButtonStyle}
        >
          ← Zurück zur Übersicht
        </button>
      </div>

      {assignments.length === 0 ? (
        <div style={emptyStateStyle}>
          <p>🤷‍♂️ Noch keine Zuordnungen vorhanden.</p>
          <p>Verwende die automatische Zuordnung um zu beginnen.</p>
        </div>
      ) : (
        <div style={assignmentsTableStyle}>
          <div style={tableHeaderStyle}>
            <div>Teilnehmer</div>
            <div>Gewicht</div>
            <div>Gewichtsklasse</div>
            <div>Vertrauen</div>
            <div>Grund</div>
          </div>
          {assignments.map(assignment => (
            <div key={assignment.zuordnung_id} style={tableRowStyle}>
              <div style={participantCellStyle}>
                <strong>{assignment.vorname} {assignment.nachname}</strong>
                <small>{assignment.verein_name}</small>
              </div>
              <div style={weightCellStyle}>
                {assignment.gewicht}kg ({assignment.geschlecht})
              </div>
              <div style={weightClassCellStyle}>
                <strong>{assignment.division_code}</strong>
                <small>{assignment.klassen_name}</small>
              </div>
              <div style={confidenceCellStyle}>
                <div style={confidenceBarStyle(assignment.confidence_score)}>
                  {Math.round(assignment.confidence_score * 100)}%
                </div>
              </div>
              <div style={reasonCellStyle}>
                {assignment.zuordnung_grund}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Gewichtsklassen-Karte
  const WeightClassCard = ({ divisionCode, weightClass, participants }) => (
    <div style={weightClassCardStyle}>
      <div style={cardHeaderStyle}>
        <h4>{divisionCode}</h4>
        <span style={participantCountStyle}>{participants.length} Teilnehmer</span>
      </div>
      <div style={cardBodyStyle}>
        <div style={weightRangeStyle}>
          {weightClass.min_gewicht ? `${weightClass.min_gewicht}kg` : 'Keine Untergrenze'} 
          {' - '}
          {weightClass.max_gewicht ? `${weightClass.max_gewicht}kg` : 'Keine Obergrenze'}
        </div>
        <div style={cardDetailsStyle}>
          <span>{weightClass.klassen_name}</span>
        </div>
        <div style={participantsPreviewStyle}>
          {participants.slice(0, 3).map(p => (
            <div key={p.wettkaempfer_id} style={participantPreviewStyle}>
              {p.vorname} {p.nachname} ({p.gewicht}kg)
            </div>
          ))}
          {participants.length > 3 && (
            <div style={moreParticipantsStyle}>
              +{participants.length - 3} weitere
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={loadingContainerStyle}>
            <div style={loadingSpinnerStyle}></div>
            <p>Lade Gewichtsklassen-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2>Gewichtsklassen-Management</h2>
          <div style={modalHeaderControlsStyle}>
            <select 
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              style={sportSelectStyle}
            >
              <option value="karate">Karate</option>
              <option value="kickboxing">Kickboxing</option>
              <option value="taekwondo">Taekwondo</option>
              <option value="judo">Judo</option>
            </select>
            <button onClick={onClose} style={closeButtonStyle}>×</button>
          </div>
        </div>

        <div style={modalBodyStyle}>
          {viewMode === 'overview' && <OverviewView />}
          {viewMode === 'assignments' && <AssignmentsView />}
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
  height: '80%',
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

const modalHeaderControlsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '15px'
};

const sportSelectStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  fontSize: '14px'
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

const overviewContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const statsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginBottom: '20px'
};

const statCardStyle = {
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px solid #e9ecef'
};

const statNumberStyle = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#8B0000',
  marginTop: '10px'
};

const actionButtonsStyle = {
  display: 'flex',
  gap: '15px',
  marginBottom: '20px'
};

const primaryButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const secondaryButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer'
};

const warningButtonStyle = {
  padding: '12px 24px',
  backgroundColor: '#ffc107',
  color: '#212529',
  border: 'none',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const weightClassGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gap: '20px'
};

const weightClassCardStyle = {
  border: '1px solid #ddd',
  borderRadius: '8px',
  padding: '16px',
  backgroundColor: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const cardHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
};

const participantCountStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const cardBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const weightRangeStyle = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#6c757d'
};

const cardDetailsStyle = {
  fontSize: '13px',
  color: '#495057'
};

const participantsPreviewStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const participantPreviewStyle = {
  fontSize: '12px',
  color: '#6c757d',
  padding: '2px 0'
};

const moreParticipantsStyle = {
  fontSize: '12px',
  color: '#007bff',
  fontWeight: 'bold'
};

const assignmentsContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
};

const assignmentsHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
};

const backButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '60px 20px',
  color: '#6c757d'
};

const assignmentsTableStyle = {
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #ddd',
  borderRadius: '8px',
  overflow: 'hidden'
};

const tableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 2fr 1fr 2fr',
  backgroundColor: '#f8f9fa',
  padding: '12px',
  fontWeight: 'bold',
  borderBottom: '1px solid #ddd'
};

const tableRowStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 2fr 1fr 2fr',
  padding: '12px',
  borderBottom: '1px solid #eee',
  alignItems: 'center'
};

const participantCellStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const weightCellStyle = {
  textAlign: 'center',
  fontSize: '14px'
};

const weightClassCellStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const confidenceCellStyle = {
  textAlign: 'center'
};

const confidenceBarStyle = (confidence) => ({
  backgroundColor: confidence > 0.8 ? '#28a745' : confidence > 0.6 ? '#ffc107' : '#dc3545',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold'
});

const reasonCellStyle = {
  fontSize: '12px',
  color: '#6c757d'
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

export default WeightClassManager;