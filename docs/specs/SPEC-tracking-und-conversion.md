# SPEC: Tracking & Conversion

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Frontend-Widget (Tracking-Events verdrahten), Admin-Einstellungen (Tracking-Tab), Admin-Seite (Analytics/Funnel), dataLayer/GTM-Integration, Google Ads Conversion-Tags, GCLID/UTM-Erfassung, Partial-Lead-Cleanup

## Zusammenfassung

RESA trackt den kompletten Funnel (Widget-Impression → Rechner-Start → Schritte → Formular → Lead → Ergebnis) und pusht Events sowohl intern (WordPress-DB für eigene Analytics) als auch extern (dataLayer für GTM / Google Ads). Makler können direkt in den RESA-Einstellungen ihre Google Ads Conversion-IDs eintragen — ohne GTM-Setup. Dazu eine eigene Analytics-Seite mit Funnel-Visualisierung.

## Ist-Zustand (bereits implementiert)

| Komponente                         | Status      | Datei                                            |
| ---------------------------------- | ----------- | ------------------------------------------------ |
| TrackingService (PHP)              | Fertig      | `includes/Services/Tracking/TrackingService.php` |
| TrackingController (REST API)      | Fertig      | `includes/Api/TrackingController.php`            |
| Lead::createPartial() + complete() | Fertig      | `includes/Models/Lead.php`                       |
| resa_tracking_daily Tabelle        | Fertig      | `includes/Database/Schema.php`                   |
| resa_leads mit gclid/fbclid        | Fertig      | `includes/Database/Schema.php`                   |
| session.ts (UUID)                  | Fertig      | `src/frontend/lib/session.ts`                    |
| tracking.ts (trackEvent)           | Grundgerüst | `src/frontend/lib/tracking.ts`                   |
| GET /analytics/funnel              | Fertig      | `includes/Api/TrackingController.php`            |
| POST /tracking                     | Fertig      | `includes/Api/TrackingController.php`            |
| Dashboard KPI-Cards                | Fertig      | `src/admin/pages/Dashboard.tsx`                  |

## Betroffene Dateien

### Neue Dateien

- `src/frontend/lib/datalayer.ts` — dataLayer Push + Google Ads gtag Conversion-Firing
- `src/frontend/lib/url-params.ts` — GCLID/FBCLID/UTM Capture aus URL → sessionStorage
- `includes/Api/TrackingSettingsController.php` — REST CRUD für Tracking-Einstellungen (wp_options)
- `includes/Cron/PartialLeadCleanup.php` — WP-Cron Job für abgelaufene Partial Leads
- `src/admin/hooks/useTrackingSettings.ts` — React Query Hooks für Tracking-Einstellungen
- `src/admin/hooks/useAnalytics.ts` — React Query Hook für Funnel-Daten
- `src/admin/components/settings/TrackingTab.tsx` — Tracking-Einstellungen UI
- `src/admin/pages/Analytics.tsx` — Funnel-Analytics-Seite

### Geänderte Dateien

- `src/frontend/lib/tracking.ts` — dataLayer-Push integrieren, UTM/Click-IDs mitsenden
- `src/frontend/components/shared/StepWizard.tsx` — trackEvent-Calls bei Step-Wechsel einbauen _(oder vergleichbare Wizard-Komponente)_
- `src/frontend/components/shared/LeadForm.tsx` — form_view, form_interact, form_submit Events _(oder vergleichbare Form-Komponente)_
- `includes/Core/Plugin.php` — Cron registrieren, TrackingSettingsController registrieren
- `includes/Freemius/FeatureGate.php` — `canUseAdvancedTracking()` + `toArray()`
- `src/admin/types/index.ts` — TrackingSettings, FunnelData Interfaces + FeatureGate
- `src/admin/hooks/useFeatures.ts` — Default `can_use_advanced_tracking: false`
- `src/admin/pages/Settings.tsx` — Neuer "Tracking"-Tab
- `src/admin/pages/App.tsx` — Neue Route `/analytics`
- `includes/Admin/AdminPage.php` — Neuer Menüpunkt "Analytics"

