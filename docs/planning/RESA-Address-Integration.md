# RESA — Adress-Integration für Module

**Erstellt:** 2026-03-01
**Status:** Planung
**Betrifft:** Mietpreis-Rechner, alle zukünftigen Module, Lead-System, PDF-Generierung

---

## 1. Zielsetzung

### Business-Kontext

Für die **Berechnung** ist die exakte Adresse nicht relevant — die regionalen Marktdaten kommen aus der Location (Stadt/Region). **Aber:** Der Immobilienmakler benötigt die genaue Adresse für die Lead-Bearbeitung:

- Schnelle Identifikation des Objekts
- Marktkenntnis der Mikrolage
- Vorbereitung für Besichtigung/Akquise
- Professionelle Kommunikation mit dem Interessenten

### Technische Ziele

1. **AddressInput-Step** im Frontend für Besucher
2. **Stadtbegrenztes Autocomplete** (nur Vorschläge innerhalb der gewählten Location)
3. **Kartenvisualisierung** im Step
4. **Adresse im Lead** speichern (`inputs` JSON)
5. **Adresse auf Ergebnisseite** anzeigen
6. **Adresse im PDF** ausgeben (mit optionaler Karten-Miniatur)

---

## 2. Aktueller Stand (IST)

### Mietpreis-Rechner Flow

```
1. PropertyTypeStep    → property_type
2. PropertyDetailsStep → size, rooms, year_built
3. CityStep            → city_id, city_name, city_slug  ← LOCATION AUSWAHL
4. ConditionStep       → condition
5. LocationRatingStep  → location_rating (Slider 1-5)   ← KEINE ADRESSE!
6. FeaturesStep        → features[]
---
7. LeadForm            → firstName, email, consent, ...
8. RentResult          → Anzeige
```

### Datenfluss

```
WizardData (Frontend)
    ↓
POST /leads/partial
    ├─ inputs: { size, property_type, city_id, city_name, condition, ... }
    ├─ result: { estimatedRent, pricePerSqm, ... }
    └─ locationId: city_id
    ↓
DB: resa_leads.inputs (JSON)
    ↓
LeadPdfService::buildPdfData()
    ├─ property_address = inputs['address'] ?? city_name  ← VORBEREITET!
    └─ (Koordinaten werden nicht verwendet)
```

### Was existiert

| Komponente           | Pfad                                             | Status         |
| -------------------- | ------------------------------------------------ | -------------- |
| LeafletMap (Admin)   | `src/admin/components/map/LeafletMapWrapper.tsx` | ✅ Interaktiv  |
| ResaMap (Frontend)   | `src/frontend/components/map/ResaMap.tsx`        | ✅ Nur Anzeige |
| Geocoding API        | `includes/Api/GeocodingController.php`           | ✅ Nominatim   |
| useGeocoding Hook    | `src/admin/hooks/useGeocoding.ts`                | ✅ Nur Admin   |
| PDF property_address | `LeadPdfService.php:216`                         | ✅ Vorbereitet |

### Was fehlt

| Komponente                  | Status             |
| --------------------------- | ------------------ |
| AddressInput für Frontend   | ❌ Nicht vorhanden |
| Geocoding Hook für Frontend | ❌ Nicht vorhanden |
| Adress-Step im Modul        | ❌ Nicht vorhanden |
| Koordinaten in inputs       | ❌ Nicht vorhanden |
| Karte auf Ergebnisseite     | ❌ Nicht vorhanden |
| Statische Karte im PDF      | ❌ Nicht vorhanden |

---

## 3. Architektur (SOLL)

### 3.1 Neuer Flow für Mietpreis-Rechner

```
1. PropertyTypeStep    → property_type
2. PropertyDetailsStep → size, rooms, year_built
3. CityStep            → city_id, city_name, city_slug
4. AddressStep (NEU)   → address, address_lat, address_lng  ← ADRESSE MIT KARTE
5. ConditionStep       → condition
6. LocationRatingStep  → location_rating (Slider 1-5)
7. FeaturesStep        → features[]
---
8. LeadForm            → firstName, email, consent, ...
9. RentResult          → Anzeige MIT Karte
```

