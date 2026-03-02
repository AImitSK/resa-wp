# SPEC: Mietpreis-Kalkulator Modul

**Status:** Entwurf
**Erstellt:** 2026-02-25
**Betrifft:** Erstes Lead Tool Modul — Mietwert-Schätzung für Wohnimmobilien

## Zusammenfassung

Der Mietpreis-Kalkulator ist das erste echte Modul im RESA-System. Besucher durchlaufen einen 6-Step-Wizard (Immobilienart → Grunddaten → Stadt → Zustand → Lage → Ausstattung), erhalten eine Mietpreis-Schätzung, und werden als Lead erfasst. Die Berechnungslogik basiert auf dem bestehenden Plugin `immobilien-rechner-pro` und nutzt konfigurierbare Multiplikatoren pro Stadt (Admin-Matrix). Der Admin kann zwischen **Pauschal-Modus** (4 Regionstyp-Presets) und **Individuell-Modus** (eigene Faktoren) wählen. Das Modul dient als **Referenzimplementierung** für alle folgenden Module.

## Betroffene Dateien

### Neue Dateien

**PHP (Backend):**

- `modules/rent-calculator/module.php` — Bootstrap, registriert bei ModuleRegistry
- `modules/rent-calculator/RentCalculatorModule.php` — ModuleInterface Implementierung
- `modules/rent-calculator/RentCalculatorService.php` — Berechnungslogik
- `modules/rent-calculator/RentCalculatorController.php` — REST API Endpoint für Berechnung

**TypeScript (Frontend Steps):**

- `modules/rent-calculator/src/steps/PropertyTypeStep.tsx` — Step 1: Immobilienart
- `modules/rent-calculator/src/steps/PropertyDetailsStep.tsx` — Step 2: Fläche, Zimmer, Baujahr
- `modules/rent-calculator/src/steps/CityStep.tsx` — Step 3: Standort
- `modules/rent-calculator/src/steps/ConditionStep.tsx` — Step 4: Zustand
- `modules/rent-calculator/src/steps/LocationRatingStep.tsx` — Step 5: Lage-Bewertung
- `modules/rent-calculator/src/steps/FeaturesStep.tsx` — Step 6: Ausstattungsmerkmale
- `modules/rent-calculator/src/RentCalculatorAsset.tsx` — Orchestriert StepWizard + LeadForm + Ergebnis
- `modules/rent-calculator/src/result/RentResult.tsx` — Ergebnis-Darstellung
- `modules/rent-calculator/src/result/MarketPositionGauge.tsx` — Nivo Radial-Bar für Marktposition
- `modules/rent-calculator/src/validation/schemas.ts` — Zod-Schemas pro Step

**Tests:**

- `modules/rent-calculator/tests/php/RentCalculatorServiceTest.php`
- `modules/rent-calculator/tests/php/RentCalculatorControllerTest.php`
- `modules/rent-calculator/tests/js/RentCalculatorAsset.test.tsx`
- `modules/rent-calculator/tests/js/RentResult.test.tsx`

### Geänderte Dateien

- `src/frontend/main.tsx` — Import und Registrierung des Mietpreis-Asset
- `src/frontend/types/index.ts` — Typen für RentCalculation Result
- `vite.config.ts` — Prüfen ob Module-Pfad aufgelöst wird (Alias)

## API-Änderungen

### Neue Endpoints

| Methode | Route                                        | Beschreibung                              | Auth   |
| ------- | -------------------------------------------- | ----------------------------------------- | ------ |
| POST    | `/resa/v1/modules/rent-calculator/calculate` | Mietpreis berechnen                       | Public |
| GET     | `/resa/v1/modules/rent-calculator/config`    | Modul-Konfiguration (Steps, Städte-Liste) | Public |

### Bestehende Endpoints (genutzt, nicht geändert)

| Methode | Route                     | Beschreibung                     |
| ------- | ------------------------- | -------------------------------- |
| POST    | `/resa/v1/leads/partial`  | Partial Lead erstellen (Phase 1) |
| POST    | `/resa/v1/leads/complete` | Lead vervollständigen (Phase 2)  |
| POST    | `/resa/v1/tracking`       | Funnel-Events aufzeichnen        |

## Datenbank-Änderungen

### Keine neuen Tabellen

Nutzt die bestehende Infrastruktur:

