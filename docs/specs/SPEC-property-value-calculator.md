# SPEC: Immobilienwert-Kalkulator

**Status:** Entwurf
**Erstellt:** 2026-03-10
**Betrifft:** Neues Lead Tool Modul — Kaufpreis-Schätzung für Haus und Wohnung

## Zusammenfassung

Der Immobilienwert-Kalkulator schätzt den Marktwert einer Immobilie anhand eines vereinfachten Vergleichswertverfahrens. Besucher durchlaufen einen 9-Step-Wizard (Immobilienart, Unterart, Flächen, Baujahr, Zustand + Vermietungsstatus, Ausstattungsqualität, Extras, Standort, Lage), geben ihre Kontaktdaten ab und erhalten eine geschätzte Preisspanne. Dies ist das zweite Lead Tool Modul nach dem Mietpreis-Kalkulator und nutzt dieselbe Modularchitektur.

## Betroffene Dateien

### Neue Dateien

**Backend (PHP):**

- `modules/property-value/module.php` — Bootstrap, registriert bei ModuleRegistry
- `modules/property-value/PropertyValueModule.php` — AbstractModule-Implementierung
- `modules/property-value/PropertyValueService.php` — Berechnungslogik
- `modules/property-value/PropertyValueController.php` — REST-Endpoints

**Frontend (React/TS):**

- `modules/property-value/src/types.ts` — TypeScript-Interfaces
- `modules/property-value/src/PropertyValueWidget.tsx` — Widget-Entry (registriert Steps)
- `modules/property-value/src/validation/schemas.ts` — Zod-Schemas
- `modules/property-value/src/steps/PropertyTypeStep.tsx` — Haus / Wohnung
- `modules/property-value/src/steps/PropertySubtypeStep.tsx` — Unterart je nach Typ
- `modules/property-value/src/steps/PropertyDetailsStep.tsx` — Wohnfläche, Grundstück, Zimmer
- `modules/property-value/src/steps/YearBuiltStep.tsx` — Baujahr (Slider + Eingabe)
- `modules/property-value/src/steps/ConditionStep.tsx` — Zustand + Vermietungsstatus
- `modules/property-value/src/steps/QualityStep.tsx` — Ausstattungsqualität (Gehoben/Normal/Einfach)
- `modules/property-value/src/steps/FeaturesStep.tsx` — Extras (Checkboxen)
- `modules/property-value/src/result/PropertyValueResult.tsx` — Ergebnis-Seite
- `modules/property-value/src/result/FactorBreakdownChart.tsx` — Wertfaktoren-Visualisierung

### Geänderte Dateien (Vorarbeit: Shared Steps)

- `src/frontend/components/shared/steps/CityStep.tsx` — **NEU** (extrahiert aus Rent-Calculator)
- `src/frontend/components/shared/steps/AddressStep.tsx` — **NEU** (extrahiert aus Rent-Calculator)
- `src/frontend/components/shared/steps/LocationRatingStep.tsx` — **NEU** (extrahiert aus Rent-Calculator)
- `modules/rent-calculator/src/RentCalculatorWidget.tsx` — Imports auf Shared Steps umstellen
- `modules/rent-calculator/src/steps/` — CityStep, AddressStep, LocationRatingStep entfernen (→ Shared)

## API-Änderungen

### Neue Endpoints

| Methode | Route                                       | Beschreibung                                     | Auth   |
| ------- | ------------------------------------------- | ------------------------------------------------ | ------ |
| POST    | `/resa/v1/modules/property-value/calculate` | Berechnung ausführen                             | Public |
| GET     | `/resa/v1/modules/property-value/config`    | Modul-Konfiguration (Städte, Features, Subtypen) | Public |

### Bestehende Endpoints (unverändert)

Admin-Modul-Settings (`/resa/v1/admin/modules/{slug}/settings`) werden über das bestehende generische Settings-System bedient — kein neuer Admin-Endpoint nötig.

## Datenbank-Änderungen

Keine. Das Modul nutzt die bestehenden Tabellen:

- `resa_module_settings` — Speichert Faktoren + Location-Overrides (Slug: `property-value`)
- `resa_leads` — Leads mit `module_slug = 'property-value'`
- `resa_locations` — Wiederverwendung der bestehenden Standorte

## Modul-Klassifizierung

| Eigenschaft    | Wert             |
| -------------- | ---------------- |
| **Typ**        | Lead Tool Modul  |
| **Modul-Flag** | `pro`            |
| **Modul-Slug** | `property-value` |

## Free vs. Premium

| Feature-Aspekt                | Free                 | Pro |
| ----------------------------- | -------------------- | --- |
| Modul sichtbar im ModuleStore | Ja (mit Upgrade-CTA) | Ja  |
| Modul aktivierbar             | Nein                 | Ja  |
| Widget einbettbar             | Nein                 | Ja  |
| Berechnung ausführbar         | Nein                 | Ja  |

FeatureGate prüft `resa_fs()->can_use_premium_code()` + Modul-Flag `pro`.

## UI/UX

### Frontend-Widget (9 Steps)

#### Step 1: Immobilienart (`property_type`)

2 SelectionCards im Grid:

- **Haus** (Icon: `haus`)
- **Wohnung** (Icon: `wohnung`)

Heading: _"Um welche Immobilie geht es?"_

#### Step 2: Unterart (`property_subtype`)

Dynamisch basierend auf `property_type`:

**Bei Haus** (5 Optionen, 2×3 Grid):
| Key | Label | Icon |
|-----|-------|------|
| `efh` | Einfamilienhaus | `haus` |
| `rh` | Reihenhaus | `reihenhaus` |
| `dhh` | Doppelhaushälfte | `doppelhaushaelfte` |
| `zfh` | Zweifamilienhaus | `zweifamilienhaus` |
| `mfh` | Mehrfamilienhaus | `mehrfamilienhaus` |

**Bei Wohnung** (5 Optionen, 2×3 Grid):
| Key | Label | Icon |
|-----|-------|------|
| `eg` | Erdgeschosswohnung | `erdgeschoss` |
| `etage` | Etagenwohnung | `etagenwohnung` |
| `dg` | Dachgeschosswohnung | `dachgeschoss` |
| `maisonette` | Maisonette | `maisonette` |
| `penthouse` | Penthouse | `penthouse` |

Heading: _"Bitte wählen Sie die Art Ihres Hauses."_ / _"Bitte wählen Sie die Art Ihrer Wohnung."_

#### Step 3: Flächen + Zimmer (`details`)

3 Felder:

- **Wohnfläche** (m²) — Pflicht. Slider (30–300, Default 120) + Direkteingabe. Range 10–10.000.
- **Grundstücksfläche** (m²) — Nur bei `property_type === 'house'`. Slider (100–2000, Default 500) + Direkteingabe.
- **Zimmeranzahl** — Optional. Select (1, 1.5, 2, ..., 6+).

Heading: _"Fläche und Zimmer"_

#### Step 4: Baujahr (`year_built`)

Slider (1900–2026, Default 1980) + Direkteingabe-Feld.
Bereichsanzeige mit Label (z.B. "60er/70er Jahre").

Heading: _"Wann wurde die Immobilie gebaut?"_

#### Step 5: Zustand + Vermietungsstatus (`condition` + `rental_status`)

**Zustand** — 4 SelectionCards (2×2 Grid, wie Rent-Calculator):

- Neubau / Kernsaniert (`new`)
- Kürzlich renoviert (`renovated`)
- Guter Zustand (`good`)
- Renovierungsbedürftig (`needs_renovation`)

**Vermietungsstatus** — 3 Radio-Buttons/SelectionCards darunter:

- Eigennutzung (`owner_occupied`)
- Vermietet (`rented`)
- Leerstand (`vacant`)

Heading: _"Zustand und Nutzung"_

#### Step 6: Ausstattungsqualität (`quality`)

3 SelectionCards (horizontal):

- **Gehoben** (`premium`) — Icon: `premium`, Beschreibung: _"Hochwertige Materialien, Designer-Küche, Smart Home"_
- **Normal** (`normal`) — Icon: `standard`, Beschreibung: _"Zeitgemäße Ausstattung, guter Standard"_
- **Einfach** (`basic`) — Icon: `einfach`, Beschreibung: _"Einfache, zweckmäßige Ausstattung"_

Heading: _"Wie ist die Ausstattung Ihrer Immobilie?"_

#### Step 7: Extras (`features`)

Identisch zum Rent-Calculator (FeaturesStep wiederverwendbar). 11 Feature-Checkboxen + Freitext.
Zusätzlich: `solar` (Solar/PV-Anlage, Icon: `solar`).

Heading: _"Welche Extras hat Ihre Immobilie?"_

#### Step 8: Standort (`city` + `address`)

Wiederverwendung der Shared CityStep + AddressStep.
Keine Änderungen nötig.

#### Step 9: Lage (`location_rating`)

Wiederverwendung der Shared LocationRatingStep.
Keine Änderungen nötig.

### Ergebnis-Seite

```
┌─────────────────────────────────────┐
│       Geschätzter Marktwert         │
│           385.000 €                 │  ← Hero (groß, Primary-Color)
│      327.000 € – 431.000 €         │  ← Spanne (±12%)
└─────────────────────────────────────┘

┌──────────────┐  ┌──────────────────┐
│  3.210 €/m²  │  │  Grundstück      │  ← 2 Stat-Kacheln
│  Kaufpreis   │  │  45.000 €        │  (Grundstück nur bei Haus)
└──────────────┘  └──────────────────┘

       ▼ Marktposition ▼               ← MarketPositionGauge
   [====●============] 65%
   "Überdurchschnittlich"

    Marktvergleich (€/m²)              ← ComparisonBarChart
    ████████████ 3.210 € Ihre Immobilie
    █████████    2.800 € Ø Stadtgebiet
    ██████       2.200 € Ø Landkreis

    Wertfaktoren                        ← FactorBreakdownChart (NEU)
    Lage          +10%  ████▓
    Ausstattung   +25%  ██████▓
    Zustand        0%   ███
    Alter          -5%  ██▒
    Vermietung     0%   ███

    📍 Standort                         ← ResaMap
    [Leaflet Map]

    Ihre Eingaben                       ← Zusammenfassung
    EFH · 120 m² · 500 m² Grundstück
    Guter Zustand · Normale Ausstattung
    Balkon, Garage, Einbauküche

    ┌─────────────────────────────────┐
    │  Ein Immobilienexperte meldet   │  ← Agent CTA
    │  sich in Kürze bei Ihnen.      │
    └─────────────────────────────────┘
```

## Implementierungsdetails

### PHP-Klassen

#### PropertyValueModule (extends AbstractModule)

```php
class PropertyValueModule extends AbstractModule {
    public function getSlug(): string       → 'property-value'
    public function getName(): string       → 'Immobilienwert-Kalkulator'
    public function getDescription(): string → 'Schätzt den Marktwert ...'
    public function getIcon(): string       → 'haus-euro'
    public function getCategory(): string   → 'calculator'
    public function getFlag(): string       → 'pro'
    public function registerRoutes(): void  → PropertyValueController
    public function getFrontendConfig(): array → 9 Steps
    public function getSettingsSchema(): array → Faktoren + Location-Values
}
```

#### PropertyValueService

Statische `calculate()`-Methode, analog zu RentCalculatorService.

```php
class PropertyValueService {
    const RANGE_FACTOR = 0.12;        // ±12% Spanne
    const REFERENCE_SIZE = 100.0;     // Referenzgröße für Degression

    const ALLOWED_TYPES = ['house', 'apartment'];
    const ALLOWED_SUBTYPES_HOUSE = ['efh', 'rh', 'dhh', 'zfh', 'mfh'];
    const ALLOWED_SUBTYPES_APARTMENT = ['eg', 'etage', 'dg', 'maisonette', 'penthouse'];
    const ALLOWED_CONDITIONS = ['new', 'renovated', 'good', 'needs_renovation'];
    const ALLOWED_QUALITIES = ['premium', 'normal', 'basic'];
    const ALLOWED_RENTAL_STATUS = ['owner_occupied', 'rented', 'vacant'];
    const ALLOWED_FEATURES = [
        'balcony', 'terrace', 'garden', 'elevator', 'parking',
        'garage', 'cellar', 'fitted_kitchen', 'floor_heating',
        'guest_toilet', 'barrier_free', 'solar',
    ];

    public static function calculate(array $inputs, array $locationData): array
    // Returns:
    // - estimated_value: { estimate, low, high }
    // - price_per_sqm
    // - plot_value (nur bei Haus)
    // - market_position: { percentile, label }
    // - city_average, county_average
    // - factors: { base_price, size_factor, type_impact, subtype_impact,
    //              condition_impact, age_impact, quality_impact,
    //              location_impact, rental_impact, feature_premium }

    public static function getRegionPresets(): array
    // 4 Presets: rural, small_town, medium_city, large_city
    // Mit Kaufpreis-Skala statt Miet-Skala
}
```

