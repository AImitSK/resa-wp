# WordPress i18n — Vollständige Referenz

> Basierend auf developer.wordpress.org/plugins/internationalization/ (Stand: Mai 2025)
> Alle Codebeispiele verwenden RESA-Kontext (Text-Domain `resa`, Namespace `Resa\`)

---

## Inhaltsverzeichnis

1. [Core Concepts](#1-core-concepts)
2. [PHP Translation Functions](#2-php-translation-functions)
3. [Escaped Translation Functions](#3-escaped-translation-functions)
4. [Loading Text Domains](#4-loading-text-domains)
5. [Number, Date, Currency Formatting](#5-number-date-currency-formatting)
6. [sprintf Patterns](#6-sprintf-patterns)
7. [HTML in Translations](#7-html-in-translations)
8. [JavaScript i18n (@wordpress/i18n)](#8-javascript-i18n-wordpressi18n)
9. [Translation File Workflow](#9-translation-file-workflow)
10. [Translator Comments](#10-translator-comments)
11. [DACH Locales](#11-dach-locales)
12. [Locale Switching](#12-locale-switching)
13. [Gettext Filter Hooks](#13-gettext-filter-hooks)
14. [Common Mistakes](#14-common-mistakes)
15. [Best Practices Summary](#15-best-practices-summary)

---

## 1. Core Concepts

### Internationalization (i18n) vs Localization (l10n)

- **Internationalization (i18n):** Code translatable machen durch gettext-Funktionen.
- **Localization (l10n):** Strings in spezifische Sprachen/Locales übersetzen.
- WordPress nutzt das GNU gettext Framework.

### Text Domain

- Eindeutiger Identifier für Plugin-Übersetzungen
- Muss im Plugin-Header übereinstimmen: `Text Domain: resa`
- Domain Path Header: `Domain Path: /languages`
- Seit WordPress 4.6+: Auto-Loading aus `wp-content/languages/plugins/`

### Plugin Header

```php
<?php
/**
 * Plugin Name: RESA - Real Estate Smart Assets
 * Plugin URI:  https://resa-wt.com
 * Description: Interaktive Rechner und Tools für Immobilienmakler.
 * Version:     1.0.0
 * Author:      RESA
 * Author URI:  https://resa-wt.com
 * License:     GPL-2.0-or-later
 * Text Domain: resa
 * Domain Path: /languages
 * Requires at least: 6.2
 * Requires PHP: 8.1
 */
```

---

## 2. PHP Translation Functions

### 2.1 Basic Functions

#### `__( $text, $domain = 'default' ): string`

Gibt übersetzten String zurück.

```php
$label = __( 'Einstellungen', 'resa' );
echo '<h1>' . esc_html( $label ) . '</h1>';
```

#### `_e( $text, $domain = 'default' ): void`

Gibt übersetzten String direkt aus (echo). **Escaped NICHT!**

```php
<h1><?php _e( 'Dashboard', 'resa' ); ?></h1>
```

**Warnung:** `_e()` escaped nicht. Bevorzuge `esc_html_e()`.

### 2.2 Context Functions (Disambiguation)

#### `_x( $text, $context, $domain = 'default' ): string`

Gibt übersetzten String mit Kontext zurück (für Wörter mit mehreren Bedeutungen).

```php
$verb = _x( 'Objekt', 'Immobilie', 'resa' );
$noun = _x( 'Objekt', 'Programmierung', 'resa' );
```

#### `_ex( $text, $context, $domain = 'default' ): void`

Gibt übersetzten String mit Kontext direkt aus.

```php
_ex( 'Standort', 'Immobilienstandort', 'resa' );
```

### 2.3 Plural Functions

#### `_n( $single, $plural, $number, $domain = 'default' ): string`

Gibt korrekte Pluralform basierend auf `$number` zurück.

```php
$count = 5;
$message = sprintf(
    _n(
        '%d Lead gefunden',
        '%d Leads gefunden',
        $count,
        'resa'
    ),
    $count
);
// Ergebnis: "5 Leads gefunden"
```

**Wichtig:** `$number` immer separat an `sprintf()` übergeben.

#### `_nx( $single, $plural, $number, $context, $domain = 'default' ): string`

Pluralform mit Kontext.

```php
$message = sprintf(
    _nx(
        '%d Objekt',
        '%d Objekte',
        $count,
        'Immobilienobjekt',
        'resa'
    ),
    $count
);
```

### 2.4 Noop Functions (Deferred Translation)

#### `_n_noop( $singular, $plural, $domain = 'default' ): array`

Definiert übersetzbaren Plural für spätere Verwendung.

```php
$messages = [
    'lead' => _n_noop( '%s Lead', '%s Leads', 'resa' ),
];

// Später:
$count = 10;
$text = sprintf(
    translate_nooped_plural( $messages['lead'], $count, 'resa' ),
    number_format_i18n( $count )
);
```

#### `_nx_noop( $singular, $plural, $context, $domain = 'default' ): array`

Deferred Plural mit Kontext.

#### `translate_nooped_plural( $nooped_plural, $count, $domain = 'default' ): string`

Übersetzt einen vorher definierten Noop-Plural.

---

## 3. Escaped Translation Functions

Kombinieren Übersetzung + Output-Escaping. **IMMER bevorzugen bei direkter Ausgabe!**

| Funktion | Signatur | Returns/Echoes | Escaping |
|---|---|---|---|
| `esc_html__()` | `esc_html__( $text, $domain )` | Returns | HTML |
| `esc_html_e()` | `esc_html_e( $text, $domain )` | Echoes | HTML |
| `esc_attr__()` | `esc_attr__( $text, $domain )` | Returns | Attribut |
| `esc_attr_e()` | `esc_attr_e( $text, $domain )` | Echoes | Attribut |
| `esc_html_x()` | `esc_html_x( $text, $context, $domain )` | Returns | HTML + Context |
| `esc_attr_x()` | `esc_attr_x( $text, $context, $domain )` | Returns | Attribut + Context |

```php
// HTML-Body
<h1><?php esc_html_e( 'Lead-Übersicht', 'resa' ); ?></h1>
<p><?php echo esc_html__( 'Keine Leads gefunden.', 'resa' ); ?></p>

// HTML-Attribut
<input placeholder="<?php echo esc_attr__( 'Suchen...', 'resa' ); ?>">
<button title="<?php echo esc_attr__( 'Lead löschen', 'resa' ); ?>">

// Mit Kontext
<span><?php echo esc_html_x( 'Aktiv', 'Lead-Status', 'resa' ); ?></span>
```

### Entscheidungstabelle: Wann welche Funktion?

| Szenario | Funktion |
|---|---|
| Text in HTML-Body ausgeben | `esc_html_e()` |
| Text in HTML-Body als Variable | `esc_html__()` |
| Text in HTML-Attribut | `esc_attr__()` oder `esc_attr_e()` |
| Text mit Kontext in HTML | `esc_html_x()` |
| Text mit Kontext in Attribut | `esc_attr_x()` |
| Text für interne Logik (nicht Output) | `__()` |
| Text mit Plural | `_n()` + separates Escaping |
| Text in JS (React) | `__()` aus `@wordpress/i18n` |

---

## 4. Loading Text Domains

### `load_plugin_textdomain( $domain, $deprecated = false, $plugin_rel_path = false )`

```php
add_action( 'init', function () {
    load_plugin_textdomain(
        'resa',
        false,
        dirname( plugin_basename( RESA_FILE ) ) . '/languages'
    );
} );
```

**Hook:** `init` (empfohlen seit WP 6.1+, `plugins_loaded` funktioniert weiterhin).

**Ladereihenfolge:** WordPress prüft zuerst `wp-content/languages/plugins/resa-{locale}.mo`, dann das Plugin-Verzeichnis.

### Weitere Funktionen

| Funktion | Beschreibung |
|---|---|
| `load_textdomain( $domain, $mofile )` | Lädt spezifische MO-Datei |
| `is_textdomain_loaded( $domain )` | Prüft ob Domain geladen |
| `unload_textdomain( $domain )` | Entlädt Domain |

---

## 5. Number, Date, Currency Formatting

### `number_format_i18n( $number, $decimals = 0 ): string`

```php
// Deutsche Locale: Komma als Dezimal, Punkt als Tausender
echo number_format_i18n( 1234567.89, 2 ); // "1.234.567,89"
echo number_format_i18n( 850000 );         // "850.000"
```

### `wp_date( $format, $timestamp = null, $timezone = null ): string`

Bevorzugte Datumsfunktion seit WP 5.3 (ersetzt `date_i18n()`).

```php
echo wp_date( 'j. F Y', strtotime( $lead->created_at ) );
// "25. Februar 2026"

echo wp_date( 'j. F Y, H:i', time() );
// "25. Februar 2026, 14:30"

echo wp_date( 'd.m.Y' ); // "25.02.2026"
```

### `human_time_diff( $from, $to = 0 ): string`

```php
echo human_time_diff( strtotime( $lead->created_at ) );
// "3 Stunden" / "2 Tage"
```

### DACH-spezifische Formate

```php
// Währung (Euro, Betrag vor Symbol im DACH-Raum)
/* translators: %s: formatierter Geldbetrag */
$price_display = sprintf( __( '%s €', 'resa' ), number_format_i18n( $price, 2 ) );
// "1.234,56 €"

// Fläche
/* translators: %s: formatierte Quadratmeterzahl */
$area_display = sprintf( __( '%s m²', 'resa' ), number_format_i18n( $area, 1 ) );
// "85,5 m²"

// Prozent
/* translators: %s: formatierter Prozentwert */
$rate_display = sprintf( __( '%s %%', 'resa' ), number_format_i18n( $rate, 2 ) );
// "3,75 %"

// Mietpreis pro m²
/* translators: %s: formatierter Preis pro Quadratmeter */
$rent_display = sprintf( __( '%s €/m²', 'resa' ), number_format_i18n( $rent_per_sqm, 2 ) );
// "12,50 €/m²"
```

---

## 6. sprintf Patterns

### Einfache Variable

```php
/* translators: %s: Name des Maklers */
$greeting = sprintf( __( 'Hallo %s', 'resa' ), $agent_name );
```

### Positionale Platzhalter (PFLICHT bei 2+ Variablen)

```php
/* translators: 1: Maklername, 2: Anzahl neue Leads, 3: Standortname */
$message = sprintf(
    __( '%1$s, Sie haben %2$d neue Leads in %3$s.', 'resa' ),
    $agent_name,   // %1$s
    $lead_count,   // %2$d
    $location_name // %3$s
);
```

### Platzhalter-Typen

| Platzhalter | Typ | Beispiel |
|---|---|---|
| `%s` | String | Name, Label |
| `%d` | Integer | Anzahl, ID |
| `%f` | Float | Preis, Fläche |
| `%%` | Literal % | Prozentzeichen |
| `%1$s` | 1. Argument als String | Positional |
| `%2$d` | 2. Argument als Integer | Positional |

---

## 7. HTML in Translations

### Ansatz 1: HTML außerhalb (BEVORZUGT)

```php
echo '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Mehr erfahren', 'resa' ) . '</a>';
```

### Ansatz 2: sprintf für Links

```php
/* translators: %s: Link zur Datenschutzerklärung */
$message = sprintf(
    __( 'Bitte lesen Sie unsere %s.', 'resa' ),
    '<a href="' . esc_url( $privacy_url ) . '">'
        . esc_html__( 'Datenschutzerklärung', 'resa' )
    . '</a>'
);
echo wp_kses( $message, [ 'a' => [ 'href' => [] ] ] );
```

### Ansatz 3: wp_kses für einfaches HTML

```php
$text = __( 'Dies ist <strong>wichtig</strong> für Ihre Leads.', 'resa' );
echo wp_kses( $text, [ 'strong' => [], 'em' => [] ] );
```

### Ansatz 4: Separate Platzhalter für Tags

```php
/* translators: 1: öffnendes Link-Tag, 2: schließendes Link-Tag */
$message = sprintf(
    __( 'Besuchen Sie %1$sunsere Webseite%2$s für Details.', 'resa' ),
    '<a href="' . esc_url( $url ) . '">',
    '</a>'
);
echo wp_kses_post( $message );
```

---

## 8. JavaScript i18n (@wordpress/i18n)

### Verfügbare Funktionen

```typescript
import { __, _n, _x, _nx, sprintf, isRTL, hasTranslation } from '@wordpress/i18n';

