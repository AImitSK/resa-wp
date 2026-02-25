---
name: freemius
description: "Freemius SDK Integration für RESA. Automatisch anwenden: Feature-Gating mit resa_fs()->can_use_premium_code(), Free-Limits (1 Asset, 1 Location, 50 Leads), Upgrade-CTAs bei Premium-Features."
user-invocable: false
---

# Freemius SDK Patterns für RESA

Diese Regeln IMMER bei Premium/Free-Logik anwenden. Vollständige API-Referenz: `reference.md` im selben Verzeichnis.

## Grundregeln

1. **`resa_fs()`** ist die globale SDK-Instanz
2. **IMMER `can_use_premium_code()`** statt `is_paying()` — deckt auch Trials ab
3. **`secret_key` NIE im verteilten Code** — nur für Server-Side API
4. **Graceful Degradation** — Plugin muss im Free-Modus IMMER funktionieren
5. **SDK-Fehler abfangen** — Wenn Freemius nicht lädt, Free-Modus annehmen

## RESA Free-Plan-Limits

| Ressource | Free | Premium |
|---|---|---|
| Assets (Smart-Rechner) | 1 (nur Mietpreis) | Alle 18 |
| Standorte | 1 | Unbegrenzt |
| Leads (sichtbar/Monat) | 50 | Unbegrenzt |
| PDF-Designer | Nein | Ja |
| E-Mail-Templates | Nein | Ja |
| SMTP/Brevo | Nein (wp_mail) | Ja |
| Kommunikationscenter | Nein | Ja |
| Maklerverwaltung | Nein | Ja |
| Custom Branding | Nein | Ja |
| Webhooks | Nein | Ja |
| CSV-Export | Nein | Ja |
| CRM-Integrationen | Nein | Add-ons (Premium) |

## PHP: Feature-Gating Pattern

```php
// Standard: Premium-Code-Check
if ( resa_fs()->can_use_premium_code() ) {
    // Premium-Feature laden/aktivieren
}

// RESA FeatureGate Klasse verwenden
$gate = \Resa\Freemius\FeatureGate::getInstance();

if ( $gate->canUseFeature( 'pdf_designer' ) ) {
    // PDF-Designer aktivieren
}

if ( $gate->canActivateAsset( $asset_slug ) ) {
    // Asset aktivieren erlaubt
}

if ( $gate->canAddLocation() ) {
    // Neuen Standort hinzufügen erlaubt
}
```

## FeatureGate-Methoden

| Methode | Beschreibung |
|---|---|
| `isPremium()` | `can_use_premium_code()` Wrapper |
| `isFree()` | Auf Free-Plan? |
| `canUseFeature( $feature )` | Feature erlaubt? |
| `canActivateAsset( $slug )` | Asset aktivierbar? (Free: nur 'mietpreis') |
| `canAddLocation()` | Standort hinzufügbar? (Free: max 1) |
| `getVisibleLeadLimit()` | Lead-Limit (Free: 50, Premium: PHP_INT_MAX) |
| `getUpgradeUrl( $params )` | Checkout-URL |
| `getTrialUrl()` | Trial-Start-URL |
| `canStartTrial()` | Trial noch nicht genutzt? |

## Frontend: Plan-Info via resaConfig

```php
// PHP: Plan-Daten für React bereitstellen
wp_localize_script( 'resa-admin', 'resaConfig', [
    'plan' => [
        'isPremium'      => resa_fs()->can_use_premium_code(),
        'isTrial'        => resa_fs()->is_trial(),
        'isFreePlan'     => resa_fs()->is_free_plan(),
        'planName'       => resa_fs()->get_plan_name(),
        'upgradeUrl'     => resa_fs()->get_upgrade_url(),
        'trialUrl'       => resa_fs()->get_trial_url(),
        'trialAvailable' => ! resa_fs()->is_trial_utilized(),
    ],
] );
```

```typescript
// TypeScript: Plan-Check im Frontend
declare const resaConfig: {
    plan: {
        isPremium: boolean;
        isTrial: boolean;
        isFreePlan: boolean;
        planName: string;
        upgradeUrl: string;
        trialUrl: string;
        trialAvailable: boolean;
    };
};

// Feature-Gating in Komponenten
if ( !resaConfig.plan.isPremium ) {
    return <UpgradePrompt feature="pdf_designer" />;
}
```

## REST API: Plan-Check

```php
// Permission-Check mit Freemius
register_rest_route( 'resa/v1', '/premium-feature', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_premium_data' ],
    'permission_callback' => function () {
        return current_user_can( 'manage_options' )
            && resa_fs()->can_use_premium_code();
    },
] );

// Limit-basiert: Free-Leads cappen
public function get_leads( \WP_REST_Request $request ): \WP_REST_Response {
    $gate = FeatureGate::getInstance();
    $limit = min( $request['per_page'], $gate->getVisibleLeadLimit() );
    // ...
}

// Premium-Feature mit Upgrade-Hinweis verweigern
if ( ! $gate->canUseFeature( 'lead_export' ) ) {
    return new \WP_Error(
        'resa_premium_required',
        __( 'CSV-Export erfordert RESA Premium.', 'resa' ),
        [ 'status' => 403, 'upgradeUrl' => $gate->getUpgradeUrl() ]
    );
}
```

## Upgrade-CTA Platzierung

- **Admin-Seiten:** Banner/Inline-Prompt wenn Free-User Premium-Feature aufruft
- **Feature-Liste:** Lock-Icon + "Premium"-Badge bei gesperrten Features
- **Limit-Erreicht:** Dialog mit Upgrade-Link wenn Asset/Location/Lead-Limit erreicht
- **Sidebar:** Dezenter Upgrade-Hinweis im Dashboard

```typescript
// React: UpgradePrompt Komponente
<UpgradePrompt
    feature="pdf_designer"
    title={__( 'PDF-Designer freischalten', 'resa' )}
    description={__( 'Erstellen Sie individuelle PDF-Reports mit RESA Premium.', 'resa' )}
/>
```

## Plan-Check-Methoden Übersicht

| Methode | Beschreibung | Für RESA verwenden |
|---|---|---|
| `can_use_premium_code()` | Paying ODER Trial | **JA — Standard** |
| `is_paying()` | Nur mit bezahlter Lizenz | Selten |
| `is_free_plan()` | Free-Plan (kein Trial) | Für Upgrade-CTAs |
| `is_trial()` | Aktuell im Trial | Trial-Banner |
| `is_plan( $name )` | Exakter Plan-Match | Multi-Tier |
| `is_trial_utilized()` | Trial schon genutzt | Trial-Button zeigen |

## Anti-Patterns — NIEMALS verwenden

```php
// FALSCH: is_paying() statt can_use_premium_code()
if ( resa_fs()->is_paying() ) { /* Trial-User werden ausgeschlossen */ }

// FALSCH: secret_key im Plugin-Code
'secret_key' => 'sk_xxxxx',  // NIE im verteilten Code!

// FALSCH: Premium-Check vergessen bei sensiblen Daten
// Lead-Export ohne Freemius-Check verfügbar machen

// FALSCH: Plugin crasht wenn SDK fehlt
resa_fs()->can_use_premium_code(); // ohne Null-Check
// RICHTIG:
function resa_is_premium(): bool {
    return function_exists( 'resa_fs' ) && resa_fs()->can_use_premium_code();
}
```
