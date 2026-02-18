// frontend/src/components/referee/RefereeManager.jsx
import React, { useState, useEffect } from 'react';
import './RefereeManager.css';

const RefereeManager = ({ turnierId, scheduleId, onAssignmentUpdate }) => {
  const [referees, setReferees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedReferee, setSelectedReferee] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    slot_id: '',
    ring_number: 1,
    role: 'hauptkampfrichter',
    assignment_start: '',
    assignment_end: '',
    qualification_level: 'c_lizenz',
    notes: ''
  });

  const [newAvailability, setNewAvailability] = useState({
    available_date: '',
    start_time: '09:00',
    end_time: '18:00',
    availability_type: 'available',
    max_consecutive_hours: 4,
    break_required_minutes: 30,
    preferred_roles: [],
    restrictions: ''
  });

  const roles = [
    { value: 'hauptkampfrichter', label: 'Hauptkampfrichter' },
    { value: 'seitenkampfrichter', label: 'Seitenkampfrichter' },
    { value: 'punktrichter', label: 'Punktrichter' },
    { value: 'zeitnehmer', label: 'Zeitnehmer' }
  ];

  const qualificationLevels = [
    { value: 'c_lizenz', label: 'C-Lizenz' },
    { value: 'b_lizenz', label: 'B-Lizenz' },
    { value: 'a_lizenz', label: 'A-Lizenz' },
    { value: 'international', label: 'International' }
  ];

  const availabilityTypes = [
    { value: 'available', label: 'Verfügbar' },
    { value: 'preferred', label: 'Bevorzugt' },
    { value: 'limited', label: 'Eingeschränkt' },
    { value: 'unavailable', label: 'Nicht verfügbar' }
  ];

  useEffect(() => {
    if (turnierId) {
      loadReferees();
      loadAssignments();
      loadAvailability();
      if (scheduleId) {
        loadTimeSlots();
      }
    }
  }, [turnierId, scheduleId]);

  const loadReferees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/schedule/referees');
      if (response.ok) {
        const data = await response.json();
        setReferees(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Kampfrichter:', error);
      setError('Kampfrichter konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const response = await fetch(`/api/schedule/tournament/${turnierId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zuteilungen:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await fetch(`/api/schedule/tournament/${turnierId}/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Verfügbarkeiten:', error);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const response = await fetch(`/api/schedule/schedules/${scheduleId}/slots`);
      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zeitslots:', error);
    }
  };

  const handleAssignReferee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const assignmentData = {
        ...newAssignment,
        turnier_id: turnierId,
        schedule_id: scheduleId,
        preferred_roles: JSON.stringify(newAssignment.preferred_roles || [])
      };

      const response = await fetch('/api/schedule/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentData)
      });

      if (response.ok) {
        const assignment = await response.json();
        setAssignments([...assignments, assignment]);
        setShowAssignModal(false);
        resetAssignmentForm();
        if (onAssignmentUpdate) onAssignmentUpdate();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Zuteilung konnte nicht erstellt werden');
      }
    } catch (error) {
      console.error('Fehler beim Zuteilen des Kampfrichters:', error);
      setError('Fehler beim Zuteilen des Kampfrichters');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAvailability = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const availabilityData = {
        ...newAvailability,
        user_id: selectedReferee.id,
        turnier_id: turnierId,
        preferred_roles: JSON.stringify(newAvailability.preferred_roles || [])
      };

      const response = await fetch('/api/schedule/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availabilityData)
      });

      if (response.ok) {
        const availability = await response.json();
        setAvailability([...availability, availability]);
        setShowAvailabilityModal(false);
        resetAvailabilityForm();
        loadAvailability();
      } else {
        setError('Verfügbarkeit konnte nicht gesetzt werden');
      }
    } catch (error) {
      console.error('Fehler beim Setzen der Verfügbarkeit:', error);
      setError('Fehler beim Setzen der Verfügbarkeit');
    } finally {
      setLoading(false);
    }
  };

  const autoAssignReferees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule/schedules/${scheduleId}/auto-assign-referees`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.assignmentsCreated} Kampfrichter automatisch zugeteilt`);
        loadAssignments();
      } else {
        setError('Automatische Zuteilung fehlgeschlagen');
      }
    } catch (error) {
      console.error('Fehler bei automatischer Zuteilung:', error);
      setError('Fehler bei automatischer Zuteilung');
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (assignmentId) => {
    try {
      const response = await fetch(`/api/schedule/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setAssignments(assignments.filter(a => a.assignment_id !== assignmentId));
        if (onAssignmentUpdate) onAssignmentUpdate();
      } else {
        setError('Zuteilung konnte nicht entfernt werden');
      }
    } catch (error) {
      console.error('Fehler beim Entfernen der Zuteilung:', error);
      setError('Fehler beim Entfernen der Zuteilung');
    }
  };

  const resetAssignmentForm = () => {
    setNewAssignment({
      user_id: '',
      slot_id: '',
      ring_number: 1,
      role: 'hauptkampfrichter',
      assignment_start: '',
      assignment_end: '',
      qualification_level: 'c_lizenz',
      notes: ''
    });
  };

  const resetAvailabilityForm = () => {
    setNewAvailability({
      available_date: '',
      start_time: '09:00',
      end_time: '18:00',
      availability_type: 'available',
      max_consecutive_hours: 4,
      break_required_minutes: 30,
      preferred_roles: [],
      restrictions: ''
    });
  };

  const getRefereeAssignments = (refereeId) => {
    return assignments.filter(a => a.user_id === refereeId);
  };

  const getRefereeAvailability = (refereeId) => {
    return availability.filter(a => a.user_id === refereeId);
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('de-DE');
  };

  const getQualificationColor = (level) => {
    const colors = {
      c_lizenz: '#6c757d',
      b_lizenz: '#17a2b8',
      a_lizenz: '#28a745',
      international: '#dc3545'
    };
    return colors[level] || '#6c757d';
  };

  return (
    <div className="referee-manager">
      <div className="referee-header">
        <h3>Kampfrichter-Verwaltung</h3>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAssignModal(true)}
            disabled={!scheduleId}
          >
            Kampfrichter zuteilen
          </button>
          {scheduleId && (
            <button 
              className="btn btn-success"
              onClick={autoAssignReferees}
              disabled={loading}
            >
              Auto-Zuteilung
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading && <div className="loading">Lade Kampfrichter-Daten...</div>}

      <div className="referee-content">
        <div className="referees-list">
          <h4>Verfügbare Kampfrichter</h4>
          {referees.map(referee => {
            const refereeAssignments = getRefereeAssignments(referee.id);
            const refereeAvailability = getRefereeAvailability(referee.id);
            
            return (
              <div key={referee.id} className="referee-card">
                <div className="referee-info">
                  <h5>{referee.name}</h5>
                  <p className="referee-email">{referee.email}</p>
                  {referee.qualification_level && (
                    <span 
                      className="qualification-badge"
                      style={{ backgroundColor: getQualificationColor(referee.qualification_level) }}
                    >
                      {qualificationLevels.find(q => q.value === referee.qualification_level)?.label}
                    </span>
                  )}
                </div>
                
                <div className="referee-stats">
                  <div className="stat">
                    <span className="stat-number">{refereeAssignments.length}</span>
                    <span className="stat-label">Zuteilungen</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{refereeAvailability.length}</span>
                    <span className="stat-label">Verfügbarkeiten</span>
                  </div>
                </div>
                
                <div className="referee-actions">
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => {
                      setSelectedReferee(referee);
                      setShowAvailabilityModal(true);
                    }}
                  >
                    Verfügbarkeit
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {scheduleId && (
          <div className="assignments-list">
            <h4>Aktuelle Zuteilungen</h4>
            {assignments.filter(a => a.schedule_id === parseInt(scheduleId)).map(assignment => (
              <div key={assignment.assignment_id} className="assignment-card">
                <div className="assignment-info">
                  <h6>{assignment.referee_name}</h6>
                  <p><strong>Rolle:</strong> {roles.find(r => r.value === assignment.role)?.label}</p>
                  <p><strong>Ring:</strong> {assignment.ring_number}</p>
                  <p><strong>Zeit:</strong> {formatDateTime(assignment.assignment_start)} - {formatDateTime(assignment.assignment_end)}</p>
                  {assignment.notes && <p><strong>Notizen:</strong> {assignment.notes}</p>}
                </div>
                
                <div className="assignment-actions">
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => removeAssignment(assignment.assignment_id)}
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Referee Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Kampfrichter zuteilen</h4>
              <button onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleAssignReferee}>
              <div className="form-group">
                <label>Kampfrichter</label>
                <select
                  value={newAssignment.user_id}
                  onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})}
                  required
                >
                  <option value="">Kampfrichter auswählen</option>
                  {referees.map(referee => (
                    <option key={referee.id} value={referee.id}>
                      {referee.name} ({referee.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Rolle</label>
                  <select
                    value={newAssignment.role}
                    onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})}
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Ring</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newAssignment.ring_number}
                    onChange={(e) => setNewAssignment({...newAssignment, ring_number: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Zeit</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.assignment_start}
                    onChange={(e) => setNewAssignment({...newAssignment, assignment_start: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Zeit</label>
                  <input
                    type="datetime-local"
                    value={newAssignment.assignment_end}
                    onChange={(e) => setNewAssignment({...newAssignment, assignment_end: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Qualifikation</label>
                <select
                  value={newAssignment.qualification_level}
                  onChange={(e) => setNewAssignment({...newAssignment, qualification_level: e.target.value})}
                >
                  {qualificationLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Notizen</label>
                <textarea
                  value={newAssignment.notes}
                  onChange={(e) => setNewAssignment({...newAssignment, notes: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAssignModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Zuteilen...' : 'Zuteilen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Modal */}
      {showAvailabilityModal && selectedReferee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Verfügbarkeit setzen - {selectedReferee.name}</h4>
              <button onClick={() => setShowAvailabilityModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleSetAvailability}>
              <div className="form-group">
                <label>Datum</label>
                <input
                  type="date"
                  value={newAvailability.available_date}
                  onChange={(e) => setNewAvailability({...newAvailability, available_date: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Start Zeit</label>
                  <input
                    type="time"
                    value={newAvailability.start_time}
                    onChange={(e) => setNewAvailability({...newAvailability, start_time: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>End Zeit</label>
                  <input
                    type="time"
                    value={newAvailability.end_time}
                    onChange={(e) => setNewAvailability({...newAvailability, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Verfügbarkeitstyp</label>
                <select
                  value={newAvailability.availability_type}
                  onChange={(e) => setNewAvailability({...newAvailability, availability_type: e.target.value})}
                >
                  {availabilityTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Max. aufeinanderfolgende Stunden</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newAvailability.max_consecutive_hours}
                    onChange={(e) => setNewAvailability({...newAvailability, max_consecutive_hours: parseInt(e.target.value)})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Pausenzeit (Minuten)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={newAvailability.break_required_minutes}
                    onChange={(e) => setNewAvailability({...newAvailability, break_required_minutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Einschränkungen</label>
                <textarea
                  value={newAvailability.restrictions}
                  onChange={(e) => setNewAvailability({...newAvailability, restrictions: e.target.value})}
                  rows="3"
                  placeholder="Besondere Einschränkungen oder Notizen..."
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAvailabilityModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Speichern...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefereeManager;