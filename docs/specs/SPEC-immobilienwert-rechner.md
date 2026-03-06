# SPEC: Immobilienwert-Rechner Modul

**Status:** Entwurf
**Erstellt:** 2026-03-06
**Betrifft:** Zweites Lead Tool Modul — Verkaufswert-Schätzung für Wohnimmobilien

## Zusammenfassung

Der Immobilienwert-Rechner ist das zweite Free-Modul im RESA-System und folgt exakt dem Pattern des Mietpreis-Kalkulators. Besucher durchlaufen einen 7-Step-Wizard (Immobilienart → Grunddaten → Stadt → Zustand → Lage → Ausstattung → Adresse), erhalten eine Verkaufswert-Schätzung, und werden als Lead erfasst. Die Berechnungslogik basiert auf der Mietpreis-Berechnung multipliziert mit einem konfigurierbaren Vervielfältiger (sale_factor). Das Modul ist das zweite **free**-Modul und damit auch für Free-Plan-Nutzer verfügbar.

## Betroffene Dateien

### Neue Dateien

**PHP (Backend):**

- `modules/value-calculator/module.php` — Bootstrap, registriert bei ModuleRegistry
- `modules/value-calculator/ValueCalculatorModule.php` — ModuleInterface Implementierung
- `modules/value-calculator/ValueCalculatorService.php` — Berechnungslogik
- `modules/value-calculator/ValueCalculatorController.php` — REST API Controller
- `includes/Services/Pdf/Templates/value-analysis.php` — PDF-Template

**TypeScript (Frontend):**

- `modules/value-calculator/src/ValueCalculatorWidget.tsx` — Orchestriert StepWizard + LeadForm + Ergebnis
- `modules/value-calculator/src/steps/` — Kopiert von rent-calculator (identische Steps)
- `modules/value-calculator/src/result/ValueResult.tsx` — Ergebnis-Darstellung
- `modules/value-calculator/src/result/ValueComparisonChart.tsx` — Balkendiagramm für Wertvergleich
- `modules/value-calculator/src/validation/schemas.ts` — Zod-Schemas (identisch zu rent-calculator)
- `modules/value-calculator/src/types.ts` — TypeScript Interfaces

### Geänderte Dateien

- `src/frontend/components/widget-root/WidgetRoot.tsx` — Import und Registrierung des Value-Calculator
- `src/frontend/types/index.ts` — Typen für ValueCalculation Result

## API-Änderungen

### Neue Endpoints

| Methode | Route                                         | Beschreibung                              | Auth   |
| ------- | --------------------------------------------- | ----------------------------------------- | ------ |
| POST    | `/resa/v1/modules/value-calculator/calculate` | Immobilienwert berechnen                  | Public |
| GET     | `/resa/v1/modules/value-calculator/config`    | Modul-Konfiguration (Steps, Städte-Liste) | Public |

### Bestehende Endpoints (genutzt, nicht geändert)

| Methode | Route                     | Beschreibung                     |
| ------- | ------------------------- | -------------------------------- |
| POST    | `/resa/v1/leads/partial`  | Partial Lead erstellen (Phase 1) |
| POST    | `/resa/v1/leads/complete` | Lead vervollständigen (Phase 2)  |
| POST    | `/resa/v1/tracking`       | Funnel-Events aufzeichnen        |

## Datenbank-Änderungen

### Keine neuen Tabellen

Nutzt die bestehende Infrastruktur:

- `resa_leads` — Lead-Daten mit `asset_type = 'value-calculator'`
- `resa_locations` — Stadt-Daten inkl. Multiplikatoren und `sale_factor` in `data` JSON
- `resa_tracking_daily` — Funnel-Tracking mit `asset_type = 'value-calculator'`

### resa_locations.data — Zusätzlicher sale_factor

Die Location-Daten enthalten bereits `sale_factor` (Vervielfältiger für Jahresmiete → Verkaufswert):

```json
{
	"base_price": 12.0,
	"sale_factor": 25
	// ... restliche Faktoren wie beim Mietpreis
}
```

**sale_factor Richtwerte nach Regionstyp:**

| Regionstyp             | sale_factor | Erklärung                |
| ---------------------- | ----------- | ------------------------ |
| Ländlich               | 18–22       | Niedrigere Nachfrage     |
| Kleinstadt / Stadtrand | 20–25       | Moderate Nachfrage       |
| Mittelstadt            | 22–28       | Gute Nachfrage           |
| Großstadt / Zentrum    | 25–35       | Hohe Nachfrage, begrenzt |

## Modul-Klassifizierung

| Eigenschaft    | Wert                       |
| -------------- | -------------------------- |
| **Typ**        | Lead Tool Modul            |
| **Modul-Flag** | `free`                     |
| **Modul-Slug** | `value-calculator`         |
| **Kategorie**  | `calculator`               |
| **Icon**       | `euro` (aus Icon Registry) |

