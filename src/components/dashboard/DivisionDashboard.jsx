import React from 'react';
import DivisionUebersicht from '../division/DivisionUebersicht';
import './DivisionDashboard.css';

function DivisionDashboard({ selectedTurnier }) {
  return (
    <div className="division-dashboard">
      <div className="dashboard-header">
        <h2>🥋 Divisionen verwalten</h2>
        {selectedTurnier && (
          <div className="turnier-info">
            <span className="turnier-badge">
              🏆 {selectedTurnier.name}
            </span>
          </div>
        )}
      </div>
      
      <div className="dashboard-content">
        <DivisionUebersicht />
      </div>
    </div>
  );
}

export default DivisionDashboard;



