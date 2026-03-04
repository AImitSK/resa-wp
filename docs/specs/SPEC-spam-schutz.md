# SPEC: Spam-Schutz (stille Maßnahmen)

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Öffentliche Lead-Endpoints, Frontend-Widget, API-Client

## Zusammenfassung

Die öffentlichen Lead-Endpoints (`POST /leads/partial` und `POST /leads/complete`) haben aktuell keinen Spam-Schutz. Jeder Bot kann unbegrenzt Fake-Leads anlegen. Diese Spec beschreibt vier unsichtbare, konversions-neutrale Maßnahmen: Honeypot-Feld, Zeitprüfung, Rate-Limiting (IP-basiert) und WordPress Nonce. Alle Maßnahmen sind immer aktiv und benötigen keine Admin-Konfiguration.

**Außerhalb dieser Spec:** reCAPTCHA v3 (eigener Tab unter Integrationen, separate Spec).

## Ist-Zustand

| Komponente                        | Status      | Datei                              |
| --------------------------------- | ----------- | ---------------------------------- |
| Input-Sanitization (sanitize\_\*) | Fertig      | `includes/Api/LeadsController.php` |
| E-Mail-Validierung (is_email)     | Fertig      | `includes/Api/LeadsController.php` |
| Consent-Pflicht                   | Fertig      | `includes/Api/LeadsController.php` |
| Honeypot-Feld                     | **Fehlt**   | —                                  |
| Zeitprüfung (< 3s)                | **Fehlt**   | —                                  |
| Rate-Limiting                     | **Fehlt**   | —                                  |
| Nonce/CSRF-Token                  | **Fehlt**   | —                                  |
| reCAPTCHA v3                      | **Geplant** | Separate Spec (Integrationen-Tab)  |

### Lücken im Ist-Zustand

| Lücke                                | Risiko                                   |
| ------------------------------------ | ---------------------------------------- |
| Kein Honeypot-Feld                   | Einfache Bots füllen alle Felder aus     |
| Keine Zeitprüfung                    | Bots submitten in < 1 Sekunde            |
| Kein Rate-Limiting                   | DDoS/Spam-Flut, DB wächst unkontrolliert |
| Kein CSRF-Token auf Public Endpoints | Cross-Site Request Forgery möglich       |

## Betroffene Dateien

### Neue Dateien

| Datei                               | Beschreibung                                  |
| ----------------------------------- | --------------------------------------------- |
| `includes/Security/SpamGuard.php`   | Zentrale Spam-Prüfung (Honeypot, Zeit, Nonce) |
| `includes/Security/RateLimiter.php` | IP-basiertes Rate-Limiting via Transients     |

### Geänderte Dateien

| Datei                                         | Änderung                                                  |
| --------------------------------------------- | --------------------------------------------------------- |
| `includes/Api/LeadsController.php`            | SpamGuard-Check in `createPartial()` und `completeLead()` |
| `includes/Shortcode/ResaShortcode.php`        | Nonce + Timestamp in `resaFrontend` injizieren            |
| `src/frontend/lib/api-client.ts`              | Nonce-Header + Honeypot + Timestamp mitsenden             |
| `src/frontend/types/index.ts`                 | `ResaFrontendContext` um nonce/ts erweitern               |
| `src/frontend/components/shared/LeadForm.tsx` | Verstecktes Honeypot-Feld rendern                         |

## API-Änderungen

### Geänderte Endpoints

Keine neuen Endpoints. Bestehende Public-Endpoints erhalten zusätzliche Validierung:

| Endpoint               | Neue Parameter (im Body)          | Verhalten bei Spam        |
| ---------------------- | --------------------------------- | ------------------------- |
| `POST /leads/partial`  | `_hp`, `_ts`, `X-WP-Nonce` Header | 403 mit generischem Error |
| `POST /leads/complete` | `_hp`, `_ts`, `X-WP-Nonce` Header | 403 mit generischem Error |

**Wichtig:** Spam-Rejections geben immer denselben generischen Fehler zurück (`resa_spam_detected` / 403), ohne zu verraten welcher Check fehlgeschlagen ist. Das verhindert, dass Bots gezielt einzelne Checks umgehen.

## Datenbank-Änderungen

Keine. Rate-Limiting nutzt WordPress Transients (`set_transient` / `get_transient`), die in `wp_options` gespeichert werden (oder im Object Cache, falls aktiv).

## Modul-Klassifizierung

| Eigenschaft    | Wert             |
| -------------- | ---------------- |
| **Typ**        | Kern-Feature     |
| **Modul-Flag** | nicht zutreffend |
| **Modul-Slug** | nicht zutreffend |

## Free vs. Premium

| Feature-Aspekt  | Free | Pro | Add-on      |
| --------------- | ---- | --- | ----------- |
| Honeypot-Feld   | Ja   | Ja  | —           |
| Zeitprüfung     | Ja   | Ja  | —           |
| Rate-Limiting   | Ja   | Ja  | —           |
| WordPress Nonce | Ja   | Ja  | —           |
| reCAPTCHA v3    | —    | —   | Eigene Spec |

Alle Spam-Schutz-Maßnahmen sind immer aktiv, für Free und Pro identisch.

## UI/UX

### Admin-Seite

Kein Admin-UI. Alle Maßnahmen sind „silent" — immer aktiv, nicht konfigurierbar. Eine spätere Erweiterung (z.B. Statistik über geblockte Requests) ist möglich, aber nicht Teil dieser Spec.

### Frontend-Widget

Das Honeypot-Feld wird im LeadForm unsichtbar gerendert:

```
┌─────────────────────────────────────────┐
│  Vorname*        [Max              ]    │
│  Nachname        [Mustermann       ]    │
│  E-Mail*         [max@beispiel.de  ]    │
│  Telefon         [+49 123 456789   ]    │
│                                         │
│  ┌─ UNSICHTBAR (display:none) ────────┐ │
│  │  Website      [                  ] │ │  ← Honeypot
│  └────────────────────────────────────┘ │
│                                         │
│  ☐ Newsletter                           │
│  ☑ Datenschutz*                         │
│                                         │
│  [ Ergebnis anzeigen → ]                │
└─────────────────────────────────────────┘
```

Für Screenreader: `aria-hidden="true"` + `tabIndex={-1}` + `autocomplete="off"`, damit das Feld nicht von AT oder Browser-Autofill befüllt wird.

## Implementierungsdetails

### PHP-Klassen

#### `includes/Security/SpamGuard.php`

Zentrale statische Klasse, die alle Checks bündelt:

```php
namespace Resa\Security;

final class SpamGuard {

    /**
     * Prüft den Request auf Spam-Signale.
     *
     * @param \WP_REST_Request $request
     * @return \WP_Error|true  true wenn OK, WP_Error wenn Spam.
     */
    public static function check( \WP_REST_Request $request ): \WP_Error|true {
        // 1. Nonce prüfen.
        // 2. Honeypot prüfen.
        // 3. Zeitprüfung.
        // 4. Rate-Limiting.
        // Bei Fail: generischer WP_Error (resa_spam_detected, 403).
    }

    /**
     * Generiert Nonce für öffentliche Lead-Endpoints.
     * Action: 'resa_lead_submit'
     */
    public static function createNonce(): string {
        return wp_create_nonce( 'resa_lead_submit' );
    }

    /**
     * Aktueller Timestamp für Zeitprüfung.
     */
    public static function timestamp(): int {
        return time();
    }
}
```

**Check-Reihenfolge** (günstigste zuerst):

1. **Nonce** — `wp_verify_nonce()` auf `X-WP-Nonce` Header (Action: `resa_lead_submit`)
2. **Honeypot** — Body-Feld `_hp` muss leer sein
3. **Zeitprüfung** — Body-Feld `_ts` muss ein Timestamp sein, `time() - _ts >= 3`
4. **Rate-Limiting** — `RateLimiter::check()` mit Client-IP

#### `includes/Security/RateLimiter.php`

```php
namespace Resa\Security;

final class RateLimiter {

    private const MINUTE_LIMIT = 5;
    private const HOUR_LIMIT   = 20;

    /**
     * Prüft und inkrementiert den Counter für die IP.
     *
     * @return bool true wenn innerhalb der Limits.
     */
    public static function check(): bool {
        $ip  = self::getClientIp();
        $key = 'resa_rl_' . md5( $ip );

        // Minuten-Counter (Transient mit 60s TTL).
        $minuteKey = $key . '_m';
        $minuteCount = (int) get_transient( $minuteKey );
        if ( $minuteCount >= self::MINUTE_LIMIT ) {
            return false;
        }

        // Stunden-Counter (Transient mit 3600s TTL).
        $hourKey = $key . '_h';
        $hourCount = (int) get_transient( $hourKey );
        if ( $hourCount >= self::HOUR_LIMIT ) {
            return false;
        }

        // Inkrementieren.
        set_transient( $minuteKey, $minuteCount + 1, 60 );
        set_transient( $hourKey, $hourCount + 1, 3600 );

        return true;
    }

    /**
     * Client-IP ermitteln (respektiert Reverse-Proxy).
     */
    private static function getClientIp(): string {
        // X-Forwarded-For (erster Eintrag) falls hinter Proxy.
        if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
            $ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
            return trim( $ips[0] );
        }

        return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
    }
}
```

