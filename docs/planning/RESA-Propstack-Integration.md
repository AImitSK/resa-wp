# SPEC: Propstack CRM Integration (Freemius Add-on)

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Erstes Freemius Add-on, Monorepo `addons/resa-propstack/`, Integrationen-Seite → Propstack-Tab

## Zusammenfassung

Propstack ist das erste kostenpflichtige Freemius-Add-on für RESA. Wenn ein Lead abgeschlossen wird, synchronisiert das Add-on automatisch Kontakt, Aktivität und Newsletter-DOI zur Propstack CRM API. Die Konfiguration erfolgt über einen neuen "Propstack"-Tab unter Integrationen mit Cards für Verbindung, Makler-Zuweisung, Aktivitäten und Newsletter.

**Architektur:** Das Add-on lebt als separates WordPress-Plugin im Monorepo unter `addons/resa-propstack/` (reines PHP). Die React-UI liegt im RESA-Core (`PropstackTab.tsx`), da sie im selben Vite-Bundle gebaut wird. Das Add-on registriert sich über den `resa_integration_tabs`-Filter und hängt sich in den `resa_lead_created`-Hook.

**Freemius Add-on** — Erfordert aktive RESA Premium-Lizenz. Preis: 79 €/Jahr.

## Betroffene Dateien

### Neue Dateien (Add-on Plugin)

```
addons/resa-propstack/
  resa-propstack.php                    # Plugin Entry Point + Freemius Add-on Init
  composer.json                         # PSR-4 Autoloading (Resa\Propstack\)
  package.json                          # Version + ZIP-Script
  readme.txt                            # WordPress readme
  includes/
    Plugin.php                          # Bootstrap, Hook-Registrierung
    PropstackService.php                # HTTP-Client für Propstack API
    PropstackSettings.php               # WP Option Wrapper (resa_propstack_settings)
    PropstackSync.php                   # Lead-Sync-Logik (resa_lead_created)
    PropstackController.php             # REST API Endpoints (extends Resa\Api\RestController)
    Migration.php                       # DB-Spalten zu resa_leads
  scripts/
    create-zip.js                       # ZIP-Erstellung für Freemius
  tests/
    PropstackSettingsTest.php
    PropstackServiceTest.php
    PropstackSyncTest.php
```

### Neue Dateien (RESA Core)

- `src/admin/components/integrations/PropstackTab.tsx` — Settings UI (4 Cards)
- `src/admin/hooks/usePropstack.ts` — React Query Hooks für Propstack REST API
- `.github/workflows/deploy-propstack-freemius.yml` — CI/CD für Add-on

### Geänderte Dateien (RESA Core)

- `src/admin/pages/Integrations.tsx` — `propstack` Slug → `PropstackTab` statt generischem `AddonTab`
- `src/admin/types/index.ts` — Propstack-Interfaces (Settings, Broker, ActivityType, etc.)
- `includes/Api/LeadsController.php` — `formatDetail()` um Propstack-Sync-Felder erweitern

## API-Änderungen

### Neue Endpoints (vom Add-on registriert, im RESA-Namespace)

| Methode | Route                                      | Beschreibung                        | Auth  |
| ------- | ------------------------------------------ | ----------------------------------- | ----- |
| GET     | `/resa/v1/admin/propstack/settings`        | Einstellungen lesen                 | Admin |
| PUT     | `/resa/v1/admin/propstack/settings`        | Einstellungen speichern             | Admin |
| POST    | `/resa/v1/admin/propstack/test-connection` | API-Verbindung testen               | Admin |
| GET     | `/resa/v1/admin/propstack/brokers`         | Propstack-Makler laden (5min Cache) | Admin |
| GET     | `/resa/v1/admin/propstack/contact-sources` | Kontaktquellen laden (5min Cache)   | Admin |
| GET     | `/resa/v1/admin/propstack/activity-types`  | Aktivitätstypen laden (5min Cache)  | Admin |
| POST    | `/resa/v1/admin/propstack/sync/{id}`       | Manueller Re-Sync eines Leads       | Admin |

### Propstack API Endpunkte (extern, `https://api.propstack.de/v1`)

| Endpoint           | Methode | Zweck                        |
| ------------------ | ------- | ---------------------------- |
| `/brokers`         | GET     | Makler-Liste für Dropdown    |
| `/contacts`        | POST    | Kontakt erstellen            |
| `/contacts?email=` | GET     | Kontakt per E-Mail suchen    |
| `/contacts/{id}`   | PUT     | Kontakt aktualisieren        |
| `/contact_sources` | GET     | Kontaktquellen für Dropdown  |
| `/activity_types`  | GET     | Aktivitätstypen für Dropdown |
| `/tasks`           | POST    | Aktivität/Aufgabe erstellen  |
| `/messages`        | POST    | Newsletter-DOI senden        |

**Auth:** `X-API-KEY` Header mit dem vom Makler konfigurierten API-Key.

## Datenbank-Änderungen

### Neue Spalten auf `resa_leads`

```sql
ALTER TABLE {$prefix}resa_leads ADD COLUMN propstack_id BIGINT DEFAULT NULL;
ALTER TABLE {$prefix}resa_leads ADD COLUMN propstack_synced TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE {$prefix}resa_leads ADD COLUMN propstack_error TEXT DEFAULT NULL;
ALTER TABLE {$prefix}resa_leads ADD COLUMN propstack_synced_at DATETIME DEFAULT NULL;
```

- `propstack_id` — Remote-Kontakt-ID in Propstack (nach erfolgreichem Sync)
- `propstack_synced` — 0 = nicht synced / Fehler, 1 = erfolgreich synced
- `propstack_error` — Fehlermeldung wenn Sync fehlgeschlagen
- `propstack_synced_at` — Zeitstempel des letzten Sync-Versuchs

**Migration:** `addColumnIfNotExists()` per `ALTER TABLE` (kein dbDelta), Version in `resa_propstack_db_version` Option. Wird bei Plugin-Aktivierung ausgeführt.

### Settings-Option

WordPress Option `resa_propstack_settings`:

```php
[
    'enabled'                => false,      // Integration aktiv
    'api_key'                => '',         // Propstack API-Key
    'city_broker_mapping'    => [],         // array: location_id => broker_id
    'default_broker_id'      => null,       // Fallback-Makler
    'contact_source_id'      => null,       // Propstack-Kontaktquelle
    'activity_enabled'       => false,      // Aktivitäten erstellen
    'activity_type_id'       => null,       // Aktivitätstyp-ID
    'activity_create_task'   => false,      // Als Aufgabe mit Fälligkeit
    'activity_task_due_days' => 3,          // Fälligkeit in Werktagen (1-30)
    'sync_newsletter_only'   => false,      // Nur Newsletter-Kontakte syncen
    'newsletter_broker_id'   => null,       // Makler für Newsletter-DOI
]
```

## Modul-Klassifizierung

