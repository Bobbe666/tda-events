// src/config.js - Korrigierte Frontend-Konfiguration

const config = {
  // Backend API URL - relative path for production
  API_BASE_URL: '/api',

  // Environment-spezifische Konfiguration
  BASE_URL: '/api',

  // Debugging
  DEBUG: false,

  // Timeout Settings
  API_TIMEOUT: 10000,  // 10 Sekunden

  // Retry Settings
  MAX_RETRIES: 3,

  // Health Check URL
  HEALTH_CHECK_URL: '/api/health'
};

console.log('🔧 Frontend Config geladen:', config);

export default config;
