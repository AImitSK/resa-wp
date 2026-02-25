# RESA — Real Estate Smart Assets

WordPress-Plugin mit interaktiven, leadgenerierenden Rechnern und Tools für Immobilienmakler im DACH-Raum.

## Features

- **Smart Assets** — Einbettbare Rechner (Mietrendite, Immobilienbewertung, Finanzierung u.v.m.) als Shortcode oder Block
- **Lead-Erfassung** — Zweiphasiges Formular mit DSGVO-konformer Einwilligung und Funnel-Tracking
- **E-Mail & PDF** — Automatisierte Ergebnisberichte per E-Mail mit individuell gestaltbaren PDF-Reports
- **CRM-Integration** — Anbindung an onOffice, Propstack, FLOWFACT und weitere Maklersoftware
- **Mehrsprachig** — Deutsch, Österreichisch, Schweizerdeutsch (de_DE, de_AT, de_CH)
- **Freemium-Modell** — Kostenloser Einstieg, erweiterte Funktionen über Freemius-Pläne

## Tech Stack

| Bereich    | Technologie                                        |
|------------|----------------------------------------------------|
| Backend    | PHP 8.1+, Composer, WordPress REST API             |
| Frontend   | React 18, TypeScript 5, Vite 6                     |
| Styling    | Tailwind CSS 3 (Prefix `resa-`), shadcn/ui         |
| Formulare  | React Hook Form 7 + Zod 3                          |
| State      | Zustand 4 + React Query 5                          |
| Charts     | Nivo (D3)                                          |
| PDF        | DOMPDF / Puppeteer                                 |
| E-Mail     | WordPress SMTP + Brevo API                         |

## Voraussetzungen

- Docker & Docker Compose
- Node.js 20+ und npm
- PHP 8.1+ und Composer (für lokale Entwicklung ohne Docker)

## Schnellstart

```bash
# Repository klonen
git clone https://github.com/your-org/resa-wp.git
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

Nach dem Start:

| Service     | URL                       |
|-------------|---------------------------|
| WordPress   | http://localhost:8080      |
| WP-Admin    | http://localhost:8080/wp-admin (admin / admin) |
| phpMyAdmin  | http://localhost:8081      |
| Mailpit     | http://localhost:8025      |

## Entwicklung

```bash
npm run dev              # Vite Dev-Server mit HMR
npm run build            # Production-Build
npm run lint             # ESLint
npm run test             # Vitest
npm run i18n:build       # Übersetzungen generieren
```

## Projektstruktur

```
resa.php                 # Plugin-Einstiegspunkt
includes/                # PHP-Backend (Namespace: Resa\)
  Admin/                 # WP-Admin Menüs, Seiten, Settings
  Api/                   # REST-Controller (/resa/v1/*)
  Core/                  # Bootstrap, Aktivierung, i18n
  Database/              # Schema, Migrationen, Seeder
  Freemius/              # SDK-Init + Feature-Gating
  Models/                # Lead, Location, Asset, EmailTemplate
  Services/              # Calculator, PDF, Email, Integration
  Shortcode/             # [resa] Shortcode-Handler
src/
  frontend/              # Widget React-App (Besucher)
  admin/                 # Admin React-App (WP-Admin)
dist/                    # Vite Build-Output
languages/               # i18n: POT, PO, MO, JSON
docker/                  # Docker-Konfiguration
docs/planning/           # Architektur- und Planungsdokumentation
```

## Lizenz

Proprietär — © resa-wt.com
