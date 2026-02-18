// src/pages/Turniere/KategorienVerwaltenPage.jsx
import React, { useState, useEffect } from 'react';
import Button from '../../components/common/Button';
import KategorieBearbeiten from '../../components/turnier/KategorieBearbeiten';
import KategorieAnlegen from '../../components/turnier/KategorienAnlegen';
import KategorieLoeschen from '../../components/turnier/KategorieLoeschen';
import '../../styles/Dashboard.css';

export default function KategorienVerwaltenPage() {
  const [kategorien, setKategorien] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterGender, setFilterGender] = useState('');

  // Stats für Header
  const [stats, setStats] = useState({
    total: 0,
    byType: [],
    byGender: []
  });

  const fetchKategorien = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Lade Kategorien...');
      
      // Filter-Parameter für API
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterGender) params.append('gender', filterGender);
      
      const url = `/api/divisionen${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error(`Fehler: ${res.status}`);
      
      const responseData = await res.json();
      console.log('📦 API Response:', responseData);
      
      // ✅ Prüfen ob Response das erwartete Format hat
      if (responseData.success && Array.isArray(responseData.data)) {
        const data = responseData.data;
        // Sortierung: Nach Type, dann Name
        data.sort((a, b) => {
          if (a.Division_Type !== b.Division_Type) {
            return a.Division_Type.localeCompare(b.Division_Type);
          }
          return a.Division_Name.localeCompare(b.Division_Name);
        });
        setKategorien(data);
        console.log('✅ Kategorien geladen:', data.length);
        
        // Stats berechnen
        calculateStats(data);
        
      } else if (Array.isArray(responseData)) {
        // ✅ Fallback: Falls direkt Array zurückkommt
        responseData.sort((a, b) => a.Division_Name.localeCompare(b.Division_Name));
        setKategorien(responseData);
        calculateStats(responseData);
        console.log('✅ Kategorien geladen (direktes Array):', responseData.length);
      } else {
        console.error('❌ Unerwartetes Response-Format:', responseData);
        setKategorien([]);
        setStats({ total: 0, byType: [], byGender: [] });
      }
    } catch (e) {
      console.error('❌ Fehler beim Abrufen der Kategorien:', e);
      setError(`Fehler beim Laden der Kategorien: ${e.message}`);
      setKategorien([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const typeStats = {};
    const genderStats = {};
    
    data.forEach(kategorie => {
      // Type Stats
      const type = kategorie.Division_Type || 'Unbekannt';
      typeStats[type] = (typeStats[type] || 0) + 1;
      
      // Gender Stats
      const gender = kategorie.Gender || 'Unbekannt';
      genderStats[gender] = (genderStats[gender] || 0) + 1;
    });
    
    setStats({
      total: data.length,
      byType: Object.entries(typeStats).map(([name, count]) => ({ name, count })),
      byGender: Object.entries(genderStats).map(([name, count]) => ({ name, count }))
    });
  };

  useEffect(() => { 
    fetchKategorien(); 
  }, [filterType, filterGender]); // Neu laden bei Filter-Änderung

  // Unique Werte für Filter-Dropdowns
  const uniqueTypes = [...new Set(kategorien.map(k => k.Division_Type).filter(Boolean))];
  const uniqueGenders = [...new Set(kategorien.map(k => k.Gender).filter(Boolean))];

  if (loading) {
    return (
      <div className="dashboard-panel">
        <h3>Kategorien verwalten</h3>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading"></div>
          <p>Lade Kategorien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-panel">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Kategorien verwalten</h1>
        <p>Wettkampf-Kategorien und Divisionen verwalten</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Gesamt Kategorien</h3>
          <div className="number">{stats.total}</div>
        </div>
        <div className="stat-card">
          <h3>Kategorien-Typen</h3>
          <div className="number">{stats.byType.length}</div>
        </div>
        <div className="stat-card">
          <h3>Gender-Varianten</h3>
          <div className="number">{stats.byGender.length}</div>
        </div>
      </div>

      {/* Filter-Bereich */}
      <div className="form-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div className="form-row">
          <div className="form-group">
            <label>Filter nach Typ:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="form-input"
            >
              <option value="">Alle Typen</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Filter nach Gender:</label>
            <select 
              value={filterGender} 
              onChange={(e) => setFilterGender(e.target.value)}
              className="form-input"
            >
              <option value="">Alle Gender</option>
              {uniqueGenders.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="button-container">
// Ersetze die alert() Aufrufe mit:
<Button onClick={() => setCreateOpen(true)}>Kategorie anlegen</Button>
<Button onClick={() => setEditOpen(true)}>Kategorie bearbeiten</Button>
<Button onClick={() => setDeleteOpen(true)}>Kategorie löschen</Button>
        <Button onClick={fetchKategorien}>🔄 Aktualisieren</Button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{ 
          background: '#ffe6e6', 
          color: '#d32f2f', 
          padding: '15px', 
          borderRadius: '8px',
          margin: '20px 0',
          border: '1px solid #ffcdd2'
        }}>
          <h4>❌ Fehler</h4>
          <p>{error}</p>
          <Button onClick={fetchKategorien} style={{ marginTop: '10px' }}>
            🔄 Erneut versuchen
          </Button>
        </div>
      )}

      {/* Kategorien-Tabelle */}
      {kategorien.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ 
            background: '#fff3cd', 
            color: '#856404', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #ffeaa7'
          }}>
            <h3>📂 Keine Kategorien gefunden</h3>
            <p>Es sind noch keine Kategorien in der Datenbank oder keine entsprechen den Filtern.</p>
            <Button onClick={fetchKategorien} style={{ marginTop: '10px' }}>
              🔄 Aktualisieren
            </Button>
          </div>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Typ</th>
                <th>Altersklasse</th>
                <th>Alter</th>
                <th>Gewicht</th>
                <th>Gender</th>
                <th>Skill Level</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {kategorien.map(kategorie => (
                <tr key={kategorie.Division_Code}>
                  <td><strong>{kategorie.Division_Code}</strong></td>
                  <td>{kategorie.Division_Name}</td>
                  <td>
                    <span style={{ 
                      background: '#8B0000', 
                      color: 'white', 
                      padding: '2px 6px', 
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      {kategorie.Division_Type}
                    </span>
                  </td>
                  <td>{kategorie.Altersklasse || '-'}</td>
                  <td>
                    {kategorie.Age_from && kategorie.Age_to 
                      ? `${kategorie.Age_from}-${kategorie.Age_to}` 
                      : '-'
                    }
                  </td>
                  <td>
                    {kategorie.Minimum_Weight && kategorie.Maximum_Weight 
                      ? `${kategorie.Minimum_Weight}-${kategorie.Maximum_Weight}kg` 
                      : '-'
                    }
                  </td>
                  <td>{kategorie.Gender || '-'}</td>
                  <td>{kategorie.Skill_Level || '-'}</td>
                  <td>{kategorie.Team || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}