// Einfacher String
const label = __( 'Einstellungen', 'resa' );

// Mit Kontext
const status = _x( 'Aktiv', 'Lead-Status', 'resa' );

// Plural
const msg = sprintf(
    _n( '%d Lead', '%d Leads', count, 'resa' ),
    count
);

// Plural mit Kontext
const objMsg = sprintf(
    _nx( '%d Objekt', '%d Objekte', count, 'Immobilie', 'resa' ),
    count
);

// sprintf
/* translators: %s: Name des Standorts */
const locMsg = sprintf( __( 'Standort: %s', 'resa' ), locationName );

// RTL-Check
const direction = isRTL() ? 'rtl' : 'ltr';

// Translation-Check (seit @wordpress/i18n 4.23.0)
const hasIt = hasTranslation( 'Einstellungen', undefined, 'resa' );
```

**Hinweis:** Kein `_e()` in JavaScript. `__()` verwenden und Ergebnis rendern.

### PHP: JS-Translations laden

#### `wp_set_script_translations( $handle, $domain, $path = null ): bool`

```php
add_action( 'admin_enqueue_scripts', function () {
    wp_enqueue_script(
        'resa-admin',
        plugins_url( 'dist/admin.js', RESA_FILE ),
        [ 'wp-i18n' ],
        RESA_VERSION,
        true
    );
    wp_set_script_translations( 'resa-admin', 'resa', RESA_PATH . 'languages' );
} );
```

**MUSS nach `wp_enqueue_script()` oder `wp_register_script()` aufgerufen werden.**

### JSON Translation File Format

Dateiname: `{domain}-{locale}-{md5-hash}.json` (z.B. `resa-de_DE-a1b2c3.json`)

Der MD5-Hash basiert auf dem **relativen Pfad** der JS-Datei.

```json
{
  "translation-revision-date": "2026-01-01 00:00:00+0000",
  "generator": "WP-CLI/2.10",
  "source": "dist/admin.js",
  "domain": "messages",
  "locale_data": {
    "messages": {
      "": {
        "domain": "messages",
        "lang": "de_DE",
        "plural-forms": "nplurals=2; plural=(n != 1);"
      },
      "Settings": ["Einstellungen"],
      "Save": ["Speichern"]
    }
  }
}
```

### Vite-spezifisch (@kucrut/vite-for-wp)

- Script-Handle wird aus dem Vite-Manifest bestimmt
- MD5-Hash für JSON-Dateiname basiert auf Source-Dateipfad relativ zum Plugin-Root
- JSON-Dateinamen-Generierung muss ggf. angepasst werden

---

## 9. Translation File Workflow

### Dateitypen

| Datei | Extension | Zweck |
|---|---|---|
| POT (Template) | `.pot` | Template mit allen übersetzbaren Strings |
| PO (Portable Object) | `.po` | Übersetzungsdatei für ein Locale |
| MO (Machine Object) | `.mo` | Binär-kompilierte PO-Datei (PHP Runtime) |
| JSON | `.json` | Übersetzungsdatei für JavaScript |

### Dateinamen-Konventionen

- POT: `resa.pot`
- PO: `resa-de_DE.po`, `resa-de_AT.po`, `resa-de_CH.po`
- MO: `resa-de_DE.mo`, `resa-de_AT.mo`, `resa-de_CH.mo`
- JSON: `resa-de_DE-{md5}.json`

### Speicherort

- `{plugin-dir}/languages/`
- WordPress prüft auch `wp-content/languages/plugins/` (Priorität seit WP 4.6)

### WP-CLI Commands

```bash
# POT aus Quellcode generieren
wp i18n make-pot . languages/resa.pot \
  --domain=resa \
  --exclude="node_modules,vendor,dist,tests" \
  --slug=resa \
  --package-name="RESA"

