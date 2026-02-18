// src/pages/Registration/AnmeldungBestaetigung.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/AnmeldungBestaetigung.css';

const AnmeldungBestaetigung = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Daten aus dem vorherigen Schritt
  const { turnier, selectedWettkampfer, vereinId } = location.state || {};

  useEffect(() => {
    // Redirect wenn keine Daten vorhanden
    if (!turnier || !selectedWettkampfer || !vereinId) {
      navigate('/dashboard/registration');
    }
  }, [turnier, selectedWettkampfer, vereinId, navigate]);

  const handleAnmeldung = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const wettkampferIds = selectedWettkampfer.map(w => w.id);
      
      const response = await fetch('/api/anmeldungen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          turnier_id: turnier.id,
          wettkampfer_ids: wettkampferIds,
          anmeldender_verein_id: vereinId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler bei der Anmeldung');
      }

      const result = await response.json();
      console.log('Anmeldung erfolgreich:', result);
      
      setSuccess(true);
      
      // Nach 3 Sekunden zur Übersichtsseite
      setTimeout(() => {
        navigate('/dashboard/registration');
      }, 3000);
      
    } catch (err) {
      console.error('Fehler bei der Anmeldung:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthdate) => {
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!turnier || !selectedWettkampfer) {
    return (
      <div className="anmeldung-container">
        <div className="error-state">
          <h2>Fehler</h2>
          <p>Keine Anmeldedaten gefunden. Bitte starten Sie den Anmeldeprozess neu.</p>
          <button 
            onClick={() => navigate('/dashboard/registration')}
            className="back-btn"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="anmeldung-container">
        <div className="success-state">
          <div className="success-icon">✅</div>
          <h2>Anmeldung erfolgreich!</h2>
          <p>
            Ihre {selectedWettkampfer.length} Wettkämpfer wurden erfolgreich für das Turnier "{turnier.turnier_name}" angemeldet.
          </p>
          <p>Sie werden automatisch zur Übersicht weitergeleitet...</p>
          <button 
            onClick={() => navigate('/dashboard/registration')}
            className="continue-btn"
          >
            Sofort zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="anmeldung-container">
      <div className="anmeldung-content">
        <div className="page-header">
          <h1>Anmeldung bestätigen</h1>
          <p>Überprüfen Sie Ihre Anmeldedaten vor der finalen Bestätigung</p>
        </div>

        {error && (
          <div className="error-message">
            <strong>Fehler:</strong> {error}
          </div>
        )}

        <div className="anmeldung-summary">
          {/* Turnier Information */}
          <div className="turnier-summary">
            <h2>🏆 Turnier Information</h2>
            <div className="turnier-details">
              <div className="detail-row">
                <span className="label">Turnier:</span>
                <span className="value">{turnier.turnier_name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Datum:</span>
                <span className="value">{formatDate(turnier.datum)}</span>
              </div>
              <div className="detail-row">
                <span className="label">Ort:</span>
                <span className="value">{turnier.ort}</span>
              </div>
              <div className="detail-row">
                <span className="label">Anmeldeschluss:</span>
                <span className="value">{formatDate(turnier.anmeldeschluss)}</span>
              </div>
              {turnier.startgebuehr && (
                <div className="detail-row">
                  <span className="label">Startgebühr:</span>
                  <span className="value">{turnier.startgebuehr}€ pro Wettkämpfer</span>
                </div>
              )}
            </div>
          </div>

          {/* Wettkämpfer Liste */}
          <div className="wettkampfer-summary">
            <h2>👤 Angemeldete Wettkämpfer ({selectedWettkampfer.length})</h2>
            <div className="wettkampfer-list">
              {selectedWettkampfer.map((wettkampfer, index) => (
                <div key={wettkampfer.id} className="wettkampfer-summary-card">
                  <div className="wettkampfer-number">
                    {index + 1}
                  </div>
                  <div className="wettkampfer-main-info">
                    <h3>{wettkampfer.vorname} {wettkampfer.nachname}</h3>
                    <div className="wettkampfer-meta">
                      <span className="age">
                        {calculateAge(wettkampfer.geburtsdatum)} Jahre
                      </span>
                      <span className="gender">
                        {wettkampfer.geschlecht === 'M' ? 'Männlich' : 'Weiblich'}
                      </span>
                      <span className="weight">
                        {wettkampfer.gewicht} kg
                      </span>
                      <span className="graduation">
                        {wettkampfer.graduierung}
                      </span>
                    </div>
                  </div>
                  <div className="wettkampfer-status">
                    <span className="status-badge ready">Bereit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kosten Übersicht */}
          {turnier.startgebuehr && (
            <div className="kosten-summary">
              <h2>💰 Kosten Übersicht</h2>
              <div className="kosten-details">
                <div className="kosten-row">
                  <span>Startgebühr pro Wettkämpfer:</span>
                  <span>{turnier.startgebuehr}€</span>
                </div>
                <div className="kosten-row">
                  <span>Anzahl Wettkämpfer:</span>
                  <span>{selectedWettkampfer.length}</span>
                </div>
                <div className="kosten-row total">
                  <span><strong>Gesamtkosten:</strong></span>
                  <span><strong>{(parseFloat(turnier.startgebuehr) * selectedWettkampfer.length).toFixed(2)}€</strong></span>
                </div>
              </div>
              <div className="payment-note">
                <p>💡 Die Bezahlung erfolgt vor Ort am Turniertag</p>
              </div>
            </div>
          )}

          {/* Hinweise */}
          <div className="hinweise-section">
            <h2>ℹ️ Wichtige Hinweise</h2>
            <ul className="hinweise-list">
              <li>Nach der Anmeldung erhalten Sie eine Bestätigung per E-Mail</li>
              <li>Änderungen sind bis 48 Stunden vor dem Turnier möglich</li>
              <li>Bringen Sie gültige Ausweise für alle Wettkämpfer mit</li>
              <li>Die Gewichtskontrolle findet am Turniertag statt</li>
              <li>Bei Fragen wenden Sie sich an info@tda-intl.com</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="anmeldung-actions">
          <button 
            onClick={() => navigate(-1)}
            className="back-btn"
            disabled={loading}
          >
            ← Zurück
          </button>
          
          <button 
            onClick={handleAnmeldung}
            className="confirm-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="button-spinner"></div>
                Anmeldung wird verarbeitet...
              </>
            ) : (
              <>
                ✅ Verbindlich anmelden ({selectedWettkampfer.length} Wettkämpfer)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnmeldungBestaetigung;