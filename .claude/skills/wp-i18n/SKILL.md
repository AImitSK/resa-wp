---
name: wp-i18n
description: "WordPress i18n für RESA Plugin. Automatisch anwenden: Alle User-facing Strings mit gettext wrappen, Text-Domain 'resa', DACH-Formatierung (€, Komma-Dezimal, m²), @wordpress/i18n im Frontend."
user-invocable: false
---

# WordPress i18n Patterns für RESA

Diese Regeln IMMER beim Schreiben von User-facing Strings anwenden. Vollständige API-Referenz: `reference.md` im selben Verzeichnis.

## Grundregeln

1. **Text-Domain ist IMMER `'resa'`** — String-Literal, NIE Variable/Konstante
2. **Alle User-facing Strings** müssen mit gettext gewrappt werden
3. **Escaped Varianten bevorzugen** — `esc_html__()` statt `__()` + `esc_html()`
4. **Ganze Sätze übersetzen** — Nie Fragmente zusammensetzen
5. **Entwicklungssprache: Deutsch** — Originaltexte auf Deutsch

## PHP: Welche Funktion verwenden?

| Situation | Funktion | Beispiel |
|---|---|---|
| String zurückgeben | `__( 'Text', 'resa' )` | `$label = __( 'Einstellungen', 'resa' );` |
| String ausgeben | `_e( 'Text', 'resa' )` | `_e( 'Speichern', 'resa' );` |
| Mit Kontext (disambiguieren) | `_x( 'Text', 'context', 'resa' )` | `_x( 'Objekt', 'Immobilie', 'resa' )` |
| Plural | `_n( 'sg', 'pl', $n, 'resa' )` | Siehe Plural-Pattern |
| HTML-escaped zurückgeben | `esc_html__( 'Text', 'resa' )` | **BEVORZUGT für Output** |
| HTML-escaped ausgeben | `esc_html_e( 'Text', 'resa' )` | **BEVORZUGT für Output** |
| Attribut-escaped zurückgeben | `esc_attr__( 'Text', 'resa' )` | `<input placeholder="...">` |
| Attribut-escaped ausgeben | `esc_attr_e( 'Text', 'resa' )` | In HTML-Attributen |

## sprintf-Pattern — PFLICHT bei Variablen

```php
// IMMER positionale Platzhalter bei 2+ Variablen
/* translators: 1: Anzahl Leads, 2: Standortname */
$message = sprintf(
    __( '%1$d Leads in %2$s gefunden.', 'resa' ),
    $count,
    $location_name
);
```

**Regeln:**
- `%1$s`, `%2$d` statt `%s`, `%d` wenn 2+ Platzhalter
- **Translator-Kommentar ist PFLICHT** bei sprintf: `/* translators: ... */`
- Kommentar DIREKT vor dem Funktionsaufruf

## Plural-Pattern — IMMER _n() verwenden

```php
$message = sprintf(
    _n(
        '%d Lead gefunden',
        '%d Leads gefunden',
        $count,
        'resa'
    ),
    $count
);

// FALSCH: Ternary für Plural
$text = $count === 1 ? __( '1 Lead', 'resa' ) : sprintf( __( '%d Leads', 'resa' ), $count );
```

## DACH-spezifische Formatierung

```php
// Zahlen: Komma-Dezimal, Punkt-Tausender
echo number_format_i18n( 1234567.89, 2 ); // "1.234.567,89"

// Datum: wp_date() statt date()
echo wp_date( 'j. F Y', strtotime( $lead->created_at ) ); // "25. Februar 2026"

// Währung: € nach Zahl (DACH-Konvention)
/* translators: %s: formatierter Betrag */
echo sprintf( __( '%s €', 'resa' ), number_format_i18n( $price, 2 ) );

// Fläche
/* translators: %s: formatierte Fläche */
echo sprintf( __( '%s m²', 'resa' ), number_format_i18n( $area, 1 ) );
```

## JavaScript: @wordpress/i18n

```typescript
import { __, _n, _x, sprintf } from '@wordpress/i18n';

// Einfacher String
const label = __( 'Einstellungen', 'resa' );

// Mit Platzhaltern
const msg = sprintf(
    /* translators: %s: Name des Standorts */
    __( 'Standort: %s', 'resa' ),
    locationName
);

// Plural
const leadMsg = sprintf(
    _n( '%d Lead', '%d Leads', count, 'resa' ),
    count
);
```

**Hinweis:** Kein `_e()` in JS — immer `__()` verwenden und Ergebnis rendern.

## E-Mails in Benutzersprache

```php
// Sprache wechseln für E-Mail
switch_to_locale( get_user_locale( $user_id ) );
$subject = __( 'Neue Lead-Benachrichtigung', 'resa' );
$body    = __( 'Sie haben einen neuen Lead erhalten.', 'resa' );
restore_previous_locale();
```

## HTML in Übersetzungen

```php
// Ansatz 1: HTML außerhalb (BEVORZUGT)
echo '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Mehr erfahren', 'resa' ) . '</a>';

// Ansatz 2: sprintf für Links
/* translators: 1: öffnendes Link-Tag, 2: schließendes Link-Tag */
$msg = sprintf(
    __( 'Lesen Sie unsere %1$sDatenschutzerklärung%2$s.', 'resa' ),
    '<a href="' . esc_url( $privacy_url ) . '">',
    '</a>'
);
echo wp_kses( $msg, [ 'a' => [ 'href' => [] ] ] );
```

## Anti-Patterns — NIEMALS verwenden

```php
// FALSCH: String-Verkettung
echo __( 'Hallo ', 'resa' ) . $name;
// RICHTIG:
echo sprintf( __( 'Hallo %s', 'resa' ), esc_html( $name ) );

// FALSCH: Variable als Text-Domain
__( 'Text', $domain );
__( 'Text', RESA_DOMAIN );
// RICHTIG:
__( 'Text', 'resa' );

// FALSCH: Dynamischer String
__( $dynamic_string, 'resa' );
// RICHTIG: Nur statische Strings übersetzen

// FALSCH: Variable im String
__( "Hallo $name", 'resa' );
// RICHTIG:
sprintf( __( 'Hallo %s', 'resa' ), $name );

// FALSCH: Ternary statt _n()
$count === 1 ? 'Lead' : 'Leads';
// RICHTIG:
_n( 'Lead', 'Leads', $count, 'resa' );

// FALSCH: Fehlender Translator-Kommentar bei sprintf
sprintf( __( '%1$s hat %2$d Leads', 'resa' ), $name, $count );
// RICHTIG:
/* translators: 1: Maklername, 2: Anzahl Leads */
sprintf( __( '%1$s hat %2$d Leads', 'resa' ), $name, $count );

// FALSCH: URLs übersetzen
__( 'https://example.com', 'resa' );

// FALSCH: Leerer String
__( '', 'resa' );
```