# PO aus POT aktualisieren (GNU gettext)
msgmerge -U languages/resa-de_DE.po languages/resa.pot

# MO aus PO kompilieren
wp i18n make-mo languages/

# JSON aus PO für JavaScript extrahieren
wp i18n make-json languages/ --no-purge
```

### RESA npm i18n Script

```bash
npm run i18n:build   # Führt POT → PO → MO → JSON Chain aus
```

---

## 10. Translator Comments

**PFLICHT bei sprintf-Aufrufen mit Platzhaltern!**

### PHP

```php
/* translators: %s: Name der Stadt */
$message = sprintf( __( 'Immobilien in %s', 'resa' ), $city_name );

/* translators: 1: Anzahl Leads, 2: Maklername */
$message = sprintf(
    __( '%1$d Leads zugewiesen an %2$s', 'resa' ),
    $count,
    $agent_name
);
```

### JavaScript

```typescript
/* translators: %s: Name des Standorts */
const msg = sprintf( __( 'Standort: %s', 'resa' ), locationName );
```

### Regeln

- Kommentar MUSS direkt vor dem Übersetzungsfunktionsaufruf stehen
- MUSS mit `translators:` beginnen (case-insensitive, Konvention lowercase)
- Wird in POT-Datei für Übersetzer extrahiert

---

## 11. DACH Locales

| Locale | Beschreibung | Besonderheit |
|---|---|---|
| `de_DE` | Deutsch (Deutschland) | Standard (formal) |
| `de_DE_formal` | Deutsch (Deutschland, formell) | Extra formell ("Sie") |
| `de_AT` | Deutsch (Österreich) | Österreichische Begriffe |
| `de_CH` | Deutsch (Schweiz) | "ss" statt "ß", CHF |
| `de_CH_informal` | Deutsch (Schweiz, informell) | Du-Form |

### Plural-Forms für Deutsch

```
"Plural-Forms: nplurals=2; plural=(n != 1);\n"
```

Deutsch hat 2 Formen: Singular (n=1) und Plural (n≠1). Gleich wie Englisch.

### Dezimal-/Tausender-Trennzeichen

| Locale | Dezimal | Tausender | Beispiel |
|---|---|---|---|
| `de_DE` / `de_AT` | `,` | `.` | 1.234,56 |
| `de_CH` | `.` | `'` | 1'234.56 |
| `en_US` | `.` | `,` | 1,234.56 |

**Hinweis:** `number_format_i18n()` handhabt dies automatisch basierend auf dem aktiven Locale.

---

## 12. Locale Switching

### `switch_to_locale( $locale ): bool`

Wechselt temporär das Locale (z.B. für E-Mails in Benutzersprache).

```php
// E-Mail in Benutzersprache senden
$user_locale = get_user_locale( $recipient_id );
switch_to_locale( $user_locale );

$subject = __( 'Neue Lead-Benachrichtigung', 'resa' );
$body = sprintf(
    /* translators: %s: Name des Leads */
    __( 'Sie haben einen neuen Lead erhalten: %s', 'resa' ),
    $lead->name
);

wp_mail( $recipient_email, $subject, $body );
restore_previous_locale();
```

### `restore_previous_locale(): string|false`

Stellt das vorherige Locale wieder her.

### `restore_current_locale(): string|false`

Stellt das Original-Locale wieder her (alle `switch_to_locale()` Aufrufe rückgängig).

### `determine_locale(): string`

Gibt das aktuelle Locale zurück (seit WP 5.0). Berücksichtigt User-Locale-Präferenz im Admin.

```php
$locale = determine_locale(); // z.B. "de_DE"
```

### `get_user_locale( $user_id = 0 ): string`

Gibt Locale-Präferenz eines spezifischen Benutzers zurück.

