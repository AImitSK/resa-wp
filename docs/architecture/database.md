# Datenbank

## Überblick

RESA nutzt 10 Custom-Tabellen mit dem Prefix `{wp_prefix}resa_`. Schema-Verwaltung über `dbDelta()` in `includes/Database/Schema.php`. Aktuelle Schema-Version: **0.8.0**.

## Tabellen

### resa_leads

Zentrale Lead-Tabelle mit Two-Phase Capture (partial → complete).

| Spalte          | Typ                           | Beschreibung                                     |
| --------------- | ----------------------------- | ------------------------------------------------ |
| `id`            | BIGINT UNSIGNED PK            | Auto-Increment                                   |
| `session_id`    | VARCHAR(36) NOT NULL          | UUID für Session-Tracking                        |
| `asset_type`    | VARCHAR(50) NOT NULL          | Modul-Slug (z.B. 'rent-calculator')              |
| `location_id`   | BIGINT UNSIGNED NULL          | FK → resa_locations                              |
| `agent_id`      | BIGINT UNSIGNED NULL          | FK → resa_agents                                 |
| `status`        | VARCHAR(20) DEFAULT 'partial' | partial, new, contacted, qualified, closed, lost |
| `first_name`    | VARCHAR(100)                  |                                                  |
| `last_name`     | VARCHAR(100)                  |                                                  |
| `email`         | VARCHAR(255)                  |                                                  |
| `phone`         | VARCHAR(50)                   |                                                  |
| `company`       | VARCHAR(200)                  |                                                  |
| `salutation`    | VARCHAR(20)                   |                                                  |
| `message`       | TEXT                          |                                                  |
| `consent_given` | TINYINT(1) DEFAULT 0          | DSGVO-Einwilligung                               |
| `consent_text`  | TEXT                          | Einwilligungstext zum Zeitpunkt                  |
| `consent_date`  | DATETIME                      |                                                  |
| `inputs`        | LONGTEXT                      | JSON: Rechner-Eingaben                           |
| `result`        | LONGTEXT                      | JSON: Berechnungsergebnis                        |
| `meta`          | LONGTEXT                      | JSON: UTM, User-Agent, etc.                      |
| `notes`         | TEXT                          | Interne Notizen                                  |
| `gclid`         | VARCHAR(255)                  | Google Click ID                                  |
| `fbclid`        | VARCHAR(255)                  | Facebook Click ID                                |
| `pdf_sent`      | TINYINT(1) DEFAULT 0          |                                                  |
| `created_at`    | DATETIME                      |                                                  |
| `updated_at`    | DATETIME                      |                                                  |
| `completed_at`  | DATETIME                      |                                                  |
| `expires_at`    | DATETIME                      | TTL für Partial Leads                            |

Indexes: session_id, status, asset_type, location_id, agent_id, created_at, email(191), gclid(191), expires_at

### resa_tracking_daily

Tägliche Funnel-Aggregation pro Modul und Standort.

| Spalte            | Typ                  | Beschreibung         |
| ----------------- | -------------------- | -------------------- |
| `id`              | BIGINT UNSIGNED PK   |                      |
| `date`            | DATE                 |                      |
| `asset_type`      | VARCHAR(50)          | Modul-Slug           |
| `location_id`     | BIGINT UNSIGNED NULL |                      |
| `views`           | INT DEFAULT 0        | Widget-Aufrufe       |
| `starts`          | INT DEFAULT 0        | Rechner gestartet    |
| `form_views`      | INT DEFAULT 0        | Lead-Form gesehen    |
| `form_submits`    | INT DEFAULT 0        | Formular abgeschickt |
| `result_views`    | INT DEFAULT 0        | Ergebnis angezeigt   |
| `start_rate`      | DECIMAL(5,2)         | starts/views         |
| `completion_rate` | DECIMAL(5,2)         | form_submits/starts  |
| `conversion_rate` | DECIMAL(5,2)         | form_submits/views   |

UNIQUE KEY: (date, asset_type, location_id)

### resa_locations

Standorte mit Geodaten und modulspezifischen Faktoren.

| Spalte        | Typ                        | Beschreibung                    |
| ------------- | -------------------------- | ------------------------------- |
| `id`          | BIGINT UNSIGNED PK         |                                 |
| `slug`        | VARCHAR(100) UNIQUE        | URL-freundlich                  |
| `name`        | VARCHAR(255)               |                                 |
| `country`     | VARCHAR(10) DEFAULT 'DE'   |                                 |
| `bundesland`  | VARCHAR(100)               |                                 |
| `region_type` | VARCHAR(50) DEFAULT 'city' |                                 |
| `currency`    | VARCHAR(10) DEFAULT 'EUR'  |                                 |
| `latitude`    | DECIMAL(10,8)              | v0.4.0                          |
| `longitude`   | DECIMAL(11,8)              | v0.4.0                          |
| `zoom_level`  | TINYINT DEFAULT 13         | v0.4.0                          |
| `data`        | LONGTEXT                   | JSON: Zusatzdaten               |
| `factors`     | LONGTEXT                   | JSON: Modulspezifische Faktoren |
| `agent_id`    | BIGINT UNSIGNED            | Primärer Ansprechpartner        |
| `is_active`   | TINYINT(1) DEFAULT 1       |                                 |
| `created_at`  | DATETIME                   |                                 |
| `updated_at`  | DATETIME                   |                                 |

### resa_email_log

Protokoll aller versendeten E-Mails.

| Spalte          | Typ                        | Beschreibung       |
| --------------- | -------------------------- | ------------------ |
| `id`            | BIGINT UNSIGNED PK         |                    |
| `lead_id`       | BIGINT UNSIGNED            | FK → resa_leads    |
| `template_id`   | VARCHAR(50)                | Template-Schlüssel |
| `recipient`     | VARCHAR(255)               |                    |
| `subject`       | VARCHAR(255)               |                    |
| `status`        | VARCHAR(20) DEFAULT 'sent' |                    |
| `error_message` | TEXT                       |                    |
| `sent_at`       | DATETIME                   |                    |
| `opened_at`     | DATETIME                   |                    |
| `clicked_at`    | DATETIME                   |                    |

### resa_agents

Makler-Profile.

| Spalte        | Typ                  | Beschreibung            |
| ------------- | -------------------- | ----------------------- |
| `id`          | BIGINT UNSIGNED PK   |                         |
| `wp_user_id`  | BIGINT UNSIGNED      | WordPress User-Referenz |
| `name`        | VARCHAR(255)         |                         |
| `position`    | VARCHAR(100)         | v0.5.0                  |
| `email`       | VARCHAR(255)         |                         |
| `phone`       | VARCHAR(50)          |                         |
| `photo_url`   | VARCHAR(500)         |                         |
| `company`     | VARCHAR(200)         | v0.3.0                  |
| `address`     | TEXT                 | v0.3.0                  |
| `website`     | VARCHAR(500)         | v0.3.0                  |
| `imprint_url` | VARCHAR(500)         | v0.3.0                  |
| `is_active`   | TINYINT(1) DEFAULT 1 |                         |
| `created_at`  | DATETIME             |                         |

### resa_agent_locations

N:M-Zuordnung Agent ↔ Location.

| Spalte        | Typ                  |
| ------------- | -------------------- |
| `agent_id`    | BIGINT UNSIGNED (PK) |
| `location_id` | BIGINT UNSIGNED (PK) |

### resa_module_settings

Modulspezifische Einstellungen (Setup-Modus, Faktoren).

| Spalte            | Typ                               | Beschreibung                    |
| ----------------- | --------------------------------- | ------------------------------- |
| `id`              | BIGINT UNSIGNED PK                |                                 |
| `module_slug`     | VARCHAR(50) UNIQUE                |                                 |
| `setup_mode`      | VARCHAR(20) DEFAULT 'pauschal'    | pauschal oder standortbasiert   |
| `region_preset`   | VARCHAR(50) DEFAULT 'medium_city' |                                 |
| `factors`         | LONGTEXT                          | JSON: Berechnungsfaktoren       |
| `location_values` | LONGTEXT                          | JSON: Standortspezifische Werte |
| `created_at`      | DATETIME                          |                                 |
| `updated_at`      | DATETIME                          |                                 |

### resa_webhooks

Webhook-Konfigurationen (Premium, max 5).

| Spalte       | Typ                  | Beschreibung      |
| ------------ | -------------------- | ----------------- |
| `id`         | BIGINT UNSIGNED PK   |                   |
| `name`       | VARCHAR(100)         |                   |
| `url`        | VARCHAR(500)         | Ziel-URL          |
| `secret`     | VARCHAR(255)         | HMAC-Secret       |
| `events`     | LONGTEXT             | JSON: Event-Liste |
| `is_active`  | TINYINT(1) DEFAULT 1 |                   |
| `created_at` | DATETIME             |                   |
| `updated_at` | DATETIME             |                   |

### resa_api_keys

API-Schlüssel für externen Zugriff (Premium, max 5).

| Spalte         | Typ                  | Beschreibung      |
| -------------- | -------------------- | ----------------- |
| `id`           | BIGINT UNSIGNED PK   |                   |
| `name`         | VARCHAR(100)         |                   |
| `key_prefix`   | VARCHAR(13)          | Sichtbarer Prefix |
| `key_hash`     | VARCHAR(64) UNIQUE   | SHA-256 Hash      |
| `is_active`    | TINYINT(1) DEFAULT 1 |                   |
| `last_used_at` | DATETIME             |                   |
| `created_at`   | DATETIME             |                   |

### resa_messengers

Messenger-Integrationen (Slack, Teams, Discord). Premium, max 5.

| Spalte        | Typ                  | Beschreibung          |
| ------------- | -------------------- | --------------------- |
| `id`          | BIGINT UNSIGNED PK   |                       |
| `name`        | VARCHAR(100)         |                       |
| `platform`    | VARCHAR(20)          | slack, teams, discord |
| `webhook_url` | VARCHAR(500)         |                       |
| `is_active`   | TINYINT(1) DEFAULT 1 |                       |
| `created_at`  | DATETIME             |                       |
| `updated_at`  | DATETIME             |                       |

## Migrations

Schema-Versionen werden über `dbDelta()` verwaltet. Jede Version fügt Tabellen oder Spalten hinzu:

| Version | Änderungen                                                           |
| ------- | -------------------------------------------------------------------- |
| 0.1.0   | leads, tracking_daily, locations, email_log, agents, agent_locations |
| 0.2.0   | module_settings                                                      |
| 0.3.0   | agents: company, address, website, imprint_url                       |
| 0.4.0   | locations: latitude, longitude, zoom_level                           |
| 0.5.0   | agents: position                                                     |
| 0.6.0   | webhooks                                                             |
| 0.7.0   | api_keys                                                             |
| 0.8.0   | messengers                                                           |

## Beziehungen

```
leads.location_id    → locations.id
leads.agent_id       → agents.id
email_log.lead_id    → leads.id
agent_locations      → agents.id + locations.id (N:M)
locations.agent_id   → agents.id (primärer Agent)
```