- `resa_leads` — Lead-Daten mit `asset_type = 'rent-calculator'`
- `resa_locations` — Stadt-Daten inkl. Multiplikatoren in `data` JSON
- `resa_tracking_daily` — Funnel-Tracking mit `asset_type = 'rent-calculator'`

### resa_locations.data — JSON-Struktur für Mietpreis-Daten

Die Berechnungsparameter werden **pro Stadt** in `resa_locations.data` gespeichert:

```json
{
	"base_price": 12.0,
	"size_degression": 0.2,
	"sale_factor": 25,
	"location_ratings": {
		"1": { "name": "Einfache Lage", "multiplier": 0.85 },
		"2": { "name": "Normale Lage", "multiplier": 0.95 },
		"3": { "name": "Gute Lage", "multiplier": 1.0 },
		"4": { "name": "Sehr gute Lage", "multiplier": 1.1 },
		"5": { "name": "Premium-Lage", "multiplier": 1.25 }
	},
	"condition_multipliers": {
		"new": 1.25,
		"renovated": 1.1,
		"good": 1.0,
		"needs_renovation": 0.8
	},
	"type_multipliers": {
		"apartment": 1.0,
		"house": 1.15
	},
	"feature_premiums": {
		"balcony": 0.5,
		"terrace": 0.75,
		"garden": 1.0,
		"elevator": 0.3,
		"parking": 0.4,
		"garage": 0.6,
		"cellar": 0.2,
		"fitted_kitchen": 0.5,
		"floor_heating": 0.4,
		"guest_toilet": 0.25,
		"barrier_free": 0.3
	},
	"age_multipliers": {
		"before_1946": { "name": "Altbau (bis 1945)", "multiplier": 1.05, "max_year": 1945 },
		"1946_1959": {
			"name": "Nachkriegsbau (1946-1959)",
			"multiplier": 0.95,
			"min_year": 1946,
			"max_year": 1959
		},
		"1960_1979": {
			"name": "60er/70er Jahre",
			"multiplier": 0.9,
			"min_year": 1960,
			"max_year": 1979
		},
		"1980_1989": {
			"name": "80er Jahre",
			"multiplier": 0.95,
			"min_year": 1980,
			"max_year": 1989
		},
		"1990_1999": {
			"name": "90er Jahre",
			"multiplier": 1.0,
			"min_year": 1990,
			"max_year": 1999
		},
		"2000_2014": {
			"name": "2000er Jahre",
			"multiplier": 1.05,
			"min_year": 2000,
			"max_year": 2014
		},
		"2015_plus": { "name": "Neubau (ab 2015)", "multiplier": 1.1, "min_year": 2015 }
	}
}
```

### Neue Optionen (wp_options)

| Option                            | Typ                             | Beschreibung                   |
| --------------------------------- | ------------------------------- | ------------------------------ |
| `resa_rent_calculator_setup_mode` | `'pauschal'` \| `'individuell'` | Einrichtungsmodus pro Location |

Der Modus wird **pro Location** in `resa_locations.factors` gespeichert (siehe Einrichtungsmodus).

### Seed-Daten / Region-Presets

RESA liefert **4 Regionstyp-Presets** mit Default-Werten für den Pauschal-Modus:

#### Preset: Ländlich

```json
{
	"base_price": 5.5,
	"size_degression": 0.15,
	"location_ratings": { "1": 0.8, "2": 0.9, "3": 1.0, "4": 1.08, "5": 1.15 },
	"condition_multipliers": {
		"new": 1.2,
		"renovated": 1.08,
		"good": 1.0,
		"needs_renovation": 0.82
	},
	"type_multipliers": { "apartment": 1.0, "house": 1.12 },
	"feature_premiums": {
		"balcony": 0.3,
		"terrace": 0.5,
		"garden": 0.8,
		"elevator": 0.15,
		"parking": 0.25,
		"garage": 0.4,
		"cellar": 0.1,
		"fitted_kitchen": 0.35,
		"floor_heating": 0.25,
		"guest_toilet": 0.15,
		"barrier_free": 0.2
	},
	"age_multipliers": {
		"before_1946": 1.05,
		"1946_1959": 0.92,
		"1960_1979": 0.88,
		"1980_1989": 0.95,
		"1990_1999": 1.0,
		"2000_2014": 1.05,
		"2015_plus": 1.1
	}
}
```

