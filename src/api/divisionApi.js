// ✅ src/api/divisionApi.js - Vollständige API für Divisionen/Kategorien
import axios from 'axios';

const API_BASE_URL = '/api';

// ✅ Alle Divisionen abrufen
export const getAllDivisionen = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/divisionen`, { params });
    
    if (response.data && response.data.success) {
      return response.data.data || [];
    } else {
      throw new Error(response.data?.error || 'Fehler beim Laden der Divisionen');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Divisionen:', error);
    throw error;
  }
};

// ✅ Einzelne Division abrufen
export const getDivisionById = async (divisionCode) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/divisionen/${divisionCode}`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.error || 'Division nicht gefunden');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Division:', error);
    throw error;
  }
};

// ✅ Neue Division erstellen
export const createDivision = async (divisionData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/divisionen`, divisionData);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Fehler beim Erstellen der Division');
    }
  } catch (error) {
    console.error('Fehler beim Erstellen der Division:', error);
    throw error;
  }
};

// ✅ Division aktualisieren
export const updateDivision = async (divisionCode, divisionData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/divisionen/${divisionCode}`, divisionData);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Fehler beim Aktualisieren der Division');
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Division:', error);
    throw error;
  }
};

// ✅ Division löschen
export const deleteDivision = async (divisionCode) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/divisionen/${divisionCode}`);
    
    if (response.data && response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data?.error || 'Fehler beim Löschen der Division');
    }
  } catch (error) {
    console.error('Fehler beim Löschen der Division:', error);
    throw error;
  }
};

// ✅ Divisionen-Statistiken abrufen
export const getDivisionStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/divisionen/stats`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data?.error || 'Fehler beim Laden der Statistiken');
    }
  } catch (error) {
    console.error('Fehler beim Abrufen der Statistiken:', error);
    throw error;
  }
};

// ✅ Dropdown-Optionen für Kategorien-Erstellung
export const getDivisionOptions = () => {
  return {
    divisionTypes: [
      'Kumite',
      'Formen', 
      'Kickboxen',
      'Selbstverteidigung',
      'Waffen',
      'Freistil'
    ],
    genderOptions: [
      { value: 'male', label: 'Männlich' },
      { value: 'female', label: 'Weiblich' },
      { value: 'male/female', label: 'Männlich/Weiblich' },
      { value: 'mixed', label: 'Gemischt' }
    ],
    skillLevels: [
      'Beginner',
      'Intermediate', 
      'Advanced',
      'Weiß',
      'Gelb',
      'Orange',
      'Grün',
      'Blau',
      'Braun',
      'Schwarz'
    ],
    altersklassen: [
      'Kinder',
      'Jugend',
      'U12',
      'U14',
      'U16',
      'U18',
      'U21',
      'Senioren',
      'Masters',
      'Veteran'
    ]
  };
};

// ✅ Hilfsfunktion: Auto-Code-Generation für neue Kategorien
export const generateDivisionCode = (type, gender, ageFrom, ageTo, weight) => {
  let code = '';
  
  // Typ-Prefix
  if (type === 'Kumite') code += 'K';
  else if (type === 'Formen') code += 'F';
  else if (type === 'Kickboxen') code += 'KB';
  else code += 'X';
  
  // Gender
  if (gender === 'male') code += 'M';
  else if (gender === 'female') code += 'W';
  else code += 'X';
  
  // Alter oder Gewicht
  if (ageFrom && ageTo) {
    code += `${ageFrom}-${ageTo}`;
  } else if (weight) {
    code += weight.toString();
  }
  
  return code;
};

// ✅ Default Export für einfache Imports
export default {
  getAllDivisionen,
  getDivisionById,
  createDivision,
  updateDivision,
  deleteDivision,
  getDivisionStats,
  getDivisionOptions,
  generateDivisionCode
};