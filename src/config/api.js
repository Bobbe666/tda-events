// API-Konfiguration für TDA Turnierverwaltung
const API_CONFIG = {
  // Backend-URL - kann über Umgebungsvariable überschrieben werden
  BASE_URL: process.env.REACT_APP_API_URL || '',
  
  // API-Endpunkte
  ENDPOINTS: {
    WETTKAEMPFER: '/api/wettkaempfer',
    TURNIERE: '/api/turniere',
    ANMELDUNGEN: '/api/anmeldungen',
    VEREINE: '/api/vereine',
    DIVISIONEN: '/api/divisionen',
    STREAMING: '/api/streaming',
    AUTH: '/api/auth'
  },
  
  // Vollständige URLs
  getUrl: (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`,
  
  // Wettkämpfer-URLs
  wettkaempfer: {
    search: (term) => `${API_CONFIG.BASE_URL}/api/wettkaempfer?search=${encodeURIComponent(term)}`,
    getAll: () => `${API_CONFIG.BASE_URL}/api/wettkaempfer`,
    getById: (id) => `${API_CONFIG.BASE_URL}/api/wettkaempfer/${id}`,
    create: () => `${API_CONFIG.BASE_URL}/api/wettkaempfer`,
    update: (id) => `${API_CONFIG.BASE_URL}/api/wettkaempfer/${id}`,
    delete: (id) => `${API_CONFIG.BASE_URL}/api/wettkaempfer/${id}`
  },
  
  // Turniere-URLs
  turniere: {
    getAll: () => `${API_CONFIG.BASE_URL}/api/turniere`,
    getById: (id) => `${API_CONFIG.BASE_URL}/api/turniere/${id}`,
    create: () => `${API_CONFIG.BASE_URL}/api/turniere`,
    update: (id) => `${API_CONFIG.BASE_URL}/api/turniere/${id}`,
    delete: (id) => `${API_CONFIG.BASE_URL}/api/turniere/${id}`
  },
  
  // Anmeldungen-URLs
  anmeldungen: {
    getAll: () => `${API_CONFIG.BASE_URL}/api/anmeldungen`,
    getByTurnier: (id) => `${API_CONFIG.BASE_URL}/api/anmeldungen/turnier/${id}`,
    getByVerein: (id) => `${API_CONFIG.BASE_URL}/api/anmeldungen/verein/${id}`,
    create: () => `${API_CONFIG.BASE_URL}/api/anmeldungen`,
    cancel: (id) => `${API_CONFIG.BASE_URL}/api/anmeldungen/cancel/${id}`,
    stats: () => `${API_CONFIG.BASE_URL}/api/anmeldungen/stats`
  }
};

export default API_CONFIG;

