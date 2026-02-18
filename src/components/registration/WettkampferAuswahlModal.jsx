// src/components/registration/WettkampferAuswahlModal.jsx - VOLLSTÄNDIG KORRIGIERT
import React, { useState, useEffect } from 'react';
import config from '../../config';
import '../../styles/WettkampferAuswahlModal.css';

const WettkampferAuswahlModal = ({ turnier, onClose, onAnmeldungAbgeschlossen }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userRole, setUserRole] = useState('');
  const [userVereinId, setUserVereinId] = useState(null);
  
  // Schritt 1: Verein-Auswahl (nur für Admin)
  const [vereine, setVereine] = useState([]);
  const [selectedVerein, setSelectedVerein] = useState(null);
  
  // Schritt 2: Wettkämpfer-Auswahl
  const [wettkampfer, setWettkampfer] = useState([]);
  const [selectedWettkampfer, setSelectedWettkampfer] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeModal();
  }, []);

  // ✅ VOLLSTÄNDIG KORRIGIERTE getAuthToken FUNKTION
  const getAuthToken = () => {
    console.log('🔑 Token-Extraktion gestartet...');
    
    // Versuche beide localStorage-Keys
    const clubDataStr = localStorage.getItem('clubData');
    const adminDataStr = localStorage.getItem('adminData');
    
    console.log('📦 ClubData vorhanden:', !!clubDataStr);
    console.log('📦 AdminData vorhanden:', !!adminDataStr);
    
    if (clubDataStr) {
      try {
        const clubData = JSON.parse(clubDataStr);
        console.log('🏢 ClubData Structure:', Object.keys(clubData));
        console.log('🔑 ClubData Token verfügbar:', !!clubData.token);
        
        if (clubData.token && typeof clubData.token === 'string' && clubData.token.length > 10) {
          console.log('✅ Token aus ClubData extrahiert:', clubData.token.substring(0, 20) + '...');
          return clubData.token;
        }
      } catch (e) {
        console.error('❌ ClubData Parse Error:', e);
      }
    }
    
    if (adminDataStr) {
      try {
        const adminData = JSON.parse(adminDataStr);
        console.log('👑 AdminData Structure:', Object.keys(adminData));
        console.log('🔑 AdminData Token verfügbar:', !!adminData.token);
        
        if (adminData.token && typeof adminData.token === 'string' && adminData.token.length > 10) {
          console.log('✅ Token aus AdminData extrahiert:', adminData.token.substring(0, 20) + '...');
          return adminData.token;
        }
      } catch (e) {
        console.error('❌ AdminData Parse Error:', e);
      }
    }
    
    // ✅ FALLBACK: Versuche alte Token-Keys
    const fallbackToken = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (fallbackToken && typeof fallbackToken === 'string' && fallbackToken.length > 10) {
      console.log('🔄 Fallback Token gefunden:', fallbackToken.substring(0, 20) + '...');
      return fallbackToken;
    }
    
    console.error('❌ Kein gültiger Token gefunden in localStorage');
    console.error('🔍 localStorage Keys:', Object.keys(localStorage));
    
    return null;
  };

  // ✅ KORRIGIERTE getUserData FUNKTION
  const getUserData = () => {
    console.log('👤 User-Daten-Extraktion gestartet...');
    
    const clubDataStr = localStorage.getItem('clubData');
    const adminDataStr = localStorage.getItem('adminData');
    
    if (clubDataStr) {
      try {
        const clubData = JSON.parse(clubDataStr);
        console.log('🏢 ClubData User:', clubData.user);
        
        if (clubData.user) {
          return {
            role: clubData.user.role || 'verein',
            vereinId: clubData.user.vereins_id,
            name: clubData.user.name,
            email: clubData.user.email,
            token: clubData.token
          };
        }
      } catch (e) {
        console.error('❌ ClubData User Parse Error:', e);
      }
    }
    
    if (adminDataStr) {
      try {
        const adminData = JSON.parse(adminDataStr);
        console.log('👑 AdminData User:', adminData.user);
        
        if (adminData.user) {
          return {
            role: 'admin',
            vereinId: null,
            name: adminData.user.name || 'Administrator',
            email: adminData.user.email,
            token: adminData.token
          };
        }
      } catch (e) {
        console.error('❌ AdminData User Parse Error:', e);
      }
    }
    
    console.error('❌ Keine gültigen User-Daten gefunden');
    return null;
  };

  const initializeModal = async () => {
    try {
      // ✅ KORRIGIERTE User-Daten-Extraktion
      const userData = getUserData();
      
      if (!userData) {
        throw new Error('Nicht angemeldet. Bitte loggen Sie sich ein.');
      }
      
      const { role, vereinId, name, token } = userData;
      
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden. Bitte loggen Sie sich erneut ein.');
      }
      
      setUserRole(role);
      setUserVereinId(vereinId);
      
      console.log('🔑 User-Daten initialisiert:', { role, vereinId, name });
      
      if (role === 'admin') {
        // Admin: Zeige Verein-Auswahl
        setCurrentStep(1);
        await loadVereine();
      } else {
        // Verein: Lade direkt Wettkämpfer
        if (!vereinId) {
          throw new Error('Verein-ID nicht gefunden. Bitte loggen Sie sich erneut ein.');
        }
        
        setSelectedVerein({ 
          vereins_id: vereinId, 
          name: name || 'Mein Verein' 
        });
        setCurrentStep(2);
        await loadWettkampfer(vereinId);
      }
      
    } catch (err) {
      console.error('❌ Initialisierung fehlgeschlagen:', err);
      setError(err.message);
    }
  };

  // ✅ KORRIGIERTE loadVereine FUNKTION
  const loadVereine = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden');
      }
      
      console.log('🌐 Lade Vereine...');
      
      const response = await fetch(`${config.API_BASE_URL}/vereine`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Vereine Response Status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session abgelaufen. Bitte loggen Sie sich erneut ein.');
        }
        throw new Error(`Fehler beim Laden der Vereine: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Vereine-Daten:', data);
      
      let vereineData = [];
      
      if (data.success && Array.isArray(data.data)) {
        vereineData = data.data;
      } else if (Array.isArray(data)) {
        vereineData = data;
      }

      // Nur aktive Vereine anzeigen
      const aktiveVereine = vereineData.filter(v => v.rolle === 'verein' || !v.rolle);
      setVereine(aktiveVereine);
      
      console.log('✅ Vereine geladen:', aktiveVereine.length);
    } catch (err) {
      console.error('❌ Fehler beim Laden der Vereine:', err);
      setError('Fehler beim Laden der Vereine: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ VOLLSTÄNDIG KORRIGIERTE loadWettkampfer FUNKTION - CORS-PROBLEM BEHOBEN
  const loadWettkampfer = async (vereinId) => {
    console.log('🔄 loadWettkampfer gestartet für Verein:', vereinId);
    setLoading(true);
    setError(''); // Clear previous errors
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden. Bitte loggen Sie sich erneut ein.');
      }
      
      console.log('✅ Token verfügbar für Wettkämpfer-API');
      console.log('👤 User-Role:', userRole);
      console.log('🏢 User-Vereins-ID:', userVereinId);
      
      const url = `${config.API_BASE_URL}/wettkaempfer/verein/${vereinId}`;
      console.log('🌐 API-URL:', url);
      
      // ✅ KORRIGIERT: Minimale Headers - KEIN cache-control!
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('📤 Request Headers:', headers);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
        // ✅ ENTFERNT: cache, X-Requested-With, Cache-Control
      });
      
      console.log('📡 Wettkämpfer Response Status:', response.status);
      console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          
          if (response.status === 401) {
            // Auth-Fehler: Token abgelaufen oder ungültig
            errorMessage = 'Session abgelaufen. Bitte loggen Sie sich erneut ein.';
            
            // Cleanup ungültiger Tokens
            localStorage.removeItem('clubData');
            localStorage.removeItem('adminData');
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            
            // Redirect zur Login-Seite nach kurzer Verzögerung
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
            
          } else if (response.status === 403) {
            errorMessage = 'Zugriff verweigert. Sie haben keine Berechtigung für diese Wettkämpfer.';
          } else if (response.status === 400) {
            errorMessage = `Ungültige Anfrage: ${errorText}`;
          } else if (response.status === 500) {
            errorMessage = 'Server-Fehler. Bitte versuchen Sie es später erneut.';
          } else if (response.status === 0) {
            errorMessage = 'Netzwerk-Fehler. Prüfen Sie Ihre Internetverbindung.';
          }
        } catch (e) {
          console.error('❌ Error parsing response:', e);
          errorMessage = 'Unbekannter Server-Fehler aufgetreten.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('📊 Wettkämpfer-Daten empfangen:', data);
      
      let wettkampferData = [];
      
      if (data.success && Array.isArray(data.data)) {
        wettkampferData = data.data;
      } else if (Array.isArray(data)) {
        wettkampferData = data;
      } else {
        console.warn('⚠️ Unerwartetes Datenformat:', data);
        throw new Error('Unerwartetes Datenformat vom Server erhalten.');
      }

      setWettkampfer(wettkampferData);
      console.log(`✅ ${wettkampferData.length} Wettkämpfer erfolgreich geladen`);
      
      if (wettkampferData.length === 0) {
        console.log('ℹ️ Keine Wettkämpfer für Verein', vereinId, 'gefunden');
        setError(`Keine Wettkämpfer für diesen Verein gefunden.`);
      }
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Wettkämpfer:', err);
      
      // ✅ SPEZIELLE CORS-FEHLER-BEHANDLUNG
      if (err.message.includes('Failed to fetch') || err.name === 'TypeError') {
        console.error('🌐 CORS oder Netzwerk-Fehler erkannt');
        setError('Verbindungsfehler zum Server. Bitte prüfen Sie:\n• Ist das Backend gestartet?\n• CORS-Konfiguration korrekt?\n• Internetverbindung verfügbar?');
      } else {
        setError('Fehler beim Laden der Wettkämpfer: ' + err.message);
      }
      
      setWettkampfer([]);
      
      // ✅ ZUSÄTZLICHE ERROR-LOGGING
      console.error('📍 Error Details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        vereinId: vereinId,
        userRole: userRole,
        userVereinId: userVereinId,
        timestamp: new Date().toISOString(),
        url: `${config.API_BASE_URL}/wettkaempfer/verein/${vereinId}`
      });
      
    } finally {
      setLoading(false);
    }
  };

  const handleVereinSelect = async (verein) => {
    console.log('🏢 Verein ausgewählt:', verein);
    setSelectedVerein(verein);
    setCurrentStep(2);
    await loadWettkampfer(verein.vereins_id);
  };

  const handleWettkampferToggle = (wettkampferId) => {
    setSelectedWettkampfer(prev => {
      if (prev.includes(wettkampferId)) {
        return prev.filter(id => id !== wettkampferId);
      } else {
        return [...prev, wettkampferId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredIds = filteredWettkampfer.map(w => w.wettkaempfer_id);
    if (selectedWettkampfer.length === filteredIds.length) {
      setSelectedWettkampfer([]);
    } else {
      setSelectedWettkampfer(filteredIds);
    }
  };

  // ✅ KORRIGIERTE submitAnmeldung FUNKTION
  const submitAnmeldung = async () => {
    if (selectedWettkampfer.length === 0) {
      setError('Bitte wählen Sie mindestens einen Wettkämpfer aus.');
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden. Bitte loggen Sie sich erneut ein.');
      }
      
      const anmeldungData = {
        turnier_id: turnier.turnier_id,
        verein_id: selectedVerein.vereins_id,
        wettkampfer_ids: selectedWettkampfer,
        anmelde_datum: new Date().toISOString()
      };

      console.log('📝 Sende Anmeldung:', anmeldungData);

      const response = await fetch(`${config.API_BASE_URL}/anmeldungen`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(anmeldungData)
      });

      console.log('📡 Anmeldung Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Anmeldung Error:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Anmeldung erfolgreich:', result);

      // Erfolg-Callback aufrufen
      if (onAnmeldungAbgeschlossen) {
        onAnmeldungAbgeschlossen({
          turnier,
          verein: selectedVerein,
          wettkampfer: selectedWettkampfer,
          anmeldung_id: result.data?.anmeldung_id
        });
      }

      onClose();
    } catch (err) {
      console.error('❌ Anmeldung fehlgeschlagen:', err);
      setError('Anmeldung fehlgeschlagen: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWettkampfer = wettkampfer.filter(w =>
    w.vorname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.nachname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.gurtfarbe?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.kampfstil?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // ✅ DEBUGGING-FUNKTIONEN für Browser-Console
  React.useEffect(() => {
    // ✅ CORS-Test-Funktion
    window.testCORSHeaders = async () => {
      console.log('🧪 CORS-Header Test gestartet...');
      
      try {
        const token = getAuthToken();
        
        // ✅ EINFACHSTER MÖGLICHER REQUEST
        const response = await fetch(`${config.API_BASE_URL}/wettkaempfer/test`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
            // NUR Authorization-Header
          }
        });
        
        console.log('✅ CORS-Test erfolgreich, Status:', response.status);
        const data = await response.json();
        console.log('📊 Test-Data:', data);
        
        return true;
      } catch (error) {
        console.error('❌ CORS-Test fehlgeschlagen:', error);
        return false;
      }
    };

    // ✅ API-Test ohne Auth
    window.testAPIWithoutAuth = async (vereinId) => {
      console.log('🧪 Test API ohne Auth für Verein:', vereinId);
      
      try {
        const response = await fetch(`${config.API_BASE_URL}/wettkaempfer/verein/${vereinId}/noauth`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 NoAuth Test Status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ NoAuth Test erfolgreich:', data);
          return data;
        } else {
          console.log('❌ NoAuth Test fehlgeschlagen:', response.status);
          return null;
        }
      } catch (error) {
        console.error('❌ NoAuth Test Error:', error);
        return null;
      }
    };

    // Debug-Funktionen global verfügbar machen
    window.debugModalAuth = () => {
      console.log('🔍 Modal Auth-State Debugging:');
      console.log('📦 localStorage clubData:', localStorage.getItem('clubData'));
      console.log('📦 localStorage adminData:', localStorage.getItem('adminData'));
      console.log('🔑 Extrahierter Token:', getAuthToken());
      console.log('👤 User-Data:', getUserData());
      console.log('🎭 Current userRole:', userRole);
      console.log('🏢 Current userVereinId:', userVereinId);
    };

    window.testWettkampferAPI = async (vereinId) => {
      console.log('🧪 Testing Wettkämpfer API for Verein:', vereinId);
      try {
        const token = getAuthToken();
        const response = await fetch(`${config.API_BASE_URL}/wettkaempfer/verein/${vereinId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('📡 Status:', response.status);
        const data = await response.json();
        console.log('📊 Data:', data);
      } catch (error) {
        console.error('❌ Test Error:', error);
      }
    };

    console.log('🔧 Modal Debug-Funktionen verfügbar:');
    console.log('   debugModalAuth() - Zeigt Auth-Status');
    console.log('   testWettkampferAPI(vereinId) - Testet API direkt');
    console.log('   testCORSHeaders() - Testet CORS mit minimalen Headers');
    console.log('   testAPIWithoutAuth(9) - Testet API ohne Authorization');
  }, []);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content large">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>🏆 Turnier-Anmeldung</h2>
            <p>{turnier.name} - {turnier.datum_formatted || new Date(turnier.datum).toLocaleDateString('de-DE')}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">{userRole === 'admin' ? 'Verein wählen' : 'Angemeldet als'}</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Wettkämpfer auswählen</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && (
            <div className="error-message">
              <span>❌ {error}</span>
              <button onClick={() => setError('')}>✕</button>
            </div>
          )}

          {/* SCHRITT 1: Verein-Auswahl (nur Admin) */}
          {currentStep === 1 && userRole === 'admin' && (
            <div className="step-content">
              <h3>Verein für Anmeldung auswählen</h3>
              <p>Wählen Sie den Verein aus, für den Sie Wettkämpfer anmelden möchten:</p>
              
              {loading ? (
                <div className="loading-spinner-container">
                  <div className="loading-spinner"></div>
                  <p>Vereine werden geladen...</p>
                </div>
              ) : (
                <div className="vereine-grid">
                  {vereine.map(verein => (
                    <div 
                      key={verein.vereins_id}
                      className="verein-card selectable"
                      onClick={() => handleVereinSelect(verein)}
                    >
                      <div className="verein-info">
                        <h4>{verein.name}</h4>
                        <p>📍 {verein.ort}</p>
                        <p>👤 {verein.ansprechpartner}</p>
                      </div>
                      <div className="select-indicator">→</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHRITT 1: Verein-Anzeige (für normale Vereine) */}
          {currentStep === 2 && userRole !== 'admin' && selectedVerein && (
            <div className="current-verein-info">
              <h3>Angemeldet als:</h3>
              <div className="verein-card current">
                <div className="verein-info">
                  <h4>{selectedVerein.name}</h4>
                  <p>🔑 Vereins-Login aktiv</p>
                </div>
              </div>
            </div>
          )}

          {/* SCHRITT 2: Wettkämpfer-Auswahl */}
          {currentStep === 2 && selectedVerein && (
            <div className="step-content">
              <h3>Wettkämpfer von {selectedVerein.name} auswählen</h3>
              
              {/* Such- und Filter-Bereich */}
              <div className="wettkampfer-controls">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="🔍 Wettkämpfer durchsuchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="selection-info">
                  <span>{selectedWettkampfer.length} von {filteredWettkampfer.length} ausgewählt</span>
                  <button 
                    className="select-all-button"
                    onClick={handleSelectAll}
                  >
                    {selectedWettkampfer.length === filteredWettkampfer.length ? 'Alle abwählen' : 'Alle auswählen'}
                  </button>
                </div>
              </div>

              {/* Wettkämpfer-Liste */}
              {loading ? (
                <div className="loading-spinner-container">
                  <div className="loading-spinner"></div>
                  <p>Wettkämpfer werden geladen...</p>
                </div>
              ) : filteredWettkampfer.length === 0 ? (
                <div className="no-wettkampfer">
                  <p>🤷‍♂️ Keine Wettkämpfer gefunden</p>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}>Suche zurücksetzen</button>
                  )}
                </div>
              ) : (
                <div className="wettkampfer-grid">
                  {filteredWettkampfer.map(w => (
                    <div 
                      key={w.wettkaempfer_id}
                      className={`wettkampfer-card ${selectedWettkampfer.includes(w.wettkaempfer_id) ? 'selected' : ''}`}
                      onClick={() => handleWettkampferToggle(w.wettkaempfer_id)}
                    >
                      <div className="wettkampfer-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedWettkampfer.includes(w.wettkaempfer_id)}
                          onChange={() => handleWettkampferToggle(w.wettkaempfer_id)}
                        />
                      </div>
                      <div className="wettkampfer-info">
                        <h4>{w.vorname} {w.nachname}</h4>
                        <div className="wettkampfer-details">
                          <span className="detail-item">🎂 {calculateAge(w.geburtsdatum)} Jahre</span>
                          <span className="detail-item">⚖️ {w.gewicht} kg</span>
                          <span className="detail-item">🥋 {w.gurtfarbe}</span>
                          <span className="detail-item">🏆 {w.skill_level}</span>
                          <span className="detail-item">🥊 {w.kampfstil}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          
          {currentStep === 1 && userRole === 'admin' && (
            <button 
              className="btn-primary" 
              disabled={!selectedVerein}
            >
              Verein auswählen →
            </button>
          )}
          
          {currentStep === 2 && (
            <>
              {userRole === 'admin' && (
                <button 
                  className="btn-secondary" 
                  onClick={() => setCurrentStep(1)}
                >
                  ← Zurück
                </button>
              )}
              <button 
                className="btn-primary" 
                onClick={submitAnmeldung}
                disabled={selectedWettkampfer.length === 0 || submitting}
              >
                {submitting ? (
                  <>⏳ Anmeldung läuft...</>
                ) : (
                  <>✅ {selectedWettkampfer.length} Wettkämpfer anmelden</>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default WettkampferAuswahlModal;