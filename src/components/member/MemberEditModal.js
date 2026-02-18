import React, { useState } from 'react';

function MemberEditModal({ member, onClose, onSave }) {
  const [formData, setFormData] = useState({ ...member });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalStyle}>
        <h3>Mitglied bearbeiten</h3>
        <label>Vorname:</label>
        <input type="text" name="vorname" value={formData.vorname} onChange={handleChange} />

        <label>Nachname:</label>
        <input type="text" name="nachname" value={formData.nachname} onChange={handleChange} />

        <label>Geschlecht:</label>
        <select name="geschlecht" value={formData.geschlecht} onChange={handleChange}>
          <option value="Männlich">Männlich</option>
          <option value="Weiblich">Weiblich</option>
        </select>

        <label>Nationalität:</label>
        <input type="text" name="nationalitaet" value={formData.nationalitaet} onChange={handleChange} />

        <label>Gurtfarbe:</label>
        <input type="text" name="gurtfarbe" value={formData.gurtfarbe} onChange={handleChange} />

        <label>Kampfstil:</label>
        <input type="text" name="kampfstil" value={formData.kampfstil} onChange={handleChange} />

        <label>Skill-Level:</label>
        <select name="skill_level" value={formData.skill_level} onChange={handleChange}>
          <option value="Anfänger">Anfänger</option>
          <option value="Fortgeschritten">Fortgeschritten</option>
          <option value="Profi">Profi</option>
        </select>

        <button onClick={handleSave} style={saveButtonStyle}>Speichern</button>
        <button onClick={onClose} style={cancelButtonStyle}>Abbrechen</button>
      </div>
    </div>
  );
}

/* 🎨 Stile */
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '300px',
  textAlign: 'center',
};

const saveButtonStyle = {
  marginTop: '10px',
  padding: '5px 10px',
  border: 'none',
  backgroundColor: '#28a745',
  color: 'white',
  cursor: 'pointer',
};

const cancelButtonStyle = {
  marginTop: '10px',
  padding: '5px 10px',
  border: 'none',
  backgroundColor: '#dc3545',
  color: 'white',
  cursor: 'pointer',
};

export default MemberEditModal;
