import React, { useState, useEffect } from 'react';
import ScheduleManager from '../schedule/ScheduleManager';
import RefereeManager from '../referee/RefereeManager';
import WeightClassManager from '../tournament/WeightClassManager';
import SeedingManager from '../tournament/SeedingManager';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import SportsManager from '../sports/SportsManager';
import MultiSportTournamentManager from '../sports/MultiSportTournamentManager';
import LiveStreamingManager from '../streaming/LiveStreamingManager';

function TurnierListe() {
  const [turniere, setTurniere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTurnier, setSelectedTurnier] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    async function fetchTurniere() {
      try {
        console.log("📡 API-Aufruf für Turniere...");

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Bitte einloggen, um Turniere zu sehen.");
        }

        const response = await fetch("/api/turniere", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Fehler beim Abrufen der Turniere");
        }

        const result = await response.json();
        console.log("✅ Turniere API Response:", result);
        
        // Handle new API response format
        if (result.success && result.data) {
          setTurniere(Array.isArray(result.data) ? result.data : []);
        } else if (Array.isArray(result)) {
          // Fallback for old format
          setTurniere(result);
        } else {
          console.warn('Unerwartetes API-Format:', result);
          setTurniere([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("❌ Fehler beim Abrufen der Turniere:", err);
        setError(err);
        setLoading(false);
      }
    }
    fetchTurniere();
  }, []);

  if (loading) return <p>⏳ Lade Turniere...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ Fehler: {error.message}</p>;

  if (selectedTurnier) {
    return (
      <div style={containerStyle}>
        <div style={headerContainerStyle}>
          <button style={backButtonStyle} onClick={() => setSelectedTurnier(null)}>
            ← Zurück zu Turnieren
          </button>
          <h2 style={headerStyle}>{selectedTurnier.name} - Verwaltung</h2>
        </div>
        
        <div style={tabContainerStyle}>
          <button 
            style={activeTab === 'overview' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </button>
          <button 
            style={activeTab === 'weightclasses' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('weightclasses')}
          >
            Gewichtsklassen
          </button>
          <button 
            style={activeTab === 'seeding' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('seeding')}
          >
            Setzungen
          </button>
          <button 
            style={activeTab === 'schedule' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('schedule')}
          >
            Zeitplanung
          </button>
          <button 
            style={activeTab === 'referees' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('referees')}
          >
            Kampfrichter
          </button>
          <button 
            style={activeTab === 'analytics' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('analytics')}
          >
            Statistiken
          </button>
          <button 
            style={activeTab === 'sports' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('sports')}
          >
            Multi-Sport
          </button>
          <button 
            style={activeTab === 'multi-tournaments' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('multi-tournaments')}
          >
            Multi-Turniere
          </button>
          <button 
            style={activeTab === 'streaming' ? activeTabStyle : tabStyle}
            onClick={() => setActiveTab('streaming')}
          >
            Live-Streaming
          </button>
        </div>
        
        <div style={tabContentStyle}>
          {activeTab === 'overview' && (
            <div>
              <h3>Turnier-Übersicht</h3>
              <p><strong>Datum:</strong> {new Date(selectedTurnier.datum).toLocaleDateString()}</p>
              <p><strong>Ort:</strong> {selectedTurnier.ort}</p>
              <p><strong>Disziplin:</strong> {selectedTurnier.disziplin}</p>
              <p><strong>Status:</strong> {selectedTurnier.status || 'Geplant'}</p>
            </div>
          )}
          
          {activeTab === 'weightclasses' && (
            <WeightClassManager turnierId={selectedTurnier.turnier_id} />
          )}
          
          {activeTab === 'seeding' && (
            <SeedingManager turnierId={selectedTurnier.turnier_id} />
          )}
          
          {activeTab === 'schedule' && (
            <ScheduleManager turnierId={selectedTurnier.turnier_id} />
          )}
          
          {activeTab === 'referees' && (
            <RefereeManager turnierId={selectedTurnier.turnier_id} />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsDashboard turnierId={selectedTurnier.turnier_id} />
          )}
          
          {activeTab === 'sports' && (
            <SportsManager />
          )}
          
          {activeTab === 'multi-tournaments' && (
            <MultiSportTournamentManager />
          )}
          
          {activeTab === 'streaming' && (
            <LiveStreamingManager turnierId={selectedTurnier.turnier_id} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>Turniere</h2>
      <div style={gridStyle}>
        {turniere.length > 0 ? (
          turniere.map(turnier => (
            <div key={turnier.turnier_id} style={cardStyle} onClick={() => setSelectedTurnier(turnier)}>
              <h3 style={cardTitleStyle}>{turnier.name}</h3>
              <p style={cardTextStyle}>
                {new Date(turnier.datum).toLocaleDateString()}
              </p>
              <p style={cardTextStyle}>{turnier.ort}</p>
              <p style={cardTextStyle}>Disziplin: {turnier.disziplin}</p>
              <button style={buttonStyle}>
                Verwalten
              </button>
            </div>
          ))
        ) : (
          <p>⚠️ Keine Turniere gefunden.</p>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  padding: "20px",
  maxWidth: "1200px",
  margin: "0 auto"
};

const headerStyle = {
  textAlign: "center",
  marginBottom: "20px",
  color: "#000000",
  fontSize: "2em",
  fontWeight: "bold"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px"
};

const cardStyle = {
  backgroundColor: "#fff",
  padding: "15px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
  transition: "transform 0.2s ease-in-out",
  cursor: "pointer"
};

const cardTitleStyle = {
  textAlign: "center",
  margin: "0 0 10px 0",
  fontSize: "1.5em",
  color: "#8B0000"
};

const cardTextStyle = {
  margin: "5px 0",
  color: "#666"
};

const buttonStyle = {
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer",
  marginTop: "10px"
};

const headerContainerStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "20px",
  gap: "15px"
};

const backButtonStyle = {
  backgroundColor: "#6c757d",
  color: "white",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  cursor: "pointer"
};

const tabContainerStyle = {
  display: "flex",
  borderBottom: "2px solid #e9ecef",
  marginBottom: "20px",
  gap: "5px"
};

const tabStyle = {
  backgroundColor: "transparent",
  border: "none",
  padding: "12px 20px",
  cursor: "pointer",
  borderBottom: "2px solid transparent",
  color: "#666",
  fontSize: "14px",
  fontWeight: "500"
};

const activeTabStyle = {
  ...tabStyle,
  color: "#007bff",
  borderBottom: "2px solid #007bff",
  fontWeight: "600"
};

const tabContentStyle = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  minHeight: "400px"
};

export default TurnierListe;
