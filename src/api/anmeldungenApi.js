// src/api/anmeldungenApi.js - Frontend API Integration für Anmeldungen

const API_BASE = process.env.REACT_APP_API_URL || '';

// Helper Funktion für API-Aufrufe
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error for ${url}:`, error);
    throw error;
  }
};

export const anmeldungenApi = {
  // Neue Anmeldung erstellen
  createAnmeldung: async (anmeldungData) => {
    return await apiCall('/api/anmeldungen', {
      method: 'POST',
      body: JSON.stringify(anmeldungData)
    });
  },

  // Anmeldungen für ein Turnier abrufen (Admin)
  getAnmeldungenByTurnier: async (turnierId, vereinId = null) => {
    let url = `/api/anmeldungen/turnier/${turnierId}`;
    if (vereinId) {
      url += `?verein_id=${vereinId}`;
    }
    return await apiCall(url);
  },

  // Anmeldungen eines Vereins abrufen
  getAnmeldungenByVerein: async (vereinId, turnierId = null) => {
    let url = `/api/anmeldungen/verein/${vereinId}`;
    if (turnierId) {
      url += `?turnier_id=${turnierId}`;
    }
    return await apiCall(url);
  },

  // Anmeldung stornieren
  cancelAnmeldung: async (anmeldungId, grund = '') => {
    return await apiCall(`/api/anmeldungen/cancel/${anmeldungId}`, {
      method: 'PUT',
      body: JSON.stringify({ grund })
    });
  },

  // Statistiken abrufen
  getAnmeldungStats: async () => {
    return await apiCall('/api/anmeldungen/stats');
  },

  // Wettkämpfer eines Vereins für Anmeldung abrufen
  getWettkampferForAnmeldung: async (vereinId) => {
    return await apiCall(`/api/wettkaempfer/verein/${vereinId}`);
  },

  // Verfügbare Turniere für Anmeldung abrufen
  getVerfuegbareTurniere: async () => {
    const heute = new Date().toISOString().split('T')[0];
    return await apiCall(`/api/turniere?status=Geplant&anmeldeschluss_nach=${heute}`);
  }
};

// Export für einfache Verwendung
export default anmeldungenApi;