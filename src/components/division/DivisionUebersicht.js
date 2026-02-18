// ✅ DivisionUebersicht.js - Hierarchische Filter-Struktur - KORRIGIERTE VERSION
import React, { useState, useEffect } from 'react';
import DivisionCard from './DivisionCard';
import '../../styles/DivisionUebersicht.css';

const DivisionUebersicht = () => {
  const [divisions, setDivisions] = useState([]);
  const [filteredDivisions, setFilteredDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Hierarchische Filter-States
  const [activeMainFilter, setActiveMainFilter] = useState('all');
  const [activeSubFilter, setActiveSubFilter] = useState('all');

  // ✅ ALLE KONSTANTEN UND FUNKTIONEN ZUERST DEFINIEREN

  // Kickboxen-Types
  const kickboxenTypes = React.useMemo(() => [
    'Pointfighting', 
    'Continuous Fighting', 
    'Continous Fighting', // Falls Tippfehler in DB
    'Fullcontact', 
    'Full Contact', // Falls mit Leerzeichen
    'K1'
  ], []);

  // Selbstverteidigung-Types
  const selbstverteidigungtypes = React.useMemo(() => [
    'Selbstverteidigung' // Das ist der echte Division_Type in der DB!
  ], []);

  // Formen-Types
  const formenTypes = React.useMemo(() => [
    'Formen' // Das ist der echte Division_Type in der DB!
  ], []);

  // Sub-Categories
  const kickboxenSubCategories = React.useMemo(() => ({
    'all': 'Alle Kickboxen',
    'Pointfighting': 'Pointfighting',
    'Continuous Fighting': 'Continuous Fighting', 
    'Fullcontact': 'Fullcontact',
    'K1': 'K1'
  }), []);

  const selbstverteidigungtSubCategories = React.useMemo(() => ({
    'all': 'Alle Selbstverteidigung',
    'TSD': 'Team Self Defense (TSD)',
    'RSD': 'Real Self Defense (RSD)', 
    'SD': 'Self Defense (SD)'
  }), []);

  const formenSubCategories = React.useMemo(() => ({
    'all': 'Alle Formen',
    'Black Belt': 'Black Belt Formen',
    'Under Black Belt': 'Under Black Belt Formen', 
    'Waffen': 'Waffen-Formen',
    'Ohne Waffen': 'Formen ohne Waffen'
  }), []);

  // ✅ HILFSFUNKTIONEN
  const isSelbstverteidigungtType = React.useCallback((divisionType) => {
    if (!divisionType) return false;
    return selbstverteidigungtypes.includes(divisionType);
  }, [selbstverteidigungtypes]);

  const isFormenType = React.useCallback((divisionType) => {
    if (!divisionType) return false;
    return formenTypes.includes(divisionType);
  }, [formenTypes]);

  const categorizeFormenCode = React.useCallback((divisionCode) => {
    if (!divisionCode) return null;
    
    // Black Belt Formen (BBF mit Nummern: BBF-107, BBF-61F, etc.)
    if (/^BBF(-\d+)?(F)?$/i.test(divisionCode)) return 'Black Belt';
    
    // Waffen-Formen Pattern (alle mit W-Suffix oder spezielle Codes)
    const waffenPatterns = [
      /^BWP(-\d+)?(w|W)?$/i,  // BWP-221, BWP-221w, etc.
      /^UMW(-\d+)?$/i,        // UMW-201, UMW-202, etc.
      /^WP(-\d+)?(F|w|W)?$/i, // WP-12, WP-12F, WP-209W, etc.
      /^WWP(-\d+)?(w|W)?$/i,  // WWP-209, WWP-209W, etc.
      /^CWP(-\d+)?$/i,        // CWP-45, CWP-46, etc.
      // Team Weapons
      /^(DT|T)(BBW|UBW|MUB)P(-\d+)?$/i, // DTBBWP-1, TBBWP-1, etc.
      /^(DT|T)(U|MU)BWP(-\d+)?$/i       // DTUBWP-1, TMUBWP-1, etc.
    ];
    
    // Zusätzlich: Codes mit W-Suffix sind immer Waffen (z.B. JUBF-230W, KUBF-249W)
    if (divisionCode.toUpperCase().endsWith('W')) return 'Waffen';
    
    if (waffenPatterns.some(pattern => pattern.test(divisionCode))) return 'Waffen';
    
    // Under Black Belt Formen (mit Nummern)
    const underBlackBeltPatterns = [
      /^CUBF(-\d+)?(W)?$/i,  // CUBF-249, CUBF-249W, etc.
      /^JUBF(-\d+)?(W)?$/i,  // JUBF-230, JUBF-230W, etc.
      /^KUBF(-\d+)?(W)?$/i,  // KUBF-249, KUBF-249W, etc.
      /^UBF(-\d+)?(W)?$/i,   // UBF-224, UBF-224W, etc.
      // Team Forms (ohne Waffen)
      /^(DT|T)(BBF|UBF|MUB)F(-\d+)?$/i  // DTBBF-1, TBBF-1, etc.
    ];
    
    // Prüfe Under Black Belt Pattern, aber nur wenn es nicht bereits als Waffe erkannt wurde
    if (underBlackBeltPatterns.some(pattern => pattern.test(divisionCode))) {
      // Nochmal prüfen ob es Waffe ist (W-Suffix)
      if (divisionCode.toUpperCase().endsWith('W')) return 'Waffen';
      return 'Under Black Belt';
    }
    
    return null;
  }, []);

  // ✅ Daten laden
  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/divisionen');
      const result = await response.json();
      
      if (result.success) {
        setDivisions(result.data);
        setFilteredDivisions(result.data);
      } else {
        setError('Fehler beim Laden der Divisionen');
      }
    } catch (err) {
      console.error('Error fetching divisions:', err);
      setError('Netzwerkfehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter-Logik - Hierarchisch
  useEffect(() => {
    let filtered = [...divisions];

    if (activeMainFilter !== 'all') {
      if (activeMainFilter === 'Kickboxen') {
        if (activeSubFilter === 'all') {
          filtered = filtered.filter(div => kickboxenTypes.includes(div.Division_Type));
        } else {
          filtered = filtered.filter(div => div.Division_Type === activeSubFilter);
        }
      } else if (activeMainFilter === 'Selbstverteidigung') {
        if (activeSubFilter === 'all') {
          filtered = filtered.filter(div => isSelbstverteidigungtType(div.Division_Type));
        } else {
          if (activeSubFilter === 'TSD') {
            filtered = filtered.filter(div => div.Division_Code && div.Division_Code.startsWith('TSD'));
          } else if (activeSubFilter === 'RSD') {
            filtered = filtered.filter(div => div.Division_Code && div.Division_Code.startsWith('RSD'));
          } else if (activeSubFilter === 'SD') {
            filtered = filtered.filter(div => div.Division_Code && div.Division_Code.startsWith('SD') && 
                                            !div.Division_Code.startsWith('TSD') && !div.Division_Code.startsWith('RSD'));
          } else {
            filtered = filtered.filter(div => div.Division_Type === activeSubFilter);
          }
        }
      } else if (activeMainFilter === 'Formen') {
        if (activeSubFilter === 'all') {
          filtered = filtered.filter(div => isFormenType(div.Division_Type));
        } else {
          filtered = filtered.filter(div => {
            if (!isFormenType(div.Division_Type)) return false;
            
            const category = categorizeFormenCode(div.Division_Code);
            if (activeSubFilter === 'Black Belt') {
              return category === 'Black Belt';
            } else if (activeSubFilter === 'Under Black Belt') {
              return category === 'Under Black Belt';
            } else if (activeSubFilter === 'Waffen') {
              return category === 'Waffen';
            } else if (activeSubFilter === 'Ohne Waffen') {
              return category === 'Black Belt' || category === 'Under Black Belt';
            }
            return false;
          });
        }
      } else {
        filtered = filtered.filter(div => div.Division_Type === activeMainFilter);
      }
    }

    setFilteredDivisions(filtered);
  }, [divisions, activeMainFilter, activeSubFilter, kickboxenTypes, isSelbstverteidigungtType, isFormenType, categorizeFormenCode]);

  // ✅ Hauptfilter ändern
  const handleMainFilterChange = (filter) => {
    setActiveMainFilter(filter);
    setActiveSubFilter('all');
  };

  // ✅ Sub-Filter ändern
  const handleSubFilterChange = (filter) => {
    setActiveSubFilter(filter);
  };

  // ✅ Alle Filter zurücksetzen
  const resetFilters = () => {
    setActiveMainFilter('all');
    setActiveSubFilter('all');
  };

  // ✅ Verfügbare Hauptkategorien
  const getAvailableMainCategories = React.useCallback(() => {
    const availableTypes = [...new Set(divisions.map(div => div.Division_Type))];
    
    const filteredTypes = availableTypes.filter(type => 
      !kickboxenTypes.includes(type) && 
      !isSelbstverteidigungtType(type) && 
      !isFormenType(type)
    );
    
    const hasKickboxenTypes = availableTypes.some(type => kickboxenTypes.includes(type));
    const hasSelbstverteidigungtypes = availableTypes.some(type => isSelbstverteidigungtType(type));
    const hasFormenTypes = availableTypes.some(type => isFormenType(type));
    
    const mainCats = [...filteredTypes];
    if (hasKickboxenTypes) mainCats.push('Kickboxen');
    if (hasSelbstverteidigungtypes) mainCats.push('Selbstverteidigung');
    if (hasFormenTypes) mainCats.push('Formen');

    return mainCats.sort();
  }, [divisions, kickboxenTypes, isSelbstverteidigungtType, isFormenType]);

  // ✅ Verfügbare Kickboxen-Unterkategorien
  const getAvailableKickboxenSubs = React.useCallback(() => {
    return divisions
      .filter(div => kickboxenTypes.includes(div.Division_Type))
      .map(div => div.Division_Type)
      .filter((type, index, arr) => arr.indexOf(type) === index)
      .sort();
  }, [divisions, kickboxenTypes]);

  // ✅ Verfügbare Selbstverteidigung-Unterkategorien
  const getAvailableSelbstverteidigungtSubs = React.useCallback(() => {
    const svDivisions = divisions.filter(div => isSelbstverteidigungtType(div.Division_Type));
    
    const hasTypes = {
      TSD: svDivisions.some(div => div.Division_Code && div.Division_Code.startsWith('TSD')),
      RSD: svDivisions.some(div => div.Division_Code && div.Division_Code.startsWith('RSD')), 
      SD: svDivisions.some(div => div.Division_Code && div.Division_Code.startsWith('SD') && 
                                  !div.Division_Code.startsWith('TSD') && !div.Division_Code.startsWith('RSD'))
    };
    
    const subCategories = [];
    if (hasTypes.TSD) subCategories.push('TSD');
    if (hasTypes.RSD) subCategories.push('RSD');
    if (hasTypes.SD) subCategories.push('SD');
    
    return subCategories.sort();
  }, [divisions, isSelbstverteidigungtType]);

  // ✅ Verfügbare Formen-Unterkategorien
  const getAvailableFormenSubs = React.useCallback(() => {
    const formenDivisions = divisions.filter(div => isFormenType(div.Division_Type));
    
    const hasCategories = {
      'Black Belt': formenDivisions.some(div => categorizeFormenCode(div.Division_Code) === 'Black Belt'),
      'Under Black Belt': formenDivisions.some(div => categorizeFormenCode(div.Division_Code) === 'Under Black Belt'),
      'Waffen': formenDivisions.some(div => categorizeFormenCode(div.Division_Code) === 'Waffen'),
      'Ohne Waffen': formenDivisions.some(div => {
        const cat = categorizeFormenCode(div.Division_Code);
        return cat === 'Black Belt' || cat === 'Under Black Belt';
      })
    };
    
    const subCategories = [];
    if (hasCategories['Black Belt']) subCategories.push('Black Belt');
    if (hasCategories['Under Black Belt']) subCategories.push('Under Black Belt');
    if (hasCategories['Waffen']) subCategories.push('Waffen');
    if (hasCategories['Ohne Waffen']) subCategories.push('Ohne Waffen');
    
    return subCategories;
  }, [divisions, isFormenType, categorizeFormenCode]);

  // ✅ DEBUG
  useEffect(() => {
    if (divisions.length > 0) {
      const availableTypes = [...new Set(divisions.map(div => div.Division_Type))];
      console.log('🔍 Verfügbare Division Types:', availableTypes);
      
      const formenDivs = divisions.filter(div => isFormenType(div.Division_Type));
      console.log('🎯 Formen gefunden:', formenDivs.length);
      console.log('🎯 Formen Codes Beispiele:', [...new Set(formenDivs.slice(0, 10).map(div => div.Division_Code))]);
    }
  }, [divisions, isFormenType]);

  if (loading) {
    return (
      <div className="division-uebersicht">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Lade Divisionen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="division-uebersicht">
        <div className="error-container">
          <h2>❌ Fehler</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchDivisions}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const availableMainCategories = getAvailableMainCategories();
  const availableKickboxenSubs = getAvailableKickboxenSubs();
  const availableSelbstverteidigungtSubs = getAvailableSelbstverteidigungtSubs();
  const availableFormenSubs = getAvailableFormenSubs();

  return (
    <div className="division-uebersicht">
      <h1>🥋 Divisions-Übersicht</h1>
      
      {/* ✅ Hauptfilter-Bar */}
      <div className="filter-bar">
        <button
          className={activeMainFilter === 'all' ? 'active' : ''}
          onClick={() => handleMainFilterChange('all')}
        >
          🔍 Alle Kategorien
        </button>
        
        {availableMainCategories.map(category => (
          <button
            key={category}
            className={activeMainFilter === category ? 'active' : ''}
            onClick={() => handleMainFilterChange(category)}
          >
            {category === 'Kickboxen' ? '🥊' : 
             category === 'Formen' ? '🎯' :
             category === 'Kumite' ? '⚔️' :
             category === 'Selbstverteidigung' ? '🛡️' :
             category === 'Grappling' ? '🤼' :
             category === 'Bruchtest' ? '🧱' : '🥋'} {category}
          </button>
        ))}
      </div>

      {/* ✅ Kickboxen Sub-Filter */}
      {activeMainFilter === 'Kickboxen' && availableKickboxenSubs.length > 0 && (
        <div className="sub-filter-bar">
          <button
            className={activeSubFilter === 'all' ? 'active' : ''}
            onClick={() => handleSubFilterChange('all')}
          >
            📋 Alle Kickboxen
          </button>
          
          {availableKickboxenSubs.map(subCategory => (
            <button
              key={subCategory}
              className={activeSubFilter === subCategory ? 'active' : ''}
              onClick={() => handleSubFilterChange(subCategory)}
            >
              {subCategory === 'Pointfighting' ? '👊' :
               subCategory === 'Continuous Fighting' ? '⚡' :
               subCategory === 'Fullcontact' ? '💥' :
               subCategory === 'K1' ? '🔥' : '🥊'} {subCategory}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Formen Sub-Filter */}
      {activeMainFilter === 'Formen' && availableFormenSubs.length > 0 && (
        <div className="sub-filter-bar">
          <button
            className={activeSubFilter === 'all' ? 'active' : ''}
            onClick={() => handleSubFilterChange('all')}
          >
            📋 Alle Formen
          </button>
          
          {availableFormenSubs.map(subCategory => (
            <button
              key={subCategory}
              className={activeSubFilter === subCategory ? 'active' : ''}
              onClick={() => handleSubFilterChange(subCategory)}
            >
              {subCategory === 'Black Belt' ? '🥋' :
               subCategory === 'Under Black Belt' ? '🟡' :
               subCategory === 'Waffen' ? '⚔️' :
               subCategory === 'Ohne Waffen' ? '🎯' : '📋'} {formenSubCategories[subCategory] || subCategory}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Selbstverteidigung Sub-Filter */}
      {activeMainFilter === 'Selbstverteidigung' && availableSelbstverteidigungtSubs.length > 0 && (
        <div className="sub-filter-bar">
          <button
            className={activeSubFilter === 'all' ? 'active' : ''}
            onClick={() => handleSubFilterChange('all')}
          >
            📋 Alle Selbstverteidigung
          </button>
          
          {availableSelbstverteidigungtSubs.map(subCategory => (
            <button
              key={subCategory}
              className={activeSubFilter === subCategory ? 'active' : ''}
              onClick={() => handleSubFilterChange(subCategory)}
            >
              {subCategory === 'TSD' ? '👥' :
               subCategory === 'RSD' ? '🥷' :
               subCategory === 'SD' ? '🛡️' : '🛡️'} {selbstverteidigungtSubCategories[subCategory] || subCategory}
            </button>
          ))}
        </div>
      )}

      {/* ✅ Aktive Filter-Anzeige */}
      {(activeMainFilter !== 'all' || activeSubFilter !== 'all') && (
        <div className="active-filters">
          <span className="filter-label">Aktive Filter:</span>
          {activeMainFilter !== 'all' && (
            <span className="filter-tag">
              {activeMainFilter}
              {(activeMainFilter === 'Kickboxen' || activeMainFilter === 'Selbstverteidigung' || activeMainFilter === 'Formen') && activeSubFilter !== 'all' && ` → ${activeSubFilter}`}
            </span>
          )}
          <button className="clear-filters" onClick={resetFilters}>
            ✖️ Filter zurücksetzen
          </button>
        </div>
      )}

      {/* ✅ Ergebnisse-Counter */}
      <div className="results-info">
        <p>
          {filteredDivisions.length} von {divisions.length} Divisionen
          {activeMainFilter !== 'all' && (
            <span className="filter-info">
              {(activeMainFilter === 'Kickboxen' || activeMainFilter === 'Selbstverteidigung' || activeMainFilter === 'Formen') && activeSubFilter !== 'all' 
                ? ` (${activeMainFilter} → ${activeSubFilter})`
                : ` (${activeMainFilter})`
              }
            </span>
          )}
        </p>
      </div>

      {/* ✅ Divisions-Liste */}
      {filteredDivisions.length > 0 ? (
        <div className="division-list">
          {filteredDivisions.map(division => (
            <DivisionCard key={division.Division_Code} division={division} />
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>🔍 Keine Ergebnisse</h3>
          <p>
            {activeMainFilter !== 'all' 
              ? `Keine Divisionen für "${activeMainFilter}"${activeSubFilter !== 'all' ? ` → ${activeSubFilter}` : ''} gefunden.`
              : 'Keine Divisionen verfügbar.'
            }
          </p>
          {(activeMainFilter !== 'all' || activeSubFilter !== 'all') && (
            <button className="show-all-btn" onClick={resetFilters}>
              🔍 Alle Divisionen anzeigen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DivisionUebersicht;