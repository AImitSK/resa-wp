# ISM — Teststrategie

## Qualitätssicherung, Testpyramide & CI/CD

---

## 1. Warum eine Teststrategie?

ISM ist ein Plugin das **direkt auf den Websites von Maklern läuft** — bei deren Kunden, in deren Lead-Pipeline. Ein Bug in der Berechnung, ein kaputtes Lead-Formular oder eine fehlgeschlagene E-Mail ist nicht nur ärgerlich, sondern **kostet den Makler reales Geld** (verlorene Leads, falsches Ergebnis, beschädigtes Vertrauen).

Dazu kommt:
- ISM läuft auf **tausenden verschiedenen WordPress-Installationen** mit unterschiedlichen Themes, PHP-Versionen und Plugin-Kombinationen
- Berechnungen müssen **mathematisch korrekt** sein (Mietpreis, Immobilienwert, Nebenkosten)
- **DSGVO-Einwilligung** muss zuverlässig erfasst und gespeichert werden
- **PDF-Generierung** und **E-Mail-Versand** müssen zuverlässig funktionieren
- Freemius **Feature-Gating** muss exakt greifen (Free vs. Premium vs. Add-on)

Ohne Tests geht das schief — garantiert.

---

## 2. Testpyramide

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲               ~5%    Cypress / Playwright
                 ╱──────╲             Wenige, langsam, teuer
                ╱        ╲            Aber: fangen echte User-Probleme
               ╱Integration╲          ~25%   PHPUnit (wp-env) +
              ╱──────────────╲               React Testing Library
             ╱                ╲        API ↔ DB, Komponenten + API
            ╱    Unit Tests    ╲       ~70%   PHPUnit (Brain Monkey) +
           ╱────────────────────╲            Vitest
          ╱                      ╲     Schnell, isoliert, viele
         ╱  Statische Analyse     ╲    Immer    PHPStan, ESLint, TS
        ╱──────────────────────────╲         Kein Runtime nötig
       ╱────────────────────────────╲
```

### Verteilung der Testarten

```
Testart              Anteil    Laufzeit     Werkzeug                 Läuft wo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Statische Analyse     —        < 30s        PHPStan, TS, ESLint      Lokal + CI
PHP Unit Tests        ~35%     < 15s        PHPUnit + Brain Monkey   Lokal + CI
JS Unit Tests         ~35%     < 10s        Vitest                   Lokal + CI
PHP Integration       ~15%     < 60s        PHPUnit + wp-env         CI (Docker)
JS Integration        ~10%     < 30s        Vitest + Testing Library Lokal + CI
E2E Tests             ~5%      < 5min       Playwright               CI only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gesamt                         < 7min       Alles zusammen in CI
```

---

## 3. Schicht 0: Statische Analyse (Zero Runtime)

Fängt Fehler ab **bevor ein einziger Test läuft**. Kostet nichts, läuft in Sekunden.

### 3.1 TypeScript Compiler (Strict Mode)

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,              // Alle strikten Checks an
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Was es fängt:** Typ-Fehler, fehlende null-Checks, falsche API-Response-Typen, vergessene Cases in Switch-Statements. Ca. 30-40% aller Bugs werden hier schon eliminiert.

### 3.2 ESLint (JavaScript/TypeScript)

```javascript
// eslint.config.js
export default [
  {
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
    },
  },
];
```

### 3.3 PHPStan (PHP Static Analysis)

```yaml
# phpstan.neon
parameters:
    level: 6                     # Streng, aber praxistauglich
    paths:
        - includes/
    bootstrapFiles:
        - vendor/autoload.php
    scanDirectories:
        - vendor/php-stubs/wordpress-stubs/
```

**Was es fängt:** Falsche Typen bei `$wpdb`-Queries, fehlende Return-Types, undefined Methods, `get_option()` ohne Default-Value.

### 3.4 PHP CodeSniffer (WordPress Coding Standards)

```xml
<!-- phpcs.xml -->
<ruleset name="ISM">
    <rule ref="WordPress"/>
    <rule ref="WordPress-Extra"/>
    <config name="text_domain" value="ism"/>
    <config name="minimum_wp_version" value="6.0"/>
    <exclude-pattern>vendor/</exclude-pattern>
    <exclude-pattern>node_modules/</exclude-pattern>
    <exclude-pattern>dist/</exclude-pattern>
