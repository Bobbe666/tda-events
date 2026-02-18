// frontend/src/components/sports/MultiSportTournamentManager.jsx
import React, { useState, useEffect } from 'react';
import './MultiSportTournamentManager.css';

const MultiSportTournamentManager = ({ onTournamentCreated }) => {
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newTournament, setNewTournament] = useState({
    tournament_name: '',
    tournament_type: 'single_sport',
    primary_sport_id: '',
    organizer: '',
    venue_name: '',
    venue_address: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    max_participants: 100,
    entry_fee_amount: 0,
    entry_fee_currency: 'EUR',
    sports_included: []
  });

  const tournamentTypes = [
    { value: 'single_sport', label: 'Einzelsport-Turnier' },
    { value: 'multi_sport', label: 'Multi-Sport-Turnier' },
    { value: 'open_tournament', label: 'Offenes Turnier' },
    { value: 'championship', label: 'Meisterschaft' }
  ];

  const tournamentStatuses = {
    planning: { label: 'Planung', color: '#6c757d' },
    registration_open: { label: 'Anmeldung offen', color: '#28a745' },
    registration_closed: { label: 'Anmeldung geschlossen', color: '#ffc107' },
    in_progress: { label: 'Läuft', color: '#007bff' },
    completed: { label: 'Abgeschlossen', color: '#6f42c1' },
    cancelled: { label: 'Abgesagt', color: '#dc3545' }
  };

  useEffect(() => {
    loadTournaments();
    loadSports();
  }, []);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sports/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Turniere:', error);
      setError('Turniere konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadSports = async () => {
    try {
      const response = await fetch('/api/sports/sports');
      if (response.ok) {
        const data = await response.json();
        setSports(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sportarten:', error);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Automatisch Hauptsportart zu sports_included hinzufügen
      const sportsIncluded = [...newTournament.sports_included];
      if (!sportsIncluded.find(s => s.sport_id === parseInt(newTournament.primary_sport_id))) {
        sportsIncluded.push({
          sport_id: parseInt(newTournament.primary_sport_id),
          is_primary: true,
          max_participants: newTournament.max_participants,
          entry_fee: newTournament.entry_fee_amount
        });
      }

      const tournamentData = {
        ...newTournament,
        primary_sport_id: parseInt(newTournament.primary_sport_id),
        max_participants: parseInt(newTournament.max_participants),
        entry_fee_amount: parseFloat(newTournament.entry_fee_amount),
        sports_included: sportsIncluded
      };

      const response = await fetch('/api/sports/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tournamentData)
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateModal(false);
        resetForm();
        loadTournaments();
        if (onTournamentCreated) onTournamentCreated(result);
        alert('Multi-Sport-Turnier erfolgreich erstellt!');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Turnier konnte nicht erstellt werden');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Turniers:', error);
      setError('Fehler beim Erstellen des Turniers');
    } finally {
      setLoading(false);
    }
  };

  const addSportToTournament = () => {
    const newSport = {
      sport_id: '',
      is_primary: false,
      max_participants: 50,
      entry_fee: 0,
      specific_rules: {}
    };
    setNewTournament({
      ...newTournament,
      sports_included: [...newTournament.sports_included, newSport]
    });
  };

  const removeSportFromTournament = (index) => {
    const updatedSports = newTournament.sports_included.filter((_, i) => i !== index);
    setNewTournament({
      ...newTournament,
      sports_included: updatedSports
    });
  };

  const updateSportInTournament = (index, field, value) => {
    const updatedSports = [...newTournament.sports_included];
    updatedSports[index] = {
      ...updatedSports[index],
      [field]: field === 'sport_id' || field === 'max_participants' ? parseInt(value) : value
    };
    setNewTournament({
      ...newTournament,
      sports_included: updatedSports
    });
  };

  const resetForm = () => {
    setNewTournament({
      tournament_name: '',
      tournament_type: 'single_sport',
      primary_sport_id: '',
      organizer: '',
      venue_name: '',
      venue_address: '',
      start_date: '',
      end_date: '',
      registration_deadline: '',
      max_participants: 100,
      entry_fee_amount: 0,
      entry_fee_currency: 'EUR',
      sports_included: []
    });
  };

  const getSportName = (sportId) => {
    const sport = sports.find(s => s.sport_id === sportId);
    return sport ? sport.sport_name : 'Unbekannte Sportart';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  return (
    <div className="multi-sport-tournament-manager">
      <div className="manager-header">
        <h2>Multi-Sport Turnier-Verwaltung</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Neues Turnier erstellen
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading && <div className="loading">Lade Turniere...</div>}

      <div className="tournaments-grid">
        {tournaments.map(tournament => (
          <div key={tournament.tournament_id} className="tournament-card">
            <div className="tournament-header">
              <h3>{tournament.tournament_name}</h3>
              <div className="tournament-meta">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: tournamentStatuses[tournament.status]?.color }}
                >
                  {tournamentStatuses[tournament.status]?.label}
                </span>
                <span className="tournament-type">
                  {tournamentTypes.find(t => t.value === tournament.tournament_type)?.label}
                </span>
              </div>
            </div>

            <div className="tournament-info">
              <div className="info-item">
                <strong>Hauptsportart:</strong> {tournament.primary_sport}
              </div>
              <div className="info-item">
                <strong>Veranstalter:</strong> {tournament.organizer || 'Nicht angegeben'}
              </div>
              <div className="info-item">
                <strong>Ort:</strong> {tournament.venue_name || 'Nicht angegeben'}
              </div>
              <div className="info-item">
                <strong>Datum:</strong> {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
              </div>
              {tournament.entry_fee_amount > 0 && (
                <div className="info-item">
                  <strong>Startgeld:</strong> {tournament.entry_fee_amount} {tournament.entry_fee_currency}
                </div>
              )}
            </div>

            <div className="tournament-stats">
              <div className="stat">
                <span className="stat-number">{tournament.sports_count || 0}</span>
                <span className="stat-label">Sportarten</span>
              </div>
              <div className="stat">
                <span className="stat-number">{tournament.max_participants}</span>
                <span className="stat-label">Max. Teilnehmer</span>
              </div>
              <div className="stat">
                <span className="stat-number">{tournament.confirmed_registrations || 0}</span>
                <span className="stat-label">Anmeldungen</span>
              </div>
            </div>

            <div className="tournament-actions">
              <button className="btn btn-outline-primary btn-sm">
                Details
              </button>
              <button className="btn btn-outline-secondary btn-sm">
                Bearbeiten
              </button>
            </div>
          </div>
        ))}
      </div>

      {tournaments.length === 0 && !loading && (
        <div className="empty-state">
          <h4>Keine Turniere vorhanden</h4>
          <p>Erstellen Sie Ihr erstes Multi-Sport-Turnier!</p>
        </div>
      )}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h4>Neues Multi-Sport-Turnier erstellen</h4>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateTournament}>
              <div className="form-section">
                <h5>Grundinformationen</h5>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Turniername</label>
                    <input
                      type="text"
                      value={newTournament.tournament_name}
                      onChange={(e) => setNewTournament({...newTournament, tournament_name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Turniertyp</label>
                    <select
                      value={newTournament.tournament_type}
                      onChange={(e) => setNewTournament({...newTournament, tournament_type: e.target.value})}
                    >
                      {tournamentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Hauptsportart</label>
                    <select
                      value={newTournament.primary_sport_id}
                      onChange={(e) => setNewTournament({...newTournament, primary_sport_id: e.target.value})}
                      required
                    >
                      <option value="">Hauptsportart auswählen</option>
                      {sports.map(sport => (
                        <option key={sport.sport_id} value={sport.sport_id}>
                          {sport.sport_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Veranstalter</label>
                    <input
                      type="text"
                      value={newTournament.organizer}
                      onChange={(e) => setNewTournament({...newTournament, organizer: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h5>Veranstaltungsort & Termine</h5>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Veranstaltungsort</label>
                    <input
                      type="text"
                      value={newTournament.venue_name}
                      onChange={(e) => setNewTournament({...newTournament, venue_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Adresse</label>
                  <textarea
                    value={newTournament.venue_address}
                    onChange={(e) => setNewTournament({...newTournament, venue_address: e.target.value})}
                    rows="2"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Startdatum</label>
                    <input
                      type="date"
                      value={newTournament.start_date}
                      onChange={(e) => setNewTournament({...newTournament, start_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Enddatum</label>
                    <input
                      type="date"
                      value={newTournament.end_date}
                      onChange={(e) => setNewTournament({...newTournament, end_date: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Anmeldeschluss</label>
                    <input
                      type="datetime-local"
                      value={newTournament.registration_deadline}
                      onChange={(e) => setNewTournament({...newTournament, registration_deadline: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h5>Teilnahme & Gebühren</h5>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Max. Teilnehmer</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={newTournament.max_participants}
                      onChange={(e) => setNewTournament({...newTournament, max_participants: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Startgeld</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTournament.entry_fee_amount}
                      onChange={(e) => setNewTournament({...newTournament, entry_fee_amount: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Währung</label>
                    <select
                      value={newTournament.entry_fee_currency}
                      onChange={(e) => setNewTournament({...newTournament, entry_fee_currency: e.target.value})}
                    >
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </div>
                </div>
              </div>

              {newTournament.tournament_type === 'multi_sport' && (
                <div className="form-section">
                  <div className="section-header">
                    <h5>Zusätzliche Sportarten</h5>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary btn-sm"
                      onClick={addSportToTournament}
                    >
                      Sportart hinzufügen
                    </button>
                  </div>

                  {newTournament.sports_included.map((sport, index) => (
                    <div key={index} className="sport-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Sportart</label>
                          <select
                            value={sport.sport_id}
                            onChange={(e) => updateSportInTournament(index, 'sport_id', e.target.value)}
                            required
                          >
                            <option value="">Sportart auswählen</option>
                            {sports.map(s => (
                              <option key={s.sport_id} value={s.sport_id}>
                                {s.sport_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Max. Teilnehmer</label>
                          <input
                            type="number"
                            min="1"
                            value={sport.max_participants}
                            onChange={(e) => updateSportInTournament(index, 'max_participants', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Startgeld</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={sport.entry_fee}
                            onChange={(e) => updateSportInTournament(index, 'entry_fee', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <button 
                            type="button"
                            className="btn btn-outline-danger btn-sm remove-sport"
                            onClick={() => removeSportFromTournament(index)}
                          >
                            Entfernen
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Erstelle...' : 'Turnier erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSportTournamentManager;