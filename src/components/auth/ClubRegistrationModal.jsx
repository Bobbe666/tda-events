import React, { useState } from 'react';

function ClubRegistrationModal({ isOpen, onClose, onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    ansprechpartner: '',
    strasse: '',
    plz: '',
    ort: '',
    email: '',
    passwort: '',
    homepage: ''
  });
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Pflichtfelder prüfen (alle außer homepage)
    const requiredFields = ['name', 'ansprechpartner', 'strasse', 'plz', 'ort', 'email', 'passwort'];
    for (let field of requiredFields) {
      if (!formData[field].trim()) {
        setMessage(`Fehler: Das Feld "${field}" ist erforderlich!`);
        return;
      }
    }
    setMessage('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registrierung erfolgreich!');
        if (onRegister) onRegister(data);
        onClose();
      } else {
        setMessage('Fehler: ' + (data.error || 'Registrierung fehlgeschlagen.'));
      }
    } catch (error) {
      setMessage('Fehler: ' + error.message);
    }
  };

  return (
    <div style={modalOverlayStyles}>
      <div style={modalContentStyles}>
        <h2>Vereinsregistrierung</h2>
        <form onSubmit={handleSubmit} style={formStyles}>
          <label>Name (erforderlich):</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />

          <label>Ansprechpartner (erforderlich):</label>
          <input type="text" name="ansprechpartner" value={formData.ansprechpartner} onChange={handleChange} required />

          <label>Strasse & Hausnummer (erforderlich):</label>
          <input type="text" name="strasse" value={formData.strasse} onChange={handleChange} required />

          <label>PLZ (erforderlich):</label>
          <input type="text" name="plz" value={formData.plz} onChange={handleChange} required />

          <label>Ort (erforderlich):</label>
          <input type="text" name="ort" value={formData.ort} onChange={handleChange} required />

          <label>Email (erforderlich):</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />

          <label>Passwort (erforderlich):</label>
          <input type="password" name="passwort" value={formData.passwort} onChange={handleChange} required />

          <label>Homepage (optional):</label>
          <input type="text" name="homepage" value={formData.homepage} onChange={handleChange} />

          <div style={buttonContainerStyles}>
            <button type="submit" style={submitButtonStyles}>Registrieren</button>
            <button type="button" onClick={onClose} style={cancelButtonStyles}>Abbrechen</button>
          </div>
          {message && <p style={messageStyles}>{message}</p>}
        </form>
      </div>
    </div>
  );
}

/* Stile für das Modal */
const modalOverlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyles = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
};

const formStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
};

const buttonContainerStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '15px'
};

const submitButtonStyles = {
  padding: '10px 15px',
  backgroundColor: '#8B0000',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelButtonStyles = {
  padding: '10px 15px',
  backgroundColor: '#888',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const messageStyles = {
  marginTop: '10px',
  textAlign: 'center',
  color: 'red'
};

export default ClubRegistrationModal;
