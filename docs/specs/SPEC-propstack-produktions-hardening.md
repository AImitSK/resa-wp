# SPEC: Propstack Produktions-Hardening

**Status:** Entwurf
**Erstellt:** 2026-03-06
**Betrifft:** Propstack Add-on, Lead-Verwaltung, DSGVO-Compliance, Sync-Zuverlässigkeit

## Zusammenfassung

Das Propstack Add-on ist funktional (MVP-ready), aber für den Produktivbetrieb fehlen drei kritische Features: (1) Sync-Status-Anzeige in der Lead-Liste, (2) DSGVO-Consent-Check vor dem Sync, und (3) Retry-Queue für fehlgeschlagene Syncs. Diese Spec beschreibt die Implementierung dieser drei Produktions-Hardening-Maßnahmen.

## Ist-Zustand

| Komponente                    | Status       | Datei                                  |
| ----------------------------- | ------------ | -------------------------------------- |
| API-Integration               | ✅ Fertig    | `PropstackService.php`                 |
| Lead-Sync bei Erstellung      | ✅ Fertig    | `PropstackSync.php:onLeadCreated()`    |
| Duplikat-Erkennung (E-Mail)   | ✅ Fertig    | `PropstackSync.php:syncLead()`         |
| Makler-Zuweisung              | ✅ Fertig    | `PropstackSync.php:resolveBroker()`    |
| Aktivitäten/Tasks             | ✅ Fertig    | `PropstackSync.php:createActivity()`   |
| Settings UI                   | ✅ Fertig    | `PropstackTab.tsx`                     |
| Manual Re-sync API            | ✅ Fertig    | `PropstackController.php:manualSync()` |
| useManualPropstackSync Hook   | ✅ Fertig    | `usePropstack.ts`                      |
| **Sync-Status in Lead-Liste** | ❌ **Fehlt** | —                                      |
| **DSGVO-Check vor Sync**      | ❌ **Fehlt** | —                                      |
| **Retry-Queue**               | ❌ **Fehlt** | —                                      |

### Lücken im Ist-Zustand

| Lücke                     | Risiko                                                     |
| ------------------------- | ---------------------------------------------------------- |
| Kein Sync-Status sichtbar | Admin kann nicht erkennen welche Leads synchronisiert sind |
| Kein DSGVO-Check          | Leads ohne Consent werden an CRM übertragen (Rechtsrisiko) |
| Kein Retry bei Fehlern    | Fehlgeschlagene Syncs gehen verloren, manuelle Nacharbeit  |

### Vorhandene DB-Spalten (bereits implementiert)

Die `resa_leads`-Tabelle hat bereits die nötigen Spalten:

| Spalte                | Typ           | Beschreibung                  |
| --------------------- | ------------- | ----------------------------- |
| `propstack_id`        | INT NULL      | Propstack Contact ID          |
| `propstack_synced`    | TINYINT(1)    | 1=erfolgreich, 0=Fehler       |
| `propstack_error`     | TEXT NULL     | Fehlermeldung bei Sync-Fehler |
| `propstack_synced_at` | DATETIME NULL | Timestamp des letzten Syncs   |

## Betroffene Dateien

### Neue Dateien

| Datei                                           | Beschreibung                          |
| ----------------------------------------------- | ------------------------------------- |
| `addons/resa-propstack/includes/RetryQueue.php` | Retry-Queue für fehlgeschlagene Syncs |

### Geänderte Dateien

| Datei                                                    | Änderung                                        |
| -------------------------------------------------------- | ----------------------------------------------- |
| `addons/resa-propstack/includes/PropstackSync.php`       | DSGVO-Check hinzufügen, Retry-Queue integrieren |
| `addons/resa-propstack/includes/PropstackController.php` | Retry-Endpoint hinzufügen                       |
| `addons/resa-propstack/includes/Plugin.php`              | WP-Cron für Retry-Queue registrieren            |
| `src/admin/pages/Leads.tsx`                              | Sync-Status-Spalte + Re-sync Button             |
| `src/admin/hooks/useLeads.ts`                            | Propstack-Felder im Lead-Type ergänzen          |
| `includes/Api/LeadsController.php`                       | Propstack-Felder in Response aufnehmen          |

