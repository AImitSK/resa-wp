---
name: test
description: "Tests für RESA-Code generieren"
user-invocable: true
argument-hint: "[Datei oder Komponente]"
---

# /test — Tests für RESA generieren

Generiere Tests für die angegebene Datei oder Komponente, orientiert an der RESA-Teststrategie.

## Vorgehen

1. **Zieldatei analysieren:**
   - Lies die zu testende Datei vollständig
   - Verstehe die Abhängigkeiten und Interfaces
   - Prüfe ob bereits Tests existieren

2. **Test-Framework bestimmen:**
   - **PHP-Datei** → PHPUnit 10 + Brain Monkey (Tests in `tests/php/`)
   - **TypeScript/React** → Vitest + React Testing Library (Tests in `tests/js/`)

3. **Teststrategie laden:**
   - Lies `docs/planning/RESA-Teststrategie.md` für Konventionen
   - Orientiere dich an existierenden Tests im Projekt

4. **Tests schreiben** nach den Kategorien unten

## Test-Kategorien

### Happy Path
- Normaler Funktionsablauf mit validen Daten
- Erwartete Rückgabewerte/Seiteneffekte

### Edge Cases
- Leere Eingaben, Null-Werte
- Grenzwerte (0, negative Zahlen, MAX_INT)
- Sehr lange Strings
- Unicode/Sonderzeichen (ä, ö, ü, ß — DACH-relevant!)

### Error Cases
- Ungültige Eingaben
- Fehlende Pflichtfelder
- Fehlerhafte Datentypen
- API-Fehler / Netzwerk-Fehler

### Security Tests (PHP)
- Unauthentifizierter Zugriff auf geschützte Endpoints
- Fehlende/ungültige Nonces
- SQL-Injection-Versuche (wenn DB-Queries vorhanden)
- XSS-Versuche in Eingabefeldern
- Unerlaubte Capability-Zugriffe

### Freemius Tests
- Verhalten im Free-Plan (Limits respektiert?)
- Verhalten im Premium-Plan (Features verfügbar?)
- Verhalten wenn SDK fehlt (Graceful Degradation)
- Limit-Grenzen (50. Lead, 2. Location, 2. Asset)

## PHP: PHPUnit + Brain Monkey

### Test-Datei-Konvention

```
tests/php/Unit/{Namespace}/{Klasse}Test.php
tests/php/Integration/{Namespace}/{Klasse}IntegrationTest.php
```

Beispiel: `includes/Models/LeadRepository.php` → `tests/php/Unit/Models/LeadRepositoryTest.php`

### Template

```php
<?php

declare(strict_types=1);

namespace Resa\Tests\Unit\Models;

use Resa\Models\LeadRepository;
use Brain\Monkey;
use Brain\Monkey\Functions;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use PHPUnit\Framework\TestCase;

class LeadRepositoryTest extends TestCase {
    use MockeryPHPUnitIntegration;

    protected function setUp(): void {
        parent::setUp();
        Monkey\setUp();
    }

    protected function tearDown(): void {
        Monkey\tearDown();
        parent::tearDown();
    }

    public function test_find_returns_lead_by_id(): void {
        // Arrange
        $wpdb = \Mockery::mock( \wpdb::class );
        $wpdb->prefix = 'wp_';
        $wpdb->shouldReceive( 'prepare' )->once()->andReturn( 'prepared_sql' );
        $wpdb->shouldReceive( 'get_row' )->once()->andReturn( (object) [
            'id'    => 1,
            'name'  => 'Max Mustermann',
            'email' => 'max@example.com',
        ] );

        // Act
        $repo = new LeadRepository();
        // ... inject $wpdb mock

        // Assert
        $this->assertNotNull( $lead );
        $this->assertEquals( 'Max Mustermann', $lead->name );
    }
}
```

### WordPress-Funktionen mocken (Brain Monkey)

```php
// Funktionen stubs
Functions\stubs( [
    'sanitize_text_field' => function ( $str ) { return $str; },
    'sanitize_email'      => function ( $str ) { return $str; },
    'absint'              => function ( $val ) { return abs( intval( $val ) ); },
    'wp_unslash'          => function ( $val ) { return $val; },
    'esc_html__'          => function ( $text, $domain = '' ) { return $text; },
    '__'                  => function ( $text, $domain = '' ) { return $text; },
    'current_time'        => function () { return '2026-01-01 00:00:00'; },
] );

// Funktion erwarten
Functions\expect( 'current_user_can' )
    ->once()
    ->with( 'manage_resa_leads' )
    ->andReturn( true );

// WordPress-Hooks
Functions\expect( 'add_action' )
    ->once()
    ->with( 'init', \Mockery::type( 'callable' ) );
```

### Freemius mocken

