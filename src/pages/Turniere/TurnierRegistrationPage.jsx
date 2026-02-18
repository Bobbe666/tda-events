// src/pages/Turniere/TurnierRegistrationPage.jsx - FUNKTIONAL ERWEITERT, DESIGN UNVERÄNDERT
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WettkampferAuswahlModal from '../../components/registration/WettkampferAuswahlModal';
import config from '../../config';
import '../../styles/TurnierRegistrationPage.css'; // Original CSS beibehalten

const TurnierRegistrationPage = () => {
  const navigate = useNavigate();
  const [turniere, setTurniere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTurnier, setSelectedTurnier] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [vereinId, setVereinId] = useState(null);
  const [vereinsname, setVereinsname] = useState('');
  const [userRole, setUserRole] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // ✅ KORRIGIERTE USER-AUTHENTIFIZIERUNG
  useEffect(() => {
    const initializeUser = () => {
      console.log('🔄 Initialisiere User-Daten...');
      
      // Prüfe beide möglichen localStorage-Keys
      let userData = null;
      let token = null;
      
      // Versuche clubData (Verein-Login) - KORRIGIERTE LOGIC
      const clubDataStr = localStorage.getItem('clubData');
      if (clubDataStr) {
        try {
          const clubData = JSON.parse(clubDataStr);
          console.log('🏢 ClubData gefunden:', clubData);
          
          if (clubData.user) {
            userData = clubData.user;
            token = clubData.token;
            setUserRole('verein');
            setVereinId(userData.vereins_id);
            setVereinsname(userData.name || 'Mein Verein');
            
            console.log('✅ Verein-User gesetzt:', {
              vereins_id: userData.vereins_id,
              name: userData.name,
              rolle: 'verein'
            });
          }
        } catch (error) {
          console.error('❌ Fehler beim Parsen der clubData:', error);
        }
      }
      
      // Falls kein clubData, versuche adminData (Admin-Login)
      if (!userData) {
        const adminDataStr = localStorage.getItem('adminData');
        if (adminDataStr) {
          try {
            const adminData = JSON.parse(adminDataStr);
            console.log('👑 AdminData gefunden:', adminData);
            
            if (adminData.user) {
              userData = adminData.user;
              token = adminData.token;
              setUserRole('admin');
              setVereinsname('Administrator');
              setVereinId(null); // Admin hat keinen festen Verein
              
              console.log('✅ Admin-User gesetzt:', {
                rolle: 'admin',
                name: 'Administrator'
              });
            }
          } catch (error) {
            console.error('❌ Fehler beim Parsen der adminData:', error);
          }
        }
      }
      
      if (!userData || !token) {
        console.warn('⚠️ Keine gültigen User-Daten gefunden');
        setError('Bitte loggen Sie sich ein, um Anmeldungen vornehmen zu können.');
        return false;
      }
      
      return true;
    };
    
    // Backend-Verfügbarkeit prüfen BEVOR API-Calls
    const checkBackendConnection = async () => {
      try {
        const response = await fetch(`${config.API_BASE_URL}/health`, {
          method: 'GET',
          timeout: 5000
        });
        
        if (response.ok) {
          console.log('✅ Backend erreichbar');
          return true;
        } else {
          console.warn('⚠️ Backend antwortet mit Fehler:', response.status);
          return false;
        }
      } catch (error) {
        console.error('❌ Backend nicht erreichbar:', error.message);
        setError(`Backend-Server nicht erreichbar (${config.API_BASE_URL}). Bitte starten Sie den Server.`);
        setLoading(false);
        return false;
      }
    };
    
    const initialize = async () => {
      const userInitialized = initializeUser();
      
      if (userInitialized) {
        const backendReachable = await checkBackendConnection();
        if (backendReachable) {
          fetchTurniere();
        }
      }
    };
    
    initialize();
  }, [refreshTrigger]);

  // ✅ ERWEITERTE FUNKTIONALITÄT, ORIGINAL API-CALLS
  const fetchTurniere = async () => {
    setLoading(true);
    setError('');
    
    try {
      // ✅ ORIGINAL: Token aus clubData extrahieren, ERWEITERT: auch adminData
      const clubDataStr = localStorage.getItem('clubData');
      const adminDataStr = localStorage.getItem('adminData');
      let token = null;
      
      if (clubDataStr) {
        const clubData = JSON.parse(clubDataStr);
        token = clubData.token;
      } else if (adminDataStr) {
        const adminData = JSON.parse(adminDataStr);
        token = adminData.token;
      }

      if (!token) {
        throw new Error('Kein Authentifizierungstoken gefunden. Bitte loggen Sie sich ein.');
      }

      console.log('🔑 Using token for API call');
      
      // ✅ ORIGINAL: Verwende die richtigen Filter für anmeldefähige Turniere
      const params = new URLSearchParams({
        zukunft: 'true',        // Nur zukünftige Turniere  
        anmeldeoffen: 'true'    // Nur Turniere mit offenen Anmeldungen
      });
      
      const url = `${config.API_BASE_URL}/turniere?${params}`;
      console.log('🌐 API URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session abgelaufen. Bitte loggen Sie sich erneut ein.');
        }
        throw new Error(`HTTP ${response.status}: Fehler beim Laden der Turniere`);
      }

      const data = await response.json();
      console.log('📊 Raw API response:', data);

      // ✅ ORIGINAL: Neue API-Response-Format verwenden
      let turniereData = [];
      if (data.success && Array.isArray(data.data)) {
        turniereData = data.data;
      } else if (Array.isArray(data)) {
        turniereData = data;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        turniereData = [];
      }

      console.log('🎯 Processed turniere:', turniereData);

      // ✅ ORIGINAL: Zusätzliche Frontend-Filterung (optional, da Backend bereits filtert)
      const heute = new Date();
      heute.setHours(0, 0, 0, 0);
      
      const verfuegbareTurniere = turniereData.filter(turnier => {
        // Verwende die vom Backend bereitgestellten Felder
        const istZukunft = turnier.isUpcoming !== undefined ? turnier.isUpcoming : true;
        const kannAnmelden = turnier.canRegister !== undefined ? turnier.canRegister : true;
        const anmeldungOffen = turnier.registrationOpen !== undefined ? turnier.registrationOpen : true;
        
        console.log(`📅 Turnier "${turnier.name}":`, {
          datum: turnier.datum_formatted || turnier.datum,
          anmeldeschluss: turnier.anmeldeschluss_formatted || turnier.anmeldeschluss,
          status: turnier.status,
          istZukunft,
          kannAnmelden,
          anmeldungOffen,
          verfuegbar: istZukunft && kannAnmelden && anmeldungOffen
        });
        
        return istZukunft && kannAnmelden && anmeldungOffen;
      });

      setTurniere(verfuegbareTurniere);
      console.log('✅ Final verfügbare Turniere:', verfuegbareTurniere.length);
      
      if (verfuegbareTurniere.length === 0 && turniereData.length > 0) {
        console.log('ℹ️ Turniere gefunden, aber keine verfügbar nach Filterung');
      }
      
    } catch (err) {
      console.error('❌ Fehler beim Laden der Turniere:', err);
      setError('Fehler beim Laden der Turniere: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ERWEITERT: Unterstützung für Admin/Verein-Flows
  const handleAnmeldungClick = (turnier) => {
    if (userRole === 'admin') {
      // Admin kann für jeden Verein anmelden - Modal entscheidet den Flow
      setSelectedTurnier(turnier);
      setShowModal(true);
    } else if (userRole === 'verein' && vereinId) {
      // Original Verein-Logic
      setSelectedTurnier(turnier);
      setShowModal(true);
    } else {
      setError('Bitte loggen Sie sich ein, um sich anzumelden');
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedTurnier(null);
  };

  // ✅ ERWEITERT: Neue Success-Handler für vollständiges Anmeldesystem
  const handleWettkampferSelected = (selectedWettkampfer) => {
    setShowModal(false);
    
    // Trigger refresh für aktualisierte Daten
    setRefreshTrigger(prev => prev + 1);
    
    navigate('/registration/bestaetigung', {
      state: {
        turnier: selectedTurnier,
        selectedWettkampfer,
        vereinId: userRole === 'verein' ? vereinId : selectedWettkampfer?.vereinId
      }
    });
  };

  // ✅ NEUE Erfolg-Handler für Modal-Integration
  const handleAnmeldungErfolgreich = (anmeldungsData) => {
    setShowModal(false);
    setSelectedTurnier(null);
    
    console.log('✅ Anmeldung erfolgreich:', anmeldungsData);
    
    // Daten refreshen
    setRefreshTrigger(prev => prev + 1);
    
    // Navigiere zur Bestätigungsseite
    navigate('/registration/bestaetigung', {
      state: {
        turnier: selectedTurnier,
        anmeldungen: anmeldungsData,
        vereinId: userRole === 'verein' ? vereinId : anmeldungsData.verein?.vereins_id
      }
    });
  };

  // ✅ ORIGINAL: Formatierungs-Funktionen unverändert
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysUntilDeadline = (anmeldeschluss) => {
    if (!anmeldeschluss) return null;
    
    const heute = new Date();
    const deadline = new Date(anmeldeschluss);
    const diffTime = deadline - heute;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (anmeldeschluss) => {
    if (!anmeldeschluss) return 'normal';
    
    const days = getDaysUntilDeadline(anmeldeschluss);
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'warning';
    return 'normal';
  };

  // ✅ ORIGINAL LOADING STATE
  if (loading) {
    return (
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Turnier-Anmeldung</h1>
          <p className="section-subtitle">Melden Sie Ihre Wettkämpfer für verfügbare Turniere an</p>
        </div>
        <div className="flex justify-center items-center p-8">
          <div className="spinner"></div>
          <p className="ml-4">Turniere werden geladen...</p>
        </div>
      </div>
    );
  }

  // ✅ ORIGINAL ERROR STATE
  if (error) {
    return (
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Turnier-Anmeldung</h1>
          <p className="section-subtitle">Melden Sie Ihre Wettkämpfer für verfügbare Turniere an</p>
        </div>
        <div className="alert alert-error">
          {error}
        </div>
        <button 
          className="btn btn-primary mt-4" 
          onClick={fetchTurniere}
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="registration-page">
      {/* ✅ ORIGINAL HEADER IM DASHBOARD-STYLE */}
      <div className="registration-header">
        <h1>🏆 Turnier-Anmeldung</h1>
        <p>Melden Sie Ihre Wettkämpfer für verfügbare Turniere an</p>
        {vereinsname && (
          <div className="club-info" style={{
            marginTop: '15px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)'
          }}>
            <strong>Angemeldet als:</strong> {vereinsname} 🥋
            {/* ✅ ERWEITERT: Rolle anzeigen ohne Design zu ändern */}
            {userRole === 'admin' && <span> (Administrator)</span>}
            {/* ✅ DEBUG: Zeige Rolle und VereinsID */}
            <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.8 }}>
              Rolle: {userRole || 'Nicht erkannt'} | VereinsID: {vereinId || 'Keine'}
            </div>
          </div>
        )}
      </div>

      {/* ✅ ORIGINAL DASHBOARD-STYLE CARDS */}
      {turniere.length === 0 ? (
        <div className="no-turniere">
          <div className="no-turniere-content">
            <h3>Keine verfügbaren Turniere</h3>
            <p>Derzeit sind keine Turniere für die Anmeldung verfügbar.</p>
            <p>Schauen Sie später noch einmal vorbei.</p>
            <button 
              className="retry-button" 
              onClick={fetchTurniere}
            >
              Aktualisieren
            </button>
          </div>
        </div>
      ) : (
        <div className="turniere-grid">
          {turniere.map(turnier => (
            <div key={turnier.turnier_id} className="turnier-registration-card">
              
              {/* ✅ ORIGINAL Card Header mit Titel und Datum */}
              <div className="turnier-card-header">
                <h3>{turnier.name}</h3>
                <span className="turnier-datum">
                  📅 {turnier.datum_formatted || formatDate(turnier.datum)}
                </span>
              </div>
              
              {/* ✅ ORIGINAL Card Body mit Details */}
              <div className="turnier-card-body">
                <div className="turnier-info">
                  <p><strong>📍 Ort:</strong> {turnier.ort}</p>
                  <p><strong>🥋 Disziplinen:</strong> {turnier.disziplin || 'Nicht angegeben'}</p>
                  
                  {/* ✅ ORIGINAL Anmeldeschluss falls vorhanden */}
                  {turnier.anmeldeschluss && (
                    <p>
                      <strong>⏰ Anmeldeschluss:</strong> 
                      <span className={`deadline deadline-${getDeadlineStatus(turnier.anmeldeschluss)}`}>
                        {turnier.anmeldeschluss_formatted || formatDate(turnier.anmeldeschluss)}
                        {getDaysUntilDeadline(turnier.anmeldeschluss) && (
                          <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#8B0000' }}>
                            ({getDaysUntilDeadline(turnier.anmeldeschluss)} Tage)
                          </span>
                        )}
                      </span>
                    </p>
                  )}
                  
                  {/* ✅ ORIGINAL Tage bis Turnier */}
                  {turnier.daysUntil && (
                    <p>
                      <strong>⏳ Startet in:</strong> 
                      <span style={{ 
                        color: turnier.daysUntil <= 7 ? '#8B0000' : '#28a745',
                        fontWeight: 'bold'
                      }}>
                        {turnier.daysUntil} Tagen
                      </span>
                    </p>
                  )}
                </div>
                
                {/* ✅ ORIGINAL Status Badge */}
                <div className="turnier-status">
                  <span className={`status-badge ${turnier.status?.toLowerCase()}`}>
                    {turnier.status}
                  </span>
                  
                  {/* ✅ ORIGINAL Verfügbarkeits-Indikator */}
                  {turnier.canRegister && (
                    <span style={{ 
                      marginLeft: '10px', 
                      color: '#28a745', 
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      ✅ Anmeldung möglich
                    </span>
                  )}
                </div>
              </div>
              
              {/* ✅ ORIGINAL Card Footer mit Action Button */}
              <div className="turnier-card-footer">
                <button 
                  className="register-button"
                  onClick={() => handleAnmeldungClick(turnier)}
                  disabled={!turnier.canRegister}
                  style={{
                    opacity: turnier.canRegister ? 1 : 0.6,
                    cursor: turnier.canRegister ? 'pointer' : 'not-allowed'
                  }}
                >
                  {turnier.canRegister ? (
                    <>
                      🏆 Jetzt anmelden
                    </>
                  ) : (
                    <>
                      🚫 Anmeldung geschlossen
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ ORIGINAL ZUSÄTZLICHER INFO-BEREICH */}
      <div className="registration-info">
        <h3>📋 So funktioniert die Anmeldung</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>1️⃣ Turnier auswählen</h4>
            <p>Wählen Sie ein verfügbares Turnier aus der Liste oben und klicken Sie auf "Jetzt anmelden".</p>
          </div>
          <div className="info-item">
            <h4>2️⃣ Wettkämpfer auswählen</h4>
            <p>Wählen Sie die Wettkämpfer aus Ihrem Verein aus, die am Turnier teilnehmen sollen.</p>
          </div>
          <div className="info-item">
            <h4>3️⃣ Anmeldung bestätigen</h4>
            <p>Prüfen Sie alle Angaben und bestätigen Sie die Anmeldung. Sie erhalten eine Bestätigungsmail.</p>
          </div>
          <div className="info-item">
            <h4>💡 Tipp</h4>
            <p>Beachten Sie die Anmeldefristen! Verspätete Anmeldungen können nicht berücksichtigt werden.</p>
          </div>
        </div>
      </div>

      {/* ✅ ERWEITERT: Modal für Wettkämpfer-Auswahl mit neuen Props */}
      {showModal && selectedTurnier && (
        <WettkampferAuswahlModal
          turnier={selectedTurnier}
          onClose={handleModalClose}
          onWettkampferSelected={handleWettkampferSelected}
          onAnmeldungErfolgreich={handleAnmeldungErfolgreich}
          vereinId={userRole === 'verein' ? vereinId : null}
          userRole={userRole}
        />
      )}
    </div>
  );
};

export default TurnierRegistrationPage;