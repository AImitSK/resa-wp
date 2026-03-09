# Testing

## Überblick

| Ebene           | Tool                           | Verzeichnis              | Command            |
| --------------- | ------------------------------ | ------------------------ | ------------------ |
| PHP Unit        | PHPUnit 10 + Brain Monkey      | `tests/php/Unit/`        | `npm run test:php` |
| PHP Integration | PHPUnit 10 + Brain Monkey      | `tests/php/Integration/` | `npm run test:php` |
| JS Unit         | Vitest + React Testing Library | `tests/js/`              | `npm run test`     |
| E2E             | Playwright                     | `tests/e2e/`             | `npm run test:e2e` |

## PHP-Tests

Laufen im Docker-Container:

```bash
# Alle PHP-Tests
npm run test:php

# Einzelnen Test
docker compose exec -T wordpress bash -c \
  'cd /var/www/html/wp-content/plugins/resa && php vendor/bin/phpunit --filter=LeadModelTest'
```

### Teststruktur

```
tests/php/
  Unit/
    Api/                    # REST Controller Tests
    Core/                   # ModuleRegistry, FeatureGate, etc.
    Cron/                   # Cron-Job Tests
    Database/               # Schema Tests
    Freemius/               # FeatureGate Tests
    Models/                 # Lead, Location, Agent Tests
    Modules/RentCalculator/ # Modul-spezifische Tests
    Privacy/                # DSGVO Tests
    Security/               # Rate Limiting, Honeypot, reCAPTCHA
    Services/               # Email, PDF, Tracking, Geocoding
  Integration/
    AgentAssignment/        # Agent-Zuordnung
    EmailIntegration/       # Email-Versand
    ExportIntegration/      # CSV-Export
    LeadIntegration/        # Lead-Lifecycle
    LocationIntegration/    # Standort-CRUD
    ModuleIntegration/      # Modul-Registry
    PdfIntegration/         # PDF-Generierung
    SearchIntegration/      # Suche
    TrackingIntegration/    # Funnel-Tracking
    WebhookIntegration/     # Webhook-Dispatch
```

### WordPress-Mocking

Brain Monkey mockt WordPress-Funktionen (`add_action`, `get_option`, `__()`, etc.). Mockery für Dependency Injection.

## JavaScript-Tests

```bash
# Alle JS-Tests
npm run test

# Mit Coverage
npm run test:coverage

# Watch-Modus
npx vitest --watch
```

### Teststruktur

```
tests/js/
  admin/
    components/             # Admin-Komponenten
    hooks/                  # Custom Hooks (useLeads, useLocations, etc.)
  frontend/
    components/             # Widget-Komponenten (StepWizard, LeadForm)
    hooks/                  # Frontend Hooks
    lib/                    # Utility-Funktionen
  modules/
    rent-calculator/        # Steps, RentResult, Schemas
  integration/
    pages/                  # Full-Page Integration Tests
  unit/
    schemas/                # Zod Schema Tests
```

## E2E-Tests

Playwright mit Docker-WordPress:

```bash
# Alle E2E-Tests
npm run test:e2e

# Mit UI
npm run test:e2e:ui
```

### Teststruktur

```
tests/e2e/
  admin-auth.spec.ts        # Login, Berechtigungen
  admin-leads.spec.ts       # Lead-Verwaltung
  admin-locations.spec.ts   # Standort-Verwaltung
  admin-modules.spec.ts     # Modul-Store
  admin-settings.spec.ts    # Einstellungen
  lead-flow.spec.ts         # Kompletter Lead-Funnel
  mobile.spec.ts            # Mobile-Ansicht
  pdf-download.spec.ts      # PDF-Download
  helpers/
    api-client.ts           # Test-API-Client
    selectors.ts            # Wiederverwendbare Selektoren
    wp-cli.ts               # WordPress CLI Helper
```

## CI/CD

GitHub Actions (`.github/workflows/test.yml`):

| Job          | Trigger                   | Beschreibung                       |
| ------------ | ------------------------- | ---------------------------------- |
| **lint**     | Push + PR                 | TypeScript-Check, ESLint, Prettier |
| **test-php** | Push + PR (nach lint)     | Composer + PHPUnit                 |
| **test-js**  | Push + PR (nach lint)     | Vitest                             |
| **test-e2e** | **Nur PRs** (nach php+js) | Docker Compose + Playwright        |

E2E-Tests laden Playwright-Artifacts (Screenshots, Videos) bei Fehlern als GitHub Artifacts hoch.
