// frontend/src/components/schedule/ScheduleManager.jsx
import React, { useState, useEffect } from 'react';
import './ScheduleManager.css';

const ScheduleManager = ({ turnierId, onScheduleUpdate }) => {
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [newSchedule, setNewSchedule] = useState({
    schedule_name: '',
    schedule_date: '',
    start_time: '09:00',
    end_time: '18:00',
    template_id: '',
    venue_info: {
      venue_name: '',
      address: '',
      rings: 2,
      facilities: []
    },
    notes: ''
  });

  useEffect(() => {
    if (turnierId) {
      loadSchedules();
      loadTemplates();
    }
  }, [turnierId]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule/tournament/${turnierId}/schedules`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zeitpläne:', error);
      setError('Zeitpläne konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/schedule/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Templates:', error);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const scheduleData = {
        ...newSchedule,
        turnier_id: turnierId,
        venue_info: JSON.stringify(newSchedule.venue_info)
      };

      const response = await fetch('/api/schedule/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData)
      });

      if (response.ok) {
        const createdSchedule = await response.json();
        setSchedules([...schedules, createdSchedule]);
        setShowCreateModal(false);
        setNewSchedule({
          schedule_name: '',
          schedule_date: '',
          start_time: '09:00',
          end_time: '18:00',
          template_id: '',
          venue_info: {
            venue_name: '',
            address: '',
            rings: 2,
            facilities: []
          },
          notes: ''
        });
        if (onScheduleUpdate) onScheduleUpdate();
      } else {
        setError('Zeitplan konnte nicht erstellt werden');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Zeitplans:', error);
      setError('Fehler beim Erstellen des Zeitplans');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/schedule/schedules/${scheduleId}/generate-slots`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${result.slotsCreated} Zeitslots erfolgreich generiert`);
        loadSchedules();
      } else {
        setError('Zeitslots konnten nicht generiert werden');
      }
    } catch (error) {
      console.error('Fehler beim Generieren der Zeitslots:', error);
      setError('Fehler beim Generieren der Zeitslots');
    } finally {
      setLoading(false);
    }
  };

  const publishSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`/api/schedule/schedules/${scheduleId}/publish`, {
        method: 'PUT'
      });

      if (response.ok) {
        loadSchedules();
        alert('Zeitplan wurde veröffentlicht');
      } else {
        setError('Zeitplan konnte nicht veröffentlicht werden');
      }
    } catch (error) {
      console.error('Fehler beim Veröffentlichen:', error);
      setError('Fehler beim Veröffentlichen');
    }
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: '#6c757d',
      published: '#007bff',
      active: '#28a745',
      completed: '#6f42c1',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getStatusText = (status) => {
    const texts = {
      draft: 'Entwurf',
      published: 'Veröffentlicht',
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      cancelled: 'Abgebrochen'
    };
    return texts[status] || status;
  };

  return (
    <div className="schedule-manager">
      <div className="schedule-header">
        <h3>Zeitplan-Verwaltung</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Neuer Zeitplan
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {loading && <div className="loading">Lade Zeitpläne...</div>}

      <div className="schedules-list">
        {schedules.map(schedule => (
          <div key={schedule.schedule_id} className="schedule-card">
            <div className="schedule-card-header">
              <h4>{schedule.schedule_name}</h4>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(schedule.status) }}
              >
                {getStatusText(schedule.status)}
              </span>
            </div>
            
            <div className="schedule-card-body">
              <div className="schedule-info">
                <p><strong>Datum:</strong> {new Date(schedule.schedule_date).toLocaleDateString('de-DE')}</p>
                <p><strong>Zeit:</strong> {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</p>
                {schedule.venue_info && (
                  <p><strong>Venue:</strong> {JSON.parse(schedule.venue_info).venue_name || 'Nicht angegeben'}</p>
                )}
                {schedule.notes && (
                  <p><strong>Notizen:</strong> {schedule.notes}</p>
                )}
              </div>
              
              <div className="schedule-actions">
                {schedule.status === 'draft' && (
                  <>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => generateTimeSlots(schedule.schedule_id)}
                    >
                      Zeitslots generieren
                    </button>
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => publishSchedule(schedule.schedule_id)}
                    >
                      Veröffentlichen
                    </button>
                  </>
                )}
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Neuen Zeitplan erstellen</h4>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleCreateSchedule}>
              <div className="form-group">
                <label>Zeitplan Name</label>
                <input
                  type="text"
                  value={newSchedule.schedule_name}
                  onChange={(e) => setNewSchedule({...newSchedule, schedule_name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Datum</label>
                  <input
                    type="date"
                    value={newSchedule.schedule_date}
                    onChange={(e) => setNewSchedule({...newSchedule, schedule_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Startzeit</label>
                  <input
                    type="time"
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Endzeit</label>
                  <input
                    type="time"
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Template</label>
                <select
                  value={newSchedule.template_id}
                  onChange={(e) => setNewSchedule({...newSchedule, template_id: e.target.value})}
                >
                  <option value="">Kein Template</option>
                  {templates.map(template => (
                    <option key={template.template_id} value={template.template_id}>
                      {template.template_name} ({template.template_type})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Venue Name</label>
                <input
                  type="text"
                  value={newSchedule.venue_info.venue_name}
                  onChange={(e) => setNewSchedule({
                    ...newSchedule, 
                    venue_info: {...newSchedule.venue_info, venue_name: e.target.value}
                  })}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Anzahl Ringe</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newSchedule.venue_info.rings}
                    onChange={(e) => setNewSchedule({
                      ...newSchedule, 
                      venue_info: {...newSchedule.venue_info, rings: parseInt(e.target.value)}
                    })}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Notizen</label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({...newSchedule, notes: e.target.value})}
                  rows="3"
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Abbrechen
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? 'Erstelle...' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;