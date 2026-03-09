# REST API

Alle Endpunkte unter `/wp-json/resa/v1/`. Admin-Endpunkte erfordern WordPress-Nonce + `manage_options` Capability.

## Public Endpoints (kein Auth)

### Leads

| Method | Endpoint          | Beschreibung                                                                  |
| ------ | ----------------- | ----------------------------------------------------------------------------- |
| POST   | `/leads/partial`  | Phase 1: Partial Lead erstellen (sessionId, assetType, inputs, gclid, fbclid) |
| POST   | `/leads/complete` | Phase 2: Lead vervollständigen (sessionId, firstName, email, consent)         |

### Tracking

| Method | Endpoint    | Beschreibung                                                             |
| ------ | ----------- | ------------------------------------------------------------------------ |
| POST   | `/tracking` | Funnel-Event aufzeichnen (event, assetType, locationId, sessionId, step) |

### Locations

| Method | Endpoint          | Beschreibung                                           |
| ------ | ----------------- | ------------------------------------------------------ |
| GET    | `/locations`      | Aktive Standorte (id, slug, name, lat, lng, zoomLevel) |
| GET    | `/locations/{id}` | Einzelner Standort                                     |

### Geocoding

| Method | Endpoint            | Beschreibung                                     |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/geocoding/search` | Nominatim-Suche (query, viewbox, bounded, limit) |

### Module

| Method | Endpoint                    | Beschreibung                        |
| ------ | --------------------------- | ----------------------------------- |
| GET    | `/modules/{slug}/config`    | Frontend-Konfiguration eines Moduls |
| POST   | `/modules/{slug}/calculate` | Berechnung ausführen                |

### Health

| Method | Endpoint  | Beschreibung                 |
| ------ | --------- | ---------------------------- |
| GET    | `/health` | Status, Plugin-Name, Version |

## Admin Endpoints (Nonce + manage_options)

### Leads

| Method | Endpoint                   | Beschreibung                                                                              |
| ------ | -------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/admin/leads`             | Liste mit Filtern (status, assetType, locationId, search, dateFrom/dateTo, page, perPage) |
| GET    | `/admin/leads/stats`       | Lead-Statistiken                                                                          |
| GET    | `/admin/leads/export`      | CSV-Export (UTF-8 BOM) — Premium                                                          |
| GET    | `/admin/leads/{id}`        | Einzelner Lead                                                                            |
| PUT    | `/admin/leads/{id}`        | Update (status, notes, agentId)                                                           |
| DELETE | `/admin/leads/{id}`        | Löschen                                                                                   |
| GET    | `/admin/leads/{id}/emails` | Email-Log für Lead                                                                        |

### Locations

| Method | Endpoint                | Beschreibung                               |
| ------ | ----------------------- | ------------------------------------------ |
| GET    | `/admin/locations`      | Vollständige Standort-Daten inkl. Faktoren |
| POST   | `/admin/locations`      | Erstellen (FeatureGate Limit-Check)        |
| PUT    | `/admin/locations/{id}` | Aktualisieren                              |
| DELETE | `/admin/locations/{id}` | Löschen                                    |

### Module

| Method | Endpoint                       | Beschreibung                                |
| ------ | ------------------------------ | ------------------------------------------- |
| GET    | `/admin/modules`               | Alle Module aus Registry                    |
| POST   | `/admin/modules/{slug}/toggle` | Aktivieren/Deaktivieren (FeatureGate-Check) |

### Module Settings

| Method | Endpoint                                                 | Beschreibung                                                                |
| ------ | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| GET    | `/admin/modules/{slug}/settings`                         | Modul-Einstellungen laden                                                   |
| PUT    | `/admin/modules/{slug}/settings`                         | setup_mode, region_preset, factors, location_values                         |
| GET    | `/admin/modules/{slug}/presets`                          | Voreinstellungen                                                            |
| GET    | `/admin/modules/{slug}/pdf-settings`                     | PDF-Einstellungen                                                           |
| PUT    | `/admin/modules/{slug}/pdf-settings`                     | showChart, showFactors, showMap, showCta, showDisclaimer, ctaTitle, ctaText |
| PUT    | `/admin/modules/{slug}/settings/locations/{location_id}` | Standort-spezifischen Wert setzen                                           |
| DELETE | `/admin/modules/{slug}/settings/locations/{location_id}` | Standort-Wert löschen                                                       |

### Agents