### 3.2 AddressStep Verhalten

1. **Nach CityStep:** Besucher hat Stadt gewählt (z.B. "Bad Oeynhausen")
2. **AddressStep zeigt:**
    - Textfeld mit Autocomplete
    - Karte (zentriert auf Stadt-Koordinaten)
    - Marker wenn Adresse gewählt
3. **Autocomplete ist eingeschränkt auf:**
    - Die gewählte Stadt/Region
    - Nominatim `viewbox` + `bounded=1` Parameter
4. **Daten werden gespeichert:**
    - `address` (String): "Musterstraße 15, 32549 Bad Oeynhausen"
    - `address_lat` (Number): 52.2058
    - `address_lng` (Number): 8.7974

### 3.3 Komponenten-Hierarchie

```
src/frontend/
├── components/
│   ├── shared/
│   │   └── AddressInput.tsx         (NEU) Wiederverwendbare Komponente
│   └── map/
│       ├── ResaMap.tsx              (existiert)
│       ├── LeafletMap.tsx           (existiert)
│       └── AddressAutocomplete.tsx  (NEU) Dropdown mit Suche
├── hooks/
│   └── useAddressSearch.ts          (NEU) Frontend-Hook für Geocoding
└── types/
    └── address.ts                   (NEU) Interfaces

modules/rent-calculator/
└── src/steps/
    └── AddressStep.tsx              (NEU) Step-Komponente
```

---

## 4. Detaillierte Komponenten-Specs

### 4.1 AddressInput (Core-Komponente)

**Pfad:** `src/frontend/components/shared/AddressInput.tsx`

**Props:**

```typescript
interface AddressInputProps {
	/** Aktuelle Adresse */
	value?: AddressData;
	/** Callback bei Änderung */
	onChange: (address: AddressData | null) => void;
	/** Begrenzung auf Stadt/Region (Location-Daten) */
	boundTo?: {
		name: string; // "Bad Oeynhausen"
		lat?: number; // 52.2058
		lng?: number; // 8.7974
		boundingBox?: [number, number, number, number]; // [minLat, maxLat, minLng, maxLng]
	};
	/** Platzhalter-Text */
	placeholder?: string;
	/** Fehler-Message */
	error?: string;
	/** Karte anzeigen? */
	showMap?: boolean;
	/** Karten-Höhe */
	mapHeight?: number;
	/** Karten-Tile-Style */
	tileStyle?: 'standard' | 'minimal' | 'dark';
}

interface AddressData {
	displayName: string; // Vollständige Adresse
	street?: string; // Straße + Nr
	postalCode?: string; // PLZ
	city?: string; // Stadt
	lat: number;
	lng: number;
}
```

**Verhalten:**

1. Input-Feld mit Debounce (300ms)
2. Dropdown mit Suchergebnissen (max 5)
3. Karte zeigt Marker bei Auswahl
4. Suche ist auf `boundTo` Region eingeschränkt
5. Klick auf Karte = Reverse Geocoding (optional)

**UI-Mockup:**

```
┌─────────────────────────────────────────────────────────────┐
│  Adresse der Immobilie                                       │
│                                                              │
│  🔍 [Musterstraße 15, Bad Oeynhausen                    ] ▼ │
│     ┌───────────────────────────────────────────────────┐   │
│     │ Musterstraße 15, 32549 Bad Oeynhausen            │   │
│     │ Musterstraße 17, 32549 Bad Oeynhausen            │   │
│     │ Musterweg 1, 32547 Bad Oeynhausen                │   │
│     └───────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │              📍 (Marker auf Karte)                   │   │
│  │                                                      │   │
│  │                    [+] [-]                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Tipp: Geben Sie die Straße und Hausnummer ein.             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 useAddressSearch (Frontend-Hook)

**Pfad:** `src/frontend/hooks/useAddressSearch.ts`

```typescript
interface UseAddressSearchOptions {
	/** Mindest-Länge für Suche */
	minLength?: number; // default: 3
	/** Debounce in ms */
	debounce?: number; // default: 300
	/** Begrenzung auf Region */
	boundTo?: {
		lat: number;
		lng: number;
		radius?: number; // km, default: 30
	};
	/** Bounding Box für Nominatim */
	viewbox?: [number, number, number, number];
}

