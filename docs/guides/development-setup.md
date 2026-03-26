# Development Setup

## Voraussetzungen

- Docker + Docker Compose
- Node.js 20+
- PHP 8.1+ (nur für lokale IDE-Unterstützung, Tests laufen im Docker)

## Schnellstart

### 1. Repository klonen

```bash
git clone <repo-url> resa-wp
cd resa-wp
```

### 2. Environment

```bash
cp .env.example .env
# Anpassen falls nötig (Ports, DB-Credentials)
```

### 3. Docker starten

```bash
docker compose up -d
```

Erster Start: WordPress wird automatisch via `wpcli`-Service initialisiert (Admin-User, Plugin-Aktivierung).

### 4. Dependencies

```bash
npm install
composer install
```

### 5. Vite Dev-Server

```bash
npm run dev
```

Startet auf `http://localhost:5173` mit HMR. WordPress erkennt den Dev-Server über die `dist/hot`-Datei.

### 6. WordPress öffnen

- **Frontend:** http://localhost:8080
- **Admin:** http://localhost:8080/wp-admin

## Docker-Services

| Service    | URL                   | Beschreibung                              |
| ---------- | --------------------- | ----------------------------------------- |
| WordPress  | http://localhost:8080 | WordPress + PHP 8.1, Plugin-Dir gemountet |
| phpMyAdmin | http://localhost:8081 | Datenbank-Verwaltung                      |
| Mailpit    | http://localhost:8025 | E-Mail-Catch (SMTP auf Port 1025)         |
| MySQL      | intern (3306)         | MySQL 8.0                                 |

PDF-Generierung via mPDF (rein PHP, keine externen Services nötig).

## Nützliche Commands

```bash
# PHP-Tests im Docker
npm run test:php

# JavaScript-Tests lokal
npm run test

# Linting
npm run lint
npm run format

# Build
npm run build

# i18n
npm run i18n:build
```

## IDE-Einrichtung

- **PHP:** PHPStan-Konfiguration in `phpstan.neon`, WordPress-Stubs installiert
- **TypeScript:** `tsconfig.json` mit Path-Aliases (`@`, `@frontend`, `@admin`, `@modules`)
- **ESLint + Prettier:** Konfiguriert, Husky + lint-staged für Pre-Commit

## Debugging

- **PHP:** Xdebug im Docker-Container (Port 9003)
- **E-Mails:** Alle Mails werden von Mailpit abgefangen → http://localhost:8025
- **DB:** phpMyAdmin → http://localhost:8081
- **PDF:** Generiert via mPDF, Temp-Dateien in `wp-content/uploads/resa-mpdf-tmp/`