---

## 13. Gettext Filter Hooks

### `gettext` Filter

```php
add_filter( 'gettext', function ( $translation, $text, $domain ) {
    if ( 'resa' === $domain && 'Lead' === $text ) {
        return 'Kontakt'; // Override für bestimmte Installationen
    }
    return $translation;
}, 10, 3 );
```

### Weitere Filter

| Filter | Für Funktion |
|---|---|
| `gettext` | `__()`, `_e()` |
| `gettext_with_context` | `_x()`, `_ex()` |
| `ngettext` | `_n()` |
| `ngettext_with_context` | `_nx()` |

---

## 14. Common Mistakes

### String-Verkettung statt sprintf

```php
// FALSCH
echo __( 'Hallo ', 'resa' ) . $name . __( ', willkommen!', 'resa' );

// RICHTIG
echo sprintf( esc_html__( 'Hallo %s, willkommen!', 'resa' ), esc_html( $name ) );
```

### Variablen in Strings

```php
// FALSCH
__( "Hallo $name", 'resa' );
__( "Hallo {$name}", 'resa' );

// RICHTIG
sprintf( __( 'Hallo %s', 'resa' ), $name );
```

### Fehlende Text-Domain

```php
// FALSCH
__( 'Einstellungen' );

// RICHTIG
__( 'Einstellungen', 'resa' );
```

