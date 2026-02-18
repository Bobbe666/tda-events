// src/config.js

// Basis-URL der API, kann über Umgebungsvariablen gesetzt werden (z. B. REACT_APP_API_URL)
// Leerer String für relative URLs in Production
export const API_BASE_URL = process.env.REACT_APP_API_URL || "";

// Endpunkte zentral definieren
export const VEREINE_API_URL = `${API_BASE_URL}/vereine`;
export const WETTKAEMPFER_API_URL = `${API_BASE_URL}/wettkaempfer`;
// Weitere API-Endpunkte können hier ergänzt werden, z. B. für Turniere:
// export const TURNIERE_API_URL = `${API_BASE_URL}/turniere`;
