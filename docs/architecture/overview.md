# Architektur-Übersicht

## Three-Tier-Modell

RESA folgt einer **Plugin-in-Plugin-Architektur** mit drei Ebenen:

```
Tier 1: Kernplugin (includes/ + src/)
  └── Plattform: Dashboard, Lead-Management, Standorte, StepWizard,
      LeadForm, PDF, Email, Tracking, Icon Registry, Module Registry,
      REST API, Freemius SDK, Feature Gating

Tier 2: Lead Tool Module (modules/)
  └── Eigenständige Rechner/Tools, die sich beim Kern registrieren.
      Jedes Modul bringt eigene Steps, Berechnung, Settings, Result mit.
      Flag-System: free (2), pro (6), paid (Zukunft)

Tier 3: Integrationen
  └── Basis (Webhooks, Messenger, API-Keys) im Kern.
      CRM-Add-ons (onOffice, Propstack, etc.) als separate Plugins
      via Freemius Add-ons.
```

## Zwei Entry Points

### 1. Frontend Widget (`src/frontend/main.tsx`)

Besucher-facing Rechner, eingebettet via `[resa module="rent-calculator"]` Shortcode.

- Eigene React-Instanz (Isolation vom Theme)
- CSS-Scoping: `.resa-widget-root` Container + Tailwind `resa-` Prefix
- Kein Tailwind Preflight (würde Host-Theme brechen)
- Rendert `<div class="resa-widget-root" data-module="...">` Container
- CSS-Variablen für Branding: `--resa-primary`, `--resa-ring`, `--resa-icon-*`

### 2. Admin Dashboard (`src/admin/main.tsx`)

WP-Admin Seiten für Lead-Management, Modul-Store, Einstellungen.

- Nutzt WordPress-bundled React (`wp-element`)
- Mountet auf `#resa-admin-root`
- Seiten: Dashboard, Leads, Locations, ModuleStore, ModuleSettings, Analytics, Integrations, Settings, PdfTemplates

## Datenfluss

```
Besucher → Widget (React)
  → StepWizard (Eingaben pro Schritt, Zod-Validierung)
  → LeadForm (Kontaktdaten + DSGVO-Consent)
  → REST API POST /leads/partial (Phase 1: Session-UUID)
  → REST API POST /leads/complete (Phase 2: Kontaktdaten)
  → Berechnung (CalculatorService)
  → Result-Ansicht
  → PDF-Generierung (DOMPDF/Puppeteer) + Email-Versand
  → Tracking (Funnel-Events → tägliche Aggregation)
```

## Verzeichnisstruktur

```
resa.php                          # Plugin Entry Point
includes/                         # PHP Backend (PSR-4: Resa\)
  Core/                           # Bootstrap, ModuleRegistry, ModuleInterface, FeatureGate
  Admin/                          # WP-Admin Menü, Seiten
  Api/                            # REST Controller (/resa/v1/*)
  Models/                         # Lead, Location, Agent, Webhook, etc.
  Services/                       # Email/, Pdf/, Tracking/, Geocoding/
  Database/                       # Schema, Migrations (dbDelta)
  Shortcode/                      # [resa] Shortcode Handler
  Freemius/                       # SDK Init + FeatureGate
  Cron/                           # Geplante Aufgaben
  Privacy/                        # DSGVO-Compliance
  Security/                       # Rate Limiting, Honeypot, reCAPTCHA
modules/                          # Lead Tool Module
  rent-calculator/                # [free] Mietpreis-Kalkulator (implementiert)
src/
  frontend/                       # Widget React App
    components/shared/            # StepWizard, LeadForm, ProgressBar
    components/ui/                # shadcn/ui Komponenten
  components/icons/               # ResaIcon Registry + SVG Sets
  admin/                          # Admin React App
    pages/                        # Dashboard, Leads, Locations, etc.
    components/                   # LeadTable, ModuleCard, etc.
    hooks/                        # useLeads, useLocations, etc.
dist/                             # Vite Build Output
languages/                        # i18n: POT, PO, MO, JSON
tests/                            # PHPUnit, Vitest, Playwright
addons/                           # CRM-Integrationen (Zukunft)
```

## Kommunikation

Frontend und Admin kommunizieren mit dem Backend via WordPress REST API unter `/wp-json/resa/v1/`. Details siehe [rest-api.md](./rest-api.md).
