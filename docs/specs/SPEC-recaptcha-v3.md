# SPEC: reCAPTCHA v3 Integration

**Status:** Entwurf
**Erstellt:** 2026-03-04
**Betrifft:** Integrationen-Seite (neuer Tab), SpamGuard-Erweiterung, Frontend-Widget

## Zusammenfassung

Google reCAPTCHA v3 als optionale, unsichtbare Spam-Schutz-Schicht für die Lead-Endpoints. Score-basiert (0.0–1.0), kein Nutzer-Interaktion nötig. Konfiguration über einen neuen Tab "reCAPTCHA" auf der Integrationen-Seite. Wenn aktiviert, wird der Score serverseitig im SpamGuard als 5. Check geprüft. Ergänzt die bereits implementierten stillen Maßnahmen (Honeypot, Zeitprüfung, Rate-Limiting, Nonce).

## Ist-Zustand

| Komponente           | Status    | Datei                                         |
| -------------------- | --------- | --------------------------------------------- |
| SpamGuard (4 Checks) | Fertig    | `includes/Security/SpamGuard.php`             |
| RateLimiter          | Fertig    | `includes/Security/RateLimiter.php`           |
| Nonce im Frontend    | Fertig    | `src/frontend/lib/api-client.ts`              |
| Honeypot-Feld        | Fertig    | `src/frontend/components/shared/LeadForm.tsx` |
| Integrationen-Seite  | Fertig    | `src/admin/pages/Integrations.tsx`            |
| reCAPTCHA v3         | **Fehlt** | —                                             |

## Betroffene Dateien

### Neue Dateien

| Datei                                                | Beschreibung                                     |
| ---------------------------------------------------- | ------------------------------------------------ |
| `includes/Api/RecaptchaSettingsController.php`       | REST GET/PUT für reCAPTCHA-Einstellungen         |
| `includes/Security/RecaptchaVerifier.php`            | Serverseitige Token-Verifizierung via Google API |
| `src/admin/hooks/useRecaptchaSettings.ts`            | React Query Hooks für reCAPTCHA-Settings         |
| `src/admin/components/integrations/RecaptchaTab.tsx` | Admin-UI für Site Key, Secret, Schwellenwert     |

### Geänderte Dateien

| Datei                                  | Änderung                                                |
| -------------------------------------- | ------------------------------------------------------- |
| `includes/Security/SpamGuard.php`      | 5. Check: reCAPTCHA-Token verifizieren (wenn aktiviert) |
| `includes/Core/Plugin.php`             | RecaptchaSettingsController registrieren                |
| `includes/Shortcode/ResaShortcode.php` | reCAPTCHA Site Key in `resaFrontend` injizieren         |
| `src/admin/pages/Integrations.tsx`     | Neuer Tab "reCAPTCHA" + Import                          |
| `src/admin/types/index.ts`             | `RecaptchaSettings` Interface                           |
| `src/frontend/types/index.ts`          | `recaptchaSiteKey` in `ResaFrontendContext`             |
| `src/frontend/lib/api-client.ts`       | reCAPTCHA-Token in POST-Body mitsenden                  |

## API-Änderungen

### Neue Endpoints

| Methode | Route                               | Beschreibung                 | Auth  |
| ------- | ----------------------------------- | ---------------------------- | ----- |
| GET     | `/resa/v1/admin/recaptcha-settings` | Aktuelle Einstellungen laden | Admin |
| PUT     | `/resa/v1/admin/recaptcha-settings` | Einstellungen speichern      | Admin |

### Geänderte Endpoints

| Endpoint               | Änderung                                        |
| ---------------------- | ----------------------------------------------- |
| `POST /leads/partial`  | Neues optionales Body-Feld `_recaptcha` (Token) |
| `POST /leads/complete` | Neues optionales Body-Feld `_recaptcha` (Token) |

## Datenbank-Änderungen

Keine Tabellen. Neue `wp_options`-Einträge:

| Option Key                | Typ   | Beschreibung                                 |
| ------------------------- | ----- | -------------------------------------------- |
| `resa_recaptcha_settings` | array | `{enabled, site_key, secret_key, threshold}` |

## Modul-Klassifizierung

| Eigenschaft    | Wert             |
| -------------- | ---------------- |
| **Typ**        | Kern-Feature     |
| **Modul-Flag** | free             |
| **Modul-Slug** | nicht zutreffend |

## Free vs. Premium

| Feature-Aspekt      | Free | Pro | Add-on |
| ------------------- | ---- | --- | ------ |
| reCAPTCHA v3 Tab    | Ja   | Ja  | —      |
| Token-Verifizierung | Ja   | Ja  | —      |

reCAPTCHA v3 ist für alle Nutzer verfügbar (Free + Pro). Google stellt reCAPTCHA v3 kostenlos zur Verfügung (bis 1M Requests/Monat).

**Hinweis:** Die Integrationen-Seite zeigt aktuell eine UpgradeNotice für Free-User. Der reCAPTCHA-Tab muss **außerhalb** des Premium-Gates gerendert werden, da er für alle verfügbar sein soll.

## UI/UX

### Integrationen → reCAPTCHA Tab

```
┌─────────────────────────────────────────────────────────────────┐
│  Integrationen                                                   │
│                                                                   │
│  [ Webhooks ] [ API ] [ Messenger ] [ reCAPTCHA ]                │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🛡️ Google reCAPTCHA v3                                     │ │
│  │                                                              │ │
│  │  Unsichtbarer Bot-Schutz für Ihre Lead-Formulare.           │ │
│  │  Erfordert einen kostenlosen API-Key von Google.            │ │
│  │  → https://www.google.com/recaptcha/admin                   │ │
│  │                                                              │ │
│  │  Aktiviert              [=========○]                         │ │
│  │                                                              │ │
│  │  Site Key               [6Le..........................]      │ │
│  │  Secret Key             [6Le..........................]      │ │
│  │                                                              │ │
│  │  Schwellenwert          [ 0.5 ▼ ]                           │ │
│  │  Requests mit Score unter diesem Wert werden blockiert.     │ │
│  │  0.0 = wahrscheinlich Bot, 1.0 = wahrscheinlich Mensch.    │ │
│  │  Empfehlung: 0.5                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                              [ Speichern ]       │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend-Widget

Keine sichtbare Änderung. reCAPTCHA v3 ist komplett unsichtbar. Das Google-Script wird nur geladen, wenn reCAPTCHA aktiviert und ein Site Key konfiguriert ist. Das Badge ("protected by reCAPTCHA") kann optional ausgeblendet werden (CSS), sofern der Hinweis in der Datenschutzerklärung steht.

## Implementierungsdetails

### PHP-Klassen

#### `includes/Api/RecaptchaSettingsController.php`

Pattern: Exakte Kopie von `TrackingSettingsController.php`.

```php
namespace Resa\Api;

final class RecaptchaSettingsController extends RestController {

    private const OPTION_KEY = 'resa_recaptcha_settings';

    private const DEFAULTS = [
        'enabled'    => false,
        'site_key'   => '',
        'secret_key' => '',
        'threshold'  => 0.5,
    ];

    public function registerRoutes(): void {
        // GET + PUT /admin/recaptcha-settings (adminAccess)
    }

    public function show(): \WP_REST_Response { ... }

    public function update( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
        // Validierung:
        // - site_key: sanitize_text_field, muss mit "6L" beginnen wenn nicht leer
        // - secret_key: sanitize_text_field, muss mit "6L" beginnen wenn nicht leer
        // - threshold: float, muss zwischen 0.0 und 1.0 liegen
        // - enabled: nur true wenn site_key UND secret_key gesetzt
    }

    public static function get(): array { ... }

    public static function isEnabled(): bool {
        $settings = self::get();
        return $settings['enabled']
            && $settings['site_key'] !== ''
            && $settings['secret_key'] !== '';
    }
}
```

#### `includes/Security/RecaptchaVerifier.php`

Serverseitige Token-Verifizierung über die Google API.

```php
namespace Resa\Security;

use Resa\Api\RecaptchaSettingsController;

final class RecaptchaVerifier {

    private const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