#### Preset: Kleinstadt / Stadtrand

```json
{
	"base_price": 7.5,
	"size_degression": 0.18,
	"location_ratings": { "1": 0.83, "2": 0.93, "3": 1.0, "4": 1.1, "5": 1.2 },
	"condition_multipliers": {
		"new": 1.22,
		"renovated": 1.1,
		"good": 1.0,
		"needs_renovation": 0.8
	},
	"type_multipliers": { "apartment": 1.0, "house": 1.14 },
	"feature_premiums": {
		"balcony": 0.4,
		"terrace": 0.6,
		"garden": 0.9,
		"elevator": 0.25,
		"parking": 0.35,
		"garage": 0.5,
		"cellar": 0.15,
		"fitted_kitchen": 0.45,
		"floor_heating": 0.35,
		"guest_toilet": 0.2,
		"barrier_free": 0.25
	},
	"age_multipliers": {
		"before_1946": 1.05,
		"1946_1959": 0.94,
		"1960_1979": 0.9,
		"1980_1989": 0.95,
		"1990_1999": 1.0,
		"2000_2014": 1.05,
		"2015_plus": 1.1
	}
}
```

#### Preset: Mittelstadt

```json
{
	"base_price": 9.5,
	"size_degression": 0.2,
	"location_ratings": { "1": 0.85, "2": 0.95, "3": 1.0, "4": 1.1, "5": 1.25 },
	"condition_multipliers": {
		"new": 1.25,
		"renovated": 1.1,
		"good": 1.0,
		"needs_renovation": 0.8
	},
	"type_multipliers": { "apartment": 1.0, "house": 1.15 },
	"feature_premiums": {
		"balcony": 0.5,
		"terrace": 0.75,
		"garden": 1.0,
		"elevator": 0.3,
		"parking": 0.4,
		"garage": 0.6,
		"cellar": 0.2,
		"fitted_kitchen": 0.5,
		"floor_heating": 0.4,
		"guest_toilet": 0.25,
		"barrier_free": 0.3
	},
	"age_multipliers": {
		"before_1946": 1.05,
		"1946_1959": 0.95,
		"1960_1979": 0.9,
		"1980_1989": 0.95,
		"1990_1999": 1.0,
		"2000_2014": 1.05,
		"2015_plus": 1.1
	}
}
```

#### Preset: Großstadt / Zentrum

```json
{
	"base_price": 14.0,
	"size_degression": 0.22,
	"location_ratings": { "1": 0.85, "2": 0.95, "3": 1.0, "4": 1.12, "5": 1.3 },
	"condition_multipliers": {
		"new": 1.28,
		"renovated": 1.12,
		"good": 1.0,
		"needs_renovation": 0.78
	},
	"type_multipliers": { "apartment": 1.0, "house": 1.18 },
	"feature_premiums": {
		"balcony": 0.65,
		"terrace": 1.0,
		"garden": 1.3,
		"elevator": 0.4,
		"parking": 0.55,
		"garage": 0.8,
		"cellar": 0.25,
		"fitted_kitchen": 0.6,
		"floor_heating": 0.5,
		"guest_toilet": 0.3,
		"barrier_free": 0.35
	},
	"age_multipliers": {
		"before_1946": 1.08,
		"1946_1959": 0.95,
		"1960_1979": 0.88,
		"1980_1989": 0.95,
		"1990_1999": 1.0,
		"2000_2014": 1.06,
		"2015_plus": 1.12
	}
}
```

## Modul-Klassifizierung

| Eigenschaft    | Wert                       |
| -------------- | -------------------------- |
| **Typ**        | Lead Tool Modul            |
| **Modul-Flag** | `free`                     |
| **Modul-Slug** | `rent-calculator`          |
| **Kategorie**  | `calculator`               |
| **Icon**       | `haus` (aus Icon Registry) |

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

## Einrichtungsmodus — Pauschal vs. Individuell

Die zwei Modi bestimmen, **wie der Makler das Asset einrichtet** — nicht wie der Endnutzer es bedient. Das Frontend-Erlebnis ist für den Besucher immer gleich.

### Modus 1: Pauschal

Der Makler macht genau **eine Einstellung** — den Regionstyp:

