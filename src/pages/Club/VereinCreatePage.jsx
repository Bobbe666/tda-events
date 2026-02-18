// src/pages/Club/VereinCreatePage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/VereinDetailPage.css';

const VereinCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    ansprechpartner: '',
    email: '',
    benutzername: '',
    passwort: '',
    telefon: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    homepage: '',
    rolle: 'verein'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('authToken') ||
                   localStorage.getItem('token') ||
                   (JSON.parse(localStorage.getItem('clubData') || '{}').token);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen des Vereins');
      }

      const data = await response.json();

      if (data.success) {
        alert(`✅ Verein "${formData.name}" erfolgreich erstellt!`);
        navigate('/dashboard/vereine');
      } else {
        throw new Error(data.error || 'Fehler beim Erstellen des Vereins');
      }

    } catch (err) {
      console.error('❌ Fehler beim Erstellen:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verein-detail-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate('/dashboard/vereine')}
          >
            ← Zurück zu Vereine
          </button>
          <h1>➕ Neuer Verein</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-close"
            onClick={() => setError('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <div className="verein-details-container">
        <div className="vereinsdaten-section expanded">
          <div className="section-content">
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {/* Vereinsname */}
                <div className="form-group full-width">
                  <label className="form-label">
                    Vereinsname <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                    placeholder="z.B. Kampfsportverein Berlin"
                  />
                </div>

                {/* Benutzername & Passwort */}
                <div className="form-group">
                  <label className="form-label">
                    Benutzername <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="benutzername"
                    value={formData.benutzername}
                    onChange={handleChange}
                    className="form-input"
                    required
                    placeholder="z.B. ks-berlin"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Passwort <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    name="passwort"
                    value={formData.passwort}
                    onChange={handleChange}
                    className="form-input"
                    required
                    minLength="6"
                    placeholder="Mindestens 6 Zeichen"
                  />
                </div>

                {/* Email & Telefon */}
                <div className="form-group">
                  <label className="form-label">
                    E-Mail <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                    placeholder="kontakt@verein.de"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Telefon <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="telefon"
                    value={formData.telefon}
                    onChange={handleChange}
                    className="form-input"
                    required
                    placeholder="+49 123 456789"
                  />
                </div>

                {/* Ansprechpartner */}
                <div className="form-group full-width">
                  <label className="form-label">Ansprechpartner</label>
                  <input
                    type="text"
                    name="ansprechpartner"
                    value={formData.ansprechpartner}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Max Mustermann"
                  />
                </div>

                {/* Adresse */}
                <div className="form-group">
                  <label className="form-label">Straße</label>
                  <input
                    type="text"
                    name="strasse"
                    value={formData.strasse}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Hauptstraße"
                  />
                </div>

                <div className="form-group" style={{maxWidth: '120px'}}>
                  <label className="form-label">Nr.</label>
                  <input
                    type="text"
                    name="hausnummer"
                    value={formData.hausnummer}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="123"
                  />
                </div>

                <div className="form-group" style={{maxWidth: '150px'}}>
                  <label className="form-label">PLZ</label>
                  <input
                    type="text"
                    name="plz"
                    value={formData.plz}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="12345"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ort</label>
                  <input
                    type="text"
                    name="ort"
                    value={formData.ort}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Berlin"
                  />
                </div>

                {/* Homepage */}
                <div className="form-group full-width">
                  <label className="form-label">Homepage</label>
                  <input
                    type="url"
                    name="homepage"
                    value={formData.homepage}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://www.verein.de"
                  />
                </div>

                {/* Rolle (nur für Admin sichtbar) */}
                <div className="form-group">
                  <label className="form-label">Rolle</label>
                  <select
                    name="rolle"
                    value={formData.rolle}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="verein">Verein</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => navigate('/dashboard/vereine')}
                  disabled={loading}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? '⏳ Erstelle...' : '✅ Verein erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VereinCreatePage;