    /**
     * Verifiziert ein reCAPTCHA-Token.
     *
     * @param string $token Das reCAPTCHA-Token vom Frontend.
     * @return bool True wenn Score >= Schwellenwert.
     */
    public static function verify( string $token ): bool {
        $settings = RecaptchaSettingsController::get();

        $response = wp_remote_post( self::VERIFY_URL, [
            'body' => [
                'secret'   => $settings['secret_key'],
                'response' => $token,
                'remoteip' => self::getClientIp(),
            ],
            'timeout' => 5,
        ] );

        if ( is_wp_error( $response ) ) {
            // Bei Netzwerk-Fehler: durchlassen (fail open).
            // reCAPTCHA soll kein Single Point of Failure sein.
            return true;
        }

        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( ! is_array( $body ) || empty( $body['success'] ) ) {
            return false;
        }

        return ( $body['score'] ?? 0.0 ) >= $settings['threshold'];
    }

    private static function getClientIp(): string {
        if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
            $ips = explode( ',', sanitize_text_field( wp_unslash( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) );
            return trim( $ips[0] );
        }
        return sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0' ) );
    }
}
```

**Wichtig: Fail-Open-Strategie.** Wenn die Google-API nicht erreichbar ist (Timeout, DNS-Fehler), wird der Request durchgelassen. Die anderen 4 Checks (Nonce, Honeypot, Zeit, Rate-Limit) schützen weiterhin. reCAPTCHA darf kein Single Point of Failure sein.

#### Änderung in `SpamGuard.php`

Nach Check 4 (Rate-Limiting), neuer Check 5:

```php
// 5. reCAPTCHA (optional, nur wenn aktiviert).
if ( RecaptchaSettingsController::isEnabled() ) {
    $recaptchaToken = $request->get_param( '_recaptcha' );
    if ( empty( $recaptchaToken ) || ! RecaptchaVerifier::verify( $recaptchaToken ) ) {
        return self::reject();
    }
}
```

### Frontend-Änderungen

#### `includes/Shortcode/ResaShortcode.php`

In `enqueueAssets()` → `$frontendData` erweitern:

```php
$recaptcha = RecaptchaSettingsController::get();
if ( $recaptcha['enabled'] && $recaptcha['site_key'] !== '' ) {
    $frontendData['recaptchaSiteKey'] = $recaptcha['site_key'];
}
```

#### `src/frontend/types/index.ts`

```typescript
export interface ResaFrontendContext {
	// ... bestehende Felder ...
	recaptchaSiteKey?: string;
}
```

#### `src/frontend/lib/api-client.ts`

reCAPTCHA-Token bei POST-Requests mitsenden (wenn Site Key vorhanden):

```typescript
function getRecaptchaToken(): Promise<string> {
	const siteKey = window.resaFrontend?.recaptchaSiteKey;
	if (!siteKey || !window.grecaptcha) {
		return Promise.resolve('');
	}
	return window.grecaptcha.execute(siteKey, { action: 'submit_lead' });
}

export const api = {
	get: <T>(endpoint: string) => request<T>(endpoint),

	post: async <T>(endpoint: string, data: unknown) => {
		const recaptchaToken = await getRecaptchaToken();
		return request<T>(endpoint, {
			method: 'POST',
			body: JSON.stringify({
				...(data as Record<string, unknown>),
				_hp: '',
				_ts: getTimestamp(),
				_recaptcha: recaptchaToken || undefined,
			}),
			headers: { 'X-WP-Nonce': getNonce() },
		});
	},
};
```

#### Google reCAPTCHA Script laden

In `ResaShortcode.php` → `enqueueAssets()`:

```php
if ( RecaptchaSettingsController::isEnabled() ) {
    $siteKey = $recaptcha['site_key'];
    wp_enqueue_script(
        'google-recaptcha-v3',
        "https://www.google.com/recaptcha/api.js?render={$siteKey}",
        [],
        null,
        true
    );
}
```

### React-Komponente: RecaptchaTab

Pattern: Kopie von `TrackingTab.tsx` mit 1 Card.

- **Switch:** Aktiviert/Deaktiviert
- **Input:** Site Key (text, nur wenn aktiviert sichtbar)
- **Input:** Secret Key (password, nur wenn aktiviert sichtbar)
- **Select:** Schwellenwert (0.3, 0.5, 0.7, 0.9)
- **Info-Text:** Link zu Google reCAPTCHA Admin Console
- **Save Footer:** isDirty-Pattern mit #a9e43f Button

### Integrationen-Seite Anpassung

reCAPTCHA-Tab muss **vor** dem Premium-Gate gerendert werden:

```typescript
type FixedTab = 'webhooks' | 'api' | 'messenger' | 'recaptcha';