**Berechnungsformel:**

```
preis_pro_m² = basis_kaufpreis
    × getSizeFactor(wohnfläche, degression)
    × type_multipliers[property_type]
    × subtype_multipliers[property_subtype]
    × condition_multipliers[condition]
    × getAgeMultiplier(year_built, age_multipliers)
    × quality_multipliers[quality]
    × getLocationMultiplier(location_rating, location_ratings)
    × rental_discount[rental_status]
    + getFeaturePremium(features, feature_premiums)

plot_value = plot_size × plot_price_per_sqm  // nur bei Haus

estimated_value = wohnfläche × preis_pro_m² + plot_value
low  = estimated_value × (1 - 0.12)
high = estimated_value × (1 + 0.12)
```

#### PropertyValueController (extends RestController)

```php
class PropertyValueController extends RestController {
    // POST /modules/property-value/calculate
    public function calculate(WP_REST_Request $request): WP_REST_Response|WP_Error
    // Validierung:
    // - city_id: required, absint
    // - size: required, 10–10.000
    // - property_type: required, ALLOWED_TYPES
    // - property_subtype: required, ALLOWED_SUBTYPES_HOUSE|APARTMENT
    // - condition: required, ALLOWED_CONDITIONS
    // - quality: required, ALLOWED_QUALITIES
    // - location_rating: required, 1–5
    // - rental_status: optional, ALLOWED_RENTAL_STATUS, default 'owner_occupied'
    // - features: optional, array, gegen ALLOWED_FEATURES validiert
    // - year_built: optional, 1800–aktuelles Jahr+5
    // - plot_size: optional (nur bei Haus), 0–100.000
    // - rooms: optional (nur für Lead, nicht Berechnung)

    // GET /modules/property-value/config
    public function getConfig(WP_REST_Request $request): WP_REST_Response
    // Returns: cities, features, subtypes_house, subtypes_apartment
}
```

### TypeScript-Interfaces

```typescript
interface PropertyValueData {
	property_type?: 'house' | 'apartment';
	property_subtype?: string; // efh | rh | dhh | ... | eg | etage | ...
	size?: number; // Wohnfläche m²
	plot_size?: number; // Grundstück m² (nur Haus)
	rooms?: number;
	year_built?: number;
	condition?: 'new' | 'renovated' | 'good' | 'needs_renovation';
	quality?: 'premium' | 'normal' | 'basic';
	rental_status?: 'owner_occupied' | 'rented' | 'vacant';
	features?: string[];
	additional_features?: string;
	// Shared Step Daten (City + Address + LocationRating):
	city_id?: number;
	city_name?: string;
	city_slug?: string;
	city_lat?: number;
	city_lng?: number;
	address?: string;
	address_lat?: number;
	address_lng?: number;
	location_rating?: number;
}

interface PropertyValueResult {
	estimated_value: { estimate: number; low: number; high: number };
	price_per_sqm: number;
	plot_value: number | null; // nur bei Haus
	market_position: { percentile: number; label: string };
	city_average: number;
	county_average: number;
	city: { id: number; name: string; slug: string };
	factors: {
		base_price: number;
		size_factor: number;
		type_impact: number;
		subtype_impact: number;
		condition_impact: number;
		age_impact: number;
		quality_impact: number;
		location_impact: number;
		rental_impact: number;
		feature_premium: number;
		features_count: number;
	};
}
```

### Zod-Schemas

