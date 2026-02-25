---
name: wp-security
description: "WordPress Security Patterns für Plugin-Entwicklung. Automatisch anwenden: Sanitization, Escaping, Nonces, Capability Checks, $wpdb->prepare(), REST API Permission Callbacks."
user-invocable: false
---

# WordPress Security Patterns für RESA

Diese Regeln IMMER beim Schreiben von PHP-Code anwenden. Vollständige API-Referenz: `reference.md` im selben Verzeichnis.

## Golden Rules

1. **Never trust input** — `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SERVER` und DB-Daten sind IMMER untrusted
2. **Sanitize early** — Input so früh wie möglich sanitizen
3. **Escape late** — Output so spät wie möglich escapen (direkt bei Ausgabe)
4. **Defense in depth** — Mehrere Sicherheitsschichten, nie nur eine Prüfung
5. **Least privilege** — Nur minimale Capabilities vergeben

## Sanitization: Datentyp → Funktion

| Datentyp | Funktion |
|---|---|
| Einfacher Text (einzeilig) | `sanitize_text_field( $input )` |
| Textarea (mehrzeilig) | `sanitize_textarea_field( $input )` |
| E-Mail | `sanitize_email( $input )` |
| URL | `esc_url_raw( $input )` |
| Dateiname | `sanitize_file_name( $input )` |
| HTML-Klasse | `sanitize_html_class( $input )` |
| Slug / Key | `sanitize_key( $input )` |
| Title / Heading | `sanitize_title( $input )` |
| Ganzzahl | `absint( $input )` oder `intval( $input )` |
| Positiver Float | `abs( floatval( $input ) )` |
| Boolean | `rest_sanitize_boolean( $input )` oder `(bool)` |
| HTML (eingeschränkt) | `wp_kses( $input, $allowed_html )` |
| Post-Content-HTML | `wp_kses_post( $input )` |

## Escaping: Ausgabekontext → Funktion

| Kontext | Funktion | Beispiel |
|---|---|---|
| HTML-Body | `esc_html( $text )` | `<p><?php echo esc_html( $name ); ?></p>` |
| HTML-Attribut | `esc_attr( $value )` | `<input value="<?php echo esc_attr( $val ); ?>">` |
| URL / href | `esc_url( $url )` | `<a href="<?php echo esc_url( $url ); ?>">` |
| JavaScript-Wert | `esc_js( $string )` | `onclick="alert('<?php echo esc_js( $msg ); ?>');"` |
| Inline JS-Daten | `wp_json_encode()` | `<script>var d = <?php echo wp_json_encode( $data ); ?>;</script>` |
| Textarea-Inhalt | `esc_textarea( $text )` | `<textarea><?php echo esc_textarea( $val ); ?></textarea>` |
| SQL (LIKE) | `$wpdb->esc_like()` + `prepare()` | Siehe $wpdb-Sektion |

## Nonce-Patterns

```php
// Formular erstellen
wp_nonce_field( 'resa_save_settings', 'resa_nonce' );

// Formular verarbeiten
if ( ! isset( $_POST['resa_nonce'] ) || ! wp_verify_nonce( $_POST['resa_nonce'], 'resa_save_settings' ) ) {
    wp_die( esc_html__( 'Sicherheitsprüfung fehlgeschlagen.', 'resa' ) );
}

// AJAX (wp_ajax_*)
check_ajax_referer( 'resa_ajax_action', 'nonce' );

// REST API — Nonce wird via X-WP-Nonce Header gesendet, WP prüft automatisch
// wenn wp_localize_script mit wp_create_nonce( 'wp_rest' ) verwendet wird
```

## Capability Checks

```php
// Vor jeder Admin-Aktion prüfen
if ( ! current_user_can( 'manage_options' ) ) {
    wp_die( esc_html__( 'Keine Berechtigung.', 'resa' ) );
}
```

| Capability | Wer hat sie | Einsatz in RESA |
|---|---|---|
| `manage_options` | Administrator | Settings, Konfiguration |
| `edit_posts` | Editor+ | Lead-Verwaltung |
| `upload_files` | Author+ | Medien-Upload |
| `manage_resa` | Custom (Admin) | RESA-spezifische Aktionen |

## $wpdb->prepare() — PFLICHT bei SQL

```php
// RICHTIG: Immer prepare() mit Platzhaltern
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}resa_leads WHERE location_id = %d AND status = %s",
        $location_id,
        $status
    )
);

// LIKE-Query
$like = '%' . $wpdb->esc_like( $search_term ) . '%';
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}resa_leads WHERE name LIKE %s",
        $like
    )
);
```

**Platzhalter:** `%d` (int), `%f` (float), `%s` (string) — NIEMALS Variablen direkt in SQL-Strings!

## REST API Security — PFLICHT

```php
register_rest_route( 'resa/v1', '/leads', [
    'methods'             => 'GET',
    'callback'            => [ $this, 'get_leads' ],
    'permission_callback' => function () {
        return current_user_can( 'manage_options' );
    },
]);

// Öffentliche Endpoints: permission_callback MUSS trotzdem gesetzt sein!
register_rest_route( 'resa/v1', '/calculate', [
    'methods'             => 'POST',
    'callback'            => [ $this, 'calculate' ],
    'permission_callback' => '__return_true',
    'args'                => [
        'rent' => [
            'required'          => true,
            'validate_callback' => fn( $v ) => is_numeric( $v ) && $v > 0,
            'sanitize_callback' => 'absint',
        ],
    ],
]);
```

## Anti-Patterns — NIEMALS verwenden

```php
// NIEMALS: Unescaped Output
echo $user_input;                          // → echo esc_html( $user_input );

// NIEMALS: Direktes SQL ohne prepare
$wpdb->query( "DELETE FROM ... WHERE id = $id" ); // → $wpdb->prepare()

// NIEMALS: permission_callback weglassen
register_rest_route( ..., [ 'callback' => ... ] ); // → IMMER permission_callback!

// NIEMALS: $_REQUEST ohne Sanitization
$name = $_POST['name'];                   // → sanitize_text_field( $_POST['name'] )

// NIEMALS: Nonce-Check vergessen bei Formularverarbeitung

// NIEMALS: extract() auf User-Input
extract( $_POST );                         // Niemals!

// NIEMALS: eval(), create_function(), unserialize() auf User-Input
```