```
┌─────────────────────────────────────────────────┐
│  Mietpreis-Kalkulator — Einrichtung             │
│                                                 │
│  Einrichtungsmodus:  ● Pauschal ○ Individuell   │
│                                                 │
│  Regionstyp:                                    │
│  ○ Ländlich                                     │
│  ○ Kleinstadt / Stadtrand                       │
│  ● Mittelstadt                                  │
│  ○ Großstadt / Zentrum                          │
│                                                 │
│  → Alle Faktoren werden automatisch aus         │
│    hinterlegten Defaultwerten befüllt.           │
│                                                 │
│  [Vorschau der Werte ▼]                         │
│    Basispreis: 9,50 €/m²                        │
│    Lage 1–5: 0,85 – 1,25                        │
│    ...                                          │
│                                                 │
│  [ Speichern ]                                  │
└─────────────────────────────────────────────────┘
```

**Vorteil:** Asset ist in 2 Minuten live. Ideal für Makler die schnell starten wollen oder keine eigenen Marktdaten haben.

### Modus 2: Individuell

Der Makler trägt **eigene Marktdaten und Faktoren** ein:

```
┌─────────────────────────────────────────────────┐
│  Mietpreis-Kalkulator — Einrichtung             │
│                                                 │
│  Einrichtungsmodus:  ○ Pauschal ● Individuell   │
│                                                 │
│  Basismietpreis/m²:     [  8.20  ] €            │
│  Größendegression:      [  0.20  ]              │
│                                                 │
│  Lage-Faktoren:                                 │
│  Einfache Lage (1):     [  0.85  ]              │
│  Normale Lage (2):      [  0.95  ]              │
│  Gute Lage (3):         [  1.00  ]              │
│  Sehr gute Lage (4):    [  1.10  ]              │
│  Premium-Lage (5):      [  1.25  ]              │
│                                                 │
│  Zustands-Faktoren:                             │
│  Neubau/Kernsaniert:    [  1.25  ]              │
│  Renoviert:             [  1.10  ]              │
│  Guter Zustand:         [  1.00  ]              │
│  Renovierungsbedürftig: [  0.80  ]              │
│                                                 │
│  Immobilientyp-Faktoren:                        │
│  Wohnung:               [  1.00  ]              │
│  Haus:                  [  1.15  ]              │
│                                                 │
│  Ausstattungs-Zuschläge (€/m²):                │
│  Balkon:                [  0.50  ]              │
│  Terrasse:              [  0.75  ]              │
│  Garten:                [  1.00  ]              │
│  ... (11 Features)                              │
│                                                 │
│  Alter-Faktoren:                                │
│  Altbau (bis 1945):     [  1.05  ]              │
│  ... (7 Klassen)                                │
│                                                 │
│  [ Speichern ]                                  │
└─────────────────────────────────────────────────┘
```

**Vorteil:** Genauere, regionsspezifische Ergebnisse. Ideal für Makler mit eigenen Marktberichten.

### Zusammenspiel der Modi

```
Pauschal                          Individuell
────────                          ────────────
Makler wählt                      Makler trägt eigene
"Mittelstadt"                     Werte ein
     │                                 │
     ▼                                 ▼
RESA befüllt alle                 Werte werden
Faktoren aus Preset               direkt verwendet
     │                                 │
     └──────────┬──────────────────────┘
                │
                ▼
        Gleiche Berechnung
        Gleiches Frontend
```

**Wichtig:** Beim Wechsel von Pauschal → Individuell werden die Pauschalwerte als Startwerte in die individuellen Felder übernommen — der Makler muss nicht bei Null anfangen.

### Datenspeicherung

- `resa_locations.data` → Enthält den `setup_mode` (`'pauschal'` | `'individuell'`) und bei Pauschal den `region_preset` (`'rural'` | `'small_town'` | `'medium_city'` | `'large_city'`)
- Bei **Pauschal:** `data` wird aus dem Preset befüllt, `factors` bleibt null
- Bei **Individuell:** `factors` enthält die vom Makler angepassten Werte
- Die Berechnungslogik nutzt immer `factors ?? data` — also individuelle Werte falls vorhanden, sonst die Preset-Defaults

---

## Berechnungslogik

### Formel: Mietpreis-Schätzung

