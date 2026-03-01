# SPEC: Maps Integration

**Status:** Entwurf
**Erstellt:** 2026-03-01
**Betrifft:** Location-Editor, Frontend-Widget, Admin-Dashboard, PDF-Generierung

## Zusammenfassung

Integration von interaktiven Karten in RESA nach dem Dual-Provider-Prinzip: Leaflet+OpenStreetMap als kostenloser Standard, Google Maps als optionales Upgrade. Karten werden an 5 Stellen benötigt: Frontend-Ergebnis, Admin Location-Editor, Lead-Detail, Dashboard-Übersicht und PDF.

## Referenz-Dokument

Detaillierte Planung: `docs/planning/RESA-Karten-und-Geocoding.md`

---

## Aktueller Stand (IST)

### Location Model (`includes/Models/Location.php`)

- **Keine Koordinaten-Felder** (lat, lng, zoom fehlen)
- Nur: slug, name, country, bundesland, region_type, currency, data, factors

### LocationEditor (`src/admin/components/LocationEditor.tsx`)

- **Keine Karten-Integration**
- Nur Textfelder: Name, Slug, Land, Bundesland, Regionstyp
- Keine Adress-Suche, keine Koordinaten-Eingabe

### Locations Admin-Seite (`src/admin/pages/Locations.tsx`)

- Tabellen-Ansicht ohne Karten-Visualisierung
- Create/Edit Views ohne Map

### Frontend-Module

- `LocationRatingStep.tsx` ist ein Slider (1-5) für Lage-Qualität
- **Keine Standort-Auswahl mit Karte** für Besucher

---

## Betroffene Dateien

### Neue Dateien

**PHP Backend:**

- `includes/Services/Geocoding/GeocoderInterface.php` — Interface für Geocoding
- `includes/Services/Geocoding/NominatimGeocoder.php` — OSM Nominatim (Standard)
- `includes/Services/Geocoding/GoogleGeocoder.php` — Google Places (wenn aktiviert)
- `includes/Api/GeocodingController.php` — REST-Endpoint für Adress-Suche

**React Komponenten:**

- `src/frontend/components/map/ResaMap.tsx` — Provider-Abstraktion
- `src/frontend/components/map/LeafletMapWrapper.tsx` — Leaflet/OSM Implementierung
- `src/frontend/components/map/GoogleMapWrapper.tsx` — Google Maps Implementierung
- `src/frontend/components/map/PriceZoneLayer.tsx` — GeoJSON Preiszonen
- `src/frontend/components/map/MapPlaceholder.tsx` — Lazy-Load Skeleton
- `src/admin/components/LocationMapPicker.tsx` — Karten-Picker für Location-Editor

**Styles:**

- `src/frontend/styles/leaflet-override.css` — CSS-Isolation für Leaflet

### Geänderte Dateien

| Datei                                     | Änderung                              |
| ----------------------------------------- | ------------------------------------- |
| `includes/Models/Location.php`            | + lat, lng, zoom Felder               |
| `includes/Database/Schema.php`            | + Spalten in resa_locations           |
| `includes/Api/LocationsController.php`    | + Koordinaten in CRUD                 |
| `src/admin/components/LocationEditor.tsx` | + LocationMapPicker Integration       |
| `src/admin/hooks/useLocations.ts`         | + lat/lng in TypeScript-Interface     |
| `src/admin/pages/Settings.tsx`            | + Tab "Karten" für Provider-Wahl      |
| `package.json`                            | + leaflet, react-leaflet Dependencies |

---

## Datenbank-Änderungen

### Geänderte Tabellen: `resa_locations`

```sql
ALTER TABLE {prefix}resa_locations
ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER currency,
ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude,
ADD COLUMN zoom_level TINYINT UNSIGNED DEFAULT 13 AFTER longitude;
```

### Neue Optionen (`wp_options`)

| Option                      | Typ    | Default     | Beschreibung                        |
| --------------------------- | ------ | ----------- | ----------------------------------- |
| `resa_map_provider`         | string | `'osm'`     | `'osm'` oder `'google'`             |
| `resa_google_maps_api_key`  | string | `''`        | Google Maps API Key                 |
| `resa_map_style`            | string | `'minimal'` | `'standard'`, `'minimal'`, `'dark'` |
| `resa_map_default_zoom`     | int    | `13`        | Standard Zoom-Level                 |
| `resa_map_show_price_zones` | bool   | `false`     | Preiszonen anzeigen (Premium)       |
| `resa_map_in_pdf`           | bool   | `true`      | Karte im PDF generieren             |

---

## API-Änderungen

### Neue Endpoints

| Methode | Route                             | Beschreibung                    | Auth  |
| ------- | --------------------------------- | ------------------------------- | ----- |
| GET     | `/resa/v1/admin/geocoding/search` | Adress-Suche (Nominatim/Google) | Admin |

**Request:**

```json
{
	"query": "Bad Oeynhausen, Deutschland"
}
```

**Response:**

```json
{
	"results": [
		{
			"lat": 52.2058,
			"lon": 8.7974,
			"display_name": "Bad Oeynhausen, Nordrhein-Westfalen, Deutschland",
			"city": "Bad Oeynhausen",
			"country": "de"
		}
	]
}
```

### Geänderte Endpoints

**GET/POST `/resa/v1/admin/locations`** — Neue Felder:

```json
{
  "id": 1,
  "name": "Bad Oeynhausen",
  "latitude": 52.2058,
  "longitude": 8.7974,
  "zoom_level": 13,
  "..."
}
```

---

## Implementierungsdetails

### 1. Datenbank-Migration

```php
// includes/Database/Migrations/AddLocationCoordinates.php
public function up(): void {
    global $wpdb;
    $table = $wpdb->prefix . 'resa_locations';

    $wpdb->query( "ALTER TABLE {$table}
        ADD COLUMN latitude DECIMAL(10, 8) NULL AFTER currency,
        ADD COLUMN longitude DECIMAL(11, 8) NULL AFTER latitude,
        ADD COLUMN zoom_level TINYINT UNSIGNED DEFAULT 13 AFTER longitude
    " );
}
```

### 2. Geocoder-Service

```php
// includes/Services/Geocoding/NominatimGeocoder.php
class NominatimGeocoder implements GeocoderInterface {
    private const API_URL = 'https://nominatim.openstreetmap.org/search';

    public function search( string $query ): array {
        $response = wp_remote_get( self::API_URL, [
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'RESA-Plugin/1.0',
            ],
            'body' => [
                'q'              => $query,
                'format'         => 'jsonv2',
                'addressdetails' => 1,
                'limit'          => 5,
                'countrycodes'   => 'de,at,ch',
            ],
        ] );
        // ... parse response
    }
}
```

### 3. Map-Provider-Abstraktion

```tsx
// src/frontend/components/map/ResaMap.tsx
interface MapConfig {
	provider: 'osm' | 'google';
	googleApiKey?: string;
	center: [number, number]; // [lat, lng]
	zoom: number;
	markers?: MapMarker[];
	interactive?: boolean;
	height?: number;
}

export function ResaMap({ config }: { config: MapConfig }) {
	if (config.provider === 'google' && config.googleApiKey) {
		return <GoogleMapWrapper config={config} />;
	}
	return <LeafletMapWrapper config={config} />;
}
```

### 4. LocationMapPicker für Admin

```tsx
// src/admin/components/LocationMapPicker.tsx
interface LocationMapPickerProps {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export function LocationMapPicker({ ... }) {
  // - Karte mit Marker anzeigen
  // - Klick auf Karte → Marker setzen → onLocationChange
  // - Adress-Suchfeld mit Autocomplete
  // - Drag & Drop für Marker
  // - Lat/Lng Felder (auto-befüllt)
}
```

### 5. Leaflet CSS-Isolation

