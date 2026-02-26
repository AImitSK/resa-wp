# RESA Code Audit Report

**Datum:** 2026-02-26
**Branch:** feature/rent-calculator
**Analysiert:** 91+ PHP-Dateien, 74+ TypeScript-Dateien, 42 Test-Dateien

---

## Executive Summary

| Audit-Bereich | Critical | Warning | Info | Status             |
| ------------- | -------- | ------- | ---- | ------------------ |
| Security      | 4        | 7       | 3    | 🔴                 |
| i18n          | 7        | 6       | 5    | 🔴                 |
| Type-Safety   | 1        | 10      | 2    | 🟡                 |
| Test-Coverage | -        | -       | -    | 🟡 PHP 65%, TS 37% |
| Freemius      | 2        | 5       | 2    | 🔴                 |

**Gesamtbewertung:** 14 kritische Issues müssen vor Production gefixt werden.

---

## 1. Security Audit

### 1.1 Critical Findings (4)

#### 🔴 LocationsController.php:210-219 — Unzureichende Sanitization

```php
foreach ( $stringFields as $field ) {
    if ( array_key_exists( $field, $params ) ) {
        $updateData[ $field ] = $params[ $field ];  // KEINE SANITIZATION!
    }
}
```

**Fix:** `sanitize_text_field()` auf jeden Wert anwenden.

#### 🔴 Location.php:109-120 — Ungeschützte SQL-Query

```php
$where = $activeOnly ? 'WHERE is_active = 1' : '';
$results = $wpdb->get_results(
    "SELECT * FROM {$table} {$where} ORDER BY name ASC"
);
```

**Fix:** `$wpdb->prepare()` verwenden.

#### 🔴 Location.php:152-153 — Fehlende JSON Validation

```php
$fields['factors'] = $data['factors'] !== null ? wp_json_encode( $data['factors'] ) : null;
```

**Fix:** `$data['factors']` validieren bevor JSON-Encoding.

#### 🔴 TrackingService.php:376-379 — SQL-Injection Pattern

```php
"UPDATE {$table} SET {$column} = {$column} + 1 WHERE id = %d"
```

**Hinweis:** Whitelist-Check ist vorhanden (Zeilen 369-372), aber Pattern ist phpcs-Warning.

### 1.2 Warnings (7)

| Datei                        | Zeile   | Problem                            |
| ---------------------------- | ------- | ---------------------------------- |
| LocationsController.php      | 213-218 | Fehlende Schlüssel-Dokumentation   |
| EmailService.php             | 90-91   | Template-Variables ohne Escaping   |
| ResaShortcode.php            | 65-68   | wp_kses() wäre defensiver          |
| AdminPage.php                | 107-108 | Nonce nicht erforderlich (OK)      |
| ModuleSettingsController.php | 188-213 | Rekursive Sanitization Performance |
| ModuleSettings.php           | 276-277 | JSON-Dekoding ohne Error-Handling  |
| EmailLogger.php              | 77-86   | $field Parameter nicht validiert   |

### 1.3 REST API Status

✅ Alle Endpoints haben `permission_callback`
✅ Public Endpoints nutzen `publicAccess()` korrekt
✅ Admin Endpoints prüfen `current_user_can('manage_options')`
✅ Nonce-Handling ist WordPress-REST-Standard

---

## 2. i18n Audit

### 2.1 Critical Findings (7)

#### 🔴 AdminPage.php:70-74 — Menü-Labels hardcodiert

```php
private const SUBMENUS = [
    'resa'               => 'Dashboard',        // Hardcoded
    'resa-leads'         => 'Leads',
    'resa-modules'       => 'Smart Assets',
    // ...
];
```

**Fix:** Dynamisch mit `__('Dashboard', 'resa')` wrappen.

#### 🔴 Dashboard.tsx — Keine i18n

```tsx
<StatsCard label="Leads gesamt" value="—" />
<StatsCard label="Neue Leads (30 Tage)" value="—" />
```

**Fix:** Alle Strings mit `__(..., 'resa')` wrappen.

#### 🔴 ModuleStore.tsx — 15+ hardcodierte Strings

```tsx
'Module werden geladen...';
'Fehler beim Laden';
'Premium erforderlich';
'Einstellungen';
```

#### 🔴 Locations.tsx — Template Strings + Umlaute falsch

```tsx
if (!window.confirm(`Location "${name}" wirklich loschen?`)) return;
// Umlaute: 'Landlich' statt 'Ländlich', 'Grossstadt' statt 'Großstadt'
```

#### 🔴 ModuleSettings.tsx — Tab-Labels nicht übersetzbar

```tsx
const TABS = [
	{ id: 'overview', label: 'Ubersicht' },
	{ id: 'setup', label: 'Einrichtung' },
];
```

#### 🔴 Leads.tsx — Keine i18n

#### 🔴 SmtpTransport.php:47,86 — RuntimeExceptions ohne i18n

```php
throw new \RuntimeException( 'SMTP ist nicht konfiguriert.' );
```

### 2.2 Positive Implementierungen ✅

| Datei                    | Status                   |
| ------------------------ | ------------------------ |
| LeadForm.tsx             | ✅ Vollständig übersetzt |
| StepWizard.tsx           | ✅ Vollständig übersetzt |
| ErrorMessages.php        | ✅ Vollständig übersetzt |
| validation.ts            | ✅ Vollständig übersetzt |
| RentCalculatorModule.php | ✅ Vollständig übersetzt |

---

## 3. Type-Safety Audit

### 3.1 Critical Findings (1)

#### 🔴 StepWizard.tsx:75 — Unsicherer Type Cast

```typescript
} catch (err) {
    const zodError = err as ZodError;  // UNSAFE!
```

**Fix:**

```typescript
} catch (err) {
    if (!(err instanceof ZodError)) throw err;
    const zodError = err;
```

### 3.2 Warnings (10)

| Datei                    | Zeile      | Problem                                     |
| ------------------------ | ---------- | ------------------------------------------- |
| LeadForm.tsx             | 73, 86     | Redundante `as string \| undefined`         |
| FactorEditor.tsx         | 25, 72, 82 | Unsicherer Cast zu `Record<string, number>` |
| Locations.tsx            | 84, 199    | Unsicherer Cast für location.data           |
| SetupTab.tsx             | 65         | Unsicherer Cast                             |
| RentCalculatorWidget.tsx | 141        | Double-Cast `as unknown as T`               |

### 3.3 Positive Ergebnisse ✅

- ❌ Keine `any` Types gefunden
- ❌ Keine impliziten `any` gefunden
- ✅ Null/Undefined Handling korrekt
- ✅ Event Handler typisiert
- ✅ API Response Types definiert
- ✅ Zod Schemas mit TypeScript abgestimmt

**Type-Safety Score:** 8/10 (Sehr gut)

---

## 4. Test-Coverage Audit

### 4.1 Übersicht

| Bereich    | Coverage     | Status |
| ---------- | ------------ | ------ |
| PHP gesamt | 65% (26/40)  | 🟡     |
| TypeScript | 37% (13/35+) | 🔴     |

### 4.2 Gut abgedeckt ✅

**PHP:**

- Email Services (5 Test-Dateien)
- PDF Services (4 Test-Dateien)
- Core Classes (Plugin, ModuleRegistry, IconRegistry)
- Freemius (FeatureGate, FreemiusInit)
- API: HealthController, LeadsController, TrackingController

**TypeScript:**

- Rent Calculator Steps (6/6 Steps)
- LeadForm, StepWizard, ProgressBar
- Validation Schemas

### 4.3 Kritische Lücken 🔴

| Bereich                 | Fehlend                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| **REST Controllers**    | LocationsController, ModulesController, ModuleSettingsController |
| **Admin Pages**         | 10 Seiten, nur 1 Smoke-Test                                      |
| **Admin Hooks**         | useLocations, useModules, useModuleSettings                      |
| **Frontend**            | api-client.ts, session.ts, tracking.ts                           |
| **Rent Calculator PHP** | RentCalculatorModule.php, RentCalculatorController.php           |

### 4.4 Priorisierte Test-Roadmap

**Phase 1 (Critical):**

- [ ] LocationsController Tests
- [ ] ModulesController Tests
- [ ] useLocations Hook Tests
- [ ] Frontend api-client Tests

**Phase 2 (Important):**

- [ ] RentCalculatorModule.php Tests
- [ ] RentCalculatorController.php Tests
- [ ] Admin Component Tests (FactorEditor, LocationEditor)

**Phase 3 (Nice-to-have):**

- [ ] Admin Page Smoke Tests
- [ ] Frontend Utility Tests

---

## 5. Freemius Integration Audit

### 5.1 Critical Findings (2)

#### 🔴 ModulesController.php:89-116 — toggleModule() ohne FeatureGate

```php
public function toggleModule( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
    $newState = ! $module->isActive();
    $module->setActive( $newState );  // KEINE FEATURE-GATE CHECK!
}
```

