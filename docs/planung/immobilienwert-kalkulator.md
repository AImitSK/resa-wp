# Immobilienwert-Kalkulator — Modulkonzept

**Modul-Slug:** `property-value`
**Flag:** `pro` (Premium-Modul, nur mit Pro-Plan verfügbar)
**Icon:** `haus-euro` (oder `immobilienwert`)
**Kategorie:** `calculator`

## Grundidee

Vereinfachtes Vergleichswertverfahren: Basispreis €/m² × Faktoren = geschätzter Marktwert.
Gleiche Architektur wie `rent-calculator`, aber mit Kaufpreisen statt Mieten und erweiterten Immobilientypen.

---

## Steps (Frontend-Wizard)

Makler-bezogene Qualifizierungsfragen (Maklervertrag, Eigentümer, Verkaufsgrund) gehören nicht in die Berechnung — das sind Lead-Infos fürs LeadForm.

| #   | Step                     | Key                | Felder                                                                                                                     | Berechungsrelevant?   |
| --- | ------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| 1   | **Immobilienart**        | `property_type`    | Haus, Wohnung                                                                                                              | Ja (Typ-Faktor)       |
| 2   | **Unterart**             | `property_subtype` | Haus: EFH, RH, DHH, ZFH, MFH · Wohnung: EG, Etage, DG, Maisonette, Penthouse                                               | Ja (Subtyp-Faktor)    |
| 3   | **Flächen**              | `details`          | Wohnfläche (m², Slider + Eingabe), Grundstücksfläche (m², nur bei Haus), Zimmeranzahl                                      | Ja                    |
| 4   | **Baujahr**              | `year_built`       | Slider + Direkteingabe                                                                                                     | Ja (Alter-Faktor)     |
| 5   | **Zustand**              | `condition`        | Erstbezug/Neubau, Kürzlich renoviert, Guter Zustand, Renovierungsbedürftig                                                 | Ja                    |
| 6   | **Ausstattungsqualität** | `quality`          | Gehoben, Normal, Einfach                                                                                                   | Ja (Qualitäts-Faktor) |
| 7   | **Extras**               | `features`         | Balkon/Terrasse, Einbauküche, Garten, Garage/Stellplatz, Keller, Aufzug, Fußbodenheizung, Solar/PV, Gäste-WC, Barrierefrei | Ja (Zuschläge €/m²)   |
| 8   | **Standort**             | `city` + `address` | Stadt-Auswahl + Adresse (CityStep + AddressStep wiederverwendbar)                                                          | Ja (Basis-Preis)      |
| 9   | **Lage**                 | `location_rating`  | 1–5 Sterne (LocationRatingStep wiederverwendbar)                                                                           | Ja (Lage-Faktor)      |

**Vermietungsstatus** wird als Zusatzfrage in den ConditionStep integriert (kein eigener Step).
Verkaufszeitrahmen entfällt (oder optional im LeadForm).

Danach automatisch vom Core: **LeadForm** → **Ergebnis**

### Was wir vom Konkurrenzprodukt NICHT übernehmen

- "Maklervertrag abgeschlossen?" — Lead-Qualifizierung, nicht Berechnung
- "Sind Sie Eigentümer?" — dito
- "Verkaufsgrund" — interessant für Makler, gehört aber eher als optionale Frage ins LeadForm
- "Gewerbe" als Immobilienart — zu komplex für V1, andere Bewertungsverfahren nötig

### Was wir BESSER machen

- Ausstattungsqualität als eigener Step (stärker gewichtet als einzelne Features)
- Vermietungsstatus berechungsrelevant (vermietete Immobilien = Abschlag wegen Mieterbindung), integriert in ConditionStep statt eigener Step

---

## Berechnung (PropertyValueService)

### Formel