### Dynamische Text-Domain

```php
// FALSCH — gettext-Tools können dies nicht extrahieren
__( 'Text', $domain );
__( 'Text', MY_DOMAIN_CONSTANT );

// RICHTIG — Text-Domain muss String-Literal sein
__( 'Text', 'resa' );
```

### Dynamischer String

```php
// FALSCH — String ist nicht im POT
__( $dynamic_string, 'resa' );

// RICHTIG — Nur statische Strings übersetzen
__( 'Bekannter statischer String', 'resa' );
```

### Ternary statt _n()

```php
// FALSCH
$text = $count === 1 ? __( '1 Lead', 'resa' ) : sprintf( __( '%d Leads', 'resa' ), $count );

// RICHTIG
$text = sprintf( _n( '%d Lead', '%d Leads', $count, 'resa' ), $count );
```

### _e() Rückgabewert verwenden

```php
// FALSCH — _e() gibt void zurück
$value = _e( 'Text', 'resa' );

// RICHTIG
$value = __( 'Text', 'resa' );
```

### Leerer String

```php
// FALSCH — Gibt MO-Header zurück
__( '', 'resa' );
```

### URLs übersetzen

```php
// FALSCH
__( 'https://example.com', 'resa' );

// RICHTIG — Nur Anzeigetext übersetzen
```

### Geschlechtsproblem im Deutschen

```php
// PROBLEMATISCH — "Neue" stimmt mit "Wohnung" (f), aber nicht mit "Haus" (n)
$type = __( 'Wohnung', 'resa' );
echo sprintf( __( 'Neue %s erstellt', 'resa' ), $type );

// BESSER — Vollständige Sätze
echo __( 'Neue Wohnung erstellt', 'resa' );
echo __( 'Neues Haus erstellt', 'resa' );
```

---

## 15. Best Practices Summary

1. **Immer String-Literale** für Text und Text-Domain verwenden. Nie Variablen, Konstanten oder Verkettung.
2. **Positionale Platzhalter** (`%1$s`, `%2$d`) wenn 2+ Platzhalter vorhanden.
3. **Translator-Kommentare** vor jedem sprintf + Übersetzung, die Platzhalter erklärt.
4. **Escaped Varianten bevorzugen:** `esc_html__()`, `esc_html_e()`, `esc_attr__()`, `esc_attr_e()`.
5. **Ganze Sätze übersetzen.** Keine Fragmente — Übersetzer brauchen Kontext und Grammatik.
6. **Nicht übersetzen:** URLs, HTML-Markup, CSS-Klassen, JavaScript-Code, E-Mail-Adressen, Markennamen.
7. **Plurale immer mit `_n()`**, nie mit Ternary.
8. **Text-Domain früh laden:** Im `init` Hook.
9. **JSON für JS:** `wp_set_script_translations()` und `wp i18n make-json`.
10. **Dateinamen-Konventionen:** `{domain}-{locale}.{po|mo}` und `{domain}-{locale}-{md5}.json`.
11. **DACH-Formatierung:** `number_format_i18n()` für Zahlen, `wp_date()` für Daten, `€` nach Betrag.
12. **E-Mails:** `switch_to_locale()` für Empfängersprache, danach `restore_previous_locale()`.