| Eigenschaft      | Wert                                           |
| ---------------- | ---------------------------------------------- |
| **Typ**          | Integration Add-on (Tier 3)                    |
| **Freemius-Typ** | Separates Produkt (is_addon: true)             |
| **Erfordert**    | RESA Premium aktiv                             |
| **Plugin-Slug**  | `resa-propstack`                               |
| **Namespace**    | `Resa\Propstack\`                              |
| **Text-Domain**  | `resa-propstack` (PHP), `resa` (React im Core) |

## Free vs. Premium

| Feature-Aspekt         | Free | Premium (ohne Add-on) | Premium + Add-on |
| ---------------------- | ---- | --------------------- | ---------------- |
| Propstack-Tab sichtbar | Nein | Nein                  | Ja               |
| API-Verbindung         | Nein | Nein                  | Ja               |
| Lead-Sync              | Nein | Nein                  | Automatisch      |
| Makler-Zuweisung       | Nein | Nein                  | Ja               |
| Aktivitäten            | Nein | Nein                  | Ja               |
| Newsletter-DOI         | Nein | Nein                  | Ja               |
| Manueller Re-Sync      | Nein | Nein                  | Ja               |

Der Propstack-Tab taucht nur auf, wenn das Add-on-Plugin aktiv ist (über `resa_integration_tabs`-Filter).

## UI/UX

### Propstack-Tab (Admin → Integrationen → Propstack)

Alles in einem Tab mit Cards untereinander (wie Maklerdaten-Tab):

```
┌─────────────────────────────────────────────────────────────────┐
│  [Webhooks] [API] [Messenger] [reCAPTCHA] [Propstack]          │
│                                                                 │
│  ┌─ Verbindung ───────────────────────────────────────────────┐│
│  │                                                             ││
│  │  Propstack-Integration              ○ aktiv / ● inaktiv    ││
│  │  Synchronisiert Leads automatisch zu Propstack.             ││
│  │                                                             ││
│  │  API-Key:                                                   ││
│  │  [••••••••••••••••••••              ] [👁]                  ││
│  │                                                             ││
│  │  Status: ● Verbunden (5 Makler gefunden)                   ││
│  │  ─── oder ───                                              ││
│  │  Status: ○ Nicht verbunden                                 ││
│  │                                                             ││
│  │                    [Verbindung testen]                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─ Makler-Zuweisung ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  Ordne RESA-Standorte Propstack-Maklern zu.                │ │
│  │                                                             │ │
│  │  Standard-Makler (Fallback):                               │ │
│  │  [▼ Max Mustermann                          ]              │ │
│  │                                                             │ │
│  │  Kontaktquelle:                                            │ │
│  │  [▼ Website                                 ]              │ │
│  │                                                             │ │
│  │  ┌──────────────┬──────────────────────────┬──────┐       │ │
│  │  │ Standort     │ Propstack-Makler         │Status│       │ │
│  │  ├──────────────┼──────────────────────────┼──────┤       │ │
│  │  │ Berlin       │ [▼ Lisa Schmidt       ]  │  ✓   │       │ │
│  │  │ München      │ [▼ Max Mustermann     ]  │  ✓   │       │ │
│  │  │ Hamburg      │ [▼ — Nicht zugeordnet  ]  │  ─   │       │ │
│  │  └──────────────┴──────────────────────────┴──────┘       │ │
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─ Aktivitäten ──────────────────────────────────────────────┐│
│  │                                                             ││
│  │  Aktivitäten erstellen                     ○ an / ● aus    ││
│  │  Erstellt eine Aktivität auf dem Kontakt bei neuem Lead.    ││
│  │                                                             ││
│  │  Aktivitätstyp:                                            ││
│  │  [▼ Anfrage                              ] [↻ Aktualis.]  ││
│  │                                                             ││
│  │  □ Als Aufgabe mit Fälligkeit erstellen                    ││
│  │    Fälligkeit in Werktagen: [3]                            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─ Newsletter ───────────────────────────────────────────────┐│
│  │                                                             ││
│  │  □ Nur Leads mit Newsletter-Einwilligung synchronisieren   ││
│  │                                                             ││
│  │  Newsletter-Makler (Absender):                             ││
│  │  [▼ Max Mustermann                          ]              ││
│  │                                                             ││
│  │  Automatische Tags:                                        ││
│  │  [resa-lead] [mietpreis-kalkulator] [berlin]              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Diese Daten werden automatisch bei jedem neuen      [Speichern]│
│  Lead zu Propstack synchronisiert.                              │
└─────────────────────────────────────────────────────────────────┘
```

### Ohne API-Key (Initial-Zustand)

Nur die Verbindungs-Card ist sichtbar. Makler-Zuweisung, Aktivitäten und Newsletter-Cards werden erst nach erfolgreicher Verbindung angezeigt.

## Implementierungsdetails

### PHP: Plugin Entry Point (`resa-propstack.php`)

```php
<?php
/**
 * Plugin Name:       RESA für Propstack
 * Plugin URI:        https://resa-wt.com/propstack
 * Description:       Propstack-CRM-Integration für RESA — synchronisiert Leads automatisch.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            resa-wt.com
 * Author URI:        https://resa-wt.com
 * License:           Proprietary
 * Text Domain:       resa-propstack
 * Domain Path:       /languages
 */
