import React, { useState, useEffect } from 'react';
import TDACard from '../common/TDACard';
import './AnalyticsDashboard.css';

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalTurniere: 0,
      totalWettkaempfer: 0,
      totalAnmeldungen: 0,
      totalRevenue: 0,
      activeStreams: 0
    },
    turnierStats: [],
    wettkaempferStats: {
      byGeschlecht: { male: 0, female: 0, divers: 0 },
      bySkillLevel: { anfaenger: 0, fortgeschritten: 0, experte: 0 },
      byAge: { under18: 0, adult: 0, senior: 0 }
    },
    streamingStats: {
      totalViews: 0,
      totalMinutes: 0,
      avgViewers: 0,
      peakViewers: 0
    },
    revenueData: [],
    popularTurniere: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Parallel API calls für verschiedene Analytics
      const [
        turniereResponse,
        wettkaempferResponse,
        anmeldungenResponse,
        streamingResponse
      ] = await Promise.all([
        fetch('/api/turniere', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/wettkaempfer', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/anmeldungen', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/streaming/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ ok: false })) // Fallback wenn Streaming API nicht verfügbar
      ]);

      // Turniere verarbeiten
      let turniere = [];
      if (turniereResponse.ok) {
        const turniereData = await turniereResponse.json();
        turniere = Array.isArray(turniereData) ? turniereData : (turniereData.data || []);
      }

      // Wettkämpfer verarbeiten
      let wettkaempfer = [];
      if (wettkaempferResponse.ok) {
        const wettkaempferData = await wettkaempferResponse.json();
        wettkaempfer = Array.isArray(wettkaempferData) ? wettkaempferData : (wettkaempferData.data || []);
      }

      // Anmeldungen verarbeiten
      let anmeldungen = [];
      if (anmeldungenResponse.ok) {
        const anmeldungenData = await anmeldungenResponse.json();
        anmeldungen = Array.isArray(anmeldungenData) ? anmeldungenData : (anmeldungenData.data || []);
      }

      // Streaming Stats verarbeiten
      let streamingData = {
        totalViews: 0,
        totalMinutes: 0,
        avgViewers: 0,
        peakViewers: 0
      };
      if (streamingResponse.ok) {
        const streamingResponseData = await streamingResponse.json();
        streamingData = streamingResponseData.success ? streamingResponseData.data : streamingResponseData;
      }

      // Analytics berechnen
      const calculatedAnalytics = calculateAnalytics(turniere, wettkaempfer, anmeldungen, streamingData);
      setAnalytics(calculatedAnalytics);
      
      setLoading(false);
    } catch (err) {
      console.error('Fehler beim Laden der Analytics:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateAnalytics = (turniere, wettkaempfer, anmeldungen, streamingData) => {
    // Sicherstellen, dass alle Parameter Arrays sind
    const safeTurniere = Array.isArray(turniere) ? turniere : [];
    const safeWettkaempfer = Array.isArray(wettkaempfer) ? wettkaempfer : [];
    const safeAnmeldungen = Array.isArray(anmeldungen) ? anmeldungen : [];
    
    // Overview Stats
    const overview = {
      totalTurniere: safeTurniere.length,
      totalWettkaempfer: safeWettkaempfer.length,
      totalAnmeldungen: safeAnmeldungen.length,
      totalRevenue: safeAnmeldungen
        .filter(a => a.status === 'confirmed' || a.status === 'Angemeldet')
        .reduce((sum, a) => sum + (a.anmeldegebuehr || a.startgebuehr || 0), 0),
      activeStreams: streamingData?.activeStreams || 0
    };

    // Turnier Stats
    const turnierStats = safeTurniere.map(t => ({
      name: t.name || 'Unbekanntes Turnier',
      anmeldungen: safeAnmeldungen.filter(a => a.turnier_id === t.turnier_id).length,
      revenue: safeAnmeldungen
        .filter(a => a.turnier_id === t.turnier_id && (a.status === 'confirmed' || a.status === 'Angemeldet'))
        .reduce((sum, a) => sum + (a.anmeldegebuehr || a.startgebuehr || 0), 0),
      status: getTurnierStatus(t)
    })).sort((a, b) => b.anmeldungen - a.anmeldungen);

    // Wettkämpfer Stats
    const wettkaempferStats = {
      byGeschlecht: {
        male: safeWettkaempfer.filter(w => w.geschlecht === 'male').length,
        female: safeWettkaempfer.filter(w => w.geschlecht === 'female').length,
        divers: safeWettkaempfer.filter(w => w.geschlecht === 'divers').length
      },
      bySkillLevel: {
        anfaenger: safeWettkaempfer.filter(w => w.skill_level === 'anfaenger').length,
        fortgeschritten: safeWettkaempfer.filter(w => w.skill_level === 'fortgeschritten').length,
        experte: safeWettkaempfer.filter(w => w.skill_level === 'experte').length
      },
      byAge: calculateAgeGroups(safeWettkaempfer)
    };

    // Revenue Data (letzten 6 Monate)
    const revenueData = calculateRevenueData(safeAnmeldungen);

    // Populäre Turniere
    const popularTurniere = turnierStats.slice(0, 5);

    return {
      overview,
      turnierStats,
      wettkaempferStats,
      streamingStats: streamingData,
      revenueData,
      popularTurniere
    };
  };

  const getTurnierStatus = (turnier) => {
    if (!turnier) return 'unknown';
    
    const now = new Date();
    const start = turnier.start_datum ? new Date(turnier.start_datum) : null;
    const end = turnier.end_datum ? new Date(turnier.end_datum) : null;
    
    if (!start || !end) return 'unknown';
    
    if (start > now) return 'upcoming';
    if (start <= now && now <= end) return 'active';
    return 'completed';
  };

  const calculateAgeGroups = (wettkaempfer) => {
    const safeWettkaempfer = Array.isArray(wettkaempfer) ? wettkaempfer : [];
    const now = new Date();
    let under18 = 0, adult = 0, senior = 0;

    safeWettkaempfer.forEach(w => {
      if (w.geburtsdatum) {
        try {
          const age = now.getFullYear() - new Date(w.geburtsdatum).getFullYear();
          if (age < 18) under18++;
          else if (age < 50) adult++;
          else senior++;
        } catch (error) {
          console.warn('Ungültiges Geburtsdatum:', w.geburtsdatum);
        }
      }
    });

    return { under18, adult, senior };
  };

  const calculateRevenueData = (anmeldungen) => {
    const safeAnmeldungen = Array.isArray(anmeldungen) ? anmeldungen : [];
    const monthlyRevenue = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      monthlyRevenue[key] = 0;
    }

    // Calculate revenue per month
    safeAnmeldungen
      .filter(a => (a.status === 'confirmed' || a.status === 'Angemeldet') && (a.anmelde_datum || a.anmeldedatum))
      .forEach(a => {
        const date = new Date(a.anmelde_datum || a.anmeldedatum);
        const key = date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
        if (monthlyRevenue[key] !== undefined) {
          monthlyRevenue[key] += a.anmeldegebuehr || a.startgebuehr || 0;
        }
      });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">⏳</div>
        <p>Analytics werden geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <h3>❌ Fehler</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics}>Erneut versuchen</button>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Action Header */}
      <div className="action-header">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="time-range-select"
        >
          <option value="week">Diese Woche</option>
          <option value="month">Dieser Monat</option>
          <option value="quarter">Dieses Quartal</option>
          <option value="year">Dieses Jahr</option>
        </select>
        <button 
          className="export-btn"
          onClick={() => window.print()}
        >
          📊 Report exportieren
        </button>
      </div>

      {/* Key Metrics Overview */}
      <div className="tda-card-grid tda-card-grid-5">
        <TDACard
          title={analytics.overview.totalTurniere}
          subtitle="Turniere gesamt"
          meta={[{ icon: '🏆', text: 'Gesamt' }]}
          size="small"
        />

        <TDACard
          title={analytics.overview.totalWettkaempfer}
          subtitle="Wettkämpfer"
          meta={[{ icon: '🥊', text: 'Registriert' }]}
          size="small"
        />

        <TDACard
          title={analytics.overview.totalAnmeldungen}
          subtitle="Anmeldungen"
          meta={[{ icon: '📝', text: 'Gesamt' }]}
          size="small"
        />

        <TDACard
          title={`${analytics.overview.totalRevenue}€`}
          subtitle="Gesamteinnahmen"
          meta={[{ icon: '💰', text: 'Umsatz' }]}
          size="small"
          variant="success"
        />

        <TDACard
          title={analytics.streamingStats.totalViews}
          subtitle="Stream Views"
          meta={[{ icon: '📺', text: 'Views' }]}
          size="small"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="tda-card-grid tda-card-grid-2">
        {/* Revenue Chart */}
        <TDACard
          title="💰 Einnahmen-Verlauf"
          subtitle="Monatliche Umsätze"
          meta={[{ icon: '📈', text: 'Trend' }]}
          size="large"
        >
          <div className="chart-container">
            {analytics.revenueData.map((data, index) => (
              <div key={index} className="revenue-bar">
                <div 
                  className="bar"
                  style={{ 
                    height: `${Math.max(10, (data.revenue / Math.max(...analytics.revenueData.map(d => d.revenue))) * 200)}px` 
                  }}
                ></div>
                <span className="bar-label">{data.month}</span>
                <span className="bar-value">{data.revenue}€</span>
              </div>
            ))}
          </div>
        </TDACard>

        {/* Wettkämpfer Demographics */}
        <TDACard
          title="👥 Wettkämpfer-Demografie"
          subtitle="Geschlecht und Skill Level"
          meta={[{ icon: '📊', text: 'Statistiken' }]}
          size="large"
        >
          <div className="demographics-grid">
            <div className="demo-section">
              <h4>Geschlecht</h4>
              <div className="demo-bars">
                <div className="demo-bar male">
                  <span>Männlich: {analytics.wettkaempferStats.byGeschlecht.male}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.byGeschlecht.male / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
                <div className="demo-bar female">
                  <span>Weiblich: {analytics.wettkaempferStats.byGeschlecht.female}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.byGeschlecht.female / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
                <div className="demo-bar divers">
                  <span>Divers: {analytics.wettkaempferStats.byGeschlecht.divers}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.byGeschlecht.divers / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
              </div>
            </div>

            <div className="demo-section">
              <h4>Skill Level</h4>
              <div className="demo-bars">
                <div className="demo-bar anfaenger">
                  <span>Anfänger: {analytics.wettkaempferStats.bySkillLevel.anfaenger}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.bySkillLevel.anfaenger / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
                <div className="demo-bar fortgeschritten">
                  <span>Fortgeschritten: {analytics.wettkaempferStats.bySkillLevel.fortgeschritten}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.bySkillLevel.fortgeschritten / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
                <div className="demo-bar experte">
                  <span>Experte: {analytics.wettkaempferStats.bySkillLevel.experte}</span>
                  <div className="bar" style={{width: `${(analytics.wettkaempferStats.bySkillLevel.experte / analytics.overview.totalWettkaempfer) * 100}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </TDACard>

        {/* Popular Turniere */}
        <TDACard
          title="🏆 Beliebte Turniere"
          subtitle="Top Turniere nach Anmeldungen"
          meta={[{ icon: '📈', text: 'Ranking' }]}
          size="large"
        >
          <div className="turniere-list">
            {analytics.popularTurniere.map((turnier, index) => (
              <div key={index} className="turnier-item">
                <div className="turnier-rank">#{index + 1}</div>
                <div className="turnier-info">
                  <h4>{turnier.name}</h4>
                  <div className="turnier-stats">
                    <span>📝 {turnier.anmeldungen} Anmeldungen</span>
                    <span>💰 {turnier.revenue}€</span>
                  </div>
                </div>
                <div className={`turnier-status ${turnier.status}`}>
                  {turnier.status === 'active' ? '⚡ Live' : 
                   turnier.status === 'upcoming' ? '📅 Geplant' : '✅ Beendet'}
                </div>
              </div>
            ))}
          </div>
        </TDACard>

        {/* Streaming Analytics */}
        <TDACard
          title="📺 Streaming Statistiken"
          subtitle="Live-Streaming Performance"
          meta={[{ icon: '📊', text: 'Analytics' }]}
          size="large"
        >
          <div className="streaming-stats-grid">
            <div className="streaming-stat">
              <div className="stat-value">{analytics.streamingStats.totalViews}</div>
              <div className="stat-label">Gesamt Views</div>
            </div>
            <div className="streaming-stat">
              <div className="stat-value">{Math.round(analytics.streamingStats.totalMinutes / 60)}h</div>
              <div className="stat-label">Gestreamt</div>
            </div>
            <div className="streaming-stat">
              <div className="stat-value">{analytics.streamingStats.avgViewers}</div>
              <div className="stat-label">Ø Zuschauer</div>
            </div>
            <div className="streaming-stat">
              <div className="stat-value">{analytics.streamingStats.peakViewers}</div>
              <div className="stat-label">Peak Views</div>
            </div>
          </div>
        </TDACard>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;