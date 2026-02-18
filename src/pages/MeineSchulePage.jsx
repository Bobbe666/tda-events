import React, { useState, useEffect } from 'react';

// ✅ Club-Komponente - Korrigierter Pfad
import ClubEditModal from '../components/club/ClubEditModal';

// ✅ Member-Komponenten - Korrigierte Pfade
import MemberList from '../components/member/MemberList';
import AddWettkaempfer from '../components/turnier/AddWettkaempfer';

// ✅ Turniere - Korrigierter Pfad
import TurnierListe from '../components/turnier/TurnierListe';

// ✅ Styles direkt definiert (statt problematischen Import)
const styles = {
  meineSchuleContainerStyle: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  flexContainerStyle: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px'
  },
  leftPaneStyle: {
    flex: '1',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px'
  },
  middlePaneStyle: {
    flex: '2',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  rightPaneStyle: {
    flex: '1',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  clubDataStyle: {
    marginBottom: '30px',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  wettkaempferContainerStyle: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonColumnStyle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px'
  },
  editButtonStyle: {
    padding: '10px 15px',
    backgroundColor: '#8B0000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '15px'
  },
  addButtonStyle: {
    padding: '10px 15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  deleteButtonStyle: {
    padding: '10px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  registerFighterButtonStyle: {
    padding: '10px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  turnierListStyle: {
    listStyle: 'none',
    padding: 0
  },
  turnierItemStyle: {
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #dee2e6'
  },
  registerButtonStyle: {
    padding: '5px 10px',
    backgroundColor: '#8B0000',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    marginLeft: '10px',
    fontSize: '12px'
  }
};

function MeineSchule({ vereins_id: propVereinsId }) {
  const [vereins_id, setVereinsId] = useState(
    propVereinsId || localStorage.getItem("vereins_id")
  );
  const [clubData, setClubData] = useState(null);
  const [wettkaempfer, setWettkaempfer] = useState([]);
  const [turniere, setTurniere] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false); // Steuert das Hinzufügen-Fenster

  useEffect(() => {
    const storedId = localStorage.getItem("vereins_id");
    if (!vereins_id && storedId) {
      setVereinsId(storedId);
    } else if (!vereins_id) {
      setError({ message: "Fehler: Vereins-ID fehlt! Speichern nicht möglich." });
      setLoading(false);
    }
  }, [vereins_id]);

  useEffect(() => {
    if (!vereins_id) return;

    const fetchClubData = async () => {
      try {
        const response = await fetch(`/api/vereine/${vereins_id}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Vereinsdaten");
        const data = await response.json();
        setClubData(data);
      } catch (err) {
        console.error("Fehler beim Laden der Vereinsdaten:", err);
      }
    };

    const fetchWettkaempfer = async () => {
      try {
        const response = await fetch(`/api/wettkaempfer/verein/${vereins_id}`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Wettkämpfer");
        const fetchedWettkaempfer = await response.json();
        setWettkaempfer(fetchedWettkaempfer);
      } catch (err) {
        console.error("Fehler beim Laden der Wettkämpfer-Daten:", err);
      }
    };

    const fetchTurniere = async () => {
      try {
        const response = await fetch(`/api/turniere`);
        if (!response.ok) throw new Error("Fehler beim Abrufen der Turniere");
        const fetchedTurniere = await response.json();
        setTurniere(fetchedTurniere);
      } catch (err) {
        console.error("Fehler beim Laden der Turnier-Daten:", err);
      }
    };

    Promise.all([fetchClubData(), fetchWettkaempfer(), fetchTurniere()])
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [vereins_id]);

  const handleUpdateClubData = (updatedData) => {
    if (!updatedData.vereins_id) {
      console.error("Fehler: Keine Vereins-ID im Update erhalten!");
      return;
    }
    setClubData(updatedData);
  };

  if (loading) return <p>⏳ Lade Daten...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ Fehler: {error.message}</p>;

  return (
    <div style={styles.meineSchuleContainerStyle}>
      <div style={styles.flexContainerStyle}>
        <div style={styles.leftPaneStyle}>
          {clubData && (
            <div style={styles.clubDataStyle}>
              <h3>Vereinsdaten</h3>
              <p><strong>Name:</strong> {clubData.name}</p>
              <p><strong>Email:</strong> {clubData.email}</p>
              <p><strong>Ansprechpartner:</strong> {clubData.ansprechpartner || "Nicht angegeben"}</p>
              <p><strong>Telefon:</strong> {clubData.telefon || "Nicht angegeben"}</p>
              <p><strong>Adresse:</strong> {clubData.strasse} {clubData.hausnummer}, {clubData.plz} {clubData.ort}</p>
              <p>
                <strong>Homepage:</strong>{' '}
                {clubData.homepage ? (
                  <a href={clubData.homepage} target="_blank" rel="noopener noreferrer">{clubData.homepage}</a>
                ) : ('Nicht angegeben')}
              </p>
              {clubData.logo && <img src={clubData.logo} alt="Vereinslogo" style={{ maxWidth: '150px' }} />}
              <button style={styles.editButtonStyle} onClick={() => setShowEditModal(true)}>
                Vereinsdaten bearbeiten
              </button>
            </div>
          )}

          {/* 📌 Neuer Bereich für Wettkämpferdaten */}
          <div style={styles.wettkaempferContainerStyle}>
            <h3>Wettkämpferdaten</h3>
            <div style={styles.buttonColumnStyle}>
              <button style={styles.addButtonStyle} onClick={() => setIsAdding(true)}>
                Wettkämpfer hinzufügen
              </button>
              <button style={styles.deleteButtonStyle} onClick={() => alert("Löschen-Funktion kommt später!")}>
                Wettkämpfer löschen
              </button>
              <button 
                style={styles.registerFighterButtonStyle} 
                onClick={() => console.log("Wettkämpfer für Turniere anmelden")}
              >
                Turnieranmeldung
              </button>
            </div>
          </div>
        </div>

        <div style={styles.middlePaneStyle}>
          {/* 🔹 MemberList ohne Buttons */}
          <MemberList wettkaempfer={wettkaempfer} onMemberUpdate={() => {}} />
        </div>

        <div style={styles.rightPaneStyle}>
          <h3>Kommende Turniere</h3>
          {turniere.length > 0 ? (
            <ul style={styles.turnierListStyle}>
              {turniere.map((turnier) => (
                <li key={turnier.turnier_id} style={styles.turnierItemStyle}>
                  <strong>{turnier.name}</strong> - {new Date(turnier.datum).toLocaleDateString()}
                  <button 
                    style={styles.registerButtonStyle} 
                    onClick={() => console.log(`Anmeldung für Turnier ${turnier.turnier_id}`)}
                  >
                    Jetzt anmelden
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Keine kommenden Turniere</p>
          )}
        </div>
      </div>

      {isAdding && <AddWettkaempfer setIsAdding={setIsAdding} setWettkaempfer={setWettkaempfer} />}

      {showEditModal && clubData && (
        <ClubEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          clubData={clubData}
          onUpdate={handleUpdateClubData}
        />
      )}
    </div>
  );
}

export default MeineSchule;