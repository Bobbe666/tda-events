// src/Components/DivisionList.js
import React from 'react';
import "./DivisionUebersicht.css";

const DivisionList = ({ divisions, subFilter }) => {
  const filtered = subFilter
    ? divisions.filter(division =>
        division.Division_Name.toLowerCase().includes(subFilter.toLowerCase())
      )
    : divisions;

  return (
    <div className="division-list">
      {filtered.length > 0 ? (
        filtered.map((division, index) => (
          <div key={`${division.Id}-${index}`} className="division-item">
            <h2>{division.Division_Name}</h2>
            <p>
              <strong>Code:</strong> {division.Division_Code} |{" "}
              <strong>Ring:</strong> {division.Ring_Name} |{" "}
              <strong>Session:</strong> {division.Session_Name}
            </p>
            {/* Weitere Felder können hier ergänzt werden */}
          </div>
        ))
      ) : (
        <p>Keine Divisionen gefunden.</p>
      )}
    </div>
  );
};

export default DivisionList;
