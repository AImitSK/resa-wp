# RESA— Karten & Geocoding

## Kartenanbieter, Einsatzorte, API-Kosten & Technische Umsetzung

---

## 1. Wo werden Karten in RESA gebraucht?

Karten tauchen an **fünf verschiedenen Stellen** im Plugin auf — jede mit unterschiedlichen Anforderungen:

```
Stelle              Kontext          Interaktiv?   Wer sieht es?     Häufigkeit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① Frontend-Widget    Ergebnisseite    Ja            Besucher           Hoch
   "Ihr Standort"    Standort im      Zoom, Pan     (jede Berechnung)  (jeder Lead)
                     Markt-Kontext

② Admin: Locations   Location-        Ja            Makler (Admin)     Selten
   Editor            Bearbeitung      Marker setzen                    (einmalig Setup)
                     Koordinaten
                     wählen

③ Admin: Lead-       Lead-            Ja            Makler (Admin)     Mittel
   Detail            Detailansicht    Marker                           (pro Lead-Ansicht)
                     "Wo kommt der
                     Lead her?"

④ Admin: Dashboard   Leads auf        Ja            Makler (Admin)     Selten
   Karte             Karte verteilt   Cluster                          (Dashboard-Aufruf)
                     Heatmap

⑤ PDF-Ergebnis       Statisches       Nein          Lead (per E-Mail)  Hoch
                     Kartenbild                                        (jeder Lead)
                     im PDF
```

---

## 2. Anbieter-Entscheidung: Dual-Provider

### Das Kostenproblem mit Google Maps

Seit März 2025 gilt das neue Google Maps Pricing:

```
Google Maps API              Free/Monat (Essentials)    Danach pro 1.000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dynamic Maps (JS)            10.000 Loads                $7,00
Geocoding API                10.000 Requests             $5,00
Places Autocomplete          10.000 Sessions             $2,83
Static Maps                  10.000 Requests             $2,00
Maps Embed API               Unbegrenzt                  Kostenlos
```

**Problem:** RESA läuft auf hunderten Makler-Websites. **Jede** Website braucht einen eigenen Google-API-Key. Ein Makler mit 5.000 Besuchern/Monat auf dem Rechner bleibt unter dem Free-Tier. Ein aktiver Makler mit 20.000 Besuchern zahlt bereits.

### Lösung: OpenStreetMap als Standard, Google Maps als Option

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  STANDARD (ohne API-Key, kostenlos, DSGVO-freundlich):       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                                              │
│  Leaflet.js + OpenStreetMap                                  │
│  → Keine API-Kosten                                          │
│  → Kein API-Key nötig                                        │
│  → DSGVO-konform (keine Daten an Google)                     │
│  → Funktioniert sofort nach Plugin-Installation              │
│  → Qualität für DE/AT/CH: exzellent (OSM in DACH top)        │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  OPTION (Premium, API-Key erforderlich):                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│                                                              │
│  Google Maps JavaScript API                                  │
│  → Makler gibt eigenen API-Key ein                           │
│  → Bekannteres Kartenbild                                    │
│  → Street View Integration möglich                           │
│  → Places Autocomplete für Adress-Suche                      │
│  → Makler trägt API-Kosten selbst                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Vergleich

```
Kriterium                 Leaflet + OSM           Google Maps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kosten                    ✅ Kostenlos             ⚠ 10K free, dann $$$
API-Key nötig             ✅ Nein                  ❌ Ja (pro Makler)
DSGVO                     ✅ Kein US-Datentransfer ⚠ Google-ToS, US
Kartenqualität DE/AT/CH   ✅ Hervorragend (OSM)    ✅ Hervorragend
Kartenqualität EU         ✅ Gut bis sehr gut      ✅ Sehr gut
Street View               ❌ Nicht verfügbar       ✅ Ja
Places Autocomplete       ❌ Nicht nativ           ✅ Ja
Satellite/Luftbild        ⚠ Über Drittanbieter    ✅ Eingebaut
Bekanntheitsgrad          ⚠ Weniger bekannt       ✅ "Die Karte"
Offline/Self-hosted       ✅ Tile-Server möglich   ❌ Nein
React-Integration         ✅ react-leaflet         ✅ @vis.gl/react-google-maps
Bundle-Size               ✅ ~40 KB                ⚠ ~200 KB (extern)
Setup-Aufwand (Makler)    ✅ Null                  ⚠ API-Key anlegen
```

**Entscheidung:** Leaflet + OpenStreetMap als Standard. Google Maps als optionales Upgrade in den Einstellungen. Der Makler entscheidet selbst.

---

## 3. Einsatzort ①: Frontend-Widget (Ergebnis)

### Was zeigt die Karte?

Nach der Berechnung sieht der Besucher sein Ergebnis — darunter eine Kontextkarte:

```
┌─────────────────────────────────────────────────────────┐
│  Ihr Ergebnis: 714 € — 833 € / Monat                   │
│                                                         │
│  Standort: Bad Oeynhausen                               │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │         ┌───┐                                   │    │
│  │         │ █ │ ← Marker: Standort des Objekts    │    │
│  │         └───┘                                   │    │
│  │                                                 │    │
│  │    ░░░░░░░░░░░  ← Farbige Zone: PLZ-Gebiet     │    │
│  │    ░░░░░░░░░░░     mit Durchschnittsmietpreis   │    │
│  │                                                 │    │
│  │  [+][-]            OpenStreetMap                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ⬤ 6-8 €/m²   ⬤ 8-10 €/m²   ⬤ 10-12 €/m²            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Features der Frontend-Karte

```
Feature                          Standard (OSM)     Mit Google Maps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Marker am Standort               ✅                 ✅
Zoom & Pan                       ✅                 ✅
Farbige Preiszonen               ✅ GeoJSON         ✅ GeoJSON
Tooltip mit Stadtteil-Preis      ✅                 ✅
Custom Marker (Makler-Branding)  ✅ SVG-Icon        ✅ Custom Icon
Responsive                       ✅                 ✅
Dark Mode                        ✅ Tile-Layer      ✅ Map Styles
Satellite/Luftbild               ❌                 ✅
Street View                      ❌                 ✅
```

### Lazy Loading

Die Karte wird **nicht sofort** geladen — erst wenn der Besucher zum Ergebnis scrollt oder die Ergebnis-Seite erreicht. Das spart Bandbreite und API-Calls.

```typescript
// Karte erst laden wenn sichtbar (Intersection Observer)
const mapRef = useRef(null);
const isInView = useInView(mapRef, { once: true });

return (
  <div ref={mapRef} className="resa-map-container">
    {isInView && <ResultMap location={location} result={result} />}
    {!isInView && <MapPlaceholder />}  {/* Skeleton/Blur */}
  </div>
);
```

---

## 4. Einsatzort ②: Admin — Location-Editor

### Koordinaten setzen per Karte

Wenn der Makler eine Location anlegt, muss er Koordinaten setzen. Statt Latitude/Longitude manuell einzugeben, klickt er auf die Karte:

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
│  │  Klicken Sie auf die Karte oder suchen Sie eine Adresse │    │
│  │  um den Standort zu setzen.                             │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Latitude:    [52.2058            ]  (auto-befüllt)             │
│  Longitude:   [8.7974             ]  (auto-befüllt)             │
│  Zoom-Level:  [▼ 12 — Stadt      ]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Adress-Suche im Admin (Geocoding)

Für die Suche "Bad Oeynhausen" → Koordinaten brauchen wir **Geocoding**:

```
Provider                  Kosten              Qualität DE       Empfehlung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nominatim (OSM)           Kostenlos            ✅ Sehr gut       Standard
                          (Fair-Use: 1 req/s)

Photon (Komoot)           Kostenlos            ✅ Sehr gut       Alternative
                          (basiert auf OSM)    Schneller als
                                               Nominatim

Google Geocoding API      10K free/Monat       ✅ Exzellent      Nur wenn Google
                          dann $5/1K                              Maps aktiviert

