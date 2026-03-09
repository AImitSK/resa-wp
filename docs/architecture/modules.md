# Modulsystem

## Überblick

Lead Tools sind eigenständige Module unter `modules/{slug}/`. Jedes Modul registriert sich beim Kern und bringt eigene Berechnung, Frontend-Steps und Einstellungen mit.

## ModuleInterface

Jedes Modul implementiert `Resa\Core\ModuleInterface` (11 Methoden):

```php
interface ModuleInterface {
    public function getSlug(): string;        // z.B. 'rent-calculator'
    public function getName(): string;        // z.B. 'Mietpreis-Kalkulator'
    public function getDescription(): string;
    public function getIcon(): string;        // ResaIcon-Name, z.B. 'haus'
    public function getCategory(): string;    // z.B. 'calculator'
    public function getFlag(): string;        // 'free' | 'pro' | 'paid'
    public function isActive(): bool;
    public function setActive(bool $active): void;
    public function registerRoutes(): void;
    public function getSettingsSchema(): array;
    public function getFrontendConfig(): array;
    public function onActivate(): void;
    public function onDeactivate(): void;
}
```

### AbstractModule

Basisimplementierung in `Resa\Core\AbstractModule`:

- `isActive()` liest `get_option('resa_module_{slug}_active')`
- `setActive()` schreibt Option und ruft `onActivate()`/`onDeactivate()` auf
- `toArray()` serialisiert: slug, name, description, icon, category, flag, active

## ModuleRegistry

`Resa\Core\ModuleRegistry` verwaltet alle Module:

```php
$registry->register(ModuleInterface $module): void;
$registry->get(string $slug): ?ModuleInterface;
$registry->getAll(): array;
$registry->getActive(): array;
$registry->getActiveCount(): int;
$registry->has(string $slug): bool;
$registry->discover(): void;           // Lädt modules/*/module.php
$registry->registerModuleRoutes(): void;
```

### Discovery

`discover()` sucht via Glob nach `modules/*/module.php` und feuert dann den Action Hook:

```php
do_action('resa_register_modules', $this);
```

Module registrieren sich in ihrer `module.php`:

```php
add_action('resa_register_modules', function (ModuleRegistry $registry) {
    $registry->register(new RentCalculatorModule());
});
```

## Flag-System

| Flag   | Verfügbar           | Module                                                                      |
| ------ | ------------------- | --------------------------------------------------------------------------- |
| `free` | Immer (max 2 aktiv) | Mietpreis-Kalkulator, Immobilienwert-Kalkulator                             |
| `pro`  | Premium-Plan        | Kaufnebenkosten, Budget, Rendite, Energieeffizienz, Verkäufer-CL, Käufer-CL |
| `paid` | Zukunft             | Über Freemius Add-ons                                                       |

Die `FeatureGate`-Klasse prüft: `canUseModule(flag)` und `canActivateModule(flag)`.

## Implementierte Module

### rent-calculator (free)

Einziges bisher implementiertes Modul.

**Struktur:**

```
modules/rent-calculator/
  module.php                       # Bootstrap + Registration
  RentCalculatorModule.php         # ModuleInterface-Implementierung
  RentCalculatorService.php        # Berechnungslogik
  RentCalculatorController.php     # REST: /modules/rent-calculator/*
  src/
    steps/                         # 7 React Steps (Address, City, Condition, ...)
    result/                        # RentResult + MarketPositionGauge
    types.ts
    validation/schemas.ts
    RentCalculatorWidget.tsx        # Widget-Wrapper
```

**Berechnung:** Basis-Mietpreis × Größen-Degression × Lage × Zustand × Typ × Ausstattung × Alter

**REST-Endpunkte:**

- `GET /modules/rent-calculator/config` — Frontend-Konfiguration
- `POST /modules/rent-calculator/calculate` — Berechnung

## Geplante Module

Alle weiteren Module sind in der [Smart-Assets-Ideensammlung](../Smart-Assets-Ideensammlung.md) beschrieben.
