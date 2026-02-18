// src/components/turnier/KategorieLoeschen.js
import React, { useState, useEffect } from "react";
import "../../styles/TurnierLoeschen.css"; // Gleiches Styling wie TurnierLoeschen

/**
 * KategorieLoeschen
 * -----------------
 * Modal zum Löschen einer Kategorie/Division mit Sicherheitsabfrage
 */
const KategorieLoeschen = ({ isOpen, onClose, refreshKategorien = () => {} }) => {
  const [kategorienList, setKategorienList] = useState([]);
  const [selectedKategorieCode, setSelectedKategorieCode] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Kategorien laden beim Öffnen
  useEffect(() => {
    if (isOpen) {
      fetchKategorien();
      setSelectedKategorieCode("");
      setConfirmationText("");
      setError("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  const fetchKategorien = async () => {
    setLoading(true);
    setError("");
    try {
      console.log("📡 Lade Kategorien zum Löschen...");
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
      console.log("✅ Kategorien zum Löschen geladen:", data.length);
    } catch (err) {
      console.error("❌ Fehler beim Laden der Kategorien:", err);
      setError("Fehler beim Laden der Kategorien: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Ausgewählte Kategorie finden
  const selectedKategorie = kategorienList.find(k => k.Division_Code === selectedKategorieCode);

  // Bestätigungstext prüfen
  const isConfirmationValid = () => {
    if (!selectedKategorie) return false;
    return confirmationText.toUpperCase() === selectedKategorie.Division_Code.toUpperCase();
  };

  // Lösch-Handler
  const handleDelete = async (event) => {
    event.preventDefault();
    
    if (!selectedKategorieCode) {
      setError("Bitte wählen Sie eine Kategorie aus.");
      return;
    }
    
    if (!isConfirmationValid()) {
      setError(`Bitte geben Sie "${selectedKategorie.Division_Code}" zur Bestätigung ein.`);
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log('🗑️ Lösche Kategorie:', selectedKategorieCode);

      const response = await fetch(
        `/api/divisionen/${selectedKategorieCode}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP Error: ${response.status}`);
      }

      console.log('✅ Kategorie erfolgreich gelöscht:', result);
      
      setSuccessMessage(`Kategorie "${selectedKategorie.Division_Name}" wurde gelöscht.`);
      setTimeout(() => {
        setSuccessMessage("");
        refreshKategorien();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Fehler beim Löschen der Kategorie:', err);
      
      // Spezielle Behandlung für Abhängigkeiten
      if (err.message.includes('wird noch verwendet') || err.message.includes('REFERENCED')) {
        setError(`Kategorie kann nicht gelöscht werden - sie wird noch von Wettkämpfern oder Turnieren verwendet.`);
      } else {
        setError(err.message || "Fehler beim Löschen der Kategorie");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <h2>⚠️ Kategorie löschen</h2>
        
        {loading && <p>Verarbeite Anfrage...</p>}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <div style={{
          background: '#fff3cd',
          color: '#856404',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #ffeaa7',
          marginBottom: '20px'
        }}>
          <h4>⚠️ Achtung!</h4>
          <p>Das Löschen einer Kategorie ist <strong>unwiderruflich</strong>. 
             Stellen Sie sicher, dass keine Wettkämpfer oder Turniere diese Kategorie verwenden.</p>
        </div>

        <form onSubmit={handleDelete}>
          {/* Kategorie-Auswahl */}
          <div className="form-group">
            <label style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              fontWeight: "bold",
              marginBottom: "10px",
            }}>
              Kategorie zum Löschen auswählen:
            </label>
            <select
              value={selectedKategorieCode}
              onChange={(e) => {
                setSelectedKategorieCode(e.target.value);
                setConfirmationText(""); // Reset confirmation
                setError("");
              }}
              className="form-input"
              disabled={loading}
            >
              <option value="">-- Kategorie auswählen --</option>
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

          {/* Kategorie-Details anzeigen */}
          {selectedKategorie && (
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              marginBottom: '20px'
            }}>
              <h4>Kategorie-Details:</h4>
              <p><strong>Code:</strong> {selectedKategorie.Division_Code}</p>
              <p><strong>Name:</strong> {selectedKategorie.Division_Name}</p>
              <p><strong>Typ:</strong> {selectedKategorie.Division_Type}</p>
              {selectedKategorie.Altersklasse && (
                <p><strong>Altersklasse:</strong> {selectedKategorie.Altersklasse}</p>
              )}
              {selectedKategorie.Gender && (
                <p><strong>Gender:</strong> {selectedKategorie.Gender}</p>
              )}
              {(selectedKategorie.Age_from && selectedKategorie.Age_to) && (
                <p><strong>Alter:</strong> {selectedKategorie.Age_from}-{selectedKategorie.Age_to}</p>
              )}
              {(selectedKategorie.Minimum_Weight && selectedKategorie.Maximum_Weight) && (
                <p><strong>Gewicht:</strong> {selectedKategorie.Minimum_Weight}-{selectedKategorie.Maximum_Weight}kg</p>
              )}
            </div>
          )}

          {/* Bestätigungsfeld */}
          {selectedKategorie && (
            <div className="form-group">
              <label style={{
                display: "block",
                fontWeight: "bold",
                marginBottom: "10px",
                color: "#dc3545"
              }}>
                Geben Sie "{selectedKategorie.Division_Code}" zur Bestätigung ein:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className="form-input"
                placeholder={`Tippen Sie "${selectedKategorie.Division_Code}" hier ein`}
                style={{
                  borderColor: isConfirmationValid() ? '#28a745' : '#dc3545'
                }}
                disabled={loading}
              />
              {confirmationText && !isConfirmationValid() && (
                <small style={{ color: '#dc3545', fontSize: '12px' }}>
                  Eingabe stimmt nicht überein
                </small>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="button-container">
            <button 
              type="submit" 
              className="dark-red-button" 
              disabled={loading || !isConfirmationValid()}
              style={{
                backgroundColor: isConfirmationValid() ? '#dc3545' : '#6c757d',
                cursor: isConfirmationValid() ? 'pointer' : 'not-allowed'
              }}
            >
              {loading ? 'Lösche...' : '🗑️ Endgültig löschen'}
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

        {/* Hilfe-Text */}
        <div style={{
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center',
          marginTop: '15px',
          borderTop: '1px solid #dee2e6',
          paddingTop: '10px'
        }}>
          💡 Tipp: Verwenden Sie "Kategorie bearbeiten" wenn Sie nur Änderungen vornehmen möchten.
        </div>
      </div>
    </div>
  );
};

export default KategorieLoeschen;