import React, { useState, useEffect } from 'react';
import './WettkaempferRegistrieren.css';
import API_CONFIG from '../../config/api';

function WettkaempferRegistrieren() {
  const [activeTab, setActiveTab] = useState('profil');
  const [registrationData, setRegistrationData] = useState({
    // Profil-Daten
    profil: {
      vorname: '',
      nachname: '',
      email: '',
      telefon: '',
      geburtsdatum: '',
      geschlecht: '',
      adresse: {
        strasse: '',
        plz: '',
        ort: '',
        land: 'Deutschland'
      }
    },
    // Divisionen-Daten
    divisionen: [],
    // Warenkorb-Daten
    warenkorb: {
      items: [],
      gesamtpreis: 0
    },
    // Meine Divisionen
    meineDivisionen: []
  });

  const tabs = [
    { id: 'profil', label: 'Profil', icon: '👤' },
    { id: 'divisionen', label: 'Divisionen', icon: '🥋' },
    { id: 'warenkorb', label: 'Warenkorb', icon: '🛒' },
    { id: 'meine-divisionen', label: 'Übersicht', icon: '📋' }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleDataChange = (section, field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedDataChange = (section, parentField, field, value) => {
    setRegistrationData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentField]: {
          ...prev[section][parentField],
          [field]: value
        }
      }
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profil':
        return <ProfilTab data={registrationData.profil} onChange={handleDataChange} onNestedChange={handleNestedDataChange} />;
      case 'divisionen':
        return <DivisionenTab data={registrationData.divisionen} onChange={handleDataChange} />;
      case 'warenkorb':
        return <WarenkorbTab data={registrationData.warenkorb} onChange={handleDataChange} />;
      case 'meine-divisionen':
        return <MeineDivisionenTab data={registrationData.meineDivisionen} onChange={handleDataChange} />;
      default:
        return <ProfilTab data={registrationData.profil} onChange={handleDataChange} onNestedChange={handleNestedDataChange} />;
    }
  };

  return (
    <div className="wettkaempfer-registrieren">
      <div className="registration-header">
        <h2>📝 Wettkämpfer registrieren</h2>
        <p>Registrieren Sie einen neuen Wettkämpfer in mehreren Schritten</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="registration-navigation">
        <button 
          className="nav-button prev"
          disabled={activeTab === 'profil'}
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1].id);
            }
          }}
        >
          ← Zurück
        </button>
        
        <div className="step-indicator">
          Schritt {tabs.findIndex(tab => tab.id === activeTab) + 1} von {tabs.length}
        </div>
        
        <button 
          className="nav-button next"
          disabled={activeTab === 'meine-divisionen'}
          onClick={() => {
            const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
            if (currentIndex < tabs.length - 1) {
              setActiveTab(tabs[currentIndex + 1].id);
            }
          }}
        >
          Weiter →
        </button>
      </div>
    </div>
  );
}

