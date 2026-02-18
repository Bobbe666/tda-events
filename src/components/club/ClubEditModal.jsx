import React, { useState, useEffect } from 'react';
import { updateVerein } from "../../api/vereineApi";

function ClubEditModal({ isOpen, onClose, clubData, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ansprechpartner: '',
    telefon: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    homepage: ''
  });

useEffect(() => {
    if (clubData) {
        console.log("📡 Empfangenes clubData in Modal:", clubData);
        setFormData({
            name: clubData.name || '',
            email: clubData.email || '',
            ansprechpartner: clubData.ansprechpartner || '',
            telefon: clubData.telefon || '',
            strasse: clubData.strasse || '',
            hausnummer: clubData.hausnummer || '',
            plz: clubData.plz || '',
            ort: clubData.ort || '',
            homepage: clubData.homepage || ''
        });
    }
    if (clubData) {
      setFormData({
        name: clubData.name || '',
        email: clubData.email || '',
        ansprechpartner: clubData.ansprechpartner || '',
        telefon: clubData.telefon || '',
        strasse: clubData.strasse || '',
        hausnummer: clubData.hausnummer || '',
        plz: clubData.plz || '',
        ort: clubData.ort || '',
        homepage: clubData.homepage || ''
      });
    }
  }, [clubData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, ansprechpartner, telefon, strasse, hausnummer, plz, ort } = formData;
    
    if (!name.trim() || !email.trim() || !ansprechpartner.trim() || !telefon.trim() ||
        !strasse.trim() || !hausnummer.trim() || !plz.trim() || !ort.trim()) {
      alert("Bitte alle Pflichtfelder ausfüllen (Homepage ist optional).");
      return;
    }

    let updatedData = { 
      ...clubData,
      ...formData
    };

    // Prüfe, ob die vereins_id vorhanden ist
    if (!updatedData.vereins_id) {
      console.error("❌ Fehler: vereins_id fehlt! Überprüfe clubData:", clubData);
      alert("Fehler: Vereins-ID fehlt! Speichern nicht möglich.");
      return;
    }

    console.log("📤 Sende Daten an API:", updatedData);

    try {
      const result = await updateVerein(updatedData.vereins_id, updatedData);
      if (!result) {
        alert("Fehler beim Speichern der Vereinsdaten!");
        return;
      }

      onUpdate(result);
      onClose();
    } catch (err) {
      console.error("❌ Fehler beim Speichern der Vereinsdaten:", err);
      alert("Fehler beim Speichern der Vereinsdaten!");
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2>Vereinsdaten bearbeiten</h2>
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroupStyle}>
            <label>Name (Pflicht):</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Email (Pflicht):</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Ansprechpartner (Pflicht):</label>
            <input type="text" name="ansprechpartner" value={formData.ansprechpartner} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Telefon (Pflicht):</label>
            <input type="text" name="telefon" value={formData.telefon} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Strasse (Pflicht):</label>
            <input type="text" name="strasse" value={formData.strasse} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Hausnummer (Pflicht):</label>
            <input type="text" name="hausnummer" value={formData.hausnummer} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>PLZ (Pflicht):</label>
            <input type="text" name="plz" value={formData.plz} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Ort (Pflicht):</label>
            <input type="text" name="ort" value={formData.ort} onChange={handleChange} required style={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label>Homepage (optional):</label>
            <input type="text" name="homepage" value={formData.homepage} onChange={handleChange} style={inputStyle} />
          </div>

          <div style={buttonGroupStyle}>
            <button type="submit" style={saveButtonStyle}>Speichern</button>
            <button type="button" style={cancelButtonStyle} onClick={onClose}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Stile */
const overlayStyle = {
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

const modalStyle = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  width: '400px',
  maxWidth: '90%',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const formGroupStyle = {
  marginBottom: '15px'
};

const inputStyle = {
  width: '100%',
  padding: '8px',
  marginTop: '5px',
  boxSizing: 'border-box'
};

const buttonGroupStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '20px'
};

const saveButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const cancelButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#dc3545',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default ClubEditModal;
