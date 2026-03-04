# SPEC: Datenschutz-Tab (DSGVO)

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Admin-Einstellungen (Datenschutz-Tab), WordPress Privacy Tools Integration, Datenaufbewahrung, E-Mail-Log-Retention, Lead-Löschung mit Kaskade

## Zusammenfassung

Der Datenschutz-Tab in den RESA-Einstellungen gibt Maklern Kontrolle über DSGVO-relevante Aspekte ihres Lead-Managements: Datenschutzerklärung-URL (zentral konfigurierbar statt hardcoded), Einwilligungstext anpassen, Datenaufbewahrungsfristen für Leads und E-Mail-Logs, sowie die Integration in WordPress' eigene Privacy-Tools (Datenexport & -löschung auf Nutzeranfrage). Damit wird RESA vollständig DSGVO-konform, einschließlich Art. 15 (Auskunft), Art. 17 (Löschung) und Art. 20 (Datenübertragbarkeit).

## Ist-Zustand (bereits implementiert)

| Komponente                                  | Status | Datei                                                       |
| ------------------------------------------- | ------ | ----------------------------------------------------------- |
| Consent-Checkbox (Pflichtfeld)              | Fertig | `src/frontend/components/shared/LeadForm.tsx`               |
| consent_given + consent_text + consent_date | Fertig | `includes/Models/Lead.php`, `resa_leads` Tabelle            |
| Newsletter Opt-In (separates Häkchen)       | Fertig | `src/frontend/types/lead-form.ts`                           |
| Privacy-URL als Link in Checkbox-Text       | Fertig | `src/frontend/types/lead-form.ts` (Default: `/datenschutz`) |
| Two-Phase Lead Capture (Partial ohne PII)   | Fertig | `includes/Models/Lead.php`                                  |
| Partial Lead Auto-Löschung (Cron)           | Fertig | `includes/Cron/PartialLeadCleanup.php`                      |
| Google Maps Consent-Dialog                  | Fertig | `src/frontend/components/map/GoogleMapConsent.tsx`          |
| Hard Delete für Leads (Art. 17)             | Fertig | `Lead::delete()`                                            |
| E-Mail-Logging                              | Fertig | `includes/Services/Email/EmailLogger.php`                   |
| GdprTab Placeholder ("Kommt bald")          | Fertig | `src/admin/pages/Settings.tsx`                              |

### Lücken im Ist-Zustand

| Lücke                                                             | DSGVO-Relevanz                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Privacy-URL nur per LeadForm-Config, nicht zentral konfigurierbar | Makler kann URL nicht ändern ohne Code                            |
| Einwilligungstext nicht anpassbar                                 | Makler kann Formulierung nicht an seine Kanzlei anpassen          |
| Keine WP Privacy Hooks (Exporter/Eraser)                          | Art. 15 + Art. 17 nicht über WordPress Tools erfüllbar            |
| E-Mail-Logs wachsen unbegrenzt                                    | Keine Aufbewahrungsfrist, enthält personenbezogene Daten (E-Mail) |
| Lead-Löschung löscht E-Mail-Logs nicht mit                        | Verwaiste Logs mit PII nach Lead-Löschung                         |
| Completed Leads haben keine Auto-Löschung                         | Art. 5(1)(e) Speicherbegrenzung nicht umgesetzt                   |
| Kein Lead-Anonymisierungs-Modus                                   | Alternativ zu Löschung für statistische Auswertung                |

## Betroffene Dateien

### Neue Dateien

| Datei                                        | Beschreibung                                          |
| -------------------------------------------- | ----------------------------------------------------- |
| `includes/Api/PrivacySettingsController.php` | REST GET/PUT für Datenschutz-Einstellungen            |
| `includes/Privacy/PersonalDataExporter.php`  | WordPress Personal Data Exporter (Art. 15/20)         |
| `includes/Privacy/PersonalDataEraser.php`    | WordPress Personal Data Eraser (Art. 17)              |
| `includes/Cron/DataRetentionCleanup.php`     | WP-Cron für Lead- und E-Mail-Log-Aufbewahrungsfristen |
| `src/admin/hooks/usePrivacySettings.ts`      | React Query Hooks für Datenschutz-Settings            |
| `src/admin/components/settings/GdprTab.tsx`  | Datenschutz-Einstellungen UI (ersetzt Placeholder)    |

