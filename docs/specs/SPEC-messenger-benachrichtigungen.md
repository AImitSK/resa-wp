# SPEC: Messenger-Benachrichtigungen

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Integrationen-Seite → Messenger-Tab, Backend-Services, DB-Schema

## Zusammenfassung

Makler erhalten bei jedem neuen Lead eine sofortige Benachrichtigung in ihrem Messenger-Tool (Slack, Microsoft Teams oder Discord). Jede Plattform erhält eine nativ formatierte Nachricht (Block Kit, Adaptive Card bzw. Embed) mit Lead-Name, Kontaktdaten, Asset-Typ, Standort und Ergebnis. Die Implementierung folgt dem bewährten Webhooks-Muster (Model → Controller → Dispatcher → React-Tab).

**Premium-only** — FeatureGate `canUseMessenger()`.

## Betroffene Dateien

### Neue Dateien

- `includes/Models/Messenger.php` — CRUD-Model für `resa_messengers`-Tabelle
- `includes/Api/MessengersController.php` — Admin REST-Endpoints (CRUD + Test)
- `includes/Services/Integration/MessengerDispatcher.php` — Plattform-spezifische Payload-Formatierung + Versand
- `src/admin/components/integrations/MessengerTab.tsx` — UI-Komponente mit CRUD + Plattform-Auswahl
- `src/admin/hooks/useMessengers.ts` — React Query CRUD-Hooks

### Geänderte Dateien

- `includes/Database/Schema.php` — `resa_messengers`-Tabelle, VERSION → `0.8.0`
- `includes/Core/ErrorMessages.php` — 3 neue Error-Codes
- `includes/Freemius/FeatureGate.php` — `canUseMessenger()` + `toArray()`
- `includes/Core/Plugin.php` — Controller + Dispatcher registrieren
- `src/admin/types/index.ts` — MessengerConfig, MessengerFormData, FeatureGate-Erweiterung
- `src/admin/hooks/useFeatures.ts` — Default `can_use_messenger: false`
- `src/admin/pages/Integrations.tsx` — Placeholder durch MessengerTab ersetzen

## API-Änderungen

### Neue Endpoints

| Methode | Route                                 | Beschreibung                          | Auth  |
| ------- | ------------------------------------- | ------------------------------------- | ----- |
| GET     | `/resa/v1/admin/messengers`           | Alle Messenger-Verbindungen auflisten | Admin |
| POST    | `/resa/v1/admin/messengers`           | Neue Verbindung erstellen             | Admin |
| PUT     | `/resa/v1/admin/messengers/{id}`      | Verbindung aktualisieren              | Admin |
| DELETE  | `/resa/v1/admin/messengers/{id}`      | Verbindung löschen                    | Admin |
| POST    | `/resa/v1/admin/messengers/{id}/test` | Test-Nachricht senden                 | Admin |

## Datenbank-Änderungen

### Neue Tabellen

```sql
CREATE TABLE {$prefix}resa_messengers (
  id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  platform varchar(20) NOT NULL,
  webhook_url varchar(500) NOT NULL,
  is_active tinyint(1) NOT NULL DEFAULT 1,
  created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY idx_active (is_active)
) {$charset};
```

**Spalten:**

- `name` — Anzeigename (z.B. "Lead-Kanal Berlin")
- `platform` — Enum-artig: `slack`, `teams`, `discord`
- `webhook_url` — Incoming-Webhook-URL der jeweiligen Plattform
- `is_active` — Toggle zum schnellen Aktivieren/Deaktivieren

### Schema-Version

- `VERSION` → `'0.8.0'`
- Neue Migration: `migrateToV080()`

## Modul-Klassifizierung

| Eigenschaft    | Wert                                       |
| -------------- | ------------------------------------------ |
| **Typ**        | Kern-Feature (Integrationen)               |
| **Modul-Flag** | nicht zutreffend (Premium via FeatureGate) |
| **Modul-Slug** | nicht zutreffend                           |

## Free vs. Premium

| Feature-Aspekt          | Free                | Premium     |
| ----------------------- | ------------------- | ----------- |
| Messenger-Tab sichtbar  | Ja (Upgrade-Notice) | Ja          |
| Verbindungen erstellen  | Nein                | Ja (max. 5) |
| Test-Nachricht senden   | Nein                | Ja          |
| Lead-Benachrichtigungen | Nein                | Ja          |

## UI/UX

### Messenger-Tab (Admin → Integrationen → Messenger)