Google Places Auto-       10K free/Monat       ✅ Exzellent      Nur wenn Google
complete                  dann $2,83/1K        Autocomplete       Maps aktiviert
```

**Entscheidung:** Nominatim (OSM) als Standard für den Admin-Geocoding. Wird nur beim Setup genutzt (wenige Calls), Fair-Use-Limit kein Problem. Wenn Google Maps aktiviert → Places Autocomplete.

---

## 5. Einsatzort ③④: Admin — Lead-Karte & Dashboard

### Lead-Detail: Woher kommt der Lead?

```
┌─────────────────────────────────────────────────────────┐
│  Lead #4523: Maria Schmidt                              │
│                                                         │
│  Asset: Mietpreis-Kalkulator                            │
│  Location: Bad Oeynhausen                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              ⬤ Lead-Standort                    │    │
│  │                                                 │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│  IP-basiert (anonymisiert), Genauigkeit: Stadtebene    │
└─────────────────────────────────────────────────────────┘
```

### Dashboard: Alle Leads auf einer Karte

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard → Lead-Verteilung                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │        ⑫ ← Cluster: 12 Leads in Minden                 │    │
│  │                                                         │    │
│  │                 ㉓ ← 23 Leads in Bad Oeynhausen         │    │
│  │                                                         │    │
│  │           ⑤ ← 5 Leads in Herford                       │    │
│  │                                                         │    │
│  │                      ⑧ ← 8 Leads in Vlotho             │    │
│  │                                                         │    │
│  │  [+][-]                                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Filter: [▼ Alle Assets] [▼ Alle Makler] [▼ Letzte 30 Tage]   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Marker-Clustering via **Leaflet.markercluster** — bei Zoom-In lösen sich Cluster in einzelne Marker auf.

---

## 6. Einsatzort ⑤: PDF — Statisches Kartenbild

PDFs können keine interaktiven Karten zeigen. Wir brauchen ein **statisches Bild**.

### Optionen für statische Karten-Bilder

```
Methode                    Kosten          Qualität       Komplexität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenStreetMap Static API   Kostenlos       ✅ Gut         Einfach
(z.B. staticmap.openroute
service.org oder eigener
Tile-Renderer)

Mapbox Static Images API   50K free/Monat  ✅ Sehr gut    Einfach
                           dann $1/1K      Stylish

Google Static Maps API     10K free/Monat  ✅ Exzellent   Einfach
                           dann $2/1K

Leaflet + Puppeteer        Kostenlos       ✅ Sehr gut    Mittel
(Screenshot der Karte)     (Node.js nötig)
```

**Entscheidung:**

```
Puppeteer vorhanden?
  │
  ├─ JA  → Leaflet-Karte als HTML rendern → Puppeteer-Screenshot → PNG
  │        (Gleiche Qualität wie Frontend, kostenlos)
  │
  └─ NEIN → OpenStreetMap Static Map API
             (Einfacher URL-Aufruf, kostenlos, gute Qualität)
             ODER
             Google Static Maps (wenn API-Key vorhanden)
```

### Statische OSM-Karte per URL

```php
// Einfach: Statisches Kartenbild als URL
function resa_get_static_map_url( float $lat, float $lon, int $zoom = 14 ): string {
    // OpenRouteService Static Map (kostenlos)
    return sprintf(
        'https://staticmap.openrouteservice.org/staticmap?center=%f,%f&zoom=%d&size=600x300&markers=%f,%f,red-marker',
        $lon, $lat, $zoom, $lon, $lat
    );
}

// In DOMPDF-Template:
// <img src="<?= resa_get_static_map_url( 52.2058, 8.7974 ) ?>" width="600" height="300">
```

---

## 7. Technische Umsetzung

### 7.1 Pakete

```json
// package.json
{
  "dependencies": {
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    "@types/leaflet": "^1.9.0"
  },
  "optionalDependencies": {
    "@vis.gl/react-google-maps": "^1.0.0"
  }
}
```

### 7.2 Map-Provider-Abstraktion

```typescript
// src/frontend/components/map/MapProvider.tsx

