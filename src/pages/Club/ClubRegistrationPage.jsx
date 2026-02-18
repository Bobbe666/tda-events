import React, { useState } from 'react';
import './ClubRegistrationPage.css';

export default function ClubRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Schritt 1: Vereinsdaten
  const [formData, setFormData] = useState({
    name: '',
    ansprechpartner: '',
    strasse: '',
    hausnummer: '',
    plz: '',
    ort: '',
    email: '',
    benutzername: '',
    passwort: '',
    homepage: '',
    telefon: '',
    logo: ''
  });

  // Schritt 2: Dojosoftware Integration
  const [useDojo, setUseDojo] = useState(false);
  const [dojoConfig, setDojoConfig] = useState({
    api_url: 'http://localhost:3006/api', // Default für lokale Entwicklung
    api_token: ''
  });
  const [dojoToken, setDojoToken] = useState(null);
  const [availableDojos, setAvailableDojos] = useState([]);
  const [selectedDojos, setSelectedDojos] = useState([]);
  const [mergeMode, setMergeMode] = useState('single'); // 'single' or 'multiple'
  const [previewData, setPreviewData] = useState(null);

  // ===================================================================
  // HANDLERS - Schritt 1
  // ===================================================================

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Next = () => {
    // Validierung
    const requiredFields = ['name', 'email', 'benutzername', 'passwort', 'telefon'];
    for (let field of requiredFields) {
      if (!formData[field] || !formData[field].trim()) {
        setMessage(`❌ Bitte füllen Sie das Feld "${field}" aus!`);
        return;
      }
    }

    // Admin-Benutzername blockieren
    if (formData.benutzername.toLowerCase() === 'admin') {
      setMessage('❌ Der Benutzername "admin" ist reserviert. Bitte wählen Sie einen anderen.');
      return;
    }

    // Passwort-Länge prüfen
    if (formData.passwort.length < 6) {
      setMessage('❌ Das Passwort muss mindestens 6 Zeichen lang sein!');
      return;
    }

    setMessage('');
    setCurrentStep(2);
  };

  // ===================================================================
  // HANDLERS - Schritt 2: Dojosoftware Integration
  // ===================================================================

  const handleTestConnection = async () => {
    if (!dojoConfig.api_url || !dojoConfig.api_token) {
      setMessage('❌ Bitte API-URL und API-Token eingeben!');
      return;
    }

    setLoading(true);
    setMessage('🔄 Verbinde mit Dojosoftware...');

    try {
      const response = await fetch('/api/dojo-sync/check-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojo_api_url: dojoConfig.api_url,
          api_token: dojoConfig.api_token
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Verbindung fehlgeschlagen');
      }

      setDojoToken(data.token);
      setAvailableDojos(data.dojos || []);
      setMessage(`✅ Verbunden! ${data.dojos?.length || 0} Dojos gefunden.`);

    } catch (error) {
      console.error('Connection Error:', error);
      setMessage('❌ Verbindung fehlgeschlagen: ' + error.message);
      setDojoToken(null);
      setAvailableDojos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDojoSelection = (dojoId) => {
    setSelectedDojos(prev => {
      if (prev.includes(dojoId)) {
        return prev.filter(id => id !== dojoId);
      } else {
        return [...prev, dojoId];
      }
    });
  };

  const handleLoadPreview = async () => {
    if (selectedDojos.length === 0) {
      setMessage('❌ Bitte mindestens ein Dojo auswählen!');
      return;
    }

    setLoading(true);
    setMessage('🔄 Lade Vorschau...');

    try {
      const response = await fetch('/api/dojo-sync/preview-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dojo_api_url: dojoConfig.api_url,
          token: dojoToken,
          dojo_ids: selectedDojos
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Vorschau laden fehlgeschlagen');
      }

      setPreviewData(data);
      setMessage(`✅ Vorschau geladen: ${data.wettkaempfer_count} Wettkämpfer gefunden`);

    } catch (error) {
      console.error('Preview Error:', error);
      setMessage('❌ Vorschau fehlgeschlagen: ' + error.message);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Next = () => {
    if (useDojo) {
      if (!dojoToken) {
        setMessage('❌ Bitte zuerst Verbindung testen!');
        return;
      }
      if (selectedDojos.length === 0) {
        setMessage('❌ Bitte mindestens ein Dojo auswählen!');
        return;
      }
    }

    setMessage('');
    setCurrentStep(3);
  };

  const handleStep2Skip = () => {
    setUseDojo(false);
    setMessage('');
    setCurrentStep(3);
  };

  // ===================================================================
  // SUBMIT - Finale Registrierung
  // ===================================================================

  const handleFinalSubmit = async () => {
    setLoading(true);
    setMessage('🔄 Registrierung wird durchgeführt...');

    try {
      if (useDojo && dojoToken) {
        // Registrierung MIT Dojo-Integration
        const response = await fetch('/api/dojo-sync/complete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            verein_data: formData,
            dojo_config: {
              dojo_api_url: dojoConfig.api_url,
              token: dojoToken,
              dojo_ids: selectedDojos,
              merge_mode: mergeMode,
              api_token: dojoConfig.api_token
            }
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Registrierung fehlgeschlagen');
        }

        setMessage(`✅ Registrierung erfolgreich! ${data.imported_wettkaempfer} Wettkämpfer importiert.`);

        // Erfolg -> Nach 2 Sekunden zur Login-Seite
        setTimeout(() => {
          window.location.href = '/club-login';
        }, 2000);

      } else {
        // Normale Registrierung OHNE Dojo
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Registrierung fehlgeschlagen');
        }

        setMessage('✅ Registrierung erfolgreich!');

        // Erfolg -> Nach 2 Sekunden zur Login-Seite
        setTimeout(() => {
          window.location.href = '/club-login';
        }, 2000);
      }

    } catch (error) {
      console.error('Registration Error:', error);
      setMessage('❌ Registrierung fehlgeschlagen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="club-registration-page">
      <div className="registration-container">
        {/* Header */}
        <div className="registration-header">
          <h1>Vereinsregistrierung</h1>
          <p>Registrieren Sie Ihren Verein für die TDA Tournament Software</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Vereinsdaten</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Dojosoftware</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Bestätigung</div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}

        {/* Step 1: Vereinsdaten */}
        {currentStep === 1 && (
          <div className="form-step">
            <h2>Schritt 1: Vereinsdaten</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Vereinsname *</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="z.B. TDA Taekwondo Berlin"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ansprechpartner</label>
                <input
                  name="ansprechpartner"
                  value={formData.ansprechpartner}
                  onChange={handleChange}
                  placeholder="z.B. Max Mustermann"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="verein@example.com"
                  required
                />
                <small style={{ color: '#999', display: 'block', marginTop: '0.3rem' }}>
                  Kann auch für Login verwendet werden
                </small>
              </div>

              <div className="form-group">
                <label>Telefon *</label>
                <input
                  type="tel"
                  name="telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                  placeholder="+49 123 456789"
                  required
                />
              </div>

              <div className="form-group">
                <label>Straße</label>
                <input
                  name="strasse"
                  value={formData.strasse}
                  onChange={handleChange}
                  placeholder="Hauptstraße"
                />
              </div>

              <div className="form-group">
                <label>Hausnummer</label>
                <input
                  name="hausnummer"
                  value={formData.hausnummer}
                  onChange={handleChange}
                  placeholder="123"
                />
              </div>

              <div className="form-group">
                <label>PLZ</label>
                <input
                  name="plz"
                  value={formData.plz}
                  onChange={handleChange}
                  placeholder="12345"
                />
              </div>

              <div className="form-group">
                <label>Ort</label>
                <input
                  name="ort"
                  value={formData.ort}
                  onChange={handleChange}
                  placeholder="Berlin"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{
                  background: 'rgba(255, 107, 53, 0.1)',
                  border: '2px solid #ff6b35',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff6b35' }}>🔐 Login-Zugangsdaten für TDA Tournament Software</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Mit diesen Daten melden Sie sich später in der TDA Tournament Software an.
                    Der Benutzername "admin" ist reserviert und kann nicht verwendet werden.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>Benutzername * (für Login)</label>
                <input
                  name="benutzername"
                  value={formData.benutzername}
                  onChange={handleChange}
                  placeholder="z.B. ihr-verein"
                  required
                />
                <small style={{ color: '#999', display: 'block', marginTop: '0.3rem' }}>
                  Damit melden Sie sich in der TDA Software an
                </small>
              </div>

              <div className="form-group">
                <label>Passwort * (für Login)</label>
                <input
                  type="password"
                  name="passwort"
                  value={formData.passwort}
                  onChange={handleChange}
                  placeholder="Mindestens 6 Zeichen"
                  required
                />
                <small style={{ color: '#999', display: 'block', marginTop: '0.3rem' }}>
                  Sicher aufbewahren!
                </small>
              </div>

              <div className="form-group">
                <label>Homepage</label>
                <input
                  name="homepage"
                  value={formData.homepage}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group">
                <label>Logo URL</label>
                <input
                  name="logo"
                  value={formData.logo}
                  onChange={handleChange}
                  placeholder="https://... (optional)"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStep1Next}
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Dojosoftware Integration */}
        {currentStep === 2 && (
          <div className="form-step">
            <h2>Schritt 2: Dojosoftware Integration (Optional)</h2>

            <div className="dojo-integration-section">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={useDojo}
                    onChange={(e) => setUseDojo(e.target.checked)}
                  />
                  <span>Ich nutze bereits die TDA Kampfsport Software (Dojosoftware)</span>
                </label>
              </div>

              {useDojo && (
                <>
                  {/* Dojo-API-Token */}
                  <div className="dojo-config-box">
                    <h3>🔗 API-Zugangsdaten Dojosoftware</h3>
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      <p style={{ margin: 0, lineHeight: '1.6', fontSize: '0.9rem' }}>
                        <strong style={{ color: '#3b82f6' }}>ℹ️ Wo finde ich die Zugangsdaten?</strong><br />
                        1. Öffnen Sie Ihre Dojosoftware<br />
                        2. Gehen Sie zu <strong>Dojoverwaltung</strong> → Dojo bearbeiten<br />
                        3. Wählen Sie den Tab <strong>"API-Zugang" (🔗)</strong><br />
                        4. Generieren Sie einen API-Token (falls noch nicht vorhanden)<br />
                        5. Kopieren Sie API-URL und Token hierher
                      </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label>🌐 API-URL</label>
                      <input
                        value={dojoConfig.api_url}
                        onChange={(e) => setDojoConfig({ ...dojoConfig, api_url: e.target.value })}
                        placeholder="http://localhost:3006/api"
                      />
                      <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>
                        Die API-URL Ihrer Dojosoftware (z.B. http://localhost:3006/api)
                      </small>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                      <label>🔑 API-Token</label>
                      <input
                        type="text"
                        value={dojoConfig.api_token}
                        onChange={(e) => setDojoConfig({ ...dojoConfig, api_token: e.target.value })}
                        placeholder="Ihr eindeutiger API-Token (UUID Format)"
                        style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                      />
                      <small style={{ color: '#999', display: 'block', marginTop: '0.5rem' }}>
                        Der eindeutige API-Token aus der Dojoverwaltung
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleTestConnection}
                      disabled={loading}
                    >
                      {loading ? '🔄 Verbinde...' : '🔌 Verbindung testen'}
                    </button>
                  </div>

                  {/* Dojo-Auswahl */}
                  {dojoToken && availableDojos.length > 0 && (
                    <div className="dojo-selection-box">
                      <h3>Welche Dojos möchten Sie übertragen?</h3>
                      <div className="dojos-list">
                        {availableDojos.map(dojo => (
                          <div key={dojo.dojo_id} className="dojo-item">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedDojos.includes(dojo.dojo_id)}
                                onChange={() => handleDojoSelection(dojo.dojo_id)}
                              />
                              <span>
                                <strong>{dojo.name}</strong>
                                <small>{dojo.mitglieder_count} Mitglieder</small>
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>

                      {/* Merge Mode */}
                      {selectedDojos.length > 1 && (
                        <div className="merge-mode-section">
                          <h4>Wie möchten Sie die Dojos organisieren?</h4>
                          <div className="radio-group">
                            <label className="radio-label">
                              <input
                                type="radio"
                                value="single"
                                checked={mergeMode === 'single'}
                                onChange={(e) => setMergeMode(e.target.value)}
                              />
                              <span>
                                <strong>Ein gemeinsames Konto</strong>
                                <small>Alle Wettkämpfer unter einem Verein</small>
                              </span>
                            </label>
                            <label className="radio-label">
                              <input
                                type="radio"
                                value="multiple"
                                checked={mergeMode === 'multiple'}
                                onChange={(e) => setMergeMode(e.target.value)}
                              />
                              <span>
                                <strong>Separate Konten</strong>
                                <small>Jedes Dojo als eigener Verein (aktuell nicht unterstützt)</small>
                              </span>
                            </label>
                          </div>

                          {/* Dojo Name Selection */}
                          {mergeMode === 'single' && (
                            <div className="dojo-name-selection" style={{ marginTop: '1.5rem' }}>
                              <h4>Welcher Dojo-Name soll als Vereinsname verwendet werden?</h4>
                              <div className="radio-group">
                                {availableDojos
                                  .filter(dojo => selectedDojos.includes(dojo.dojo_id))
                                  .map(dojo => (
                                    <label key={dojo.dojo_id} className="radio-label">
                                      <input
                                        type="radio"
                                        name="selected_dojo_name"
                                        value={dojo.name}
                                        checked={formData.name === dojo.name}
                                        onChange={() => setFormData({ ...formData, name: dojo.name })}
                                      />
                                      <span>
                                        <strong>{dojo.name}</strong>
                                        <small>{dojo.mitglieder_count} Mitglieder</small>
                                      </span>
                                    </label>
                                  ))}
                                <label className="radio-label">
                                  <input
                                    type="radio"
                                    name="selected_dojo_name"
                                    value="custom"
                                    checked={!availableDojos.some(d => selectedDojos.includes(d.dojo_id) && d.name === formData.name)}
                                    onChange={() => {}}
                                  />
                                  <span>
                                    <strong>Eigener Name</strong>
                                    <small>In Schritt 1 eingeben</small>
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Vorschau Button */}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleLoadPreview}
                        disabled={loading || selectedDojos.length === 0}
                      >
                        {loading ? '🔄 Lädt...' : '👁️ Vorschau laden'}
                      </button>

                      {/* Vorschau */}
                      {previewData && (
                        <div className="preview-box">
                          <h4>Vorschau: {previewData.wettkaempfer_count} Wettkämpfer</h4>
                          <div className="preview-list">
                            {previewData.wettkaempfer_preview?.map((wk, idx) => (
                              <div key={idx} className="preview-item">
                                <span>{wk.vorname} {wk.nachname}</span>
                                <small>{wk.gurtfarbe} • {wk.geschlecht}</small>
                              </div>
                            ))}
                          </div>
                          {previewData.wettkaempfer_count > 10 && (
                            <p className="preview-more">
                              ... und {previewData.wettkaempfer_count - 10} weitere
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(1)}
              >
                ← Zurück
              </button>
              {useDojo ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStep2Next}
                >
                  Weiter →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStep2Skip}
                >
                  Überspringen →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Bestätigung */}
        {currentStep === 3 && (
          <div className="form-step">
            <h2>Schritt 3: Bestätigung</h2>

            <div className="confirmation-box">
              <h3>Vereinsdaten</h3>
              <div className="confirmation-grid">
                <div><strong>Name:</strong> {formData.name}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Telefon:</strong> {formData.telefon}</div>
                {formData.ansprechpartner && (
                  <div><strong>Ansprechpartner:</strong> {formData.ansprechpartner}</div>
                )}
              </div>

              {useDojo && dojoToken && (
                <>
                  <h3 style={{ marginTop: '2rem' }}>Dojosoftware Integration</h3>
                  <div className="confirmation-grid">
                    <div><strong>Ausgewählte Dojos:</strong> {selectedDojos.length}</div>
                    <div><strong>Wettkämpfer:</strong> {previewData?.wettkaempfer_count || 0}</div>
                    <div><strong>Modus:</strong> {mergeMode === 'single' ? 'Ein Konto' : 'Separate Konten'}</div>
                  </div>
                </>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                ← Zurück
              </button>
              <button
                type="button"
                className="btn btn-primary btn-large"
                onClick={handleFinalSubmit}
                disabled={loading}
              >
                {loading ? '🔄 Registrierung läuft...' : '✓ Registrierung abschließen'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
