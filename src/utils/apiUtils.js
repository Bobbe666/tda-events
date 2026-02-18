// apiUtils.js - Zentrale API-Utilities mit automatischem Logout bei 401 & Token-Refresh
import config from '../config';

// Konfiguration
const TOKEN_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 Minuten vor Ablauf refreshen
const TOKEN_EXTEND_HOURS = 2; // Token um 2 Stunden verlängern
let isRefreshing = false; // Verhindert mehrfache gleichzeitige Refreshs

/**
 * Dekodiert ein JWT Token (ohne Verifizierung)
 */
export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    console.warn('⚠️ [Auth] Token konnte nicht dekodiert werden');
    return null;
  }
};

/**
 * Prüft ob ein Token noch gültig ist
 */
export const isTokenValid = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

/**
 * Prüft ob ein Token bald abläuft (innerhalb von 30 Min)
 */
export const isTokenExpiringSoon = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return false;
  const now = Date.now();
  const expiry = payload.exp * 1000;
  return (expiry - now) < TOKEN_REFRESH_THRESHOLD;
};

/**
 * Erneuert den Token wenn er bald abläuft
 */
export const refreshTokenIfNeeded = async () => {
  if (isRefreshing) return; // Bereits am Refreshen

  const token = getAuthToken();
  if (!token || !isTokenValid(token)) return;

  // Nur refreshen wenn Token bald abläuft
  if (!isTokenExpiringSoon(token)) return;

  isRefreshing = true;
  console.log('🔄 [Auth] Token läuft bald ab - Versuche Verlängerung...');

  try {
    const API_BASE = config?.API_BASE_URL || process.env.REACT_APP_API_URL || '';
    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        // Neuen Token speichern
        localStorage.setItem('token', data.token);
        localStorage.setItem('authToken', data.token);

        // Auch in clubData aktualisieren
        try {
          const clubData = JSON.parse(localStorage.getItem('clubData') || '{}');
          clubData.token = data.token;
          localStorage.setItem('clubData', JSON.stringify(clubData));
        } catch (e) {}

        console.log('✅ [Auth] Token erfolgreich um 2 Stunden verlängert');
      }
    } else {
      console.warn('⚠️ [Auth] Token-Refresh fehlgeschlagen:', response.status);
    }
  } catch (error) {
    console.error('❌ [Auth] Token-Refresh Fehler:', error.message);
  } finally {
    isRefreshing = false;
  }
};

/**
 * Automatischer Logout bei abgelaufenem Token
 * Wird aufgerufen wenn ein 401-Fehler auftritt
 */
export const handleAutoLogout = () => {
  console.log('🚪 [Auth] Token abgelaufen - Automatischer Logout...');

  // Alle Auth-Daten entfernen
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('clubData');
  localStorage.removeItem('clubId');
  localStorage.removeItem('vereins_id');

  // Optional: Event dispatchen für React-Komponenten
  window.dispatchEvent(new CustomEvent('auth:logout', {
    detail: { reason: 'token_expired' }
  }));

  // Zur Login-Seite weiterleiten
  window.location.href = '/login?expired=1';
};

/**
 * Holt den Auth-Token aus dem localStorage
 * Prüft verschiedene Speicherorte für Kompatibilität
 */
export const getAuthToken = () => {
  // 1. Priorität: clubData.token
  try {
    const clubData = JSON.parse(localStorage.getItem('clubData') || '{}');
    if (clubData.token) {
      return clubData.token;
    }
  } catch (e) {
    console.warn('⚠️ [Auth] Fehler beim Parsen von clubData');
  }

  // 2. Fallback: direkter Token
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return token || null;
};

/**
 * Erstellt die Standard-Headers für API-Requests
 */
export const getAuthHeaders = () => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('⚠️ [Auth] Kein Token für API-Request gefunden');
  }

  return headers;
};

/**
 * Zentrale API-Call-Funktion mit automatischem 401-Handling & Token-Refresh
 *
 * @param {string} endpoint - API-Endpunkt (z.B. '/api/vereine')
 * @param {object} options - Fetch-Optionen (method, body, headers, etc.)
 * @returns {Promise<any>} - Response-Daten
 */
export const apiCall = async (endpoint, options = {}) => {
  // Token-Refresh prüfen BEVOR der Request gemacht wird
  await refreshTokenIfNeeded();

  const API_BASE = config?.API_BASE_URL || process.env.REACT_APP_API_URL || '';
  const url = `${API_BASE}${endpoint}`;

  // Headers zusammenführen (nach potentiellem Refresh!)
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  // Content-Type entfernen bei FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const fetchOptions = {
    ...options,
    headers
  };

  console.log(`📡 [API] ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(url, fetchOptions);

    // 401 Unauthorized - Automatischer Logout
    if (response.status === 401) {
      console.error('❌ [API] 401 Unauthorized - Token abgelaufen oder ungültig');
      handleAutoLogout();
      throw new Error('Sitzung abgelaufen. Sie werden zur Anmeldung weitergeleitet.');
    }

    // 403 Forbidden
    if (response.status === 403) {
      throw new Error('Keine Berechtigung für diese Aktion.');
    }

    // Andere Fehler
    if (!response.ok) {
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      } else {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
      }
    }

    // Erfolgreiche Response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ [API] Success: ${endpoint}`);
      return data;
    }

    // Kein JSON - Text zurückgeben
    return await response.text();

  } catch (error) {
    // Fehler weiterleiten (außer bei 401, da wurde schon weitergeleitet)
    if (!error.message.includes('Sitzung abgelaufen')) {
      console.error(`❌ [API] Error für ${endpoint}:`, error.message);
    }
    throw error;
  }
};

/**
 * GET-Request Helper
 */
export const apiGet = (endpoint) => apiCall(endpoint, { method: 'GET' });

/**
 * POST-Request Helper
 */
export const apiPost = (endpoint, data) => apiCall(endpoint, {
  method: 'POST',
  body: JSON.stringify(data)
});

/**
 * PUT-Request Helper
 */
export const apiPut = (endpoint, data) => apiCall(endpoint, {
  method: 'PUT',
  body: JSON.stringify(data)
});

/**
 * DELETE-Request Helper
 */
export const apiDelete = (endpoint) => apiCall(endpoint, { method: 'DELETE' });

export default {
  apiCall,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  getAuthToken,
  getAuthHeaders,
  handleAutoLogout,
  refreshTokenIfNeeded,
  isTokenValid,
  isTokenExpiringSoon,
  decodeToken
};
