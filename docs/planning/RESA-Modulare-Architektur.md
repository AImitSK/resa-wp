# RESA — Modulare Architektur

## Das Plugin-in-Plugin-System für Lead Tools & Integrationen

---

## 1. Architektur-Philosophie

RESA folgt einem **Three-Tier-Modell** — vergleichbar mit dem Chrome Extension Store:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   TIER 1: KERNPLUGIN (Der Browser)                                  │
│   ══════════════════════════════════                                 │
│   Alles was IMMER da ist:                                           │
│   Dashboard, Lead-Verwaltung, Standorte, StepWizard-Framework,      │
│   Lead-Formular, PDF-Service, E-Mail-Service, Tracking,             │
│   Icon Registry, REST API Basis, Freemius SDK, Feature-Gating       │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   TIER 2: LEAD TOOL MODULE (Die Extensions)                 │   │
│   │   ═════════════════════════════════════════                  │   │
│   │   Eigenständige, registrierbare Module:                     │   │
│   │                                                             │   │
│   │   [🟢 Free]  Mietpreis-Kalkulator                          │   │
│   │   [🟢 Free]  Immobilienwert-Kalkulator                     │   │
│   │   [🔵 Pro]   Kaufnebenkosten-Rechner                       │   │
│   │   [🔵 Pro]   Budgetrechner                                 │   │
│   │   [🔵 Pro]   Renditerechner                                │   │
│   │   [🔵 Pro]   Energieeffizienz-Check                        │   │
│   │   [🔵 Pro]   Verkäufer-Checkliste                          │   │
│   │   [🔵 Pro]   Käufer-Checkliste                             │   │
│   │   [⚪ Later] Weitere Tools ...                              │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                                                             │   │
│   │   TIER 3: INTEGRATIONEN                                     │   │
│   │   ═════════════════════                                     │   │
│   │                                                             │   │
│   │   [🟢 Free]  Webhooks (Custom POST)                        │   │
│   │   [🟢 Free]  E-Mail-Benachrichtigungen (wp_mail)           │   │
│   │   [💰 Add-on] onOffice                                     │   │
│   │   [💰 Add-on] Propstack                                    │   │
│   │   [💰 Add-on] FLOWFACT                                     │   │
│   │   [💰 Add-on] Brevo Newsletter                             │   │
│   │   [💰 Add-on] HubSpot CRM                                  │   │
│   │   [💰 Add-on] Slack / MS Teams                             │   │
│   │                                                             │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Warum diese Trennung?

| Grund | Erklärung |
|---|---|
| **Skalierbarkeit** | Neue Lead Tools hinzufügen = neues Modul registrieren. Kernplugin bleibt stabil. |
| **Monetarisierung** | Lead Tools: Free/Pro-Flag. Integrationen: Freemius Add-ons mit eigener Lizenz. |
| **Wartbarkeit** | Jedes Modul ist in sich geschlossen. Bug in Modul X bricht nicht Modul Y. |
| **Erweiterbarkeit** | Perspektivisch: Entwickler-API für Drittanbieter-Module. |
| **Testbarkeit** | Module isoliert testbar. Core-Services separat testbar. |

---

## 2. Was gehört wohin?

### Tier 1: Kernplugin — Immer vorhanden

Das Kernplugin liefert die **Plattform**. Alles was Lead Tools und Integrationen gemeinsam brauchen:

| Bereich | Was | Beschreibung |
|---|---|---|
| **Dashboard** | Admin-Startseite | Übersicht: Leads, Conversion, aktive Tools |
| **Lead-Verwaltung** | CRUD + Export | Leads anzeigen, filtern, Status ändern, CSV-Export (Pro) |
| **Standortverwaltung** | Locations CRUD | Städte/Regionen anlegen, Makler zuordnen |
| **Makler-Verwaltung** | Agents CRUD | Makler-Profile, Zuordnung zu Standorten (Pro) |
| **StepWizard** | Framework-Komponente | `<StepWizard>` — animierter Multi-Step mit Framer Motion |
| **Lead-Formular** | Universelle Komponente | `<LeadForm>` — konfigurierbare Felder, DSGVO, Presets |
| **Ergebnis-Karte** | Shared Component | `<ResultCard>` — wiederverwendbares Ergebnis-Layout |
| **ProgressBar** | Shared Component | `<ProgressBar>` — Fortschrittsanzeige im Wizard |
| **PDF-Service** | Backend-Service | DOMPDF/Puppeteer — Modul liefert Daten, Kern macht PDF |
| **E-Mail-Service** | Backend-Service | wp_mail (Free) / SMTP / Brevo (Pro) |
| **Tracking** | Backend-Service | Funnel-Tracking, dataLayer Events, GCLID/FBCLID |
| **Icon Registry** | Frontend-System | Zentrale Icons mit semantischen Namen, austauschbare Sets |
| **Modul-Registry** | PHP-System | Module registrieren sich, Kern orchestriert |
| **REST API Basis** | Infrastruktur | Base-Controller, Auth, Nonces, Response-Format |
| **Freemius SDK** | Monetarisierung | Lizenzprüfung, Feature-Gating, Upgrade-Flows |
| **Feature Gate** | Zugriffskontrolle | `FeatureGate` — prüft Plan + Modul-Flags |
| **Shortcode** | `[resa]` | Rendert das Widget, lädt das richtige Modul |
| **Maps/Geocoding** | Optional Service | Leaflet/Google Maps Abstraktion |
| **i18n** | Übersetzungen | gettext-System, DACH-Varianten |

### Tier 2: Lead Tool Module — Registrierbar, aktivierbar

Jedes Lead Tool ist ein **eigenständiges Modul** das sich beim Kernplugin registriert:

| Was ein Modul MITBRINGT | Beispiel (Mietpreis-Kalkulator) |
|---|---|
| **Frontend-Steps** | `PropertyTypeStep`, `AreaStep`, `ConditionStep`, `LocationStep`, `ExtrasStep` |
| **Berechnungslogik** (PHP) | `RentCalculatorService` — Basismietpreis × Faktoren |
| **Einstellungs-Felder** | Basismietpreise, Lagefaktoren, Ausstattungsfaktoren, Extras |
| **Ergebnis-Template** | `RentResult` — Darstellung der Mietpreis-Spanne |
| **PDF-Bausteine** | `RentAnalysisPdf` — modulspezifisches PDF-Layout |
| **Validierung** (Zod) | `rentCalculatorSchema` — Input-Validierung |
| **Modul-Manifest** | Name, Slug, Flag (Free/Pro), Icon, Beschreibung |

| Was ein Modul vom KERN KONSUMIERT |
|---|
| `<StepWizard>` — der Wizard-Rahmen |
| `<LeadForm>` — das universelle Kontaktformular |
| `<ProgressBar>`, `<ResultCard>` — UI-Bausteine |
| `<ResaIcon>` — Icons aus der zentralen Registry |
| PDF-Service — Modul übergibt Daten, Kern generiert PDF |
| E-Mail-Service — Modul triggert, Kern versendet |
| Standortverwaltung — Modul nutzt Locations |
| Tracking — Modul feuert Events, Kern trackt |
| REST API — Modul registriert Endpoints, Kern liefert Infrastruktur |

### Tier 3: Integrationen — Basis (Free) + Add-ons (Paid)

| Typ | Beispiel | Beschreibung |
|---|---|---|
| **Basis (Free)** | Webhooks | Custom POST an beliebige URL bei neuem Lead |
| **Basis (Free)** | E-Mail-Benachrichtigung | wp_mail an Makler bei neuem Lead |
| **Add-on (Paid)** | onOffice | Leads direkt in onOffice synchronisieren |
| **Add-on (Paid)** | Propstack | Leads direkt in Propstack synchronisieren |
| **Add-on (Paid)** | FLOWFACT | Leads direkt in FLOWFACT synchronisieren |
| **Add-on (Paid)** | Brevo Newsletter | Leads in Brevo-Newsletter-Listen eintragen |
| **Add-on (Paid)** | HubSpot CRM | Leads in HubSpot synchronisieren |
| **Add-on (Paid)** | Slack/Teams | Echtzeit-Benachrichtigungen bei neuen Leads |

**Technisch:** Add-on-Integrationen sind **eigenständige WordPress-Plugins** die RESA Premium voraussetzen und über Freemius separat lizenziert werden.

**Basis-Integrationen** (Webhooks, E-Mail) sind Teil des Kernplugins.

---

## 3. Flag-System für Lead Tools

Jedes Lead Tool hat ein **Flag** das bestimmt, wer es nutzen kann:

```
┌──────────┬──────────────────────────────────────┬───────────┐
│ Flag     │ Bedeutung                            │ Plan      │
├──────────┼──────────────────────────────────────┼───────────┤
│ 🟢 free  │ In Free + Pro verfügbar              │ Jetzt     │
│ 🔵 pro   │ Nur in Pro verfügbar                 │ Jetzt     │
│ ⚪ paid  │ Einzeln kaufbar (Freemius Add-on)    │ Zukunft   │
└──────────┴──────────────────────────────────────┴───────────┘
```

### Aktuelle Tool-Zuordnung (v1)

| Lead Tool | Flag | Phase | Schwierigkeit |
|---|---|---|---|
| **Mietpreis-Kalkulator** | 🟢 free | Bereits vorhanden | — |
| **Immobilienwert-Kalkulator** | 🟢 free | Bereits vorhanden | — |
| **Kaufnebenkosten-Rechner** | 🔵 pro | Phase 1 | ⭐ Niedrig |
| **Budgetrechner** | 🔵 pro | Phase 1 | ⭐⭐ Mittel |
| **Renditerechner** | 🔵 pro | Phase 2 | ⭐⭐ Mittel |
| **Energieeffizienz-Check** | 🔵 pro | Phase 2 | ⭐⭐ Mittel |
| **Verkäufer-Checkliste** | 🔵 pro | Phase 1 | ⭐ Niedrig |
| **Käufer-Checkliste** | 🔵 pro | Phase 1 | ⭐ Niedrig |

**Weitere Tools aus der Ideensammlung** (Modernisierungsrechner, Mieterhöhungsrechner, Suchprofil-Ersteller, etc.) werden bei Bedarf als pro oder paid eingestuft.

### Feature-Gating Logik

```php
// Kernplugin prüft: Darf dieses Tool geladen werden?

class FeatureGate {

    public function canUseModule( string $module_slug ): bool {
        $module = ModuleRegistry::get( $module_slug );

        if ( ! $module ) {
            return false;
        }

        switch ( $module->getFlag() ) {
            case 'free':
                return true; // Immer verfügbar

            case 'pro':
                return resa_fs()->can_use_premium_code();

            case 'paid':
                // Zukunft: Einzelnes Add-on lizenziert?
                return resa_fs()->is_addon_activated( $module->getAddonSlug() );

            default:
                return false;
        }
    }

    // Free-Plan-Limits (zusätzlich zum Flag)
    public function canActivateModule( string $module_slug ): bool {
        if ( ! $this->canUseModule( $module_slug ) ) {
            return false;
        }

        // Free: Max 2 aktive Tools (die beiden Free-Tools)
        if ( ! resa_fs()->can_use_premium_code() ) {
            $active_count = ModuleRegistry::getActiveCount();
            $module = ModuleRegistry::get( $module_slug );
            if ( $module->getFlag() !== 'free' ) {
                return false;
            }
        }

        return true;
    }
}
```

---

## 4. Modul-Registry — Das Herzstück

### Wie registriert sich ein Modul?

Jedes Lead Tool registriert sich beim Kernplugin über einen **WordPress-Hook**:

```php
// In: modules/rent-calculator/rent-calculator.php

add_action( 'resa_register_modules', function ( ModuleRegistry $registry ) {
    $registry->register( new RentCalculatorModule() );
} );
```

### ModuleRegistry Klasse

```php
namespace Resa\Core;

class ModuleRegistry {

    /** @var array<string, ModuleInterface> */
    private array $modules = [];

    /**
     * Modul registrieren.
     */
    public function register( ModuleInterface $module ): void {
        $this->modules[ $module->getSlug() ] = $module;
    }

    /**
     * Modul nach Slug holen.
     */
    public function get( string $slug ): ?ModuleInterface {
        return $this->modules[ $slug ] ?? null;
    }

    /**
     * Alle registrierten Module.
     */
    public function getAll(): array {
        return $this->modules;
    }

    /**
     * Nur aktivierte Module (Admin hat sie eingeschaltet).
     */
    public function getActive(): array {
        return array_filter(
            $this->modules,
            fn( ModuleInterface $m ) => $m->isActive()
        );
    }

    /**
     * Nur verfügbare Module (Flag + Plan passen).
     */
    public function getAvailable(): array {
        $gate = FeatureGate::getInstance();
        return array_filter(
            $this->modules,
            fn( ModuleInterface $m ) => $gate->canUseModule( $m->getSlug() )
        );
    }

    /**
     * Anzahl aktiver Module.
     */
    public function getActiveCount(): int {
        return count( $this->getActive() );
    }

    /**
     * Discovery: Alle Module aus dem modules/-Verzeichnis laden.
     */
    public function discover(): void {
        $modules_dir = RESA_PLUGIN_DIR . 'modules/';
        foreach ( glob( $modules_dir . '*/module.php' ) as $file ) {
            require_once $file;
        }
        do_action( 'resa_register_modules', $this );
    }
}
```

### ModuleInterface — Der Vertrag

Jedes Modul implementiert dieses Interface:

```php
namespace Resa\Core;

interface ModuleInterface {

    // === Identität ===

    /** Einzigartiger Slug, z.B. 'rent-calculator'. */
    public function getSlug(): string;

    /** Anzeigename, z.B. 'Mietpreis-Kalkulator'. */
    public function getName(): string;

    /** Kurzbeschreibung für den Admin-Bereich. */
    public function getDescription(): string;

    /** Semantischer Icon-Name aus der Icon Registry, z.B. 'calculator-rent'. */
    public function getIcon(): string;

    /** Kategorie: 'calculator', 'analysis', 'checklist', 'qualification'. */
    public function getCategory(): string;

    // === Flags & Status ===

    /** Lizenz-Flag: 'free', 'pro', oder 'paid'. */
    public function getFlag(): string;

    /** Ist das Modul vom Admin aktiviert? (Option in DB). */
    public function isActive(): bool;

    /** Modul aktivieren/deaktivieren. */
    public function setActive( bool $active ): void;

    // === Backend: Services & Berechnung ===

    /** Calculator-Service registrieren. */
    public function getCalculatorService(): ?CalculatorInterface;

    /** REST API Endpoints registrieren. */
    public function registerRoutes(): void;

    /** Admin-Einstellungsfelder für dieses Modul. */
    public function getSettingsSchema(): array;

    // === Frontend: Steps & UI ===

    /**
     * Frontend-Konfiguration für den StepWizard.
     * Wird via REST API an das Frontend geliefert.
     *
     * Enthält: steps[], resultTemplate, validationSchema, defaultValues
     */
    public function getFrontendConfig(): array;

    /**
     * PDF-Bausteine dieses Moduls.
     * Wird vom PDF-Service verwendet.
     */
    public function getPdfBlocks(): array;

    // === Lifecycle ===

    /** Wird aufgerufen wenn das Modul zum ersten Mal aktiviert wird. */
    public function onActivate(): void;

    /** Wird aufgerufen wenn das Modul deaktiviert wird. */
    public function onDeactivate(): void;
}
```

### Beispiel: RentCalculatorModule

```php
namespace Resa\Modules\RentCalculator;

use Resa\Core\ModuleInterface;
use Resa\Core\CalculatorInterface;

class RentCalculatorModule implements ModuleInterface {

    public function getSlug(): string {
        return 'rent-calculator';
    }

    public function getName(): string {
        return __( 'Mietpreis-Kalkulator', 'resa' );
    }

    public function getDescription(): string {
        return __( 'Berechnet die marktübliche Miete basierend auf Lage, Ausstattung und Zustand.', 'resa' );
    }

    public function getIcon(): string {
        return 'calculator-rent'; // Semantischer Name aus Icon Registry
    }

    public function getCategory(): string {
        return 'calculator';
    }

    public function getFlag(): string {
        return 'free';
    }

    public function isActive(): bool {
        return (bool) get_option( 'resa_module_rent-calculator_active', false );
    }

    public function setActive( bool $active ): void {
        update_option( 'resa_module_rent-calculator_active', $active );
    }

    public function getCalculatorService(): CalculatorInterface {
        return new RentCalculatorService();
    }

    public function registerRoutes(): void {
        // Endpunkte werden unter /resa/v1/modules/rent-calculator/* registriert
        register_rest_route( 'resa/v1', '/modules/rent-calculator/calculate', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'handleCalculation' ],
            'permission_callback' => '__return_true', // Public Endpoint
        ] );
    }

    public function getSettingsSchema(): array {
        return [
            'base_rent'          => [ 'type' => 'number', 'label' => __( 'Basismietpreis (€/m²)', 'resa' ) ],
            'location_factors'   => [ 'type' => 'factors', 'label' => __( 'Lagefaktoren', 'resa' ) ],
            'condition_factors'  => [ 'type' => 'factors', 'label' => __( 'Zustandsfaktoren', 'resa' ) ],
            'equipment_factors'  => [ 'type' => 'factors', 'label' => __( 'Ausstattungsfaktoren', 'resa' ) ],
            'extras'             => [ 'type' => 'extras', 'label' => __( 'Extras-Aufschläge', 'resa' ) ],
        ];
    }

    public function getFrontendConfig(): array {
        return [
            'steps' => [
                [ 'id' => 'property-type', 'component' => 'PropertyTypeStep' ],
                [ 'id' => 'area',          'component' => 'AreaStep' ],
                [ 'id' => 'condition',     'component' => 'ConditionStep' ],
                [ 'id' => 'location',      'component' => 'LocationStep' ],
                [ 'id' => 'extras',        'component' => 'ExtrasStep' ],
                // LeadForm + Result werden automatisch vom Kern angehängt
            ],
            'resultComponent' => 'RentResult',
        ];
    }

    public function getPdfBlocks(): array {
        return [
            'rent-analysis'   => RentAnalysisPdfBlock::class,
            'factors-chart'   => FactorsChartPdfBlock::class,
        ];
    }

    public function onActivate(): void {
        // Standardwerte in DB schreiben wenn noch keine vorhanden
    }

    public function onDeactivate(): void {
        // Cleanup, falls nötig
    }
}
```

---

## 5. Verzeichnisstruktur

```
resa-wp/
├── resa.php                          # Plugin Entry Point
│
├── includes/                         # PHP Backend (PSR-4: Resa\)
│   ├── Core/                         # Kernplugin-Bootstrap
│   │   ├── Plugin.php                # Hauptklasse, lädt alles
│   │   ├── Activator.php             # Plugin-Aktivierung (DB, Defaults)
│   │   ├── I18n.php                  # Übersetzungen laden
│   │   ├── ModuleRegistry.php        # ★ Modul-Registry
│   │   ├── ModuleInterface.php       # ★ Interface für alle Module
│   │   ├── AbstractModule.php        # ★ Basis-Implementierung
│   │   ├── FeatureGate.php           # ★ Plan + Flag Prüfung
│   │   └── IconRegistry.php          # ★ Zentrale Icon-Verwaltung
│   │
│   ├── Admin/                        # WP-Admin Seiten (Kern)
│   │   ├── AdminMenu.php             # Menü-Registrierung
│   │   ├── DashboardPage.php         # Dashboard
│   │   ├── LeadsPage.php             # Lead-Verwaltung
│   │   ├── LocationsPage.php         # Standorte
│   │   ├── ModuleStorePage.php       # ★ Modul-Übersicht ("Store")
│   │   ├── SettingsPage.php          # Globale Einstellungen
│   │   └── ShortcodeGeneratorPage.php
│   │
│   ├── Api/                          # REST API (Kern-Endpoints)
│   │   ├── RestController.php        # Basis-Controller
│   │   ├── LeadsController.php       # /resa/v1/leads/*
│   │   ├── LocationsController.php   # /resa/v1/locations/*
│   │   ├── ModulesController.php     # ★ /resa/v1/modules/* (Registry-API)
│   │   ├── TrackingController.php    # /resa/v1/tracking/*
│   │   └── SettingsController.php    # /resa/v1/settings/*
│   │
│   ├── Models/                       # Datenmodelle (Kern)
│   │   ├── Lead.php
│   │   ├── Location.php
│   │   ├── Agent.php
│   │   └── EmailTemplate.php
│   │
│   ├── Services/                     # Kern-Services
│   │   ├── Calculator/
│   │   │   └── CalculatorInterface.php   # Interface, das Module implementieren
│   │   ├── Pdf/
│   │   │   ├── PdfService.php            # Kern-PDF-Logik (DOMPDF/Puppeteer)
│   │   │   └── PdfBlockInterface.php     # Interface für Modul-PDF-Bausteine
│   │   ├── Email/
│   │   │   ├── EmailService.php          # wp_mail / SMTP / Brevo
│   │   │   └── TransportInterface.php
│   │   ├── Tracking/
│   │   │   └── TrackingService.php
│   │   └── Integration/
│   │       ├── IntegrationInterface.php  # Interface für Add-on-Integrationen
│   │       ├── WebhookIntegration.php    # Basis-Integration (Free)
│   │       └── EmailNotification.php     # Basis-Integration (Free)
│   │
│   ├── Database/                     # Schema & Migrationen
│   │   ├── Schema.php
│   │   ├── Migrator.php
│   │   └── Seeder.php
│   │
│   ├── Shortcode/                    # [resa] Shortcode
│   │   └── ResaShortcode.php
│   │
│   └── Freemius/                     # Freemius SDK Init
│       └── FreemiusInit.php
│
├── modules/                          # ★ LEAD TOOL MODULE
│   │
│   ├── rent-calculator/              # 🟢 Free
│   │   ├── module.php                # Bootstrap: registriert sich bei Registry
│   │   ├── RentCalculatorModule.php  # ModuleInterface Implementierung
│   │   ├── RentCalculatorService.php # Berechnungslogik
│   │   ├── src/                      # Frontend-Komponenten (React)
│   │   │   ├── steps/
│   │   │   │   ├── PropertyTypeStep.tsx
│   │   │   │   ├── AreaStep.tsx
│   │   │   │   ├── ConditionStep.tsx
│   │   │   │   ├── LocationStep.tsx
│   │   │   │   └── ExtrasStep.tsx
│   │   │   ├── result/
│   │   │   │   └── RentResult.tsx
│   │   │   ├── pdf/
│   │   │   │   └── RentAnalysisPdf.tsx
│   │   │   └── validation/
│   │   │       └── schema.ts         # Zod-Schema für dieses Tool
│   │   └── tests/
│   │       ├── RentCalculatorServiceTest.php
│   │       └── RentResult.test.tsx
│   │
│   ├── value-calculator/             # 🟢 Free
│   │   ├── module.php
│   │   ├── ValueCalculatorModule.php
│   │   ├── ValueCalculatorService.php
│   │   ├── src/
│   │   │   └── ...                   # Gleiche Struktur wie oben
│   │   └── tests/
│   │
│   ├── purchase-costs/               # 🔵 Pro
│   │   ├── module.php
│   │   └── ...
│   │
│   ├── budget-calculator/            # 🔵 Pro
│   │   ├── module.php
│   │   └── ...
│   │
│   ├── roi-calculator/               # 🔵 Pro
│   │   ├── module.php
│   │   └── ...
│   │
│   ├── energy-check/                 # 🔵 Pro
│   │   ├── module.php
│   │   └── ...
│   │
│   ├── seller-checklist/             # 🔵 Pro
│   │   ├── module.php
│   │   └── ...
│   │
│   └── buyer-checklist/              # 🔵 Pro
│       ├── module.php
│       └── ...
│
├── src/                              # Shared Frontend (Kernplugin)
│   ├── frontend/                     # Widget React App
│   │   ├── main.tsx                  # Entry Point
│   │   ├── components/
│   │   │   ├── shared/               # Gemeinsame Bausteine
│   │   │   │   ├── StepWizard.tsx
│   │   │   │   ├── LeadForm.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── ResultCard.tsx
│   │   │   ├── ui/                   # shadcn/ui Komponenten
│   │   │   └── icons/                # ★ Icon Registry
│   │   │       ├── ResaIcon.tsx      # <ResaIcon name="house" />
│   │   │       ├── registry.ts       # Semantischer Name → Komponente
│   │   │       └── sets/
│   │   │           └── default.ts    # Standard-Icon-Set (Lucide-basiert)
│   │   ├── hooks/
│   │   │   ├── useApi.ts
│   │   │   ├── useLocale.ts
│   │   │   └── useModuleConfig.ts    # ★ Modul-Konfiguration laden
│   │   ├── lib/
│   │   │   ├── api-client.ts
│   │   │   ├── format.ts
│   │   │   └── module-loader.ts      # ★ Dynamisches Laden von Modul-Steps
│   │   └── types/
│   │       ├── index.ts
│   │       └── module.ts             # ★ ModuleConfig, StepConfig Interfaces
│   │
│   └── admin/                        # Admin React App
│       ├── main.tsx                  # Entry Point
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Leads.tsx
│       │   ├── Locations.tsx
│       │   ├── ModuleStore.tsx       # ★ Modul-Übersicht ("Chrome Store")
│       │   ├── ModuleSettings.tsx    # ★ Einstellungen pro aktivem Modul
│       │   ├── Communication.tsx
│       │   ├── Settings.tsx
│       │   └── ShortcodeGenerator.tsx
│       └── components/
│           ├── ModuleCard.tsx        # ★ Karte im Store (Icon, Name, Flag, Toggle)
│           └── ModuleSettingsPanel.tsx # ★ Dynamisches Settings-Panel
│
├── languages/                        # i18n
│   ├── resa.pot                      # Kern-Strings
│   └── ...
│
├── dist/                             # Vite Build Output
├── tests/                            # Kern-Tests
│   ├── php/
│   │   ├── Unit/
│   │   │   ├── Core/
│   │   │   │   ├── ModuleRegistryTest.php
│   │   │   │   └── FeatureGateTest.php
│   │   │   ├── Services/
│   │   │   └── Api/
│   │   └── Integration/
│   └── js/
│       ├── components/
│       │   ├── StepWizard.test.tsx
│       │   ├── LeadForm.test.tsx
│       │   └── ResaIcon.test.tsx
│       └── hooks/
│
└── docs/planning/                    # Spezifikationen
```

---

## 6. Icon Registry

### Philosophie

Module referenzieren Icons **nie direkt** (kein `import { House } from 'lucide-react'`). Stattdessen: **semantische Namen** über eine zentrale Registry.

### Warum?

1. **Look austauschbar** — Icon-Set wechseln = eine Datei ändern, alle Module aktualisiert
2. **Konsistenz** — Alle Module nutzen den gleichen Stil
3. **Modul-Entwickler** brauchen keine Icon-Library kennen, nur den Namen

### Frontend: ResaIcon Komponente

```tsx
// src/frontend/components/icons/ResaIcon.tsx

import { iconSets } from './registry';

interface ResaIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function ResaIcon({ name, size = 24, className }: ResaIconProps) {
  const currentSet = 'default'; // Später konfigurierbar
  const IconComponent = iconSets[currentSet]?.[name];

  if ( ! IconComponent ) {
    console.warn( `ResaIcon: Unknown icon "${name}"` );
    return null;
  }

  return <IconComponent size={size} className={className} />;
}
```

### Registry

```tsx
// src/frontend/components/icons/registry.ts

import type { LucideIcon } from 'lucide-react';

export type IconSet = Record<string, LucideIcon>;

export const iconSets: Record<string, IconSet> = {
  default: {} as IconSet, // Wird in sets/default.ts befüllt
};

/**
 * Icon-Set registrieren (für zukünftige Erweiterung).
 */
export function registerIconSet( name: string, set: IconSet ): void {
  iconSets[name] = set;
}
```

### Standard Icon-Set

```tsx
// src/frontend/components/icons/sets/default.ts

import {
  Home, Building2, Ruler, Thermometer, MapPin, Euro, Calculator,
  TrendingUp, FileCheck, ClipboardList, Search, BarChart3,
  BedDouble, Bath, Car, Trees, Sparkles, ArrowUpDown,
  Shield, Zap, Palette, Mountain, Train, ShoppingBag,
  GraduationCap, Heart, Volume2, Sun, Droplets, Wrench,
  CheckCircle2, AlertTriangle, Info, ChevronRight, ChevronLeft,
  Download, Mail, Phone, User, Calendar, Star, Lock,
} from 'lucide-react';

import { iconSets } from '../registry';

// Semantische Namen → Lucide Komponenten
iconSets['default'] = {
  // --- Immobilien ---
  'house':              Home,
  'apartment':          Building2,
  'square-meters':      Ruler,
  'rooms':              BedDouble,
  'bathroom':           Bath,
  'garage':             Car,
  'garden':             Trees,
  'balcony':            Sun,

  // --- Lage & Standort ---
  'location':           MapPin,
  'mountain':           Mountain,
  'transport':          Train,
  'shopping':           ShoppingBag,
  'school':             GraduationCap,
  'medical':            Heart,
  'noise':              Volume2,

  // --- Zustand & Ausstattung ---
  'condition':          Sparkles,
  'energy':             Zap,
  'heating':            Thermometer,
  'water':              Droplets,
  'renovation':         Wrench,
  'design':             Palette,
  'security':           Shield,

  // --- Finanzen ---
  'euro':               Euro,
  'calculator':         Calculator,
  'trending-up':        TrendingUp,
  'price-range':        ArrowUpDown,
  'chart':              BarChart3,

  // --- Lead Tools (Modul-Icons) ---
  'calculator-rent':    Calculator,        // Mietpreis-Kalkulator
  'calculator-value':   TrendingUp,        // Immobilienwert-Kalkulator
  'calculator-costs':   Euro,              // Kaufnebenkosten-Rechner
  'calculator-budget':  BarChart3,         // Budgetrechner
  'calculator-roi':     TrendingUp,        // Renditerechner
  'check-energy':       Zap,              // Energieeffizienz-Check
  'checklist-seller':   ClipboardList,     // Verkäufer-Checkliste
  'checklist-buyer':    FileCheck,         // Käufer-Checkliste
  'search-profile':     Search,            // Suchprofil-Ersteller

  // --- UI / Allgemein ---
  'success':            CheckCircle2,
  'warning':            AlertTriangle,
  'info':               Info,
  'next':               ChevronRight,
  'back':               ChevronLeft,
  'download':           Download,
  'email':              Mail,
  'phone':              Phone,
  'user':               User,
  'calendar':           Calendar,
  'star':               Star,
  'lock':               Lock,
};
```

### Backend: Icon-Referenz

Module referenzieren im PHP nur den **semantischen Namen**. Das Frontend löst ihn auf:

```php
// Im Modul
public function getIcon(): string {
    return 'calculator-rent'; // Wird vom Frontend via <ResaIcon> gerendert
}
```

---

## 7. Admin-Seite: Modul-Store

Im Admin gibt es eine **Modul-Übersicht** — die "Store"-Seite:

```
┌─────────────────────────────────────────────────────────────────┐
│  RESA → Smart Assets                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Verfügbare Lead Tools                                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ 🏠 Mietpreis-   │  │ 📈 Immobilien-  │  │ 💰 Kaufneben-  │ │
│  │    Kalkulator    │  │    wert-Kalk.   │  │    kosten       │ │
│  │                  │  │                  │  │                 │ │
│  │  [🟢 Free]      │  │  [🟢 Free]      │  │  [🔵 Pro]      │ │
│  │                  │  │                  │  │                 │ │
│  │  Berechnet die   │  │  Ermittelt den   │  │  Berechnet alle │ │
│  │  marktübliche    │  │  Marktwert einer │  │  Nebenkosten    │ │
│  │  Miete.          │  │  Immobilie.      │  │  beim Kauf.     │ │
│  │                  │  │                  │  │                 │ │
│  │  [✅ Aktiv    ]  │  │  [✅ Aktiv    ]  │  │  [🔒 Pro     ] │ │
│  │  [⚙ Einstell.]  │  │  [⚙ Einstell.]  │  │  [Upgrade ➜  ] │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ 📊 Budget-      │  │ 📈 Rendite-     │  │ ⚡ Energie-     │ │
│  │    rechner       │  │    rechner      │  │    effizienz    │ │
│  │                  │  │                 │  │                 │ │
│  │  [🔵 Pro]       │  │  [🔵 Pro]      │  │  [🔵 Pro]      │ │
│  │  ...             │  │  ...            │  │  ...            │ │
│  │  [🔒 Pro     ]  │  │  [🔒 Pro     ] │  │  [🔒 Pro     ] │ │
│  │  [Upgrade ➜  ]  │  │  [Upgrade ➜  ] │  │  [Upgrade ➜  ] │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Aktiviertes Modul → Einstellungs-Tab

Wenn ein Modul aktiviert ist, bekommt es einen **eigenen Einstellungs-Tab**:

```
┌─────────────────────────────────────────────────────────────────┐
│  RESA → Smart Assets → Mietpreis-Kalkulator                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Allgemein] [Faktoren] [Standorte] [Lead-Formular] [Design]   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Einrichtungsmodus                                              │
│  ● Pauschal (Region auswählen → Standardwerte)                 │
│  ○ Individuell (alle Felder manuell konfigurieren)              │
│                                                                 │
│  ┌─ Basisdaten ──────────────────────────────────────────────┐  │
│  │  Basismietpreis (€/m²):     [  8,50  ]                   │  │
│  │  Minimaler Mietpreis:        [  5,00  ]                   │  │
│  │  Maximaler Mietpreis:        [ 18,00  ]                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Standorte ───────────────────────────────────────────────┐  │
│  │  ← Kernplugin-Baustein: Standortverwaltung eingebettet   │  │
│  │  [✓] Bad Oeynhausen   [✓] Löhne   [ ] Vlotho            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─ Lead-Formular ───────────────────────────────────────────┐  │
│  │  ← Kernplugin-Baustein: LeadForm-Konfigurator eingebettet│  │
│  │  Preset: [Balanced ▾]                                     │  │
│  │  [✓] Vorname  [✓] E-Mail  [ ] Telefon  [ ] Nachricht     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                              [ Speichern ]      │
└─────────────────────────────────────────────────────────────────┘
```

**Wichtig:** Die Tabs "Standorte" und "Lead-Formular" sind **Kern-Bausteine** die in das Modul-Settings eingebettet werden. Das Modul bringt nur seine spezifischen Einstellungen mit (Basisdaten, Faktoren).

---

## 8. Datenfluss: Vom Besucher zum Lead

```
BESUCHER                    FRONTEND (React)              BACKEND (PHP)
────────                    ────────────────              ──────────────