```
┌─────────────────────────────────────────────────────────────────┐
│  Messenger-Benachrichtigungen                            3/5    │
│  ────────────────────────────────────   [+ Verbindung hinzuf.] │
│                                                                 │
│  ┌─ Slack ─────────────────────────────────────────────────┐   │
│  │  Lead-Kanal Berlin          [Slack]  ● aktiv  ✎ ▶ 🗑   │   │
│  │  hooks.slack.com/services/T.../B...                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Vertrieb Süd               [Teams] ● aktiv  ✎ ▶ 🗑    │   │
│  │  *.webhook.office.com/webhookb2/...                      │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Discord Alerts             [Discord] ○ aus   ✎ ▶ 🗑   │   │
│  │  discord.com/api/webhooks/123/abc...                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Hinweis ────────────────────────────────────────────────┐   │
│  │  ℹ Nachrichten werden automatisch bei jedem neuen Lead   │   │
│  │    an alle aktiven Verbindungen gesendet.                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Einrichtungs-Hilfe ────────────────────────────────────┐   │
│  │  Webhook-URLs erstellen:                                 │   │
│  │  • Slack: Apps → Incoming Webhooks → Add to Slack        │   │
│  │  • Teams: Kanal → Connectors → Incoming Webhook          │   │
│  │  • Discord: Kanal-Einstellungen → Integrationen          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Leerer Zustand

```
┌─────────────────────────────────────────────────────────────────┐
│                    💬                                            │
│          Noch keine Messenger-Verbindungen                      │
│                                                                 │
│  Erhalten Sie sofortige Benachrichtigungen in Slack,            │
│  Microsoft Teams oder Discord, wenn ein neuer Lead eingeht.     │
│                                                                 │
│              [Erste Verbindung einrichten]                       │
└─────────────────────────────────────────────────────────────────┘
```

### Create/Edit-Dialog

```
┌─ Messenger-Verbindung erstellen ─────────────────────────────┐
│                                                               │
│  Plattform:                                                   │
│  ┌──────┐  ┌──────┐  ┌──────┐                               │
│  │ Slack │  │ Teams│  │Discord│  ← Toggle-Buttons            │
│  └──────┘  └──────┘  └──────┘                               │
│                                                               │
│  Name:                                                        │
│  [Lead-Benachrichtigungen                        ]            │
│                                                               │
│  Webhook-URL:                                                 │
│  [https://hooks.slack.com/services/...           ]            │
│  ℹ Slack → Apps → Incoming Webhooks → Add to Slack            │
│                                                               │
│  Aktiv:                                              [●]      │
│                                                               │
│                         [Abbrechen]  [Speichern]              │
└───────────────────────────────────────────────────────────────┘
```

### Test-Nachricht (Beispiel Slack)

```
┌─ Slack-Kanal ──────────────────────────────────────────────────┐
│                                                                 │
│  📋 Neuer Lead: Mietpreis-Kalkulator                           │
│  ─────────────────────────────────────                          │
│  Name:       Max Mustermann                                    │
│  E-Mail:     test@example.com                                  │
│  Telefon:    +49 170 1234567                                   │
│  Standort:   München, Bayern                                   │
│                                                                 │
│  Ergebnis: 18,50 €/m² | Gesamt: 1.572,50 €                   │
│  ─────────────────────────────────────                          │
│  🕐 04.03.2026, 14:32 · RESA                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementierungsdetails

### PHP: Messenger Model (`includes/Models/Messenger.php`)

Folgt dem `Webhook.php`-Muster. Statische Methoden:

```php
final class Messenger {
    public static function create(array $data): int|false;
    public static function findById(int $id): ?object;
    public static function getAll(): array;
    public static function getActive(): array;
    public static function update(int $id, array $data): bool;
    public static function delete(int $id): bool;
    public static function count(): int;
}
```

Keine Secrets — bei Slack/Teams/Discord steckt die Authentifizierung in der Webhook-URL.

### PHP: MessengerDispatcher (`includes/Services/Integration/MessengerDispatcher.php`)

Kernklasse, die Lead-Daten plattformspezifisch formatiert und versendet:

```php
final class MessengerDispatcher {
    // Hook-Callback für resa_lead_created
    public function onLeadCreated(int $leadId): void;

    // Versendet an alle aktiven Messenger
    public function dispatch(array $leadPayload): void;

    // Test-Nachricht an einzelnen Messenger
    public function sendTest(object $messenger): array;

    // Plattform-spezifische Payload-Builder
    private function buildSlackPayload(array $lead): array;
    private function buildTeamsPayload(array $lead): array;
    private function buildDiscordPayload(array $lead): array;

    // HTTP-Versand
    private function send(object $messenger, array $body): array;
}
```

**Plattform-spezifische Formate:**

**Slack (Block Kit):**

```json
{
	"text": "Neuer Lead: Max Mustermann via Mietpreis-Kalkulator",
	"blocks": [
		{
			"type": "header",
			"text": { "type": "plain_text", "text": "Neuer Lead: Mietpreis-Kalkulator" }
		},
		{
			"type": "section",
			"fields": [
				{ "type": "mrkdwn", "text": "*Name:*\nMax Mustermann" },
				{ "type": "mrkdwn", "text": "*E-Mail:*\ntest@example.com" },
				{ "type": "mrkdwn", "text": "*Telefon:*\n+49 170 1234567" },
				{ "type": "mrkdwn", "text": "*Standort:*\nMünchen, Bayern" }
			]
		},
		{
			"type": "section",
			"text": { "type": "mrkdwn", "text": "*Ergebnis:* 18,50 €/m² | Gesamt: 1.572,50 €" }
		},
		{
			"type": "context",
			"elements": [{ "type": "mrkdwn", "text": "🕐 04.03.2026, 14:32 · RESA" }]
		}
	]
}
```

**Microsoft Teams (Adaptive Card v1.4):**

```json
{
	"type": "message",
	"attachments": [
		{
			"contentType": "application/vnd.microsoft.card.adaptive",
			"content": {
				"$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
				"type": "AdaptiveCard",
				"version": "1.4",
				"body": [
					{
						"type": "TextBlock",
						"size": "Large",
						"weight": "Bolder",
						"text": "Neuer Lead: Mietpreis-Kalkulator"
					},
					{
						"type": "FactSet",
						"facts": [
							{ "title": "Name:", "value": "Max Mustermann" },
							{ "title": "E-Mail:", "value": "test@example.com" },
							{ "title": "Telefon:", "value": "+49 170 1234567" },
							{ "title": "Standort:", "value": "München, Bayern" },
							{ "title": "Ergebnis:", "value": "18,50 €/m² | Gesamt: 1.572,50 €" }
						]
					},
					{
						"type": "TextBlock",
						"size": "Small",
						"isSubtle": true,
						"text": "04.03.2026, 14:32 · RESA"
					}
				]
			}
		}
	]
}
```

**Discord (Embed):**

```json
{
	"username": "RESA",
	"embeds": [
		{
			"title": "Neuer Lead: Mietpreis-Kalkulator",
			"color": 3447003,
			"fields": [
				{ "name": "Name", "value": "Max Mustermann", "inline": true },
				{ "name": "E-Mail", "value": "test@example.com", "inline": true },
				{ "name": "Telefon", "value": "+49 170 1234567", "inline": true },
				{ "name": "Standort", "value": "München, Bayern", "inline": true },
				{ "name": "Ergebnis", "value": "18,50 €/m² | Gesamt: 1.572,50 €", "inline": false }
			],
			"footer": { "text": "RESA" },
			"timestamp": "2026-03-04T14:32:00Z"
		}
	]
}
```

### PHP: URL-Validierung pro Plattform

```php
private const URL_PATTERNS = [
    'slack'   => '#^https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[A-Za-z0-9]+$#',
    'teams'   => '#^https://[a-zA-Z0-9.-]+\.(webhook\.office\.com|logic\.azure\.com|api\.powerplatform\.com)[:/]#',
    'discord' => '#^https://(discord\.com|discordapp\.com)/api/webhooks/\d+/[A-Za-z0-9_-]+$#',
];
```

Der Controller validiert die URL nicht nur mit `filter_var(FILTER_VALIDATE_URL)`, sondern auch gegen das plattformspezifische Regex-Muster. So wird verhindert, dass z.B. eine Slack-URL als Teams-Verbindung gespeichert wird.

### PHP: MessengersController (`includes/Api/MessengersController.php`)

Folgt dem `WebhooksController`-Muster. Feature-Gate via `canUseMessenger()`.

| Route                              | Methode     | Beschreibung                                        |
| ---------------------------------- | ----------- | --------------------------------------------------- |
| `GET /admin/messengers`            | `index()`   | Alle Verbindungen auflisten                         |
| `POST /admin/messengers`           | `create()`  | Erstellen (Limit: 5, URL-Validierung pro Plattform) |
| `PUT /admin/messengers/{id}`       | `update()`  | Name, URL, isActive ändern                          |
| `DELETE /admin/messengers/{id}`    | `destroy()` | Verbindung löschen                                  |
| `POST /admin/messengers/{id}/test` | `test()`    | Test-Nachricht senden                               |

Response-Format:

```json
{
	"id": 1,
	"name": "Lead-Kanal Berlin",
	"platform": "slack",
	"webhookUrl": "https://hooks.slack.com/services/...",
	"isActive": true,
	"createdAt": "2026-03-04 14:00:00",
	"updatedAt": "2026-03-04 14:00:00"
}
```

### PHP: Plugin.php — Registrierung

1. Import `MessengersController` und `MessengerDispatcher`
2. In `registerRestRoutes()`: `new MessengersController()` ergänzen
3. In `boot()`: `MessengerDispatcher` auf `resa_lead_created` Action registrieren (analog zu WebhookDispatcher)

### TypeScript: Neue Types (`src/admin/types/index.ts`)

```ts
export type MessengerPlatform = 'slack' | 'teams' | 'discord';

export interface MessengerConfig {
	id: number;
	name: string;
	platform: MessengerPlatform;
	webhookUrl: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface MessengerFormData {
	name: string;
	platform: MessengerPlatform;
	webhookUrl: string;
	isActive: boolean;
}

export interface MessengerTestResult {
	success: boolean;
	statusCode?: number;
	error?: string;
}
```

FeatureGate-Erweiterung: `can_use_messenger: boolean;`

### TypeScript: React Query Hooks (`src/admin/hooks/useMessengers.ts`)

Muster: `useWebhooks.ts`. Query-Key: `['messengers']`.

- `useMessengers()` — GET Liste
- `useCreateMessenger()` — POST
- `useUpdateMessenger()` — PUT
- `useDeleteMessenger()` — DELETE
- `useTestMessenger()` — POST Test

### React: MessengerTab (`src/admin/components/integrations/MessengerTab.tsx`)

**Struktur:**

```
MessengerTab
├── Feedback Alert (success/error)
├── Card: Verbindungs-Management
│   ├── Header: Titel + Badge (count/5) + "Hinzufügen" Button
│   ├── Empty State (MessageSquare Icon + CTA)
│   └── Verbindungs-Liste (Separator-basiert)
│       └── Pro Zeile:
│           ├── Name + Platform-Badge (farbig)
│           ├── URL (truncated)
│           └── Actions: Switch + Edit + Test + Delete
├── Card: Einrichtungs-Hilfe
│   └── Pro Plattform: Anleitung (3 Schritte)
└── Create/Edit Dialog
    ├── Plattform-Auswahl (3 Toggle-Buttons)
    ├── Name Input
    ├── Webhook-URL Input (mit plattformspezifischem Placeholder + Hilfetext)
    └── Aktiv Switch
```

**Plattform-Badges:**

- Slack: `variant="outline"` mit lila Akzent
- Teams: `variant="outline"` mit blau Akzent
- Discord: `variant="outline"` mit indigo Akzent

**URL-Platzhalter pro Plattform:**

- Slack: `https://hooks.slack.com/services/T.../B.../xxx`
- Teams: `https://xxx.webhook.office.com/webhookb2/...`
- Discord: `https://discord.com/api/webhooks/123/abc...`

**Hilfetexte pro Plattform:**

- Slack: "Apps & Integrationen → Incoming Webhooks → Add to Slack"
- Teams: "Kanal → ⋯ → Connectors → Incoming Webhook konfigurieren"
- Discord: "Kanal-Einstellungen → Integrationen → Webhooks → Neuer Webhook"

## Error-Codes

```php
public const MESSENGER_NOT_FOUND   = 'resa_messenger_not_found';
public const MESSENGER_LIMIT       = 'resa_messenger_limit';
public const MESSENGER_INVALID_URL = 'resa_messenger_invalid_url';

// Übersetzungen:
self::MESSENGER_NOT_FOUND   => __( 'Messenger-Verbindung nicht gefunden.', 'resa' ),
self::MESSENGER_LIMIT       => __( 'Maximal 5 Messenger-Verbindungen erlaubt.', 'resa' ),
self::MESSENGER_INVALID_URL => __( 'Ungültige Webhook-URL für die gewählte Plattform.', 'resa' ),
```

## Akzeptanzkriterien

- [ ] Slack-Verbindung erstellen → Test senden → Nachricht in Slack-Kanal mit Block Kit
- [ ] Teams-Verbindung erstellen → Test senden → Adaptive Card in Teams-Kanal
- [ ] Discord-Verbindung erstellen → Test senden → Embed in Discord-Kanal
- [ ] Ungültige URL (z.B. Slack-URL als Teams gespeichert) → Validierungsfehler 400
- [ ] Max. 5 Verbindungen → 6. Versuch gibt Limit-Fehler
- [ ] Verbindung deaktivieren → Lead-Benachrichtigung wird nicht gesendet
- [ ] Verbindung aktivieren → Lead-Benachrichtigung wird gesendet
- [ ] Neuer Lead → alle aktiven Messenger erhalten Benachrichtigung
- [ ] Free-User → Upgrade-Notice statt Tab-Inhalt (wird auf Page-Level behandelt)
- [ ] Verbindung löschen → bestätigte Löschung, Feedback
- [ ] Test-Nachricht → Feedback mit HTTP-Statuscode oder Fehlermeldung
- [ ] Leerer Zustand → CTA "Erste Verbindung einrichten"

## Security-Überlegungen

- **Webhook-URLs enthalten Secrets** — URLs werden in der DB gespeichert und nur an Admins (`manage_options`) über die API zurückgegeben
- **URL-Validierung** — Plattformspezifisches Regex + `filter_var(FILTER_VALIDATE_URL)` + `esc_url_raw()` bei Speicherung
- **Kein Credential-Leak** — URLs werden im Frontend nur gekürzt angezeigt (truncated), nie in Logs geschrieben
- **Sanitization** — `sanitize_text_field()` für Name, `esc_url_raw()` für URL
- **Permission** — Alle Endpoints erfordern `manage_options` (Admin-only)
- **Feature Gate** — `canUseMessenger()` check vor jeder Operation
- **Timeout** — `wp_remote_post()` mit 5s Timeout (kein Blockieren bei Down-Plattformen)

## Testplan

### PHP Unit Tests (`tests/php/Unit/Models/MessengerTest.php`)

- `test_create_speichert_messenger_in_db`
- `test_create_sanitized_name`
- `test_findById_gibt_null_fuer_unbekannte_id`
- `test_getAll_gibt_leeres_array`
- `test_getActive_filtert_inaktive`
- `test_update_aendert_felder`
- `test_delete_entfernt_zeile`
- `test_count_zaehlt_korrekt`

### PHP Unit Tests (`tests/php/Unit/Services/MessengerDispatcherTest.php`)

- `test_buildSlackPayload_hat_blocks_und_text`
- `test_buildTeamsPayload_hat_adaptive_card`
- `test_buildDiscordPayload_hat_embeds`
- `test_dispatch_sendet_nur_an_aktive`
- `test_dispatch_ueberspringt_inaktive`
- `test_sendTest_gibt_success_zurueck`
- `test_send_gibt_fehler_bei_timeout`

### PHP Unit Tests (`tests/php/Unit/Api/MessengersControllerTest.php`)

- `test_registerRoutes_registriert_alle_endpoints`
- `test_create_validiert_plattform_url`
- `test_create_lehnt_falsche_plattform_url_ab`
- `test_create_limitiert_auf_5`

### JS Unit Tests (`tests/js/unit/hooks/useMessengers.test.tsx`)

- Query-Key korrekt
- Mutations invalidieren Cache

## Offene Fragen

_Keine — alle drei Plattformen (Slack, Teams, Discord) verwenden Incoming Webhooks mit URL-basierter Auth, kein OAuth nötig._

## Abhängigkeiten

- Webhooks-Feature muss implementiert sein (✅ erledigt — Commit `22bf324`)
- `resa_lead_created` Action-Hook muss existieren (✅ wird bereits vom WebhookDispatcher genutzt)
- Schema-Migrationslogik muss funktionieren (✅ Version 0.7.0 aktiv)

## Implementierungsreihenfolge

```
Batch 1 (Backend-Kern):
  1. Schema.php          — DB-Tabelle v0.8.0
  2. ErrorMessages.php   — 3 Error-Codes
  3. FeatureGate.php     — canUseMessenger()
  4. Messenger.php       — CRUD-Model

Batch 2 (Backend-Logik):
  5. MessengerDispatcher.php    — Plattform-Payloads + Versand
  6. MessengersController.php   — Admin REST-Endpoints
  7. Plugin.php                 — Registrierung

Batch 3 (Frontend):
  8. types/index.ts     — Interfaces
  9. useFeatures.ts     — Default
  10. useMessengers.ts   — React Query Hooks
  11. MessengerTab.tsx   — UI-Komponente
  12. Integrations.tsx   — Placeholder ersetzen

Batch 4 (Tests):
  13. MessengerTest.php
  14. MessengerDispatcherTest.php
  15. MessengersControllerTest.php
```