| Method | Endpoint             | Beschreibung                                                              |
| ------ | -------------------- | ------------------------------------------------------------------------- |
| GET    | `/admin/agent`       | Primärer Agent                                                            |
| PUT    | `/admin/agent`       | Primären Agent aktualisieren                                              |
| GET    | `/admin/agents`      | Alle Agenten mit locationIds                                              |
| POST   | `/admin/agents`      | Agent erstellen                                                           |
| PUT    | `/admin/agents/{id}` | Agent aktualisieren (name, position, email, phone, photoUrl, locationIds) |
| DELETE | `/admin/agents/{id}` | Agent löschen                                                             |

### Analytics

| Method | Endpoint            | Beschreibung                                           |
| ------ | ------------------- | ------------------------------------------------------ |
| GET    | `/analytics/funnel` | Funnel-Daten (dateFrom, dateTo, assetType, locationId) |

### Email Templates

| Method | Endpoint                              | Beschreibung                      |
| ------ | ------------------------------------- | --------------------------------- |
| GET    | `/admin/email-templates`              | Alle Templates                    |
| GET    | `/admin/email-templates/{id}`         | Einzelnes Template                |
| PUT    | `/admin/email-templates/{id}`         | Update (subject, body, is_active) |
| POST   | `/admin/email-templates/{id}/reset`   | Auf Standard zurücksetzen         |
| POST   | `/admin/email-templates/{id}/test`    | Test-Mail senden                  |
| POST   | `/admin/email-templates/{id}/preview` | Rendered HTML                     |

### Einstellungen

| Method  | Endpoint                    | Beschreibung                                    |
| ------- | --------------------------- | ----------------------------------------------- |
| GET/PUT | `/admin/branding`           | Logo, Farben, Powered-By                        |
| GET/PUT | `/admin/pdf/settings`       | PDF-Layout (Header, Footer, Margins, Logo)      |
| GET/PUT | `/admin/privacy-settings`   | DSGVO (Consent-Text, Retention, Anonymisierung) |
| GET/PUT | `/admin/recaptcha-settings` | reCAPTCHA v3 (Site Key, Secret, Threshold)      |
| GET/PUT | `/admin/tracking-settings`  | Tracking (Funnel, DataLayer, Google Ads, UTM)   |
| GET/PUT | `/admin/map-settings`       | Karten (Provider, Style, Zoom, Google API Key)  |

### Webhooks (Premium, max 5)

| Method | Endpoint                    | Beschreibung                                    |
| ------ | --------------------------- | ----------------------------------------------- |
| GET    | `/admin/webhooks`           | Liste                                           |
| POST   | `/admin/webhooks`           | Erstellen (name, url, events, isActive, secret) |
| PUT    | `/admin/webhooks/{id}`      | Aktualisieren                                   |
| DELETE | `/admin/webhooks/{id}`      | Löschen                                         |
| POST   | `/admin/webhooks/{id}/test` | Test-Payload senden                             |

### Messengers (Premium, max 5)

Plattformen: `slack`, `teams`, `discord`

| Method | Endpoint                      | Beschreibung   |
| ------ | ----------------------------- | -------------- |
| GET    | `/admin/messengers`           | Liste          |
| POST   | `/admin/messengers`           | Erstellen      |
| PUT    | `/admin/messengers/{id}`      | Aktualisieren  |
| DELETE | `/admin/messengers/{id}`      | Löschen        |
| POST   | `/admin/messengers/{id}/test` | Test-Nachricht |

### API Keys (Premium, max 5)

| Method | Endpoint               | Beschreibung                                      |
| ------ | ---------------------- | ------------------------------------------------- |
| GET    | `/admin/api-keys`      | Liste                                             |
| POST   | `/admin/api-keys`      | Erstellen (plain Key nur beim Erstellen sichtbar) |
| PUT    | `/admin/api-keys/{id}` | Update (name, isActive)                           |
| DELETE | `/admin/api-keys/{id}` | Löschen                                           |

## External API (Bearer Token)

Für externen Zugriff via API-Key (Header: `Authorization: Bearer resa_...`).

| Method | Endpoint               | Beschreibung                                            |
| ------ | ---------------------- | ------------------------------------------------------- |
| GET    | `/external/leads`      | Leads (page, perPage, status, assetType) — ohne partial |
| GET    | `/external/leads/{id}` | Lead-Detail (ohne notes/meta/consent_text)              |
| GET    | `/external/locations`  | Aktive Standorte                                        |

## Auth-Muster

**Public:** Kein Auth, Rate-Limiting über WordPress-Nonce.

**Admin:** WordPress-Nonce (`X-WP-Nonce` Header) + `current_user_can('manage_options')`.

**External:** API-Key als Bearer Token. Key wird gehasht (SHA-256) in `resa_api_keys` gespeichert.