```
1. Basis-Preis/m² = city.base_price

2. Größendegression:
   size_factor = (70 / wohnfläche) ^ city.size_degression
   preis_m2 = basis_preis × size_factor

3. Lage-Multiplikator:
   preis_m2 *= location_ratings[rating].multiplier    // 0.85 – 1.25

4. Zustands-Multiplikator:
   preis_m2 *= condition_multipliers[condition]        // 0.80 – 1.25

5. Immobilientyp-Multiplikator:
   preis_m2 *= type_multipliers[type]                  // 1.00 – 1.15

6. Ausstattungs-Zuschläge (ADDITION, kein Multiplikator!):
   preis_m2 += SUM(feature_premiums[feature])          // 0.20 – 1.00 €/m²

7. Alter-Multiplikator:
   preis_m2 *= age_multipliers[age_class].multiplier   // 0.90 – 1.10

8. Endergebnis:
   monatsmiete = wohnfläche × preis_m2
   monatsmiete_min = monatsmiete × 0.85                // -15%
   monatsmiete_max = monatsmiete × 1.15                // +15%
   jahresmiete = monatsmiete × 12
```

### Marktposition

```
ratio = preis_m2 / city.base_price

< 0.85  → 20%  "Unterdurchschnittlich"
0.85–0.95 → 35%  "Leicht unterdurchschnittlich"
0.95–1.05 → 50%  "Durchschnittlich"
1.05–1.15 → 65%  "Überdurchschnittlich"
1.15–1.25 → 80%  "Deutlich überdurchschnittlich"
> 1.25  → 90%  "Premium-Segment"
```

## UI/UX

### Frontend-Widget: Wizard-Flow

```
[PropertyType] → [Details] → [City] → [Condition] → [Location] → [Features]
      ↓                                                                ↓
   Wohnung                                                     API: /calculate
   Haus                                                              ↓
                                                              [Loading-Screen]
                                                                     ↓
                                                            API: /leads/partial
                                                                     ↓
                                                               [LeadForm]
                                                                     ↓
                                                            API: /leads/complete
                                                                     ↓
                                                              [RentResult]
```

### Step 1: Immobilienart (PropertyTypeStep)

Karten-Layout (2 Spalten) mit Icons:

- **Wohnung** — Icon: `wohnung`, Wert: `apartment`
- **Haus** — Icon: `haus`, Wert: `house`

Auswahl per Klick auf Karte (kein Radio-Button).

### Step 2: Grunddaten (PropertyDetailsStep)

| Feld       | Typ               | Pflicht | Validierung                           |
| ---------- | ----------------- | ------- | ------------------------------------- |
| Wohnfläche | Number Input (m²) | Ja      | 10–10.000 m²                          |
| Zimmer     | Select            | Nein    | 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6+ |
| Baujahr    | Number Input      | Nein    | 1800–aktuelles Jahr + 5               |

### Step 3: Stadt (CityStep)

- Dropdown/Select mit allen aktiven Locations
- Zeigt: `location.name`
- Speichert: `location.id`, `location.slug`, `location.name`
- **Entfällt wenn Shortcode `city` Parameter gesetzt:** `[resa asset="rent-calculator" city="muenchen"]`

### Step 4: Zustand (ConditionStep)

Karten-Layout (2×2 Grid) mit Icons:

- **Neubau / Kernsaniert** — Icon: `neubau`, Wert: `new`
- **Kürzlich renoviert** — Icon: `renoviert`, Wert: `renovated`
- **Guter Zustand** — Icon: `gut`, Wert: `good` (Vorauswahl)
- **Renovierungsbedürftig** — Icon: `renovierungsbeduerftig`, Wert: `needs_renovation`

### Step 5: Lage-Bewertung (LocationRatingStep)

- **Lage-Rating:** Slider 1–5 (Default: 3)
    - Beschreibungstext ändert sich dynamisch je nach Rating
    - Zeigt den Multiplikator-Effekt an (z.B. "×1.10 auf Basispreis")

### Step 6: Ausstattung (FeaturesStep)

Checkboxen-Grid (3 Spalten) mit Icons:

| Feature          | Icon               | Label           | Premium (€/m²) |
| ---------------- | ------------------ | --------------- | -------------- |
| `balcony`        | `balkon`           | Balkon          | +0,50          |
| `terrace`        | `terrasse`         | Terrasse        | +0,75          |
| `garden`         | `garten`           | Garten          | +1,00          |
| `elevator`       | `aufzug`           | Aufzug          | +0,30          |
| `parking`        | `stellplatz`       | Stellplatz      | +0,40          |
| `garage`         | `garage`           | Garage          | +0,60          |
| `cellar`         | `keller`           | Keller          | +0,20          |
| `fitted_kitchen` | `einbaukueche`     | Einbauküche     | +0,50          |
| `floor_heating`  | `fussbodenheizung` | Fußbodenheizung | +0,40          |
| `guest_toilet`   | `gaeste-wc`        | Gäste-WC        | +0,25          |
| `barrier_free`   | `barrierefrei`     | Barrierefrei    | +0,30          |

Alle optional, Multiple-Choice.

### Ergebnis-Darstellung (RentResult)

```
┌─────────────────────────────────────────────────┐
│  Geschätzte Monatsmiete                         │
│  ══════════════════════                         │
│       1.285 €                                   │
│    (1.092 € – 1.478 €)                         │
├────────────────────┬────────────────────────────┤
│  Preis pro m²      │  Jährliche Mieteinnahmen   │
│   18,36 €/m²       │   15.420 €                 │
├────────────────────┴────────────────────────────┤
│  Marktposition           [====●=====] 65%       │
│  "Überdurchschnittlich"                         │
├─────────────────────────────────────────────────┤
│  Ihre Eingaben:                                  │
│  • Wohnung, 70 m², München                      │
│  • Guter Zustand, Gute Lage (3/5)              │
│  • Balkon, Einbauküche                          │
├─────────────────────────────────────────────────┤
│  💡 Ein Immobilienexperte analysiert Ihre Daten │
│  und meldet sich in Kürze bei Ihnen.            │
└─────────────────────────────────────────────────┘
```

**Marktposition-Gauge:** Nivo `RadialBar` Chart

- Halbkreis-Gauge (180°)
- Farbe basierend auf Percentile (Cyan → Blau → Grün → Orange → Rot)
- Label unterhalb: "Durchschnittlich", "Überdurchschnittlich", etc.

**Eingaben-Zusammenfassung:** Kompakte Liste der gewählten Optionen.

**Makler-Hinweis:** Konfigurierbar, zeigt Kontakt-Informationen des zugewiesenen Maklers.

## Implementierungsdetails

### Modul-Struktur

```
modules/rent-calculator/
├── module.php                        # Bootstrap
├── RentCalculatorModule.php          # ModuleInterface
├── RentCalculatorService.php         # Berechnungslogik (PHP)
├── RentCalculatorController.php      # REST API Controller
├── src/
│   ├── RentCalculatorAsset.tsx       # Orchestriert Wizard + Result
│   ├── steps/
│   │   ├── PropertyTypeStep.tsx
│   │   ├── PropertyDetailsStep.tsx
│   │   ├── CityStep.tsx
│   │   ├── ConditionStep.tsx
│   │   ├── LocationRatingStep.tsx
│   │   └── FeaturesStep.tsx
│   ├── result/
│   │   ├── RentResult.tsx
│   │   └── MarketPositionGauge.tsx
│   └── validation/
│       └── schemas.ts                # Zod-Schemas pro Step
└── tests/
    ├── php/
    │   ├── RentCalculatorServiceTest.php
    │   └── RentCalculatorControllerTest.php
    └── js/
        ├── RentCalculatorAsset.test.tsx
        └── RentResult.test.tsx
```

### PHP: RentCalculatorService

```php
namespace Resa\Modules\RentCalculator;

class RentCalculatorService {
    private const REFERENCE_SIZE = 70.0;
    private const RANGE_FACTOR = 0.15;  // ±15%

    public static function calculate(array $inputs, array $locationData): array
    // $inputs: size, property_type, condition, location_rating, features[], year_built
    // $locationData: base_price, size_degression, location_ratings, condition_multipliers, etc.
    // Returns: monthly_rent{estimate,low,high}, annual_rent, price_per_sqm, market_position, factors

    public static function getMarketPosition(float $pricePerSqm, float $basePrice): array
    // Returns: percentile, label

    private static function getSizeFactor(float $size, float $degression): float
    private static function getAgeMultiplier(?int $yearBuilt, array $ageMultipliers): float
    private static function getFeaturePremium(array $features, array $featurePremiums): float
}
```