```

Aufgaben:

- Prüft ob RESA Core aktiv ist (`defined('RESA_VERSION')`)
- Prüft ob RESA Premium aktiv ist (`resa_fs()->can_use_premium_code()`)
- Freemius SDK Init als Add-on (`is_addon: true`, `parent.id: '24963'`)
- Composer Autoloader laden
- `Resa\Propstack\Plugin::register()` auf `plugins_loaded` Priorität 20 (nach RESA Core)

### PHP: PropstackService (`includes/PropstackService.php`)

HTTP-Client für `https://api.propstack.de/v1`. Folgt dem Muster von `WebhookDispatcher::send()`.

```php
class PropstackService {
    private string $apiKey;
    private const BASE_URL = 'https://api.propstack.de/v1';

    public function __construct(string $apiKey);

    public function testConnection(): array;          // GET /brokers?limit=1
    public function getBrokers(): array;               // GET /brokers
    public function getContactSources(): array;        // GET /contact_sources
    public function getActivityTypes(): array;         // GET /activity_types
    public function findContactByEmail(string $email): ?array;  // GET /contacts?email=
    public function createContact(array $data): array; // POST /contacts
    public function updateContact(int $id, array $data): array; // PUT /contacts/{id}
    public function createTask(array $data): array;    // POST /tasks
    public function sendMessage(array $data): array;   // POST /messages

    private function request(string $method, string $endpoint, array $data = []): array;
}
```

`request()` Methode:

- Setzt `X-API-KEY` Header
- Nutzt `wp_remote_get()` / `wp_remote_post()` / `wp_remote_request()`
- Timeout: 10 Sekunden
- Return: `['success' => bool, 'data' => ..., 'error' => string]`
- Loggt Fehler mit `[RESA Propstack]` Prefix

### PHP: PropstackSync (`includes/PropstackSync.php`)

Hook-Callback für `resa_lead_created`. Folgt dem Muster von `WebhookDispatcher::onLeadCreated()` und `MessengerDispatcher::onLeadCreated()`.

```php
class PropstackSync {
    public function onLeadCreated(int $leadId): void;

    private function syncLead(object $lead): void;
    private function resolveBroker(object $lead, array $settings): ?int;
    private function buildContactData(object $lead, ?int $brokerId, array $settings): array;
    private function buildDescription(object $lead): string;
    private function createActivity(PropstackService $service, int $contactId, object $lead, array $settings): void;
    private function sendNewsletterDoi(PropstackService $service, int $contactId, object $lead, array $settings): void;
    private function markSynced(int $leadId, int $propstackId): void;
    private function markError(int $leadId, string $error): void;
}
```

**Sync-Flow:**

1. Propstack aktiviert? → sonst return
2. Lead laden (`Resa\Models\Lead::findById()`)
3. Vollständiger Lead (hat E-Mail)? → sonst return
4. Schon synced (`propstack_synced == 1`)? → sonst return
5. Broker ermitteln: Location→Broker-Mapping → Default-Broker → null
6. Kontakt suchen per E-Mail → Update oder Create
7. `propstack_id` + Status auf Lead speichern
8. Wenn `activity_enabled`: Task erstellen via `POST /tasks`
9. Wenn Newsletter-Consent + `sync_newsletter_only`: DOI senden via `POST /messages`

**Fehlerbehandlung:** Non-blocking. Fehler werden in `propstack_error` gespeichert und geloggt, blockieren aber nicht die Lead-Erstellung. Analog zu WebhookDispatcher/MessengerDispatcher.

**Kontakt-Beschreibung:**

