// wettkaempferApi.js - Nutzt zentrale API-Utility mit Auto-Logout & Token-Refresh
import { apiCall as centralApiCall, getAuthToken, handleAutoLogout } from '../utils/apiUtils';
import config from '../config';

// 🔧 Debug-Helper: Backend Health Check
const checkBackendHealth = async () => {
  try {
    const healthUrl = `${config.API_BASE_URL}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      timeout: 3000
    });
    console.log('🏥 Backend Health Check:', response.status, healthUrl);
    return response.ok;
  } catch (error) {
    console.error('❌ Backend Health Check failed:', error.message);
    return false;
  }
};

// 🌐 Wrapper für zentrale API-Call mit Health-Check Option
const apiCall = async (endpoint, options = {}) => {
  // Health Check bei Bedarf
  if (options.checkHealth) {
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      throw new Error('Backend-Server ist nicht erreichbar. Bitte starten Sie das Backend mit "cd backend && npm start"');
    }
    delete options.checkHealth;
  }

  // Nutze zentrale API-Call Funktion (mit Auto-Logout & Token-Refresh)
  try {
    return await centralApiCall(`/api${endpoint}`, options);
  } catch (error) {
    // User-friendly error alerts für kritische Probleme
    if (error.message.includes('Backend-Server')) {
      alert(`⚠️ Backend Problem!\n\n${error.message}\n\nSchritte zur Lösung:\n1. Terminal öffnen\n2. "cd backend"\n3. "npm start"`);
    }
    throw error;
  }
};

// 🏃‍♂️ Get Wettkämpfer by Verein - Hauptfunktion für Vereinsdetails
const getWettkaempferByVerein = async (verein_id) => {
  console.log(`🏃‍♂️ [wettkaempferApi] Loading Wettkämpfer for Verein: ${verein_id}`);
  
  try {
    const response = await apiCall(`/wettkaempfer?verein_id=${verein_id}`, {
      checkHealth: true // Health Check für erste kritische Anfrage
    });
    
    // Response-Format-Handling (verschiedene Backend-Antwortformate)
    let wettkaempfer = response;
    if (response && typeof response === 'object') {
      if (response.success && Array.isArray(response.data)) {
        wettkaempfer = response.data;
      } else if (response.data && Array.isArray(response.data)) {
        wettkaempfer = response.data;
      } else if (Array.isArray(response)) {
        wettkaempfer = response;
      }
    }
    
    // Validation
    if (!Array.isArray(wettkaempfer)) {
      console.warn('⚠️ [wettkaempferApi] Response ist kein Array:', typeof wettkaempfer);
      return [];
    }
    
    console.log(`✅ [wettkaempferApi] Wettkämpfer geladen:`, {
      vereinId: verein_id,
      count: wettkaempfer.length,
      firstMember: wettkaempfer[0] ? {
        id: wettkaempfer[0].wettkaempfer_id,
        name: `${wettkaempfer[0].vorname} ${wettkaempfer[0].nachname}`
      } : null
    });
    
    return wettkaempfer;
    
  } catch (error) {
    console.error(`❌ [wettkaempferApi] Error loading Wettkämpfer for Verein ${verein_id}:`, error.message);
    
    // Graceful fallback mit leerer Liste
    return [];
  }
}

// ➕ Add Wettkämpfer mit File-Upload Support
const addWettkaempfer = async (member) => {
  console.log('➕ [wettkaempferApi] Adding Wettkämpfer:', {
    name: `${member.vorname} ${member.nachname}`,
    hasPhoto: !!member.foto,
    vereinId: member.vereins_id
  });
  
  try {
    let requestBody;
    let headers = {};
    
    // File-Upload vs JSON handling
    if (member.foto) {
      requestBody = new FormData();
      Object.entries(member).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestBody.append(key, value);
        }
      });
      console.log('📎 Using FormData for file upload');
    } else {
      requestBody = JSON.stringify(member);
      headers["Content-Type"] = "application/json";
      console.log('📝 Using JSON for data only');
    }
    
    const response = await apiCall('/wettkaempfer', {
      method: "POST",
      headers,
      body: requestBody,
    });
    
    console.log('✅ [wettkaempferApi] Wettkämpfer successfully added:', response);
    return response;
    
  } catch (error) {
    console.error("⛔ [wettkaempferApi] Error adding Wettkämpfer:", error.message);
    throw error; // Propagate error für bessere UX
  }
}

// 🔄 Update Wettkämpfer mit Validation
const updateWettkaempfer = async (member) => {
  // Input Validation
  if (!member.wettkaempfer_id || isNaN(Number(member.wettkaempfer_id))) {
    const error = new Error("Wettkämpfer-ID fehlt oder ist ungültig");
    console.error("❌ [wettkaempferApi] Validation Error:", {
      providedId: member.wettkaempfer_id,
      type: typeof member.wettkaempfer_id,
      member: member
    });
    throw error;
  }
  
  console.log('🔄 [wettkaempferApi] Updating Wettkämpfer:', {
    id: member.wettkaempfer_id,
    name: `${member.vorname} ${member.nachname}`,
    hasPhoto: !!member.foto
  });
  
  try {
    let requestBody;
    let headers = {};
    
    // File-Upload vs JSON handling
    if (member.foto) {
      requestBody = new FormData();
      Object.entries(member).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestBody.append(key, value);
        }
      });
    } else {
      requestBody = JSON.stringify(member);
      headers["Content-Type"] = "application/json";
    }
    
    const response = await apiCall(`/wettkaempfer/${member.wettkaempfer_id}`, {
      method: "PUT",
      headers,
      body: requestBody,
    });
    
    console.log('✅ [wettkaempferApi] Wettkämpfer successfully updated:', response);
    return response;
    
  } catch (error) {
    console.error("❌ [wettkaempferApi] Error updating Wettkämpfer:", error.message);
    throw error;
  }
}

// 🗑️ Delete Wettkämpfer mit Confirmation
const deleteWettkaempfer = async (id) => {
  // Input Validation
  if (!id || isNaN(Number(id))) {
    throw new Error("Ungültige Wettkämpfer-ID für Löschung");
  }
  
  console.log('🗑️ [wettkaempferApi] Deleting Wettkämpfer:', { id });
  
  try {
    const response = await apiCall(`/wettkaempfer/${id}`, { 
      method: "DELETE" 
    });
    
    console.log('✅ [wettkaempferApi] Wettkämpfer successfully deleted:', { id });
    return response;
    
  } catch (error) {
    console.error("❌ [wettkaempferApi] Error deleting Wettkämpfer:", error.message);
    throw error;
  }
}

// 📋 Get All Wettkämpfer mit Pagination (Bonus-Funktion)
const getAllWettkaempfer = async (params = {}) => {
  console.log('📋 [wettkaempferApi] Loading all Wettkämpfer:', params);
  
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/wettkaempfer${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiCall(endpoint);
    
    // Handle response format
    const data = response.success ? response.data : response;
    console.log('✅ [wettkaempferApi] All Wettkämpfer loaded:', {
      total: Array.isArray(data) ? data.length : 'Unknown',
      params
    });
    
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error('❌ [wettkaempferApi] Error loading all Wettkämpfer:', error.message);
    return [];
  }
}

// 🎯 Get Single Wettkämpfer by ID (Bonus-Funktion)
const getWettkaempferById = async (id) => {
  console.log('🎯 [wettkaempferApi] Loading Wettkämpfer by ID:', id);
  
  try {
    const response = await apiCall(`/wettkaempfer/${id}`);
    
    console.log('✅ [wettkaempferApi] Wettkämpfer loaded by ID:', {
      id,
      name: response.vorname && response.nachname ? 
        `${response.vorname} ${response.nachname}` : 'Unknown'
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ [wettkaempferApi] Error loading Wettkämpfer by ID:', error.message);
    throw error;
  }
}

// 📊 Wettkämpfer Statistiken (Bonus-Funktion)
const getWettkaempferStats = async () => {
  console.log('📊 [wettkaempferApi] Loading Wettkämpfer statistics');
  
  try {
    const response = await apiCall('/wettkaempfer/stats');
    
    console.log('✅ [wettkaempferApi] Statistics loaded:', response);
    return response;
    
  } catch (error) {
    console.error('❌ [wettkaempferApi] Error loading statistics:', error.message);
    return {};
  }
}

// 🔍 Search Wettkämpfer (Bonus-Funktion)
const searchWettkaempfer = async (query) => {
  console.log('🔍 [wettkaempferApi] Searching Wettkämpfer:', query);
  
  try {
    const response = await apiCall(`/wettkaempfer/search?q=${encodeURIComponent(query)}`);
    
    const results = Array.isArray(response) ? response : (response.data || []);
    console.log('✅ [wettkaempferApi] Search completed:', {
      query,
      resultCount: results.length
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ [wettkaempferApi] Search error:', error.message);
    return [];
  }
}

// 🎪 Export Default für Clean Imports
export default {
  getWettkaempferByVerein,
  getAllWettkaempfer,
  getWettkaempferById,
  addWettkaempfer,
  updateWettkaempfer,
  deleteWettkaempfer,
  getWettkaempferStats,
  searchWettkaempfer
};

// 🎯 Named Exports für spezifische Imports
export {
  getWettkaempferByVerein,
  getAllWettkaempfer,
  getWettkaempferById,
  addWettkaempfer,
  updateWettkaempfer,
  deleteWettkaempfer,
  getWettkaempferStats,
  searchWettkaempfer
};