import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();
  const [turniere, setTurniere] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTurniere() {
      try {
        const response = await fetch('/api/turniere/public');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setTurniere(Array.isArray(result.data) ? result.data : []);
          } else if (Array.isArray(result)) {
            setTurniere(result);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Abrufen der Turniere:", err);
        setLoading(false);
      }
    }
    fetchTurniere();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section - Logo links, Inhalt rechts */}
      <div className="landing-hero">
        <div className="landing-content">
          {/* Left Side - Logo */}
          <div className="landing-left">
            <img src="/logo.png" alt="TDA Tournament Software" className="landing-logo" />
          </div>

          {/* Right Side - Content */}
          <div className="landing-right">
            <div className="landing-header">
              <p className="landing-suite">TOURNAMENT SOFTWARE SUITE</p>
              <h1 className="landing-title">
                WILLKOMMEN IM<br />
                <span className="landing-title-highlight">TDA TOURNAMENT CENTER</span>
              </h1>
            </div>

            {/* Buttons - nur 2 nebeneinander + 1 darunter */}
            <div className="landing-cards">
              <div className="landing-card" onClick={() => navigate('/login')}>
                <div className="card-icon">
                  <span>🔐</span>
                </div>
                <div className="card-content">
                  <h3>LOGIN</h3>
                  <p>Einloggen ins System</p>
                </div>
                <div className="card-arrow">
                  <span className="arrow-text">ÖFFNEN</span>
                  <span className="arrow-icon">→</span>
                </div>
              </div>

              <div className="landing-card" onClick={() => navigate('/register')}>
                <div className="card-icon">
                  <span>📋</span>
                </div>
                <div className="card-content">
                  <h3>REGISTRIEREN</h3>
                  <p>Neuen Verein registrieren</p>
                </div>
                <div className="card-arrow">
                  <span className="arrow-text">ÖFFNEN</span>
                  <span className="arrow-icon">→</span>
                </div>
              </div>

              <div className="landing-card" onClick={() => navigate('/registration')}>
                <div className="card-icon">
                  <span>🥋</span>
                </div>
                <div className="card-content">
                  <h3>TURNIERANMELDUNG</h3>
                  <p>Für Turnier anmelden</p>
                </div>
                <div className="card-arrow">
                  <span className="arrow-text">ÖFFNEN</span>
                  <span className="arrow-icon">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Turniere Section */}
      <div className="landing-tournaments">
        <h2 className="tournaments-title">Aktuelle Turniere</h2>
        {loading ? (
          <p className="loading-text">Lade Turniere...</p>
        ) : turniere.length > 0 ? (
          <div className="tournaments-grid">
            {turniere.map(turnier => (
              <div key={turnier.turnier_id} className="tournament-card">
                <h3 className="tournament-name">{turnier.name}</h3>
                <p className="tournament-date">
                  📅 {new Date(turnier.datum).toLocaleDateString('de-DE')}
                </p>
                <p className="tournament-location">📍 {turnier.ort}</p>
                <p className="tournament-discipline">🥋 {turnier.disziplin}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-tournaments">Aktuell keine Turniere verfügbar</p>
        )}
      </div>
    </div>
  );
}

export default LandingPage;
