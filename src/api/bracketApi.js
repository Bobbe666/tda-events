// frontend/src/api/bracketApi.js
// API FUNKTIONEN FÜR BRACKET-SYSTEM

import config from '../config';

const BRACKET_BASE = `${config.API_BASE_URL}/brackets`;

// ===================================
// BRACKET MANAGEMENT FUNKTIONEN
// ===================================

/**
 * Alle Brackets für ein Turnier abrufen
 */
export const getBracketsByTurnier = async (turnierId) => {
  try {
    const response = await fetch(`${BRACKET_BASE}/turnier/${turnierId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Brackets für Turnier abgerufen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Brackets:', error);
    throw error;
  }
};

/**
 * Einzelnes Bracket mit Details abrufen
 */
export const getBracketById = async (bracketId) => {
  try {
    const response = await fetch(`${BRACKET_BASE}/${bracketId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Bracket-Details abgerufen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen des Brackets:', error);
    throw error;
  }
};

/**
 * Neues Bracket erstellen (Admin)
 */
export const createBracket = async (bracketData, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(BRACKET_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(bracketData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Bracket erstellt:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Brackets:', error);
    throw error;
  }
};

/**
 * Teilnehmer zu Bracket hinzufügen (Admin)
 */
export const addTeilnehmerToBracket = async (bracketId, teilnehmerData, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BRACKET_BASE}/${bracketId}/teilnehmer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(teilnehmerData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Teilnehmer zu Bracket hinzugefügt:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Hinzufügen der Teilnehmer:', error);
    throw error;
  }
};

/**
 * Bracket-Kämpfe generieren (K.O.-System)
 */
export const generateBracketKaempfe = async (bracketId, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BRACKET_BASE}/${bracketId}/generate`, {
      method: 'POST',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Bracket-Kämpfe generiert:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Generieren der Kämpfe:', error);
    throw error;
  }
};

// ===================================
// KAMPF-MANAGEMENT FUNKTIONEN
// ===================================

/**
 * Kampf starten
 */
export const startKampf = async (kampfId, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BRACKET_BASE}/kampf/${kampfId}/start`, {
      method: 'PUT',
      headers
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Kampf gestartet:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Starten des Kampfes:', error);
    throw error;
  }
};

/**
 * Kampfergebnis eintragen
 */
export const updateKampfResult = async (kampfId, resultData, authToken = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await fetch(`${BRACKET_BASE}/kampf/${kampfId}/result`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(resultData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Kampfergebnis eingetragen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Eintragen des Ergebnisses:', error);
    throw error;
  }
};

// ===================================
// ÜBERSICHT & STATISTIKEN
// ===================================

/**
 * Aktuelle Kämpfe abrufen
 */
export const getCurrentKaempfe = async () => {
  try {
    const response = await fetch(`${BRACKET_BASE}/kaempfe/aktuell`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Aktuelle Kämpfe abgerufen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der aktuellen Kämpfe:', error);
    throw error;
  }
};

/**
 * Turnier-Rangliste abrufen
 */
export const getTurnierRangliste = async (turnierId) => {
  try {
    const response = await fetch(`${BRACKET_BASE}/turnier/${turnierId}/rangliste`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Turnier-Rangliste abgerufen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Rangliste:', error);
    throw error;
  }
};

/**
 * Alle Brackets abrufen (Übersicht)
 */
export const getAllBrackets = async () => {
  try {
    const response = await fetch(BRACKET_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Bracket-Übersicht abgerufen:', data);
    return data;
  } catch (error) {
    console.error('❌ Fehler beim Abrufen der Bracket-Übersicht:', error);
    throw error;
  }
};

// ===================================
// HELPER FUNKTIONEN
// ===================================

/**
 * Bracket-Typ in deutscher Bezeichnung
 */
export const getBracketTypeLabel = (type) => {
  const labels = {
    'knockout': 'K.O.-System',
    'double_elimination': 'Doppel-Elimination', 
    'round_robin': 'Jeder gegen Jeden'
  };
  return labels[type] || type;
};

/**
 * Kampf-Status in deutscher Bezeichnung
 */
export const getKampfStatusLabel = (status) => {
  const labels = {
    'pending': 'Wartend',
    'ready': 'Bereit',
    'running': 'Läuft',
    'finished': 'Beendet',
    'cancelled': 'Abgebrochen'
  };
  return labels[status] || status;
};

/**
 * Bracket-Status in deutscher Bezeichnung
 */
export const getBracketStatusLabel = (status) => {
  const labels = {
    'open': 'Offen',
    'ready': 'Bereit',
    'running': 'Läuft',
    'finished': 'Beendet'
  };
  return labels[status] || status;
};

/**
 * Runden-Namen für K.O.-System
 */
export const getRundenName = (runde, totalRunden) => {
  if (runde === totalRunden) return 'Finale';
  if (runde === totalRunden - 1) return 'Halbfinale';
  if (runde === totalRunden - 2) return 'Viertelfinale';
  if (runde === totalRunden - 3) return 'Achtelfinale';
  return `Runde ${runde}`;
};