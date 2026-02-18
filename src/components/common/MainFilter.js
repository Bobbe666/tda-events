// src/Components/MainFilter.js
import React from 'react';
import "./DivisionUebersicht.css";

const MainFilter = ({ options, currentFilter, onFilterChange }) => {
  return (
    <div className="filter-bar">
      {options.map(option => (
        <button
          key={option}
          onClick={() => onFilterChange(option)}
          className={currentFilter === option ? "active" : ""}
        >
          {option}
        </button>
      ))}
      <button
        onClick={() => onFilterChange('')}
        className={currentFilter === '' ? "active" : ""}
      >
        Alle
      </button>
    </div>
  );
};

export default MainFilter;