```
preis_pro_m² = basis_kaufpreis
  × größen_degression(wohnfläche)
  × typ_faktor(property_type)
  × subtyp_faktor(property_subtype)
  × zustand_faktor(condition)
  × alter_faktor(year_built)
  × qualitäts_faktor(quality)
  × lage_faktor(location_rating)
  × vermietungs_faktor(rental_status)
  + feature_zuschläge(features)           // €/m² additiv

grundstücks_bonus = grundstück_m² × grundstücks_preis_pro_m²  // nur bei Haus

geschätzter_wert = wohnfläche × preis_pro_m² + grundstücks_bonus

spanne = ±12%
```

### Faktoren-Tabelle

| Faktor                  | Keys                                                                                                                                       | Defaults         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| `type_multipliers`      | `house: 1.0`, `apartment: 0.95`                                                                                                            | —                |
| `subtype_multipliers`   | `efh: 1.0`, `rh: 0.90`, `dhh: 0.95`, `zfh: 1.05`, `mfh: 1.10`, `eg: 0.95`, `etage: 1.0`, `dg: 0.98`, `maisonette: 1.05`, `penthouse: 1.20` | —                |
| `condition_multipliers` | `new: 1.25`, `renovated: 1.10`, `good: 1.00`, `needs_renovation: 0.75`                                                                     | —                |
| `quality_multipliers`   | `premium: 1.25`, `normal: 1.0`, `basic: 0.80`                                                                                              | —                |
| `age_multipliers`       | Analog Rent-Calculator (7 Klassen)                                                                                                         | —                |
| `location_ratings`      | 1–5, analog Rent-Calculator                                                                                                                | —                |
| `rental_discount`       | `owner_occupied: 1.0`, `vacant: 1.0`, `rented: 0.92`                                                                                       | —                |
| `feature_premiums`      | Analog Rent-Calculator, aber €/m² Kaufpreis-Skala (höhere Absolutwerte)                                                                    | —                |
| `plot_price_per_sqm`    | Grundstückspreis €/m²                                                                                                                      | 80–250 je Region |
| `size_degression`       | Größendegression (wie Rent-Calculator)                                                                                                     | 0.15–0.22        |

### Region-Presets (4 Stufen)

| Region      | Basis-Kaufpreis €/m² | Grundstück €/m² |
| ----------- | -------------------- | --------------- |
| Ländlich    | 1.800                | 80              |
| Kleinstadt  | 2.500                | 120             |
| Mittelstadt | 3.200                | 180             |
| Großstadt   | 4.500                | 250             |

---

## Backend-Einstellungen

### Globale Faktoren (Settings-Schema)

Analog zum Rent-Calculator über `getSettingsSchema()`:

- `base_price` — Basis-Kaufpreis €/m²
- `plot_price_per_sqm` — Grundstückspreis €/m²
- `size_degression` — Größendegression
- Alle Multiplikatoren (s. Faktoren-Tabelle oben)

### Standort-spezifische Werte (location_values)

Überschreiben globale Einstellungen pro Stadt:

- `base_price` — Kaufpreis €/m² für diese Stadt
- `plot_price` — Grundstückspreis für diese Stadt
- `price_min` / `price_max` — Preisspanne für Marktvergleich

---

## Ergebnis-Visualisierung

