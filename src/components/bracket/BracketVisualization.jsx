// frontend/src/components/bracket/BracketVisualization.jsx
// BRACKET VISUALISIERUNG - K.O.-System Darstellung MIT LIVE-UPDATES

import React, { useState, useEffect } from 'react';
import withLiveUpdates from '../realtime/withLiveUpdates';
import './BracketVisualization.css';

const BracketVisualization = ({ 
  bracketData, 
  isLiveConnected,
  liveData,
  joinFightRoom,
  getLiveDataForFight 
}) => {
  const [kaempfe, setKaempfe] = useState([]);
  const [totalRunden, setTotalRunden] = useState(0);

  useEffect(() => {
    if (bracketData && bracketData.kaempfe) {
      const sortedKaempfe = [...bracketData.kaempfe].sort((a, b) => {
        if (a.runde !== b.runde) return a.runde - b.runde;
        return a.kampf_nummer - b.kampf_nummer;
      });
      
      setKaempfe(sortedKaempfe);
      
      // Maximale Rundenzahl ermitteln
      const maxRunde = Math.max(...sortedKaempfe.map(k => k.runde));
      setTotalRunden(maxRunde);
    }
  }, [bracketData]);

  // Kämpfe nach Runden gruppieren
  const getKaempfeByRunde = (runde) => {
    return kaempfe.filter(k => k.runde === runde);
  };

  // Runden-Namen generieren
  const getRundenName = (runde) => {
    if (runde === totalRunden) return 'Finale';
    if (runde === totalRunden - 1) return 'Halbfinale';  
    if (runde === totalRunden - 2) return 'Viertelfinale';
    if (runde === totalRunden - 3) return 'Achtelfinale';
    return `Runde ${runde}`;
  };

  if (!bracketData || !bracketData.bracket) {
    return (
      <div className="bracket-loading">
        <div className="loading-spinner"></div>
        <p>Bracket wird geladen...</p>
      </div>
    );
  }

  if (kaempfe.length === 0) {
    return (
      <div className="bracket-empty">
        <h3>🥊 Noch keine Kämpfe generiert</h3>
        <p>Das Bracket wurde erstellt, aber die Kämpfe sind noch nicht generiert.</p>
        <button className="btn btn-primary">
          Kämpfe generieren
        </button>
      </div>
    );
  }

  return (
    <div className="bracket-visualization">
      <div className="bracket-header">
        <h2>{bracketData.bracket.bracket_name}</h2>
        <div className="bracket-info">
          <span className="bracket-type">{bracketData.bracket.bracket_type.toUpperCase()}</span>
          <span className="participant-count">
            {bracketData.teilnehmer?.length || 0} / {bracketData.bracket.max_participants} Teilnehmer
          </span>
          <span className={`bracket-status status-${bracketData.bracket.status}`}>
            {bracketData.bracket.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="bracket-tree">
        {Array.from({ length: totalRunden }, (_, i) => i + 1).map(runde => (
          <div key={runde} className={`bracket-round round-${runde}`}>
            <div className="round-header">
              <h3>{getRundenName(runde)}</h3>
              <span className="round-number">Runde {runde}</span>
            </div>
            
            <div className="round-kaempfe">
              {getKaempfeByRunde(runde).map(kampf => (
                <KampfCard 
                  key={kampf.kampf_id} 
                  kampf={kampf}
                  isFinale={runde === totalRunden}
                  liveData={liveData || {}}
                  joinFightRoom={joinFightRoom}
                  isLiveConnected={isLiveConnected}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Teilnehmer-Übersicht */}
      {bracketData.teilnehmer && bracketData.teilnehmer.length > 0 && (
        <div className="bracket-participants">
          <h3>Teilnehmer</h3>
          <div className="participants-grid">
            {bracketData.teilnehmer.map(teilnehmer => (
              <TeilnehmerCard key={teilnehmer.wettkaempfer_id} teilnehmer={teilnehmer} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Einzelner Kampf als Card mit Live-Updates
const KampfCard = ({ kampf, isFinale, liveData, joinFightRoom, isLiveConnected }) => {
  // Live-Daten für diesen Kampf abrufen
  const liveKampfData = liveData[kampf.id] || {};
  const hasLiveUpdates = Object.keys(liveKampfData).length > 0;

  // Live-Score oder Datenbank-Score verwenden
  const kaempfer1Points = liveKampfData.kaempfer1Points !== undefined 
    ? liveKampfData.kaempfer1Points 
    : (kampf.punkte_kaempfer1 || 0);
  
  const kaempfer2Points = liveKampfData.kaempfer2Points !== undefined 
    ? liveKampfData.kaempfer2Points 
    : (kampf.punkte_kaempfer2 || 0);

  // Live-Status oder Datenbank-Status verwenden
  const currentStatus = liveKampfData.status || kampf.status || 'pending';
  
  // Bei Klick auf Kampf -> Live-Updates abonnieren
  const handleKampfClick = () => {
    if (isLiveConnected && joinFightRoom) {
      joinFightRoom(kampf.id);
      console.log(`🏟️ Live-Updates für Kampf ${kampf.id} aktiviert`);
    }
  };
  const getStatusClass = (status) => {
    switch (status) {
      case 'finished': return 'kampf-finished';
      case 'running': return 'kampf-running';
      case 'ready': return 'kampf-ready';
      default: return 'kampf-pending';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'finished': return '✅';
      case 'running': return '🥊';
      case 'ready': return '⏱️';
      default: return '⏳';
    }
  };

  return (
    <div 
      className={`kampf-card ${getStatusClass(currentStatus)} ${isFinale ? 'finale-kampf' : ''} ${hasLiveUpdates ? 'live-active' : ''}`}
      onClick={handleKampfClick}
      style={{ cursor: isLiveConnected ? 'pointer' : 'default' }}
    >
      <div className="kampf-header">
        <span className="kampf-nummer">#{kampf.kampf_nummer}</span>
        <span className="kampf-status">
          {getStatusIcon(currentStatus)} {currentStatus.toUpperCase()}
          {hasLiveUpdates && <span className="live-indicator">🔴 LIVE</span>}
        </span>
      </div>

      <div className="kampf-fighters">
        {/* Kämpfer 1 */}
        <div className={`fighter fighter-1 ${kampf.gewinner_id === kampf.kaempfer1_id ? 'winner' : kampf.gewinner_id ? 'loser' : ''}`}>
          {kampf.kaempfer1_vorname && kampf.kaempfer1_nachname ? (
            <>
              <div className="fighter-name">
                {kampf.kaempfer1_vorname} {kampf.kaempfer1_nachname}
              </div>
              <div className="fighter-verein">{kampf.kaempfer1_verein}</div>
              {(currentStatus === 'finished' || currentStatus === 'running' || hasLiveUpdates) && (
                <div className={`fighter-points ${hasLiveUpdates ? 'live-points' : ''}`}>
                  {kaempfer1Points} Punkte
                  {hasLiveUpdates && <span className="live-pulse">●</span>}
                </div>
              )}
            </>
          ) : (
            <div className="fighter-placeholder">Wartend...</div>
          )}
        </div>

        <div className="vs-divider">VS</div>

        {/* Kämpfer 2 */}
        <div className={`fighter fighter-2 ${kampf.gewinner_id === kampf.kaempfer2_id ? 'winner' : kampf.gewinner_id ? 'loser' : ''}`}>
          {kampf.kaempfer2_vorname && kampf.kaempfer2_nachname ? (
            <>
              <div className="fighter-name">
                {kampf.kaempfer2_vorname} {kampf.kaempfer2_nachname}
              </div>
              <div className="fighter-verein">{kampf.kaempfer2_verein}</div>
              {(currentStatus === 'finished' || currentStatus === 'running' || hasLiveUpdates) && (
                <div className={`fighter-points ${hasLiveUpdates ? 'live-points' : ''}`}>
                  {kaempfer2Points} Punkte
                  {hasLiveUpdates && <span className="live-pulse">●</span>}
                </div>
              )}
            </>
          ) : (
            <div className="fighter-placeholder">Wartend...</div>
          )}
        </div>
      </div>

      {kampf.status === 'finished' && (
        <div className="kampf-result">
          <div className="winner-highlight">
            🏆 Sieger: {kampf.gewinner_vorname} {kampf.gewinner_nachname}
          </div>
          {kampf.kampfzeit_minuten > 0 && (
            <div className="kampf-time">
              Kampfzeit: {kampf.kampfzeit_minuten}:{kampf.kampfzeit_sekunden.toString().padStart(2, '0')}
            </div>
          )}
        </div>
      )}

      {kampf.geplante_zeit && (
        <div className="kampf-schedule">
          📅 {new Date(kampf.geplante_zeit).toLocaleString('de-DE')}
        </div>
      )}

      {kampf.matte_nummer && (
        <div className="kampf-matte">
          🥋 Matte {kampf.matte_nummer}
        </div>
      )}
    </div>
  );
};

// Teilnehmer-Card für Übersicht
const TeilnehmerCard = ({ teilnehmer }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'winner': return 'participant-winner';
      case 'eliminated': return 'participant-eliminated';
      default: return 'participant-active';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'winner': return '🏆';
      case 'eliminated': return '❌';
      default: return '🥊';
    }
  };

  return (
    <div className={`participant-card ${getStatusClass(teilnehmer.status)}`}>
      <div className="participant-header">
        {teilnehmer.seed_position && (
          <span className="seed-position">#{teilnehmer.seed_position}</span>
        )}
        <span className="participant-status">
          {getStatusIcon(teilnehmer.status)}
        </span>
      </div>

      <div className="participant-info">
        <div className="participant-name">
          {teilnehmer.vorname} {teilnehmer.nachname}
        </div>
        <div className="participant-details">
          <span className="participant-verein">{teilnehmer.verein_name}</span>
          <span className="participant-weight">{teilnehmer.gewicht}kg</span>
        </div>
        <div className="participant-level">
          {teilnehmer.gurtfarbe} • {teilnehmer.skill_level}
        </div>
      </div>

      {teilnehmer.platzierung && (
        <div className="participant-ranking">
          🥇 Platz {teilnehmer.platzierung}
        </div>
      )}

      {teilnehmer.ausgeschieden_in_runde && (
        <div className="participant-elimination">
          Ausgeschieden in Runde {teilnehmer.ausgeschieden_in_runde}
        </div>
      )}
    </div>
  );
};

export default withLiveUpdates(BracketVisualization);