### Geänderte Dateien

| Datei                                     | Änderung                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| `includes/Core/Plugin.php`                | Privacy Hooks + Cron + Controller registrieren                               |
| `includes/Models/Lead.php`                | `delete()` erweitern: E-Mail-Logs kaskadiert löschen + `anonymize()` Methode |
| `includes/Services/Email/EmailLogger.php` | `deleteByLead()` + `deleteOlderThan()` Methoden                              |
| `includes/Shortcode/ResaShortcode.php`    | Privacy-URL aus zentraler Einstellung lesen                                  |
| `src/admin/pages/Settings.tsx`            | Placeholder durch echte `GdprTab` Komponente ersetzen                        |
| `src/admin/types/index.ts`                | `PrivacySettings` Interface                                                  |
| `src/frontend/types/lead-form.ts`         | Privacy-URL aus `resaFrontend.privacyUrl` lesen                              |

## API-Änderungen

### Neue Endpoints

| Methode | Route                             | Beschreibung                        | Auth  |
| ------- | --------------------------------- | ----------------------------------- | ----- |
| GET     | `/resa/v1/admin/privacy-settings` | Datenschutz-Einstellungen laden     | Admin |
| PUT     | `/resa/v1/admin/privacy-settings` | Datenschutz-Einstellungen speichern | Admin |

### Bestehende Endpoints (Änderung)

| Methode | Route                       | Änderung                                  |
| ------- | --------------------------- | ----------------------------------------- |
| DELETE  | `/resa/v1/admin/leads/{id}` | E-Mail-Logs werden kaskadiert mitgelöscht |

## Datenbank-Änderungen

### Keine neuen Tabellen

Alle benötigten Tabellen existieren bereits.

### Neue wp_options

| Option-Key              | Typ  | Default | Beschreibung                                  |
| ----------------------- | ---- | ------- | --------------------------------------------- |
| `resa_privacy_settings` | JSON | `{}`    | Alle Datenschutz-Einstellungen als ein Objekt |

**Struktur von `resa_privacy_settings`:**

```json
{
	"privacy_url": "",
	"consent_text": "Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.",
	"newsletter_text": "Ja, ich möchte Markt-Updates per E-Mail erhalten.",
	"lead_retention_days": 0,
	"email_log_retention_days": 365,
	"anonymize_instead_of_delete": false
}
```

| Feld                          | Beschreibung                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| `privacy_url`                 | URL zur Datenschutzerklärung. Leer = WordPress Privacy Page (`get_privacy_policy_url()`) |
| `consent_text`                | Einwilligungstext mit `[Datenschutzerklärung]` als Platzhalter für den Link              |
| `newsletter_text`             | Newsletter-Opt-In Text                                                                   |
| `lead_retention_days`         | Tage bis zur Auto-Löschung abgeschlossener Leads. `0` = unbegrenzt                       |
| `email_log_retention_days`    | Tage bis zur Auto-Löschung von E-Mail-Logs. `0` = unbegrenzt                             |
| `anonymize_instead_of_delete` | Bei Auto-Retention: Leads anonymisieren statt löschen (für Statistik)                    |

## Modul-Klassifizierung

| Eigenschaft    | Wert                             |
| -------------- | -------------------------------- |
| **Typ**        | Kern-Feature                     |
| **Modul-Flag** | Nicht zutreffend — Komplett Free |
| **Modul-Slug** | Nicht zutreffend                 |

## Free vs. Premium

| Feature-Aspekt                            | Free | Pro |
| ----------------------------------------- | ---- | --- |
| Privacy-URL konfigurieren                 | Ja   | Ja  |
| Einwilligungstext anpassen                | Ja   | Ja  |
| Newsletter-Text anpassen                  | Ja   | Ja  |
| WordPress Privacy Tools (Export/Löschung) | Ja   | Ja  |
| Lead-Aufbewahrungsfrist                   | Ja   | Ja  |
| E-Mail-Log-Aufbewahrungsfrist             | Ja   | Ja  |
| Anonymisierung statt Löschung             | Ja   | Ja  |

**Begründung:** DSGVO-Compliance ist kein Premium-Feature. Jeder Makler muss seine Datenschutzpflichten erfüllen können, unabhängig vom Plan. Das reduziert auch unser eigenes Haftungsrisiko.