### Änderungen in `LeadsController.php`

Am Anfang von `createPartial()` und `completeLead()`:

```php
$spam = SpamGuard::check( $request );
if ( is_wp_error( $spam ) ) {
    return $spam;
}
```

### Änderungen in `ResaShortcode.php`

In `enqueueAssets()` → `$frontendData` erweitern:

```php
$frontendData = [
    'restUrl'        => esc_url_raw( rest_url( 'resa/v1/' ) ),
    'nonce'          => SpamGuard::createNonce(),
    'ts'             => SpamGuard::timestamp(),
    // ... bestehende Felder ...
];
```

### Änderungen im Frontend

#### `src/frontend/types/index.ts`

```typescript
export interface ResaFrontendContext {
	restUrl: string;
	nonce: string; // NEU
	ts: number; // NEU
	module: string;
	version: string;
	// ...
}
```

#### `src/frontend/lib/api-client.ts`

Nonce als `X-WP-Nonce` Header mitsenden, Honeypot + Timestamp in POST-Body:

```typescript
function getNonce(): string {
	return window.resaFrontend?.nonce ?? '';
}

function getTimestamp(): number {
	return window.resaFrontend?.ts ?? 0;
}

export const api = {
	get: <T>(endpoint: string) => request<T>(endpoint),

	post: <T>(endpoint: string, data: unknown) =>
		request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify({
				...(data as Record<string, unknown>),
				_hp: '', // Honeypot — immer leer
				_ts: getTimestamp(),
			}),
			headers: {
				'X-WP-Nonce': getNonce(),
			},
		}),
};
```

#### `src/frontend/components/shared/LeadForm.tsx`

Honeypot-Feld im Formular (CSS-versteckt, nicht per `display:none` da manche Bots das erkennen):

```tsx
{
	/* Honeypot — unsichtbar für echte User */
}
<div
	style={{
		position: 'absolute',
		left: '-9999px',
		top: '-9999px',
		height: 0,
		width: 0,
		overflow: 'hidden',
	}}
	aria-hidden="true"
>
	<label htmlFor="resa-website">Website</label>
	<input id="resa-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
</div>;
```

**Hinweis:** Das Honeypot-Feld wird nur im HTML gerendert, nicht über React Hook Form registriert. Es dient rein dazu, dass Bots es befüllen. Der eigentliche Check passiert über `_hp` im API-Client Body (immer leer). Falls ein Bot das native `website`-Feld ausfüllt, wird das vom Backend ignoriert — der Check ist auf `_hp` im JSON-Body.

### Nonce-Lebensdauer

WordPress Nonces haben standardmäßig eine Lebensdauer von 24 Stunden (in 2 Ticks à 12h). Das reicht für typische Sessions aus. Falls ein User das Formular nach >24h absendet, schlägt der Nonce-Check fehl. Das ist akzeptabel — der User muss die Seite einfach neu laden.

### Error-Response

Alle Spam-Rejections geben denselben Response zurück:

```json
{
	"code": "resa_spam_detected",
	"message": "Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.",
	"data": { "status": 403 }
}
```

Keine Details darüber, welcher Check fehlgeschlagen ist.

## Akzeptanzkriterien

- [ ] Honeypot: Request mit nicht-leerem `_hp`-Feld wird mit 403 abgelehnt
- [ ] Zeitprüfung: Request mit `_ts` < 3 Sekunden vor `time()` wird abgelehnt
- [ ] Rate-Limiting: 6. Request innerhalb einer Minute wird abgelehnt
- [ ] Rate-Limiting: 21. Request innerhalb einer Stunde wird abgelehnt
- [ ] Nonce: Request ohne gültigen `X-WP-Nonce` Header wird abgelehnt
- [ ] Alle Rejections geben generischen 403-Fehler zurück (kein Hinweis auf den Check)
- [ ] Echte User (normales Ausfüllen >3s, leeres Honeypot, gültiger Nonce) werden nicht blockiert
- [ ] Frontend-Honeypot ist für Screenreader unsichtbar (`aria-hidden`, `tabIndex={-1}`)
- [ ] Kein Admin-UI nötig — alle Maßnahmen sind automatisch aktiv
- [ ] Build fehlerfrei (`npm run build`)
- [ ] Alle bestehenden Tests bleiben grün