## API-Änderungen

### Geänderte Endpoints

| Methode | Route                       | Änderung                               |
| ------- | --------------------------- | -------------------------------------- |
| GET     | `/resa/v1/admin/leads`      | Propstack-Felder in Response aufnehmen |
| GET     | `/resa/v1/admin/leads/{id}` | Propstack-Felder in Response aufnehmen |

### Neue Endpoints

| Methode | Route                                | Beschreibung                              | Auth  |
| ------- | ------------------------------------ | ----------------------------------------- | ----- |
| POST    | `/resa/v1/admin/propstack/retry-all` | Alle fehlgeschlagenen Leads erneut syncen | Admin |

## Datenbank-Änderungen

### Neue Tabellen

Keine. Die bestehenden `resa_leads`-Spalten reichen aus. Retry-Queue nutzt die `propstack_synced = 0` + `propstack_error IS NOT NULL` Kombination als Filter.

### Neue wp_options

| Option                       | Typ | Default | Beschreibung                       |
| ---------------------------- | --- | ------- | ---------------------------------- |
| `resa_propstack_retry_count` | INT | 0       | Zähler für Retry-Versuche pro Lead |

## Modul-Klassifizierung

| Eigenschaft    | Wert               |
| -------------- | ------------------ |
| **Typ**        | Integration Add-on |
| **Modul-Flag** | nicht zutreffend   |
| **Modul-Slug** | resa-propstack     |

## Free vs. Premium

| Feature-Aspekt | Free | Pro | Add-on           |
| -------------- | ---- | --- | ---------------- |
| Propstack-Sync | —    | —   | Propstack Add-on |
| Sync-Status UI | —    | —   | Propstack Add-on |
| DSGVO-Check    | —    | —   | Propstack Add-on |
| Retry-Queue    | —    | —   | Propstack Add-on |

Alle Features sind Teil des Propstack Add-ons (kostenpflichtig, erfordert RESA Premium).

---

## Feature 1: Sync-Status UI in Lead-Liste

### Beschreibung

Eine neue Spalte "CRM" in der Lead-Tabelle zeigt den Propstack-Sync-Status:

- ✅ Grünes Häkchen = Erfolgreich synchronisiert
- ❌ Rotes X = Sync fehlgeschlagen (Tooltip mit Fehler)
- ⏳ Grau = Noch nicht synchronisiert
- — = Propstack Add-on nicht aktiv