## Free vs. Premium

| Feature-Aspekt     | Free                    | Pro                          |
| ------------------ | ----------------------- | ---------------------------- |
| Modul verfügbar    | Ja (Flag: free)         | Ja                           |
| Einrichtungsmodus  | Pauschal + Individuell  | Pauschal + Individuell       |
| Anzahl Locations   | 1 Stadt                 | Unbegrenzt                   |
| Lead-Erfassung     | Max. 50 sichtbare Leads | Unbegrenzt                   |
| PDF-Export         | Basis-Template (DOMPDF) | Premium-Template (Puppeteer) |
| Branding entfernen | Nein                    | Ja                           |
| Lead-Export (CSV)  | Nein                    | Ja                           |
| SMTP/Brevo Email   | Nein (wp_mail)          | Ja                           |

---

## Berechnungslogik

### Formel: Immobilienwert-Schätzung

Die Berechnung basiert auf der Mietpreis-Formel mit anschließender Multiplikation:

```
1. Mietpreis-Berechnung (identisch zu rent-calculator):
   preis_m2 = basis_preis × size_factor × lage × zustand × typ × alter + features

2. Jahresmiete:
   jahresmiete = wohnfläche × preis_m2 × 12

3. Verkaufswert:
   verkaufswert = jahresmiete × sale_factor

4. Spanne (±10%):
   verkaufswert_min = verkaufswert × 0.90
   verkaufswert_max = verkaufswert × 1.10

5. Preis pro m²:
   preis_pro_m2 = verkaufswert / wohnfläche
```

### Marktposition

```
ratio = preis_pro_m2 / (base_price × 12 × sale_factor / 70)

< 0.85  → 20%  "Unterdurchschnittlich"
0.85–0.95 → 35%  "Leicht unterdurchschnittlich"
0.95–1.05 → 50%  "Durchschnittlich"
1.05–1.15 → 65%  "Überdurchschnittlich"
1.15–1.25 → 80%  "Deutlich überdurchschnittlich"
> 1.25  → 90%  "Premium-Segment"
```

---

## UI/UX

### Frontend-Widget: Wizard-Flow

Identisch zum Mietpreis-Kalkulator, 7 Steps:

```
[PropertyType] → [Details] → [City] → [Condition] → [Location] → [Features] → [Address]
                                                                                  ↓
                                                                           API: /calculate
                                                                                  ↓
                                                                           [Loading-Screen]
                                                                                  ↓
                                                                          API: /leads/partial
                                                                                  ↓
                                                                             [LeadForm]
                                                                                  ↓
                                                                          API: /leads/complete
                                                                                  ↓
                                                                            [ValueResult]
```

### Steps (identisch zu rent-calculator)

Die Steps werden vom Mietpreis-Kalkulator kopiert oder per Import wiederverwendet:

1. **PropertyTypeStep** — Wohnung / Haus
2. **PropertyDetailsStep** — Wohnfläche, Zimmer, Baujahr
3. **CityStep** — Standort-Auswahl
4. **ConditionStep** — Zustand
5. **LocationRatingStep** — Lage 1–5
6. **FeaturesStep** — Ausstattungsmerkmale
7. **AddressStep** — Adresse (optional, mit Karte)

### Ergebnis-Darstellung (ValueResult)

```
┌─────────────────────────────────────────────────┐
│  Geschätzter Immobilienwert                      │
│  ══════════════════════════                      │
│       385.500 €                                  │
│    (346.950 € – 424.050 €)                      │
├────────────────────┬────────────────────────────┤
│  Preis pro m²      │  Jährliche Mieteinnahmen   │
│   5.507 €/m²       │   15.420 €                 │
├────────────────────┴────────────────────────────┤
│  Marktposition           [====●=====] 65%       │
│  "Überdurchschnittlich"                         │
├─────────────────────────────────────────────────┤
│  [█████████████] Ihr Wert: 385.500 €            │
│  [███████████  ] Durchschnitt: 350.000 €        │
│  Vergleich zum Durchschnittswert: +10%          │
├─────────────────────────────────────────────────┤
│  Ihre Eingaben:                                  │
│  • Wohnung, 70 m², München                      │
│  • Guter Zustand, Gute Lage (3/5)              │
│  • Balkon, Einbauküche                          │
├─────────────────────────────────────────────────┤
│  📈 Ein Immobilienexperte analysiert Ihre Daten │
│  und meldet sich in Kürze bei Ihnen.            │
└─────────────────────────────────────────────────┘
```

**Unterschiede zum Mietpreis-Ergebnis:**

1. Hauptwert ist der Verkaufspreis (nicht Monatsmiete)
2. Zusätzliches Balkendiagramm für Wertvergleich (SimpleBarChart)
3. Jahresmiete als Nebenwert (statt Hauptwert)
4. Vergleich zum Durchschnittswert in %