```typescript
// Neue Schemas (zusätzlich zu den wiederverwendbaren):
getPropertySubtypeSchema(propertyType); // dynamisch: efh/rh/... oder eg/etage/...
getPropertyDetailsSchema(); // size (Pflicht) + plot_size (optional) + rooms
getYearBuiltSchema(); // year_built (Pflicht, 1800–aktuell+5)
getConditionWithRentalSchema(); // condition (Pflicht) + rental_status (optional)
getQualitySchema(); // quality (Pflicht: premium|normal|basic)

// Wiederverwendet aus Shared/Rent-Calculator:
getPropertyTypeSchema(); // apartment|house
getCitySchema(); // city_id
getLocationRatingSchema(); // location_rating 1–5
getFeaturesSchema(); // features[] + additional_features
getAddressSchema(); // address + coords
```

### Neue Komponente: FactorBreakdownChart

Horizontaler Nivo BarChart, der die Wertfaktoren als Abweichung vom Neutralwert (1.0 = 0%) darstellt.

```typescript
interface FactorBreakdownChartProps {
	factors: {
		label: string; // z.B. "Lage"
		impact: number; // z.B. 1.10 → wird als +10% angezeigt
		color?: string; // Optional, sonst automatisch grün/rot
	}[];
	height?: number; // Default: 200
}
```

Farbschema:

- Positiv (>0%): `resaColors.primary`
- Neutral (0%): `resaColors.muted`
- Negativ (<0%): `resaColors.destructive`

### Settings-Schema (getSettingsSchema)

```php
'factors' => [
    'base_price'            => ['type' => 'number', 'label' => 'Basis-Kaufpreis EUR/m²', 'default' => 3200],
    'plot_price_per_sqm'    => ['type' => 'number', 'label' => 'Grundstückspreis EUR/m²', 'default' => 180],
    'size_degression'       => ['type' => 'number', 'label' => 'Größendegression', 'default' => 0.18],
    'type_multipliers'      => ['type' => 'object', 'items' => [
        'house'     => ['label' => 'Haus',     'default' => 1.00],
        'apartment' => ['label' => 'Wohnung',  'default' => 0.95],
    ]],
    'subtype_multipliers'   => ['type' => 'object', 'items' => [
        'efh'       => ['label' => 'Einfamilienhaus',     'default' => 1.00],
        'rh'        => ['label' => 'Reihenhaus',          'default' => 0.90],
        'dhh'       => ['label' => 'Doppelhaushälfte',    'default' => 0.95],
        'zfh'       => ['label' => 'Zweifamilienhaus',    'default' => 1.05],
        'mfh'       => ['label' => 'Mehrfamilienhaus',    'default' => 1.10],
        'eg'        => ['label' => 'Erdgeschosswohnung',  'default' => 0.95],
        'etage'     => ['label' => 'Etagenwohnung',       'default' => 1.00],
        'dg'        => ['label' => 'Dachgeschosswohnung', 'default' => 0.98],
        'maisonette'=> ['label' => 'Maisonette',          'default' => 1.05],
        'penthouse' => ['label' => 'Penthouse',           'default' => 1.20],
    ]],
    'condition_multipliers' => ['type' => 'object', 'items' => [
        'new'              => ['label' => 'Neubau/Kernsaniert',    'default' => 1.25],
        'renovated'        => ['label' => 'Kürzlich renoviert',    'default' => 1.10],
        'good'             => ['label' => 'Guter Zustand',        'default' => 1.00],
        'needs_renovation' => ['label' => 'Renovierungsbedürftig', 'default' => 0.75],
    ]],
    'quality_multipliers'   => ['type' => 'object', 'items' => [
        'premium' => ['label' => 'Gehoben', 'default' => 1.25],
        'normal'  => ['label' => 'Normal',  'default' => 1.00],
        'basic'   => ['label' => 'Einfach', 'default' => 0.80],
    ]],
    'rental_discount'       => ['type' => 'object', 'items' => [
        'owner_occupied' => ['label' => 'Eigennutzung', 'default' => 1.00],
        'rented'         => ['label' => 'Vermietet',    'default' => 0.92],
        'vacant'         => ['label' => 'Leerstand',    'default' => 1.00],
    ]],
    'location_ratings'      => ['type' => 'object', 'items' => [
        '1' => ['label' => 'Einfache Lage',   'default' => 0.80],
        '2' => ['label' => 'Normale Lage',     'default' => 0.92],
        '3' => ['label' => 'Gute Lage',        'default' => 1.00],
        '4' => ['label' => 'Sehr gute Lage',   'default' => 1.12],
        '5' => ['label' => 'Premium-Lage',     'default' => 1.30],
    ]],
    'age_multipliers'       => [ /* analog Rent-Calculator, 7 Klassen */ ],
    'feature_premiums'      => ['type' => 'object', 'items' => [
        'balcony'        => ['label' => 'Balkon',           'default' => 15],
        'terrace'        => ['label' => 'Terrasse',         'default' => 25],
        'garden'         => ['label' => 'Garten',           'default' => 30],
        'elevator'       => ['label' => 'Aufzug',           'default' => 10],
        'parking'        => ['label' => 'Stellplatz',       'default' => 12],
        'garage'         => ['label' => 'Garage',           'default' => 20],
        'cellar'         => ['label' => 'Keller',           'default' =>  8],
        'fitted_kitchen' => ['label' => 'Einbauküche',      'default' => 15],
        'floor_heating'  => ['label' => 'Fußbodenheizung',  'default' => 18],
        'guest_toilet'   => ['label' => 'Gäste-WC',        'default' =>  8],
        'barrier_free'   => ['label' => 'Barrierefrei',     'default' => 10],
        'solar'          => ['label' => 'Solar/PV-Anlage',  'default' => 20],
    ]],
],
'location_values' => [
    'base_price' => ['type' => 'number', 'label' => 'Basis-Kaufpreis EUR/m²', 'default' => null],
    'plot_price'  => ['type' => 'number', 'label' => 'Grundstückspreis EUR/m²', 'default' => null],
    'price_min'  => ['type' => 'number', 'label' => 'Minimum EUR/m²', 'default' => null],
    'price_max'  => ['type' => 'number', 'label' => 'Maximum EUR/m²', 'default' => null],
],
```