### UI/UX

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Leads                                                    [Export] [+]   │
├─────────────────────────────────────────────────────────────────────────┤
│ [Alle] [Neu] [Kontaktiert] [Qualifiziert] [Abgeschlossen] [Verloren]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ☐ │ Name          │ E-Mail           │ Modul      │ CRM │ Status │ ... │
├───┼───────────────┼──────────────────┼────────────┼─────┼────────┼─────┤
│ ☐ │ Max Mustermann│ max@example.com  │ Mietpreis  │ ✅  │ Neu    │ ... │
│ ☐ │ Erika Müller  │ erika@test.de    │ Mietpreis  │ ❌  │ Neu    │ ... │  ← Hover zeigt Tooltip mit Fehler
│ ☐ │ Test User     │ test@test.de     │ Immowert   │ ⏳  │ Neu    │ ... │
└───┴───────────────┴──────────────────┴────────────┴─────┴────────┴─────┘
```

**Row Actions erweitern:**

Bei Leads mit `propstack_synced = 0` (Fehler) erscheint im Dropdown ein "Erneut synchronisieren"-Button.

### TypeScript-Änderungen

```typescript
// src/admin/hooks/useLeads.ts - LeadAdmin Interface erweitern
export interface LeadAdmin {
	// ... bestehende Felder ...
	propstack_id: number | null;
	propstack_synced: boolean | null;
	propstack_error: string | null;
	propstack_synced_at: string | null;
}
```

### PHP-Änderungen

```php
// includes/Api/LeadsController.php - Response erweitern
private function formatLead(object $lead): array {
    return [
        // ... bestehende Felder ...
        'propstack_id' => $lead->propstack_id ?? null,
        'propstack_synced' => isset($lead->propstack_synced) ? (bool) $lead->propstack_synced : null,
        'propstack_error' => $lead->propstack_error ?? null,
        'propstack_synced_at' => $lead->propstack_synced_at ?? null,
    ];
}
```

### React-Komponente

```tsx
// In Leads.tsx - Neue Spalte
function PropstackStatusCell({ lead }: { lead: LeadAdmin }) {
	// Prüfen ob Propstack Add-on aktiv (über window.resaAdmin.integrationTabs)
	const isPropstackActive = window.resaAdmin.integrationTabs.some(
		(tab) => tab.slug === 'propstack',
	);

	if (!isPropstackActive) {
		return <span className="text-muted-foreground">—</span>;
	}

	if (lead.propstack_synced === true) {
		return (
			<Tooltip content={`Synchronisiert: ${formatDateTime(lead.propstack_synced_at!)}`}>
				<CheckCircle2 className="h-4 w-4 text-green-600" />
			</Tooltip>
		);
	}

	if (lead.propstack_synced === false && lead.propstack_error) {
		return (
			<Tooltip content={lead.propstack_error}>
				<XCircle className="h-4 w-4 text-red-600" />
			</Tooltip>
		);
	}

	return <Clock className="h-4 w-4 text-muted-foreground" />;
}
```

---

## Feature 2: DSGVO-Consent-Check vor Sync

### Beschreibung

Vor dem Sync zu Propstack MUSS geprüft werden, ob der Lead einen gültigen DSGVO-Consent gegeben hat (`consent_given = 1`). Ohne Consent darf kein Datentransfer zu externen CRMs erfolgen.

### PHP-Implementierung

```php
// addons/resa-propstack/includes/PropstackSync.php

public function onLeadCreated(int $leadId): void {
    // ... bestehender Code ...

    if (!$lead || empty($lead->email)) {
        return;
    }

    // NEU: DSGVO-Consent prüfen
    if (empty($lead->consent_given)) {
        $this->markSkipped($leadId, __('Kein DSGVO-Consent vorhanden.', 'resa-propstack'));
        return;
    }

    // Skip if already synced
    if (!empty($lead->propstack_synced)) {
        return;
    }

    $this->syncLead($lead);
}

/**
 * Mark lead as skipped (no consent)
 */
private function markSkipped(int $leadId, string $reason): void {
    global $wpdb;
    $table = $wpdb->prefix . 'resa_leads';

    $wpdb->update(
        $table,
        [
            'propstack_synced' => 0,
            'propstack_error'  => $reason,
        ],
        ['id' => $leadId],
        ['%d', '%s'],
        ['%d']
    );

    error_log(sprintf(
        '[RESA Propstack] Sync skipped for lead #%d: %s',
        $leadId,
        $reason
    ));
}
```

### Besondere Fälle

1. **Newsletter-Only Mode:** Wenn `sync_newsletter_only = true`, wird nur bei `consent_given = 1` (Newsletter-Consent) synchronisiert — bereits korrekt.

2. **Nachträglicher Consent:** Wenn ein Lead initial keinen Consent hatte und später zustimmt, kann über "Erneut synchronisieren" manuell getriggert werden.

3. **Fehlermeldung im UI:** "Kein DSGVO-Consent vorhanden." wird im Tooltip der ❌-Markierung angezeigt.

---

## Feature 3: Retry-Queue für fehlgeschlagene Syncs

### Beschreibung

Fehlgeschlagene Syncs (API-Timeout, Rate-Limit, temporäre Fehler) werden automatisch erneut versucht. Ein WP-Cron-Job läuft alle 15 Minuten und versucht fehlgeschlagene Syncs bis zu 3 Mal.

### Retry-Logik

1. **Filter:** `propstack_synced = 0 AND propstack_error IS NOT NULL AND consent_given = 1`
2. **Max Retries:** 3 Versuche pro Lead (in Meta-Feld `_propstack_retry_count`)
3. **Exponential Backoff:** 15min → 1h → 4h zwischen Versuchen
4. **Permanente Fehler:** DSGVO-Skip und ähnliche werden nicht erneut versucht

### PHP-Implementierung

```php
// addons/resa-propstack/includes/RetryQueue.php

