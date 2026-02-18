import React from 'react';
import './TDACard.css';

function TDACard({ 
  title, 
  subtitle, 
  meta = [], 
  actions = [], 
  size = 'medium', 
  variant = 'default', 
  empty = false, 
  emptyText = 'Keine Daten verfügbar',
  onClick,
  children 
}) {
  const getVariantClass = () => {
    switch (variant) {
      case 'success': return 'tda-card-success';
      case 'warning': return 'tda-card-warning';
      case 'error': return 'tda-card-error';
      case 'primary': return 'tda-card-primary';
      case 'secondary': return 'tda-card-secondary';
      case 'edit': return 'tda-card-edit';
      case 'delete': return 'tda-card-delete';
      default: return 'tda-card-default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'tda-card-small';
      case 'large': return 'tda-card-large';
      default: return 'tda-card-medium';
    }
  };

  if (empty) {
    return (
      <div className={`tda-card tda-card-empty ${getSizeClass()}`}>
        <div className="tda-card-empty-content">
          <div className="tda-card-empty-icon">📋</div>
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`tda-card ${getVariantClass()} ${getSizeClass()}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="tda-card-header">
        <h3 className="tda-card-title">{title}</h3>
        {subtitle && <p className="tda-card-subtitle">{subtitle}</p>}
      </div>

      {meta.length > 0 && (
        <div className="tda-card-meta">
          {meta.map((item, index) => (
            <div key={index} className="tda-card-meta-item">
              <span className="tda-card-meta-icon">{item.icon}</span>
              <span className="tda-card-meta-text">{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {children && (
        <div className="tda-card-content">
          {children}
        </div>
      )}

      {actions.length > 0 && (
        <div className="tda-card-actions">
          {actions.map((action, index) => (
            <button
              key={index}
              className={`tda-card-action tda-card-action-${action.variant || 'default'}`}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick && action.onClick();
              }}
              title={action.title}
            >
              <span className="tda-card-action-icon">{action.icon}</span>
              {action.text && <span className="tda-card-action-text">{action.text}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TDACard;