function useAddressSearch(
	query: string,
	options?: UseAddressSearchOptions,
): {
	results: AddressResult[];
	isLoading: boolean;
	error: Error | null;
};
```

**API-Aufruf:**

```
GET /wp-json/resa/v1/geocoding/search
  ?query=Musterstraße+15
  &viewbox=8.6,52.1,8.9,52.3   (minLng,minLat,maxLng,maxLat)
  &bounded=1
  &limit=5
```

### 4.3 AddressStep (Modul-Komponente)

**Pfad:** `modules/rent-calculator/src/steps/AddressStep.tsx`

```typescript
interface AddressStepProps extends StepProps {
	/** Location-Daten für Begrenzung */
	location: {
		id: number;
		name: string;
		lat?: number;
		lng?: number;
	};
}
```

**Integration in RentCalculatorWidget:**

```typescript
// Nach CityStep, vor ConditionStep
{
  id: 'address',
  label: __('Adresse', 'resa'),
  component: (props) => (
    <AddressStep
      {...props}
      location={{
        id: wizardData.city_id,
        name: wizardData.city_name,
        lat: wizardData.city_lat,   // NEU: aus Config
        lng: wizardData.city_lng,
      }}
    />
  ),
  schema: addressSchema,
}
```

### 4.4 Zod-Schema

**Pfad:** `modules/rent-calculator/src/validation/schemas.ts`

```typescript
export const addressSchema = z.object({
	address: z
		.string()
		.min(5, __('Bitte geben Sie eine Adresse ein', 'resa'))
		.optional()
		.or(z.literal('')),
	address_lat: z.number().min(-90).max(90).optional(),
	address_lng: z.number().min(-180).max(180).optional(),
});
```

**Hinweis:** Adresse ist **optional** — Besucher kann Step überspringen. Aber wenn Adresse eingegeben, dann mit Koordinaten.

---

## 5. Backend-Anpassungen

### 5.1 GeocodingController erweitern

**Datei:** `includes/Api/GeocodingController.php`

Neue Parameter für begrenzte Suche:

```php
register_rest_route(
  self::NAMESPACE,
  '/geocoding/search',
  [
    'methods'  => 'GET',
    'callback' => [ $this, 'search' ],
    'permission_callback' => '__return_true', // Public!
    'args' => [
      'query' => [
        'required' => true,
        'type'     => 'string',
        'sanitize_callback' => 'sanitize_text_field',
      ],
      'viewbox' => [
        'required' => false,
        'type'     => 'string',
        'description' => 'minLng,minLat,maxLng,maxLat',
      ],
      'bounded' => [
        'required' => false,
        'type'     => 'boolean',
        'default'  => false,
      ],
      'limit' => [
        'required' => false,
        'type'     => 'integer',
        'default'  => 5,
      ],
    ],
  ]
);
```

**Nominatim-Anfrage mit Viewbox:**

```php
$params = [
  'q'              => $query,
  'format'         => 'jsonv2',
  'addressdetails' => 1,
  'limit'          => $limit,
  'countrycodes'   => 'de,at,ch',
];