## API-Änderungen

### Neue Endpoints

| Methode | Route                              | Beschreibung                     | Auth  |
| ------- | ---------------------------------- | -------------------------------- | ----- |
| GET     | `/resa/v1/admin/tracking-settings` | Tracking-Einstellungen laden     | Admin |
| PUT     | `/resa/v1/admin/tracking-settings` | Tracking-Einstellungen speichern | Admin |

### Bestehende Endpoints (unverändert)

| Methode | Route                       | Beschreibung      | Hinweis               |
| ------- | --------------------------- | ----------------- | --------------------- |
| POST    | `/resa/v1/tracking`         | Event aufzeichnen | Bereits implementiert |
| GET     | `/resa/v1/analytics/funnel` | Funnel-Daten      | Bereits implementiert |

## Datenbank-Änderungen

### Keine neuen Tabellen

Alle benötigten Tabellen existieren bereits (`resa_tracking_daily`, `resa_leads`).

### Neue wp_options

| Option-Key               | Typ  | Default | Beschreibung                               |
| ------------------------ | ---- | ------- | ------------------------------------------ |
| `resa_tracking_settings` | JSON | `{}`    | Alle Tracking-Einstellungen als ein Objekt |

**Struktur von `resa_tracking_settings`:**

```json
{
	"funnel_tracking_enabled": true,
	"partial_leads_enabled": true,
	"partial_lead_ttl_days": 30,
	"datalayer_enabled": true,
	"google_ads": {
		"form_view_conversion_id": "",
		"form_view_conversion_label": "",
		"form_submit_conversion_id": "",
		"form_submit_conversion_label": ""
	},
	"enhanced_conversions_enabled": false,
	"gclid_capture_enabled": true,
	"utm_capture_enabled": true
}
```

## Modul-Klassifizierung

| Eigenschaft    | Wert                                     |
| -------------- | ---------------------------------------- |
| **Typ**        | Kern-Feature                             |
| **Modul-Flag** | Nicht zutreffend — Teils Free, teils Pro |
| **Modul-Slug** | Nicht zutreffend                         |

## Free vs. Premium

| Feature-Aspekt                          | Free       | Pro          |
| --------------------------------------- | ---------- | ------------ |
| dataLayer Events pushen                 | Ja         | Ja           |
| Internes Funnel-Tracking (DB)           | Ja         | Ja           |
| Google Ads Conversion-IDs eintragen     | Ja         | Ja           |
| GCLID/FBCLID Capture + Speicherung      | Nein       | Ja           |
| UTM-Parameter Capture                   | Nein       | Ja           |
| Enhanced Conversions (gehashte E-Mail)  | Nein       | Ja           |
| Partial Leads speichern                 | Nein       | Ja           |
| Funnel-Analytics-Seite (Visualisierung) | Nur Zahlen | Volle Charts |
| Tracking-Einstellungen (Toggles, TTL)   | Nein       | Ja           |

**Wichtig:** dataLayer + Google Ads Conversion-IDs funktionieren auch in Free! Das ist der Kern-Mehrwert. Die erweiterten Features (GCLID, UTM, Partial Leads, volle Analytics) sind Pro.

## UI/UX

### 1. Tracking-Tab in Einstellungen

Neuer Tab "Tracking" in der bestehenden Settings-Seite.

```
Einstellungen
├── Maklerdaten | Team | Branding | Karten | Tracking | Lizenz | Datenschutz
                                              ^^^^^^^^
```