### PHP: RentCalculatorController

```php
namespace Resa\Modules\RentCalculator;

use Resa\Api\RestController;

class RentCalculatorController extends RestController {
    public function registerRoutes(): void
    // POST /resa/v1/modules/rent-calculator/calculate
    // GET  /resa/v1/modules/rent-calculator/config

    public function calculate(WP_REST_Request $request): WP_REST_Response|WP_Error
    // Validiert Inputs, lädt Location-Daten, berechnet, gibt Ergebnis zurück

    public function getConfig(WP_REST_Request $request): WP_REST_Response
    // Gibt Modul-Config zurück: verfügbare Städte, Steps-Config, Feature-Liste
}
```

### TypeScript: RentCalculatorAsset

```tsx
// Orchestriert den gesamten Flow:
// 1. Lädt Config von /config Endpoint (Städte-Liste)
// 2. Rendert StepWizard mit 6 Steps
// 3. Nach Wizard: POST /calculate → Ergebnis
// 4. POST /leads/partial (Inputs + Result speichern)
// 5. Zeigt LeadForm
// 6. POST /leads/complete (Kontaktdaten)
// 7. Zeigt RentResult

interface RentCalculationResult {
	monthly_rent: { estimate: number; low: number; high: number };
	annual_rent: number;
	price_per_sqm: number;
	market_position: { percentile: number; label: string };
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

### Zod-Schemas (pro Step)

```typescript
// Step 1
const propertyTypeSchema = z.object({
	property_type: z.enum(['apartment', 'house']),
});

// Step 2
const propertyDetailsSchema = z.object({
	size: z.number().min(10).max(10000),
	rooms: z.number().optional(),
	year_built: z
		.number()
		.min(1800)
		.max(new Date().getFullYear() + 5)
		.optional(),
});

// Step 3
const citySchema = z.object({
	city_id: z.number().positive(),
});

// Step 4
const conditionSchema = z.object({
	condition: z.enum(['new', 'renovated', 'good', 'needs_renovation']),
});

// Step 5
const locationRatingSchema = z.object({
	location_rating: z.number().min(1).max(5),
});