</ruleset>
```

**Was es fängt:** Fehlende Text Domains, fehlende Escaping-Funktionen (`esc_html__` statt `__`), fehlende Nonce-Validierung, SQL-Injection-Risiken.

---

## 4. Schicht 1: Unit Tests (Isoliert, schnell)

### 4.1 PHP Unit Tests — Berechnungs-Engine

Die **kritischste** Testschicht: Die Kalkulatoren müssen mathematisch korrekt rechnen. Ein falscher Mietpreis ist ein Reputationsschaden für den Makler.

**Framework:** PHPUnit 10 + Brain Monkey (WordPress-Funktionen mocken, kein WordPress laden)

```php
// tests/php/Unit/Calculator/RentCalculatorTest.php

use PHPUnit\Framework\TestCase;
use Brain\Monkey;
use ISM\Services\Calculator\RentCalculator;

class RentCalculatorTest extends TestCase {

    private RentCalculator $calculator;

    protected function setUp(): void {
        parent::setUp();
        Monkey\setUp();
        $this->calculator = new RentCalculator();
    }

    protected function tearDown(): void {
        Monkey\tearDown();
        parent::tearDown();
    }

    /**
     * Kernberechnung: Mietpreis aus Basisdaten
     */
    public function test_calculates_base_rent_for_standard_apartment(): void {
        $inputs = [
            'property_type' => 'apartment',
            'area_sqm'      => 75,
            'condition'      => 'normal',
            'year_built'     => 1990,
            'floor'          => 2,
            'has_balcony'    => true,
            'has_elevator'   => false,
        ];

        $location_data = [
            'base_rent_min' => 7.50,   // €/m²
            'base_rent_max' => 9.80,   // €/m²
            'median_rent'   => 8.40,
        ];

        $result = $this->calculator->calculate( $inputs, $location_data );

        $this->assertArrayHasKey( 'rent_min', $result );
        $this->assertArrayHasKey( 'rent_max', $result );
        $this->assertArrayHasKey( 'rent_median', $result );

        // Plausibilitäts-Check: 75m² × 7-10 €/m² = 525-750 €
        $this->assertGreaterThan( 500, $result['rent_min'] );
        $this->assertLessThan( 800, $result['rent_max'] );
    }

    /**
     * Faktor-Test: Balkon erhöht Mietpreis
     */
    public function test_balcony_increases_rent(): void {
        $base_inputs = [
            'property_type' => 'apartment',
            'area_sqm'      => 75,
            'condition'      => 'normal',
            'year_built'     => 1990,
        ];

        $location_data = [
            'base_rent_min' => 8.00,
            'base_rent_max' => 10.00,
            'median_rent'   => 9.00,
        ];

        $without_balcony = $this->calculator->calculate(
            array_merge( $base_inputs, ['has_balcony' => false] ),
            $location_data
        );

        $with_balcony = $this->calculator->calculate(
            array_merge( $base_inputs, ['has_balcony' => true] ),
            $location_data
        );

        $this->assertGreaterThan(
            $without_balcony['rent_median'],
            $with_balcony['rent_median'],
            'Balkon muss den Mietpreis erhöhen'
        );
    }

    /**
     * Edge Case: 0 m² Fläche
     */
    public function test_throws_for_zero_area(): void {
        $this->expectException( \InvalidArgumentException::class );
        $this->calculator->calculate(
            ['property_type' => 'apartment', 'area_sqm' => 0],
            ['base_rent_min' => 8.00, 'base_rent_max' => 10.00]
        );
    }

    /**
     * Edge Case: Negative Fläche
     */
    public function test_throws_for_negative_area(): void {
        $this->expectException( \InvalidArgumentException::class );
        $this->calculator->calculate(
            ['property_type' => 'apartment', 'area_sqm' => -50],
            ['base_rent_min' => 8.00, 'base_rent_max' => 10.00]
        );
    }

    /**
     * Grenzwert: Sehr große Wohnung
     */
    public function test_handles_large_apartment(): void {
        $result = $this->calculator->calculate(
            ['property_type' => 'apartment', 'area_sqm' => 500, 'condition' => 'luxury'],
            ['base_rent_min' => 12.00, 'base_rent_max' => 18.00, 'median_rent' => 15.00]
        );

        $this->assertGreaterThan( 0, $result['rent_min'] );
        $this->assertIsFloat( $result['rent_min'] );
    }

    /**
     * Zahlenformat: Ergebnis auf 2 Dezimalstellen
     */
    public function test_result_is_rounded_to_two_decimals(): void {
        $result = $this->calculator->calculate(
            ['property_type' => 'apartment', 'area_sqm' => 73, 'condition' => 'normal'],
            ['base_rent_min' => 8.33, 'base_rent_max' => 10.77, 'median_rent' => 9.55]
        );

        // Prüfe: max 2 Dezimalstellen
        $this->assertEquals(
            round( $result['rent_median'], 2 ),
            $result['rent_median']
        );
    }
}
```

### 4.2 PHP Unit Tests — Feature Gate (Freemius)

```php
// tests/php/Unit/Freemius/FeatureGateTest.php