#### Wireframe: Tracking-Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Tracking & Conversion                                          │
│                                                                 │
│  ─── Google Ads Conversions ──────────────────────── Card ──    │
│                                                                 │
│  RESA kann Google Ads Conversions direkt auslösen,             │
│  ohne dass Sie GTM konfigurieren müssen.                       │
│                                                                 │
│  Sekundäre Conversion: "Formular erreicht"                     │
│  (Beobachtung — beeinflusst Smart Bidding nicht)               │
│  Conversion-ID:    [AW-123456789                         ]     │
│  Conversion-Label: [abcDEFghiJKL                         ]     │
│                                                                 │
│  Primäre Conversion: "Lead generiert"                          │
│  (Bidding-relevant — Smart Bidding optimiert darauf)           │
│  Conversion-ID:    [AW-123456789                         ]     │
│  Conversion-Label: [mnoPQRstuVWX                         ]     │
│                                                                 │
│  ─── dataLayer Events ────────────────────────────── Card ──    │
│                                                                 │
│  dataLayer Push:  [Toggle: An]                                 │
│  Events werden in den Google Tag Manager dataLayer             │
│  gepusht. GTM muss separat installiert sein.                   │
│                                                                 │
│  Verfügbare Events:                                            │
│  ┌────────────────────┬─────────────────────────────────┐      │
│  │ resa_asset_view    │ Widget wird sichtbar             │      │
│  │ resa_asset_start   │ Erste Interaktion                │      │
│  │ resa_step_complete │ Frageschritt abgeschlossen       │      │
│  │ resa_form_view     │ ★ Formular angezeigt             │      │
│  │ resa_form_interact │ Erstes Feld fokussiert           │      │
│  │ resa_form_submit   │ ★★ Formular abgesendet           │      │
│  │ resa_result_view   │ Ergebnis angezeigt               │      │
│  └────────────────────┴─────────────────────────────────┘      │
│                                                                 │
│  ─── Erweitert ────────────────── Card ── 🔒 Premium ───────   │
│                                                                 │
│  Enhanced Conversions:  [Toggle: Aus]                          │
│  Gehashte E-Mail wird bei Lead-Generierung an                  │
│  den dataLayer übergeben (verbessert Attribution 10-30%)       │
│                                                                 │
│  GCLID speichern:       [Toggle: An]                           │
│  Google Click ID wird automatisch erfasst                      │
│  und mit dem Lead gespeichert                                  │
│                                                                 │
│  UTM-Parameter:         [Toggle: An]                           │
│  utm_source, utm_medium, utm_campaign werden                   │
│  mit dem Lead gespeichert                                      │
│                                                                 │
│  Partial Leads:         [Toggle: An]                           │
│  Anonymisierte Eingaben speichern wenn Besucher                │
│  das Formular erreichen aber nicht absenden                    │
│                                                                 │
│  Partial Lead TTL:      [▼ 30 Tage]                            │
│  Automatische Löschung abgelaufener Partial Leads              │
│                                                                 │
│  [Speichern]                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Analytics-Seite (neuer Menüpunkt)

```
RESA Admin
├── Dashboard
├── Analytics  ← NEU
├── Leads
├── Smart Assets
├── Standorte
├── Vorlagen
├── Integrationen
└── Einstellungen
```

#### Wireframe: Analytics-Seite

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics                                                      │
│                                                                 │
│  Asset: [▼ Alle]    Standort: [▼ Alle]    Zeitraum: [▼ 30 T]  │
│                                                                 │
│  ─── KPI-Leiste ────────────────────────────────────────────    │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │   2.340  │  │   1.450  │  │    920   │  │    480   │       │
│  │  Views   │  │  Starts  │  │ Formular │  │  Leads   │       │
│  │          │  │   62,0%  │  │   63,4%  │  │  52,2%   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ─── Funnel-Chart ─────────────────────────────── Card ─────    │
│                                                                 │
│  Widget gesehen        ████████████████████████████  2.340      │
│                                                                 │
│  Rechner gestartet     █████████████████████         1.450 62%  │
│                                                                 │
│  Formular erreicht     ████████████████               920 63%   │
│                                                                 │
│  Formular interagiert  ███████████                     640 70%  │
│                                                                 │
│  Lead generiert        ████████                        480 75%  │
│                                                                 │
│  Ergebnis angezeigt    ████████                        470 98%  │
│                                                                 │
│  ─── Verlauf ──────────────────────────────── Card ─────────    │
│                                                                 │
│  [Line-Chart: Views / Starts / Leads über Zeitraum]            │
│  X-Achse: Tage                                                 │
│  Y-Achse: Anzahl                                               │
│  3 Linien: Views (grau), Starts (blau), Leads (grün)          │
│                                                                 │
│  ─── Conversion-Rates ──────────────────── Card ────────────    │
│                                                                 │
│  Start-Rate:       62,0%  (Starts / Views)                     │
│  Completion-Rate:  63,4%  (Formular / Starts)                  │
│  Conversion-Rate:  52,2%  (Leads / Formular)                   │
│  Gesamt-Rate:      20,5%  (Leads / Views)                      │
│                                                                 │
│  🔒 Premium ── Partial Lead Statistik ── Card ─────────────    │
│                                                                 │
│  Partial Leads (nicht abgesendet):  440                        │
│  Formular-Abbruchrate:              47,8%                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Free-Version:** Zeigt KPI-Leiste + Conversion-Rates als Zahlen. Funnel-Chart und Verlauf-Chart nur mit Upgrade-CTA.