// Profil Tab Component
function ProfilTab({ data, onChange, onNestedChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const selectAthlete = (athlete) => {
    setSelectedAthlete(athlete);
    setSearchTerm(`${athlete.vorname} ${athlete.nachname}`);
    setSearchResults([]);
    setShowSearch(false);
    
    // Formulardaten mit gefundenen Daten füllen
    onChange({
      ...data,
      vorname: athlete.vorname,
      nachname: athlete.nachname,
      geschlecht: athlete.geschlecht,
      geburtsdatum: athlete.geburtsdatum,
      gewicht: athlete.gewicht,
      skill_level: athlete.skill_level,
      gurtfarbe: athlete.gurtfarbe,
      kampfstil: athlete.kampfstil,
      email: athlete.email,
      handy: athlete.handy
    });
  };

  const handleSearch = async (term) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_CONFIG.wettkaempfer.search(term), {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🔍 Suchresultat:', result);
        
        // Verschiedene API-Response-Formate handhaben
        let sportler = [];
        if (result.success && result.data) {
          sportler = result.data;
        } else if (Array.isArray(result)) {
          sportler = result;
        } else if (result.sportler) {
          sportler = result.sportler;
        }
        
        setSearchResults(Array.isArray(sportler) ? sportler : []);
      } else {
        console.error('API-Fehler:', response.status, response.statusText);
        // Fallback: Demo-Daten für Testzwecke
        const demoResults = [
          {
            id: 1,
            vorname: 'Max',
            nachname: 'Mustermann',
            email: 'max.mustermann@email.com',
            telefon: '+49 123 456789',
            geburtsdatum: '1990-05-15',
            geschlecht: 'männlich',
            strasse: 'Musterstraße 123',
            plz: '12345',
            ort: 'Musterstadt',
            land: 'Deutschland',
            verein_name: 'Demo Verein'
          },
          {
            id: 2,
            vorname: 'Anna',
            nachname: 'Müller',
            email: 'anna.mueller@email.com',
            telefon: '+49 987 654321',
            geburtsdatum: '1995-08-22',
            geschlecht: 'weiblich',
            strasse: 'Beispielweg 456',
            plz: '54321',
            ort: 'Beispielstadt',
            land: 'Deutschland',
            verein_name: 'Test Verein'
          }
        ];
        
        // Filtere Demo-Daten basierend auf Suchterm
        const filteredResults = demoResults.filter(sportler => 
          sportler.vorname.toLowerCase().includes(term.toLowerCase()) ||
          sportler.nachname.toLowerCase().includes(term.toLowerCase()) ||
          sportler.email.toLowerCase().includes(term.toLowerCase())
        );
        
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Fehler bei der Suche:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      handleSearch(term);
    }, 300); // 300ms delay
    
    setSearchTimeout(timeout);
  };

  const selectSportler = (sportler) => {
    // Sportler-Daten in das Formular übernehmen
    onChange('profil', 'vorname', sportler.vorname || '');
    onChange('profil', 'nachname', sportler.nachname || '');
    onChange('profil', 'email', sportler.email || '');
    onChange('profil', 'telefon', sportler.telefon || '');
    onChange('profil', 'geburtsdatum', sportler.geburtsdatum || '');
    onChange('profil', 'geschlecht', sportler.geschlecht || '');

    // Adresse falls vorhanden
    if (sportler.adresse || sportler.strasse) {
      onNestedChange('profil', 'adresse', 'strasse', sportler.adresse || sportler.strasse || '');
      onNestedChange('profil', 'adresse', 'plz', sportler.plz || '');
      onNestedChange('profil', 'adresse', 'ort', sportler.ort || '');
      onNestedChange('profil', 'adresse', 'land', sportler.land || 'Deutschland');
    }

    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="profil-tab">
      <h3>👤 Persönliche Daten</h3>

      {/* Suchfunktion */}
      <div className="search-section">
        <div className="search-header">
          <button
            type="button"
            className="search-toggle-btn"
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍 Vorhandenen Sportler suchen
          </button>
        </div>

        {showSearch && (
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Namen eingeben (min. 2 Zeichen)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {isSearching && <span className="search-loading">🔄</span>}
            </div>

            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((sportler) => (
                  <div
                    key={sportler.wettkaempfer_id || sportler.id}
                    className="search-result-item"
                    onClick={() => selectAthlete(sportler)}
                  >
                    <div className="sportler-info">
                      <div className="sportler-name">
                        {sportler.vorname} {sportler.nachname}
                        {sportler.geschlecht && (
                          <span className="gender-badge">
                            {sportler.geschlecht === 'männlich' || sportler.geschlecht === 'male' ? '♂' : '♀'}
                          </span>
                        )}
                      </div>
                      <div className="sportler-details">
                        <div className="detail-row">
                          {sportler.geburtsdatum && (
                            <span className="detail-item">
                              🎂 {calculateAge(sportler.geburtsdatum)} Jahre
                            </span>
                          )}
                          {sportler.gewicht && (
                            <span className="detail-item">
                              ⚖️ {sportler.gewicht} kg
                            </span>
                          )}
                          {sportler.skill_level && (
                            <span className="detail-item">
                              🥋 {sportler.skill_level}
                            </span>
                          )}
                        </div>
                        <div className="detail-row">
                          {sportler.gurtfarbe && (
                            <span className="detail-item">
                              🎗️ {sportler.gurtfarbe}
                            </span>
                          )}
                          {sportler.kampfstil && (
                            <span className="detail-item">
                              🥊 {sportler.kampfstil}
                            </span>
                          )}
                        </div>
                        <div className="detail-row">
                          {sportler.email && (
                            <span className="detail-item">
                              📧 {sportler.email}
                            </span>
                          )}
                          {sportler.handy && (
                            <span className="detail-item">
                              📱 {sportler.handy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && searchResults.length === 0 && !isSearching && (
              <div className="no-results">
                Keine Sportler gefunden für "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="vorname">Vorname *</label>
          <input
            type="text"
            id="vorname"
            value={data.vorname}
            onChange={(e) => onChange('profil', 'vorname', e.target.value)}
            placeholder="Max"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="nachname">Nachname *</label>
          <input
            type="text"
            id="nachname"
            value={data.nachname}
            onChange={(e) => onChange('profil', 'nachname', e.target.value)}
            placeholder="Mustermann"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">E-Mail *</label>
          <input
            type="email"
            id="email"
            value={data.email}
            onChange={(e) => onChange('profil', 'email', e.target.value)}
            placeholder="max.mustermann@email.com"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="telefon">Telefon</label>
          <input
            type="tel"
            id="telefon"
            value={data.telefon}
            onChange={(e) => onChange('profil', 'telefon', e.target.value)}
            placeholder="+49 123 456789"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="geburtsdatum">Geburtsdatum *</label>
          <input
            type="date"
            id="geburtsdatum"
            value={data.geburtsdatum}
            onChange={(e) => onChange('profil', 'geburtsdatum', e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="geschlecht">Geschlecht *</label>
          <select
            id="geschlecht"
            value={data.geschlecht}
            onChange={(e) => onChange('profil', 'geschlecht', e.target.value)}
            required
          >
            <option value="">Bitte wählen</option>
            <option value="männlich">♂ Männlich</option>
            <option value="weiblich">♀ Weiblich</option>
            <option value="divers">⚧ Divers</option>
          </select>
        </div>
      </div>
      
      <div className="address-section">
        <h4>🏠 Adresse</h4>
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="strasse">Straße und Hausnummer</label>
            <input
              type="text"
              id="strasse"
              value={data.adresse.strasse}
              onChange={(e) => onNestedChange('profil', 'adresse', 'strasse', e.target.value)}
              placeholder="Musterstraße 123"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="plz">PLZ</label>
            <input
              type="text"
              id="plz"
              value={data.adresse.plz}
              onChange={(e) => onNestedChange('profil', 'adresse', 'plz', e.target.value)}
              placeholder="12345"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ort">Ort</label>
            <input
              type="text"
              id="ort"
              value={data.adresse.ort}
              onChange={(e) => onNestedChange('profil', 'adresse', 'ort', e.target.value)}
              placeholder="Musterstadt"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="land">Land</label>
            <select
              id="land"
              value={data.adresse.land}
              onChange={(e) => onNestedChange('profil', 'adresse', 'land', e.target.value)}
            >
              <option value="Deutschland">🇩🇪 Deutschland</option>
              <option value="Österreich">🇦🇹 Österreich</option>
              <option value="Schweiz">🇨🇭 Schweiz</option>
              <option value="Andere">🌍 Andere</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// Divisionen Tab Component
function DivisionenTab({ data, onChange }) {
  const availableDivisionen = [
    { id: 1, name: 'Kata Einzel', kategorie: 'Kata', alter: '12-17', geschlecht: 'Männlich', preis: 25 },
    { id: 2, name: 'Kata Einzel', kategorie: 'Kata', alter: '12-17', geschlecht: 'Weiblich', preis: 25 },
    { id: 3, name: 'Kumite Einzel', kategorie: 'Kumite', alter: '12-17', geschlecht: 'Männlich', preis: 30 },
    { id: 4, name: 'Kumite Einzel', kategorie: 'Kumite', alter: '12-17', geschlecht: 'Weiblich', preis: 30 },
    { id: 5, name: 'Kata Team', kategorie: 'Kata', alter: '12-17', geschlecht: 'Gemischt', preis: 50 },
    { id: 6, name: 'Kumite Team', kategorie: 'Kumite', alter: '12-17', geschlecht: 'Gemischt', preis: 60 }
  ];

  const handleDivisionToggle = (division) => {
    const isSelected = data.some(d => d.id === division.id);
    if (isSelected) {
      onChange('divisionen', '', data.filter(d => d.id !== division.id));
    } else {
      onChange('divisionen', '', [...data, division]);
    }
  };

  return (
    <div className="divisionen-tab">
      <h3>🥋 Divisionen auswählen</h3>
      <p>Wählen Sie die Divisionen aus, an denen der Wettkämpfer teilnehmen möchte:</p>
      
      <div className="divisionen-grid">
        {availableDivisionen.map((division) => {
          const isSelected = data.some(d => d.id === division.id);
          return (
            <div
              key={division.id}
              className={`division-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleDivisionToggle(division)}
            >
              <div className="division-header">
                <h4>{division.name}</h4>
                <span className="division-price">{division.preis}€</span>
              </div>
              <div className="division-details">
                <span className="division-category">📋 {division.kategorie}</span>
                <span className="division-age">🎂 {division.alter} Jahre</span>
                <span className="division-gender">👥 {division.geschlecht}</span>
              </div>
              {isSelected && (
                <div className="division-selected">
                  ✅ Ausgewählt
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="divisionen-summary">
        <h4>📊 Zusammenfassung</h4>
        <p>Ausgewählte Divisionen: {data.length}</p>
        <p>Gesamtpreis: {data.reduce((sum, d) => sum + d.preis, 0)}€</p>
      </div>
    </div>
  );
}

// Warenkorb Tab Component
function WarenkorbTab({ data, onChange }) {
  const warenkorbItems = [
    { id: 1, name: 'Startgebühr', preis: 15, beschreibung: 'Grundgebühr für die Teilnahme' },
    { id: 2, name: 'T-Shirt', preis: 25, beschreibung: 'Offizielles Turnier-T-Shirt' },
    { id: 3, name: 'Medaille', preis: 10, beschreibung: 'Teilnahme-Medaille' },
    { id: 4, name: 'Urkunde', preis: 5, beschreibung: 'Digitale Teilnahme-Urkunde' }
  ];

  const handleItemToggle = (item) => {
    const isSelected = data.items.some(i => i.id === item.id);
    let newItems;
    if (isSelected) {
      newItems = data.items.filter(i => i.id !== item.id);
    } else {
      newItems = [...data.items, item];
    }
    
    const gesamtpreis = newItems.reduce((sum, i) => sum + i.preis, 0);
    onChange('warenkorb', 'items', newItems);
    onChange('warenkorb', 'gesamtpreis', gesamtpreis);
  };

  return (
    <div className="warenkorb-tab">
      <h3>🛒 Mein Warenkorb</h3>
      <p>Wählen Sie zusätzliche Artikel für den Wettkämpfer:</p>
      
      <div className="warenkorb-grid">
        {warenkorbItems.map((item) => {
          const isSelected = data.items.some(i => i.id === item.id);
          return (
            <div
              key={item.id}
              className={`warenkorb-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleItemToggle(item)}
            >
              <div className="item-header">
                <h4>{item.name}</h4>
                <span className="item-price">{item.preis}€</span>
              </div>
              <p className="item-description">{item.beschreibung}</p>
              {isSelected && (
                <div className="item-selected">
                  ✅ Im Warenkorb
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="warenkorb-summary">
        <h4>💰 Warenkorb-Zusammenfassung</h4>
        <div className="summary-items">
          {data.items.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.name}</span>
              <span>{item.preis}€</span>
            </div>
          ))}
        </div>
        <div className="summary-total">
          <strong>Gesamt: {data.gesamtpreis}€</strong>
        </div>
      </div>
    </div>
  );
}

// Meine Divisionen Tab Component
function MeineDivisionenTab({ data, onChange }) {
  return (
    <div className="meine-divisionen-tab">
      <h3>📋 Meine Division/en</h3>
      <p>Übersicht über alle ausgewählten Divisionen und Zusatzartikel:</p>
      
      <div className="final-summary">
        <div className="summary-section">
          <h4>🥋 Ausgewählte Divisionen</h4>
          {data.length > 0 ? (
            <div className="divisionen-list">
              {data.map((division, index) => (
                <div key={index} className="division-item">
                  <span className="division-name">{division.name}</span>
                  <span className="division-price">{division.preis}€</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items">Keine Divisionen ausgewählt</p>
          )}
        </div>
        
        <div className="summary-section">
          <h4>🛒 Zusatzartikel</h4>
          <p className="no-items">Warenkorb-Artikel werden hier angezeigt</p>
        </div>
        
        <div className="summary-section">
          <h4>💰 Gesamtkosten</h4>
          <div className="total-cost">
            <span>Divisionen: {data.reduce((sum, d) => sum + d.preis, 0)}€</span>
            <span>Zusatzartikel: 0€</span>
            <span className="final-total">
              <strong>Gesamt: {data.reduce((sum, d) => sum + d.preis, 0)}€</strong>
            </span>
          </div>
        </div>
      </div>
      
      <div className="registration-actions">
        <button className="btn-secondary">
          📄 Vorschau drucken
        </button>
        <button className="btn-primary">
          ✅ Registrierung abschließen
        </button>
      </div>
    </div>
  );
}

export default WettkaempferRegistrieren;