class FeatureGateTest extends TestCase {

    protected function setUp(): void {
        parent::setUp();
        Monkey\setUp();
    }

    public function test_free_plan_allows_only_mietpreis_asset(): void {
        // Mock: Freemius meldet Free-Plan
        Functions\when( 'ism_fs' )->justReturn(
            Mockery::mock()->shouldReceive( 'is_plan' )
                ->with( 'premium' )->andReturn( false )->getMock()
        );

        $gate = new \ISM\Freemius\FeatureGate();

        $this->assertTrue( $gate->can_activate_asset( 'mietpreis' ) );
        $this->assertFalse( $gate->can_activate_asset( 'immobilienwert' ) );
        $this->assertFalse( $gate->can_activate_asset( 'kaufnebenkosten' ) );
    }

    public function test_premium_plan_allows_all_assets(): void {
        Functions\when( 'ism_fs' )->justReturn(
            Mockery::mock()->shouldReceive( 'is_plan' )
                ->with( 'premium' )->andReturn( true )->getMock()
        );

        $gate = new \ISM\Freemius\FeatureGate();

        $this->assertTrue( $gate->can_activate_asset( 'mietpreis' ) );
        $this->assertTrue( $gate->can_activate_asset( 'immobilienwert' ) );
        $this->assertTrue( $gate->can_activate_asset( 'kaufnebenkosten' ) );
    }

    public function test_free_plan_limits_locations_to_one(): void {
        Functions\when( 'ism_fs' )->justReturn(
            Mockery::mock()->shouldReceive( 'is_plan' )
                ->with( 'premium' )->andReturn( false )->getMock()
        );

        $gate = new \ISM\Freemius\FeatureGate();

        $this->assertTrue( $gate->can_add_location( 0 ) );   // Erste: OK
        $this->assertFalse( $gate->can_add_location( 1 ) );  // Zweite: Nein
    }
}
```

### 4.3 JS Unit Tests — Berechnungs-Logik

```typescript
// tests/js/unit/calculator/rentCalculation.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRentRange } from '@/frontend/assets/rent-calculator/hooks/useRentCalculation';

describe('calculateRentRange', () => {
  const baseLocation = {
    baseRentMin: 8.0,
    baseRentMax: 10.0,
    medianRent: 9.0,
  };

  it('berechnet Grundmiete korrekt für Standardwohnung', () => {
    const result = calculateRentRange(
      { areaSqm: 75, condition: 'normal', hasBalcony: false },
      baseLocation
    );

    expect(result.rentMin).toBeGreaterThan(0);
    expect(result.rentMax).toBeGreaterThan(result.rentMin);
    expect(result.rentMedian).toBeCloseTo(75 * 9.0, 0);
  });

  it('Ergebnis skaliert linear mit Fläche', () => {
    const small = calculateRentRange(
      { areaSqm: 50, condition: 'normal' },
      baseLocation
    );
    const large = calculateRentRange(
      { areaSqm: 100, condition: 'normal' },
      baseLocation
    );

    expect(large.rentMedian / small.rentMedian).toBeCloseTo(2, 1);
  });

  it('wirft Fehler bei ungültiger Fläche', () => {
    expect(() =>
      calculateRentRange({ areaSqm: 0 }, baseLocation)
    ).toThrow();

    expect(() =>
      calculateRentRange({ areaSqm: -10 }, baseLocation)
    ).toThrow();
  });
});
```

### 4.4 JS Unit Tests — Zod-Validierung

```typescript
// tests/js/unit/validation/leadSchema.test.ts
import { describe, it, expect } from 'vitest';
import { leadFormSchema } from '@/frontend/lib/validation';

describe('leadFormSchema', () => {
  it('akzeptiert gültige Lead-Daten', () => {
    const result = leadFormSchema.safeParse({
      firstName: 'Maria',
      lastName: 'Schmidt',
      email: 'maria@example.com',
      consent: true,
    });
    expect(result.success).toBe(true);
  });

  it('lehnt fehlende E-Mail ab', () => {
    const result = leadFormSchema.safeParse({
      firstName: 'Maria',
      email: '',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('lehnt ungültige E-Mail ab', () => {
    const result = leadFormSchema.safeParse({
      firstName: 'Maria',
      email: 'nicht-eine-email',
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it('lehnt fehlende DSGVO-Einwilligung ab', () => {
    const result = leadFormSchema.safeParse({
      firstName: 'Maria',
      email: 'maria@example.com',
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it('akzeptiert optionale Telefonnummer', () => {
    const result = leadFormSchema.safeParse({
      firstName: 'Maria',
      email: 'maria@example.com',
      phone: '+49 123 456789',
      consent: true,
    });
    expect(result.success).toBe(true);
  });
});
```

### 4.5 JS Unit Tests — Zahlenformatierung

```typescript
// tests/js/unit/lib/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatArea } from '@/frontend/lib/format';

describe('formatCurrency', () => {
  it('formatiert EUR deutsch korrekt', () => {
    expect(formatCurrency(1234.56, 'EUR', 'de-DE')).toBe('1.234,56 €');
  });

  it('formatiert CHF schweizerdeutsch korrekt', () => {
    expect(formatCurrency(1234.56, 'CHF', 'de-CH')).toMatch(/1.234,56/);
  });

  it('formatiert GBP englisch korrekt', () => {
    expect(formatCurrency(1234.56, 'GBP', 'en-GB')).toBe('£1,234.56');
  });

  it('rundet auf 2 Dezimalstellen', () => {
    expect(formatCurrency(1234.567, 'EUR', 'de-DE')).toBe('1.234,57 €');
  });

  it('behandelt 0 korrekt', () => {
    expect(formatCurrency(0, 'EUR', 'de-DE')).toBe('0,00 €');
  });
});

describe('formatArea', () => {
  it('formatiert m² für DE', () => {
    expect(formatArea(75, 'sqm', 'de-DE')).toBe('75 m²');
  });

  it('formatiert sq ft für UK', () => {
    expect(formatArea(807, 'sqft', 'en-GB')).toBe('807 sq ft');
  });
});
```

---

## 5. Schicht 2: Integrationstests

### 5.1 PHP Integration — REST API + Datenbank

Brauchen eine echte WordPress-Instanz. Laufen in Docker via **wp-env**.

```json
// .wp-env.json
{
  "core": null,
  "phpVersion": "8.1",
  "plugins": ["."],
  "env": {
    "tests": {
      "port": 8889
    }
  }
}
```

```php
// tests/php/Integration/Api/LeadsControllerTest.php

class LeadsControllerTest extends WP_UnitTestCase {

    public function setUp(): void {
        parent::setUp();
        // Admin-User für API-Calls erstellen
        $this->admin_id = $this->factory->user->create(['role' => 'administrator']);
    }

    /**
     * POST /ism/v1/leads — Lead erfassen
     */
    public function test_create_lead_via_api(): void {
        $request = new WP_REST_Request('POST', '/ism/v1/leads');
        $request->set_body_params([
            'first_name'  => 'Maria',
            'last_name'   => 'Schmidt',
            'email'       => 'maria@example.com',
            'consent'     => true,
            'asset_type'  => 'mietpreis',
            'location_id' => 1,
            'inputs'      => ['area_sqm' => 75, 'condition' => 'normal'],
        ]);

        // Nonce setzen
        $request->set_header('X-WP-Nonce', wp_create_nonce('wp_rest'));

        $response = rest_do_request($request);

        $this->assertEquals(201, $response->get_status());

        $data = $response->get_data();
        $this->assertEquals('maria@example.com', $data['email']);
        $this->assertEquals('mietpreis', $data['asset_type']);
        $this->assertArrayHasKey('result', $data);
    }

    /**
     * Lead ohne DSGVO-Einwilligung → 400
     */
    public function test_create_lead_without_consent_fails(): void {
        $request = new WP_REST_Request('POST', '/ism/v1/leads');
        $request->set_body_params([
            'first_name' => 'Maria',
            'email'      => 'maria@example.com',
            'consent'    => false,           // ← Fehlend!
            'asset_type' => 'mietpreis',
        ]);

        $response = rest_do_request($request);
        $this->assertEquals(400, $response->get_status());
    }

    /**
     * GET /ism/v1/leads — Nur für Admins
     */
    public function test_list_leads_requires_admin(): void {
        // Ohne Login
        $request  = new WP_REST_Request('GET', '/ism/v1/leads');
        $response = rest_do_request($request);
        $this->assertEquals(401, $response->get_status());

        // Mit Admin-Login
        wp_set_current_user($this->admin_id);
        $request  = new WP_REST_Request('GET', '/ism/v1/leads');
        $response = rest_do_request($request);
        $this->assertEquals(200, $response->get_status());
    }

    /**
     * Lead-Daten werden korrekt in DB gespeichert
     */
    public function test_lead_persists_in_database(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'ism_leads';

        // Lead über Service erstellen (nicht API)
        $lead_id = (new \ISM\Models\Lead())->create([
            'first_name'  => 'Max',
            'email'       => 'max@example.com',
            'consent'     => true,
            'asset_type'  => 'mietpreis',
            'location_id' => 1,
            'inputs'      => json_encode(['area_sqm' => 80]),
            'result'      => json_encode(['rent_median' => 640.00]),
        ]);

        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $lead_id)
        );

        $this->assertNotNull($row);
        $this->assertEquals('max@example.com', $row->email);
        $this->assertEquals('new', $row->status);
        $this->assertNotNull($row->created_at);
    }
}
```

### 5.2 PHP Integration — Makler-Zuordnung

```php
// tests/php/Integration/LeadDistribution/LeadRouterTest.php

class LeadRouterTest extends WP_UnitTestCase {

    public function test_assigns_lead_to_correct_agent_by_location(): void {
        // Setup: Agent für Bad Oeynhausen
        $agent_id    = $this->create_agent('Markus Brand');
        $location_id = $this->create_location('bad-oeynhausen');
        $this->assign_agent_to_location($agent_id, $location_id);

        $router = new \ISM\Services\LeadDistribution\LeadRouter();
        $assigned = $router->assign($location_id);

        $this->assertEquals($agent_id, $assigned);
    }

    public function test_fallback_when_no_agent_assigned(): void {
        $location_id = $this->create_location('unassigned-city');

        $router = new \ISM\Services\LeadDistribution\LeadRouter();
        $assigned = $router->assign($location_id);

        $this->assertNull($assigned); // Fallback: Default-E-Mail
    }

    public function test_round_robin_distributes_evenly(): void {
        $agent_a = $this->create_agent('Agent A');
        $agent_b = $this->create_agent('Agent B');
        $location_id = $this->create_location('shared-city');
        $this->assign_agent_to_location($agent_a, $location_id);
        $this->assign_agent_to_location($agent_b, $location_id);

        $router = new \ISM\Services\LeadDistribution\LeadRouter();
        $router->set_mode('round_robin');

        $results = [];
        for ($i = 0; $i < 10; $i++) {
            $results[] = $router->assign($location_id);
        }

        // Beide Agents sollten ~gleich oft zugewiesen werden
        $counts = array_count_values($results);
        $this->assertEquals(5, $counts[$agent_a]);
        $this->assertEquals(5, $counts[$agent_b]);
    }
}
```

### 5.3 JS Integration — React Komponenten

```typescript
// tests/js/integration/StepWizard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepWizard } from '@/frontend/assets/shared/StepWizard';

// Mock wp.i18n
vi.mock('@wordpress/i18n', () => ({
  __: (str: string) => str,
  _x: (str: string) => str,
  sprintf: (str: string, ...args: any[]) =>
    str.replace(/%[sd]/g, () => args.shift()),
}));

describe('StepWizard', () => {
  const steps = [
    { id: 'type', label: 'Property Type', component: () => <div>Step 1</div> },
    { id: 'area', label: 'Area', component: () => <div>Step 2</div> },
    { id: 'result', label: 'Result', component: () => <div>Step 3</div> },
  ];

  it('zeigt den ersten Schritt an', () => {
    render(<StepWizard steps={steps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('navigiert vorwärts und rückwärts', async () => {
    const user = userEvent.setup();
    render(<StepWizard steps={steps} />);

    // Vorwärts
    await user.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2')).toBeInTheDocument();

    // Rückwärts
    await user.click(screen.getByText('Back'));
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('zeigt Fortschrittsbalken korrekt an', () => {
    render(<StepWizard steps={steps} />);
    const progress = screen.getByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '1');
    expect(progress).toHaveAttribute('aria-valuemax', '3');
  });

  it('deaktiviert Zurück-Button im ersten Schritt', () => {
    render(<StepWizard steps={steps} />);
    expect(screen.getByText('Back')).toBeDisabled();
  });
});
```

### 5.4 JS Integration — Lead-Formular

```typescript
// tests/js/integration/LeadForm.test.tsx

describe('LeadForm', () => {
  it('sendet Lead bei gültiger Eingabe', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<LeadForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('First Name'), 'Maria');
    await user.type(screen.getByLabelText('Email'), 'maria@example.com');
    await user.click(screen.getByLabelText(/consent/i));
    await user.click(screen.getByText('Show my results'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Maria',
          email: 'maria@example.com',
          consent: true,
        })
      );
    });
  });

  it('zeigt Validierungsfehler bei fehlender E-Mail', async () => {
    const user = userEvent.setup();
    render(<LeadForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('First Name'), 'Maria');
    await user.click(screen.getByLabelText(/consent/i));
    await user.click(screen.getByText('Show my results'));

    expect(await screen.findByText(/email/i)).toBeInTheDocument();
  });

  it('blockiert Absenden ohne DSGVO-Einwilligung', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LeadForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('First Name'), 'Maria');
    await user.type(screen.getByLabelText('Email'), 'maria@example.com');
    // KEIN consent-Klick
    await user.click(screen.getByText('Show my results'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

---

## 6. Schicht 3: End-to-End Tests

### 6.1 Playwright Setup

E2E-Tests simulieren echte Benutzer im Browser. Langsam, aber fangen reale Probleme.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:8888',  // wp-env
    locale: 'de-DE',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
```

### 6.2 E2E: Kompletter Lead-Flow

```typescript
// tests/e2e/lead-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mietpreis-Kalkulator: Kompletter Lead-Flow', () => {

  test('Besucher durchläuft alle 4 Stufen', async ({ page }) => {
    // 1. Seite mit Widget öffnen
    await page.goto('/mietpreis-test/');

    // Widget sollte geladen sein
    const widget = page.locator('.ism-widget-root');
    await expect(widget).toBeVisible();

    // 2. STUFE 1: Fragen beantworten
    // Objekttyp wählen
    await page.click('text=Wohnung');
    await page.click('text=Weiter');

    // Fläche eingeben
    await page.fill('[name="area_sqm"]', '75');
    await page.click('text=Weiter');

    // Zustand wählen
    await page.click('text=Normal');
    await page.click('text=Weiter');

    // 3. STUFE 2: Lead-Formular
    await expect(page.locator('text=Ihre Ergebnisse')).toBeVisible();

    await page.fill('[name="firstName"]', 'E2E-Test');
    await page.fill('[name="email"]', 'e2e@test.example.com');
    await page.check('[name="consent"]');
    await page.click('text=Ergebnis anzeigen');

    // 4. STUFE 3: Web-Ergebnis sichtbar
    await expect(page.locator('[data-testid="result-card"]')).toBeVisible();
    await expect(page.locator('text=€')).toBeVisible();

    // Prüfe: Ergebnis ist eine positive Zahl
    const resultText = await page.locator('[data-testid="rent-median"]').textContent();
    const rentValue = parseFloat(resultText!.replace(/[^0-9,.]/g, '').replace(',', '.'));
    expect(rentValue).toBeGreaterThan(0);
  });

  test('Widget kollidiert nicht mit Theme-Styling', async ({ page }) => {
    await page.goto('/mietpreis-test/');

    const widget = page.locator('.ism-widget-root');

    // Widget hat eigene Schriftgröße (nicht vom Theme überschrieben)
    const fontSize = await widget.evaluate(el =>
      window.getComputedStyle(el).fontSize
    );
    expect(fontSize).toBe('16px');
  });
});
```

### 6.3 E2E: Admin — Lead erscheint im Dashboard

```typescript
// tests/e2e/admin-leads.spec.ts

test.describe('Admin: Lead-Verwaltung', () => {

  test.beforeEach(async ({ page }) => {
    // WP-Admin Login
    await page.goto('/wp-login.php');
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'password');
    await page.click('#wp-submit');
  });

  test('Neuer Lead erscheint in der Lead-Liste', async ({ page }) => {
    await page.goto('/wp-admin/admin.php?page=ism-leads');

    // Lead-Tabelle sollte sichtbar sein
    await expect(page.locator('table')).toBeVisible();

    // Der E2E-Test-Lead von oben sollte da sein
    await expect(page.locator('text=e2e@test.example.com')).toBeVisible();
  });
});
```

---

## 7. Spezial-Tests

### 7.1 DSGVO-Compliance-Tests

```php
// tests/php/Unit/Compliance/GdprTest.php

class GdprTest extends TestCase {

    /**
     * Ohne Consent KEIN Lead speichern
     */
    public function test_lead_without_consent_is_rejected(): void {
        $model = new \ISM\Models\Lead();
        $this->expectException(\ISM\Exceptions\ConsentRequiredException::class);

        $model->create([
            'email'   => 'test@example.com',
            'consent' => false,        // ← Kein Consent
        ]);
    }

    /**
     * Consent-Datum wird automatisch gesetzt
     */
    public function test_consent_date_is_recorded(): void {
        $model = new \ISM\Models\Lead();
        $lead_id = $model->create([
            'email'   => 'test@example.com',
            'consent' => true,
        ]);

        $lead = $model->find($lead_id);
        $this->assertNotNull($lead->consent_date);
    }

    /**
     * Lead-Löschung entfernt alle Daten
     */
    public function test_delete_removes_all_lead_data(): void {
        global $wpdb;
        $model = new \ISM\Models\Lead();
        $lead_id = $model->create([
            'email'   => 'delete-me@example.com',
            'consent' => true,
            'inputs'  => json_encode(['area' => 75]),
        ]);

        $model->delete($lead_id);

        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}ism_leads WHERE id = %d",
                $lead_id
            )
        );
        $this->assertNull($result);
    }
}
```

### 7.2 Sicherheits-Tests

```php
// tests/php/Integration/Security/ApiSecurityTest.php

class ApiSecurityTest extends WP_UnitTestCase {

    /**
     * SQL-Injection in Suchfeld wird escaped
     */
    public function test_search_escapes_sql_injection(): void {
        wp_set_current_user($this->factory->user->create(['role' => 'administrator']));

        $request = new WP_REST_Request('GET', '/ism/v1/leads');
        $request->set_param('search', "'; DROP TABLE wp_posts; --");

        $response = rest_do_request($request);
        $this->assertEquals(200, $response->get_status());
        // Tabelle existiert noch
        $this->assertNotEmpty($GLOBALS['wpdb']->get_var("SHOW TABLES LIKE '{$GLOBALS['wpdb']->posts}'"));
    }

    /**
     * XSS in Lead-Daten wird sanitized
     */
    public function test_lead_input_is_sanitized(): void {
        $request = new WP_REST_Request('POST', '/ism/v1/leads');
        $request->set_body_params([
            'first_name' => '<script>alert("xss")</script>Maria',
            'email'      => 'test@example.com',
            'consent'    => true,
            'asset_type' => 'mietpreis',
        ]);
        $request->set_header('X-WP-Nonce', wp_create_nonce('wp_rest'));

        $response = rest_do_request($request);
        $data = $response->get_data();

        $this->assertStringNotContainsString('<script>', $data['first_name']);
    }

    /**
     * Subscriber kann keine Leads lesen
     */
    public function test_subscriber_cannot_access_leads(): void {
        $subscriber = $this->factory->user->create(['role' => 'subscriber']);
        wp_set_current_user($subscriber);

        $request  = new WP_REST_Request('GET', '/ism/v1/leads');
        $response = rest_do_request($request);

        $this->assertEquals(403, $response->get_status());
    }
}
```

### 7.3 PDF-Generierungs-Tests

```php
// tests/php/Integration/Pdf/PdfGeneratorTest.php

class PdfGeneratorTest extends WP_UnitTestCase {

    public function test_generates_valid_pdf(): void {
        $generator = new \ISM\Services\Pdf\PdfGenerator();

        $pdf_binary = $generator->generate([
            'template'  => 'rent-analysis',
            'lead_name' => 'Maria Schmidt',
            'result'    => ['rent_min' => 562.50, 'rent_max' => 735.00],
            'locale'    => 'de_DE',
        ]);

        // PDF-Magic-Bytes prüfen
        $this->assertStringStartsWith('%PDF-', $pdf_binary);

        // Mindestgröße (kein leeres PDF)
        $this->assertGreaterThan(1000, strlen($pdf_binary));
    }

    public function test_pdf_contains_lead_name(): void {
        $generator = new \ISM\Services\Pdf\PdfGenerator();

        $pdf = $generator->generate([
            'template'  => 'rent-analysis',
            'lead_name' => 'Maria Schmidt',
            'result'    => ['rent_min' => 562.50, 'rent_max' => 735.00],
        ]);

        // PDF-Text extrahieren und prüfen
        $text = $this->extractTextFromPdf($pdf);
        $this->assertStringContainsString('Maria Schmidt', $text);
    }
}
```

### 7.4 i18n-Tests

```php
// tests/php/Unit/I18n/TranslationTest.php

class TranslationTest extends TestCase {

    public function test_pot_file_exists(): void {
        $this->assertFileExists(
            dirname(__DIR__, 3) . '/languages/ism.pot'
        );
    }

    public function test_all_supported_locales_have_mo_files(): void {
        $required_locales = ['de_DE', 'de_AT', 'de_CH', 'en_GB'];
        $languages_dir = dirname(__DIR__, 3) . '/languages/';

        foreach ($required_locales as $locale) {
            $this->assertFileExists(
                $languages_dir . "ism-{$locale}.mo",
                "MO-Datei fehlt für {$locale}"
            );
        }
    }
}
```

---

## 8. CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: ISM Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # ───────────────────────────────────────
  # JOB 1: Statische Analyse (~30s)
  # ───────────────────────────────────────
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
          tools: phpstan, phpcs, composer

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: |
          composer install
          npm ci

      - name: TypeScript Check
        run: npx tsc --noEmit

      - name: ESLint
        run: npm run lint

      - name: PHPStan
        run: vendor/bin/phpstan analyse

      - name: PHPCS
        run: vendor/bin/phpcs

  # ───────────────────────────────────────
  # JOB 2: Unit Tests (~30s)
  # ───────────────────────────────────────
  unit-tests:
    runs-on: ubuntu-latest
    needs: static-analysis
    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3']
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP ${{ matrix.php }}
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: xdebug

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: composer install
      - run: npm ci

      - name: PHP Unit Tests
        run: vendor/bin/phpunit --configuration phpunit.unit.xml --coverage-clover coverage-php.xml

      - name: JS Unit Tests
        run: npx vitest run --coverage

  # ───────────────────────────────────────
  # JOB 3: Integration Tests (~2min)
  # ───────────────────────────────────────
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: composer install
      - run: npm ci
      - run: npm run build

      - name: Start wp-env
        run: npx wp-env start

      - name: PHP Integration Tests
        run: npx wp-env run tests-cli --env-cwd=wp-content/plugins/immobilien-smart-assets vendor/bin/phpunit --configuration phpunit.integration.xml

  # ───────────────────────────────────────
  # JOB 4: E2E Tests (~5min)
  # ───────────────────────────────────────
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.ref == 'refs/heads/main'   # Nur auf main-Branch
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build
      - run: npx wp-env start

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E Tests
        run: npx playwright test

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 9. Coverage-Ziele

```
Bereich                          Ziel       Begründung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kalkulatoren (PHP + JS)          95%+       Geschäftskritisch, falsche Zahlen
                                            = Reputationsschaden
Validierung (Zod-Schemas)        95%+       Ungültige Daten dürfen nie durchgehen
Feature Gate (Freemius)          90%+       Falsche Freischaltung = Umsatzverlust
REST API Endpoints               85%+       Schnittstelle zwischen Frontend/Backend
Lead-Model (CRUD)                85%+       Datenintegrität
Makler-Zuordnung                 85%+       Falsche Zuordnung = falscher Makler auf PDF
PDF-Generierung                  70%        Schwer zu unit-testen, Integration zählt
E-Mail-Versand                   70%        Externe Abhängigkeit, Mocks nötig
React-Komponenten                70%        Interaktionslogik, nicht Styling
Admin-Seiten                     50%        Weniger kritisch, UI-lastig
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gesamt (Durchschnitt)            ~80%
```

---

## 10. Test-NPM-Scripts

```json
{
  "scripts": {
    "test": "npm run test:php:unit && npm run test:js",
    "test:php:unit": "vendor/bin/phpunit --configuration phpunit.unit.xml",
    "test:php:integration": "wp-env run tests-cli --env-cwd=wp-content/plugins/immobilien-smart-assets vendor/bin/phpunit --configuration phpunit.integration.xml",
    "test:js": "vitest run",
    "test:js:watch": "vitest",
    "test:js:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:php:integration && npm run test:e2e",
    "lint": "npm run lint:js && npm run lint:php",
    "lint:js": "eslint src/ --ext .ts,.tsx",
    "lint:php": "vendor/bin/phpcs && vendor/bin/phpstan analyse"
  }
}
```

**Täglicher Dev-Workflow:**
```bash
npm run test:js:watch        # Vitest im Watch-Modus (instant feedback)
npm run test                 # Vor jedem Commit: PHP + JS Unit Tests
# CI kümmert sich um Integration + E2E
```

---

## 11. Zusammenfassung

```
┌─────────────────────────────────────────────────────────────────┐
│  ISM Teststrategie auf einen Blick                              │
│                                                                 │
│  Statische Analyse:  TypeScript strict + ESLint + PHPStan       │
│                      + PHPCS (WordPress Standards)              │
│                      → Läuft bei jedem Save / Commit            │
│                                                                 │
│  Unit Tests:         PHPUnit + Brain Monkey (PHP)               │
│                      Vitest (JS/TS)                             │
│                      → ~70% der Tests, < 30s, lokal + CI        │
│                                                                 │
│  Integration Tests:  PHPUnit + wp-env (PHP ↔ WordPress/DB)     │
│                      React Testing Library (Komponenten)        │
│                      → ~25% der Tests, < 2min, CI               │
│                                                                 │
│  E2E Tests:          Playwright (3 Browser)                     │
│                      → ~5% der Tests, < 5min, CI (nur main)    │
│                                                                 │
│  Spezial-Tests:      DSGVO-Compliance                           │
│                      Sicherheit (XSS, SQLi, Auth)               │
│                      PDF-Generierung                            │
│                      i18n-Vollständigkeit                       │
│                                                                 │
│  CI/CD:              GitHub Actions (4 Jobs, sequentiell)       │
│                      Static → Unit → Integration → E2E          │
│                      Matrix: PHP 8.1 / 8.2 / 8.3               │
│                                                                 │
│  Coverage-Ziel:      ~80% gesamt, 95%+ für Kalkulatoren         │
│                                                                 │
│  Gesamt-Laufzeit CI: < 7 Minuten                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
