import React, { useState, useCallback, useMemo } from 'react';
import styles from '../member/CodeStileMemberList';
import { addWettkaempfer, getWettkaempferByVerein } from '../../api/wettkaempferApi';

// Konstanten außerhalb der Komponente für bessere Performance
const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Black Belt"];
const GURTFARBEN = [
  "Weiß",
  "Weiß/Gelb",
  "Gelb",
  "Orange",
  "Grün",
  "Grün/Blau",
  "Blau",
  "Lila",
  "Blau/Rot",
  "Rot",
  "Braun",
  "Schwarz"
];

const GESCHLECHT_OPTIONS = [
  { value: "männlich", label: "männlich" },
  { value: "weiblich", label: "weiblich" },
  { value: "divers", label: "divers" }
];

// Custom Hook für localStorage
const useLocalStorage = (key, defaultValue) => {
  const [value] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Fehler beim Laden von localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  return value;
};

// Validierungsfunktionen
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,20}$/;
  return phoneRegex.test(phone);
};

const validateMember = (member) => {
  const errors = [];
  
  // Pflichtfelder
  if (!member.vorname?.trim()) errors.push("Vorname ist erforderlich");
  if (!member.nachname?.trim()) errors.push("Nachname ist erforderlich");
  if (!member.geburtsdatum) errors.push("Geburtsdatum ist erforderlich");
  if (!member.geschlecht) errors.push("Geschlecht ist erforderlich");
  if (!member.skill_level) errors.push("Skill Level ist erforderlich");
  if (!member.gurtfarbe) errors.push("Gurtfarbe ist erforderlich");
  
  // Optionale Validierungen
  if (member.email && !validateEmail(member.email)) {
    errors.push("Ungültige E-Mail-Adresse");
  }
  
  if (member.handy && !validatePhone(member.handy)) {
    errors.push("Ungültige Handynummer");
  }
  
  if (member.gewicht && (member.gewicht < 0 || member.gewicht > 300)) {
    errors.push("Gewicht muss zwischen 0 und 300 kg liegen");
  }
  
  // Alter validieren (mindestens 5 Jahre, maximal 100 Jahre)
  if (member.geburtsdatum) {
    const birthDate = new Date(member.geburtsdatum);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 5 || age > 100) {
      errors.push("Alter muss zwischen 5 und 100 Jahren liegen");
    }
  }
  
  return errors;
};

// Daten für das Speichern vorbereiten
const prepareMemberData = (member) => ({
  ...member,
  vorname: member.vorname.trim(),
  nachname: member.nachname.trim(),
  nationalitaet: member.nationalitaet?.trim() || "Deutschland",
  kampfstil: member.kampfstil?.trim() || "unbekannt",
  gewicht: member.gewicht ? parseFloat(member.gewicht).toString() : "0.0",
  email: member.email?.trim() || null,
  handy: member.handy?.trim() || null,
});

