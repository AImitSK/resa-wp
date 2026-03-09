# RESA Test-Coverage Plan

> Von ~30% auf 80%+ Coverage — Priorisierter Implementierungsplan

---

## Executive Summary

| Metrik      | IST  | SOLL | Delta |
| ----------- | ---- | ---- | ----- |
| PHP Backend | 64%  | 85%  | +21%  |
| JS Admin    | 9%   | 75%  | +66%  |
| JS Frontend | 56%  | 80%  | +24%  |
| Zod Schemas | 0%   | 95%  | +95%  |
| **Gesamt**  | ~30% | ~80% | +50%  |

**Geschätzter Aufwand:** ~120 Testdateien, ~4.500 Testfälle

---

## Phase 1: Kritische Validierung (Woche 1)

### 1.1 Zod Schema Tests (16 Dateien)

**Priorität: KRITISCH** — Validierungslogik ist das Fundament

| Schema               | Testdatei                 | Testfälle                           |
| -------------------- | ------------------------- | ----------------------------------- |
| `gdpr.ts`            | `gdpr.test.ts`            | Valid, Invalid URLs, Missing fields |
| `tracking.ts`        | `tracking.test.ts`        | GA4 ID format, GTM ID format        |
| `webhook.ts`         | `webhook.test.ts`         | URL validation, Event types         |
| `apiKey.ts`          | `apiKey.test.ts`          | Name required, Permissions array    |
| `messenger.ts`       | `messenger.test.ts`       | Provider enum, Webhook URL          |
| `propstack.ts`       | `propstack.test.ts`       | API key format, Mapping             |
| `recaptcha.ts`       | `recaptcha.test.ts`       | Site key, Secret key                |
| `factor.ts`          | `factor.test.ts`          | Multiplier ranges 0.1-3.0           |
| `moduleSetup.ts`     | `moduleSetup.test.ts`     | Mode enum, Preset string            |
| `locationValues.ts`  | `locationValues.test.ts`  | Tax percentages 0-100               |
| `pdfSettings.ts`     | `pdfSettings.test.ts`     | Engine enum, Colors                 |
| `location.ts`        | `location.test.ts`        | Lat/Lng ranges, Slug format         |
| `emailTemplate.ts`   | `emailTemplate.test.ts`   | Subject, Body required              |
| `pdfTemplate.ts`     | `pdfTemplate.test.ts`     | Template structure                  |
| `generalSettings.ts` | `generalSettings.test.ts` | Company info                        |

**Template für Schema-Tests:**

```typescript
// tests/js/unit/schemas/gdpr.test.ts
import { describe, it, expect } from 'vitest';
import { gdprSettingsSchema } from '@/admin/schemas/gdpr';

describe('gdprSettingsSchema', () => {
	const validData = {
		privacy_policy_url: 'https://example.com/privacy',
		imprint_url: 'https://example.com/imprint',
		consent_text: 'Ich stimme zu...',
		data_retention_days: 365,
	};

	it('akzeptiert gültige Daten', () => {
		const result = gdprSettingsSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it('lehnt ungültige URL ab', () => {
		const result = gdprSettingsSchema.safeParse({
			...validData,
			privacy_policy_url: 'not-a-url',
		});
		expect(result.success).toBe(false);
	});

	it('akzeptiert leere optionale URL', () => {
		const result = gdprSettingsSchema.safeParse({
			...validData,
			privacy_policy_url: '',
		});
		expect(result.success).toBe(true);
	});

	it('lehnt negative Aufbewahrungstage ab', () => {
		const result = gdprSettingsSchema.safeParse({
			...validData,
			data_retention_days: -1,
		});
		expect(result.success).toBe(false);
	});
});
```

### 1.2 Fehlende API Controller Tests (7 Dateien)

**Priorität: HOCH** — REST-Endpoints sind die Schnittstelle

| Controller                 | Testdatei                          | Testfälle                  |
| -------------------------- | ---------------------------------- | -------------------------- |
| `EmailTemplatesController` | `EmailTemplatesControllerTest.php` | CRUD, Validation, Auth     |
| `LocationsController`      | `LocationsControllerTest.php`      | CRUD, Geocoding, Slug      |
| `ModulesController`        | `ModulesControllerTest.php`        | List, Activate, Deactivate |
| `ModuleSettingsController` | `ModuleSettingsControllerTest.php` | Get, Update per Module     |
| `PdfSettingsController`    | `PdfSettingsControllerTest.php`    | Engine, Colors, Logo       |
| `GeocodingController`      | `GeocodingControllerTest.php`      | Search, Reverse            |
| `MapSettingsController`    | `MapSettingsControllerTest.php`    | Provider, API Key          |

**Template für Controller-Tests:**

```php
// tests/php/Unit/Api/LocationsControllerTest.php

class LocationsControllerTest extends TestCase {
    use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

    protected function setUp(): void {
        parent::setUp();
        Monkey\setUp();
        Functions\when('wp_create_nonce')->justReturn('test-nonce');
        Functions\when('check_ajax_referer')->justReturn(true);
    }

    protected function tearDown(): void {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_get_locations_returns_array(): void {
        $model = Mockery::mock('alias:Resa\Models\Location');
        $model->shouldReceive('all')->andReturn([
            ['id' => 1, 'name' => 'Berlin', 'slug' => 'berlin'],
        ]);

        $controller = new LocationsController();
        $request = new WP_REST_Request('GET', '/resa/v1/locations');

        $response = $controller->get_items($request);

        $this->assertIsArray($response->get_data());
    }

    public function test_create_location_validates_slug(): void {
        $controller = new LocationsController();
        $request = new WP_REST_Request('POST', '/resa/v1/locations');
        $request->set_body_params([
            'name' => 'Test',
            'slug' => 'INVALID SLUG!',  // Ungültig
        ]);

        $response = $controller->create_item($request);

        $this->assertEquals(400, $response->get_status());
    }
}
```

---

## Phase 2: Admin Hooks (Woche 2)

### 2.1 Daten-Hooks Tests (19 Dateien)

**Priorität: HOCH** — Zentrale Datenbeschaffungslogik

| Hook                   | Testdatei                       | Testfälle                         |
| ---------------------- | ------------------------------- | --------------------------------- |
| `useLeads`             | `useLeads.test.tsx`             | Fetch, Filter, Pagination, Delete |
| `useLocations`         | `useLocations.test.tsx`         | CRUD, Geocoding integration       |
| `useModules`           | `useModules.test.tsx`           | List, Activate, Config            |
| `useModuleSettings`    | `useModuleSettings.test.tsx`    | Get, Update, Reset                |
| `useAnalytics`         | `useAnalytics.test.tsx`         | Date range, Metrics               |
| `useEmailTemplates`    | `useEmailTemplates.test.tsx`    | CRUD, Preview                     |
| `useApiKeys`           | `useApiKeys.test.tsx`           | Create, Revoke, Copy              |
| `useMessengers`        | `useMessengers.test.tsx`        | CRUD, Test send                   |
| `usePdfSettings`       | `usePdfSettings.test.tsx`       | Engine, Colors                    |
| `useMapSettings`       | `useMapSettings.test.tsx`       | Provider, API Key                 |
| `usePrivacySettings`   | `usePrivacySettings.test.tsx`   | GDPR config                       |
| `useTrackingSettings`  | `useTrackingSettings.test.tsx`  | GA4, GTM                          |
| `useRecaptchaSettings` | `useRecaptchaSettings.test.tsx` | Keys, Threshold                   |
| `usePropstack`         | `usePropstack.test.tsx`         | Connection, Sync                  |
| `useFeatures`          | `useFeatures.test.tsx`          | Feature flags                     |
| `useGeocoding`         | `useGeocoding.test.tsx`         | Search, Results                   |
| `useLeadEmails`        | `useLeadEmails.test.tsx`        | Email log                         |
| `useTeam`              | `useTeam.test.tsx`              | Agents, Assignments               |
| `useModulePdfSettings` | `useModulePdfSettings.test.tsx` | Per-module PDF                    |

**Template für Hook-Tests:**

```typescript
// tests/js/unit/hooks/useLeads.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '@/admin/hooks/useLeads';

// Mock fetch
global.fetch = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useLeads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetcht Leads erfolgreich', async () => {
    const mockLeads = [
      { id: 1, email: 'test@example.com', status: 'new' },
    ];

    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockLeads, total: 1 }),
    });

    const { result } = renderHook(() => useLeads(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toEqual(mockLeads);
  });

  it('filtert nach Status', async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [], total: 0 }),
    });

    renderHook(() => useLeads({ status: 'contacted' }), { wrapper });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=contacted'),
        expect.any(Object)
      );
    });
  });

  it('handled Fehler', async () => {
    (global.fetch as vi.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLeads(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});
```

---

## Phase 3: Admin Pages (Woche 3)

### 3.1 Page-Level Integration Tests (7 Dateien)

**Priorität: MITTEL** — User-Flows testen

| Page             | Testdatei                 | Testfälle                      |
| ---------------- | ------------------------- | ------------------------------ |
| `Dashboard`      | `Dashboard.test.tsx`      | Stats laden, Navigation        |
| `Leads`          | `Leads.test.tsx`          | Filter, Select, Delete, Detail |
| `Locations`      | `Locations.test.tsx`      | CRUD, Map, Editor              |
| `ModuleStore`    | `ModuleStore.test.tsx`    | List, Activate, Premium        |
| `ModuleSettings` | `ModuleSettings.test.tsx` | Tabs, Save, Reset              |
| `Settings`       | `Settings.test.tsx`       | All tabs, Save                 |
| `Integrations`   | `Integrations.test.tsx`   | All tabs, Test buttons         |

**Template für Page-Tests:**

```typescript
// tests/js/integration/pages/Dashboard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '@/admin/pages/Dashboard';

// Mocks
vi.mock('@/admin/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    data: { leads_total: 42, leads_today: 5 },
    isLoading: false,
  }),
}));

vi.mock('@/admin/hooks/useLeads', () => ({
  useLeads: () => ({
    data: { data: [], total: 0 },
    isLoading: false,
  }),
}));

const renderWithProviders = (component: React.ReactNode) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard', () => {
  it('zeigt KPI-Cards an', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });

  it('zeigt Leads-Tabelle an', async () => {
    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  it('navigiert zu Lead-Details', async () => {
    // Test mit userEvent
  });
});
```

---

## Phase 4: Admin Components (Woche 4)

### 4.1 Kritische Komponenten (15 Dateien)

| Component             | Testdatei                      | Testfälle              |
| --------------------- | ------------------------------ | ---------------------- |
| `AdminPageLayout`     | `AdminPageLayout.test.tsx`     | Variants, Breadcrumbs  |
| `ConfirmDeleteDialog` | `ConfirmDeleteDialog.test.tsx` | Open, Confirm, Cancel  |
| `LoadingState`        | `LoadingState.test.tsx`        | Render, Compact        |
| `LocationEditor`      | `LocationEditor.test.tsx`      | Form, Validation, Save |
| `FactorEditor`        | `FactorEditor.test.tsx`        | Fields, Validation     |
| `Toaster`             | `Toaster.test.tsx`             | Show, Dismiss          |
| `TemplateEditor`      | `TemplateEditor.test.tsx`      | Variables, Preview     |
| `TrackingTab`         | `TrackingTab.test.tsx`         | Form, Save             |
| `WebhooksTab`         | `WebhooksTab.test.tsx`         | CRUD, Test             |
| `ApiKeysTab`          | `ApiKeysTab.test.tsx`          | Create, Copy, Revoke   |
| `MessengerTab`        | `MessengerTab.test.tsx`        | CRUD, Test             |
| `SetupTab`            | `SetupTab.test.tsx`            | Mode switch, Factors   |
| `PdfTab`              | `PdfTab.test.tsx`              | Engine, Preview        |
| `LocationValuesTab`   | `LocationValuesTab.test.tsx`   | Taxes, Save            |
| `LeadEmailLogSection` | `LeadEmailLogSection.test.tsx` | Log display            |

---

## Phase 5: PHP Integration Tests (Woche 5)

### 5.1 wp-env Integration Tests (10 Dateien)

| Test              | Testdatei                     | Testfälle                    |
| ----------------- | ----------------------------- | ---------------------------- |
| Lead CRUD         | `LeadIntegrationTest.php`     | Create, Read, Update, Delete |
| Location CRUD     | `LocationIntegrationTest.php` | With geocoding               |
| Email Send        | `EmailIntegrationTest.php`    | Real SMTP mock               |
| PDF Generate      | `PdfIntegrationTest.php`      | DOMPDF engine                |
| Webhook Dispatch  | `WebhookIntegrationTest.php`  | HTTP calls                   |
| Module Activation | `ModuleIntegrationTest.php`   | Enable/Disable               |
| Agent Assignment  | `AgentAssignmentTest.php`     | Round-robin                  |
| Tracking          | `TrackingIntegrationTest.php` | Events, Aggregation          |
| Search            | `SearchIntegrationTest.php`   | Lead search                  |
| Export            | `ExportIntegrationTest.php`   | CSV, GDPR                    |

---

## Phase 6: E2E Tests (Woche 6)

### 6.1 Playwright Tests (8 Dateien)

| Flow                | Testdatei                 | Testfälle            |
| ------------------- | ------------------------- | -------------------- |
| Lead Capture        | `lead-flow.spec.ts`       | Full wizard, Submit  |
| Admin Login         | `admin-auth.spec.ts`      | Login, Logout        |
| Lead Management     | `admin-leads.spec.ts`     | Filter, View, Delete |
| Location Management | `admin-locations.spec.ts` | CRUD, Map            |
| Module Store        | `admin-modules.spec.ts`   | Browse, Activate     |
| Settings            | `admin-settings.spec.ts`  | Save, Tabs           |
| PDF Download        | `pdf-download.spec.ts`    | Generate, Download   |
| Mobile Widget       | `mobile.spec.ts`          | Responsive, Touch    |

---

## Teststruktur

```
tests/
├── php/
│   ├── Unit/
│   │   ├── Api/                    # 20 Controller Tests
│   │   │   ├── LeadsControllerTest.php ✓
│   │   │   ├── LocationsControllerTest.php ← NEU
│   │   │   └── ...
│   │   ├── Core/                   # 9 Core Tests
│   │   ├── Models/                 # 8 Model Tests
│   │   ├── Services/               # 18 Service Tests
│   │   ├── Security/               # 5 Security Tests
│   │   └── Freemius/               # 2 Freemius Tests
│   └── Integration/                # 10 Integration Tests ← NEU
│       ├── LeadIntegrationTest.php
│       └── ...
├── js/
│   ├── unit/
│   │   ├── schemas/                # 16 Schema Tests ← NEU
│   │   │   ├── gdpr.test.ts
│   │   │   ├── webhook.test.ts
│   │   │   └── ...
│   │   ├── hooks/                  # 22 Hook Tests
│   │   │   ├── useLeads.test.tsx ← NEU
│   │   │   ├── useAgentData.test.tsx ✓
│   │   │   └── ...
│   │   ├── components/             # 28 Component Tests
│   │   │   ├── ConfirmDeleteDialog.test.tsx ← NEU
│   │   │   └── ...
│   │   └── lib/                    # 4 Lib Tests ✓
│   └── integration/
│       ├── pages/                  # 9 Page Tests ← NEU
│       │   ├── Dashboard.test.tsx
│       │   └── ...
│       └── frontend/               # 4 Frontend Tests ✓
└── e2e/                            # 8 E2E Tests ← NEU
    ├── lead-flow.spec.ts
    └── ...
```

---

## Coverage-Ziele nach Phase

| Phase | Bereich          | IST → SOLL | Neue Tests |
| ----- | ---------------- | ---------- | ---------- |
| 1     | Zod Schemas      | 0% → 95%   | 16 Dateien |
| 1     | API Controller   | 65% → 100% | 7 Dateien  |
| 2     | Admin Hooks      | 14% → 90%  | 19 Dateien |
| 3     | Admin Pages      | 22% → 85%  | 7 Dateien  |
| 4     | Admin Components | 7% → 70%   | 15 Dateien |
| 5     | PHP Integration  | 0% → 80%   | 10 Dateien |
| 6     | E2E              | 0% → 100%  | 8 Dateien  |

**Gesamt: ~82 neue Testdateien**

---

## CI/CD Pipeline Update

```yaml
# .github/workflows/test.yml
name: RESA Tests

on:
    push:
        branches: [main, develop, feature/*]
    pull_request:
        branches: [main]

jobs:
    static-analysis:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: shivammathur/setup-php@v2
              with: { php-version: '8.1', tools: 'phpstan, phpcs' }
            - uses: actions/setup-node@v4
              with: { node-version: '20', cache: 'npm' }
            - run: composer install && npm ci
            - run: npx tsc --noEmit
            - run: npm run lint
            - run: vendor/bin/phpstan analyse
            - run: vendor/bin/phpcs

    unit-tests:
        runs-on: ubuntu-latest
        needs: static-analysis
        strategy:
            matrix:
                php: ['8.1', '8.2', '8.3']
        steps:
            - uses: actions/checkout@v4
            - uses: shivammathur/setup-php@v2
              with: { php-version: '${{ matrix.php }}', coverage: 'xdebug' }
            - uses: actions/setup-node@v4
              with: { node-version: '20', cache: 'npm' }
            - run: composer install && npm ci
            - run: vendor/bin/phpunit --configuration phpunit.xml --coverage-clover coverage-php.xml
            - run: npx vitest run --coverage
            - uses: codecov/codecov-action@v4
              with:
                  files: coverage-php.xml,coverage/lcov.info

    integration-tests:
        runs-on: ubuntu-latest
        needs: unit-tests
        steps:
            - uses: actions/checkout@v4
            - uses: shivammathur/setup-php@v2
              with: { php-version: '8.1' }
            - uses: actions/setup-node@v4
              with: { node-version: '20', cache: 'npm' }
            - run: composer install && npm ci && npm run build
            - run: npx wp-env start
            - run: npx wp-env run tests-cli vendor/bin/phpunit --configuration phpunit.integration.xml

    e2e-tests:
        runs-on: ubuntu-latest
        needs: integration-tests
        if: github.ref == 'refs/heads/main'
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: '20', cache: 'npm' }
            - run: npm ci && npm run build && npx wp-env start
            - run: npx playwright install --with-deps
            - run: npx playwright test
            - uses: actions/upload-artifact@v4
              if: failure()
              with: { name: 'playwright-report', path: 'playwright-report/' }
```

---

## NPM Scripts Update

```json
{
	"scripts": {
		"test": "npm run test:js && npm run test:php",
		"test:js": "vitest run",
		"test:js:watch": "vitest",
		"test:js:coverage": "vitest run --coverage",
		"test:js:schemas": "vitest run tests/js/unit/schemas/",
		"test:js:hooks": "vitest run tests/js/unit/hooks/",
		"test:js:components": "vitest run tests/js/unit/components/",
		"test:js:pages": "vitest run tests/js/integration/pages/",
		"test:php": "vendor/bin/phpunit",
		"test:php:unit": "vendor/bin/phpunit --testsuite Unit",
		"test:php:integration": "wp-env run tests-cli vendor/bin/phpunit --testsuite Integration",
		"test:e2e": "playwright test",
		"test:e2e:ui": "playwright test --ui",
		"test:all": "npm run test && npm run test:php:integration && npm run test:e2e"
	}
}
```

---

## Metriken & Reporting

### Coverage Badges

```markdown
![PHP Coverage](https://img.shields.io/codecov/c/github/user/resa-wp?flag=php&label=PHP)
![JS Coverage](https://img.shields.io/codecov/c/github/user/resa-wp?flag=js&label=JS)
```

### Coverage-Schwellwerte

```javascript
// vitest.config.ts
export default defineConfig({
	test: {
		coverage: {
			thresholds: {
				statements: 70,
				branches: 65,
				functions: 70,
				lines: 70,
			},
		},
	},
});
```

```xml
<!-- phpunit.xml -->
<coverage>
  <report>
    <clover outputFile="coverage.xml"/>
  </report>
  <include>
    <directory suffix=".php">includes/</directory>
  </include>
</coverage>
```

---

## Zeitplan

| Woche | Phase   | Fokus            | Tests |
| ----- | ------- | ---------------- | ----- |
| 1     | Phase 1 | Schemas + API    | 23    |
| 2     | Phase 2 | Admin Hooks      | 19    |
| 3     | Phase 3 | Admin Pages      | 7     |
| 4     | Phase 4 | Admin Components | 15    |
| 5     | Phase 5 | PHP Integration  | 10    |
| 6     | Phase 6 | E2E              | 8     |

**Gesamt: 6 Wochen, 82 neue Testdateien**

---

## Checkliste

- [x] Phase 1: 15 Zod Schema Tests ✅ (524 Tests, 2026-03-08)
- [x] Phase 1: 7 API Controller Tests ✅ (2026-03-08)
- [x] Phase 2: 18 Admin Hook Tests ✅ (309 Tests, 2026-03-08)
- [x] Phase 3: 7 Admin Page Tests ✅ (117 Tests, 2026-03-09)
- [x] Phase 4: 17 Admin Component Tests ✅ (132 Tests, 2026-03-09)
- [x] Phase 5: 10 PHP Integration Tests ✅ (110 Tests, 2026-03-09)
- [x] Phase 6: 8 Playwright E2E Tests ✅ (36 Tests, 2026-03-09)
- [x] CI/CD Pipeline Update ✅ (2026-03-09)
- [ ] Coverage Badges einrichten
- [ ] Documentation Update

---

## Fortschritt

### Phase 1 abgeschlossen (2026-03-08)

**Zod Schema Tests (15 Dateien, 524 Tests):**

- `gdpr.test.ts` (28 Tests) ✅
- `tracking.test.ts` (59 Tests) ✅
- `webhook.test.ts` (39 Tests) ✅
- `apiKey.test.ts` (27 Tests) ✅
- `messenger.test.ts` (38 Tests) ✅
- `propstack.test.ts` (25 Tests) ✅
- `recaptcha.test.ts` (27 Tests) ✅
- `factor.test.ts` (41 Tests) ✅
- `moduleSetup.test.ts` (32 Tests) ✅
- `locationValues.test.ts` (31 Tests) ✅
- `pdfSettings.test.ts` (19 Tests) ✅
- `location.test.ts` (39 Tests) ✅
- `emailTemplate.test.ts` (32 Tests) ✅
- `pdfTemplate.test.ts` (33 Tests) ✅
- `generalSettings.test.ts` (54 Tests) ✅

**PHP API Controller Tests (7 Dateien):**

- `EmailTemplatesControllerTest.php` ✅
- `LocationsControllerTest.php` ✅
- `ModulesControllerTest.php` ✅
- `ModuleSettingsControllerTest.php` ✅
- `PdfSettingsControllerTest.php` ✅
- `GeocodingControllerTest.php` ✅
- `MapSettingsControllerTest.php` ✅

**Stand:** 775 JS Tests bestanden

### Phase 2 abgeschlossen (2026-03-08)

**Admin Hook Tests (18 Dateien, 309 Tests):**

- `useLeads.test.tsx` (20 Tests) ✅
- `useLocations.test.tsx` (21 Tests) ✅
- `useModules.test.tsx` (15 Tests) ✅
- `useModuleSettings.test.tsx` (19 Tests) ✅
- `useAnalytics.test.tsx` (14 Tests) ✅
- `useEmailTemplates.test.tsx` (17 Tests) ✅
- `useApiKeys.test.tsx` (18 Tests) ✅
- `useMessengers.test.tsx` ✅
- `usePdfSettings.test.tsx` (14 Tests) ✅
- `useModulePdfSettings.test.tsx` (19 Tests) ✅
- `useMapSettings.test.tsx` ✅
- `useGeocoding.test.tsx` (21 Tests) ✅
- `usePrivacySettings.test.tsx` (9 Tests) ✅
- `useRecaptchaSettings.test.tsx` (12 Tests) ✅
- `useTrackingSettings.test.tsx` (14 Tests) ✅
- `useLeadEmails.test.tsx` (10 Tests) ✅
- `useTeam.test.tsx` (21 Tests) ✅
- `useFeatures.test.tsx` ✅

**Stand:** 1084 JS Tests bestanden

### Phase 3 abgeschlossen (2026-03-09)

**Admin Page Integration Tests (7 Dateien, 117 Tests):**

- `Dashboard.test.tsx` (22 Tests) ✅
- `Leads.test.tsx` (13 Tests) ✅
- `Locations.test.tsx` (18 Tests) ✅
- `ModuleStore.test.tsx` (18 Tests) ✅
- `ModuleSettings.test.tsx` (15 Tests) ✅
- `Settings.test.tsx` (13 Tests) ✅
- `Integrations.test.tsx` (18 Tests) ✅

**Stand:** 1201 JS Tests bestanden

### Phase 4 abgeschlossen (2026-03-09)

**Admin Component Tests (17 Dateien, 132 Tests):**

- `AdminPageLayout.test.tsx` (16 Tests) ✅
- `ConfirmDeleteDialog.test.tsx` (8 Tests) ✅
- `LoadingState.test.tsx` (5 Tests) ✅
- `Toaster.test.tsx` (3 Tests) ✅
- `LocationEditor.test.tsx` (13 Tests) ✅
- `FactorEditor.test.tsx` (8 Tests) ✅
- `TemplateEditor.test.tsx` (6 Tests) ✅
- `TrackingTab.test.tsx` (7 Tests) ✅
- `GdprTab.test.tsx` (9 Tests) ✅
- `RecaptchaTab.test.tsx` (7 Tests) ✅
- `WebhooksTab.test.tsx` (8 Tests) ✅
- `ApiKeysTab.test.tsx` (8 Tests) ✅
- `MessengerTab.test.tsx` (7 Tests) ✅
- `SetupTab.test.tsx` (6 Tests) ✅
- `PdfTab.test.tsx` (7 Tests) ✅
- `LocationValuesTab.test.tsx` (8 Tests) ✅
- `LeadEmailLogSection.test.tsx` (6 Tests) ✅

**Stand:** 1317 JS Tests in 85 Dateien bestanden

### Phase 5 abgeschlossen (2026-03-09)

**PHP Integration Tests (10 Dateien, 110 Tests):**

- `LeadIntegrationTest.php` (16 Tests) ✅
- `LocationIntegrationTest.php` (15 Tests) ✅
- `EmailIntegrationTest.php` (11 Tests) ✅
- `PdfIntegrationTest.php` (7 Tests) ✅
- `WebhookIntegrationTest.php` (8 Tests) ✅
- `ModuleIntegrationTest.php` (11 Tests) ✅
- `AgentAssignmentTest.php` (12 Tests) ✅
- `TrackingIntegrationTest.php` (14 Tests) ✅
- `SearchIntegrationTest.php` (11 Tests) ✅
- `ExportIntegrationTest.php` (9 Tests) ✅

**Stand:** 110 PHP Integration Tests bestanden (335 Assertions)

### Phase 6 abgeschlossen (2026-03-09)

**Playwright E2E Tests (8 Dateien, 36 Tests):**

- `admin-auth.spec.ts` (5 Tests) ✅
- `lead-flow.spec.ts` (5 Tests) ✅
- `admin-leads.spec.ts` (6 Tests) ✅
- `admin-locations.spec.ts` (5 Tests) ✅
- `admin-modules.spec.ts` (4 Tests) ✅
- `admin-settings.spec.ts` (4 Tests) ✅
- `pdf-download.spec.ts` (2 Tests) ✅
- `mobile.spec.ts` (4 Tests) ✅

**Infrastruktur:**

- `playwright.config.ts` — Chromium + Auth-Setup-Projekt
- `auth.setup.ts` — WP-Login → storageState
- `global-setup.ts` / `global-teardown.ts` — Test-Seite mit [resa] Shortcode
- `helpers/` — wp-cli.ts, api-client.ts, selectors.ts
- `fixtures/base.ts` — Custom Test-Fixtures

**Stand:** 36 E2E Tests bestanden gegen Docker-WordPress-Instanz
