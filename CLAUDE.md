# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA (Real Estate Smart Assets) is a WordPress plugin that provides interactive, lead-generating calculators and tools for German-speaking real estate agents (DACH region). It follows a freemium model via Freemius SDK.

**Current state:** Active development. Architecture docs in `docs/architecture/`, guides in `docs/guides/`, reference in `docs/reference/`.

## Tech Stack

- **Backend:** PHP 8.1+ with Composer (PSR-4 namespace `Resa\`), WordPress plugin conventions
- **Frontend:** React 18, TypeScript 5, Vite 6 (via `@kucrut/vite-for-wp`)
- **Styling:** Tailwind CSS 3 with `resa-` prefix (CSS isolation), shadcn/ui (Radix-based, copied components)
- **Forms:** React Hook Form 7 + Zod 3 (validation)
- **State:** Zustand 4 (local) + React Query 5 (server state)
- **Charts:** Nivo (D3-based)
- **Animation:** Framer Motion 11
- **i18n:** WordPress gettext + `@wordpress/i18n` (JS), development language is German
- **PDF:** mPDF (native SVG support, better CSS than DOMPDF)
- **Email:** PHPMailer (WordPress-native SMTP) + Brevo API
- **Monetization:** Freemius SDK 2.x

## Build & Development Commands

```bash
npm install && composer install   # Setup

npm run dev                       # Vite dev server with HMR
npm run build                     # TypeScript check + Vite production build
npm run lint                      # ESLint
npm run lint:fix                  # ESLint with auto-fix
npm run format                    # Prettier
npm run test                      # Vitest (JS unit tests)
npm run test:coverage             # Vitest with coverage

# i18n
npm run i18n:build                # Full chain: POT -> PO -> MO -> JSON

# Plugin distribution
npm run plugin:build              # build + i18n + composer install --no-dev
npm run plugin:zip                # Full build + ZIP creation
```

**PHP testing:** PHPUnit 10 with Brain Monkey for WordPress mocking. Tests in `tests/php/`.
**JS testing:** Vitest with React Testing Library. Tests in `tests/js/`.
**Static analysis:** PHPStan (level 6), PHP_CodeSniffer (WordPress standards).
**Pre-commit:** Husky + lint-staged.

## Architecture: Three-Tier Modular System

RESA follows a **plugin-in-plugin architecture** (like Chrome Extension Store):

**Tier 1: Kernplugin** (`includes/` + `src/`) — The platform. Dashboard, lead management, locations, StepWizard framework, LeadForm, PDF service, email service, tracking, icon registry, module registry, REST API base, Freemius SDK, feature gating. Always present.

**Tier 2: Lead Tool Module** (`modules/`) — Registerable, activatable modules. Each module brings its own frontend steps, calculation logic, settings, result template, and PDF blocks. Consumes core services (StepWizard, LeadForm, PDF, email, locations, icons). Flag system: `free` (2 tools), `pro` (6 tools), `paid` (future).

**Tier 3: Integrationen** — Basis integrations (webhooks, email notifications) in core. Paid CRM integrations (onOffice, Propstack, etc.) as separate WordPress plugins via Freemius add-ons.

See `docs/architecture/modules.md` for full details (registry system, module interface, flag system).

### Two Entry Points

1. **Frontend Widget** (`src/frontend/main.tsx`) — Visitor-facing calculators embedded via `[resa]` shortcode. Bundles its own React (isolation from themes). CSS scoped via `.resa-widget-root` container + Tailwind `resa-` prefix. No Tailwind preflight (would break host theme). Target: <120 KB gzip.

2. **Admin Dashboard** (`src/admin/main.tsx`) — WP-Admin pages for lead management, module store, settings, configuration. Uses WordPress-bundled React (`wp-element`). Target: <250 KB gzip.

Both communicate with the backend via WordPress REST API at `/wp-json/resa/v1/`.

## Key Architectural Patterns

- **Module Registry:** Lead tools register via `ModuleInterface` and `ModuleRegistry`. Each module declares its slug, flag (free/pro/paid), frontend steps, settings schema, calculator service, and PDF blocks. Core discovers and orchestrates modules.
- **Icon Registry:** Central `ResaIcon` component with semantic names (e.g. `'house'`, `'calculator-rent'`). Modules reference icons by name, never import icon libraries directly. Icon sets are swappable.
- **Multi-Step Wizard:** Shared `StepWizard` component drives all calculator modules. Module provides its steps, core appends LeadForm + Result automatically. Each step validates independently via Zod. Framer Motion handles animated transitions.
- **Two-Phase Lead Capture:** Phase 1 (partial lead with UUID session) when user reaches the form, Phase 2 (complete lead) on submission. Enables funnel tracking and GDPR compliance.
- **Feature Gating:** `FeatureGate` class checks module flag + Freemius plan. Free: 2 modules (Mietpreis + Immobilienwert), Pro: all 8, paid: future Freemius add-ons. Limits: free max 1 location, 50 visible leads.
- **Service Layer:** Backend calculators implement `CalculatorInterface`. Email dispatches through SMTP or Brevo transport. PDF generates via mPDF with native SVG support. All services are core — modules consume them.
- **REST Controller Base:** All API endpoints extend `RestController` with nonce verification, permission checks, response formatting. Module endpoints under `/resa/v1/modules/{slug}/*`.
- **CSS Isolation:** Frontend widget uses Tailwind `resa-` prefix, `.resa-widget-root` importance scope, custom mini-reset, no preflight. This is critical — the widget must not break host themes.

## Source Layout

```
resa.php                          # Plugin entry point
includes/                         # PHP backend (PSR-4: Resa\)
  Core/                           # Bootstrap, ModuleRegistry, ModuleInterface, FeatureGate
  Admin/                          # WP-Admin menu, pages
  Api/                            # REST controllers (/resa/v1/*)
  Models/                         # Lead, Location, Agent, Webhook, etc.
  Services/                       # Email/, Pdf/, Tracking/, Geocoding/
  Database/                       # Schema + migrations (dbDelta)
  Shortcode/                      # [resa] shortcode handler
  Freemius/                       # SDK init + FeatureGate
  Cron/                           # Scheduled tasks
  Privacy/                        # GDPR compliance
  Security/                       # Rate limiting, honeypot, reCAPTCHA
modules/                          # Lead Tool Modules
  rent-calculator/                # [free] Mietpreis-Kalkulator (implemented)
    module.php                    # Bootstrap, registers with ModuleRegistry
    RentCalculatorModule.php      # ModuleInterface implementation
    RentCalculatorService.php     # Calculation logic
    RentCalculatorController.php  # REST endpoints
    src/steps/                    # React step components
    src/result/                   # Result component
src/
  frontend/                       # Widget React app (visitor-facing)
    components/shared/            # StepWizard, LeadForm, ProgressBar
    components/ui/                # shadcn/ui components
  components/icons/               # ResaIcon Registry + SVG sets
  admin/                          # Admin React app
    pages/                        # Dashboard, Leads, Locations, ModuleStore, etc.
    components/                   # LeadTable, ModuleCard, etc.
    hooks/                        # useLeads, useLocations, useSettings, etc.
dist/                             # Vite build output with manifest.json
languages/                        # i18n: POT, PO, MO, JSON files
tests/
  php/                            # PHPUnit + Brain Monkey (Unit/ + Integration/)
  js/                             # Vitest + React Testing Library
  e2e/                            # Playwright E2E tests
addons/                           # CRM integrations (future)
docs/                             # Architecture, guides, reference
```

## REST API

Public endpoints (no auth): module config, calculations, lead submission, tracking.
Admin endpoints (nonce + capability): leads CRUD, locations, module management, settings, email/PDF templates, integrations, analytics.
Module endpoints: `/resa/v1/modules/{slug}/config`, `/resa/v1/modules/{slug}/calculate`, `/resa/v1/admin/modules/{slug}/settings`.

All under `/wp-json/resa/v1/`. See `docs/architecture/rest-api.md` for full endpoint list.

## Database

10 custom tables (created via `dbDelta()` on activation): `resa_leads`, `resa_tracking_daily`, `resa_locations`, `resa_email_log`, `resa_agents`, `resa_agent_locations`, `resa_module_settings`, `resa_webhooks`, `resa_api_keys`, `resa_messengers`. Schema details in `docs/architecture/database.md`.

## Development Workflow

Ausführliche Version: `.claude/WORKFLOW.md`

**Feature-Prozess:** Verstehen → `/spec` → Plan → Implementieren → `/test` → `/review` → Commit

| Schritt            | Großes Feature | Kleines Feature | Bugfix     |
| ------------------ | -------------- | --------------- | ---------- |
| `/spec` erstellen  | Ja             | Nein            | Nein       |
| Plan-Modus         | Ja             | Ja              | Bei Bedarf |
| Implementieren     | Ja             | Ja              | Ja         |
| `/test` generieren | Ja             | Ja              | Ja         |
| `/review`          | Ja             | Ja              | Ja         |

**Passive Skills (immer automatisch anwenden):**

- `wp-security` — Sanitization, Escaping, Nonces, Capabilities, prepare(), permission_callback
- `wp-i18n` — Text-Domain `'resa'`, esc_html\_\_(), Translator-Kommentare, \_n(), DACH-Format
- `freemius` — can_use_premium_code(), FeatureGate, Module-Flags (free/pro/paid), Free-Limits (2 Free-Tools, 1 Location, 50 Leads)
- `nivo-charts` (PDF) — SimpleBarChart/SimpleGaugeChart für statische SVG-Charts in PDFs, mPDF rendert SVG nativ
- `nivo-charts` — resaChartTheme, resaColors, Dual-Rendering (Web interaktiv / PDF statisch), DACH-Zahlenformat

**Sprache:** Kommunikation immer auf Deutsch. Rückfragen statt Annahmen.

## Documentation

All docs in `docs/`:

**Architecture** (`docs/architecture/`):

- `overview.md` — Three-tier model, entry points, data flow, directory structure
- `modules.md` — ModuleRegistry, ModuleInterface, flag system, rent-calculator module
- `database.md` — All 10 tables with columns, migrations, relationships
- `rest-api.md` — All endpoints (public, admin, external) with auth patterns
- `frontend.md` — Widget vs Admin, CSS isolation, build config, shared components

**Guides** (`docs/guides/`):

- `development-setup.md` — Docker, npm, Composer, .env, services
- `testing.md` — PHPUnit, Vitest, Playwright, CI/CD pipeline
- `adding-a-module.md` — Step-by-step guide for new lead tool modules
- `deployment.md` — Build, ZIP, Freemius release, version bumping

**Reference** (`docs/reference/`):

- `services.md` — EmailService, LeadPdfService, TrackingService, NominatimGeocoder
- `freemius.md` — FeatureGate, limits, module flags (no pricing)
- `i18n.md` — gettext workflow, DACH formats

**Other:**

- `docs/design-system/` — UI components, tokens, patterns
- `docs/Smart-Assets-Ideensammlung.md` — All planned asset types and prioritization