if ( $viewbox ) {
  $params['viewbox'] = $viewbox;
  $params['bounded'] = $bounded ? 1 : 0;
}
```

### 5.2 Locations-Config erweitern

**Datei:** `includes/Api/LocationsController.php`

Module-Config soll Location-Koordinaten enthalten:

```php
// GET /modules/rent-calculator/config
'cities' => [
  [
    'id'   => 1,
    'name' => 'Bad Oeynhausen',
    'slug' => 'bad-oeynhausen',
    'lat'  => 52.2058,        // NEU
    'lng'  => 8.7974,         // NEU
    'zoom' => 13,             // NEU
  ],
  // ...
]
```

### 5.3 Lead inputs Erweiterung

**Keine DB-Migration nötig!** Adresse wird in `inputs` JSON gespeichert:

```json
{
	"property_type": "apartment",
	"size": 75,
	"city_id": 1,
	"city_name": "Bad Oeynhausen",
	"address": "Musterstraße 15, 32549 Bad Oeynhausen",
	"address_lat": 52.2058,
	"address_lng": 8.7974,
	"condition": "good",
	"location_rating": 4,
	"features": ["balcony", "elevator"]
}
```

---

## 6. PDF-Integration

### 6.1 LeadPdfService Anpassung

**Datei:** `includes/Services/Pdf/LeadPdfService.php`

```php
private function buildPdfData( object $lead, ?object $location ): array {
  $inputs = json_decode( $lead->inputs ?? '{}', true ) ?: [];

  // Adresse: Exakte Adresse falls vorhanden, sonst Stadt
  $propertyAddress = $inputs['address'] ?? $inputs['city_name'] ?? $location->name ?? '';

  // Koordinaten für statische Karte
  $addressLat = $inputs['address_lat'] ?? $location->latitude ?? null;
  $addressLng = $inputs['address_lng'] ?? $location->longitude ?? null;

  // Statische Karte generieren (falls Koordinaten vorhanden)
  $mapImageUrl = null;
  if ( $addressLat && $addressLng ) {
    $mapImageUrl = $this->getStaticMapUrl( $addressLat, $addressLng );
  }

  return [
    // ... bestehende Felder ...
    'property_address' => $propertyAddress,
    'address_lat'      => $addressLat,
    'address_lng'      => $addressLng,
    'map_image_url'    => $mapImageUrl,  // NEU
  ];
}

private function getStaticMapUrl( float $lat, float $lng ): string {
  // OpenStreetMap Static Maps API (kostenlos, DSGVO-konform)
  // Alternative: Screenshot via Puppeteer
  return sprintf(
    'https://staticmap.openstreetmap.de/staticmap.php?center=%f,%f&zoom=15&size=400x200&markers=%f,%f,red-pushpin',
    $lat, $lng, $lat, $lng
  );
}
```

### 6.2 PDF-Template Anpassung

**Datei:** `includes/Services/Pdf/Templates/rent-analysis.php`

Neuer Block für Karte (nach Objektdaten):

```php
<?php if ( ! empty( $map_image_url ) ) : ?>
  <h2><?php esc_html_e( 'Standort', 'resa' ); ?></h2>
  <div style="margin: 12px 0; text-align: center;">
    <img
      src="<?php echo esc_url( $map_image_url ); ?>"
      alt="<?php esc_attr_e( 'Standort-Karte', 'resa' ); ?>"
      style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 4px;"
    />
  </div>
  <p style="text-align: center; font-size: 11px; color: #64748b;">
    <?php echo esc_html( $property_address ); ?>
  </p>
<?php endif; ?>
```

---

## 7. Frontend Ergebnisseite

### 7.1 RentResult Anpassung

**Datei:** `modules/rent-calculator/src/result/RentResult.tsx`

Karte mit Standort anzeigen:

```typescript
import { ResaMap } from '@frontend/components/map';

