import React, { useState, useEffect } from 'react';
import { getWettkaempferByVerein, updateWettkaempfer, deleteWettkaempfer } from '../../api/wettkaempferApi';
import { getAllDivisionen } from '../../api/divisionApi'; // ✅ Ihre eigene API verwenden

// Hilfsfunktionen
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

// ENUM Werte laut deiner DB
const skillLevels = ["Beginner", "Intermediate", "Advanced", "Black Belt"];
const gurtfarben = [
  "Weiß", "Weiß/Gelb", "Gelb", "Orange", "Grün", "Grün/Blau", "Blau",
  "Lila", "Blau/Rot", "Rot", "Braun", "Schwarz"
];
const geschlechter = ["männlich", "weiblich", "divers"];

function MemberList({ verein_id }) {
  const [wettkaempfer, setWettkaempfer] = useState([]);
  const [selectedLetter, setSelectedLetter] = useState('');
  const [availableLetters, setAvailableLetters] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [editableMember, setEditableMember] = useState(null);
  const [divisionen, setDivisionen] = useState([]); // Divisionen State
  const [loadingDivisionen, setLoadingDivisionen] = useState(false);

  // ✅ Divisionen laden mit Ihrer API
  const fetchDivisionen = async () => {
    try {
      setLoadingDivisionen(true);
      const data = await getAllDivisionen(); // ✅ Ihre eigene API-Funktion
      setDivisionen(data || []);
      console.log('✅ Divisionen geladen:', data?.length || 0);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Divisionen:', error);
      setDivisionen([]); // Fallback zu leerem Array
    } finally {
      setLoadingDivisionen(false);
    }
  };

  // API-Aufruf
  const fetchWettkaempfer = async () => {
    try {
      if (!verein_id) return;
      const data = await getWettkaempferByVerein(verein_id);
      setWettkaempfer(data);
    } catch (error) {
      console.error("❌ Fehler beim Abrufen der Wettkämpfer:", error);
    }
  };

  useEffect(() => {
    fetchWettkaempfer();
    fetchDivisionen(); // ✅ Divisionen beim Start laden
    // eslint-disable-next-line
  }, [verein_id]);

  useEffect(() => {
    const letters = [...new Set(wettkaempfer.map(m => m.nachname?.charAt(0).toUpperCase()).filter(Boolean))].sort();
    setAvailableLetters(letters);
  }, [wettkaempfer]);

  useEffect(() => {
    const filtered = selectedLetter ? wettkaempfer.filter(m => m.nachname?.charAt(0).toUpperCase() === selectedLetter) : wettkaempfer;
    setFilteredMembers(filtered);
  }, [selectedLetter, wettkaempfer]);

  const handleDelete = async (id) => {
    if (window.confirm("Wollen Sie wirklich den Wettkämpfer löschen?")) {
      try {
        await deleteWettkaempfer(id);
        setWettkaempfer(prev => prev.filter(m => m.wettkaempfer_id !== id));
      } catch (error) {
        console.error("❌ Fehler beim Löschen:", error);
      }
    }
  };

  const handleEdit = (member) => {
    setEditableMember({ ...member });
  };

  const handleCloseModal = () => {
    setEditableMember(null);
  };

  const handleSave = async () => {
    if (!editableMember || !editableMember.wettkaempfer_id || isNaN(editableMember.wettkaempfer_id)) {
      alert("Fehler: Kein `wettkaempfer_id` gesetzt!");
      return;
    }

    const cleanData = {
      ...editableMember,
      wettkaempfer_id: Number(editableMember.wettkaempfer_id),
      gewicht: parseFloat(editableMember.gewicht),
    };

    try {
      const response = await updateWettkaempfer(cleanData);
      if (!response) return;

      setWettkaempfer((prev) =>
        prev.map((m) => (m.wettkaempfer_id === cleanData.wettkaempfer_id ? { ...m, ...cleanData } : m))
      );

      setEditableMember(null);
    } catch (error) {
      console.error("❌ Fehler beim Speichern:", error);
    }
  };

  const handleChange = (e) => {
    setEditableMember({ ...editableMember, [e.target.name]: e.target.value });
  };

  const buttonStyle = {
    padding: '10px 15px',
    backgroundColor: '#8B0000',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '14px',
    width: '100%',
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginTop: '20px' }}>
      <h3>
        Wettkämpfer 
        {loadingDivisionen && <span style={{color: '#999', fontSize: '12px'}}> (Lade Kategorien...)</span>}
      </h3>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <button onClick={() => setSelectedLetter('')} style={buttonStyle}>Alle</button>
        {availableLetters.map(letter => (
          <button key={letter} onClick={() => setSelectedLetter(letter)} style={buttonStyle}>
            {letter}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginTop: '20px' }}>
        {filteredMembers.map(member => {
          // ✅ Division/Kategorie finden
          const division = divisionen.find(d => d.Division_Code === member.division_code);
          
          return (
            <div key={member.wettkaempfer_id} style={{ backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '15px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '2px solid #8B0000' }}>
                {member.nachname}, {member.vorname}
              </div>
              <div>
                <p><strong>Geburtsdatum:</strong> {formatDate(member.geburtsdatum)}</p>
                <p><strong>Geschlecht:</strong> {member.geschlecht}</p>
                <p><strong>Gewicht:</strong> {member.gewicht} kg</p>
                <p><strong>Skill Level:</strong> {member.skill_level}</p>
                {/* ✅ Kategorie anzeigen */}
                <p><strong>Kategorie:</strong> {
                  division ? (
                    <span title={division.Division_Name} style={{
                      backgroundColor: '#8B0000',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '12px'
                    }}>
                      {division.Division_Code}
                    </span>
                  ) : (
                    <span style={{color: '#999'}}>
                      {member.division_code || 'Keine Kategorie'}
                    </span>
                  )
                }</p>
                <p><strong>Email:</strong> {member.email || "Nicht angegeben"}</p>
                <p><strong>Handy:</strong> {member.handy || "Nicht angegeben"}</p>
                <p><strong>Nationalität:</strong> {member.nationalitaet}</p>
                <p><strong>Gurtfarbe:</strong> {member.gurtfarbe}</p>
                <p><strong>Kampfstil:</strong> {member.kampfstil}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button style={buttonStyle} onClick={() => handleEdit(member)}>Bearbeiten</button>
                  <button style={buttonStyle} onClick={() => handleDelete(member.wettkaempfer_id)}>Löschen</button>
                  <button style={buttonStyle} onClick={() => console.log("Turnieranmeldung", member.wettkaempfer_id)}>Turnieranmeldung</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup Modal für Bearbeiten */}
      {editableMember && (
        <div style={{
          position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', maxHeight: '80vh', overflowY: 'auto' }}>
            <h3>Bearbeiten</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label>Vorname</label>
              <input name="vorname" value={editableMember.vorname} onChange={handleChange} />

              <label>Nachname</label>
              <input name="nachname" value={editableMember.nachname} onChange={handleChange} />

              <label>Geburtsdatum</label>
              <input name="geburtsdatum" type="date" value={formatDateForInput(editableMember.geburtsdatum)} onChange={handleChange} />

              <label>Gewicht</label>
              <input name="gewicht" type="number" value={editableMember.gewicht} onChange={handleChange} />

              <label>Geschlecht</label>
              <select name="geschlecht" value={editableMember.geschlecht} onChange={handleChange}>
                <option value="">Bitte wählen</option>
                {geschlechter.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <label>Skill Level</label>
              <select name="skill_level" value={editableMember.skill_level} onChange={handleChange}>
                <option value="">Bitte wählen</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>

              {/* ✅ Kategorie/Division auswählbar */}
              <label>Kategorie</label>
              <select name="division_code" value={editableMember.division_code || ''} onChange={handleChange}>
                <option value="">Keine Kategorie</option>
                {divisionen.map(division => (
                  <option key={division.Division_Code} value={division.Division_Code}>
                    {division.Division_Code} - {division.Division_Name}
                  </option>
                ))}
              </select>

              <label>Email</label>
              <input name="email" value={editableMember.email} onChange={handleChange} />

              <label>Handy</label>
              <input name="handy" value={editableMember.handy} onChange={handleChange} />

              <label>Nationalität</label>
              <input name="nationalitaet" value={editableMember.nationalitaet} onChange={handleChange} />

              <label>Gurtfarbe</label>
              <select name="gurtfarbe" value={editableMember.gurtfarbe} onChange={handleChange}>
                <option value="">Bitte wählen</option>
                {gurtfarben.map(gurt => (
                  <option key={gurt} value={gurt}>{gurt}</option>
                ))}
              </select>

              <label>Kampfstil</label>
              <input name="kampfstil" value={editableMember.kampfstil} onChange={handleChange} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button style={buttonStyle} onClick={handleSave}>Speichern</button>
              <button style={buttonStyle} onClick={handleCloseModal}>Abbrechen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MemberList;