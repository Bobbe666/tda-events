// src/components/turnier/KategorienAnlegen.js
import React, { useState } from "react";
import "../../styles/TurnierBearbeiten.css"; // Nutzen dasselbe Modal-Styling

/**
 * KategorieAnlegen
 * ----------------
 * Modal zum Anlegen einer neuen Kategorie/Division
 */
const KategorieAnlegen = ({ isOpen, onClose, refreshKategorien = () => {} }) => {
  const [newKategorie, setNewKategorie] = useState({
    Division_Name: "",
    Division_Code: "",
    Division_Type: "",
    Altersklasse: "",
    Age_from: "",
    Age_to: "",
    Minimum_Weight: "",
    Maximum_Weight: "",
    Gender: "",
    Skill_Level: "",
    Team: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Vordefinierte Optionen
  const divisionTypes = [
    "Formen", "Selbstverteidigung", "Kickboxen", "Kumite", 
    "Bruchtest", "Grappling", "Rumble", "BJJ"
  ];

  const genderOptions = ["male", "female", "male/female", "mixed"];

  const skillLevels = [
    "Beginner", "Intermediate", "Advanced", "Black Belt",
    "Weiß", "Gelb", "Orange", "Grün", "Blau", "Braun", "Schwarz"
  ];

  const altersklassen = [
    "Kinder", "Jugend", "Junioren", "Senioren", "Masters", 
    "U12", "U14", "U16", "U18", "U21", "Open"
  ];

  // Reset Form bei Öffnen
  React.useEffect(() => {
    if (isOpen) {
      setNewKategorie({
        Division_Name: "",
        Division_Code: "",
        Division_Type: "",
        Altersklasse: "",
        Age_from: "",
        Age_to: "",
        Minimum_Weight: "",
        Maximum_Weight: "",
        Gender: "",
        Skill_Level: "",
        Team: ""
      });
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  // Form-Handler
  const handleFieldChange = (field, value) => {
    setNewKategorie({
      ...newKategorie,
      [field]: value,
    });

    // Auto-generiere Division_Code basierend auf Name (optional)
    if (field === 'Division_Name' && value) {
      const autoCode = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 8);
      setNewKategorie(prev => ({
        ...prev,
        Division_Name: value,
        Division_Code: prev.Division_Code || autoCode
      }));
    }
  };

  // Validierung
  const validateForm = () => {
    if (!newKategorie.Division_Name.trim()) {
      setError("Division Name ist ein Pflichtfeld");
      return false;
    }
    if (!newKategorie.Division_Code.trim()) {
      setError("Division Code ist ein Pflichtfeld");
      return false;
    }
    if (!newKategorie.Division_Type) {
      setError("Division Type ist ein Pflichtfeld");
      return false;
    }

    // Code-Format prüfen (nur Buchstaben und Zahlen)
    if (!/^[A-Z0-9]+$/.test(newKategorie.Division_Code)) {
      setError("Division Code darf nur Großbuchstaben und Zahlen enthalten");
      return false;
    }

    // Altersbereich-Validierung
    if (newKategorie.Age_from && newKategorie.Age_to) {
      const ageFrom = parseInt(newKategorie.Age_from);
      const ageTo = parseInt(newKategorie.Age_to);
      if (ageFrom >= ageTo) {
        setError("'Alter von' muss kleiner sein als 'Alter bis'");
        return false;
      }
    }

    // Gewichtsbereich-Validierung
    if (newKategorie.Minimum_Weight && newKategorie.Maximum_Weight) {
      const minWeight = parseFloat(newKategorie.Minimum_Weight);
      const maxWeight = parseFloat(newKategorie.Maximum_Weight);
      if (minWeight >= maxWeight) {
        setError("Mindestgewicht muss kleiner sein als Maximalgewicht");
        return false;
      }
    }

    return true;
  };

  // Submit-Handler
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Daten für API aufbereiten
      const submitData = {
        ...newKategorie,
        Age_from: newKategorie.Age_from ? parseInt(newKategorie.Age_from) : null,
        Age_to: newKategorie.Age_to ? parseInt(newKategorie.Age_to) : null,
        Minimum_Weight: newKategorie.Minimum_Weight ? parseFloat(newKategorie.Minimum_Weight) : null,
        Maximum_Weight: newKategorie.Maximum_Weight ? parseFloat(newKategorie.Maximum_Weight) : null,
        Team: newKategorie.Team || null
      };

      console.log('📤 Sende neue Kategorie:', submitData);

      const response = await fetch("/api/divisionen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP Error: ${response.status}`);
      }

      console.log('✅ Kategorie erfolgreich angelegt:', result);
      
      setSuccessMessage("Kategorie erfolgreich angelegt!");
      setTimeout(() => {
        setSuccessMessage("");
        refreshKategorien();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Fehler beim Anlegen der Kategorie:', err);
      setError(err.message || "Fehler beim Anlegen der Kategorie");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h2>Neue Kategorie anlegen</h2>
        
        {loading && <p>Erstelle Kategorie...</p>}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        <form onSubmit={handleSubmit}>
          {/* Basis-Informationen */}
          <div className="form-group">
            <label>Division Name *</label>
            <input
              type="text"
              value={newKategorie.Division_Name}
              onChange={(e) => handleFieldChange("Division_Name", e.target.value)}
              className="form-input"
              placeholder="z.B. Herren Kumite -75kg"
              required
            />
          </div>

          <div className="form-group">
            <label>Division Code *</label>
            <input
              type="text"
              value={newKategorie.Division_Code}
              onChange={(e) => handleFieldChange("Division_Code", e.target.value.toUpperCase())}
              className="form-input"
              placeholder="z.B. HK75"
              style={{ textTransform: 'uppercase' }}
              required
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              Nur Großbuchstaben und Zahlen, max. 8 Zeichen
            </small>
          </div>

          <div className="form-group">
            <label>Division Type *</label>
            <select
              value={newKategorie.Division_Type}
              onChange={(e) => handleFieldChange("Division_Type", e.target.value)}
              className="form-input"
              required
            >
              <option value="">Bitte wählen...</option>
              {divisionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Alters- und Geschlechts-Informationen */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Altersklasse</label>
              <select
                value={newKategorie.Altersklasse}
                onChange={(e) => handleFieldChange("Altersklasse", e.target.value)}
                className="form-input"
              >
                <option value="">Optional...</option>
                {altersklassen.map(klasse => (
                  <option key={klasse} value={klasse}>{klasse}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Gender</label>
              <select
                value={newKategorie.Gender}
                onChange={(e) => handleFieldChange("Gender", e.target.value)}
                className="form-input"
              >
                <option value="">Optional...</option>
                {genderOptions.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Altersbereich */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Alter von</label>
              <input
                type="number"
                value={newKategorie.Age_from}
                onChange={(e) => handleFieldChange("Age_from", e.target.value)}
                className="form-input"
                min="5"
                max="99"
                placeholder="z.B. 18"
              />
            </div>

            <div className="form-group">
              <label>Alter bis</label>
              <input
                type="number"
                value={newKategorie.Age_to}
                onChange={(e) => handleFieldChange("Age_to", e.target.value)}
                className="form-input"
                min="5"
                max="99"
                placeholder="z.B. 35"
              />
            </div>
          </div>

          {/* Gewichtsbereich */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Mindestgewicht (kg)</label>
              <input
                type="number"
                value={newKategorie.Minimum_Weight}
                onChange={(e) => handleFieldChange("Minimum_Weight", e.target.value)}
                className="form-input"
                min="20"
                max="200"
                step="0.1"
                placeholder="z.B. 70.0"
              />
            </div>

            <div className="form-group">
              <label>Maximalgewicht (kg)</label>
              <input
                type="number"
                value={newKategorie.Maximum_Weight}
                onChange={(e) => handleFieldChange("Maximum_Weight", e.target.value)}
                className="form-input"
                min="20"
                max="200"
                step="0.1"
                placeholder="z.B. 75.0"
              />
            </div>
          </div>

          {/* Weitere Optionen */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Skill Level</label>
              <select
                value={newKategorie.Skill_Level}
                onChange={(e) => handleFieldChange("Skill_Level", e.target.value)}
                className="form-input"
              >
                <option value="">Optional...</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Team</label>
              <input
                type="text"
                value={newKategorie.Team}
                onChange={(e) => handleFieldChange("Team", e.target.value)}
                className="form-input"
                placeholder="z.B. Einzeln, Team, Mixed"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="button-container">
            <button type="submit" className="dark-red-button" disabled={loading}>
              {loading ? 'Erstelle...' : 'Kategorie anlegen'}
            </button>
            <button
              type="button"
              className="dark-red-button"
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KategorieAnlegen;