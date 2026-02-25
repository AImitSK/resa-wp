# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RESA (Real Estate Smart Assets) is a WordPress plugin that provides interactive, lead-generating calculators and tools for German-speaking real estate agents (DACH region). It follows a freemium model via Freemius SDK.

**Current state:** Planning/specification phase. Detailed architecture docs live in `docs/planning/`. Source code implementation follows these specifications.

## Tech Stack

- **Backend:** PHP 8.1+ with Composer (PSR-4 namespace `Resa\`), WordPress plugin conventions
- **Frontend:** React 18, TypeScript 5, Vite 6 (via `@kucrut/vite-for-wp`)
- **Styling:** Tailwind CSS 3 with `resa-` prefix (CSS isolation), shadcn/ui (Radix-based, copied components)
- **Forms:** React Hook Form 7 + Zod 3 (validation)
- **State:** Zustand 4 (local) + React Query 5 (server state)
- **Charts:** Nivo (D3-based)
- **Animation:** Framer Motion 11
- **i18n:** WordPress gettext + `@wordpress/i18n` (JS), development language is German
- **PDF:** DOMPDF (fallback) + Puppeteer (recommended)
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

See `docs/planning/RESA-Modulare-Architektur.md` for full details (registry system, module interface, icon registry, data flow).

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
- **Service Layer:** Backend calculators implement `CalculatorInterface`. Email dispatches through SMTP or Brevo transport. PDF generates via DOMPDF or Puppeteer. All services are core — modules consume them.
- **REST Controller Base:** All API endpoints extend `RestController` with nonce verification, permission checks, response formatting. Module endpoints under `/resa/v1/modules/{slug}/*`.
- **CSS Isolation:** Frontend widget uses Tailwind `resa-` prefix, `.resa-widget-root` importance scope, custom mini-reset, no preflight. This is critical — the widget must not break host themes.

## Source Layout (Planned)

```
resa.php                        # Plugin entry point
includes/                       # PHP backend (PSR-4: Resa\)
  Core/                         # Plugin bootstrap, activation, i18n
    ModuleRegistry.php          # Module discovery + registry
    ModuleInterface.php         # Contract for all lead tool modules
    FeatureGate.php             # Plan + flag check (free/pro/paid)
    IconRegistry.php            # Central icon management
  Admin/                        # WP-Admin menu, pages, settings
    ModuleStorePage.php         # Module overview ("Store")
  Api/                          # REST controllers (/resa/v1/*)
    ModulesController.php       # /resa/v1/modules/* (registry API)
  Models/                       # Lead, Location, Agent, EmailTemplate CRUD
  Services/                     # Calculator/, Pdf/, Email/, Integration/
    Calculator/CalculatorInterface.php  # Interface modules implement
  Database/                     # Schema, migrations (dbDelta), seeders
  Shortcode/                    # [resa] shortcode handler
  Freemius/                     # SDK init
modules/                        # Lead Tool Modules (each self-contained)
  rent-calculator/              # [free] Mietpreis-Kalkulator
    module.php                  # Bootstrap, registers with ModuleRegistry
    RentCalculatorModule.php    # ModuleInterface implementation
    RentCalculatorService.php   # Calculation logic
    src/steps/                  # React step components
    src/result/                 # Result component
    tests/                      # Module-specific tests
  value-calculator/             # [free] Immobilienwert-Kalkulator
  purchase-costs/               # [pro] Kaufnebenkosten-Rechner
  budget-calculator/            # [pro] Budgetrechner
  roi-calculator/               # [pro] Renditerechner
  energy-check/                 # [pro] Energieeffizienz-Check
  seller-checklist/             # [pro] Verkäufer-Checkliste
  buyer-checklist/              # [pro] Käufer-Checkliste
src/
  frontend/                     # Widget React app (shared core)
    components/shared/          # StepWizard, LeadForm, ProgressBar, ResultCard
    components/ui/              # shadcn/ui components (copied)
    components/icons/           # Icon Registry (ResaIcon, sets/)
    hooks/                      # useApi, useLocale, useModuleConfig
    lib/                        # api-client, format, module-loader
    types/                      # TypeScript interfaces (incl. module.ts)
  admin/                        # Admin React app
    pages/                      # Dashboard, Leads, ModuleStore, ModuleSettings, etc.
    components/                 # LeadTable, ModuleCard, ModuleSettingsPanel
    hooks/                      # useLeads, useLocations, useSettings
dist/                           # Vite build output with manifest.json
languages/                      # i18n: POT, PO, MO, JSON files
tests/php/                      # PHPUnit core tests (Unit/ + Integration/)
tests/js/                       # Vitest core tests (components/ + hooks/)
```

## REST API

Public endpoints (no auth): module config, calculations, lead submission, tracking.
Admin endpoints (nonce + capability): leads CRUD, locations, module management, settings, email/PDF templates, integrations, analytics.
Module endpoints: `/resa/v1/modules/{slug}/config`, `/resa/v1/modules/{slug}/calculate`, `/resa/v1/admin/modules/{slug}/settings`.

All under `/wp-json/resa/v1/`. See `docs/planning/RESA-Modulare-Architektur.md` section 9 for full endpoint list.

## Database

Custom tables (created via `dbDelta()` on activation): `resa_leads`, `resa_tracking_daily`, `resa_locations`, `resa_email_log`, `resa_agents`, `resa_agent_locations`. Schema details in `docs/planning/RESA-Technischer-Stack.md` section 8.

## Development Workflow

Ausführliche Version: `.claude/WORKFLOW.md`

**Feature-Prozess:** Verstehen → `/spec` → Plan → Implementieren → `/test` → `/review` → Commit

| Schritt | Großes Feature | Kleines Feature | Bugfix |
|---|---|---|---|
| `/spec` erstellen | Ja | Nein | Nein |
| Plan-Modus | Ja | Ja | Bei Bedarf |
| Implementieren | Ja | Ja | Ja |
| `/test` generieren | Ja | Ja | Ja |
| `/review` | Ja | Ja | Ja |

**Passive Skills (immer automatisch anwenden):**
- `wp-security` — Sanitization, Escaping, Nonces, Capabilities, prepare(), permission_callback
- `wp-i18n` — Text-Domain `'resa'`, esc_html__(), Translator-Kommentare, _n(), DACH-Format
- `freemius` — can_use_premium_code(), FeatureGate, Module-Flags (free/pro/paid), Free-Limits (2 Free-Tools, 1 Location, 50 Leads)
- `dompdf` — DOMPDF CSS-Limits (kein Flex/Grid), Table-Layout, Puppeteer-Fallback, SimpleCharts für SVG
- `nivo-charts` — resaChartTheme, resaColors, Dual-Rendering (Web interaktiv / PDF statisch), DACH-Zahlenformat

**Sprache:** Kommunikation immer auf Deutsch. Rückfragen statt Annahmen.

## Planning Documentation

All specifications are in `docs/planning/`:
- **`RESA-Modulare-Architektur.md`** — **Central architecture doc:** Three-tier model, module registry, module interface, icon registry, flag system, data flow, developer API
- `RESA-Technischer-Stack.md` — Full tech stack, Vite config, DB schema
- `RESA-Plugin-Architektur.md` — Admin UI structure, page components, workflows
- `RESA-Freemius-Monetarisierung.md` — Pricing tiers, feature gating, add-ons
- `RESA-Lead-Formular.md` — Lead form components, validation, GDPR consent flow
- `RESA-Charts-und-PDF.md` — Nivo chart types, dual rendering (web + PDF), DOMPDF limitations
- `RESA-Teststrategie.md` — Test pyramid, CI/CD pipeline, coverage targets
- `RESA-Integrationsstrategie.md` — CRM integrations (onOffice, Propstack, FLOWFACT)
- `RESA-i18n-Planung.md` — Translation workflow, DACH locale variants
- `RESA-Tracking-und-Conversion.md` — Funnel tracking, offline conversion (GCLID/FBCLID)
- `RESA-Karten-und-Geocoding.md` — Leaflet/Google Maps integration
- `Smart-Assets-Ideensammlung.md` — All 18 planned asset types and prioritization
