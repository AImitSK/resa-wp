# Ein neues Lead Tool Modul erstellen

## Überblick

Lead Tools sind eigenständige Module unter `modules/{slug}/`. Diese Anleitung zeigt, wie man ein neues Modul erstellt, am Beispiel des existierenden `rent-calculator`.

## 1. Verzeichnis anlegen

```
modules/
  my-calculator/
    module.php
    MyCalculatorModule.php
    MyCalculatorService.php
    MyCalculatorController.php
    src/
      steps/
      result/
      types.ts
      validation/schemas.ts
      MyCalculatorWidget.tsx
```

## 2. module.php — Bootstrap

```php
<?php
/**
 * Module: My Calculator
 */

use Resa\Core\ModuleRegistry;

add_action('resa_register_modules', function (ModuleRegistry $registry) {
    require_once __DIR__ . '/MyCalculatorModule.php';
    $registry->register(new \Resa\Modules\MyCalculator\MyCalculatorModule());
});
```

Die `ModuleRegistry` lädt automatisch alle `modules/*/module.php` Dateien.

## 3. ModuleInterface implementieren

```php
<?php
namespace Resa\Modules\MyCalculator;

use Resa\Core\AbstractModule;

class MyCalculatorModule extends AbstractModule {
    public function getSlug(): string       { return 'my-calculator'; }
    public function getName(): string       { return 'Mein Rechner'; }
    public function getDescription(): string { return 'Beschreibung...'; }
    public function getIcon(): string       { return 'calculator'; }  // ResaIcon-Name
    public function getCategory(): string   { return 'calculator'; }
    public function getFlag(): string       { return 'pro'; }  // 'free' | 'pro' | 'paid'

    public function registerRoutes(): void {
        $controller = new MyCalculatorController();
        $controller->register_routes();
    }

    public function getSettingsSchema(): array {
        return [
            'base_value' => ['type' => 'number', 'default' => 100],
            // ...
        ];
    }

    public function getFrontendConfig(): array {
        return [
            'slug' => $this->getSlug(),
            'name' => $this->getName(),
            'steps' => ['input', 'details', 'features'],
        ];
    }
}
```

## 4. CalculatorService

Die Berechnungslogik. Nimmt Eingaben, liest Modul-Settings und Standort-Faktoren, gibt Ergebnis zurück.

```php
<?php
namespace Resa\Modules\MyCalculator;

class MyCalculatorService {
    public function calculate(array $inputs, array $settings): array {
        // Berechnung...
        return [
            'value' => $result,
            'details' => [...],
        ];
    }
}
```

## 5. REST Controller

```php
<?php
namespace Resa\Modules\MyCalculator;

use Resa\Api\RestController;

class MyCalculatorController extends RestController {
    protected string $rest_base = 'modules/my-calculator';

    public function register_routes(): void {
        // GET /resa/v1/modules/my-calculator/config
        register_rest_route($this->namespace, '/' . $this->rest_base . '/config', [...]);

        // POST /resa/v1/modules/my-calculator/calculate
        register_rest_route($this->namespace, '/' . $this->rest_base . '/calculate', [...]);
    }
}
```

## 6. Frontend Steps

Jeder Step ist eine React-Komponente mit Zod-Schema:

```tsx
// modules/my-calculator/src/steps/InputStep.tsx
import { z } from 'zod';

export const inputStepSchema = z.object({
	value: z.number().min(1).max(10000),
});

export function InputStep({ data, onChange }) {
	return <div>{/* Eingabefelder */}</div>;
}
```

## 7. Result-Komponente

```tsx
// modules/my-calculator/src/result/MyResult.tsx
export function MyResult({ result, inputs }) {
	return <div>{/* Ergebnis-Darstellung, Charts, etc. */}</div>;
}
```

## 8. Widget-Wrapper

```tsx
// modules/my-calculator/src/MyCalculatorWidget.tsx
import { StepWizard } from '@frontend/components/shared/StepWizard';

export function MyCalculatorWidget({ config }) {
	const steps = [
		{ component: InputStep, schema: inputStepSchema, label: 'Eingabe' },
		// ...
	];

	return <StepWizard steps={steps} onComplete={handleComplete} />;
}
```

## 9. Im Frontend registrieren

In `src/frontend/main.tsx` die Module-Map erweitern:

```tsx
const MODULE_MAP = {
	'rent-calculator': RentCalculatorWidget,
	'my-calculator': MyCalculatorWidget, // Neu
};
```

## 10. Composer Autoloading

In `composer.json` den PSR-4 Namespace hinzufügen:

```json
{
	"autoload": {
		"psr-4": {
			"Resa\\Modules\\MyCalculator\\": "modules/my-calculator/"
		}
	}
}
```

Dann: `composer dump-autoload`

## 11. Testen

- PHP Unit Tests unter `modules/my-calculator/tests/` oder `tests/php/Unit/Modules/MyCalculator/`
- JS Tests unter `tests/js/modules/my-calculator/`
- Modul im Admin unter "Module" aktivieren
- Shortcode testen: `[resa module="my-calculator"]`
