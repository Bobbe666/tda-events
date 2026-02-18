// frontend/src/components/analytics/AnalyticsDashboard.jsx
// STATISTIKEN UND ANALYTICS DASHBOARD

import React, { useState, useEffect } from 'react';

const AnalyticsDashboard = ({ turnier, onClose }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('all');

  // Tabs für verschiedene Analytics-Bereiche
  const TABS = {
    overview: { name: 'Übersicht', icon: '📊' },
    participants: { name: 'Teilnehmer', icon: '👥' },
    performance: { name: 'Performance', icon: '🏆' },
    weights: { name: 'Gewichtsklassen', icon: '⚖️' },
    clubs: { name: 'Vereine', icon: '🏢' },
    elo: { name: 'ELO-Ratings', icon: '📈' }
  };

  // Lade Analytics-Daten
  useEffect(() => {
    loadAnalyticsData();
  }, [turnier.turnier_id, dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Sammle verschiedene Statistiken
      const [
        pairingStats,
        tournamentParticipants,
        eloRatings,
        weightAssignments
      ] = await Promise.all([
        fetch('/api/pairing/statistics/overview', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        
        fetch(`/api/anmeldungen/turnier/${turnier.turnier_id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json()),
        
        fetch('/api/pairing/elo-ratings?limit=100')
          .then(res => res.json()),
          
        fetch(`/api/pairing/tournaments/${turnier.turnier_id}/weight-assignments`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(res => res.json())
      ]);

      // Verarbeite und kombiniere Daten
      const processedData = processAnalyticsData({
        pairingStats: pairingStats.success ? pairingStats.data : {},
        participants: tournamentParticipants.success ? tournamentParticipants.data : [],
        eloRatings: eloRatings.success ? eloRatings.data : [],
        weightAssignments: weightAssignments.success ? weightAssignments.data : []
      });

      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Fehler beim Laden der Analytics-Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verarbeite Analytics-Daten
  const processAnalyticsData = (rawData) => {
    const { pairingStats, participants, eloRatings, weightAssignments } = rawData;

    // Grundlegende Statistiken
    const overview = {
      totalParticipants: participants.length,
      totalWeightClasses: new Set(weightAssignments.map(w => w.gewichtsklasse_id)).size,
      averageAge: participants.length > 0 ? 
        Math.round(participants.reduce((sum, p) => sum + (p.alter || 25), 0) / participants.length) : 0,
      genderDistribution: {
        male: participants.filter(p => p.geschlecht === 'male').length,
        female: participants.filter(p => p.geschlecht === 'female').length
      }
    };

    // Vereins-Statistiken
    const clubStats = {};
    participants.forEach(p => {
      const club = p.verein_name || 'Unbekannt';
      if (!clubStats[club]) {
        clubStats[club] = { count: 0, participants: [] };
      }
      clubStats[club].count++;
      clubStats[club].participants.push(p);
    });

    // Gewichtsverteilung
    const weightDistribution = {};
    participants.forEach(p => {
      if (p.gewicht) {
        const weightRange = getWeightRange(p.gewicht);
        weightDistribution[weightRange] = (weightDistribution[weightRange] || 0) + 1;
      }
    });

    // ELO-Statistiken
    const eloStats = {
      averageRating: eloRatings.length > 0 ? 
        Math.round(eloRatings.reduce((sum, r) => sum + r.current_rating, 0) / eloRatings.length) : 0,
      topRated: eloRatings.slice(0, 5),
      bysport: {}
    };

    eloRatings.forEach(rating => {
      if (!eloStats.bySort) eloStats.bySport = {};
      if (!eloStats.bySport[rating.sport_art]) {
        eloStats.bySport[rating.sport_art] = [];
      }
      eloStats.bySport[rating.sport_art].push(rating);
    });

    // Gewichtsklassen-Zuordnungsqualität
    const assignmentQuality = {
      highConfidence: weightAssignments.filter(w => w.confidence_score >= 0.9).length,
      mediumConfidence: weightAssignments.filter(w => w.confidence_score >= 0.7 && w.confidence_score < 0.9).length,
      lowConfidence: weightAssignments.filter(w => w.confidence_score < 0.7).length,
      averageConfidence: weightAssignments.length > 0 ?
        (weightAssignments.reduce((sum, w) => sum + w.confidence_score, 0) / weightAssignments.length) : 0
    };

    return {
      overview,
      clubStats,
      weightDistribution,
      eloStats,
      assignmentQuality,
      pairingSystemStats: pairingStats,
      rawData: { participants, eloRatings, weightAssignments }
    };
  };

  // Gewichtsbereich ermitteln
  const getWeightRange = (weight) => {
    if (weight <= 60) return '≤60kg';
    if (weight <= 70) return '61-70kg';
    if (weight <= 80) return '71-80kg';
    if (weight <= 90) return '81-90kg';
    return '>90kg';
  };

  // Übersichts-Tab
  const OverviewTab = () => {
    if (!analyticsData) return null;

    const { overview, assignmentQuality } = analyticsData;

    return (
      <div style={tabContentStyle}>
        <div style={statsGridStyle}>
          <StatCard 
            title="Teilnehmer Gesamt"
            value={overview.totalParticipants}
            icon="👥"
            color="#007bff"
          />
          <StatCard 
            title="Gewichtsklassen"
            value={overview.totalWeightClasses}
            icon="⚖️"
            color="#28a745"
          />
          <StatCard 
            title="Durchschnittsalter"
            value={`${overview.averageAge} Jahre`}
            icon="📅"
            color="#ffc107"
          />
          <StatCard 
            title="Zuordnungsqualität"
            value={`${Math.round(assignmentQuality.averageConfidence * 100)}%`}
            icon="🎯"
            color="#17a2b8"
          />
        </div>

        <div style={chartsGridStyle}>
          <GenderDistributionChart data={overview.genderDistribution} />
          <AssignmentQualityChart data={assignmentQuality} />
        </div>
      </div>
    );
  };

  // Teilnehmer-Tab
  const ParticipantsTab = () => {
    if (!analyticsData) return null;

    const { clubStats, weightDistribution } = analyticsData;

    return (
      <div style={tabContentStyle}>
        <div style={chartsGridStyle}>
          <ClubDistributionChart data={clubStats} />
          <WeightDistributionChart data={weightDistribution} />
        </div>
        
        <div style={tableContainerStyle}>
          <h3>Top Vereine nach Teilnehmerzahl</h3>
          <div style={clubTableStyle}>
            {Object.entries(clubStats)
              .sort(([,a], [,b]) => b.count - a.count)
              .slice(0, 10)
              .map(([club, data]) => (
                <div key={club} style={clubRowStyle}>
                  <div style={clubNameStyle}>{club}</div>
                  <div style={clubCountStyle}>{data.count} Teilnehmer</div>
                  <div style={clubPercentageStyle}>
                    {Math.round((data.count / analyticsData.overview.totalParticipants) * 100)}%
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  // ELO-Tab
  const ELOTab = () => {
    if (!analyticsData) return null;

    const { eloStats } = analyticsData;

    return (
      <div style={tabContentStyle}>
        <div style={statsGridStyle}>
          <StatCard 
            title="Durchschnitts-ELO"
            value={eloStats.averageRating}
            icon="📊"
            color="#007bff"
          />
          <StatCard 
            title="Bewertete Kämpfer"
            value={eloStats.topRated.length}
            icon="🏆"
            color="#28a745"
          />
        </div>

        <div style={tableContainerStyle}>
          <h3>Top ELO-Ratings</h3>
          <div style={eloTableStyle}>
            <div style={eloTableHeaderStyle}>
              <div>Rang</div>
              <div>Name</div>
              <div>Verein</div>
              <div>Rating</div>
              <div>Sport</div>
              <div>Bilanz</div>
            </div>
            {eloStats.topRated.map((rating, index) => (
              <div key={rating.rating_id} style={eloTableRowStyle}>
                <div style={rankStyle}>#{index + 1}</div>
                <div style={nameStyle}>
                  {rating.vorname} {rating.nachname}
                </div>
                <div>{rating.verein_name}</div>
                <div style={ratingStyle}>
                  {Math.round(rating.current_rating)}
                  {rating.is_provisional && <span style={provisionalStyle}>P</span>}
                </div>
                <div style={sportStyle}>{rating.sport_art.toUpperCase()}</div>
                <div style={recordStyle}>
                  {rating.wins}W-{rating.losses}L
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Statistik-Karte
  const StatCard = ({ title, value, icon, color }) => (
    <div style={statCardStyle}>
      <div style={statIconStyle(color)}>{icon}</div>
      <div style={statContentStyle}>
        <div style={statValueStyle}>{value}</div>
        <div style={statTitleStyle}>{title}</div>
      </div>
    </div>
  );

  // Geschlechterverteilung Chart
  const GenderDistributionChart = ({ data }) => (
    <div style={chartCardStyle}>
      <h3>Geschlechterverteilung</h3>
      <div style={pieChartStyle}>
        <div style={pieSliceStyle('male', data.male, data.male + data.female)}>
          <span>Herren: {data.male}</span>
        </div>
        <div style={pieSliceStyle('female', data.female, data.male + data.female)}>
          <span>Damen: {data.female}</span>
        </div>
      </div>
    </div>
  );

  // Zuordnungsqualität Chart
  const AssignmentQualityChart = ({ data }) => (
    <div style={chartCardStyle}>
      <h3>Zuordnungsqualität</h3>
      <div style={barChartStyle}>
        <div style={barStyle}>
          <div style={barLabelStyle}>Hoch (≥90%)</div>
          <div style={barFillStyle('#28a745', data.highConfidence, data.highConfidence + data.mediumConfidence + data.lowConfidence)}>
            {data.highConfidence}
          </div>
        </div>
        <div style={barStyle}>
          <div style={barLabelStyle}>Mittel (70-89%)</div>
          <div style={barFillStyle('#ffc107', data.mediumConfidence, data.highConfidence + data.mediumConfidence + data.lowConfidence)}>
            {data.mediumConfidence}
          </div>
        </div>
        <div style={barStyle}>
	<div style={barLabelStyle}>Niedrig ({'<70%'})</div>
          <div style={barFillStyle('#dc3545', data.lowConfidence, data.highConfidence + data.mediumConfidence + data.lowConfidence)}>
            {data.lowConfidence}
          </div>
        </div>
      </div>
    </div>
  );

  // Vereinsverteilung Chart
  const ClubDistributionChart = ({ data }) => (
    <div style={chartCardStyle}>
      <h3>Top 5 Vereine</h3>
      <div style={barChartStyle}>
        {Object.entries(data)
          .sort(([,a], [,b]) => b.count - a.count)
          .slice(0, 5)
          .map(([club, clubData]) => (
            <div key={club} style={barStyle}>
              <div style={barLabelStyle}>{club.substring(0, 15)}...</div>
              <div style={barFillStyle('#007bff', clubData.count, Math.max(...Object.values(data).map(d => d.count)))}>
                {clubData.count}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );

  // Gewichtsverteilung Chart
  const WeightDistributionChart = ({ data }) => (
    <div style={chartCardStyle}>
      <h3>Gewichtsverteilung</h3>
      <div style={barChartStyle}>
        {Object.entries(data).map(([range, count]) => (
          <div key={range} style={barStyle}>
            <div style={barLabelStyle}>{range}</div>
            <div style={barFillStyle('#17a2b8', count, Math.max(...Object.values(data)))}>
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={modalOverlayStyle}>
        <div style={modalContentStyle}>
          <div style={loadingContainerStyle}>
            <div style={loadingSpinnerStyle}></div>
            <p>Lade Analytics-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={modalHeaderStyle}>
          <h2>Analytics Dashboard - {turnier.name}</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={tabsContainerStyle}>
          {Object.entries(TABS).map(([key, tab]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                ...tabButtonStyle,
                ...(activeTab === key ? activeTabButtonStyle : {})
              }}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        <div style={modalBodyStyle}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'participants' && <ParticipantsTab />}
          {activeTab === 'elo' && <ELOTab />}
          {/* Weitere Tabs können hier hinzugefügt werden */}
        </div>
      </div>
    </div>
  );
};

// Styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '95%',
  maxWidth: '1400px',
  height: '90%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  borderBottom: '1px solid #eee',
  backgroundColor: '#f8f9fa',
  borderRadius: '12px 12px 0 0'
};

const closeButtonStyle = {
  background: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  width: '32px',
  height: '32px',
  fontSize: '18px',
  cursor: 'pointer'
};

const tabsContainerStyle = {
  display: 'flex',
  borderBottom: '1px solid #eee',
  backgroundColor: '#f8f9fa'
};

const tabButtonStyle = {
  padding: '12px 20px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  fontSize: '14px',
  transition: 'all 0.2s ease'
};

const activeTabButtonStyle = {
  backgroundColor: 'white',
  borderBottom: '2px solid #8B0000',
  fontWeight: 'bold'
};

const modalBodyStyle = {
  flex: 1,
  padding: '20px',
  overflow: 'auto'
};

const tabContentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
};

const statCardStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const statIconStyle = (color) => ({
  fontSize: '32px',
  marginRight: '15px',
  color
});

const statContentStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const statValueStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2c3e50'
};

const statTitleStyle = {
  fontSize: '14px',
  color: '#6c757d',
  marginTop: '4px'
};

const chartsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px'
};

const chartCardStyle = {
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const pieChartStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '15px'
};

const pieSliceStyle = (gender, value, total) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  backgroundColor: gender === 'male' ? '#007bff' : '#e83e8c',
  color: 'white',
  borderRadius: '4px',
  width: `${(value / total) * 100}%`,
  minWidth: '120px',
  fontSize: '14px',
  fontWeight: 'bold'
});

const barChartStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '15px'
};

const barStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px'
};

const barLabelStyle = {
  minWidth: '100px',
  fontSize: '12px',
  color: '#6c757d'
};

const barFillStyle = (color, value, max) => ({
  backgroundColor: color,
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  width: `${Math.max((value / max) * 200, 30)}px`,
  textAlign: 'center'
});

const tableContainerStyle = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e9ecef'
};

const clubTableStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  marginTop: '15px'
};

const clubRowStyle = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 80px',
  alignItems: 'center',
  padding: '8px',
  backgroundColor: '#f8f9fa',
  borderRadius: '4px'
};

const clubNameStyle = {
  fontWeight: 'bold'
};

const clubCountStyle = {
  textAlign: 'center'
};

const clubPercentageStyle = {
  textAlign: 'center',
  fontSize: '12px',
  color: '#6c757d'
};

const eloTableStyle = {
  display: 'flex',
  flexDirection: 'column',
  marginTop: '15px'
};

const eloTableHeaderStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 2fr 1fr 100px 80px 100px',
  padding: '8px',
  backgroundColor: '#f8f9fa',
  fontWeight: 'bold',
  borderRadius: '4px 4px 0 0',
  borderBottom: '1px solid #ddd'
};

const eloTableRowStyle = {
  display: 'grid',
  gridTemplateColumns: '60px 2fr 1fr 100px 80px 100px',
  padding: '8px',
  borderBottom: '1px solid #eee',
  alignItems: 'center'
};

const rankStyle = {
  fontWeight: 'bold',
  color: '#8B0000'
};

const nameStyle = {
  fontWeight: 'bold'
};

const ratingStyle = {
  textAlign: 'center',
  fontWeight: 'bold',
  color: '#007bff'
};

const provisionalStyle = {
  fontSize: '10px',
  color: '#ffc107',
  marginLeft: '4px'
};

const sportStyle = {
  textAlign: 'center',
  fontSize: '12px',
  fontWeight: 'bold'
};

const recordStyle = {
  textAlign: 'center',
  fontSize: '12px'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px'
};

const loadingSpinnerStyle = {
  width: '40px',
  height: '40px',
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #8B0000',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  marginBottom: '20px'
};

export default AnalyticsDashboard;