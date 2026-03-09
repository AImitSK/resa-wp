# Services

## EmailService (`includes/Services/Email/`)

Versendet E-Mails an Leads mit Template-Rendering und Logging.

### Transport-Kette

Versucht Transports in Reihenfolge:

1. **BrevoTransport** — Brevo API (wenn konfiguriert)
2. **SmtpTransport** — Custom SMTP (wenn konfiguriert, Premium)
3. **WpMailTransport** — WordPress `wp_mail()` (Fallback)

### API

```php
$emailService->send(
    int $leadId,
    string $template,     // Template-ID
    string $to,
    string $subject,
    string $html,
    array $options = []
): bool;

$emailService->detectTransport(): TransportInterface;
$emailService->getTransportInfo(): array;

// Statisch
EmailService::renderVariables(string $template, array $vars): string;
EmailService::wrapInLayout(string $bodyHtml): string;
```

### Events

- `resa_email_sent` — Nach erfolgreichem Versand
- `resa_email_failed` — Bei Fehler

---

## LeadPdfService (`includes/Services/Pdf/`)

Generiert PDF für einen Lead und versendet es per Email.

### API

```php
$pdfService->generateAndSend(int $leadId): bool;
```

### Details

- **Template-Map:** Asset-Typ → PDF-Template (z.B. `rent-calculator` → `rent-analysis`)
- **Speicherort:** `wp-content/uploads/resa-pdfs/` mit `.htaccess`-Schutz
- **Logo:** Wird automatisch zu Base64-Data-URI konvertiert
- **Karten:** Statische Karten via PHP GD + OSM Tiles (ohne Puppeteer möglich)

### PDF-Engines

| Engine        | Beschreibung                | Einschränkungen                                  |
| ------------- | --------------------------- | ------------------------------------------------ |
| **DOMPDF**    | Standard, rein PHP          | Kein Flexbox/Grid, eingeschränktes CSS           |
| **Puppeteer** | Empfohlen, via Node-Service | Benötigt Node-Container, volle CSS-Unterstützung |

Konfiguriert über `RESA_PDF_SERVICE_URL` Environment-Variable.

---

## TrackingService (`includes/Services/Tracking/`)

Zeichnet Funnel-Events auf und aggregiert sie täglich.

### Gültige Events

| Event           | Aggregiert als |
| --------------- | -------------- |
| `asset_view`    | views          |
| `asset_start`   | starts         |
| `step_complete` | —              |
| `step_back`     | —              |
| `form_view`     | form_views     |
| `form_interact` | —              |
| `form_submit`   | form_submits   |
| `result_view`   | result_views   |

### API

```php
// Statisch
TrackingService::record(string $event, string $assetType, int $locationId): bool;
TrackingService::isValidEvent(string $event): bool;
TrackingService::getFunnelData(string $dateFrom, string $dateTo, string $assetType, ?int $locationId): array;
TrackingService::getDailyBreakdown(string $dateFrom, string $dateTo, string $assetType): array;
TrackingService::recalculateRates(int $trackingId): bool;
```

### Raten

Werden automatisch berechnet:

- **Start Rate:** starts / views
- **Completion Rate:** form_submits / starts
- **Conversion Rate:** form_submits / views

---

## NominatimGeocoder (`includes/Services/Geocoding/`)

Geocoding via OpenStreetMap Nominatim API.

### API

```php
interface GeocoderInterface {
    public function search(string $query, array $options = []): array;
    public function isAvailable(): bool;
    public function getName(): string;
}
```

### Details

- **API:** `https://nominatim.openstreetmap.org/search` (format=jsonv2)
- **Länder:** DE, AT, CH (DACH-Region)
- **Rate-Limiting:** 1 Request/Sekunde via Transient `resa_nominatim_last_request`
- **Ergebnis:** `GeocodingResult[]` mit latitude, longitude, displayName, city, state, country, countryCode, postalCode