```
Anfrage über RESA

--- Berechnungsergebnis ---
Smart Asset: Mietpreis-Kalkulator
Standort: Berlin
Objekttyp: Wohnung
Größe: 85 m²
Ergebnis: 1.250 €/Monat (14,70 €/m²)
```

### PHP: PropstackController (`includes/PropstackController.php`)

Erweitert `Resa\Api\RestController` (erbt NAMESPACE `resa/v1`, `adminAccess()`, `success()`, `error()`).

Folgt dem Muster von `RecaptchaSettingsController` (Settings GET/PUT) und `WebhooksController` (CRUD + Test).

**Caching:** Broker, ContactSources und ActivityTypes werden über WordPress Transients gecacht (5 Minuten). Beim Speichern eines neuen API-Keys werden alle Caches invalidiert (`delete_transient()`).

### TypeScript: Interfaces (`src/admin/types/index.ts`)

```typescript
export interface PropstackSettings {
	enabled: boolean;
	api_key: string;
	city_broker_mapping: Record<number, number>;
	default_broker_id: number | null;
	contact_source_id: number | null;
	activity_enabled: boolean;
	activity_type_id: number | null;
	activity_create_task: boolean;
	activity_task_due_days: number;
	sync_newsletter_only: boolean;
	newsletter_broker_id: number | null;
}

export interface PropstackBroker {
	id: number;
	name: string;
	email: string;
}

export interface PropstackContactSource {
	id: number;
	name: string;
}

export interface PropstackActivityType {
	id: number;
	name: string;
}

export interface PropstackTestResult {
	success: boolean;
	broker_count?: number;
	error?: string;
}
```

### TypeScript: React Query Hooks (`src/admin/hooks/usePropstack.ts`)

Folgt dem Muster von `useRecaptchaSettings.ts` und `useWebhooks.ts`:

```typescript
usePropstackSettings(); // GET settings
useSavePropstackSettings(); // PUT settings (invalidiert alle Caches)
useTestPropstackConnection(); // POST test-connection
usePropstackBrokers(enabled); // GET brokers (5min staleTime, nur wenn API-Key vorhanden)
usePropstackContactSources(enabled); // GET contact-sources
usePropstackActivityTypes(enabled); // GET activity-types
useManualPropstackSync(); // POST sync/{id}
```

### React: PropstackTab (`src/admin/components/integrations/PropstackTab.tsx`)

Folgt dem Muster von `RecaptchaTab.tsx`:

- Inline-Styles (konsistent mit bestehenden Integrations-Tabs)
- `isDirty`-Pattern für Speichern-Button
- Cards-Layout

**Struktur:**

```
PropstackTab
├── Loading-Spinner (wenn Settings laden)
├── Error-Alert (wenn Settings-Laden fehlschlägt)
├── form (onSubmit → saveMutation)
│   ├── Card: Verbindung
│   │   ├── Enable/Disable Switch
│   │   ├── API-Key Input (type="password" mit Toggle)
│   │   ├── "Verbindung testen" Button
│   │   └── Status-Badge (verbunden/nicht verbunden/fehler)
│   ├── Card: Makler-Zuweisung (nur wenn verbunden)
│   │   ├── Standard-Makler Dropdown (usePropstackBrokers)
│   │   ├── Kontaktquelle Dropdown (usePropstackContactSources)
│   │   └── Standort→Makler Mapping-Tabelle (useLocations + usePropstackBrokers)
│   ├── Card: Aktivitäten (nur wenn verbunden)
│   │   ├── Enable/Disable Switch
│   │   ├── Aktivitätstyp Dropdown (usePropstackActivityTypes)
│   │   ├── "Als Aufgabe" Checkbox
│   │   └── Fälligkeit in Tagen Input (1-30, nur wenn Aufgabe aktiv)
│   ├── Card: Newsletter (nur wenn verbunden)
│   │   ├── "Nur Newsletter-Kontakte" Switch
│   │   ├── Newsletter-Makler Dropdown
│   │   └── Auto-Tags Anzeige (read-only Badges)
│   └── Footer: Hinweis + Speichern-Button
```

