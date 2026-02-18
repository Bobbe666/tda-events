import React, { useState, useEffect } from "react";
import "../../styles/TurnierLoeschen.css"; // ✅ Korrigierter CSS-Pfad

/**
 * TurnierLoeschen
 * ---------------
 * Dieses Modal zeigt ein Dropdown an, das nur zukünftige Turniere enthält.
 * Der Benutzer kann ein Turnier auswählen und dann per Radiobutton entscheiden, 
 * ob das Turnier gelöscht (DELETE-Request) oder als "abgesagt" markiert (PUT-Request mit { status: "abgesagt" }) werden soll.
 */
const TurnierLoeschen = ({ isOpen, onClose, refreshTournaments = () => {} }) => {
  // --- STATE & HOOKS ---
  const [futureTournaments, setFutureTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [action, setAction] = useState(""); // "delete" oder "cancel"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- TURNIERDATEN LADEN (nur zukünftige Turniere) ---
  useEffect(() => {
    if (isOpen) {
      fetchFutureTournaments();
    }
  }, [isOpen]);

  const fetchFutureTournaments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/turniere");
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      const now = new Date();
      // Filtere Turniere, deren Datum in der Zukunft liegt
      const future = data.filter(
        (tournament) => new Date(tournament.datum) > now
      );
      setFutureTournaments(future);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- EVENT-HANDLER: Formular-Submit ---
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedTournamentId) {
      setError("Bitte wählen Sie ein Turnier aus.");
      return;
    }
    if (!action) {
      setError(
        "Bitte wählen Sie, ob das Turnier gelöscht oder als abgesagt markiert werden soll."
      );
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (action === "delete") {
        // DELETE-Request: Turnier vollständig entfernen
        const response = await fetch(
          `/api/turniere/${selectedTournamentId}`,
          { method: "DELETE" }
        );
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        setSuccessMessage("Turnier wurde gelöscht.");
      } else if (action === "cancel") {
        console.log("Cancel action: Marking tournament as 'abgesagt'.");
        // PUT-Request: Nur den Status auf "abgesagt" setzen
        const response = await fetch(
          `/api/turniere/${selectedTournamentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "abgesagt" }),
          }
        );
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        setSuccessMessage("Turnier wurde als abgesagt markiert.");
      }
      setTimeout(() => setSuccessMessage(""), 3000);
      refreshTournaments();
      onClose();
    } catch (err) {
      setError("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERING ---
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Turnier löschen / absagen</h2>
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            {/* Überschrift als Block-Element über die volle Breite */}
            <label
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              Wählen Sie ein zukünftiges Turnier:
            </label>
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="form-input"
            >
              <option value="">-- Turnier auswählen --</option>
              {futureTournaments.map((tournament) => (
                <option
                  key={tournament.turnier_id}
                  value={tournament.turnier_id}
                >
                  {tournament.name} (
                  {new Date(tournament.datum).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Aktion wählen:</label>
            <div>
              <label style={{ marginRight: "20px" }}>
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === "delete"}
                  onChange={(e) => setAction(e.target.value)}
                />
                Löschen
              </label>
              <label>
                <input
                  type="radio"
                  name="action"
                  value="cancel"
                  checked={action === "cancel"}
                  onChange={(e) => setAction(e.target.value)}
                />
                Als abgesagt markieren
              </label>
            </div>
          </div>
          <div className="button-container">
            <button type="submit" className="dark-red-button">
              Bestätigen
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

export default TurnierLoeschen;