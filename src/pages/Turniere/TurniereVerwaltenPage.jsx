// src/pages/Turniere/TurniereVerwaltenPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import TurnierAnlegen from '../../components/turnier/TurnierAnlegen';
import TurnierLoeschen from '../../components/turnier/TurnierLoeschen';
import '../../styles/Dashboard.css';

export default function TurniereVerwaltenPage() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  const fetchTournaments = async () => {
    try {
      const res = await fetch('/api/turniere');
      if (!res.ok) throw new Error(`Fehler: ${res.status}`);

      const responseData = await res.json();
      console.log('📦 API Response:', responseData);

      if (responseData.success && Array.isArray(responseData.data)) {
        const data = responseData.data;
        data.sort((a, b) => new Date(b.datum) - new Date(a.datum));
        setTournaments(data);
        console.log('✅ Turniere geladen:', data.length);
      } else if (Array.isArray(responseData)) {
        responseData.sort((a, b) => new Date(b.datum) - new Date(a.datum));
        setTournaments(responseData);
        console.log('✅ Turniere geladen (direktes Array):', responseData.length);
      } else {
        console.error('❌ Unerwartetes Response-Format:', responseData);
        setTournaments([]);
      }
    } catch (e) {
      console.error('❌ Fehler beim Abrufen der Turniere:', e);
      setTournaments([]);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleEditClick = (turnierId) => {
    navigate(`/dashboard/turnier-bearbeiten/${turnierId}`);
  };

  return (
    <div className="dashboard-panel">
      <h3>Turniere verwalten</h3>

      <div className="button-container">
        <Button onClick={() => setCreateOpen(true)}>Turnier anlegen</Button>
        <Button onClick={() => setDeleteOpen(true)}>Turnier löschen</Button>
      </div>

      {tournaments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Keine Turniere gefunden oder noch nicht geladen.</p>
        </div>
      ) : (
        <table className="tournament-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Datum</th>
              <th>Ort</th>
              <th>Disziplin</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map(t => (
              <tr
                key={t.turnier_id}
                style={{ textDecoration: t.status === 'abgesagt' ? 'line-through' : 'none' }}
              >
                <td>{t.name}</td>
                <td>{new Date(t.datum).toLocaleDateString()}</td>
                <td>{t.ort}</td>
                <td>{t.disziplin}</td>
                <td>{t.status || 'Aktiv'}</td>
                <td>
                  <Button onClick={() => handleEditClick(t.turnier_id)}>
                    Bearbeiten
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <TurnierAnlegen
        isOpen={isCreateOpen}
        onClose={() => { setCreateOpen(false); fetchTournaments(); }}
        refreshTournaments={fetchTournaments}
      />
      <TurnierLoeschen
        isOpen={isDeleteOpen}
        onClose={() => { setDeleteOpen(false); fetchTournaments(); }}
        refreshTournaments={fetchTournaments}
      />
    </div>
  );
}