## Security-Überlegungen

- **Nonce-Action:** `resa_lead_submit` — spezifisch genug, um nicht mit anderen Plugins zu kollidieren
- **IP-Spoofing:** `X-Forwarded-For` wird nur der erste Eintrag genutzt (vom Reverse Proxy gesetzt). In Shared-Hosting-Umgebungen ohne Proxy wird `REMOTE_ADDR` genutzt
- **Transient-Keys:** `md5($ip)` statt Raw-IP als Key, um lange IPv6-Adressen als Key-Länge zu handhaben
- **Timing-Attack:** `_ts` kommt vom Server (nicht vom Client-JS `Date.now()`), daher nicht manipulierbar — es sei denn, der Bot liest den HTML-Source. Das ist bewusst akzeptiert: Die Zeitprüfung ist nur eine Schicht von vier
- **Rate-Limiting Bypass:** Bei Object Cache (Redis/Memcached) sind Transients schneller und zuverlässiger. Ohne Object Cache landen sie in `wp_options` — funktioniert auch, aber langsamer bei hoher Last
- **Generischer Error:** Verhindert Enumeration der aktiven Schutzmaßnahmen

## Testplan

### PHP Unit Tests

**`tests/php/Unit/Security/SpamGuardTest.php`:**

- `test_check_akzeptiert_gueltigen_request` — Alle Checks bestanden → true
- `test_check_lehnt_ungueltige_nonce_ab` — Falscher/fehlender Nonce → WP_Error
- `test_check_lehnt_befuelltes_honeypot_ab` — `_hp` nicht leer → WP_Error
- `test_check_lehnt_zu_schnellen_request_ab` — `_ts` = time() (< 3s) → WP_Error
- `test_check_akzeptiert_request_nach_3_sekunden` — `_ts` = time() - 4 → true
- `test_check_lehnt_ab_wenn_rate_limit_erreicht` — RateLimiter gibt false → WP_Error
- `test_error_verraet_keinen_check_namen` — Error-Code ist immer `resa_spam_detected`

**`tests/php/Unit/Security/RateLimiterTest.php`:**

- `test_check_erlaubt_ersten_request` — Counter bei 0 → true
- `test_check_erlaubt_bis_minuten_limit` — 5 Requests → alle true
- `test_check_blockiert_nach_minuten_limit` — 6. Request → false
- `test_check_blockiert_nach_stunden_limit` — 21. Request → false
- `test_counter_nutzt_ip_hash_als_key` — Prüft Transient-Key-Format

### JS Unit Tests

**`tests/js/frontend/lib/api-client.test.ts`:**

- `test_post_sendet_nonce_header` — `X-WP-Nonce` im Request-Header
- `test_post_fuegt_honeypot_und_timestamp_hinzu` — `_hp` und `_ts` im Body
- `test_honeypot_ist_immer_leer` — `_hp === ''`

**`tests/js/frontend/components/shared/LeadForm.test.tsx`:**

- `test_rendert_honeypot_feld_unsichtbar` — Honeypot-Input im DOM, `aria-hidden="true"`
- `test_honeypot_hat_tabindex_minus_1` — Kein Tab-Focus möglich

## Offene Fragen

Keine — alle Entscheidungen sind in der Planung geklärt.

## Abhängigkeiten

Keine. Kann unabhängig von anderen Specs implementiert werden. Die bestehenden Tests für `LeadsController` müssen angepasst werden (SpamGuard-Mocking oder Nonce/Honeypot/Timestamp in Test-Requests).

## Implementierungsreihenfolge

| Batch | Beschreibung                                                    |
| ----- | --------------------------------------------------------------- |
| 1     | PHP: `RateLimiter` + `SpamGuard` + Tests                        |
| 2     | PHP: `LeadsController` + `ResaShortcode` anpassen + Tests fixen |
| 3     | Frontend: Types + api-client + LeadForm Honeypot + Tests        |
| 4     | Verifikation: Build + alle Tests grün                           |