### 3. Frontend-Widget (unsichtbar)

Keine UI-Änderung im Widget. Die Tracking-Events werden unsichtbar im Hintergrund gefeuert:

- `resa_asset_view` — Widget wird sichtbar (IntersectionObserver)
- `resa_asset_start` — Erste Interaktion (erster Step-Klick)
- `resa_step_complete` — Jeder abgeschlossene Schritt
- `resa_form_view` — LeadForm wird angezeigt
- `resa_form_interact` — Erstes Feld fokussiert
- `resa_form_submit` — Formular abgesendet
- `resa_result_view` — Ergebnis angezeigt

## Implementierungsdetails

### Frontend: dataLayer + Google Ads

```typescript
// src/frontend/lib/datalayer.ts

interface ResaDataLayerEvent {
	event: string;
	resa_asset_type: string;
	resa_location?: string;
	resa_step?: number;
	resa_step_total?: number;
	resa_funnel_stage: 'impression' | 'questions' | 'form' | 'result';
	resa_session_id: string;
	resa_conversion_value?: number;
}

/**
 * Push event an window.dataLayer (für GTM).
 * Nur wenn dataLayer existiert und aktiviert.
 */
export function pushToDataLayer(event: ResaDataLayerEvent): void;

/**
 * Google Ads Conversion direkt feuern (ohne GTM).
 * Nutzt gtag() wenn Conversion-IDs konfiguriert sind.
 * Wird bei resa_form_view und resa_form_submit aufgerufen.
 */
export function fireGoogleAdsConversion(
	conversionId: string,
	conversionLabel: string,
	value?: number,
): void;

/**
 * Enhanced Conversion: Gehashte E-Mail an dataLayer.
 * Nur bei form_submit + wenn aktiviert.
 */
export function pushEnhancedConversion(email: string): void;
```

**Google Ads gtag-Laden:** Wenn Conversion-IDs konfiguriert sind, lädt RESA das gtag.js Script dynamisch (einmalig). Das Script wird NICHT geladen wenn keine IDs konfiguriert sind — kein Performance-Impact.

### Frontend: URL-Parameter Capture

```typescript
// src/frontend/lib/url-params.ts

const STORAGE_KEY = 'resa_url_params';

interface CapturedParams {
	gclid?: string;
	fbclid?: string;
	msclkid?: string;
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_content?: string;
	utm_term?: string;
}

/**
 * Extrahiert Click-IDs + UTM-Parameter aus der URL.
 * Speichert in sessionStorage (überlebt Seitennavigation).
 * Wird einmalig beim Widget-Init aufgerufen.
 */
export function captureUrlParams(): void;

/**
 * Gibt gespeicherte Parameter zurück.
 * Wird bei createPartial() aufgerufen.
 */
export function getCapturedParams(): CapturedParams;
```

### Frontend: Tracking-Verdrahtung

Die Events werden an folgenden Stellen gefeuert:

| Event                | Wo          | Trigger                                  |
| -------------------- | ----------- | ---------------------------------------- |
| `resa_asset_view`    | Widget-Root | IntersectionObserver (einmalig)          |
| `resa_asset_start`   | StepWizard  | Erster Step-Wechsel (einmalig)           |
| `resa_step_complete` | StepWizard  | `onNext` Callback                        |
| `resa_form_view`     | LeadForm    | Mount-Effekt (einmalig)                  |
| `resa_form_interact` | LeadForm    | Erster `onFocus` auf ein Feld (einmalig) |
| `resa_form_submit`   | LeadForm    | `onSubmit` Success-Callback              |
| `resa_result_view`   | Result      | Mount-Effekt (einmalig)                  |

Jeder Event-Call geht parallel an:

1. `trackEvent()` → WordPress REST API (intern)
2. `pushToDataLayer()` → `window.dataLayer` (extern, GTM)
3. `fireGoogleAdsConversion()` → nur bei `form_view` + `form_submit`, nur wenn IDs konfiguriert

### Backend: TrackingSettingsController

```php
// includes/Api/TrackingSettingsController.php

class TrackingSettingsController extends RestController {

    private const OPTION_KEY = 'resa_tracking_settings';

    private const DEFAULTS = [
        'funnel_tracking_enabled'     => true,
        'partial_leads_enabled'       => true,
        'partial_lead_ttl_days'       => 30,
        'datalayer_enabled'           => true,
        'google_ads'                  => [
            'form_view_conversion_id'    => '',
            'form_view_conversion_label' => '',
            'form_submit_conversion_id'  => '',
            'form_submit_conversion_label' => '',
        ],
        'enhanced_conversions_enabled' => false,
        'gclid_capture_enabled'        => true,
        'utm_capture_enabled'          => true,
    ];

    public function registerRoutes(): void;
    // GET  /admin/tracking-settings → index()
    // PUT  /admin/tracking-settings → update()

    public function index(): WP_REST_Response;
    // Liest wp_option, merged mit DEFAULTS

    public function update(WP_REST_Request $request): WP_REST_Response;
    // Validiert + sanitized + speichert

    public static function get(): array;
    // Statisch abrufbar für andere Services (z.B. Frontend-Config)
}
```

**Wie kommt die Config ins Frontend?** Die Tracking-Settings werden via `wp_localize_script()` als `resaTrackingConfig` Objekt an das Frontend-Widget übergeben. So braucht das Widget keinen Extra-API-Call.

```php
// In Plugin.php oder Shortcode-Handler:
wp_localize_script('resa-frontend', 'resaTrackingConfig', [
    'datalayer_enabled'  => $settings['datalayer_enabled'],
    'google_ads'         => [
        'form_view'  => [
            'id'    => $settings['google_ads']['form_view_conversion_id'],
            'label' => $settings['google_ads']['form_view_conversion_label'],
        ],
        'form_submit' => [
            'id'    => $settings['google_ads']['form_submit_conversion_id'],
            'label' => $settings['google_ads']['form_submit_conversion_label'],
        ],
    ],
    'enhanced_conversions' => $settings['enhanced_conversions_enabled'],
    'gclid_capture'        => $settings['gclid_capture_enabled'],
    'utm_capture'          => $settings['utm_capture_enabled'],
]);
```

### Backend: Partial Lead Cleanup

```php
// includes/Cron/PartialLeadCleanup.php

class PartialLeadCleanup {

    public static function register(): void;
    // add_action('resa_daily_cleanup', ...)
    // Cron-Schedule: einmal täglich via wp_schedule_event()

    public static function deleteExpired(): int;
    // DELETE FROM resa_leads
    // WHERE status = 'partial' AND expires_at IS NOT NULL AND expires_at < NOW()
    // Returns: Anzahl gelöschter Einträge

    public static function scheduleIfNeeded(): void;
    // Prüft ob Cron-Event bereits registriert, sonst anlegen

    public static function unschedule(): void;
    // Für Plugin-Deaktivierung
}
```