### Region-Presets (4 Stufen)

```php
'rural' => [
    'label' => 'Ländlich',
    'base_price' => 1800, 'plot_price_per_sqm' => 80, 'size_degression' => 0.15,
    'type_multipliers' => ['house' => 1.00, 'apartment' => 0.92],
    'subtype_multipliers' => ['efh' => 1.00, 'rh' => 0.88, 'dhh' => 0.93, 'zfh' => 1.05, 'mfh' => 1.08,
                              'eg' => 0.93, 'etage' => 1.00, 'dg' => 0.96, 'maisonette' => 1.03, 'penthouse' => 1.15],
    'condition_multipliers' => ['new' => 1.22, 'renovated' => 1.08, 'good' => 1.00, 'needs_renovation' => 0.72],
    'quality_multipliers' => ['premium' => 1.22, 'normal' => 1.00, 'basic' => 0.82],
    'rental_discount' => ['owner_occupied' => 1.00, 'rented' => 0.90, 'vacant' => 1.00],
    'location_ratings' => ['1' => 0.78, '2' => 0.90, '3' => 1.00, '4' => 1.10, '5' => 1.20],
    // age_multipliers + feature_premiums analog
],
'small_town' => [
    'base_price' => 2500, 'plot_price_per_sqm' => 120, ...
],
'medium_city' => [
    'base_price' => 3200, 'plot_price_per_sqm' => 180, ...
],
'large_city' => [
    'base_price' => 4500, 'plot_price_per_sqm' => 250, ...
],
```

## Akzeptanzkriterien

### Modul-System

- [ ] Modul registriert sich korrekt bei ModuleRegistry via `add_action('resa_register_modules')`
- [ ] Modul ist nur mit Pro-Plan aktivierbar (FeatureGate prüft `pro`-Flag)
- [ ] Modul erscheint im ModuleStore mit Upgrade-CTA für Free-Nutzer
- [ ] Modul-Settings sind im Admin unter Module-Einstellungen editierbar
- [ ] Region-Presets laden korrekt als Fallback

### Frontend-Widget

- [ ] 9-Step-Wizard läuft flüssig durch (Framer Motion Übergänge)
- [ ] Step 2 (Unterart) zeigt dynamisch Haus- oder Wohnungs-Optionen
- [ ] Step 3 zeigt Grundstücksfläche nur bei `property_type === 'house'`
- [ ] Step 5 zeigt Zustand + Vermietungsstatus auf einer Seite
- [ ] Alle Steps validieren via Zod vor Weiter-Button
- [ ] Shared Steps (City, Address, LocationRating) funktionieren identisch wie im Rent-Calculator
- [ ] CSS-Isolation: alle Klassen mit `resa-` Prefix, kein Einfluss auf Host-Theme