1. Seite mit [resa           Shortcode lädt Widget
   type="rent-calculator"]
                             ↓
                             ModuleLoader prüft:
                             Ist "rent-calculator" aktiv?
                             → Ja: Lade Modul-Config via REST

2. Besucher sieht            StepWizard rendert:
   den Wizard                Step 1: PropertyTypeStep     ← Modul
                             Step 2: AreaStep             ← Modul
                             Step 3: ConditionStep        ← Modul
                             Step 4: LocationStep         ← Modul (nutzt Kern-Locations)
                             Step 5: ExtrasStep           ← Modul

3. Phase 1: Partial Lead     LeadForm (Kern-Baustein)     → POST /resa/v1/leads
   (Session-UUID generiert)                                  Tracking: partial_lead

4. Besucher füllt            LeadForm:                    → POST /resa/v1/leads/{id}
   Kontaktdaten aus          Name, E-Mail, DSGVO            Tracking: complete_lead

5. Berechnung                                             → POST /resa/v1/modules/
                                                             rent-calculator/calculate

                                                          RentCalculatorService
                                                          rechnet Ergebnis

6. Ergebnis                  RentResult (Modul)
                             ResultCard (Kern)
                             ResaIcon (Kern)

7. PDF-Download              Klick auf "PDF laden"        → GET /resa/v1/leads/{id}/pdf
                                                          PdfService (Kern) +
                                                          RentAnalysisPdf (Modul-Block)

8. E-Mail                                                 EmailService (Kern) versendet
                                                          an Besucher + Makler

9. Integration                                            WebhookIntegration (Kern/Free)
                                                          oder Add-on (onOffice etc.)
```

---

## 9. REST API — Modular

### Kern-Endpoints (immer verfügbar)

```
PUBLIC (kein Auth):
GET    /resa/v1/modules                          Verfügbare + aktive Module
GET    /resa/v1/modules/{slug}/config            Modul-Frontend-Konfiguration
POST   /resa/v1/modules/{slug}/calculate         Berechnung durchführen
POST   /resa/v1/leads                            Lead erstellen (Phase 1)
PUT    /resa/v1/leads/{id}                       Lead vervollständigen (Phase 2)
POST   /resa/v1/tracking/event                   Tracking-Event

ADMIN (Nonce + Capability):
GET    /resa/v1/admin/leads                      Leads auflisten
GET    /resa/v1/admin/leads/{id}                 Lead-Detail
PUT    /resa/v1/admin/leads/{id}                 Lead aktualisieren
DELETE /resa/v1/admin/leads/{id}                 Lead löschen
GET    /resa/v1/admin/leads/export               CSV-Export (Pro)
GET    /resa/v1/admin/locations                  Standorte
POST   /resa/v1/admin/locations                  Standort erstellen
PUT    /resa/v1/admin/locations/{id}             Standort bearbeiten
DELETE /resa/v1/admin/locations/{id}             Standort löschen
GET    /resa/v1/admin/modules                    Alle Module + Status
PUT    /resa/v1/admin/modules/{slug}             Modul aktivieren/deaktivieren
GET    /resa/v1/admin/modules/{slug}/settings    Modul-Einstellungen laden
PUT    /resa/v1/admin/modules/{slug}/settings    Modul-Einstellungen speichern
GET    /resa/v1/admin/settings                   Globale Plugin-Einstellungen
PUT    /resa/v1/admin/settings                   Globale Einstellungen speichern
GET    /resa/v1/admin/analytics                  Dashboard-Daten
```

### Integration-Endpoints (Add-ons registrieren eigene)

```
ADMIN (Nonce + Capability + Add-on aktiv):
GET    /resa/v1/admin/integrations                    Verfügbare Integrationen
PUT    /resa/v1/admin/integrations/{slug}/settings    Integration konfigurieren
POST   /resa/v1/admin/integrations/{slug}/test        Verbindung testen
```

---

## 10. Integrationen: Basis vs. Add-ons

### Basis-Integrationen (im Kernplugin, Free)

```php
// includes/Services/Integration/WebhookIntegration.php

class WebhookIntegration implements IntegrationInterface {

