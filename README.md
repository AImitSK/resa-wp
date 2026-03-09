# RESA — Real Estate Smart Assets

WordPress-Plugin mit interaktiven, leadgenerierenden Rechnern und Tools für Immobilienmakler im DACH-Raum.

## Features

- **Smart Assets** — Einbettbare Rechner (Mietpreis, Immobilienwert, Kaufnebenkosten u.v.m.) als Shortcode
- **Lead-Erfassung** — Zweiphasiges Formular mit DSGVO-konformer Einwilligung und Funnel-Tracking
- **E-Mail & PDF** — Automatisierte Ergebnisberichte per E-Mail mit individuell gestaltbaren PDF-Reports
- **Integrationen** — Webhooks, Messenger (Slack/Teams/Discord), API-Keys, CRM-Anbindungen
- **Analytics** — Funnel-Tracking mit Start-/Completion-/Conversion-Raten, Google Ads Integration
- **Standorte & Makler** — Mehrere Standorte mit eigenen Faktoren, Makler-Zuordnung, Geocoding
- **Mehrsprachig** — Deutsch (DE/AT/CH) mit DACH-Formatierung (€, Komma-Dezimal, m²)
- **Modulares System** — Lead Tools als eigenständige Module, aktivierbar über den Admin-Bereich

## Tech Stack

| Bereich         | Technologie                                        |
| --------------- | -------------------------------------------------- |
| Backend         | PHP 8.1+, Composer, WordPress REST API             |
| Frontend        | React 18, TypeScript 5, Vite 6                     |
| Styling         | Tailwind CSS 3 (Prefix `resa-`), shadcn/ui (Radix) |
| Formulare       | React Hook Form 7 + Zod 3                          |
| State           | Zustand 4 + React Query 5                          |
| Charts          | Nivo (D3)                                          |
| Animation       | Framer Motion 11                                   |
| PDF             | DOMPDF (Standard) / Puppeteer (empfohlen)          |
| E-Mail          | WordPress SMTP + Brevo API                         |
| i18n            | WordPress gettext + @wordpress/i18n                |
| Monetarisierung | Freemius SDK                                       |

## Voraussetzungen

- Docker & Docker Compose
- Node.js 20+ und npm
- PHP 8.1+ und Composer (für IDE-Support, Tests laufen im Docker)

## Schnellstart

```bash
# Repository klonen
git clone <repo-url>
cd resa-wp

# Docker-Umgebung starten
cp .env.example .env
docker compose up -d

# Dependencies installieren
npm install
composer install

# Vite Dev-Server starten
npm run dev
```

## Docker-Services

| Service          | URL                            | Beschreibung              |
| ---------------- | ------------------------------ | ------------------------- |
| WordPress        | http://localhost:8080          | WordPress + PHP 8.1       |
| WP-Admin         | http://localhost:8080/wp-admin | Admin (admin / admin)     |
| phpMyAdmin       | http://localhost:8081          | Datenbank-Verwaltung      |
| Mailpit          | http://localhost:8025          | E-Mail-Catch (SMTP :1025) |
| Node (Puppeteer) | http://localhost:3000          | PDF-Service               |

## Entwicklungs-Commands

```bash
npm run dev              # Vite Dev-Server mit HMR
npm run build            # TypeScript-Check + Vite Production Build
npm run lint             # ESLint
npm run lint:fix         # ESLint mit Auto-Fix
npm run format           # Prettier
npm run test             # Vitest (JS)
npm run test:coverage    # Vitest mit Coverage
npm run test:php         # PHPUnit im Docker
npm run test:e2e         # Playwright E2E
npm run i18n:build       # POT → PO → MO → JSON
npm run plugin:build     # Vollständiger Build
npm run plugin:zip       # Build + ZIP
```

## Projektstruktur

```
resa.php                    # Plugin-Einstiegspunkt
includes/                   # PHP-Backend (Namespace: Resa\)
  Core/                     # Bootstrap, ModuleRegistry, ModuleInterface, FeatureGate
  Admin/                    # WP-Admin Menüs und Seiten
  Api/                      # REST-Controller (/resa/v1/*)
  Models/                   # Lead, Location, Agent, Webhook, etc.
  Services/                 # Email/, Pdf/, Tracking/, Geocoding/
  Database/                 # Schema + Migrationen (dbDelta)
  Shortcode/                # [resa] Shortcode-Handler
  Freemius/                 # SDK-Init + FeatureGate
  Cron/                     # Geplante Aufgaben
  Privacy/                  # DSGVO-Compliance
  Security/                 # Rate Limiting, Honeypot, reCAPTCHA
modules/                    # Lead Tool Module
  rent-calculator/          # Mietpreis-Kalkulator (implementiert)
src/
  frontend/                 # Widget React-App (Besucher)
  admin/                    # Admin React-App (WP-Admin)
  components/icons/         # ResaIcon Registry + SVG Sets
dist/                       # Vite Build-Output
languages/                  # i18n: POT, PO, MO, JSON
tests/
  php/                      # PHPUnit + Brain Monkey
  js/                       # Vitest + React Testing Library
  e2e/                      # Playwright
addons/                     # CRM-Integrationen (Zukunft)
docs/                       # Dokumentation
```

## Dokumentation

Ausführliche Dokumentation unter [`docs/`](./docs/):

- **[Architecture](./docs/architecture/)** — Übersicht, Module, Datenbank, REST API, Frontend
- **[Guides](./docs/guides/)** — Setup, Testing, Modul erstellen, Deployment
- **[Reference](./docs/reference/)** — Services, Freemius, i18n
- **[Design System](./docs/design-system/)** — Komponenten, Tokens, Patterns

## Lizenz

Proprietär — © resa-wt.com