### Berechnung

- [ ] Formel produziert plausible Ergebnisse für alle Kombinationen
- [ ] Vermietungs-Abschlag wirkt korrekt (vermietet ≈ 8% weniger)
- [ ] Grundstücksbonus wird nur bei Haus addiert
- [ ] Location-spezifische Overrides überschreiben globale Werte
- [ ] Spanne beträgt exakt ±12%

### Ergebnis-Seite

- [ ] Hero zeigt geschätzten Marktwert mit Spanne
- [ ] Grundstückswert-Kachel nur bei Haus sichtbar
- [ ] MarketPositionGauge zeigt korrekte Position
- [ ] ComparisonBarChart vergleicht €/m² mit Stadt- und Landkreis-Durchschnitt
- [ ] FactorBreakdownChart zeigt alle Faktoren als %-Abweichung (grün/rot)
- [ ] Karte zeigt Immobilienstandort
- [ ] Eingaben-Zusammenfassung ist vollständig
- [ ] DACH-Zahlenformat überall (Punkt als Tausender, Komma als Dezimal, €)

### Security

- [ ] Alle REST-Inputs via `sanitize_text_field()`, `absint()`, Allowlist-Validierung
- [ ] Features-Array gegen `ALLOWED_FEATURES` geprüft
- [ ] property_subtype gegen passende Allowlist (je nach property_type) geprüft
- [ ] Permission-Callback auf allen Endpoints
- [ ] Keine SQL-Injection (alles über Models/prepare)

### i18n

- [ ] Alle User-facing Strings mit `__()` / `esc_html__()` und Text-Domain `'resa'`
- [ ] Frontend-Strings via `@wordpress/i18n`
- [ ] Zahlenformate DACH-konform (€, Komma-Dezimal, m²)

## Security-Überlegungen

- REST-Input-Validierung identisch zum Rent-Calculator-Muster (Allowlists, sanitize, absint)
- `property_subtype` muss gegen den passenden Typ validiert werden (kein `penthouse` bei `house`)
- `plot_size` nur bei `property_type === 'house'` akzeptieren, sonst ignorieren
- `rental_status` hat Default `owner_occupied` wenn nicht angegeben
- Keine Admin-Capabilities nötig für Calculate/Config (Public-Endpoints)

## Testplan

### Unit Tests (PHP)

- PropertyValueService::calculate() mit verschiedenen Eingabekombinationen
- Korrekte Faktor-Anwendung (jeder Faktor einzeln testen)
- Grundstücksbonus nur bei Haus
- Vermietungs-Abschlag
- Region-Presets liefern gültige Daten
- Edge Cases: Minimalwerte, Maximalwerte, fehlende optionale Felder

### Unit Tests (JS/Vitest)

- Zod-Schemas validieren korrekt (valid + invalid Inputs)
- PropertySubtypeStep zeigt korrekte Optionen je nach property_type
- ConditionStep zeigt Vermietungsstatus
- FactorBreakdownChart rendert korrekt mit positiven/negativen Werten
- PropertyValueResult rendert alle Sektionen

### Integration Tests

- POST /modules/property-value/calculate liefert plausible Ergebnisse
- GET /modules/property-value/config liefert Städte und Features
- Modul-Registrierung funktioniert (erscheint in ModuleRegistry)
- FeatureGate blockt bei Free-Plan

## Abhängigkeiten

- **Vorarbeit:** Shared Steps extrahieren (CityStep, AddressStep, LocationRatingStep)
- **Bestehend:** AbstractModule, ModuleRegistry, RestController, Location-Model, ModuleSettings-Model
- **Bestehend:** StepWizard, LeadForm, MarketPositionGauge, ComparisonBarChart, ResaMap, SelectionCard
- **Neue Icons nötig:** `reihenhaus`, `doppelhaushaelfte`, `zweifamilienhaus`, `mehrfamilienhaus`, `erdgeschoss`, `etagenwohnung`, `dachgeschoss`, `maisonette`, `penthouse`, `premium`, `standard`, `einfach`, `solar`, `haus-euro`
