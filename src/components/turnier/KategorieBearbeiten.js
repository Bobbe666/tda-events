// src/components/turnier/KategorieBearbeiten.js
import React, { useState, useEffect } from "react";
import "../../styles/TurnierBearbeiten.css";

/**
 * KategorieBearbeiten
 * -------------------
 * Modal zum Bearbeiten einer bestehenden Kategorie/Division
 */
const KategorieBearbeiten = ({ isOpen, onClose, refreshKategorien = () => {} }) => {
  const [kategorienList, setKategorienList] = useState([]);
  const [selectedKategorie, setSelectedKategorie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Vordefinierte Optionen (gleich wie beim Anlegen)
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

  // Kategorien laden beim Öffnen
  useEffect(() => {
    if (isOpen) {
      fetchKategorien();
      setSelectedKategorie(null);
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const fetchKategorien = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("📡 Lade Kategorien für Bearbeitung...");
      const response = await fetch("/api/divisionen");
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const responseData = await response.json();
      
      let data = [];
      if (responseData.success && Array.isArray(responseData.data)) {
        data = responseData.data;
      } else if (Array.isArray(responseData)) {
        data = responseData;
      }
      
      // Sortierung für bessere Übersicht
      data.sort((a, b) => {
        if (a.Division_Type !== b.Division_Type) {
          return a.Division_Type.localeCompare(b.Division_Type);
        }
        return a.Division_Name.localeCompare(b.Division_Name);
      });
      
      setKategorienList(data);
      console.log("✅ Kategorien für Bearbeitung geladen:", data.length);
    } catch (err) {
      console.error("❌ Fehler beim Laden der Kategorien:", err);
      setError("Fehler beim Laden der Kategorien: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Kategorie-Auswahl Handler
  const handleKategorieChange = (event) => {
    const divisionCode = event.target.value;
    if (!divisionCode) {
      setSelectedKategorie(null);
      return;
    }

    const kategorie = kategorienList.find(k => k.Division_Code === divisionCode);
    if (kategorie) {
      setSelectedKategorie({ ...kategorie });
      console.log("📝 Kategorie zur Bearbeitung ausgewählt:", kategorie);
    }
  };

  // Field-Change Handler
  const handleFieldChange = (field, value) => {
    setSelectedKategorie({
      ...selectedKategorie,
      [field]: value,
    });
  };

  // Validierung
  const validateForm = () => {
    if (!selectedKategorie.Division_Name.trim()) {
      setError("Division Name ist ein Pflichtfeld");
      return false;
    }
    if (!selectedKategorie.Division_Type) {
      setError("Division Type ist ein Pflichtfeld");
      return false;
    }

    // Altersbereich-Validierung
    if (selectedKategorie.Age_from && selectedKategorie.Age_to) {
      const ageFrom = parseInt(selectedKategorie.Age_from);
      const ageTo = parseInt(selectedKategorie.Age_to);
      if (ageFrom >= ageTo) {
        setError("'Alter von' muss kleiner sein als 'Alter bis'");
        return false;
      }
    }

    // Gewichtsbereich-Validierung
    if (selectedKategorie.Minimum_Weight && selectedKategorie.Maximum_Weight) {
      const minWeight = parseFloat(selectedKategorie.Minimum_Weight);
      const maxWeight = parseFloat(selectedKategorie.Maximum_Weight);
      if (minWeight >= maxWeight) {
        setError("Mindestgewicht muss kleiner sein als Maximalgewicht");
        return false;
      }
    }

    return true;
  };

  // Save Handler
  const handleSave = async (event) => {
    event.preventDefault();
    if (!selectedKategorie) return;

    setError("");
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Daten für API aufbereiten
      const updateData = {
        Division_Name: selectedKategorie.Division_Name,
        Division_Type: selectedKategorie.Division_Type,
        Altersklasse: selectedKategorie.Altersklasse || null,
        Age_from: selectedKategorie.Age_from ? parseInt(selectedKategorie.Age_from) : null,
        Age_to: selectedKategorie.Age_to ? parseInt(selectedKategorie.Age_to) : null,
        Minimum_Weight: selectedKategorie.Minimum_Weight ? parseFloat(selectedKategorie.Minimum_Weight) : null,
        Maximum_Weight: selectedKategorie.Maximum_Weight ? parseFloat(selectedKategorie.Maximum_Weight) : null,
        Gender: selectedKategorie.Gender || null,
        Skill_Level: selectedKategorie.Skill_Level || null,
        Team: selectedKategorie.Team || null
      };

      console.log('📤 Aktualisiere Kategorie:', selectedKategorie.Division_Code, updateData);

      const response = await fetch(
        `/api/divisionen/${selectedKategorie.Division_Code}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updateData)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP Error: ${response.status}`);
      }

      console.log('✅ Kategorie erfolgreich aktualisiert:', result);
      
      setSuccessMessage("Änderungen erfolgreich gespeichert!");
      setTimeout(() => {
        setSuccessMessage("");
        refreshKategorien();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('❌ Fehler beim Speichern der Kategorie:', err);
      setError(err.message || "Fehler beim Speichern der Kategorie");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px' }}>
        <h2>Kategorie bearbeiten</h2>
        
        {loading && <p>Lade Kategorien...</p>}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        {/* Kategorie-Auswahl */}
        <div className="form-group">
          <label>Kategorie auswählen:</label>
          <select 
            onChange={handleKategorieChange} 
            className="form-input"
            disabled={loading}
          >
            <option value="">-- Kategorie wählen --</option>
            {kategorienList.map((kategorie) => (
              <option 
                key={kategorie.Division_Code} 
                value={kategorie.Division_Code}
              >
                {kategorie.Division_Code} - {kategorie.Division_Name} ({kategorie.Division_Type})
              </option>
            ))}
          </select>
        </div>

        {/* Bearbeitungsformular (nur wenn Kategorie ausgewählt) */}
        {selectedKategorie && (
          <form onSubmit={handleSave}>
            {/* Basis-Informationen */}
            <div className="form-group">
              <label>Division Name *</label>
              <input
                type="text"
                value={selectedKategorie.Division_Name || ""}
                onChange={(e) => handleFieldChange("Division_Name", e.target.value)}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label>Division Code (nicht änderbar)</label>
              <input
                type="text"
                value={selectedKategorie.Division_Code || ""}
                className="form-input"
                disabled
                style={{ backgroundColor: '#f5f5f5', color: '#666' }}
              />
            </div>

            <div className="form-group">
              <label>Division Type *</label>
              <select
                value={selectedKategorie.Division_Type || ""}
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
                  value={selectedKategorie.Altersklasse || ""}
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
                  value={selectedKategorie.Gender || ""}
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
                  value={selectedKategorie.Age_from || ""}
                  onChange={(e) => handleFieldChange("Age_from", e.target.value)}
                  className="form-input"
                  min="5"
                  max="99"
                />
              </div>

              <div className="form-group">
                <label>Alter bis</label>
                <input
                  type="number"
                  value={selectedKategorie.Age_to || ""}
                  onChange={(e) => handleFieldChange("Age_to", e.target.value)}
                  className="form-input"
                  min="5"
                  max="99"
                />
              </div>
            </div>

            {/* Gewichtsbereich */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Mindestgewicht (kg)</label>
                <input
                  type="number"
                  value={selectedKategorie.Minimum_Weight || ""}
                  onChange={(e) => handleFieldChange("Minimum_Weight", e.target.value)}
                  className="form-input"
                  min="20"
                  max="200"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Maximalgewicht (kg)</label>
                <input
                  type="number"
                  value={selectedKategorie.Maximum_Weight || ""}
                  onChange={(e) => handleFieldChange("Maximum_Weight", e.target.value)}
                  className="form-input"
                  min="20"
                  max="200"
                  step="0.1"
                />
              </div>
            </div>

            {/* Weitere Optionen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Skill Level</label>
                <select
                  value={selectedKategorie.Skill_Level || ""}
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
                  value={selectedKategorie.Team || ""}
                  onChange={(e) => handleFieldChange("Team", e.target.value)}
                  className="form-input"
                  placeholder="z.B. Einzeln, Team, Mixed"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="button-container">
              <button type="submit" className="dark-red-button" disabled={loading}>
                {loading ? 'Speichere...' : 'Speichern'}
              </button>
              <button
                type="button"
                className="dark-red-button"
                onClick={onClose}
                disabled={loading}
              >
                Schließen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default KategorieBearbeiten;