type MapProviderType = 'osm' | 'google';

interface MapConfig {
  provider: MapProviderType;
  googleApiKey?: string;
  center: [number, number];   // [lat, lng]
  zoom: number;
  markers?: MapMarker[];
  geoJsonUrl?: string;        // Preiszonen
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

### 7.3 Leaflet-Map (Standard)

```tsx
// src/frontend/components/map/LeafletMapWrapper.tsx
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function LeafletMapWrapper({ config }: { config: MapConfig }) {
  // Custom Marker mit Makler-Branding
  const customIcon = L.divIcon({
    className: 'resa-map-marker',
    html: `<div style="background:var(--resa-color-primary);width:32px;height:32px;
           border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)">
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <MapContainer
      center={config.center}
      zoom={config.zoom}
      style={{ height: config.height ?? 300, width: '100%' }}
      scrollWheelZoom={false}  // Verhindert versehentliches Zoomen beim Scrollen
      className="resa-leaflet-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {config.markers?.map((marker, i) => (
        <Marker key={i} position={marker.position} icon={customIcon}>
          {marker.popup && <Popup>{marker.popup}</Popup>}
        </Marker>
      ))}

      {config.geoJsonUrl && (
        <PriceZoneLayer url={config.geoJsonUrl} />
      )}
    </MapContainer>
  );
}
```

### 7.4 GeoJSON Preiszonen

Für die farbigen Mietpreis-Zonen auf der Karte nutzen wir GeoJSON-Daten:

```typescript
// GeoJSON für Preiszonen (pro Location gespeichert)
interface PriceZone {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    name: string;           // "Innenstadt"
    avg_rent: number;       // 9.80
    price_level: 'low' | 'medium' | 'high' | 'premium';
  };
}

// Farben nach Preisniveau
const zoneColors = {
  low: '#93c5fd',      // Hellblau
  medium: '#60a5fa',   // Blau
  high: '#3b82f6',     // Kräftiges Blau
  premium: '#1d4ed8',  // Dunkelblau
};

function PriceZoneLayer({ url }: { url: string }) {
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch(url).then(r => r.json()).then(setGeoData);
  }, [url]);

  if (!geoData) return null;

  return (
    <GeoJSON
      data={geoData}
      style={(feature) => ({
        fillColor: zoneColors[feature.properties.price_level],
        fillOpacity: 0.3,
        color: zoneColors[feature.properties.price_level],
        weight: 1,
      })}
      onEachFeature={(feature, layer) => {
        layer.bindTooltip(
          `${feature.properties.name}: ${feature.properties.avg_rent} €/m²`
        );
      }}
    />
  );
}
```

### 7.5 CSS-Isolation für Leaflet

Leaflet bringt eigenes CSS mit, das mit dem Theme kollidieren kann:

```css
/* src/frontend/styles/leaflet-override.css */

/* Leaflet-CSS nur innerhalb des RESA-Widgets wirksam */
.resa-widget-root .leaflet-container {
  font-family: inherit;
  font-size: 14px;
  z-index: 1; /* Nicht über dem Theme-Header */
}