function AddWettkaempfer({ setIsAdding, setWettkaempfer, onWettkaempferAdded }) {
  const clubData = useLocalStorage("clubData", {});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  const initialMemberState = useMemo(() => ({
    vereins_id: clubData.vereins_id || null,
    vorname: '',
    nachname: '',
    geburtsdatum: '',
    geschlecht: '',
    gewicht: '',
    skill_level: '',
    gurtfarbe: '',
    email: '',
    handy: '',
    kampfstil: '',
    nationalitaet: '',
  }), [clubData.vereins_id]);

  const [newMember, setNewMember] = useState(initialMemberState);

  // Optimierte Input-Handler mit useCallback
  const handleInputChange = useCallback((field, value) => {
    setNewMember(prev => ({ ...prev, [field]: value }));
    
    // Einzelfeld-Validierung für sofortiges Feedback
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleAddMember = async () => {
    setErrorMessage('');
    setValidationErrors({});

    // Validierung
    const errors = validateMember(newMember);
    if (errors.length > 0) {
      setErrorMessage(`❌ Bitte korrigiere folgende Fehler: ${errors.join(', ')}`);
      return;
    }

    if (!newMember.vereins_id) {
      setErrorMessage("❌ Fehler: Keine Vereins-ID gefunden. Bitte lade die Seite neu.");
      return;
    }

    setLoading(true);

    try {
      const memberToAdd = prepareMemberData(newMember);
      
      console.log("🚩 Sende an Backend:", memberToAdd);

      const addedMember = await addWettkaempfer(memberToAdd);

      if (addedMember && (addedMember.id || addedMember.wettkaempfer_id)) {
        // Erfolgreich hinzugefügt - Liste aktualisieren
        try {
          const updatedList = await getWettkaempferByVerein(newMember.vereins_id);
          setWettkaempfer(Array.isArray(updatedList) ? updatedList : [updatedList]);
          setIsAdding(false);
          onWettkaempferAdded?.();
        } catch (listError) {
          console.error("Fehler beim Aktualisieren der Liste:", listError);
          // Trotzdem schließen, da das Hinzufügen erfolgreich war
          setIsAdding(false);
          onWettkaempferAdded?.();
        }
      } else {
        throw new Error(addedMember?.error || "Unbekannter Serverfehler");
      }
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      
      if (error.message.includes("400")) {
        setErrorMessage("⚠️ Ungültige Daten. Bitte überprüfe deine Eingaben.");
      } else if (error.message.includes("409")) {
        setErrorMessage("⚠️ Wettkämpfer existiert bereits.");
      } else if (error.message.includes("500")) {
        setErrorMessage("⚠️ Serverfehler. Bitte versuche es später erneut.");
      } else {
        setErrorMessage(`⚠️ Fehler: ${error.message || "Unbekannter Fehler beim Speichern"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    setIsAdding(false);
  }, [setIsAdding]);

  return (
    <div style={styles.modalOverlayStyle}>
      <div style={styles.modalContentStyle}>
        <h3>Wettkämpfer anlegen</h3>
        
        {errorMessage && (
          <div style={{ 
            color: 'red', 
            textAlign: 'center', 
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#ffebee',
            borderRadius: '4px',
            border: '1px solid #ffcdd2'
          }}>
            {errorMessage}
          </div>
        )}

        <div style={styles.formRowStyle}>
          <div style={styles.columnStyle}>
            {/* Vorname */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Vorname: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="z.B. Max"
                value={newMember.vorname}
                onChange={e => handleInputChange('vorname', e.target.value)}
                style={styles.inputStyle}
                aria-label="Vorname"
                required
                maxLength={50}
              />
            </div>

            {/* Nachname */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Nachname: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="z.B. Mustermann"
                value={newMember.nachname}
                onChange={e => handleInputChange('nachname', e.target.value)}
                style={styles.inputStyle}
                aria-label="Nachname"
                required
                maxLength={50}
              />
            </div>

            {/* Geburtsdatum */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Geburtsdatum: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                value={newMember.geburtsdatum}
                onChange={e => handleInputChange('geburtsdatum', e.target.value)}
                style={styles.inputStyle}
                aria-label="Geburtsdatum"
                required
                min="1924-01-01"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Gewicht */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>Gewicht (kg):</label>
              <input
                type="number"
                placeholder="z.B. 62"
                value={newMember.gewicht}
                onChange={e => handleInputChange('gewicht', e.target.value)}
                style={styles.inputStyle}
                aria-label="Gewicht in Kilogramm"
                min="0"
                max="300"
                step="0.1"
              />
            </div>

            {/* Skill Level */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Skill Level: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={newMember.skill_level}
                onChange={e => handleInputChange('skill_level', e.target.value)}
                style={styles.inputStyle}
                aria-label="Skill Level"
                required
              >
                <option value="">Bitte wählen</option>
                {SKILL_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* Geschlecht */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Geschlecht: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={newMember.geschlecht}
                onChange={e => handleInputChange('geschlecht', e.target.value)}
                style={styles.inputStyle}
                aria-label="Geschlecht"
                required
              >
                <option value="">Bitte wählen</option>
                {GESCHLECHT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.columnStyle}>
            {/* Nationalität */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>Nationalität:</label>
              <input
                type="text"
                placeholder="z.B. Deutschland, Österreich"
                value={newMember.nationalitaet}
                onChange={e => handleInputChange('nationalitaet', e.target.value)}
                style={styles.inputStyle}
                aria-label="Nationalität"
                maxLength={50}
              />
            </div>

            {/* Gurtfarbe */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>
                Gurtfarbe: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={newMember.gurtfarbe}
                onChange={e => handleInputChange('gurtfarbe', e.target.value)}
                style={styles.inputStyle}
                aria-label="Gurtfarbe"
                required
              >
                <option value="">Bitte wählen</option>
                {GURTFARBEN.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Kampfstil */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>Kampfstil:</label>
              <input
                type="text"
                placeholder="z.B. Karate, Judo, Taekwondo"
                value={newMember.kampfstil}
                onChange={e => handleInputChange('kampfstil', e.target.value)}
                style={styles.inputStyle}
                aria-label="Kampfstil"
                maxLength={50}
              />
            </div>

            {/* E-Mail */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>E-Mail:</label>
              <input
                type="email"
                placeholder="z.B. max@beispiel.de"
                value={newMember.email}
                onChange={e => handleInputChange('email', e.target.value)}
                style={styles.inputStyle}
                aria-label="E-Mail-Adresse"
                maxLength={100}
              />
            </div>

            {/* Handy */}
            <div style={styles.fieldContainerStyle}>
              <label style={styles.labelStyle}>Handy:</label>
              <input
                type="tel"
                placeholder="z.B. 0176 12345678"
                value={newMember.handy}
                onChange={e => handleInputChange('handy', e.target.value)}
                style={styles.inputStyle}
                aria-label="Handynummer"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        <div style={styles.buttonContainerStyle}>
          <button 
            style={styles.saveButtonStyle} 
            onClick={handleAddMember} 
            disabled={loading}
            aria-label="Wettkämpfer speichern"
          >
            {loading ? "Speichert..." : "Speichern"}
          </button>
          <button 
            style={styles.cancelButtonStyle} 
            onClick={handleCancel}
            disabled={loading}
            aria-label="Abbrechen"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddWettkaempfer;