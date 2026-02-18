import React, { useState, useEffect } from "react";
import "../../styles/TurnierBearbeiten.css"; // ✅ Korrigierter CSS-Pfad

/**
 * TurnierAnlegen
 * -------------
 * Diese Komponente öffnet ein Popup, in dem ein neues Turnier angelegt werden kann.
 * Das Formular wird dynamisch erzeugt, sodass alle relevanten Felder (z. B. name, datum, ort, disziplin)
 * angezeigt werden. Für das Feld "disziplin" wird eine Checkbox-Gruppe verwendet, die mehrere
 * Auswahlmöglichkeiten (Formen, Selbstverteidigung, Kickboxen, Kumite, Bruchtest, Grappling, Rumble)
 * bietet.
 */
const TurnierAnlegen = ({ isOpen, onClose, refreshTournaments = () => {} }) => {
  // Dynamische Felder – falls die API in Zukunft mehr Felder liefert, kann hier die Logik erweitert werden.
  // Hier nutzen wir standardmäßig diese Felder.
  const [fields, setFields] = useState([]);
  // newTournament enthält die aktuellen Werte des neuen Turniers
  const [newTournament, setNewTournament] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ✅ KORRIGIERT: Keine Mapping-Tabelle mehr - verwende deutsche Namen direkt
  // Das Backend erwartet jetzt die deutschen Namen wie sie sind!
  const availableDisciplines = [
    "Formen",
    "Selbstverteidigung", 
    "Kickboxen",
    "Kumite",
    "Bruchtest",
    "Grappling",
    "Rumble",
  ];

  // Beim Öffnen des Popups:
  // Falls vorhanden, könntest du hier auch ein API-Call machen, um die Feldnamen aus dem Schema zu holen.
  // Wir verwenden hier Standardfelder.
  useEffect(() => {
    if (isOpen) {
      const defaultFields = ["name", "datum", "ort", "disziplin"];
      setFields(defaultFields);
      // Initialisiere das neue Turnier-Objekt mit leeren Strings
      const initialData = {};
      defaultFields.forEach((field) => {
        initialData[field] = "";
      });
      setNewTournament(initialData);
    }
  }, [isOpen]);

  // Aktualisiert einen einzelnen Feldwert
  const handleFieldChange = (field, value) => {
    setNewTournament({
      ...newTournament,
      [field]: value,
    });
  };

  // Event-Handler für den Formular-Submit (POST-Request)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // ✅ KORRIGIERT: Auth-Token aus localStorage holen
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Kein Auth-Token gefunden. Bitte loggen Sie sich ein.');
      }
      
      console.log('🎯 Erstelle Turnier:', newTournament);
      console.log('🔑 Verwende Token:', token.substring(0, 20) + '...');
      
      const response = await fetch("/api/turniere", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // ✅ KORRIGIERT: Auth-Header hinzugefügt
        },
        body: JSON.stringify(newTournament),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Turnier erstellt:', result);
      
      setSuccessMessage("Turnier erfolgreich angelegt!");
      setTimeout(() => setSuccessMessage(""), 3000);
      refreshTournaments();
      onClose();
      
    } catch (err) {
      console.error('❌ Fehler beim Erstellen des Turniers:', err);
      setError("Error creating tournament: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Turnier anlegen</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        {/* ✅ VERBESSERT: Token-Status anzeigen (Development) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{fontSize: '12px', color: '#666', marginBottom: '10px'}}>
            🔑 Token: {localStorage.getItem('authToken') ? '✅ Vorhanden' : '❌ Fehlt'}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field} className="form-group">
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              {field === "disziplin" ? (
                <div className="checkbox-group">
                  {availableDisciplines.map((disc) => {
                    // ✅ KORRIGIERT: Verwende deutsche Namen direkt - kein Mapping mehr!
                    const selectedDisciplines = newTournament.disziplin
                      ? newTournament.disziplin.split(",").map((s) => s.trim())
                      : [];
                    const isChecked = selectedDisciplines.includes(disc);
                    
                    return (
                      <label key={disc} className="checkbox-label">
                        <input
                          type="checkbox"
                          value={disc}
                          checked={isChecked}
                          onChange={(e) => {
                            let newDisciplineArr = selectedDisciplines;
                            if (e.target.checked) {
                              // Hinzufügen, falls noch nicht vorhanden
                              newDisciplineArr = [...newDisciplineArr, disc];
                            } else {
                              // Entfernen
                              newDisciplineArr = newDisciplineArr.filter((d) => d !== disc);
                            }
                            
                            // ✅ KORRIGIERT: Verwende deutsche Namen direkt
                            handleFieldChange("disziplin", newDisciplineArr.join(", "));
                          }}
                        />
                        {disc}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  type={field === "datum" ? "date" : "text"}
                  value={newTournament[field] || ""}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="form-input"
                  placeholder={field === "name" ? "Turnier-Name eingeben..." : ""}
                  required={field === "name" || field === "datum" || field === "ort"}
                />
              )}
            </div>
          ))}
          <div className="button-container">
            <button type="submit" className="dark-red-button" disabled={loading}>
              {loading ? "Wird erstellt..." : "Anlegen"}
            </button>
            <button
              type="button"
              className="dark-red-button"
              onClick={() => {
                refreshTournaments();
                onClose();
              }}
            >
              Schließen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TurnierAnlegen;