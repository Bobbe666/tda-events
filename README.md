# TDA Events & Tournament Management

Frontend für die TDA Turniersoftware (events.tda-intl.org)

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

## Build

```bash
npm run build
```

## Deployment

```bash
npm run deploy
```

Oder manuell:
```bash
./deploy.sh
```

## Struktur

- `/src/components/auth/` - Login/Registration Komponenten
- `/src/styles/EventsLogin.css` - Events-spezifische Styles
- `/build/` - Production Build
- Deployment: `/var/www/tda-events/`
- Backend API: Port 5002

## Getrennt von dojosoftware

Dieses Projekt ist komplett getrennt von dojosoftware!