const renderTabContent = () => {
    // reCAPTCHA ist für alle verfügbar (Free + Pro).
    if (activeTab === 'recaptcha') {
        return <RecaptchaTab />;
    }

    if (!isPremium) {
        return <UpgradeNotice />;
    }
    // ... bestehende Tabs ...
};
```

### Window-Augmentierung für grecaptcha

```typescript
declare global {
	interface Window {
		grecaptcha: {
			ready: (cb: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
		};
	}
}
```

## Akzeptanzkriterien

- [ ] Integrationen → reCAPTCHA Tab ist sichtbar (auch für Free-User)
- [ ] Site Key + Secret Key eingeben → Speichern → Reload → Werte da
- [ ] Aktivieren ohne Keys → Fehlermeldung
- [ ] reCAPTCHA-Script wird nur geladen wenn aktiviert + Site Key gesetzt
- [ ] Lead-Submit sendet `_recaptcha` Token im Body
- [ ] SpamGuard prüft Token serverseitig gegen Google API
- [ ] Bei Google-API-Fehler (Timeout): Request wird durchgelassen (fail open)
- [ ] Bei Score < Schwellenwert: 403 (generischer Spam-Error)
- [ ] Ohne reCAPTCHA-Konfiguration: bestehende 4 Checks funktionieren wie bisher
- [ ] Build fehlerfrei (`npm run build`)
- [ ] Alle bestehenden Tests bleiben grün

## Security-Überlegungen

- **Secret Key** wird nur serverseitig verwendet, nie ans Frontend gesendet
- **Fail-Open:** Bei Google-API-Ausfällen werden Leads trotzdem angenommen (die 4 anderen Checks schützen weiterhin)
- **Action-Name:** `submit_lead` — ermöglicht Score-Analyse pro Action in der Google Console
- **Token-Einmaligkeit:** Jeder reCAPTCHA-Token ist nur einmal gültig (Google invalidiert nach Verifizierung)
- **IP-Weitergabe:** Client-IP wird an Google gesendet (DSGVO-Hinweis in Datenschutzerklärung nötig)

## Testplan

### PHP Unit Tests

**`tests/php/Unit/Api/RecaptchaSettingsControllerTest.php`:**

- `test_registerRoutes_registriert_recaptcha_endpoint`
- `test_show_gibt_defaults_zurueck`
- `test_update_validiert_ungueltige_keys`
- `test_update_validiert_threshold_range`
- `test_update_speichert_gueltige_daten`
- `test_isEnabled_gibt_false_ohne_keys`
- `test_isEnabled_gibt_true_mit_keys_und_enabled`

**`tests/php/Unit/Security/RecaptchaVerifierTest.php`:**

- `test_verify_gibt_true_bei_gutem_score`
- `test_verify_gibt_false_bei_niedrigem_score`
- `test_verify_gibt_true_bei_netzwerk_fehler` (fail open)
- `test_verify_gibt_false_bei_ungueltigem_token`

**`tests/php/Unit/Security/SpamGuardTest.php` (erweitern):**

- `test_check_prueft_recaptcha_wenn_aktiviert`
- `test_check_ignoriert_recaptcha_wenn_deaktiviert`

### JS Unit Tests

**`tests/js/admin/components/integrations/RecaptchaTab.test.tsx`:**

- `test_rendert_switch_und_key_felder`
- `test_key_felder_nur_sichtbar_wenn_aktiviert`
- `test_speichern_button_isDirty`

## Offene Fragen

Keine.

## Abhängigkeiten

- Spam-Schutz (stille Maßnahmen) — **bereits implementiert** ✅
- SpamGuard wird um Check 5 erweitert (additiv, kein Breaking Change)

## Implementierungsreihenfolge

| Batch | Beschreibung                                                        |
| ----- | ------------------------------------------------------------------- |
| 1     | PHP: `RecaptchaSettingsController` + `RecaptchaVerifier` + Tests    |
| 2     | PHP: `SpamGuard` erweitern + `Plugin.php` + `ResaShortcode` + Tests |
| 3     | Frontend: Types + Hook + RecaptchaTab + Integrations.tsx + Tests    |
| 4     | Frontend: api-client reCAPTCHA-Token + Script-Loading               |
| 5     | Verifikation: Build + alle Tests grün                               |