## UI/UX

### Datenschutz-Tab in Einstellungen

```
Einstellungen
├── Maklerdaten | Team | Branding | Karten | Tracking | Datenschutz
                                                         ^^^^^^^^^^^
```

### Wireframe: Datenschutz-Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Datenschutz (DSGVO)                                            │
│                                                                 │
│  ─── Einwilligung ─────────────────────────────── Card ──────   │
│                                                                 │
│  Datenschutzerklärung-URL                                       │
│  [https://example.com/datenschutz                          ]    │
│  Leer = WordPress-Datenschutzseite (Einstellungen → Datenschutz)│
│                                                                 │
│  Einwilligungstext                                              │
│  [Ich stimme der Verarbeitung meiner Daten gemäß der        ]   │
│  [[Datenschutzerklärung] zu.                                ]   │
│  Platzhalter [Datenschutzerklärung] wird als Link dargestellt.  │
│                                                                 │
│  Newsletter Opt-In Text                                         │
│  [Ja, ich möchte Markt-Updates per E-Mail erhalten.         ]   │
│                                                                 │
│  ─── Datenaufbewahrung ────────────────────────── Card ──────   │
│                                                                 │
│  Abgeschlossene Leads automatisch löschen                       │
│  nach [▼ Unbegrenzt           ] Tagen                           │
│                                                                 │
│  Optionen: Unbegrenzt, 90 Tage, 180 Tage, 365 Tage, 730 Tage  │
│                                                                 │
│  Anonymisieren statt Löschen:  [Toggle: Aus]                    │
│  Personenbezogene Daten werden entfernt, anonymisierte          │
│  Eingaben bleiben für die Statistik erhalten.                   │
│                                                                 │
│  E-Mail-Protokoll automatisch löschen                           │
│  nach [▼ 365 Tage            ] Tagen                           │
│                                                                 │
│  Optionen: 90 Tage, 180 Tage, 365 Tage, Unbegrenzt            │
│                                                                 │
│  ─── WordPress Privacy Tools ──────────────────── Card ──────   │
│                                                                 │
│  ✓  RESA ist in die WordPress-Datenschutzwerkzeuge integriert.  │
│                                                                 │
│  Unter Werkzeuge → Personenbezogene Daten exportieren           │
│  und Werkzeuge → Personenbezogene Daten löschen können Sie      │
│  Anfragen nach Art. 15 und Art. 17 DSGVO bearbeiten.           │
│                                                                 │
│  Exportierte Daten:                                             │
│  • Lead-Stammdaten (Name, E-Mail, Telefon)                     │
│  • Einwilligungsinformation (Text, Datum)                       │
│  • Berechnungseingaben und -ergebnisse                          │
│  • E-Mail-Protokoll                                             │
│                                                                 │
│  Bei Löschung werden entfernt:                                  │
│  • Alle Lead-Datensätze mit der E-Mail-Adresse                 │
│  • Zugehörige E-Mail-Protokolleinträge                         │
│  • Tracking wird nicht gelöscht (anonymisiert, kein PII)       │
│                                                                 │
│  [Speichern]                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementierungsdetails

### Backend: PrivacySettingsController

```php
// includes/Api/PrivacySettingsController.php

class PrivacySettingsController extends RestController {

    private const OPTION_KEY = 'resa_privacy_settings';

    private const DEFAULTS = [
        'privacy_url'                  => '',
        'consent_text'                 => 'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
        'newsletter_text'              => 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
        'lead_retention_days'          => 0,
        'email_log_retention_days'     => 365,
        'anonymize_instead_of_delete'  => false,
    ];

    public function registerRoutes(): void;
    // GET  /admin/privacy-settings → show()
    // PUT  /admin/privacy-settings → update()

    public function show(): WP_REST_Response;
    // Liest wp_option, merged mit DEFAULTS

    public function update(WP_REST_Request $request): WP_REST_Response;
    // Validiert + sanitized + speichert

    public static function get(): array;
    // Statisch abrufbar für andere Services (z.B. Frontend-Config)

    public static function getPrivacyUrl(): string;
    // Gibt konfigurierte URL zurück, Fallback auf get_privacy_policy_url()
}
```

### Backend: WordPress Personal Data Exporter

```php
// includes/Privacy/PersonalDataExporter.php

class PersonalDataExporter {

    public static function register(): void;
    // add_filter('wp_privacy_personal_data_exporters', ...)

    public static function export(string $email, int $page = 1): array;
    // Sucht Leads per E-Mail → exportiert:
    // - Lead-Stammdaten (Name, E-Mail, Telefon, Firma)
    // - Einwilligungsinformation (consent_text, consent_date)
    // - Berechnungseingaben (inputs JSON → aufgelöst)
    // - Berechnungsergebnisse (result JSON → aufgelöst)
    // - E-Mail-Protokoll (Betreff, Datum, Status)
    //
    // Rückgabe-Format: WordPress Standard
    // ['data' => [['group_id' => 'resa-leads', 'item_id' => ..., 'data' => [...]]], 'done' => true]
}
```

### Backend: WordPress Personal Data Eraser

```php
// includes/Privacy/PersonalDataEraser.php

class PersonalDataEraser {

    public static function register(): void;
    // add_filter('wp_privacy_personal_data_erasers', ...)

    public static function erase(string $email, int $page = 1): array;
    // Sucht Leads per E-Mail → löscht:
    // - Alle Lead-Datensätze (oder anonymisiert, je nach Einstellung)
    // - Zugehörige E-Mail-Log-Einträge
    // - Tracking-Daten NICHT löschen (anonymisiert, kein PII)
    //
    // Wenn anonymize_instead_of_delete aktiviert:
    // - Entfernt: first_name, last_name, email, phone, company, message, gclid, fbclid
    // - Setzt: consent_given = 0, consent_text = NULL, consent_date = NULL
    // - Behält: inputs, result, meta, asset_type, location_id (für Statistik)
    // - Setzt: status = 'anonymized'
    //
    // Rückgabe-Format: WordPress Standard
    // ['items_removed' => N, 'items_retained' => M, 'messages' => [...], 'done' => true]
}
```

### Backend: DataRetentionCleanup (Cron)

```php
// includes/Cron/DataRetentionCleanup.php

class DataRetentionCleanup {

    public static function register(): void;
    // add_action('resa_data_retention_cleanup', [self::class, 'cleanup'])
    // wp_schedule_event('daily')

    public static function cleanup(): void;
    // 1. Lead Retention: Wenn lead_retention_days > 0
    //    → Leads mit completed_at < NOW() - retention_days
    //    → Entweder löschen oder anonymisieren (je nach Einstellung)
    //    → Bei Löschung: E-Mail-Logs kaskadiert löschen
    //
    // 2. Email Log Retention: Wenn email_log_retention_days > 0
    //    → Logs mit sent_at < NOW() - retention_days löschen

    public static function unschedule(): void;
    // Für Plugin-Deaktivierung
}
```

### Backend: Lead::delete() erweitern

```php
// includes/Models/Lead.php — Bestehende delete() Methode erweitern

public static function delete(int $id): bool {
    global $wpdb;

    // Zuerst E-Mail-Logs löschen (Kaskade)
    EmailLogger::deleteByLead($id);

    // Dann Lead löschen
    $result = $wpdb->delete(self::table(), ['id' => $id], ['%d']);
    return $result !== false;
}

// Neue Methode:
public static function anonymize(int $id): bool {
    // Entfernt PII, behält anonyme Daten für Statistik
    // Setzt status = 'anonymized'
}
```

### Backend: EmailLogger erweitern

```php
// includes/Services/Email/EmailLogger.php — Neue Methoden

public static function deleteByLead(int $leadId): int;
// DELETE FROM resa_email_log WHERE lead_id = %d
// Returns: Anzahl gelöschter Einträge

public static function deleteOlderThan(int $days): int;
// DELETE FROM resa_email_log WHERE sent_at < DATE_SUB(NOW(), INTERVAL %d DAY)
// Returns: Anzahl gelöschter Einträge
```

### Backend: Privacy-URL an Frontend übergeben

```php
// includes/Shortcode/ResaShortcode.php — Ergänzen

$privacyUrl = PrivacySettingsController::getPrivacyUrl();

// In wp_localize_script:
'privacyUrl' => $privacyUrl,
'consentText' => $privacySettings['consent_text'],
'newsletterText' => $privacySettings['newsletter_text'],
```

### Frontend: GdprTab Komponente

Drei Cards mit Inline-Styles (Pattern wie TrackingTab/AgentDataForm):

1. **Einwilligung** — Privacy-URL Input, Consent-Text Textarea, Newsletter-Text Textarea
2. **Datenaufbewahrung** — Select für Lead-Retention, Toggle für Anonymisierung, Select für E-Mail-Log-Retention
3. **WordPress Privacy Tools** — Nur Info-Card (read-only), erklärt die WP-Integration

### Frontend: usePrivacySettings Hook

```typescript
// src/admin/hooks/usePrivacySettings.ts (Muster: useTrackingSettings)

export function usePrivacySettings(): UseQueryResult<PrivacySettings>;
// GET /admin/privacy-settings

export function useSavePrivacySettings(): UseMutationResult;
// PUT /admin/privacy-settings
```

### Frontend: Types

```typescript
// src/admin/types/index.ts

export interface PrivacySettings {
	privacy_url: string;
	consent_text: string;
	newsletter_text: string;
	lead_retention_days: number;
	email_log_retention_days: number;
	anonymize_instead_of_delete: boolean;
}
```

## Validierung

### PHP (PrivacySettingsController)

| Feld                          | Regel                                                     |
| ----------------------------- | --------------------------------------------------------- |
| `privacy_url`                 | string, max 500, `esc_url_raw()`, leer erlaubt            |
| `consent_text`                | string, max 1000, muss `[Datenschutzerklärung]` enthalten |
| `newsletter_text`             | string, max 500, leer erlaubt                             |
| `lead_retention_days`         | int, erlaubte Werte: 0, 90, 180, 365, 730                 |
| `email_log_retention_days`    | int, erlaubte Werte: 0, 90, 180, 365                      |
| `anonymize_instead_of_delete` | boolean                                                   |

### WordPress Personal Data Exporter

| Feld     | Validierung                 |
| -------- | --------------------------- |
| `$email` | `is_email()` muss true sein |
| `$page`  | int >= 1                    |

## Akzeptanzkriterien

### Einwilligungstext

- [ ] Privacy-URL ist zentral konfigurierbar über Datenschutz-Tab
- [ ] Leeres Privacy-URL-Feld → Fallback auf WordPress-Datenschutzseite (`get_privacy_policy_url()`)
- [ ] Consent-Text wird im Frontend-Widget verwendet (statt hardcoded Default)
- [ ] Platzhalter `[Datenschutzerklärung]` wird als klickbarer Link dargestellt
- [ ] Newsletter-Text wird im Frontend-Widget verwendet
- [ ] Änderungen sofort wirksam nach Speichern (kein Cache-Problem)

### WordPress Privacy Tools

- [ ] RESA registriert sich als Personal Data Exporter
- [ ] Unter Werkzeuge → "Personenbezogene Daten exportieren" → E-Mail eingeben → RESA-Daten erscheinen
- [ ] Export enthält: Lead-Stammdaten, Einwilligung, Berechnungseingaben, Ergebnisse, E-Mail-Log
- [ ] RESA registriert sich als Personal Data Eraser
- [ ] Unter Werkzeuge → "Personenbezogene Daten löschen" → E-Mail eingeben → RESA-Daten werden gelöscht
- [ ] Bei `anonymize_instead_of_delete = true`: PII wird entfernt, Statistik-Daten bleiben
- [ ] Bei Löschung werden E-Mail-Log-Einträge mitgelöscht

### Datenaufbewahrung

- [ ] Lead-Retention: Cron löscht/anonymisiert Leads älter als X Tage (completed_at basiert)
- [ ] E-Mail-Log-Retention: Cron löscht Logs älter als X Tage (sent_at basiert)
- [ ] `lead_retention_days = 0` → keine automatische Löschung
- [ ] Partial Leads werden weiterhin vom bestehenden PartialLeadCleanup-Cron verwaltet
- [ ] Anonymisierte Leads (`status = 'anonymized'`) werden von der Lead-Liste ausgeblendet

### Kaskadierte Löschung

- [ ] `Lead::delete()` löscht zugehörige E-Mail-Log-Einträge mit
- [ ] Keine verwaisten E-Mail-Logs nach Lead-Löschung

### UI

- [ ] Datenschutz-Tab zeigt drei Cards (Einwilligung, Datenaufbewahrung, WP Privacy Tools)
- [ ] Speichern-Button nur aktiv wenn Änderungen vorliegen (isDirty Pattern)
- [ ] Style konsistent mit TrackingTab und AgentDataTab (Inline-Styles, `resa-` Prefix)
- [ ] Info-Card für WP Privacy Tools ist read-only (keine Eingabefelder)

## Security-Überlegungen

- **Privacy-Settings nur Admin** — `adminAccess()` Permission-Callback
- **Consent-Text sanitizen** — `wp_kses()` mit eingeschränkten Tags (kein Script/Iframe)
- **Privacy-URL validieren** — `esc_url_raw()`, nur http/https
- **E-Mail im Exporter/Eraser** — `sanitize_email()` + `is_email()` Prüfung
- **Anonymisierung irreversibel** — Nach Anonymisierung sind PII unwiderruflich gelöscht
- **Cron Batch-Limits** — Max 500 Leads/Logs pro Durchlauf, um Timeouts zu vermeiden
- **SQL-Injection** — Alle Queries mit `$wpdb->prepare()`

## Testplan

### Unit Tests (PHP)

- **PrivacySettingsControllerTest** — CRUD, Validation, Defaults, Sanitization, Privacy-URL Fallback
- **PersonalDataExporterTest** — Export mit Leads, ohne Leads, Pagination, Datenformat
- **PersonalDataEraserTest** — Löschung, Anonymisierung, Kaskade, ohne Leads
- **DataRetentionCleanupTest** — Lead-Retention, E-Mail-Log-Retention, Batch-Limit, 0 = unbegrenzt
- **Lead::anonymize()** — PII entfernt, inputs/result erhalten, Status = anonymized

### Unit Tests (JS/TS)

- **usePrivacySettings.test.ts** — Hook-Tests (Load, Save, Error)
- **GdprTab.test.tsx** — Rendering, Formularfelder, Speichern, Validierung

### Integration Tests

- WordPress Privacy Export: Request stellen → Export-ZIP enthält RESA-Daten
- WordPress Privacy Erase: Request stellen → Leads + Logs gelöscht
- Retention-Cron: Leads anlegen mit altem Datum → Cron ausführen → gelöscht

## Offene Fragen

Keine — Scope ist klar abgegrenzt, alle Bausteine existieren bereits.

## Abhängigkeiten

- **Lead.php** — bereits implementiert (delete, createPartial, complete)
- **EmailLogger.php** — bereits implementiert (log, findByLead)
- **PartialLeadCleanup.php** — bereits implementiert (bleibt unverändert)
- **PrivacySettingsController** — Muster: TrackingSettingsController (bereits implementiert)
- **GdprTab** — Muster: TrackingTab (bereits implementiert)

## Implementierungsreihenfolge

```
Phase 1 — Backend: Einstellungen + Kaskade
  1. PrivacySettingsController.php      — REST API für Settings
  2. EmailLogger::deleteByLead()        — Kaskadierte Löschung
  3. EmailLogger::deleteOlderThan()     — Retention-Cleanup
  4. Lead::delete() erweitern           — E-Mail-Logs mitlöschen
  5. Lead::anonymize()                  — PII entfernen, Statistik behalten
  6. Plugin.php                         — Controller registrieren

Phase 2 — Backend: WordPress Privacy Tools
  7. PersonalDataExporter.php           — WP Export Hook
  8. PersonalDataEraser.php             — WP Erase Hook
  9. Plugin.php                         — Privacy Hooks registrieren

Phase 3 — Backend: Datenaufbewahrung
  10. DataRetentionCleanup.php          — Cron für Retention
  11. Plugin.php                        — Cron registrieren

Phase 4 — Frontend: Settings UI
  12. types/index.ts                    — PrivacySettings Interface
  13. usePrivacySettings.ts             — React Query Hooks
  14. GdprTab.tsx                       — Datenschutz-Einstellungen UI
  15. Settings.tsx                      — Placeholder ersetzen

Phase 5 — Frontend: Widget-Integration
  16. ResaShortcode.php                 — Privacy-URL + Texte an Frontend übergeben
  17. lead-form.ts / LeadForm.tsx       — Texte aus resaFrontend lesen

Phase 6 — Tests
  18. PHP Unit Tests
  19. JS Unit Tests
```
