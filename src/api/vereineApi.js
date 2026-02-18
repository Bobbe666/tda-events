// ✅ KORRIGIERT: Nutze zentrale API-Utility mit Auto-Logout & Token-Refresh
import { apiCall, handleAutoLogout } from '../utils/apiUtils';

// Einzelne Functions!  
export async function getVereinById(vereinId) {
  try {
    const result = await apiCall(`/api/vereine/${vereinId}`);
    // ✅ KORRIGIERT: Handle different response formats
    if (result.success && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('API Fehler getVereinById:', error);
    throw new Error('Fehler beim Abrufen des Vereins!');
  }
}

export async function getAllVereine() {
  try {
    const result = await apiCall('/api/vereine');
    // ✅ KORRIGIERT: Handle different response formats
    if (result.success && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('API Fehler getAllVereine:', error);
    throw new Error('Fehler beim Abrufen der Vereine!');
  }
}

export async function getWettkaempferByVerein(vereinId) {
  try {
    const result = await apiCall(`/api/wettkaempfer?verein_id=${vereinId}`);
    // ✅ KORRIGIERT: Handle different response formats
    if (result.success && result.data) {
      return result.data;
    }
    return result;
  } catch (error) {
    console.error('API Fehler getWettkaempferByVerein:', error);
    throw new Error('Fehler beim Abrufen der Wettkämpfer!');
  }
}

export async function updateVerein(vereinId, vereinData) {
  try {
    return await apiCall(`/api/vereine/${vereinId}`, {
      method: 'PUT',
      body: JSON.stringify(vereinData)
    });
  } catch (error) {
    console.error('API Fehler updateVerein:', error);
    throw new Error('Fehler beim Aktualisieren des Vereins!');
  }
}

export async function deleteVerein(vereinId) {
  try {
    return await apiCall(`/api/vereine/${vereinId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('API Fehler deleteVerein:', error);
    throw new Error('Fehler beim Löschen des Vereins!');
  }
}

export async function addWettkaempfer(wettkampferData) {
  try {
    return await apiCall('/api/wettkaempfer', {
      method: 'POST',
      body: JSON.stringify(wettkampferData)
    });
  } catch (error) {
    console.error('API Fehler addWettkaempfer:', error);
    throw new Error('Fehler beim Hinzufügen des Wettkämpfers!');
  }
}

export async function updateWettkaempfer(wettkampferId, wettkampferData) {
  try {
    return await apiCall(`/api/wettkaempfer/${wettkampferId}`, {
      method: 'PUT',
      body: JSON.stringify(wettkampferData)
    });
  } catch (error) {
    console.error('API Fehler updateWettkaempfer:', error);
    throw new Error('Fehler beim Aktualisieren des Wettkämpfers!');
  }
}

export async function deleteWettkaempfer(wettkampferId) {
  try {
    return await apiCall(`/api/wettkaempfer/${wettkampferId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('API Fehler deleteWettkaempfer:', error);
    throw new Error('Fehler beim Löschen des Wettkämpfers!');
  }
}

// Debug Funktion (optional)
export function debugTokens() {
  console.log('🔍 VEREINEAPI TOKEN DEBUG:');
  console.log('localStorage.token:', localStorage.getItem('token'));
  console.log('localStorage.authToken:', localStorage.getItem('authToken'));

  try {
    const clubData = JSON.parse(localStorage.getItem('clubData') || '{}');
    console.log('clubData.token:', clubData.token?.substring(0, 30) + '...');
  } catch (error) {
    console.log('clubData.token: Fehler beim Parsen');
  }
}

// Optional: Default-Export als Objekt für Legacy-Importe
const vereineApi = {
  getVereinById,
  getAllVereine,
  getWettkaempferByVerein,
  updateVerein,
  deleteVerein,
  addWettkaempfer,
  updateWettkaempfer,
  deleteWettkaempfer,
  debugTokens,
};

export default vereineApi;