import React, { useState } from 'react';
import axios from 'axios';
import '../../styles/DivisionCard.css';
import '../../styles/Button.css'; // ✅ Zentrale Button-Styles

const DivisionCard = ({ division, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDivision, setEditedDivision] = useState({ ...division });
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedDivision({ ...division });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDivision({ ...division });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await axios.put(
        `/api/divisionen/${division.Division_Code}`,
        editedDivision
      );
      
      if (response.data?.success) {
        setIsEditing(false);
        onUpdate?.(editedDivision); // Parent-Component über Update informieren
        console.log('✅ Division erfolgreich aktualisiert');
      } else {
        throw new Error(response.data?.error || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Division:', error);
      alert('Fehler beim Speichern: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Division "${division.Division_Name}" wirklich löschen?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.delete(
        `/api/divisionen/${division.Division_Code}`
      );
      
      if (response.data?.success) {
        console.log('✅ Division erfolgreich gelöscht');
        // Parent-Component über Löschung informieren
        onUpdate?.(null);
      } else {
        throw new Error(response.data?.error || 'Fehler beim Löschen');
      }
    } catch (error) {
      console.error('❌ Fehler beim Löschen der Division:', error);
      alert('Fehler beim Löschen: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedDivision(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="division-card">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      <div className="card-header">
        <h3>{division.Division_Code}</h3>
        {!isEditing && (
          <div className="card-actions">
            <button 
              className="btn btn-secondary btn-edit"
              onClick={handleEdit}
              disabled={loading}
            >
              ✏️ Bearbeiten
            </button>
            <button 
              className="btn btn-danger btn-delete"
              onClick={handleDelete}
              disabled={loading}
            >
              🗑️ Löschen
            </button>
          </div>
        )}
      </div>

      <div className="card-content">
        {isEditing ? (
          <div className="edit-form">
            <div className="form-group">
              <label>Division Name:</label>
              <input
                type="text"
                name="Division_Name"
                value={editedDivision.Division_Name || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Division Type:</label>
              <select
                name="Division_Type"
                value={editedDivision.Division_Type || ''}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Typ wählen</option>
                <option value="Formen">Formen</option>
                <option value="Kumite">Kumite</option>
                <option value="Grappling">Grappling</option>
                <option value="Pointfighting">Pointfighting</option>
                <option value="Continous Fighting">Continous Fighting</option>
                <option value="K1">K1</option>
                <option value="Fullcontact">Fullcontact</option>
                <option value="Selbstverteidigung">Selbstverteidigung</option>
                <option value="Bruchtest">Bruchtest</option>
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
                <option value="Male">Männlich</option>
                <option value="Female">Weiblich</option>
                <option value="Male/Female">Männlich/Weiblich</option>
                <option value="Mixed">Gemischt</option>
              </select>
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Gewicht von (kg):</label>
                <input
                  type="text"
                  name="Minimun_Weight"
                  value={editedDivision.Minimun_Weight || ''}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="z.B. 60"
                />
              </div>

              <div className="form-group">
                <label>Gewicht bis (kg):</label>
                <input
                  type="text"
                  name="Maximum_Weight"
                  value={editedDivision.Maximum_Weight || ''}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="z.B. 65"
                />
              </div>
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
                <option value="Black Belts">Black Belts</option>
                <option value="Color Belts">Color Belts</option>
                <option value="Brown Belts">Brown Belts</option>
                <option value="White Belts">White Belts</option>
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
                placeholder="z.B. Team, Duo"
              />
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary btn-save"
                onClick={handleSave}
                disabled={loading}
              >
                💾 Speichern
              </button>
              <button 
                className="btn btn-secondary btn-cancel"
                onClick={handleCancel}
                disabled={loading}
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className="view-content">
            <p><strong>Name:</strong> {division.Division_Name}</p>
            <p><strong>Typ:</strong> {division.Division_Type}</p>
            <p><strong>Geschlecht:</strong> {division.Gender || 'Nicht angegeben'}</p>
            
            {(division.Age_from || division.Age_to) && (
              <p><strong>Alter:</strong> 
                {division.Age_from && division.Age_to 
                  ? `${division.Age_from} - ${division.Age_to} Jahre`
                  : division.Age_from 
                    ? `ab ${division.Age_from} Jahre`
                    : `bis ${division.Age_to} Jahre`
                }
              </p>
            )}
            
            {(division.Minimun_Weight || division.Maximum_Weight) && (
              <p><strong>Gewicht:</strong> 
                {division.Minimun_Weight && division.Maximum_Weight 
                  ? `${division.Minimun_Weight} - ${division.Maximum_Weight} kg`
                  : division.Minimun_Weight 
                    ? `ab ${division.Minimun_Weight} kg`
                    : `bis ${division.Maximum_Weight} kg`
                }
              </p>
            )}
            
            {division.Skill_Level && (
              <p><strong>Skill Level:</strong> {division.Skill_Level}</p>
            )}
            
            {division.Age && (
              <p><strong>Altersklasse:</strong> {division.Age}</p>
            )}

            {division.Team && (
              <p><strong>Team:</strong> {division.Team}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DivisionCard;