```php
// resa_fs() Mock
Functions\expect( 'resa_fs' )->andReturn(
    \Mockery::mock( \Freemius::class, [
        'can_use_premium_code' => true,
        'is_free_plan'         => false,
        'is_trial'             => false,
        'get_upgrade_url'      => 'https://checkout.freemius.com/...',
    ] )
);

// Free-Plan Test
Functions\expect( 'resa_fs' )->andReturn(
    \Mockery::mock( \Freemius::class, [
        'can_use_premium_code' => false,
        'is_free_plan'         => true,
    ] )
);
```

## JavaScript: Vitest + React Testing Library

### Test-Datei-Konvention

```
tests/js/components/{Komponente}.test.tsx
tests/js/hooks/{Hook}.test.ts
tests/js/lib/{Modul}.test.ts
```

### Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadForm } from '@/frontend/assets/shared/LeadForm';

// @wordpress/i18n Mock
vi.mock( '@wordpress/i18n', () => ( {
    __: ( text: string ) => text,
    _n: ( single: string, plural: string, count: number ) =>
        count === 1 ? single : plural,
    _x: ( text: string ) => text,
    sprintf: ( format: string, ...args: any[] ) => {
        let i = 0;
        return format.replace( /%[sd]/g, () => String( args[ i++ ] ) );
    },
} ) );

// resaConfig Mock
const mockResaConfig = {
    apiBase: 'http://localhost/wp-json/resa/v1/',
    nonce: 'test-nonce',
    plan: {
        isPremium: false,
        isTrial: false,
        isFreePlan: true,
        planName: 'free',
        upgradeUrl: 'https://checkout.freemius.com',
        trialUrl: 'https://checkout.freemius.com/trial',
        trialAvailable: true,
    },
};

beforeEach( () => {
    ( window as any ).resaConfig = mockResaConfig;
} );

describe( 'LeadForm', () => {
    it( 'renders all required fields', () => {
        render( <LeadForm assetType="mietpreis" locationId={1} /> );

        expect( screen.getByLabelText( /name/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /e-mail/i ) ).toBeInTheDocument();
        expect( screen.getByLabelText( /datenschutz/i ) ).toBeInTheDocument();
    } );

    it( 'shows validation errors for empty required fields', async () => {
        const user = userEvent.setup();
        render( <LeadForm assetType="mietpreis" locationId={1} /> );

        await user.click( screen.getByRole( 'button', { name: /absenden/i } ) );

        await waitFor( () => {
            expect( screen.getByText( /name ist erforderlich/i ) ).toBeInTheDocument();
        } );
    } );

    it( 'submits valid form data', async () => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render( <LeadForm assetType="mietpreis" locationId={1} onSubmit={onSubmit} /> );

        await user.type( screen.getByLabelText( /name/i ), 'Max Mustermann' );
        await user.type( screen.getByLabelText( /e-mail/i ), 'max@example.com' );
        await user.click( screen.getByLabelText( /datenschutz/i ) );
        await user.click( screen.getByRole( 'button', { name: /absenden/i } ) );

        await waitFor( () => {
            expect( onSubmit ).toHaveBeenCalledWith(
                expect.objectContaining( {
                    name: 'Max Mustermann',
                    email: 'max@example.com',
                } )
            );
        } );
    } );
} );
```

### API-Calls mocken

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
    rest.get( '*/resa/v1/leads', ( req, res, ctx ) => {
        return res( ctx.json( [
            { id: 1, name: 'Max', email: 'max@test.de' },
        ] ) );
    } ),
    rest.post( '*/resa/v1/leads/submit', ( req, res, ctx ) => {
        return res( ctx.json( { success: true, lead_id: 42 } ) );
    } ),
);

beforeAll( () => server.listen() );
afterEach( () => server.resetHandlers() );
afterAll( () => server.close() );
```

### Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLeads } from '@/admin/hooks/useLeads';

const wrapper = ( { children }: { children: React.ReactNode } ) => {
    const queryClient = new QueryClient( {
        defaultOptions: { queries: { retry: false } },
    } );
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe( 'useLeads', () => {
    it( 'fetches leads successfully', async () => {
        const { result } = renderHook( () => useLeads(), { wrapper } );

        await waitFor( () => {
            expect( result.current.isSuccess ).toBe( true );
        } );

        expect( result.current.data ).toHaveLength( 1 );
    } );
} );
```

## Hinweise

- **Arrange-Act-Assert** Pattern verwenden
- **Einen Aspekt pro Test** — Tests sollten genau eine Sache prüfen
- **Sprechende Testnamen** auf Deutsch: `test_gibt_fehler_bei_ungueltigem_email()`
- **Keine Implementierungsdetails testen** — Verhalten testen, nicht Interna
- **Mocking:** So wenig wie nötig, so viel wie notwendig
- **DACH-Testdaten:** Deutsche Namen, Euro-Beträge, m²-Flächen verwenden
- **Bestehende Tests nicht überschreiben** — ergänzen!
