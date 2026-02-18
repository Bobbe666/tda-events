// src/App.js - VOLLSTÄNDIG KORRIGIERT MIT JWT-TOKEN
import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// ✅ Zentrale Styles

// ✅ Pages - Korrekte Pfade
import MeineSchulePage        from './pages/MeineSchulePage';
import MainDashboard          from './components/dashboard/MainDashboard';

// ✅ Admin-Unterseiten
import TurniereVerwaltenPage  from './pages/Turniere/TurniereVerwaltenPage';
import KategorienVerwaltenPage from './pages/Turniere/KategorienVerwaltenPage';
import VereineListePage       from './pages/Club/VereineListePage';
import VereinDetailPage       from './pages/Club/VereinDetailPage';

// ✅ Auth
import ClubLogin              from './components/auth/ClubLogin';
import ClubRegistrationPage   from './pages/Club/ClubRegistrationPage';

// ✅ Club
import ClubDropdown           from './components/club/ClubDropdown';
import ClubEditModal          from './components/club/ClubEditModal';

// ✅ Öffentliches Turnier-Listing
import TurnierListe           from './components/turnier/TurnierListe';
import LandingPage            from './pages/LandingPage';

// ✅ Kategorien/Divisionen (Admin)
import DivisionUebersicht     from './components/division/DivisionUebersicht.js';

// ✅ ERWEITERT: Registration System Components
import TurnierRegistrationPage from './pages/Turniere/TurnierRegistrationPage';
import AnmeldungBestaetigung   from './pages/Registration/AnmeldungBestaetigung';
import AnmeldungenUebersicht   from './pages/Admin/AnmeldungenUebersicht';

// ✅ PHASE 1: Bracket System
import BracketManagementPage   from './pages/Admin/BracketManagementPage';

// ✅ CSS Imports - Korrigierte Pfade
import './styles/index.css';






function App() {
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [clubData, setClubData]           = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ KORRIGIERT: Prüfe sowohl echte JWT-Tokens als auch Dummy-Tokens
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const stored = localStorage.getItem('clubData');
    
    if (token && stored) {
      try {
        const parsedClubData = JSON.parse(stored);
        setIsLoggedIn(true);
        
        // ✅ KORRIGIERT: Admin-Erkennung über clubData statt Dummy-Token
        const admin = parsedClubData.user?.role === 'admin' || 
                     parsedClubData.email === 'info@tda-intl.com' || 
                     parsedClubData.user?.email === 'info@tda-intl.com';
        
        setIsAdmin(admin);
        setClubData(parsedClubData);
        
        // ✅ FIX: Stelle sicher, dass der echte JWT-Token verfügbar ist
        if (parsedClubData.token && token !== parsedClubData.token) {
          console.log('🔧 Synchronisiere JWT-Token...');
          localStorage.setItem('token', parsedClubData.token);
          localStorage.setItem('authToken', parsedClubData.token);
        }
        
        console.log('✅ Benutzer automatisch eingeloggt:', admin ? 'Admin' : 'Verein');
      } catch (error) {
        console.error('❌ Fehler beim Laden der gespeicherten Daten:', error);
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (data) => {
    console.log('🔑 Login-Daten erhalten:', data);
    
    // ✅ KORRIGIERT: Admin-Erkennung
    const admin = data.user?.role === 'admin' || 
                 data.email === 'info@tda-intl.com' || 
                 data.user?.email === 'info@tda-intl.com';
    
    // ✅ FIX: Verwende den ECHTEN JWT-Token aus der Response
    const realToken = data.token;
    
    if (realToken) {
      // Speichere den echten JWT-Token in beiden Formaten für Kompatibilität
      localStorage.setItem('token', realToken);
      localStorage.setItem('authToken', realToken);
      console.log('✅ JWT-Token gespeichert:', realToken.substring(0, 30) + '...');
    } else {
      console.error('❌ Kein Token in Login-Response gefunden!', data);
      // Fallback für alte Implementierung
      const fallbackToken = admin ? 'admin-auth-token' : 'user-auth-token';
      localStorage.setItem('token', fallbackToken);
      localStorage.setItem('authToken', fallbackToken);
      console.warn('⚠️ Verwende Fallback-Token:', fallbackToken);
    }
    
    localStorage.setItem('clubData', JSON.stringify(data));
    setIsLoggedIn(true);
    setIsAdmin(admin);
    setClubData(data);
    
    console.log('✅ Login erfolgreich:', admin ? 'Admin' : 'Verein');
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = () => {
    console.log('🚪 Logout...');
    
    // ✅ ERWEITERT: Entferne alle Token-Varianten
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('clubData');
    localStorage.removeItem('clubId');
    localStorage.removeItem('vereins_id');
    
    setIsLoggedIn(false);
    setIsAdmin(false);
    setClubData(null);
    navigate('/', { replace: true });
    
    console.log('✅ Logout erfolgreich');
  };

  const handleUpdateClub = (updated) => {
    localStorage.setItem('clubData', JSON.stringify(updated));
    setClubData(updated);
    setShowEditModal(false);
    console.log('✅ Club-Daten aktualisiert');
  };

  // ✅ DEBUG: Token-Status anzeigen (nur in Development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const token = localStorage.getItem('token');
      const authToken = localStorage.getItem('authToken');
      console.log('🔍 Token Status:', {
        isLoggedIn,
        isAdmin,
        hasToken: !!token,
        hasAuthToken: !!authToken,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
      });
    }
  }, [isLoggedIn, isAdmin]);

  return (
    <div>
      <Routes>
        {/* Öffentlich */}
        <Route
          path="/"
          element={
            isLoggedIn
              ? <Navigate to="/dashboard" replace />
              : <LandingPage />
          }
        />
        <Route path="/login" element={<ClubLogin onLogin={handleLogin} />} />
        <Route path="/register" element={<ClubRegistrationPage />} />
        
        {/* ✅ ERWEITERT: Registration Routes */}
        <Route path="/registration" element={<TurnierRegistrationPage />} />
        <Route 
          path="/registration/bestaetigung" 
          element={
            isLoggedIn 
              ? <AnmeldungBestaetigung />
              : <Navigate to="/login" replace />
          } 
        />

        {/* ✅ DASHBOARD - Always available, MainDashboard handles auth internally */}
        <Route path="/dashboard/*" element={<MainDashboard />} />

        {/* ✅ ERWEITERT: Club-Bereich - Auch Vereine nutzen jetzt das Dashboard */}
        {isLoggedIn && !isAdmin && (
          <>
            <Route path="/profil"  element={<MeineSchulePage />} />
            <Route path="/turniere" element={<TurnierListe />} />
          </>
        )}

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Vereins-Modal */}
      {isLoggedIn && showEditModal && (
        <ClubEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          clubData={clubData}
          onUpdate={handleUpdateClub}
        />
      )}
      
      {/* ✅ NEU: Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Status: {isLoggedIn ? (isAdmin ? 'Admin' : 'User') : 'Guest'} | 
          Token: {localStorage.getItem('authToken') ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  padding: '20px', 
  backgroundColor: 'transparent', 
  borderBottom: 'none'
};

const titleStyle = { 
  margin: 0, 
  color: '#8B0000', 
  fontSize: '2em' 
};

const navLinkStyle = { 
  marginLeft: '15px', 
  textDecoration: 'none', 
  color: '#8B0000', 
  fontWeight: 'bold' 
};

export default App;