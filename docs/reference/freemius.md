# Freemius & Feature Gating

## FeatureGate (`includes/Freemius/FeatureGate.php`)

Zentrale Klasse für Plan-Erkennung und Feature-Limits.

## Plan-Erkennung

```php
$gate = new FeatureGate();
$gate->isPremium(): bool;   // Pro-Plan aktiv
$gate->isFree(): bool;      // Kein Premium
$gate->isTrial(): bool;     // Trial-Phase
```

Intern: `resa_fs()->can_use_premium_code()`

## Feature-Limits

| Feature              | Free | Pro        |
| -------------------- | ---- | ---------- |
| Aktive Module        | 2    | Alle       |
| Standorte            | 1    | Unbegrenzt |
| Sichtbare Leads      | 50   | Unbegrenzt |
| Lead-Export (CSV)    | —    | Ja         |
| PDF-Designer         | —    | Ja         |
| Custom SMTP          | —    | Ja         |
| Branding entfernen   | —    | Ja         |
| Webhooks             | —    | Ja (max 5) |
| API-Keys             | —    | Ja (max 5) |
| Messenger            | —    | Ja (max 5) |
| Erweiterte Analytics | —    | Ja         |

## Modul-Gating

```php
// Prüft ob ein Modul mit diesem Flag nutzbar ist
$gate->canUseModule(string $flag): bool;
// 'free' → immer true
// 'pro'  → nur wenn isPremium()
// 'paid' → false (Zukunft: Freemius Add-on Check)

// Prüft ob weiteres Modul aktiviert werden kann (Limit-Check)
$gate->canActivateModule(string $flag): bool;
```

## Weitere Gates

```php
$gate->canAddLocation(int $currentCount): bool;
$gate->getLeadLimit(): int;          // 50 oder PHP_INT_MAX
$gate->canExportLeads(): bool;
$gate->canUsePdfDesigner(): bool;
$gate->canUseSmtp(): bool;
$gate->canRemoveBranding(): bool;
$gate->canUseWebhooks(): bool;
$gate->canUseApiKeys(): bool;
$gate->canUseMessenger(): bool;
$gate->canUseAdvancedTracking(): bool;
```

## REST-Integration

`$gate->toArray()` liefert alle Gates als Array — wird über die Settings-API ans Frontend geliefert. Admin-Komponenten nutzen den `useFeatures()` Hook.

## Pattern im Code

```php
// PHP Backend
if ($featureGate->canUseWebhooks()) {
    // Webhook dispatchen
}

// React Frontend (via useFeatures Hook)
const { canExportLeads, canUseSmtp } = useFeatures();
if (!canExportLeads) {
    return <UpgradeBanner feature="CSV-Export" />;
}
```

## Module-Flags

| Flag   | Bedeutung                 | Beispiele                                              |
| ------ | ------------------------- | ------------------------------------------------------ |
| `free` | Immer verfügbar           | Mietpreis-Kalkulator, Immobilienwert-Kalkulator        |
| `pro`  | Nur mit Premium-Plan      | Kaufnebenkosten, Budget, Rendite, Energie, Checklisten |
| `paid` | Freemius Add-on (Zukunft) | CRM-Integrationen                                      |