**Impact:** Free-User kann Pro-Module aktivieren, 2-Module-Limit wird ignoriert.

**Fix:**

```php
$featureGate = new FeatureGate();
if ( $newState && ! $featureGate->canActivateModule( $module ) ) {
    return new \WP_Error( 'upgrade_required', 'Premium erforderlich', [ 'status' => 403 ] );
}
```

#### 🔴 LocationsController.php:154-197 — create() ohne Location-Limit

```php
public function create( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
    $id = Location::create( $locationData );
    // KEINE canAddLocation() CHECK!
}
```

**Impact:** Free-User kann unbegrenzt Locations erstellen.

**Fix:**

```php
$featureGate = new FeatureGate();
if ( ! $featureGate->canAddLocation() ) {
    return new \WP_Error( 'limit_reached', 'Free-Limit erreicht', [ 'status' => 403 ] );
}
```

### 5.2 Warnings (5)

| Problem                                    | Datei                                  |
| ------------------------------------------ | -------------------------------------- |
| Keine FeatureGate Dependency Injection     | ModulesController, LocationsController |
| UI zeigt "Premium erforderlich" ohne Block | ModuleStore.tsx:180                    |
| ModuleSettings ohne Feature-Gate           | ModuleSettingsController               |
| Keine Rate-Limiting für Leads              | LeadsController                        |

### 5.3 Was funktioniert ✅

- ✅ FeatureGate Klasse vollständig implementiert
- ✅ PDF Engine Premium-Gating korrekt (Puppeteer nur für Premium)
- ✅ Freemius SDK korrekt initialisiert
- ✅ Module-Flags korrekt gesetzt (rent-calculator: 'free')
- ✅ FeatureGate Tests vorhanden

---

## 6. Priorisierte Fix-Liste

### P0 — VOR PRODUCTION (Blocker)

| #   | Bereich  | Datei                   | Fix                       |
| --- | -------- | ----------------------- | ------------------------- |
| 1   | Freemius | ModulesController.php   | canActivateModule() Check |
| 2   | Freemius | LocationsController.php | canAddLocation() Check    |
| 3   | Security | LocationsController.php | sanitize_text_field()     |
| 4   | Security | Location.php            | $wpdb->prepare()          |

### P1 — VOR LAUNCH (Important)

| #   | Bereich     | Datei               | Fix                     |
| --- | ----------- | ------------------- | ----------------------- |
| 5   | i18n        | AdminPage.php       | SUBMENUS translatable   |
| 6   | i18n        | ModuleStore.tsx     | Alle Strings wrappen    |
| 7   | i18n        | Locations.tsx       | Strings + Umlaute fixen |
| 8   | Type-Safety | StepWizard.tsx      | Type Guard für ZodError |
| 9   | Tests       | LocationsController | Unit Tests              |
| 10  | Tests       | ModulesController   | Unit Tests              |

### P2 — NACH LAUNCH (Nice-to-have)

| #   | Bereich     | Datei                    | Fix                      |
| --- | ----------- | ------------------------ | ------------------------ |
| 11  | i18n        | Dashboard.tsx            | Strings wrappen          |
| 12  | i18n        | Leads.tsx                | Strings wrappen          |
| 13  | Type-Safety | FactorEditor.tsx         | Type Guards              |
| 14  | Type-Safety | RentCalculatorWidget.tsx | Double-Cast entfernen    |
| 15  | Tests       | Admin Hooks              | useLocations, useModules |
| 16  | Tests       | Frontend                 | api-client.ts            |

---

## 7. Nächste Schritte

1. **Sofort:** P0-Fixes implementieren (4 Issues)
2. **Diese Woche:** P1-Fixes implementieren (6 Issues)
3. **Test-Coverage:** Kritische Lücken schließen
4. **i18n:** Admin-Bereich vollständig übersetzen
5. **Review:** Nach Fixes erneuten Audit durchführen

---

## Anhang: Audit-Agents

Dieser Bericht wurde durch 5 parallele Audit-Agents erstellt:

1. **Security-Audit** — PHP Sanitization, Escaping, SQL, REST
2. **i18n-Audit** — String-Wrapping, Text-Domain, DACH-Format
3. **Type-Safety-Audit** — any-Types, Interfaces, Casts
4. **Test-Coverage-Audit** — Fehlende Tests, Coverage-Gaps
5. **Freemius-Audit** — Feature-Gating, Limits, Upgrade-CTAs
