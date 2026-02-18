// src/components/common/Button.js
import React from "react";
import "../../styles/Button.css"; // ✅ Korrigierter Pfad zu styles/Button.css

const Button = ({ onClick, children, className = "" }) => {
  return (
    <button onClick={onClick} className={`red-button ${className}`}>
      {children}
    </button>
  );
};

export default Button;