**Bedingte Sichtbarkeit:** Cards 2-4 werden nur angezeigt, wenn ein API-Key eingetragen ist UND die Verbindung erfolgreich getestet wurde. Verhindert leere Dropdowns und API-Fehler.

### React: Integrations.tsx Anpassung

```tsx
// Import hinzufügen:
import { PropstackTab } from '../components/integrations/PropstackTab';

// Im default-Case von renderTabContent():
default: {
    const addon = addonTabs.find((t) => t.slug === activeTab);
    if (!addon) return null;
    if (addon.slug === 'propstack') return <PropstackTab />;
    return <AddonTab name={addon.label} />;
}
```

## Security-Überlegungen

- **API-Key Speicherung:** Der Propstack API-Key wird in der WordPress Options-Tabelle gespeichert. Ausgabe im REST-Response mit maskiertem Key (nur letzte 4 Zeichen sichtbar): `****...ab3f`
- **Permission:** Alle Endpoints erfordern `manage_options` via `adminAccess()` (geerbt von RestController)
- **Sanitization:** `sanitize_text_field()` für API-Key, `absint()` für IDs, `rest_sanitize_boolean()` für Toggles
- **Escaping:** Alle Strings mit `esc_html__()` / `esc_attr()` in PHP
- **Non-blocking Sync:** Fehler beim Propstack-Sync blockieren nie die Lead-Erstellung
- **Freemius Gate:** Add-on prüft `resa_fs()->can_use_premium_code()` beim Bootstrap
- **RESA Dependency:** Add-on prüft `defined('RESA_VERSION')` und zeigt Admin-Notice wenn RESA fehlt

## Akzeptanzkriterien

- [ ] Add-on Plugin aktivierbar wenn RESA Premium aktiv
- [ ] Add-on zeigt Admin-Notice wenn RESA nicht aktiv oder nicht Premium
- [ ] Propstack-Tab erscheint unter Integrationen wenn Add-on aktiv
- [ ] API-Key eingeben → Verbindung testen → "X Makler gefunden"
- [ ] Falscher API-Key → "Verbindung fehlgeschlagen" mit Fehlermeldung
- [ ] Standorte werden mit Propstack-Maklern gemappt
- [ ] Standard-Makler als Fallback konfigurierbar
- [ ] Neuer Lead → Kontakt in Propstack erstellt (Name, E-Mail, Telefon, Beschreibung)
- [ ] Lead mit existierender E-Mail → Kontakt in Propstack aktualisiert
- [ ] Broker-Mapping: Lead aus "Berlin" → zugewiesener Propstack-Makler
- [ ] Aktivitäten: Task auf Kontakt erstellt mit Berechnungsdaten
- [ ] Aufgabe mit Fälligkeit: Task mit Reminder in X Werktagen
- [ ] Newsletter-DOI: Nur bei Newsletter-Consent gesendet
- [ ] Sync-Fehler: `propstack_error` gespeichert, Lead nicht blockiert
- [ ] Manueller Re-Sync: Button auf Lead-Detail funktioniert
- [ ] Sync-Status auf Lead-Detail sichtbar (synced/fehler/ausstehend)
- [ ] Einstellungen speichern → alle Felder korrekt persistiert
- [ ] Ohne API-Key → nur Verbindungs-Card sichtbar
- [ ] `npm run build` — Keine TypeScript-Fehler
- [ ] Tests grün (PHP + Vitest)

## Testplan

### PHP Unit Tests (Add-on)

**`tests/PropstackSettingsTest.php`:**

- `test_get_gibt_defaults_ohne_option`
- `test_update_merged_mit_defaults`
- `test_isEnabled_false_per_default`
- `test_getApiKey_leer_per_default`

**`tests/PropstackServiceTest.php`:**

