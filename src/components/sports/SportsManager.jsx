// frontend/src/components/sports/SportsManager.jsx
import React, { useState, useEffect } from 'react';
import './SportsManager.css';

const SportsManager = ({ onSportSelected }) => {
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [weightClasses, setWeightClasses] = useState([]);
  const [techniques, setTechniques] = useState([]);
  const [rulesets, setRulesets] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    gender: '',
    ageCategory: '',
    techniqueCategory: ''
  });

  useEffect(() => {
    loadSports();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      loadSportDetails();
    }
  }, [selectedSport, activeTab, filters]);

  const loadSports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sports/sports');
      if (response.ok) {
        const data = await response.json();
        setSports(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sportarten:', error);
      setError('Sportarten konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadSportDetails = async () => {
    if (!selectedSport) return;

    try {
      setLoading(true);

      if (activeTab === 'weight-classes') {
        const params = new URLSearchParams();
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.ageCategory) params.append('ageCategory', filters.ageCategory);

        const response = await fetch(`/api/sports/sports/${selectedSport.sport_id}/weight-classes?${params}`);
        if (response.ok) {
          const data = await response.json();
          setWeightClasses(data);
        }
      }

      if (activeTab === 'techniques') {
        const params = new URLSearchParams();
        if (filters.techniqueCategory) params.append('category', filters.techniqueCategory);

        const response = await fetch(`/api/sports/sports/${selectedSport.sport_id}/techniques?${params}`);
        if (response.ok) {
          const data = await response.json();
          setTechniques(data);
        }
      }

      if (activeTab === 'rulesets') {
        const response = await fetch(`/api/sports/sports/${selectedSport.sport_id}/rulesets`);
        if (response.ok) {
          const data = await response.json();
          setRulesets(data);
        }
      }

      if (activeTab === 'athletes') {
        const response = await fetch(`/api/sports/sports/${selectedSport.sport_id}/athletes`);
        if (response.ok) {
          const data = await response.json();
          setAthletes(data);
        }
      }

    } catch (error) {
      console.error('Fehler beim Laden der Sport-Details:', error);
      setError('Sport-Details konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const handleSportSelect = (sport) => {
    setSelectedSport(sport);
    setActiveTab('overview');
    if (onSportSelected) onSportSelected(sport);
  };

  const getSportCategoryIcon = (category) => {
    const icons = {
      striking: '👊',
      grappling: '🤼',
      mixed: '🥋',
      traditional: '🏛️',
      weapons: '⚔️'
    };
    return icons[category] || '🥋';
  };

  const getScoringSystemLabel = (system) => {
    const labels = {
      point_based: 'Punkt-basiert',
      round_based: 'Runden-basiert',
      time_based: 'Zeit-basiert',
      kata_form: 'Kata/Form',
      ippon_system: 'Ippon-System'
    };
    return labels[system] || system;
  };

  const getPointColor = (points) => {
    if (points <= 0) return '#dc3545';
    if (points === 1) return '#28a745';
    if (points === 2) return '#ffc107';
    if (points >= 3) return '#007bff';
    return '#6c757d';
  };

  if (selectedSport) {
    return (
      <div className="sports-manager">
        <div className="sports-header">
          <button 
            className="back-button"
            onClick={() => setSelectedSport(null)}
          >
            ← Zurück zu Sportarten
          </button>
          <div className="sport-title">
            <span className="sport-icon">
              {getSportCategoryIcon(selectedSport.sport_category)}
            </span>
            <h2>{selectedSport.sport_name}</h2>
            <span className="sport-code">{selectedSport.sport_code}</span>
          </div>
        </div>

        <div className="tab-container">
          <button 
            className={activeTab === 'overview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </button>
          <button 
            className={activeTab === 'weight-classes' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('weight-classes')}
          >
            Gewichtsklassen
          </button>
          <button 
            className={activeTab === 'techniques' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('techniques')}
          >
            Techniken
          </button>
          <button 
            className={activeTab === 'rulesets' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('rulesets')}
          >
            Regelsets
          </button>
          <button 
            className={activeTab === 'athletes' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('athletes')}
          >
            Athleten
          </button>
        </div>

        <div className="tab-content">
          {error && (
            <div className="alert alert-danger">
              {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          {loading && <div className="loading">Lade Daten...</div>}

          {activeTab === 'overview' && (
            <div className="sport-overview">
              <div className="info-grid">
                <div className="info-card">
                  <h4>Grundinformationen</h4>
                  <p><strong>Name:</strong> {selectedSport.sport_name}</p>
                  <p><strong>Code:</strong> {selectedSport.sport_code}</p>
                  <p><strong>Verband:</strong> {selectedSport.federation || 'Nicht angegeben'}</p>
                  <p><strong>Kategorie:</strong> {selectedSport.sport_category}</p>
                  <p><strong>Beschreibung:</strong> {selectedSport.description || 'Keine Beschreibung verfügbar'}</p>
                </div>

                <div className="info-card">
                  <h4>Kampfeinstellungen</h4>
                  <p><strong>Kampfdauer:</strong> {selectedSport.default_fight_duration_minutes} Minuten</p>
                  <p><strong>Pausenzeit:</strong> {selectedSport.default_break_duration_seconds || 60} Sekunden</p>
                  <p><strong>Wertungssystem:</strong> {getScoringSystemLabel(selectedSport.scoring_system)}</p>
                  <p><strong>Max. Punkte/Technik:</strong> {selectedSport.max_score_per_technique}</p>
                </div>

                {selectedSport.statistics && (
                  <div className="info-card">
                    <h4>Statistiken</h4>
                    <p><strong>Gewichtsklassen:</strong> {selectedSport.statistics.weight_classes}</p>
                    <p><strong>Techniken:</strong> {selectedSport.statistics.techniques}</p>
                    <p><strong>Regelsets:</strong> {selectedSport.statistics.rulesets}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'weight-classes' && (
            <div className="weight-classes-tab">
              <div className="filters">
                <select 
                  value={filters.gender} 
                  onChange={(e) => setFilters({...filters, gender: e.target.value})}
                >
                  <option value="">Alle Geschlechter</option>
                  <option value="male">Herren</option>
                  <option value="female">Damen</option>
                  <option value="mixed">Mixed</option>
                </select>
                <select 
                  value={filters.ageCategory} 
                  onChange={(e) => setFilters({...filters, ageCategory: e.target.value})}
                >
                  <option value="">Alle Altersgruppen</option>
                  <option value="children">Kinder</option>
                  <option value="cadets">Kadetten</option>
                  <option value="juniors">Junioren</option>
                  <option value="seniors">Senioren</option>
                  <option value="veterans">Veteranen</option>
                </select>
              </div>

              <div className="weight-classes-grid">
                {weightClasses.map(wc => (
                  <div key={wc.weight_class_id} className="weight-class-card">
                    <h5>{wc.class_name}</h5>
                    <div className="weight-range">
                      {wc.min_weight_kg}kg - {wc.max_weight_kg}kg
                    </div>
                    <div className="class-details">
                      <span className="gender">{wc.gender === 'male' ? 'Herren' : wc.gender === 'female' ? 'Damen' : 'Mixed'}</span>
                      <span className="age-category">{wc.age_category}</span>
                    </div>
                    {wc.min_age && wc.max_age && (
                      <div className="age-range">
                        Alter: {wc.min_age}-{wc.max_age} Jahre
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'techniques' && (
            <div className="techniques-tab">
              <div className="filters">
                <select 
                  value={filters.techniqueCategory} 
                  onChange={(e) => setFilters({...filters, techniqueCategory: e.target.value})}
                >
                  <option value="">Alle Kategorien</option>
                  <option value="basic">Grundtechniken</option>
                  <option value="advanced">Fortgeschritten</option>
                  <option value="special">Spezial</option>
                  <option value="penalty">Strafen</option>
                </select>
              </div>

              <div className="techniques-list">
                {techniques.map(tech => (
                  <div key={tech.technique_id} className="technique-card">
                    <div className="technique-header">
                      <h5>{tech.technique_name}</h5>
                      <div 
                        className="points-badge"
                        style={{ backgroundColor: getPointColor(tech.points) }}
                      >
                        {tech.points > 0 ? `+${tech.points}` : tech.points}
                      </div>
                    </div>
                    <div className="technique-details">
                      <span className="category">{tech.category}</span>
                      <span className="code">{tech.technique_code}</span>
                    </div>
                    {tech.description && (
                      <p className="description">{tech.description}</p>
                    )}
                    {tech.execution_requirements && (
                      <div className="requirements">
                        <strong>Ausführung:</strong> {tech.execution_requirements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rulesets' && (
            <div className="rulesets-tab">
              <div className="rulesets-list">
                {rulesets.map(ruleset => (
                  <div key={ruleset.ruleset_id} className="ruleset-card">
                    <div className="ruleset-header">
                      <h5>{ruleset.ruleset_name}</h5>
                      <div className="ruleset-meta">
                        <span className="version">v{ruleset.version}</span>
                        {ruleset.is_default && (
                          <span className="default-badge">Standard</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="ruleset-details">
                      <div className="detail-item">
                        <strong>Kampfdauer:</strong> {ruleset.fight_duration_minutes} Minuten
                      </div>
                      <div className="detail-item">
                        <strong>Runden:</strong> {ruleset.number_of_rounds || 1}
                      </div>
                      {ruleset.break_between_rounds_seconds && (
                        <div className="detail-item">
                          <strong>Rundenpause:</strong> {ruleset.break_between_rounds_seconds} Sekunden
                        </div>
                      )}
                      {ruleset.overtime_duration_minutes && (
                        <div className="detail-item">
                          <strong>Verlängerung:</strong> {ruleset.overtime_duration_minutes} Minuten
                        </div>
                      )}
                      {ruleset.effective_date && (
                        <div className="detail-item">
                          <strong>Gültig ab:</strong> {new Date(ruleset.effective_date).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>

                    {ruleset.winning_conditions && (
                      <div className="conditions">
                        <h6>Gewinnbedingungen:</h6>
                        <pre>{JSON.stringify(JSON.parse(ruleset.winning_conditions), null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'athletes' && (
            <div className="athletes-tab">
              <div className="athletes-list">
                {athletes.map(athlete => (
                  <div key={athlete.profile_id} className="athlete-card">
                    <div className="athlete-header">
                      <h5>{athlete.vorname} {athlete.nachname}</h5>
                      {athlete.belt_rank && (
                        <span className="belt-rank">{athlete.belt_rank}</span>
                      )}
                    </div>
                    
                    <div className="athlete-details">
                      <p><strong>Verein:</strong> {athlete.verein_name || 'Kein Verein'}</p>
                      <p><strong>Geburtsdatum:</strong> {new Date(athlete.geburtsdatum).toLocaleDateString('de-DE')}</p>
                      {athlete.gewicht && (
                        <p><strong>Gewicht:</strong> {athlete.gewicht}kg</p>
                      )}
                      {athlete.preferred_weight_class && (
                        <p><strong>Bevorzugte Klasse:</strong> {athlete.preferred_weight_class}</p>
                      )}
                      {athlete.years_experience && (
                        <p><strong>Erfahrung:</strong> {athlete.years_experience} Jahre</p>
                      )}
                      {athlete.coach_name && (
                        <p><strong>Trainer:</strong> {athlete.coach_name}</p>
                      )}
                      {athlete.dojo_club && (
                        <p><strong>Dojo/Club:</strong> {athlete.dojo_club}</p>
                      )}
                    </div>

                    <div className="medical-info">
                      {athlete.medical_clearance_date && (
                        <span className="medical-clearance">
                          Ärztl. Freigabe: {new Date(athlete.medical_clearance_date).toLocaleDateString('de-DE')}
                        </span>
                      )}
                      {athlete.insurance_valid_until && (
                        <span className="insurance">
                          Versicherung: bis {new Date(athlete.insurance_valid_until).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="sports-manager">
      <div className="sports-header">
        <h2>Multi-Sport Management</h2>
        <p>Verwalten Sie verschiedene Kampfsportarten und deren spezifische Eigenschaften</p>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading && <div className="loading">Lade Sportarten...</div>}

      <div className="sports-grid">
        {sports.map(sport => (
          <div 
            key={sport.sport_id} 
            className="sport-card"
            onClick={() => handleSportSelect(sport)}
          >
            <div className="sport-icon">
              {getSportCategoryIcon(sport.sport_category)}
            </div>
            <h3>{sport.sport_name}</h3>
            <p className="sport-code">{sport.sport_code}</p>
            <div className="sport-meta">
              <span className="category">{sport.sport_category}</span>
              <span className="scoring">{getScoringSystemLabel(sport.scoring_system)}</span>
            </div>
            {sport.federation && (
              <p className="federation">{sport.federation}</p>
            )}
            <div className="sport-stats">
              <span className="duration">{sport.default_fight_duration_minutes}min</span>
              <span className="max-points">Max: {sport.max_score_per_technique}p</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SportsManager;