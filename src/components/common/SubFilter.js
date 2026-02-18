// src/Components/SubFilter.js
import React from 'react';
import "./DivisionUebersicht.css";

const SubFilter = ({ options, currentSubFilter, onSubFilterChange }) => {
  return (
    <div className="sub-filter-bar">
      {options.map(sub => (
        <button
          key={sub}
          onClick={() => onSubFilterChange(sub)}
          className={currentSubFilter === sub ? "active" : ""}
        >
          {sub}
        </button>
      ))}
      <button
        onClick={() => onSubFilterChange('')}
        className={currentSubFilter === '' ? "active" : ""}
      >
        Alle Formen
      </button>
    </div>
  );
};

export default SubFilter;