---

## Implementierungsdetails

### Modul-Struktur

```
modules/value-calculator/
├── module.php                        # Bootstrap
├── ValueCalculatorModule.php         # ModuleInterface
├── ValueCalculatorService.php        # Berechnungslogik (PHP)
├── ValueCalculatorController.php     # REST API Controller
├── src/
│   ├── ValueCalculatorWidget.tsx     # Orchestriert Wizard + Result
│   ├── steps/                        # Kopiert von rent-calculator
│   │   ├── PropertyTypeStep.tsx
│   │   ├── PropertyDetailsStep.tsx
│   │   ├── CityStep.tsx
│   │   ├── ConditionStep.tsx
│   │   ├── LocationRatingStep.tsx
│   │   ├── FeaturesStep.tsx
│   │   └── AddressStep.tsx
│   ├── result/
│   │   ├── ValueResult.tsx
│   │   └── ValueComparisonChart.tsx
│   ├── validation/
│   │   └── schemas.ts
│   └── types.ts
└── tests/
    ├── php/
    │   ├── ValueCalculatorServiceTest.php
    │   └── ValueCalculatorControllerTest.php
    └── js/
        ├── ValueCalculatorWidget.test.tsx
        └── ValueResult.test.tsx
```

### PHP: ValueCalculatorService

```php
namespace Resa\Modules\ValueCalculator;

use Resa\Modules\RentCalculator\RentCalculatorService;

class ValueCalculatorService {
    private const RANGE_FACTOR = 0.10;  // ±10%

    public static function calculate(array $inputs, array $locationData): array {
        // 1. Mietpreis berechnen (Wiederverwendung)
        $rentResult = RentCalculatorService::calculate($inputs, $locationData);

        // 2. Verkaufswert berechnen
        $saleFactor = $locationData['sale_factor'] ?? 25;
        $annualRent = $rentResult['annual_rent'];
        $propertyValue = $annualRent * $saleFactor;

        // 3. Spanne
        $valueMin = $propertyValue * (1 - self::RANGE_FACTOR);
        $valueMax = $propertyValue * (1 + self::RANGE_FACTOR);

        // 4. Preis pro m²
        $size = $inputs['size'];
        $pricePerSqm = $propertyValue / $size;

        // 5. Durchschnittswert berechnen
        $avgValue = self::calculateAverageValue($locationData, $size);
        $comparison = ($propertyValue - $avgValue) / $avgValue;

        return [
            'property_value' => [
                'estimate' => round($propertyValue, -2),
                'low' => round($valueMin, -2),
                'high' => round($valueMax, -2),
            ],
            'price_per_sqm' => round($pricePerSqm, 2),
            'annual_rent' => $rentResult['annual_rent'],
            'monthly_rent' => $rentResult['monthly_rent'],
            'sale_factor' => $saleFactor,
            'market_position' => $rentResult['market_position'],
            'average_value' => round($avgValue, -2),
            'comparison_percent' => round($comparison * 100, 1),
            'factors' => $rentResult['factors'],
        ];
    }

    private static function calculateAverageValue(array $locationData, float $size): float {
        $basePrice = $locationData['base_price'];
        $saleFactor = $locationData['sale_factor'] ?? 25;
        return $basePrice * $size * 12 * $saleFactor;
    }
}
```

### TypeScript: ValueCalculationResult

```typescript
interface ValueCalculationResult {
	property_value: { estimate: number; low: number; high: number };
	price_per_sqm: number;
	annual_rent: number;
	monthly_rent: { estimate: number; low: number; high: number };
	sale_factor: number;
	market_position: { percentile: number; label: string };
	average_value: number;
	comparison_percent: number;
	city: { id: number; name: string };
	factors: {
		base_price: number;
		size_factor: number;
		location_impact: number;
		condition_impact: number;
		type_impact: number;
		age_impact: number;
		features_count: number;
	};
}
```

### PDF-Template: value-analysis.php

Das PDF-Template für die Wertanalyse enthält:

1. **Header:** Logo, Datum, Standort
2. **Hauptergebnis:** Geschätzter Immobilienwert mit Spanne
3. **Wertkennzahlen:**
    - Preis pro m²
    - Jahresmiete (potenzielle Mieteinnahmen)
    - Vervielfältiger (sale_factor)
4. **Vergleichsdiagramm:** SimpleBarChart mit Ihr Wert vs. Durchschnitt
5. **Marktposition-Gauge:** SimpleGaugeChart
6. **Eingabedaten-Tabelle:** Alle erfassten Daten
7. **Karte:** Standort-Visualisierung (wenn Adresse angegeben)
8. **Disclaimer:** Rechtlicher Hinweis

