# TDA Events & Tournament Management System

![TDA Logo](https://events.tda-intl.org/logo.png)

## Überblick

Dies ist das offizielle Repository für das **TDA Events & Tournament Management System**, das auf [events.tda-intl.org](https://events.tda-intl.org) läuft.

Die Software ermöglicht die Verwaltung von Kampfsport-Turnieren, inklusive:
- Vereins- und Teilnehmerverwaltung
- Turnieranmeldungen
- Gewichtsklassen und Divisionen
- Bracket-Management
- Live-Streaming Integration
- Echtzeitaktualisierungen

## Tech Stack

- **Frontend**: React 19, React Router v6
- **Backend**: Node.js (läuft auf Port 5002)
- **Webserver**: nginx
- **CSS**: Custom CSS mit responsive Design
- **Build**: react-scripts (Create React App)

## Installation

### Voraussetzungen
- Node.js 20.x oder höher
- npm

### Setup

```bash
# Dependencies installieren
npm install

# Development Server starten
npm start

# Production Build erstellen
npm run build

# Production Build deployen (nur auf Server)
npm run deploy
```

## Deployment

Das Projekt wird automatisch nach `/var/www/tda-events/` deployed:

```bash
npm run deploy
```

Oder mit dem Deploy-Script:

```bash
./deploy.sh
```

## Verzeichnisstruktur

```
/var/www/tda-events-source/  # Source Code (Git Repository)
/var/www/tda-events/          # Production Build (nginx root)
```

## Server-Konfiguration

- **Domain**: events.tda-intl.org
- **nginx Config**: /etc/nginx/sites-available/events.tda-intl.org
- **SSL**: Let's Encrypt
- **Backend Port**: 5002
- **Process Manager**: PM2

## Entwicklung

### CSS-Konventionen
- Verwende `EventsLogin.css` für Login-spezifische Styles
- Keine Konflikte mit der Dojo-Software (separates Projekt)

### Git Workflow
1. Änderungen in `/var/www/tda-events-source/` vornehmen
2. Testen mit `npm start`
3. Build mit `npm run build`
4. Deploy mit `npm run deploy`
5. Commit & Push zu GitHub

## Weitere TDA Projekte

- **Dojo Software**: [dojo.tda-intl.org](https://dojo.tda-intl.org) - Vereinsverwaltung
- **Hall of Fame**: [hof.tda-intl.org](https://hof.tda-intl.org) - Ehrentafel
- **Homepage**: [tda-intl.org](https://tda-intl.org) - Hauptwebsite

## Support

Bei Fragen oder Problemen wenden Sie sich an den TDA Support.

## Lizenz

© 2026 TDA International. Alle Rechte vorbehalten.