- `test_testConnection_gibt_success_mit_broker_count`
- `test_testConnection_gibt_fehler_bei_falschem_key`
- `test_createContact_sendet_korrekte_daten`
- `test_findContactByEmail_gibt_null_wenn_nicht_gefunden`
- `test_request_setzt_api_key_header`
- `test_request_timeout_10_sekunden`

**`tests/PropstackSyncTest.php`:**

- `test_onLeadCreated_skipped_wenn_deaktiviert`
- `test_onLeadCreated_skipped_ohne_email`
- `test_onLeadCreated_skipped_wenn_bereits_synced`
- `test_syncLead_erstellt_kontakt_und_setzt_propstack_id`
- `test_syncLead_aktualisiert_existierenden_kontakt`
- `test_resolveBroker_nutzt_city_mapping`
- `test_resolveBroker_fallback_auf_default`
- `test_fehler_wird_in_propstack_error_gespeichert`
- `test_aktivitaet_erstellt_wenn_enabled`
- `test_newsletter_doi_nur_bei_consent`

### Vitest (RESA Core)

**`tests/js/hooks/usePropstack.test.ts`:**

- Query-Keys korrekt
- Mutations invalidieren Cache
- Brokers-Query nur enabled wenn API-Key vorhanden

**`tests/js/components/PropstackTab.test.tsx`:**

- Zeigt Spinner während Laden
- Zeigt Verbindungs-Card
- Zeigt nur Verbindungs-Card ohne API-Key
- Speichern-Button disabled wenn nicht dirty

## Offene Fragen

- [ ] **Freemius Product ID:** Muss in Freemius Dashboard angelegt werden bevor die SDK-Init konfiguriert werden kann.
- [ ] **API-Key Maskierung:** Soll der API-Key im REST-Response komplett maskiert werden (nur letzte 4 Zeichen) oder komplett ausgeblendet? → Empfehlung: Letzte 4 Zeichen, damit der User sieht dass ein Key hinterlegt ist.

## Abhängigkeiten

- `resa_lead_created` Action-Hook existiert (✅ `LeadsController.php:304`)
- `resa_integration_tabs` Filter existiert (✅ `AdminPage.php:110`)
- `RestController` Basisklasse existiert (✅ `includes/Api/RestController.php`)
- Integrations-Seite rendert Add-on-Tabs (✅ `Integrations.tsx:107-115`)
- `Resa\Models\Lead::findById()` verfügbar (✅ `includes/Models/Lead.php`)
- `useLocations()` Hook für Standort-Liste (✅ `src/admin/hooks/useLocations.ts`)

## Implementierungsreihenfolge

```
Batch 1 (Add-on Grundstruktur):
  1. resa-propstack.php       — Plugin Entry Point + Freemius Init
  2. composer.json             — Autoloading
  3. Plugin.php                — Bootstrap + Hook-Registrierung
  4. Migration.php             — DB-Spalten zu resa_leads

Batch 2 (Add-on Backend-Logik):
  5. PropstackSettings.php     — Settings CRUD
  6. PropstackService.php      — Propstack API HTTP-Client
  7. PropstackSync.php         — Lead-Sync-Logik
  8. PropstackController.php   — REST API Endpoints

Batch 3 (RESA Core Frontend):
  9. types/index.ts            — Propstack-Interfaces
  10. usePropstack.ts           — React Query Hooks
  11. PropstackTab.tsx          — Settings UI (4 Cards)
  12. Integrations.tsx          — Slug→Komponente Mapping

Batch 4 (Lead-Detail Integration):
  13. LeadsController.php      — formatDetail() erweitern
  14. Leads.tsx                 — Sync-Status Badge + Re-Sync Button

Batch 5 (Build & Distribution):
  15. scripts/create-zip.js    — ZIP-Erstellung
  16. package.json             — Version + Scripts
  17. deploy-propstack-freemius.yml — GitHub Action

Batch 6 (Tests):
  18. PropstackSettingsTest.php
  19. PropstackServiceTest.php
  20. PropstackSyncTest.php
  21. usePropstack.test.ts
  22. PropstackTab.test.tsx
```