```php
// includes/Services/Pdf/Templates/value-analysis.php
// Struktur analog zu rent-analysis.php

$propertyValue = $result['property_value'];
$comparison = $result['comparison_percent'];

// Vergleichsdiagramm-Daten
$chartData = [
    ['label' => __('Ihr Wert', 'resa'), 'value' => $propertyValue['estimate']],
    ['label' => __('Durchschnitt', 'resa'), 'value' => $result['average_value']],
];
```

### Shortcode-Integration

```
[resa type="value-calculator"]                    # Standard (alle Steps)
[resa type="value-calculator" city="muenchen"]    # Stadt vorgewählt (Step 3 entfällt)
```

---

## Akzeptanzkriterien

- [ ] Modul registriert sich bei ModuleRegistry mit Flag `free` und kann aktiviert werden
- [ ] 7-Step-Wizard durchlaufbar mit Framer Motion Animationen
- [ ] Berechnung nutzt Mietpreis-Logik und multipliziert mit sale_factor
- [ ] Ergebnis zeigt Verkaufswert, Spanne (±10%), Preis/m², Jahresmiete
- [ ] Vergleichsbalken zeigt Ihr Wert vs. Durchschnitt
- [ ] Marktposition als Gauge dargestellt (wiederverwendet von rent-calculator)
- [ ] LeadForm erfasst Lead in zwei Phasen (partial → complete)
- [ ] Lead wird mit `asset_type = 'value-calculator'` und Inputs/Result in DB gespeichert
- [ ] PDF-Template `value-analysis.php` generiert korrektes PDF mit Diagrammen
- [ ] Tracking-Events werden korrekt aufgezeichnet
- [ ] `/config` Endpoint liefert Städte-Liste und Modul-Konfiguration
- [ ] `/calculate` Endpoint validiert Inputs und gibt strukturiertes Ergebnis zurück
- [ ] Shortcode `[resa type="value-calculator"]` rendert den Rechner
- [ ] CSS-Isolation: Alle Klassen mit `resa-` Prefix
- [ ] Alle User-facing Strings mit gettext (`__()`)
- [ ] FeatureGate wird respektiert (Free: max 2 free-Module, 1 Location, 50 Leads)

---

## Security-Überlegungen

Identisch zum Mietpreis-Kalkulator:

- **REST `/calculate`:** Public, Inputs validieren
- **REST `/config`:** Public, read-only
- **Inputs sanitizen:** `sanitize_text_field()`, `absint()`, `floatval()`
- **Outputs escapen:** `esc_html()`, `esc_attr()`

---

## Testplan

### PHP Unit Tests

- `ValueCalculatorService::calculate()` — Happy Path
- `ValueCalculatorService::calculate()` — Korrekte Multiplikation mit sale_factor
- `ValueCalculatorService::calculate()` — Spanne ±10%
- `ValueCalculatorService::calculate()` — Vergleich zu Durchschnitt berechnen
- `ValueCalculatorController::calculate()` — Validierung
- `ValueCalculatorModule` — getSlug, getName, getFlag, toArray

### JS Unit Tests

- `ValueCalculatorWidget` — Rendert StepWizard mit 7 Steps
- `ValueResult` — Zeigt alle Ergebniswerte korrekt formatiert
- `ValueResult` — DACH-Formatierung (Tausendertrennzeichen, €)
- `ValueComparisonChart` — Rendert Balkendiagramm

---

## Offene Fragen

Keine — Pattern vom Mietpreis-Kalkulator übernommen.

---

## Abhängigkeiten

- ✅ Mietpreis-Kalkulator (als Referenz und für Service-Wiederverwendung)
- ✅ ModuleRegistry + AbstractModule
- ✅ REST API Basis + RestController
- ✅ StepWizard Framework
- ✅ LeadForm + Lead-Capture
- ✅ PDF-Service mit SimpleBarChart
- ✅ Tracking-Service

---

## Implementierungsplan

### Phase 1: Backend (PHP)

1. `modules/value-calculator/module.php` — Bootstrap
2. `ValueCalculatorModule.php` — ModuleInterface Implementation
3. `ValueCalculatorService.php` — Berechnungslogik (nutzt RentCalculatorService)
4. `ValueCalculatorController.php` — REST Endpoints

### Phase 2: Frontend (TypeScript)

5. Step-Komponenten kopieren von rent-calculator
6. `ValueCalculatorWidget.tsx` — Widget-Orchestrierung
7. `ValueResult.tsx` — Ergebnis-Darstellung
8. `ValueComparisonChart.tsx` — Balkendiagramm
9. Widget in WidgetRoot.tsx registrieren

### Phase 3: PDF

10. `value-analysis.php` — PDF-Template erstellen

### Phase 4: Tests

11. PHP Unit Tests
12. JS Unit Tests