namespace Resa\Propstack;

class RetryQueue {
    private const MAX_RETRIES = 3;
    private const BATCH_SIZE = 10;
    private const RETRY_INTERVALS = [900, 3600, 14400]; // 15min, 1h, 4h

    /**
     * Register WP-Cron hook
     */
    public static function register(): void {
        add_action('resa_propstack_retry_queue', [self::class, 'processQueue']);

        if (!wp_next_scheduled('resa_propstack_retry_queue')) {
            wp_schedule_event(time(), 'fifteen_minutes', 'resa_propstack_retry_queue');
        }
    }

    /**
     * Process retry queue (called by WP-Cron)
     */
    public static function processQueue(): void {
        if (!PropstackSettings::isEnabled()) {
            return;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'resa_leads';

        // Permanente Fehler ausschließen (DSGVO, etc.)
        $permanentErrors = [
            __('Kein DSGVO-Consent vorhanden.', 'resa-propstack'),
            __('Kein Makler konfiguriert.', 'resa-propstack'),
        ];
        $excludeClause = implode(' AND ', array_map(
            fn($e) => $wpdb->prepare("propstack_error != %s", $e),
            $permanentErrors
        ));

        // Leads mit fehlgeschlagenem Sync und Consent
        $leads = $wpdb->get_results(
            "SELECT * FROM {$table}
             WHERE propstack_synced = 0
               AND propstack_error IS NOT NULL
               AND consent_given = 1
               AND {$excludeClause}
             ORDER BY updated_at ASC
             LIMIT " . self::BATCH_SIZE
        );

        if (empty($leads)) {
            return;
        }

        $sync = new PropstackSync();

        foreach ($leads as $lead) {
            $retryCount = (int) get_post_meta($lead->id, '_propstack_retry_count', true);

            if ($retryCount >= self::MAX_RETRIES) {
                continue; // Max retries erreicht
            }

            // Exponential Backoff prüfen
            $lastAttempt = strtotime($lead->updated_at);
            $waitTime = self::RETRY_INTERVALS[$retryCount] ?? self::RETRY_INTERVALS[2];

            if (time() - $lastAttempt < $waitTime) {
                continue; // Noch nicht Zeit für Retry
            }

            // Retry durchführen
            update_post_meta($lead->id, '_propstack_retry_count', $retryCount + 1);
            $sync->retrySync($lead);
        }
    }

    /**
     * Reset retry count after successful sync
     */
    public static function resetRetryCount(int $leadId): void {
        delete_post_meta($leadId, '_propstack_retry_count');
    }

    /**
     * Get retry status for a lead
     */
    public static function getRetryStatus(int $leadId): array {
        $count = (int) get_post_meta($leadId, '_propstack_retry_count', true);
        return [
            'attempts' => $count,
            'max_attempts' => self::MAX_RETRIES,
            'exhausted' => $count >= self::MAX_RETRIES,
        ];
    }
}
```

### PropstackSync erweitern

```php
// addons/resa-propstack/includes/PropstackSync.php

/**
 * Retry sync for a lead (used by RetryQueue)
 */
public function retrySync(object $lead): void {
    // DSGVO-Check erneut
    if (empty($lead->consent_given)) {
        return;
    }

    // Reset synced flag für erneuten Versuch
    global $wpdb;
    $wpdb->update(
        $wpdb->prefix . 'resa_leads',
        ['propstack_synced' => null, 'propstack_error' => null],
        ['id' => $lead->id],
        ['%s', '%s'],
        ['%d']
    );

    $this->syncLead($lead);
}
```

### Nach erfolgreichem Sync

```php
// In markSynced() ergänzen
private function markSynced(int $leadId, int $propstackId): void {
    // ... bestehender Code ...

    // Retry-Counter zurücksetzen
    RetryQueue::resetRetryCount($leadId);
}
```

### Admin UI: Retry-All Button

```tsx
// Optional: Button in PropstackTab.tsx
<Button
	variant="outline"
	onClick={() => retryAllMutation.mutate()}
	disabled={retryAllMutation.isPending}
>
	{retryAllMutation.isPending ? <Spinner /> : null}
	{__('Fehlgeschlagene erneut synchronisieren', 'resa-propstack')}
</Button>
```

---

## Akzeptanzkriterien

### Feature 1: Sync-Status UI

- [ ] CRM-Spalte in Lead-Tabelle zeigt Status (✅/❌/⏳/—)
- [ ] Tooltip bei ❌ zeigt Fehlermeldung
- [ ] Tooltip bei ✅ zeigt Sync-Zeitpunkt
- [ ] "Erneut synchronisieren" im Row-Dropdown bei fehlgeschlagenen Leads
- [ ] Spalte nur sichtbar wenn Propstack Add-on aktiv

### Feature 2: DSGVO-Check

- [ ] Leads ohne `consent_given = 1` werden NICHT synchronisiert
- [ ] Fehlermeldung "Kein DSGVO-Consent vorhanden." wird gespeichert
- [ ] Manueller Re-sync prüft Consent erneut
- [ ] Log-Eintrag bei übersprungenen Leads

### Feature 3: Retry-Queue

- [ ] WP-Cron registriert alle 15 Minuten
- [ ] Maximal 3 Retry-Versuche pro Lead
- [ ] Exponential Backoff (15min → 1h → 4h)
- [ ] Permanente Fehler (DSGVO, kein Makler) werden nicht erneut versucht
- [ ] Retry-Counter wird nach Erfolg zurückgesetzt
- [ ] Batch-Verarbeitung (max 10 Leads pro Durchlauf)

---

## Security-Überlegungen

1. **DSGVO-Compliance:** Consent-Check ist Pflicht vor jedem externen Datentransfer
2. **API-Key Schutz:** API-Key wird nur serverseitig verwendet, nie an Frontend übermittelt
3. **Rate-Limiting:** Retry-Queue mit Exponential Backoff verhindert API-Abuse
4. **Admin-Only:** Alle Propstack-Endpoints erfordern `manage_options` Capability

---

## Testplan

### Unit Tests

- `PropstackSync::onLeadCreated()` mit/ohne Consent
- `RetryQueue::processQueue()` mit verschiedenen Fehlertypen
- `RetryQueue::getRetryStatus()` Berechnung

### Integration Tests

- Lead erstellen → Sync → Status in DB prüfen
- Lead ohne Consent → Sync übersprungen
- API-Fehler simulieren → Retry-Queue verarbeitet

### Manueller Test

1. Lead über Widget erstellen (mit Consent)
2. Propstack aktivieren und konfigurieren
3. Lead erscheint mit ✅ in Liste
4. API-Key ungültig machen → neuer Lead zeigt ❌
5. API-Key korrigieren → "Erneut synchronisieren" → ✅

---

## Offene Fragen

- ~~Soll die Retry-Queue auch bei manuellen Syncs greifen?~~ Nein, manuelle Syncs sind sofortig.
- Sollen Retry-Statistiken im Dashboard angezeigt werden? (Nice-to-have, nicht Teil dieser Spec)

---

## Abhängigkeiten

- Propstack Add-on muss aktiviert und konfiguriert sein
- RESA Premium erforderlich
- `consent_given`-Spalte in `resa_leads` (bereits vorhanden)
- `propstack_*`-Spalten in `resa_leads` (bereits vorhanden)