// Step 6
const featuresSchema = z.object({
	features: z.array(z.string()).default([]),
});
```

### Shortcode-Integration

```
[resa asset="rent-calculator"]                    # Standard (alle Steps)
[resa asset="rent-calculator" city="muenchen"]    # Stadt vorgewählt (Step 3 entfällt)
```

Der bestehende `[resa]` Shortcode-Handler prüft `asset` Attribut und lädt das passende Modul-Frontend.

### Tracking-Events

Der Kalkulator feuert folgende Events über den bestehenden TrackingService:

| Event           | Wann                           | Zusatzdaten         |
| --------------- | ------------------------------ | ------------------- |
| `asset_view`    | Widget wird sichtbar           | —                   |
| `asset_start`   | User klickt "Weiter" in Step 1 | —                   |
| `step_complete` | Jeder Step-Übergang            | `step`, `stepTotal` |
| `form_view`     | LeadForm wird sichtbar         | —                   |
| `form_submit`   | LeadForm abgeschickt           | —                   |
| `result_view`   | Ergebnis wird angezeigt        | —                   |

## Akzeptanzkriterien

- [ ] Modul registriert sich korrekt bei ModuleRegistry und kann aktiviert/deaktiviert werden
- [ ] 6-Step-Wizard durchlaufbar mit Vor-/Zurück-Navigation und Framer Motion Animationen
- [ ] Berechnung liefert korrekte Ergebnisse (Abgleich mit bestehendem Plugin)
- [ ] Ergebnis zeigt Monatsmiete, Spanne, Preis/m², Jahresmiete, Marktposition
- [ ] Marktposition als Nivo RadialBar-Gauge dargestellt
- [ ] LeadForm erfasst Lead in zwei Phasen (partial → complete)
- [ ] Lead wird mit `asset_type = 'rent-calculator'` und Inputs/Result in DB gespeichert
- [ ] Tracking-Events werden korrekt aufgezeichnet
- [ ] `/config` Endpoint liefert Städte-Liste und Modul-Konfiguration
- [ ] `/calculate` Endpoint validiert Inputs und gibt strukturiertes Ergebnis zurück
- [ ] Shortcode `[resa asset="rent-calculator"]` rendert den Kalkulator
- [ ] Shortcode mit `city="slug"` überspringt den Stadt-Step
- [ ] CSS-Isolation: Alle Klassen mit `resa-` Prefix, kein Einfluss auf Host-Theme
- [ ] Alle User-facing Strings mit `__('...', 'resa')` (PHP) bzw. `__()` aus `@wordpress/i18n` (JS)
- [ ] Mindestens eine Location mit Daten muss existieren, sonst Hinweis statt Kalkulator
- [ ] PHP-Tests und JS-Tests vorhanden und grün
- [ ] FeatureGate wird respektiert (Free: 1 Location, 50 Leads)

## Security-Überlegungen

- **REST `/calculate`:** Public, aber Rate-Limiting beachten (WordPress-seitig). Inputs validieren: `size` float, `location_rating` int 1-5, `condition` enum, `property_type` enum, `features` array of strings (gegen Allowlist prüfen), `city_id` int
- **REST `/config`:** Public, read-only, keine sensiblen Daten
- **Inputs sanitizen:** `sanitize_text_field()`, `absint()`, `floatval()` im Controller
- **SQL:** Keine direkten Queries nötig — Location-Daten via Model laden, Leads via Lead::create\*
- **Outputs escapen:** Alle Werte in PHP-Templates mit `esc_html()`, `esc_attr()`
- **Feature-Allowlist:** Features-Array gegen die konfigurierten Feature-Keys prüfen (keine beliebigen Strings akzeptieren)

## Testplan

### PHP Unit Tests

- `RentCalculatorService::calculate()` — Happy Path mit Standard-Multiplikatoren
- `RentCalculatorService::calculate()` — Größendegression (kleine vs. große Wohnung)
- `RentCalculatorService::calculate()` — Jeder Multiplikator einzeln (Lage, Zustand, Typ, Alter)
- `RentCalculatorService::calculate()` — Feature-Zuschläge (Addition, nicht Multiplikation)
- `RentCalculatorService::calculate()` — Spanne ±15%
- `RentCalculatorService::getMarketPosition()` — Alle 6 Percentile-Stufen
- `RentCalculatorController::calculate()` — Validierung: fehlende Pflichtfelder
- `RentCalculatorController::calculate()` — Validierung: ungültige Werte
- `RentCalculatorController::calculate()` — Nicht existierende Location
- `RentCalculatorController::getConfig()` — Gibt aktive Locations zurück
- `RentCalculatorModule` — getSlug, getName, getFlag, toArray

### JS Unit Tests

- `RentCalculatorAsset` — Rendert StepWizard mit 6 Steps
- `RentResult` — Zeigt alle Ergebniswerte korrekt formatiert
- `RentResult` — DACH-Formatierung (Komma-Dezimal, € Zeichen, m²)
- `MarketPositionGauge` — Rendert mit verschiedenen Percentiles
- Zod-Schemas — Validierung für jeden Step

## Offene Fragen

1. **Icons:** Existieren alle benötigten Icons bereits in der Registry (`haus`, `wohnung`, `balkon`, etc.)? Falls nicht, müssen sie ergänzt werden.
2. **Vite-Config:** Module liegen in `modules/` statt `src/`. Wie wird das in Vite aufgelöst? Eigener Entry Point oder dynamischer Import aus `src/frontend/main.tsx`?
3. **Admin-Matrix:** Die Locations-Verwaltung (Städte anlegen, Multiplikatoren konfigurieren) ist Teil der bestehenden Admin-Shell unter "Locations". Reicht die aktuelle Locations-Admin-Seite oder braucht das Modul eine eigene Settings-Seite für die Matrix?

## Abhängigkeiten

Alle aus Phase 1–3 (bereits implementiert):

- ✅ ModuleRegistry + AbstractModule (2.3)
- ✅ REST API Basis + RestController (2.1)
- ✅ Datenbank-Schema mit resa_leads, resa_locations (2.2)
- ✅ FeatureGate (2.4)
- ✅ StepWizard Framework (3.3)
- ✅ LeadForm + Lead-Capture (3.4)
- ✅ PDF-Service (3.5) — für spätere PDF-Erweiterung
- ✅ Tracking-Service (3.7)
- ✅ Icon Registry (3.1) — Icons müssen ggf. ergänzt werden