    public function getSlug(): string { return 'webhook'; }
    public function getName(): string { return __( 'Webhook', 'resa' ); }
    public function isFree(): bool { return true; }

    public function onLeadCreated( Lead $lead ): void {
        $url = get_option( 'resa_webhook_url' );
        if ( $url ) {
            wp_remote_post( $url, [
                'body' => wp_json_encode( $lead->toWebhookPayload() ),
                'headers' => [ 'Content-Type' => 'application/json' ],
            ] );
        }
    }
}
```

### Add-on-Integrationen (separate WordPress-Plugins)

Add-ons sind **eigenständige WordPress-Plugins** die:
1. RESA Premium voraussetzen
2. Über Freemius separat lizenziert werden
3. Sich via Hook beim Kernplugin registrieren

```php
// resa-onoffice/resa-onoffice.php (Separates Plugin)

/**
 * Plugin Name: RESA — onOffice Integration
 * Description: Synchronisiert RESA-Leads mit onOffice.
 * Requires Plugins: resa
 */

add_action( 'resa_register_integrations', function ( $registry ) {
    if ( resa_fs()->can_use_premium_code() ) {
        $registry->register( new OnOfficeIntegration() );
    }
} );
```

---

## 11. Vite Build — Module einbinden

Module liefern eigene React-Komponenten. Diese werden in den **Vite Build** integriert:

### Strategie: Dynamische Imports

Module-Steps werden **lazy loaded** über dynamische Imports. Das Kernplugin kennt die Module zur Build-Zeit:

```ts
// src/frontend/lib/module-loader.ts

const moduleComponents: Record<string, () => Promise<any>> = {
  'rent-calculator': () => import('../../../modules/rent-calculator/src/steps'),
  'value-calculator': () => import('../../../modules/value-calculator/src/steps'),
  'purchase-costs': () => import('../../../modules/purchase-costs/src/steps'),
  // ... weitere Module
};

export async function loadModuleSteps( slug: string ) {
  const loader = moduleComponents[slug];
  if ( ! loader ) {
    throw new Error( `Unknown module: ${slug}` );
  }
  return loader();
}
```

### Vite Config

```ts
// vite.config.ts — Auszug

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        frontend: 'src/frontend/main.tsx',
        admin: 'src/admin/main.tsx',
      },
    },
  },
});
```

Module-Code wird durch die dynamischen Imports automatisch in **separate Chunks** gesplittet. Nur der Code des aktiven Moduls wird geladen.

---

## 12. Zukunftsvision: Paid Lead Tools

Aktuell gibt es nur Free und Pro Flags. In Zukunft können **einzeln kaufbare** Lead Tools hinzukommen:

```
Phase 1 (Jetzt):     free + pro     → 2 Free Tools, 6 Pro Tools
Phase 2 (Zukunft):   free + pro + paid → Zusätzliche Premium-Tools als Freemius Add-ons
```

Das System ist dafür vorbereitet:
- `ModuleInterface::getFlag()` unterstützt bereits `'paid'`
- `FeatureGate::canUseModule()` hat bereits die `'paid'`-Logik
- Paid-Module wären technisch wie Add-on-Integrationen: separate Freemius-Lizenz

Dieser Schritt erfordert dann:
- Modul als separates WordPress-Plugin (wie Integrationen)
- Freemius Add-on Registrierung
- Eigene POT-Datei für Übersetzungen

---

## 13. Entwickler-API (Perspektivisch)

Wenn das Modul-System stabil ist, kann eine **Entwickler-Dokumentation** bereitgestellt werden:

### Was ein Drittanbieter-Modul braucht:

1. Ein Verzeichnis unter `modules/{slug}/` oder ein separates Plugin
2. Eine Klasse die `ModuleInterface` implementiert
3. Registrierung via `add_action( 'resa_register_modules', ... )`
4. Frontend-Steps als React-Komponenten
5. Zod-Schema für Validierung
6. Optional: PHP Calculator-Service, PDF-Blöcke

### Hooks für Drittanbieter:

```php
// Module registrieren
do_action( 'resa_register_modules', ModuleRegistry $registry );

// Integrationen registrieren
do_action( 'resa_register_integrations', IntegrationRegistry $registry );

// Lead erstellt (für eigene Verarbeitung)
do_action( 'resa_lead_created', Lead $lead, string $module_slug );

// Lead vervollständigt
do_action( 'resa_lead_completed', Lead $lead, string $module_slug );

// Berechnung durchgeführt
do_action( 'resa_calculation_completed', array $result, string $module_slug, array $inputs );

// PDF generiert
apply_filters( 'resa_pdf_blocks', array $blocks, string $module_slug, Lead $lead );

// Icon-Set erweitern
apply_filters( 'resa_icon_set', array $icons, string $set_name );
```

---

## Zusammenfassung

| Konzept | Implementierung |
|---|---|
| Kernplugin | `includes/` + `src/` — Plattform mit allen Services |
| Lead Tool Module | `modules/{slug}/` — registrierbar via `ModuleInterface` |
| Integrationen (Free) | `includes/Services/Integration/` — Webhooks, E-Mail |
| Integrationen (Paid) | Separate WordPress-Plugins via Freemius Add-ons |
| Icon Registry | `src/frontend/components/icons/` — semantische Namen |
| Feature Gating | `FeatureGate` prüft Flag (free/pro/paid) + Freemius Plan |
| Modul Store | Admin-Seite `ModuleStore.tsx` — Aktivierung/Deaktivierung |
| Modul Settings | Admin-Seite `ModuleSettings.tsx` — Tab pro Modul |
| REST API | `/resa/v1/modules/{slug}/*` — dynamisch pro Modul |
| Vite Build | Dynamische Imports → separate Chunks pro Modul |
