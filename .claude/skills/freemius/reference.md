# Freemius SDK — Vollständige Referenz

> Basierend auf freemius.com/help/documentation/wordpress-sdk/ (Stand: Mai 2025)
> Alle Codebeispiele verwenden RESA-Kontext (Slug `resa`, Funktion `resa_fs()`)

---

## Inhaltsverzeichnis

1. [SDK Initialization](#1-sdk-initialization)
2. [Plan-Check-Methoden](#2-plan-check-methoden)
3. [Licensing & Registration](#3-licensing--registration)
4. [Upgrade & Checkout URLs](#4-upgrade--checkout-urls)
5. [Admin Menu Integration](#5-admin-menu-integration)
6. [Hooks und Filters](#6-hooks-und-filters)
7. [Add-On-System](#7-add-on-system)
8. [Free vs Premium Code-Separation](#8-free-vs-premium-code-separation)
9. [RESA FeatureGate Implementierung](#9-resa-featuregate-implementierung)
10. [Frontend-Integration (React)](#10-frontend-integration-react)
11. [REST API mit Feature-Gating](#11-rest-api-mit-feature-gating)
12. [Uninstall & Cleanup](#12-uninstall--cleanup)
13. [Multisite & Anonymous Mode](#13-multisite--anonymous-mode)
14. [SDK Method Quick Reference](#14-sdk-method-quick-reference)
15. [Best Practices](#15-best-practices)

---

## 1. SDK Initialization

### RESA SDK Init

```php
if ( ! function_exists( 'resa_fs' ) ) {
    function resa_fs(): \Freemius {
        global $resa_fs;

        if ( ! isset( $resa_fs ) ) {
            require_once dirname( __FILE__ ) . '/freemius/start.php';

            $resa_fs = fs_dynamic_init( [
                'id'              => '00000',              // Freemius Product ID
                'slug'            => 'resa',
                'type'            => 'plugin',
                'public_key'      => 'pk_xxxxxxxxxxxxxxxx',
                'is_premium'      => false,                // false für wp.org Free-Version
                'is_premium_only' => false,                // true wenn keine Free-Version
                'has_addons'      => true,                 // Add-ons aktiviert
                'has_paid_plans'  => true,                 // Bezahlpläne vorhanden
                'trial'           => [
                    'days'              => 14,
                    'is_block_features' => true,            // Features nach Trial sperren
                ],
                'menu'            => [
                    'slug'    => 'resa-dashboard',
                    'support' => false,
                    'contact' => true,
                    'account' => true,
                    'pricing' => true,
                ],
                'is_live'         => true,                 // false für Dev/Testing
            ] );
        }

        return $resa_fs;
    }

    resa_fs();
    do_action( 'resa_fs_loaded' );
}
```

### Alle fs_dynamic_init Parameter

| Parameter | Typ | Default | Beschreibung |
|---|---|---|---|
| `id` | string | **Pflicht** | Freemius Product ID |
| `slug` | string | **Pflicht** | Plugin-Slug |
| `type` | string | `'plugin'` | `'plugin'` oder `'theme'` |
| `public_key` | string | **Pflicht** | Public Key aus Dashboard |
| `is_premium` | bool | `false` | Premium-Codebase? |
| `is_premium_only` | bool | `false` | Nur Premium (kein Free) |
| `has_addons` | bool | `false` | Add-on-Support |
| `has_paid_plans` | bool | `false` | Bezahlpläne vorhanden |
| `has_affiliation` | bool | `false` | Affiliate-Programm |
| `trial` | array\|false | `false` | Trial-Config |
| `menu` | array | `[]` | Admin-Menu-Config |
| `is_live` | bool | `true` | Production vs Testing |
| `anonymous_mode` | bool | `false` | Opt-in überspringen |
| `navigation` | string | `'menu'` | `'tabs'` oder `'menu'` |
| `secret_key` | string | `null` | **NIE im verteilten Code!** |

---

## 2. Plan-Check-Methoden

### Kern-Methoden

```php
// Standard Feature-Gating — IMMER DIESE VERWENDEN
resa_fs()->can_use_premium_code();      // bool — Paying ODER Trial

// Zahlungsstatus
resa_fs()->is_paying();                  // bool — Aktive bezahlte Lizenz
resa_fs()->is_paying_or_trial();         // bool — Bezahlt ODER im Trial

// Free-Plan
resa_fs()->is_free_plan();               // bool — Auf Free-Plan
resa_fs()->is_not_paying();              // bool — Ähnlich is_free_plan

// Spezifischer Plan
resa_fs()->is_plan( 'premium' );         // bool — Exakter Plan-Match
resa_fs()->is_plan( 'premium', true );   // bool — Exakt (Standard)
resa_fs()->is_plan_or_trial( 'premium' );// bool — Plan ODER Trial davon

// Trial
resa_fs()->is_trial();                   // bool — Aktuell im Trial
resa_fs()->is_trial_utilized();          // bool — Trial schon genutzt

// Premium Codebase
resa_fs()->is_premium();                 // bool — Premium-Codebase läuft
resa_fs()->is__premium_only();           // bool — Nur in Premium-Build vorhanden
```

### Unterschied: `can_use_premium_code()` vs `is_paying()`

| Methode | Paying | Trial | Free |
|---|---|---|---|
| `can_use_premium_code()` | `true` | `true` | `false` |
| `is_paying()` | `true` | `false` | `false` |
| `is_paying_or_trial()` | `true` | `true` | `false` |
| `is_free_plan()` | `false` | `false` | `true` |

**Empfehlung:** Fast immer `can_use_premium_code()` verwenden!

### Unterschied: `is__premium_only()` vs `can_use_premium_code()`

```php
// is__premium_only() — prüft ob Premium-CODEBASE (Files vorhanden)
// Verwenden für: Premium-PHP-Dateien laden die im Free-Build nicht existieren
if ( resa_fs()->is__premium_only() ) {
    require_once __DIR__ . '/premium/class-advanced-analytics.php';
}

// can_use_premium_code() — prüft ob LIZENZ vorhanden
// Verwenden für: Features in gemeinsam genutztem Code aktivieren/deaktivieren
if ( resa_fs()->can_use_premium_code() ) {
    $this->enable_advanced_settings();
}

// Kombiniert (sicherster Ansatz):
if ( resa_fs()->is__premium_only() && resa_fs()->can_use_premium_code() ) {
    // Premium-Code der beides braucht
}
```

---

## 3. Licensing & Registration

### Registrierungs-Status

```php
resa_fs()->is_registered();              // bool — User hat opted-in
resa_fs()->is_anonymous();               // bool — User hat opt-in übersprungen
resa_fs()->is_pending_activation();      // bool — Wartet auf E-Mail-Aktivierung
```

### Lizenz-Objekt

```php
$license = resa_fs()->_get_license();     // object|false
if ( $license ) {
    $license->id;                         // Lizenz-ID
    $license->plan_id;                    // Plan-ID
    $license->pricing_id;                 // Pricing-ID
    $license->quota;                      // Site-Quota (null = unbegrenzt)
    $license->activated;                  // Anzahl Aktivierungen
    $license->is_lifetime;                // bool — Lifetime-Lizenz?
    $license->expiration;                 // Ablaufdatum oder null
    $license->is_expired();               // bool — Abgelaufen?
    $license->is_block_features;          // bool — Features nach Ablauf sperren?
}
```

### Plan-Objekt

```php
$plan = resa_fs()->get_plan();            // object
if ( $plan ) {
    $plan->id;                            // Plan-ID
    $plan->name;                          // Plan-Slug
    $plan->title;                         // Anzeigename
}

resa_fs()->get_plan_name();               // string — Plan-Slug
resa_fs()->get_plan_title();              // string — Anzeigename
```

### Site- und User-Objekte

```php
$site = resa_fs()->get_site();            // Install-Objekt
$user = resa_fs()->get_user();            // User-Objekt
```

---

## 4. Upgrade & Checkout URLs

### PHP URL-Methoden

```php
// Standard Upgrade-URL (Checkout öffnen)
$url = resa_fs()->get_upgrade_url();

// Mit spezifischen Parametern
$url = resa_fs()->get_upgrade_url( [
    'plan_id'       => 1234,
    'pricing_id'    => 5678,
    'billing_cycle' => 'annual',       // 'monthly', 'annual', 'lifetime'
    'licenses'      => 1,
    'coupon'        => 'SAVE20',
    'trial'         => true,
] );

// Weitere URLs
$pricing_url = resa_fs()->pricing_url();    // In-Admin Pricing-Seite
$account_url = resa_fs()->account_url();    // Account-Seite
$contact_url = resa_fs()->contact_url();    // Kontakt-Seite
$trial_url   = resa_fs()->get_trial_url();  // Trial starten
$addon_url   = resa_fs()->addon_url( 'resa-onoffice' ); // Add-on-Seite
```

### JavaScript Checkout (Inline)

```javascript
// Freemius Checkout-Handler (global verfügbar wenn SDK geladen)
var handler = FS.Checkout.configure({
    plugin_id:  '1234',
    plan_id:    '5678',
    public_key: 'pk_xxxxxxxx',
    image:      'https://resa-wt.com/logo.png',
});

handler.open({
    name:           'RESA Premium',
    licenses:       1,
    billing_cycle:  'annual',
    currency:       'eur',
    success: function( response ) {
        console.log( 'Kauf abgeschlossen:', response );
    },
    cancel: function() {
        console.log( 'Checkout abgebrochen' );
    },
});
```

### Checkout-Parameter

| Parameter | Typ | Beschreibung |
|---|---|---|
| `plugin_id` | string | Freemius Plugin ID |
| `plan_id` | string | Ziel-Plan ID |
| `pricing_id` | string | Pricing-Option |
| `public_key` | string | Plugin Public Key |
| `name` | string | Plugin-Name (Anzeige) |
| `licenses` | int | Anzahl Site-Lizenzen |
| `billing_cycle` | string | `'monthly'`, `'annual'`, `'lifetime'` |
| `trial` | string | `'free'` oder `'paid'` |
| `coupon` | string | Gutschein-Code |
| `currency` | string | `'usd'`, `'eur'`, `'gbp'` |
| `success` | function | Erfolgs-Callback |
| `cancel` | function | Abbruch-Callback |

---

## 5. Admin Menu Integration

### Menu-Konfiguration

```php
'menu' => [
    'slug'       => 'resa-dashboard',         // Haupt-Menu-Slug
    'first-path' => 'admin.php?page=resa-welcome', // Redirect nach Aktivierung
    'contact'    => true,                     // Kontakt-Submenu
    'support'    => false,                    // Support-Submenu
    'account'    => true,                     // Account-Submenu
    'pricing'    => true,                     // Pricing-Submenu
    'addons'     => true,                     // Add-ons-Submenu
    'parent'     => [
        'slug' => 'options-general.php',      // Unter Settings (optional)
    ],
],
```

### Menu-Sichtbarkeit steuern

```php
// Pricing nur für Free-User zeigen
resa_fs()->add_filter( 'is_submenu_visible', function ( $is_visible, $menu_id ) {
    if ( 'pricing' === $menu_id ) {
        return ! resa_fs()->is_paying();
    }
    return $is_visible;
}, 10, 2 );
```

---

## 6. Hooks und Filters

### Action Hooks

```php
// SDK geladen
do_action( 'resa_fs_loaded' );

// Aktivierung (Opt-in)
resa_fs()->add_action( 'after_activate', function () {
    // User hat sich registriert
} );

// Deinstallation (NICHT Deaktivierung!)
resa_fs()->add_action( 'after_uninstall', function () {
    global $wpdb;
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_leads" );
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_locations" );
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_tracking_daily" );
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_email_log" );
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_agents" );
    $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}resa_agent_locations" );
    delete_option( 'resa_settings' );
    delete_option( 'resa_db_version' );
} );

// Lizenz-Änderungen
resa_fs()->add_action( 'after_license_change', function ( $plan_change ) {
    if ( $plan_change->is_upgrade ) {
        // Upgrade — ggf. Premium-Features initialisieren
    }
    if ( $plan_change->is_downgrade ) {
        // Downgrade — ggf. Limits anwenden
    }
} );

resa_fs()->add_action( 'after_license_activation', function ( $license ) {
    // Lizenz aktiviert
} );

resa_fs()->add_action( 'after_license_deactivation', function ( $license ) {
    // Lizenz deaktiviert
} );

// Trial
resa_fs()->add_action( 'after_trial_started', function ( $trial_plan, $trial_days ) {
    // Trial gestartet
} );

resa_fs()->add_action( 'after_trial_expired', function () {
    // Trial abgelaufen
} );

// Update
resa_fs()->add_action( 'after_update', function ( $old_version, $new_version ) {
    // Plugin aktualisiert
} );
```

### Filter Hooks

```php
// Opt-in-Nachricht anpassen
resa_fs()->add_filter( 'connect_message', function (
    $message, $user_first_name, $product_title
) {
    return sprintf(
        /* translators: 1: Vorname, 2: Plugin-Name */
        __( 'Hallo %1$s! Erlauben Sie %2$s anonyme Nutzungsdaten zu erheben, um das Plugin zu verbessern.', 'resa' ),
        $user_first_name,
        $product_title
    );
}, 10, 6 );

// Admin-Notices steuern
resa_fs()->add_filter( 'show_admin_notice', function ( $show ) {
    return current_user_can( 'manage_options' ) ? $show : false;
} );

// Deaktivierungsgründe anpassen
resa_fs()->add_filter( 'deactivation_reasons', function ( $reasons ) {
    $reasons[] = [
        'id'                => 'no-real-estate',
        'text'              => __( 'Ich bin kein Immobilienmakler', 'resa' ),
        'input_type'        => '',
        'input_placeholder' => '',
    ];
    return $reasons;
} );

// Plugin-Icon
resa_fs()->add_filter( 'plugin_icon', function () {
    return plugins_url( 'assets/icon-128x128.png', RESA_FILE );
} );

// "Powered by" Badge
resa_fs()->add_filter( 'show_powered_by', '__return_false' );

// Redirect nach Opt-in/Skip
resa_fs()->add_filter( 'after_skip_url', function () {
    return admin_url( 'admin.php?page=resa-dashboard' );
} );

resa_fs()->add_filter( 'after_connect_url', function () {
    return admin_url( 'admin.php?page=resa-dashboard' );
} );

// Trial-Promotion
resa_fs()->add_filter( 'trial_promotion_message', function () {
    return __( 'Testen Sie RESA Premium 14 Tage kostenlos!', 'resa' );
} );
```

---

## 7. Add-On-System

### RESA Add-ons (geplant)

- `resa-onoffice` — onOffice CRM Integration
- `resa-propstack` — Propstack CRM Integration
- `resa-flowfact` — FLOWFACT CRM Integration
- `resa-cleverreach` — CleverReach Newsletter
- `resa-brevo` — Brevo (ex Sendinblue)
- `resa-mailchimp` — Mailchimp

### Add-on Initialization

```php
// In add-on Plugin:
if ( ! function_exists( 'resa_onoffice_fs' ) ) {
    function resa_onoffice_fs(): \Freemius {
        global $resa_onoffice_fs;

        if ( ! isset( $resa_onoffice_fs ) ) {
            require_once dirname( __FILE__ ) . '/freemius/start.php';

            $resa_onoffice_fs = fs_dynamic_init( [
                'id'              => '99999',
                'slug'            => 'resa-onoffice',
                'type'            => 'plugin',
                'public_key'      => 'pk_addon_key',
                'is_premium'      => false,
                'is_premium_only' => true,            // Add-ons sind Premium-Only
                'has_paid_plans'  => true,
                'parent'          => [
                    'id'         => '00000',           // RESA Parent-ID
                    'slug'       => 'resa',
                    'public_key' => 'pk_parent_key',
                    'name'       => 'RESA',
                ],
                'menu'            => [
                    'slug' => 'resa-dashboard',        // Parent-Menu verwenden
                ],
            ] );
        }

        return $resa_onoffice_fs;
    }

    resa_onoffice_fs();
    do_action( 'resa_onoffice_fs_loaded' );
}
```

### Add-on-Status prüfen (aus Parent)

```php
// Add-on aktiv?
resa_fs()->is_addon_activated( 'resa-onoffice' );     // bool

// Add-on installiert?
resa_fs()->is_addon_installed( 'resa-onoffice' );      // bool

// Alle Add-ons
$addons = resa_fs()->get_addons();                      // array

// Spezifisches Add-on
$addon = resa_fs()->get_addon( 'resa-onoffice' );       // object
$addon = resa_fs()->get_addon_by_id( 99999 );           // object
```

### Add-on Dependency Check

```php
// Im Add-on: Parent prüfen bevor laden
function resa_onoffice_init(): void {
    // Parent aktiv?
    if ( ! function_exists( 'resa_fs' ) ) {
        add_action( 'admin_notices', function () {
            printf(
                '<div class="notice notice-error"><p>%s</p></div>',
                esc_html__( 'RESA onOffice benötigt das RESA Plugin.', 'resa-onoffice' )
            );
        } );
        return;
    }

    // Parent Premium?
    if ( ! resa_fs()->can_use_premium_code() ) {
        add_action( 'admin_notices', function () {
            printf(
                '<div class="notice notice-warning"><p>%s</p></div>',
                sprintf(
                    /* translators: %s: Upgrade-Link */
                    esc_html__( 'RESA onOffice benötigt RESA Premium. %s', 'resa-onoffice' ),
                    '<a href="' . esc_url( resa_fs()->get_upgrade_url() ) . '">'
                        . esc_html__( 'Jetzt upgraden', 'resa-onoffice' )
                    . '</a>'
                )
            );
        } );
        return;
    }

    // Alles OK — Add-on laden
    require_once __DIR__ . '/includes/class-onoffice-integration.php';
}
add_action( 'plugins_loaded', 'resa_onoffice_init', 20 );
```

---

## 8. Free vs Premium Code-Separation

### Strategie: Single Codebase mit Conditional Loading (Empfohlen)

```php
// Immer Free-Features laden
require_once __DIR__ . '/includes/class-rent-calculator.php';

// Premium-Features bedingt laden
if ( resa_fs()->can_use_premium_code() ) {
    require_once __DIR__ . '/includes/premium/class-pdf-designer.php';
    require_once __DIR__ . '/includes/premium/class-email-templates.php';
    require_once __DIR__ . '/includes/premium/class-agent-management.php';
}
```

### In Klassen: Feature-Gating

```php
namespace Resa\Admin;

class AssetConfigurator {
    public function get_available_assets(): array {
        $assets = [
            'mietpreis' => __( 'Mietpreis-Rechner', 'resa' ), // Free
        ];

        if ( resa_fs()->can_use_premium_code() ) {
            $assets['kaufpreis']   = __( 'Kaufpreis-Rechner', 'resa' );
            $assets['rendite']     = __( 'Rendite-Rechner', 'resa' );
            $assets['nebenkosten'] = __( 'Nebenkosten-Rechner', 'resa' );
            // ... weitere Premium-Assets
        }

        return $assets;
    }
}
```

### WordPress.org Deployment

```php
// Für wp.org: Premium-Code nicht im Free-Repo
// Freemius handhabt dies über is_premium Flag:

// Free Version (wp.org):
'is_premium' => false,

// Premium Version (via Freemius):
'is_premium' => true,

// Code-Blöcke die NUR in Premium existieren:
if ( resa_fs()->is__premium_only() ) {
    // Wird vom Freemius Build-Prozess aus Free-ZIP entfernt
}
```

---

## 9. RESA FeatureGate Implementierung

```php
namespace Resa\Freemius;

class FeatureGate {
    private static ?self $instance = null;

    public static function getInstance(): self {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function isPremium(): bool {
        return function_exists( 'resa_fs' ) && resa_fs()->can_use_premium_code();
    }

    public function isFree(): bool {
        return ! $this->isPremium();
    }

    public function canUseFeature( string $feature ): bool {
        $premium_features = [
            'pdf_designer',
            'email_templates',
            'smtp_config',
            'lead_export',
            'lead_details',
            'lead_workflow',
            'agent_management',
            'custom_branding',
            'webhooks',
            'communication_center',
        ];

        if ( in_array( $feature, $premium_features, true ) ) {
            return $this->isPremium();
        }

        return true; // Free-Feature
    }

    public function canActivateAsset( string $asset_slug ): bool {
        if ( $this->isPremium() ) {
            return true;
        }
        // Free: nur Mietpreis-Rechner
        return 'mietpreis' === $asset_slug;
    }

    public function canAddLocation(): bool {
        if ( $this->isPremium() ) {
            return true;
        }
        return $this->getLocationCount() < 1;
    }

    public function getVisibleLeadLimit(): int {
        if ( $this->isPremium() ) {
            return PHP_INT_MAX;
        }
        return 50;
    }

    public function getUpgradeUrl( array $params = [] ): string {
        if ( ! function_exists( 'resa_fs' ) ) {
            return '';
        }
        return resa_fs()->get_upgrade_url( $params );
    }

    public function getTrialUrl(): string {
        if ( ! function_exists( 'resa_fs' ) ) {
            return '';
        }
        return resa_fs()->get_trial_url();
    }

    public function canStartTrial(): bool {
        return function_exists( 'resa_fs' ) && ! resa_fs()->is_trial_utilized();
    }

    public function isAddonActive( string $addon_slug ): bool {
        return function_exists( 'resa_fs' ) && resa_fs()->is_addon_activated( $addon_slug );
    }

    private function getLocationCount(): int {
        global $wpdb;
        return (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->prefix}resa_locations WHERE is_active = 1"
        );
    }
}
```

---

## 10. Frontend-Integration (React)

### Plan-Daten via wp_localize_script

```php
wp_localize_script( 'resa-admin', 'resaConfig', [
    'apiBase' => rest_url( 'resa/v1/' ),
    'nonce'   => wp_create_nonce( 'wp_rest' ),
    'plan'    => [
        'isPremium'      => resa_fs()->can_use_premium_code(),
        'isTrial'        => resa_fs()->is_trial(),
        'isFreePlan'     => resa_fs()->is_free_plan(),
        'planName'       => resa_fs()->get_plan_name(),
        'upgradeUrl'     => resa_fs()->get_upgrade_url(),
        'trialUrl'       => resa_fs()->get_trial_url(),
        'pricingUrl'     => resa_fs()->pricing_url(),
        'trialAvailable' => ! resa_fs()->is_trial_utilized(),
        'addons'         => [
            'onoffice'    => resa_fs()->is_addon_activated( 'resa-onoffice' ),
            'propstack'   => resa_fs()->is_addon_activated( 'resa-propstack' ),
            'flowfact'    => resa_fs()->is_addon_activated( 'resa-flowfact' ),
        ],
    ],
] );
```

### TypeScript Types

```typescript
interface ResaPlan {
    isPremium: boolean;
    isTrial: boolean;
    isFreePlan: boolean;
    planName: string;
    upgradeUrl: string;
    trialUrl: string;
    pricingUrl: string;
    trialAvailable: boolean;
    addons: {
        onoffice: boolean;
        propstack: boolean;
        flowfact: boolean;
    };
}

interface ResaConfig {
    apiBase: string;
    nonce: string;
    plan: ResaPlan;
}

declare const resaConfig: ResaConfig;
```

### UpgradePrompt Komponente

```typescript
import { __ } from '@wordpress/i18n';

interface UpgradePromptProps {
    feature: string;
    title: string;
    description: string;
}

export function UpgradePrompt({ feature, title, description }: UpgradePromptProps) {
    const { plan } = resaConfig;

    if ( plan.isPremium ) return null;

    return (
        <div className="resa-upgrade-prompt">
            <h3>{title}</h3>
            <p>{description}</p>
            <div className="resa-upgrade-actions">
                {plan.trialAvailable && (
                    <a href={plan.trialUrl} className="button button-primary">
                        {__( '14 Tage kostenlos testen', 'resa' )}
                    </a>
                )}
                <a href={plan.upgradeUrl} className="button">
                    {__( 'Jetzt upgraden', 'resa' )}
                </a>
            </div>
        </div>
    );
}
```

### usePlan Hook

```typescript
export function usePlan() {
    const { plan } = resaConfig;

    return {
        isPremium: plan.isPremium,
        isFree: plan.isFreePlan,
        isTrial: plan.isTrial,
        canUseFeature: ( feature: string ): boolean => {
            const premiumFeatures = [
                'pdf_designer', 'email_templates', 'smtp_config',
                'lead_export', 'lead_details', 'lead_workflow',
                'agent_management', 'custom_branding', 'webhooks',
                'communication_center',
            ];
            return plan.isPremium || ! premiumFeatures.includes( feature );
        },
        upgradeUrl: plan.upgradeUrl,
        trialUrl: plan.trialUrl,
        trialAvailable: plan.trialAvailable,
    };
}
```

---

## 11. REST API mit Feature-Gating

```php
namespace Resa\Api;

use Resa\Freemius\FeatureGate;

class LeadsController extends RestController {

    public function get_items( \WP_REST_Request $request ): \WP_REST_Response {
        $gate = FeatureGate::getInstance();
        $limit = $gate->getVisibleLeadLimit();

        $leads = $this->repository->findAll( [
            'limit'  => min( absint( $request['per_page'] ), $limit ),
            'offset' => absint( $request['offset'] ?? 0 ),
        ] );

        $response = rest_ensure_response( $leads );

        // Upgrade-Hinweis für Free-User
        if ( $gate->isFree() ) {
            $response->header( 'X-Resa-Upgrade-Notice', 'true' );
            $response->header( 'X-Resa-Lead-Limit', (string) $limit );
        }

        return $response;
    }

    public function export_items( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        $gate = FeatureGate::getInstance();

        if ( ! $gate->canUseFeature( 'lead_export' ) ) {
            return new \WP_Error(
                'resa_premium_required',
                __( 'CSV-Export erfordert RESA Premium.', 'resa' ),
                [
                    'status'     => 403,
                    'upgradeUrl' => $gate->getUpgradeUrl(),
                ]
            );
        }

        // Export-Logik...
        return rest_ensure_response( $export_data );
    }
}
```

---

## 12. Uninstall & Cleanup

```php
// Freemius after_uninstall (bevorzugt — läuft auch bei Remote-Uninstall)
resa_fs()->add_action( 'after_uninstall', function () {
    global $wpdb;

    // Custom Tables löschen
    $tables = [
        'resa_leads', 'resa_tracking_daily', 'resa_locations',
        'resa_email_log', 'resa_agents', 'resa_agent_locations',
    ];
    foreach ( $tables as $table ) {
        $wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}{$table}" );
    }

    // Optionen löschen
    delete_option( 'resa_settings' );
    delete_option( 'resa_db_version' );

    // Transients löschen
    delete_transient( 'resa_license_cache' );

    // User-Meta löschen
    $wpdb->query(
        "DELETE FROM {$wpdb->usermeta} WHERE meta_key LIKE 'resa\_%'"
    );

    // Custom Capabilities entfernen
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        $admin->remove_cap( 'manage_resa' );
        $admin->remove_cap( 'manage_resa_leads' );
        $admin->remove_cap( 'manage_resa_settings' );
        $admin->remove_cap( 'export_resa_leads' );
    }
} );
```

---

## 13. Multisite & Anonymous Mode

### Multisite

```php
// Network-Level aktiviert?
resa_fs()->is_network_active();          // bool

// Menu für Network-Admin
'menu' => [
    'slug'    => 'resa-dashboard',
    'network' => true,
],
```

### Anonymous Mode

```php
// Opt-in komplett überspringen (kein Tracking für Free-User)
'anonymous_mode' => true,

// Status prüfen
resa_fs()->is_anonymous();               // bool
```

---

## 14. SDK Method Quick Reference

| Methode | Rückgabe | Beschreibung |
|---|---|---|
| `is_free_plan()` | bool | Auf Free-Plan |
| `is_paying()` | bool | Aktive bezahlte Lizenz |
| `is_paying_or_trial()` | bool | Bezahlt oder Trial |
| `can_use_premium_code()` | bool | **Premium-Code erlaubt** |
| `is_premium()` | bool | Premium-Codebase |
| `is__premium_only()` | bool | Nur Premium-Build |
| `is_plan( $name, $exact )` | bool | Spezifischer Plan |
| `is_plan_or_trial( $name )` | bool | Plan oder Trial davon |
| `is_trial()` | bool | Aktuell im Trial |
| `is_trial_utilized()` | bool | Trial wurde genutzt |
| `is_registered()` | bool | Opted-in |
| `is_anonymous()` | bool | Opt-in übersprungen |
| `get_plan()` | object | Plan-Objekt |
| `get_plan_name()` | string | Plan-Slug |
| `get_plan_title()` | string | Plan-Anzeigename |
| `get_site()` | object | Site/Install-Objekt |
| `get_user()` | object | User-Objekt |
| `_get_license()` | object\|false | Lizenz-Objekt |
| `get_upgrade_url( $params )` | string | Checkout-URL |
| `get_trial_url()` | string | Trial-URL |
| `pricing_url()` | string | Pricing-Seite |
| `account_url()` | string | Account-Seite |
| `contact_url()` | string | Kontakt-Seite |
| `addon_url( $slug )` | string | Add-on-Seite |
| `is_addon_activated( $slug )` | bool | Add-on aktiv |
| `is_addon_installed( $slug )` | bool | Add-on installiert |
| `get_addons()` | array | Alle Add-ons |
| `add_action( $tag, $cb )` | void | Freemius Action Hook |
| `add_filter( $tag, $cb )` | void | Freemius Filter Hook |

---

## 15. Best Practices

1. **Immer `can_use_premium_code()`** für Feature-Gating — deckt Paying + Trial ab.
2. **SDK früh initialisieren** — Im Main Plugin File, vor anderem Code.
3. **`do_action( 'resa_fs_loaded' )`** damit Add-ons den SDK-Zustand kennen.
4. **`secret_key` NIE verteilen** — Nur für Server-Side API Calls.
5. **`is__premium_only()` für File Loading**, `can_use_premium_code()` für Feature Flags.
6. **SDK-Fehler abfangen** — Plugin muss im Free-Modus funktionieren wenn SDK fehlt.
7. **Beide Builds testen** — Free und Premium mit Freemius Deployment-Simulation.
8. **`is_live` = false während Entwicklung** — Keine echten Daten an Freemius senden.
9. **Graceful Degradation** — Bei Lizenz-Ablauf Site nicht brechen, nur Premium deaktivieren.
10. **`after_uninstall` Hook** für Cleanup (statt `register_uninstall_hook()`), läuft auch bei Remote-Uninstall.
11. **Plan-Checks sind intern gecached** — Kein eigenes Caching nötig, aber nicht in Tight-Loops aufrufen.
12. **Trial-14-Tage konfiguriert** — `is_block_features: true` sperrt Features nach Trial.