### Admin: Analytics-Seite (React)

```
Analytics.tsx
├── Filter-Leiste (Asset, Standort, Zeitraum)
├── KPI-Cards (Views, Starts, Formular, Leads)
├── FunnelChart (horizontale Balken, Nivo @nivo/bar)
├── TrendChart (Linien über Zeit, Nivo @nivo/line)
├── Conversion-Rates Card (Prozentwerte)
└── FeatureGate: Partial Lead Stats (Premium)
```

**Datenquelle:** Bestehender Endpoint `GET /analytics/funnel` liefert `summary` + `daily` Breakdown.

**Charts:**

- FunnelChart: Horizontaler Balken-Chart (Nivo `@nivo/bar`, horizontal layout)
- TrendChart: Linien-Chart (Nivo `@nivo/line`, 3 Serien: Views/Starts/Leads)
- Beide mit `resaChartTheme`, `resaColors`, DACH-Formatierung

## Validierung

### PHP (TrackingSettingsController)

| Feld                            | Regel                                       |
| ------------------------------- | ------------------------------------------- |
| `funnel_tracking_enabled`       | boolean                                     |
| `partial_leads_enabled`         | boolean                                     |
| `partial_lead_ttl_days`         | int, 7–365                                  |
| `datalayer_enabled`             | boolean                                     |
| `google_ads.*.conversion_id`    | string, max 20, Pattern: `AW-\d+` oder leer |
| `google_ads.*.conversion_label` | string, max 50, alphanumerisch oder leer    |
| `enhanced_conversions_enabled`  | boolean                                     |
| `gclid_capture_enabled`         | boolean                                     |
| `utm_capture_enabled`           | boolean                                     |

### Frontend (url-params.ts)

| Parameter | Validation                                      |
| --------- | ----------------------------------------------- |
| `gclid`   | Max 255 Zeichen, nur [a-zA-Z0-9_-]              |
| `fbclid`  | Max 255 Zeichen                                 |
| `utm_*`   | Max 255 Zeichen, sanitize_text_field Äquivalent |

## Akzeptanzkriterien

### Phase 1 — Tracking verdrahten

- [ ] StepWizard feuert `resa_asset_start` + `resa_step_complete` Events
- [ ] LeadForm feuert `resa_form_view`, `resa_form_interact`, `resa_form_submit`
- [ ] Result feuert `resa_result_view`
- [ ] Events gehen parallel an WordPress REST API + dataLayer
- [ ] GCLID/FBCLID/UTM werden aus URL extrahiert und in sessionStorage gespeichert
- [ ] GCLID/FBCLID werden bei `createPartial()` mitgesendet
- [ ] UTM-Parameter werden im `meta`-Feld des Leads gespeichert
- [ ] Partial Lead Cleanup Cron löscht abgelaufene Einträge täglich

### Phase 2 — Einstellungen + Google Ads

- [ ] Tracking-Tab in Einstellungen mit Google Ads Conversion-IDs
- [ ] Bei konfigurierter Conversion-ID: gtag.js wird dynamisch geladen
- [ ] `resa_form_view` feuert sekundäre Google Ads Conversion
- [ ] `resa_form_submit` feuert primäre Google Ads Conversion
- [ ] Premium-Toggles für Enhanced Conversions, GCLID, UTM, Partial Leads, TTL
- [ ] TrackingSettings per `wp_localize_script` an Frontend übergeben (kein Extra-Request)

### Phase 3 — Analytics-Seite

- [ ] Neuer Menüpunkt "Analytics" in WP-Admin
- [ ] Filter: Asset-Typ, Standort, Zeitraum
- [ ] KPI-Cards: Views, Starts, Formular-Erreicht, Leads (mit Rates)
- [ ] Funnel-Chart: Horizontale Balken mit absoluten Zahlen + Prozent
- [ ] Trend-Chart: Linien über Zeitraum (Views/Starts/Leads)
- [ ] Conversion-Rates Card
- [ ] Free: Nur KPI-Cards + Rates, Charts mit Upgrade-CTA
- [ ] Premium: Volle Charts + Partial Lead Statistik