export function RentResult({ result, inputs }: RentResultProps) {
  const hasCoordinates = inputs.address_lat && inputs.address_lng;

  return (
    <div>
      {/* ... bestehende Ergebnis-Anzeige ... */}

      {/* Standort-Karte */}
      {hasCoordinates && (
        <div className="resa-mt-6">
          <h3 className="resa-text-sm resa-font-semibold resa-mb-2">
            {__('Standort', 'resa')}
          </h3>
          <ResaMap
            center={{ lat: inputs.address_lat, lng: inputs.address_lng }}
            zoom={15}
            showMarker
            height={200}
            lazyLoad={false}
          />
          <p className="resa-text-xs resa-text-muted-foreground resa-mt-2 resa-text-center">
            {inputs.address}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Admin Lead-Detail

### 8.1 Lead-Detail Seite

**Datei:** `src/admin/pages/LeadDetail.tsx`

Karte in Lead-Details anzeigen:

```typescript
{lead.inputs?.address && (
  <div className="resa-mt-4">
    <h4>{__('Objektadresse', 'resa')}</h4>
    <p>{lead.inputs.address}</p>

    {lead.inputs.address_lat && lead.inputs.address_lng && (
      <LeafletMapWrapper
        center={{
          lat: lead.inputs.address_lat,
          lng: lead.inputs.address_lng
        }}
        zoom={15}
        markerPosition={{
          lat: lead.inputs.address_lat,
          lng: lead.inputs.address_lng
        }}
        height={200}
        clickToPlace={false}
      />
    )}
  </div>
)}
```

---

## 9. Implementierungsreihenfolge

### Phase 1: Backend-Grundlagen

1. [ ] GeocodingController erweitern (viewbox, bounded, public)
2. [ ] Locations-Config um Koordinaten erweitern
3. [ ] Frontend-API für Geocoding freigeben

### Phase 2: Frontend-Komponenten

4. [ ] `useAddressSearch` Hook erstellen
5. [ ] `AddressAutocomplete` Komponente erstellen
6. [ ] `AddressInput` Komponente erstellen (Autocomplete + Karte)

### Phase 3: Modul-Integration

7. [ ] `AddressStep` für Mietpreis-Rechner erstellen
8. [ ] `addressSchema` Zod-Validierung
9. [ ] RentCalculatorWidget anpassen (neuer Step)
10. [ ] RentResult um Karte erweitern

### Phase 4: PDF & Admin

11. [ ] LeadPdfService: Statische Karte generieren
12. [ ] rent-analysis.php: Karten-Block hinzufügen
13. [ ] Lead-Detail: Karte anzeigen

### Phase 5: Testing & Polish

14. [ ] Tests für AddressInput
15. [ ] Tests für AddressStep
16. [ ] Build & Review

---

## 10. Datenfluss-Diagramm

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND WIDGET                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CityStep                    AddressStep                             │
│  ┌──────────────┐           ┌──────────────────────────────────┐    │
│  │ Dropdown:    │    →      │ Input: Musterstraße 15           │    │
│  │ Bad Oeynhausen│           │ Karte: [📍 Marker]              │    │
│  │ city_id: 1   │           │ address: "Musterstr. 15, 32549"  │    │
│  │ city_name: ..│           │ address_lat: 52.2058             │    │
│  │ city_lat: .. │           │ address_lng: 8.7974              │    │
│  └──────────────┘           └──────────────────────────────────┘    │
│         │                              │                             │
│         └──────────────┬───────────────┘                             │
│                        ▼                                             │
│              ┌─────────────────┐                                     │
│              │  WizardData     │                                     │
│              │  {              │                                     │
│              │    city_id,     │                                     │
│              │    city_name,   │                                     │
│              │    address,     │                                     │
│              │    address_lat, │                                     │
│              │    address_lng, │                                     │
│              │    ...          │                                     │
│              │  }              │                                     │
│              └────────┬────────┘                                     │
│                       │                                              │
└───────────────────────┼──────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REST API                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  POST /leads/partial                                                 │
│  {                                                                   │
│    sessionId: "uuid",                                                │
│    assetType: "rent-calculator",                                     │
│    locationId: 1,                                                    │
│    inputs: {                                                         │
│      city_id: 1,                                                     │
│      city_name: "Bad Oeynhausen",                                    │
│      address: "Musterstraße 15, 32549 Bad Oeynhausen",  ← NEU       │
│      address_lat: 52.2058,                               ← NEU       │
│      address_lng: 8.7974,                                ← NEU       │
│      property_type: "apartment",                                     │
│      size: 75,                                                       │
│      ...                                                             │
│    },                                                                │
│    result: { estimatedRent: 773, ... }                               │
│  }                                                                   │
│                                                                      │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  resa_leads                                                          │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ id: 42                                                      │     │
│  │ session_id: "abc-123"                                       │     │
│  │ location_id: 1                                              │     │
│  │ inputs: '{"address":"Musterstr...","address_lat":52.2...}'  │     │
│  │ result: '{"estimatedRent":773,...}'                         │     │
│  │ first_name: "Max"                                           │     │
│  │ email: "max@example.de"                                     │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ RESULT PAGE │ │ PDF         │ │ ADMIN       │
├─────────────┤ ├─────────────┤ ├─────────────┤
│             │ │             │ │             │
│ Karte mit   │ │ Objektdaten:│ │ Lead-Detail:│
│ Marker      │ │ Lage: ...   │ │ Adresse:    │
│             │ │             │ │ Musterstr.  │
│ Adresse:    │ │ [Karten-    │ │             │
│ Musterstr.. │ │  Miniatur]  │ │ [Karte]     │
│             │ │             │ │             │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## 11. Sicherheitsaspekte

### 11.1 Rate-Limiting

Nominatim hat ein Limit von **1 Request/Sekunde**.

Maßnahmen:

- Debounce im Frontend (300ms)
- Server-seitiges Caching (Transients, 1h TTL)
- Fallback bei Rate-Limit (Fehlermeldung, kein Crash)

### 11.2 Keine sensiblen Daten exponieren

- Geocoding-Endpoint ist **public** (keine Auth nötig)
- Aber: Keine internen Location-Daten zurückgeben
- Nur Nominatim-Ergebnisse durchreichen

### 11.3 Input-Validierung

- `query` sanitizen (max 200 Zeichen)
- `viewbox` validieren (Format prüfen)
- Koordinaten auf gültige Bereiche prüfen

---

## 12. DSGVO-Konformität

### 12.1 Nominatim (OpenStreetMap)

- Server in EU/UK
- Keine personenbezogenen Daten
- Nur Adress-Suche, keine Tracking
- **Unproblematisch**

### 12.2 Statische Karten (OSM)

- `staticmap.openstreetmap.de` = EU-Server
- Keine Cookies, kein Tracking
- **Unproblematisch**

### 12.3 Adress-Speicherung

- Adresse wird mit Consent gespeichert
- Teil der Lead-Daten (DSGVO-konform)
- Löschung über Lead-Löschung

---

## 13. Offene Fragen

1. **Optional oder Pflicht?**
    - Empfehlung: **Optional** (Besucher kann überspringen)
    - Makler bekommt trotzdem die Stadt aus CityStep

2. **Reverse Geocoding?**
    - Klick auf Karte → Adresse ermitteln?
    - Empfehlung: Ja, aber nur als "Nice-to-have"

3. **Google Places statt Nominatim?**
    - Premium-Feature für bessere Autocomplete-Qualität?
    - Empfehlung: Später als Option, Nominatim reicht für MVP

4. **Statische Karte im PDF?**
    - Externe URL (OSM) oder lokales Rendering (Puppeteer)?
    - Empfehlung: Externes URL für MVP, Puppeteer später

---

## 14. Akzeptanzkriterien

- [ ] AddressStep wird nach CityStep angezeigt
- [ ] Autocomplete zeigt nur Adressen in der gewählten Stadt
- [ ] Karte zeigt Marker bei Adress-Auswahl
- [ ] Adresse wird in `inputs` JSON gespeichert
- [ ] Koordinaten werden in `inputs` JSON gespeichert
- [ ] Ergebnisseite zeigt Karte mit Marker
- [ ] PDF zeigt Adresse unter "Objektdaten"
- [ ] PDF zeigt Karten-Miniatur (wenn Koordinaten vorhanden)
- [ ] Admin Lead-Detail zeigt Adresse + Karte
- [ ] Step ist überspringbar (Adresse optional)
- [ ] `npm run build` erfolgreich
- [ ] Tests für AddressInput bestehen
