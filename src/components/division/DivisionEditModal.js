import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DivisionEditModal = ({ division, isOpen, onClose, onSave }) => {
  const [editedDivision, setEditedDivision] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (division) {
      setEditedDivision({ ...division });
    }
  }, [division]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedDivision(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Validierung
      if (!editedDivision.Division_Name || !editedDivision.Division_Type) {
        setError('Division Name und Type sind erforderlich');
        return;
      }

      // ✅ KORRIGIERT: API-Endpunkt
      const response = await axios.put(
        `/api/divisionen/${editedDivision.Division_Code}`, // ✅ divisionen statt divisionenneu
        editedDivision
      );

      if (response.data?.success) {
        onSave?.(editedDivision);
        onClose?.();
        console.log('✅ Division erfolgreich aktualisiert');
      } else {
        throw new Error(response.data?.error || 'Unbekannter Fehler beim Speichern');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      setError(error.response?.data?.error || error.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Division bearbeiten</h2>
          <button 
            className="close-button"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Division Code:</label>
              <input
                type="text"
                name="Division_Code"
                value={editedDivision.Division_Code || ''}
                onChange={handleChange}
                className="form-input"
                disabled // Code sollte nicht änderbar sein
              />
            </div>

            <div className="form-group">
              <label>Division Name *:</label>
              <input
                type="text"
                name="Division_Name"
                value={editedDivision.Division_Name || ''}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Division Type *:</label>
              <select
                name="Division_Type"
                value={editedDivision.Division_Type || ''}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Typ wählen</option>
                <option value="Kumite">Kumite</option>
                <option value="Formen">Formen</option>
                <option value="Kickboxen">Kickboxen</option>
                <option value="Selbstverteidigung">Selbstverteidigung</option>
                <option value="Bruchtest">Bruchtest</option>
                <option value="BJJ">BJJ</option>
                <option value="Grappling">Grappling</option>
                <option value="Rumble">Rumble</option>
                <option value="Waffen">Waffen</option>
              </select>
            </div>

            <div className="form-group">
              <label>Geschlecht:</label>
              <select
                name="Gender"
                value={editedDivision.Gender || ''}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Geschlecht wählen</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="male/female">Männlich/Weiblich</option>
                <option value="mixed">Gemischt</option>
              </select>
            </div>

            <div className="form-group">
              <label>Altersklasse:</label>
              <input
                type="text"
                name="Altersklasse"
                value={editedDivision.Altersklasse || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="z.B. Jugend, Senioren"
              />
            </div>

            <div className="form-group">
              <label>Alter von:</label>
              <input
                type="number"
                name="Age_from"
                value={editedDivision.Age_from || ''}
                onChange={handleChange}
                className="form-input"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label>Alter bis:</label>
              <input
                type="number"
                name="Age_to"
                value={editedDivision.Age_to || ''}
                onChange={handleChange}
                className="form-input"
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label>Mindestgewicht (kg):</label>
              <input
                type="number"
                name="Minimum_Weight"
                value={editedDivision.Minimum_Weight || ''}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Maximalgewicht (kg):</label>
              <input
                type="number"
                name="Maximum_Weight"
                value={editedDivision.Maximum_Weight || ''}
                onChange={handleChange}
                className="form-input"
                step="0.1"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Skill Level:</label>
              <select
                name="Skill_Level"
                value={editedDivision.Skill_Level || ''}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Skill Level wählen</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Weiß">Weiß</option>
                <option value="Gelb">Gelb</option>
                <option value="Orange">Orange</option>
                <option value="Grün">Grün</option>
                <option value="Blau">Blau</option>
                <option value="Braun">Braun</option>
                <option value="Schwarz">Schwarz</option>
              </select>
            </div>

            <div className="form-group">
              <label>Team:</label>
              <input
                type="text"
                name="Team"
                value={editedDivision.Team || ''}
                onChange={handleChange}
                className="form-input"
                placeholder="z.B. Duo, Team"
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Speichert...' : '💾 Speichern'}
          </button>
          <button 
            className="btn btn-cancel"
            onClick={handleClose}
            disabled={loading}
          >
            ❌ Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default DivisionEditModal;