.resa-widget-root .leaflet-popup-content-wrapper {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Leaflet-Controls nicht vom Theme überschrieben */
.resa-widget-root .leaflet-control-zoom a {
  width: 30px !important;
  height: 30px !important;
  line-height: 30px !important;
}
```

---

## 8. Admin-Einstellungen

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Karten                                         │
│                                                                 │
│  Kartenanbieter:                                                │
│  ● OpenStreetMap (kostenlos, kein API-Key nötig)                │
│  ○ Google Maps                                                  │
│                                                                 │
│  ─── Google Maps Einstellungen (ausgegraut wenn OSM) ─────────  │
│                                                                 │
│  API-Key:       [AIzaSy...                                 ]    │
│  [API-Key testen]  ✅ Gültig                                    │
│                                                                 │
│  Aktivierte APIs:                                               │
│    ✅ Maps JavaScript API                                       │
│    ✅ Geocoding API                                              │
│    ☐  Places API (für Adress-Autocomplete)                      │
│    ☐  Static Maps API (für PDF-Kartenbilder)                    │
│                                                                 │
│  ─── Allgemeine Kartenoptionen ──────────────────────────────   │
│                                                                 │
│  Standard-Zoom:     [▼ 13 — Stadtteil          ]               │
│  Kartenstil:        [▼ Standard                 ]               │
│                     ○ Standard                                  │
│                     ○ Minimal (weniger Details)                  │
│                     ○ Dunkel (Dark Mode)                        │
│                                                                 │
│  Preiszonen anzeigen:  [✓]                                      │
│  Scroll-Zoom:          [ ] (aus = Benutzer muss klicken)        │
│  Karte im PDF:         [✓]                                      │
│                                                                 │
│  [Speichern]                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. DSGVO-Aspekte

```
Anbieter              Datenweitergabe          DSGVO-Status         Maßnahme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OpenStreetMap         Tile-Server (OSMF, UK)   ✅ Unproblematisch   Tiles können
(Leaflet)             IP-Adresse übermittelt   EU/UK-Server         self-hosted werden

Google Maps           Google (USA)             ⚠ Auftragsverarbei-  Einwilligungs-
                      IP, Standort, Nutzung    tung nötig (DPA)     banner empfohlen
                      an Google übermittelt                          (Cookie-Consent)
```

### Cookie-Consent-Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Wenn OpenStreetMap (Standard):                                 │
│  → Kein Cookie-Banner nötig für die Karte                       │
│  → Tiles werden von OSM-Servern geladen (EU/UK)                 │
│  → Keine Tracking-Cookies                                       │
│                                                                 │
│  Wenn Google Maps:                                              │
│  → Cookie-Consent empfohlen vor Karten-Ladung                   │
│  → RESA bietet einen "Karte laden"-Platzhalter:                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  🗺️  Karte wird von Google Maps bereitgestellt.          │    │
│  │                                                         │    │
│  │  Beim Laden der Karte werden Daten an Google             │    │
│  │  übermittelt. Mehr dazu in unserer                       │    │
│  │  Datenschutzerklärung.                                   │    │
│  │                                                         │    │
│  │  [Karte laden]   [Immer laden]                          │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Alternativ: Integration mit gängigen Cookie-Consent-Plugins    │
│  (Complianz, CookieBot, Real Cookie Banner etc.)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Geocoding: Adresse → Koordinaten

### Wann wird Geocoding gebraucht?

```
Anlass                          Wer                  Häufigkeit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location anlegen                Admin (Makler)       Selten (Setup)
Adresse in Location-Editor      Admin (Makler)       Selten (Setup)
suchen

Lead-Standort bestimmen         System (automatisch) Nie — wir nutzen Location-
(aus Lead-Daten)                                     Koordinaten, nicht Lead-Adresse

Besucher-Adresse               System (automatisch) Optional: IP → Stadt
(IP-Geolocation)                                     (nicht Geocoding)
```

**Geocoding findet fast nur im Admin statt** — beim Setup der Locations. Deshalb reicht Nominatim (OSM) mit Fair-Use-Limits völlig aus.

```php
// includes/Services/Geocoding/NominatimGeocoder.php

class NominatimGeocoder implements GeocoderInterface {

    private const API_URL = 'https://nominatim.openstreetmap.org/search';

    public function search( string $query ): ?GeoResult {
        $response = wp_remote_get( self::API_URL, [
            'timeout' => 10,
            'headers' => [
                'User-Agent' => 'RESA-Plugin/1.0 (contact@resa-plugin.com)',
                // Nominatim verlangt User-Agent
            ],
            'body' => [
                'q'             => $query,
                'format'        => 'jsonv2',
                'addressdetails' => 1,
                'limit'         => 5,
                'countrycodes'  => 'de,at,ch,fr,nl,es,it,gb',
            ],
        ] );

        if ( is_wp_error( $response ) ) return null;

        $results = json_decode( wp_remote_retrieve_body( $response ), true );
        if ( empty( $results ) ) return null;

        $first = $results[0];
        return new GeoResult(
            lat: (float) $first['lat'],
            lon: (float) $first['lon'],
            display_name: $first['display_name'],
            city: $first['address']['city'] ?? $first['address']['town'] ?? null,
            country: $first['address']['country_code'] ?? null,
        );
    }
}
```

### Geocoder-Interface (austauschbar)

```php
interface GeocoderInterface {
    public function search( string $query ): ?GeoResult;
}

// Implementierungen:
// - NominatimGeocoder (Standard)
// - GoogleGeocoder (wenn Google Maps aktiv + API-Key vorhanden)
// - PhotonGeocoder (Alternative OSM-basiert, schneller)
```

---

## 11. Tile-Layer-Optionen (Kartenstile)

Leaflet kann verschiedene Tile-Layer (Kartenstile) laden:

```
Stil                   URL-Pattern                              Kosten    Look
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Standard (OSM)         tile.openstreetmap.org                   Kostenlos Klassisch
CartoDB Positron       cartodb-basemaps.global.ssl.fastly.net   Kostenlos Minimalistisch, hell
CartoDB Dark Matter    cartodb-basemaps.global.ssl.fastly.net   Kostenlos Dunkel (Dark Mode)
Stadia OSM Bright      tiles.stadiamaps.com                     Kostenlos Modern, sauber
                       (API-Key für >200K/Monat)
OpenTopoMap            tile.opentopomap.org                     Kostenlos Topographisch
```

**Empfehlung:** CartoDB Positron als Standard — sieht moderner aus als Standard-OSM und lenkt nicht vom Inhalt ab. Ist kostenlos nutzbar.

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

## 12. Free vs. Premium

```
Feature                              Free              Premium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Karte im Ergebnis                    ✅ OSM             ✅ OSM oder Google
Karte im Admin                       ✅ OSM             ✅ OSM oder Google
Kartenanbieter wählen                ❌ Nur OSM         ✅ OSM / Google Maps
Kartenstil wählen                    ❌ Standard        ✅ 3 Stile
Preiszonen (GeoJSON)                 ❌                 ✅
Dashboard Lead-Karte                 ❌                 ✅ mit Clustering
Karte im PDF                         ❌                 ✅
Google Places Autocomplete           ❌                 ✅ (mit API-Key)
Custom Marker                        ❌                 ✅
```

---

## 13. Zusammenfassung

```
┌──────────────────────────────────────────────────────────────┐
│  RESA Karten & Geocoding auf einen Blick                      │
│                                                              │
│  STANDARD: Leaflet.js + OpenStreetMap                        │
│    → Kostenlos, kein API-Key, DSGVO-freundlich               │
│    → Hervorragende Qualität in DACH                          │
│    → CartoDB Positron als moderner Tile-Layer                │
│                                                              │
│  OPTION: Google Maps (Premium, eigener API-Key)              │
│    → Für Makler die "Google Look" bevorzugen                 │
│    → Street View, Satellite, Places Autocomplete             │
│    → Makler trägt API-Kosten (10K free/Monat pro API)        │
│                                                              │
│  5 EINSATZORTE:                                              │
│    ① Frontend: Ergebnis-Karte mit Standort + Preiszonen      │
│    ② Admin: Location-Editor mit Klick-Marker + Suche         │
│    ③ Admin: Lead-Detail (Standort des Leads)                 │
│    ④ Admin: Dashboard (alle Leads auf Karte, Cluster)        │
│    ⑤ PDF: Statisches Kartenbild                              │
│                                                              │
│  GEOCODING: Nominatim (OSM) als Standard                     │
│    → Nur im Admin (Location-Setup), wenige Calls             │
│    → Google Geocoding optional wenn Maps aktiv                │
│                                                              │
│  DSGVO:                                                      │
│    OSM = unproblematisch (EU/UK-Server)                      │
│    Google = Cookie-Consent-Platzhalter eingebaut              │
│                                                              │
│  TECH: react-leaflet (React), Leaflet.markercluster,         │
│        GeoJSON für Preiszonen, Provider-Abstraktion           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
