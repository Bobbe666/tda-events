import React, { useState } from 'react';

const ClubDropdown = ({ clubName, onLogout, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleNavigation = (route) => {
    setIsOpen(false);
    onNavigate(route);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        style={{
          background: '#6A0000',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {clubName || 'Club'} ▼
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            minWidth: '150px',
            zIndex: 1000
          }}
        >
          <button
            onClick={() => handleNavigation('/dashboard')}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderBottom: '1px solid #eee'
            }}
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => handleNavigation('/profil')}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              borderBottom: '1px solid #eee'
            }}
          >
            📊 Mein Profil
          </button>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#dc3545'
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ClubDropdown;