```
┌─────────────────────────────────────┐
│       Geschätzter Marktwert         │
│         ✦ 385.000 €  ✦             │  ← Hero (groß, Primary-Color)
│      327.000 € – 431.000 €         │  ← Spanne (±12%)
└─────────────────────────────────────┘

┌──────────────┐  ┌──────────────────┐
│  3.210 €/m²  │  │  Grundstück      │  ← 2 Stat-Kacheln
│  Kaufpreis   │  │  45.000 €        │  (Grundstück nur bei Haus)
└──────────────┘  └──────────────────┘

       ▼ Marktposition ▼               ← MarketPositionGauge (wiederverwendbar)
   [====●============] 65%
   "Überdurchschnittlich"

    Marktvergleich (€/m²)              ← ComparisonBarChart (wiederverwendbar)
    ████████████ 3.210 € Ihre Immobilie
    █████████    2.800 € Ø Stadtgebiet
    ██████       2.200 € Ø Landkreis

    Wertfaktoren                        ← NEU: Faktor-Breakdown-Chart
    Lage          +10%  ████▓
    Ausstattung   +25%  ██████▓
    Zustand        0%   ███
    Alter          -5%  ██▒
    Vermietung     0%   ███

    📍 Standort                         ← ResaMap (wiederverwendbar)
    [Leaflet Map]

    Ihre Eingaben                       ← Zusammenfassung
    EFH · 120 m² · 500 m² Grundstück
    Guter Zustand · Normale Ausstattung
    Balkon, Garage, Einbauküche

    ┌─────────────────────────────────┐
    │  Ein Immobilienexperte meldet   │  ← CTA
    │  sich in Kürze bei Ihnen.      │
    └─────────────────────────────────┘
```

### Neue Visualisierungen vs. Rent-Calculator

- **Grundstückswert-Kachel** — nur bei Haus/Grundstück sichtbar
- **Wertfaktoren-Breakdown** — zeigt visuell, welche Faktoren den Wert hoch/runter treiben (Nivo BarChart, horizontal). Guter "Aha-Effekt" und steigert Lead-Qualität
- Hauptwert als Absolutbetrag (385.000 €) statt monatlicher Miete

### Wiederverwendbare Komponenten

- `MarketPositionGauge` — 1:1 aus Rent-Calculator
- `ComparisonBarChart` — 1:1, nur andere Labels
- `ResaMap` — 1:1
- `CityStep`, `AddressStep`, `LocationRatingStep` — wiederverwendbar, ggf. als Shared Steps extrahieren

---

## Datei-Struktur

```
modules/property-value/
  module.php                          # Bootstrap, registriert bei ModuleRegistry
  PropertyValueModule.php             # AbstractModule-Implementierung
  PropertyValueService.php            # Berechnungslogik
  PropertyValueController.php         # REST-Endpoints
  src/
    types.ts                          # TypeScript-Interfaces
    PropertyValueWidget.tsx           # Widget-Entry (registriert Steps)
    validation/
      schemas.ts                      # Zod-Schemas pro Step
    steps/
      PropertyTypeStep.tsx            # Haus / Wohnung / Grundstück
      PropertySubtypeStep.tsx         # Unterart je nach Typ
      PropertyDetailsStep.tsx         # Flächen + Zimmer
      YearBuiltStep.tsx               # Baujahr (Slider)
      ConditionStep.tsx               # Zustand
      QualityStep.tsx                 # Ausstattungsqualität
      FeaturesStep.tsx                # Extras (Checkboxen)
      # Vermietungsstatus ist in ConditionStep integriert
    result/
      PropertyValueResult.tsx         # Ergebnis-Seite
      FactorBreakdownChart.tsx        # NEU: Wertfaktoren-Visualisierung
```

---

## Entscheidungen

1. **Grundstück als Typ** — Nein, nicht in V1. Nur Haus + Wohnung.
2. **Etagen-Frage** — Weglassen. Korreliert bereits mit Subtyp und Wohnfläche.
3. **Verkaufskontext** — Vermietungsstatus in ConditionStep integrieren (berechungsrelevant). Verkaufszeitrahmen entfällt.
4. **Shared Steps** — Ja, vor Implementierung CityStep, AddressStep, LocationRatingStep nach `src/frontend/components/shared/steps/` extrahieren.

## Vorarbeiten

- [ ] Shared Steps aus `modules/rent-calculator/src/steps/` extrahieren nach `src/frontend/components/shared/steps/`
    - CityStep
    - AddressStep
    - LocationRatingStep
- [ ] Rent-Calculator auf Shared Steps umstellen (Imports aktualisieren)