## Security-Überlegungen

- **POST /tracking ist public** — bereits implementiert mit Rate-Limiting Potential (kein Auth nötig, da nur Zähler inkrementiert)
- **Tracking-Settings nur Admin** — `adminAccess()` Permission-Callback
- **Keine PII im dataLayer** — Niemals E-Mail, Name, Telefon in Events. Nur bei Enhanced Conversions wird die E-Mail an den dataLayer übergeben (nicht an RESA-Server)
- **GCLID/FBCLID sanitizen** — `sanitize_text_field()`, max 255 Zeichen
- **UTM-Parameter sanitizen** — `sanitize_text_field()`, max 255 Zeichen
- **Google Ads Conversion-IDs sanitizen** — Pattern-Validierung `AW-\d+`
- **gtag.js nur laden wenn konfiguriert** — Kein externes Script ohne explizite Makler-Einwilligung
- **Partial Leads DSGVO** — Keine PII, nur anonymisierte Eingaben, Auto-Löschung via Cron, Art. 6(1)(f) Berechtigtes Interesse

## Testplan

### Unit Tests (PHP)

- **TrackingSettingsControllerTest** — CRUD, Validation, Defaults, Sanitization
- **PartialLeadCleanupTest** — Löscht abgelaufene, behält aktive, respektiert TTL

### Unit Tests (JS/TS)

- **datalayer.test.ts** — pushToDataLayer mit/ohne window.dataLayer, fireGoogleAdsConversion mit/ohne gtag
- **url-params.test.ts** — captureUrlParams mit verschiedenen URL-Kombinationen, sessionStorage
- **useTrackingSettings.test.tsx** — Hook-Tests
- **useAnalytics.test.tsx** — Hook-Tests
- **Analytics.test.tsx** — Rendering mit Mock-Daten, Free vs. Premium

### Integration Tests

- Tracking-Flow: Widget laden → Steps durchlaufen → Formular → Submit → Events in DB prüfen
- Google Ads: Conversion-IDs konfigurieren → Widget nutzen → gtag-Calls verifizieren

## Offene Fragen

Keine — Architektur steht, bestehende Infrastruktur deckt die Basis ab.

## Abhängigkeiten

- **TrackingService.php** — bereits implementiert
- **TrackingController.php** — bereits implementiert
- **Lead.php (Two-Phase)** — bereits implementiert
- **resa_tracking_daily** — bereits implementiert
- **Frontend-Widget** — StepWizard/LeadForm/Result müssen existieren (Tracking-Calls werden dort eingehängt)

## Implementierungsreihenfolge

```
Phase 1 — Tracking verdrahten (Backend + Frontend-Widget):
  1. url-params.ts          — GCLID/FBCLID/UTM Capture
  2. datalayer.ts           — dataLayer Push + Google Ads gtag
  3. tracking.ts            — Erweitern um dataLayer-Integration
  4. StepWizard/LeadForm    — trackEvent-Calls einbauen
  5. PartialLeadCleanup.php — Cron-Job
  6. Plugin.php             — Cron registrieren

Phase 2 — Einstellungen:
  7. TrackingSettingsController.php — REST API
  8. Plugin.php                     — Controller registrieren + wp_localize_script
  9. useTrackingSettings.ts         — React Query Hooks
  10. TrackingTab.tsx               — Settings UI
  11. Settings.tsx                  — Tab einbinden
  12. types/index.ts                — Interfaces
  13. FeatureGate.php               — canUseAdvancedTracking()

Phase 3 — Analytics-Seite:
  14. useAnalytics.ts    — React Query Hook
  15. Analytics.tsx       — Seite mit Charts
  16. App.tsx             — Route
  17. AdminPage.php       — Menüpunkt

Phase 4 — Tests:
  18. PHP Unit Tests
  19. JS Unit Tests
```
