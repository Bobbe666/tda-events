const styles = {
  /* ===============================
     STYLES FÜR DIE MEMBERLIST-ANSICHT
     =============================== */
  containerStyle: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px',
  },

  letterNavStyle: {
    display: 'flex',
    gap: '5px',
    marginBottom: '10px',
  },

  letterButtonStyle: {
    padding: '5px 10px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: 'white',
    backgroundColor: '#8B0000', // Rote Farbe für die Filterbuttons
  },

  cardContainerStyle: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '15px',
    marginTop: '20px',
  },

  cardStyle: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '15px',
  },

  cardHeaderStyle: {
    fontWeight: 'bold',
    borderBottom: '2px solid #8B0000', // Rot für die Trenner
  },


  /* ===============================
     BUTTONS IN DER MEMBERLIST
     =============================== */

  // 🔹 Gruppierung für Buttons (damit sie nebeneinander stehen)
  buttonGroupStyle: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },

  // 🔹 "Wettkämpfer hinzufügen"-Button (Rot)
  addButtonStyle: {
    padding: '10px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#8B0000', // Rot für "Hinzufügen"
    color: 'white',
  },

  // 🔹 "Löschen"-Button (ebenfalls Rot)
  deleteButtonStyle: {
    padding: '10px 20px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#8B0000', // Gleiche rote Farbe wie "Hinzufügen"
    color: 'white',
  },

  editButtonStyle: {
    padding: '5px 10px',
    backgroundColor: '#8B0000', // Rot für Bearbeiten
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
  },

  /* ===============================
     STYLES FÜR DAS POP-UP-FENSTER
     =============================== */
  modalOverlayStyle: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalContentStyle: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '500px',
    maxHeight: '80%',
    overflowY: 'auto',
    textAlign: 'center',
    margin: 'auto',
  },

  formContainerStyle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'center',
  },

  fieldContainerStyle: {
    display: 'flex',
    flexDirection: 'column',
    width: '90%',
    alignItems: 'center',
  },

  labelStyle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px',
    textAlign: 'left',
    width: '100%',
  },

  inputStyle: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: '100%',
  },

  selectStyle: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    width: '100%',
  },

  imagePreviewStyle: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '5px',
    marginTop: '10px',
  },

  formRowStyle: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '15px',
  },

  columnStyle: {
    width: '48%',
  },

  /* ===============================
     BUTTONS IM POP-UP-FENSTER
     =============================== */
  buttonContainerStyle: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginTop: '15px',
  },

  saveButtonStyle: {
    backgroundColor: '#8B0000', // Roter Button für Speichern
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },

  cancelButtonStyle: {
    backgroundColor: '#555', // Grauer Button für Abbrechen
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },

  /* ===============================
     STYLES FÜR "MEINE SCHULE"
     =============================== */
  meineSchuleContainerStyle: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },

  flexContainerStyle: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  },

  leftPaneStyle: {
    flex: '0 0 300px',
    minWidth: '300px',
  },

  middlePaneStyle: {
    flex: '1 1 600px',
    minWidth: '300px',
  },

  rightPaneStyle: {
    flex: '0 0 300px',
    minWidth: '250px',
  },

  clubDataStyle: {
    backgroundColor: '#fff',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
  },

  /* ===============================
     NEUE STYLES FÜR DIE BUTTON-LEISTE
     =============================== */
  buttonRowStyle: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },

  filterButtonStyle: {
    padding: '10px 15px',
    backgroundColor: '#004085', // Blau für Filterung
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },

  /* 🔹 Stil für den großen Anmelde-Button */
  largeRegisterButtonStyle: {
    backgroundColor: '#28a745', // Grün für Anmeldung
    color: 'white',
    fontSize: '16px',
    padding: '12px 24px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  },

  /* 🔹 Icon-Stil für den großen Anmelde-Button */
  buttonIconStyle: {
    width: '24px',
    height: '24px',
  },
wettkaempferContainerStyle: {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  marginTop: '20px',
},

buttonColumnStyle: {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
},

registerFighterButtonStyle: {
  padding: '10px 20px',
  backgroundColor: '#006400',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
},

};

export default styles;