```css
/* src/frontend/styles/leaflet-override.css */
.resa-widget-root .leaflet-container {
	font-family: inherit;
	z-index: 1;
}

.resa-widget-root .leaflet-popup-content-wrapper {
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### 6. Tile-Layer-Optionen

```typescript
const tileLayerOptions = {
	standard: {
		url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: '© OpenStreetMap contributors',
	},
	minimal: {
		url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
		attribution: '© OpenStreetMap, © CARTO',
	},
	dark: {
		url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
		attribution: '© OpenStreetMap, © CARTO',
	},
};
```

---

## UI/UX

### Location-Editor mit Karte

```
┌─────────────────────────────────────────────────────────────────┐
│  Location bearbeiten: Bad Oeynhausen                            │
│                                                                 │
│  Name:        [Bad Oeynhausen                              ]    │
│  Slug:        [bad-oeynhausen                              ]    │
│  Land:        [▼ Deutschland                               ]    │
│  Bundesland:  [▼ Nordrhein-Westfalen                       ]    │
│                                                                 │
│  Standort auf Karte:                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  🔍 [Adresse suchen...                            ]     │    │
│  │                                                         │    │
│  │              ┌───┐                                      │    │
│  │              │ ✕ │ ← Drag & Drop Marker                 │    │
│  │              └───┘                                      │    │
│  │                                                         │    │
│  │  Klicken Sie auf die Karte um den Standort zu setzen.   │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Latitude:    [52.2058            ]  (auto-befüllt)             │
│  Longitude:   [8.7974             ]  (auto-befüllt)             │
│  Zoom-Level:  [▼ 13 — Stadtteil   ]                             │
│                                                                 │
│  ─── Regionale Kostensätze ─────────────────────────────────    │
│  Grunderwerbsteuer:  [5.0  ] %                                  │
│  Maklerprovision:    [3.57 ] %                                  │
│                                                                 │
│                              [Abbrechen]  [Speichern]           │
└─────────────────────────────────────────────────────────────────┘
```

### Settings-Seite: Karten-Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Karten                                         │
│                                                                 │
│  Kartenanbieter:                                                │
│  ● OpenStreetMap (kostenlos, kein API-Key nötig)                │
│  ○ Google Maps                                                  │
│                                                                 │
│  ─── Google Maps (ausgegraut wenn OSM) ─────────────────────    │
│                                                                 │
│  API-Key:       [AIzaSy...                                 ]    │
│  [API-Key testen]  ✅ Gültig                                    │
│                                                                 │
│  ─── Allgemeine Optionen ───────────────────────────────────    │
│                                                                 │
│  Standard-Zoom:     [▼ 13 — Stadtteil          ]               │
│  Kartenstil:        [▼ Minimal (CartoDB)        ]               │
│                                                                 │
│  Scroll-Zoom:          [ ] (aus = Benutzer muss klicken)        │
│  Karte im PDF:         [✓]                                      │
│                                                                 │
│  [Speichern]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Free vs. Premium

| Feature                    | Free        | Premium           |
| -------------------------- | ----------- | ----------------- |
| Karte im Location-Editor   | ✅ OSM      | ✅ OSM / Google   |
| Kartenanbieter wählen      | ❌ Nur OSM  | ✅ OSM / Google   |
| Kartenstil wählen          | ❌ Standard | ✅ 3 Stile        |
| Preiszonen (GeoJSON)       | ❌          | ✅                |
| Dashboard Lead-Karte       | ❌          | ✅ mit Clustering |
| Karte im PDF               | ❌          | ✅                |
| Google Places Autocomplete | ❌          | ✅ (mit API-Key)  |

---

## Implementierungsreihenfolge

### Phase 1: Grundlagen (MVP)

1. [ ] Datenbank-Migration (lat, lng, zoom Spalten)
2. [ ] Location Model erweitern
3. [ ] LocationsController anpassen
4. [ ] NPM-Pakete installieren: `leaflet`, `react-leaflet`, `@types/leaflet`
5. [ ] LeafletMapWrapper Komponente (OSM)
6. [ ] LocationMapPicker für Admin
7. [ ] LocationEditor Integration

### Phase 2: Geocoding

8. [ ] GeocoderInterface + NominatimGeocoder
9. [ ] GeocodingController REST-Endpoint
10. [ ] Adress-Suche im LocationMapPicker

### Phase 3: Settings

11. [ ] Karten-Tab in Settings-Seite
12. [ ] Map-Provider-Options in wp_options
13. [ ] Tile-Layer-Auswahl (Standard, Minimal, Dark)

### Phase 4: Frontend-Widget (später)

14. [ ] ResaMap Provider-Abstraktion
15. [ ] Frontend Ergebnis-Karte mit Standort-Marker
16. [ ] Lazy Loading (Intersection Observer)

### Phase 5: Premium-Features (später)

17. [ ] GoogleMapWrapper
18. [ ] Google Places Autocomplete
19. [ ] GeoJSON Preiszonen
20. [ ] Dashboard Lead-Karte mit Clustering
21. [ ] Statisches Kartenbild für PDF

---

## DSGVO-Aspekte

| Provider      | Datenweitergabe     | Status             | Maßnahme                   |
| ------------- | ------------------- | ------------------ | -------------------------- |
| OpenStreetMap | Tile-Server (EU/UK) | ✅ Unproblematisch | Standard                   |
| Google Maps   | Google (USA)        | ⚠ DPA nötig        | Cookie-Consent-Platzhalter |

### Cookie-Consent für Google Maps

```tsx
function GoogleMapConsent({ onAccept }: { onAccept: () => void }) {
	return (
		<div className="resa-map-consent">
			<p>{__('Karte wird von Google Maps bereitgestellt.', 'resa')}</p>
			<p>{__('Beim Laden werden Daten an Google übermittelt.', 'resa')}</p>
			<Button onClick={onAccept}>{__('Karte laden', 'resa')}</Button>
		</div>
	);
}
```

---

## Dependencies

```json
{
	"dependencies": {
		"leaflet": "^1.9.0",
		"react-leaflet": "^4.2.0"
	},
	"devDependencies": {
		"@types/leaflet": "^1.9.0"
	},
	"optionalDependencies": {
		"@vis.gl/react-google-maps": "^1.0.0"
	}
}
```

---

## Akzeptanzkriterien

- [ ] Location-Editor zeigt interaktive Karte (Leaflet/OSM)
- [ ] Klick auf Karte setzt Marker und befüllt Koordinaten
- [ ] Adress-Suche funktioniert (Nominatim)
- [ ] Drag & Drop für Marker funktioniert
- [ ] Koordinaten werden in DB gespeichert
- [ ] Karten-Settings in Einstellungen verfügbar
- [ ] Leaflet CSS kollidiert nicht mit WordPress-Theme
- [ ] `npm run build` erfolgreich
- [ ] Tests für Geocoding-Service

---

## Security-Überlegungen

- Nominatim erfordert User-Agent Header
- Rate-Limiting bei Geocoding beachten (1 req/s bei Nominatim)
- Google API-Key nur serverseitig speichern (nicht im Frontend exponieren)
- Koordinaten-Validierung: lat -90 bis 90, lng -180 bis 180

---

## Offene Fragen

1. Soll die Karte im Frontend-Widget (Modul-Ergebnis) schon in Phase 1 implementiert werden oder erst später?
2. Brauchen wir einen Fallback wenn Nominatim nicht erreichbar ist?
3. Sollen Koordinaten Pflichtfelder sein oder optional bleiben?
