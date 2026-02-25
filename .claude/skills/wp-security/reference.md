# WordPress Plugin Security — Vollständige Referenz

> Basierend auf developer.wordpress.org/apis/security/ (Stand: Mai 2025)
> Alle Codebeispiele verwenden RESA-Kontext (Text-Domain `resa`, Namespace `Resa\`, Prefix `resa_`)

---

## Inhaltsverzeichnis

1. [Sicherheitsübersicht](#1-sicherheitsübersicht)
2. [Nonces (CSRF-Schutz)](#2-nonces-csrf-schutz)
3. [Data Validation](#3-data-validation)
4. [Input Sanitization](#4-input-sanitization)
5. [Output Escaping](#5-output-escaping)
6. [Capability Checks](#6-capability-checks)
7. [Database Security ($wpdb)](#7-database-security-wpdb)
8. [REST API Security](#8-rest-api-security)
9. [File Upload Security](#9-file-upload-security)
10. [Common Vulnerabilities](#10-common-vulnerabilities)
11. [Quick Reference Tables](#11-quick-reference-tables)

---

## 1. Sicherheitsübersicht

WordPress-Sicherheit ruht auf vier Säulen, die in Schichten angewendet werden:

1. **Nonces** — Absicht verifizieren (CSRF-Schutz)
2. **Capability Checks** — Benutzer hat Berechtigung
3. **Data Validation / Sanitization** — Input-Daten verifizieren und bereinigen
4. **Output Escaping** — Daten bei Ausgabe absichern (XSS-Schutz)

### Golden Rules

- **Never trust user input.** `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `$_SERVER` und sogar Datenbank-Daten sind IMMER untrusted.
- **Sanitize input early, escape output late.** Sanitization so nah an der Eingabequelle wie möglich; Escaping so nah an der Ausgabe wie möglich.
- **Defense in depth.** Mehrere Sicherheitsschichten; nie auf eine einzige Prüfung verlassen.
- **Principle of least privilege.** Nur minimale Capabilities vergeben.

---

## 2. Nonces (CSRF-Schutz)

WordPress-Nonces sind **keine echten kryptographischen Nonces** (Number-Used-Once). Sie sind Hash-basierte Tokens gebunden an:
- Einen spezifischen Action-String
- Einen spezifischen Benutzer (Session)
- Ein Zeitfenster (**24 Stunden**, in zwei 12-Stunden-Ticks)

### 2.1 Nonces erstellen

#### `wp_create_nonce( string $action = -1 ): string`

Erstellt einen Nonce-Token-String.

```php
$nonce = wp_create_nonce( 'resa_save_location' );
```

#### `wp_nonce_field( string $action, string $name = '_wpnonce', bool $referer = true, bool $echo = true ): string`

Gibt Hidden-Input-Felder für Nonce und optional Referer aus.

```php
// In einem Formular
<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
    <?php wp_nonce_field( 'resa_save_settings', 'resa_settings_nonce' ); ?>
    <input type="hidden" name="action" value="resa_save_settings">
    <!-- Formularfelder -->
</form>
```

#### `wp_nonce_url( string $actionurl, int|string $action = -1, string $name = '_wpnonce' ): string`

Hängt Nonce als Query-Parameter an eine URL an.

```php
$delete_url = wp_nonce_url(
    admin_url( 'admin.php?page=resa-leads&action=delete&lead_id=' . $lead_id ),
    'resa_delete_lead_' . $lead_id,
    'resa_nonce'
);
```

### 2.2 Nonces verifizieren

#### `wp_verify_nonce( string $nonce, string|int $action = -1 ): int|false`

Prüft einen Nonce-Token. Gibt `1` zurück wenn 0-12h alt, `2` wenn 12-24h alt, `false` wenn ungültig.

```php
if ( ! isset( $_POST['resa_settings_nonce'] )
    || ! wp_verify_nonce( $_POST['resa_settings_nonce'], 'resa_save_settings' )
) {
    wp_die( esc_html__( 'Sicherheitsprüfung fehlgeschlagen.', 'resa' ) );
}
```

#### `check_admin_referer( string $action = -1, string $query_arg = '_wpnonce' ): int|false`

Prüft Nonce UND Referer in Admin-Kontext. Ruft `wp_die()` bei Fehler auf.

```php
// In Admin-Post-Handler
check_admin_referer( 'resa_save_settings', 'resa_settings_nonce' );
// Weiter mit der Verarbeitung...
```

#### `check_ajax_referer( string $action = -1, string|false $query_arg = false, bool $stop = true ): int|false`

Prüft Nonce für AJAX-Requests. Sucht in `$_REQUEST['_ajax_nonce']` oder `$_REQUEST['_wpnonce']`.

```php
// AJAX-Handler
add_action( 'wp_ajax_resa_dismiss_notice', function () {
    check_ajax_referer( 'resa_dismiss_notice', 'nonce' );
    update_user_meta( get_current_user_id(), 'resa_notice_dismissed', true );
    wp_send_json_success();
} );
```

### 2.3 Nonce Best Practices

- Action-Strings immer spezifisch und einzigartig: `'resa_delete_lead_' . $lead_id`
- Nonces sind user-spezifisch — nicht zwischen Benutzern teilen
- Nonces in AJAX immer via `wp_localize_script()` übergeben:

```php
wp_localize_script( 'resa-admin', 'resaAdmin', [
    'ajaxUrl' => admin_url( 'admin-ajax.php' ),
    'nonce'   => wp_create_nonce( 'resa_admin_nonce' ),
] );
```

---

## 3. Data Validation

Validation prüft, ob Daten einem erwarteten Format entsprechen, ohne sie zu verändern.

### WordPress Validierungsfunktionen

| Funktion | Prüft | Rückgabe |
|---|---|---|
| `is_email( $email )` | Gültige E-Mail | string\|false |
| `wp_http_validate_url( $url )` | Gültige HTTP(S) URL | string\|false |
| `is_numeric( $val )` | Numerisch | bool |
| `absint( $val )` | Konvertiert zu pos. Integer | int |
| `in_array( $val, $allowed, true )` | Wert in erlaubter Liste | bool |
| `term_exists( $term )` | Term existiert | int\|false |
| `username_exists( $username )` | Benutzername existiert | int\|false |
| `validate_file( $file )` | Sicherer Dateipfad | 0 = ok |

### Validation-Pattern für RESA

```php
namespace Resa\Api;

class LeadValidator {
    public static function validate_lead_data( array $data ): array|\WP_Error {
        $errors = new \WP_Error();

        // E-Mail: Pflicht + Format
        if ( empty( $data['email'] ) ) {
            $errors->add( 'email_required', __( 'E-Mail ist erforderlich.', 'resa' ) );
        } elseif ( ! is_email( $data['email'] ) ) {
            $errors->add( 'email_invalid', __( 'Ungültige E-Mail-Adresse.', 'resa' ) );
        }

        // Name: Pflicht + Länge
        if ( empty( $data['name'] ) ) {
            $errors->add( 'name_required', __( 'Name ist erforderlich.', 'resa' ) );
        } elseif ( mb_strlen( $data['name'] ) > 200 ) {
            $errors->add( 'name_too_long', __( 'Name darf maximal 200 Zeichen lang sein.', 'resa' ) );
        }

        // Whitelist-Validation
        $allowed_types = [ 'mietpreis', 'kaufpreis', 'rendite', 'nebenkosten' ];
        if ( ! in_array( $data['asset_type'] ?? '', $allowed_types, true ) ) {
            $errors->add( 'invalid_type', __( 'Ungültiger Asset-Typ.', 'resa' ) );
        }

        if ( $errors->has_errors() ) {
            return $errors;
        }

        return $data;
    }
}
```

---

## 4. Input Sanitization

Sanitization bereinigt Daten und entfernt unerwünschte Inhalte.

### 4.1 Alle sanitize_*() Funktionen

#### `sanitize_text_field( string $str ): string`
- Entfernt Tags, Zeilenumbrüche, Tabs, Oktette, prozent-kodierte Zeichen
- **Verwenden für:** Einzeilige Text-Inputs (Name, Titel, Suchbegriff)

```php
$name = sanitize_text_field( wp_unslash( $_POST['lead_name'] ?? '' ) );
```

#### `sanitize_textarea_field( string $str ): string`
- Wie `sanitize_text_field()`, aber **behält Zeilenumbrüche**
- **Verwenden für:** Mehrzeilige Textfelder (Notizen, Beschreibungen)

```php
$notes = sanitize_textarea_field( wp_unslash( $_POST['lead_notes'] ?? '' ) );
```

#### `sanitize_email( string $email ): string`
- Entfernt alle Zeichen die nicht in E-Mails erlaubt sind
- **Verwenden für:** E-Mail-Adressen

```php
$email = sanitize_email( wp_unslash( $_POST['email'] ?? '' ) );
```

#### `sanitize_key( string $key ): string`
- Lowercase, entfernt alles außer alphanumerisch, Bindestrich, Unterstrich
- **Verwenden für:** Option-Keys, Meta-Keys, Slugs

```php
$key = sanitize_key( $_GET['setting'] ?? '' );
```

#### `sanitize_title( string $title ): string`
- Erstellt URL-sicheren Slug (lowercase, Bindestriche statt Leerzeichen)
- **Verwenden für:** URL-Slugs, sanitized Titles

```php
$slug = sanitize_title( $location_name );
```

#### `sanitize_file_name( string $filename ): string`
- Entfernt Sonderzeichen, ersetzt Leerzeichen
- **Verwenden für:** Dateinamen bei Uploads

```php
$safe_name = sanitize_file_name( $_FILES['upload']['name'] );
```

#### `sanitize_html_class( string $class ): string`
- Entfernt alles außer A-Z, a-z, 0-9, Bindestrich, Unterstrich
- **Verwenden für:** CSS-Klassennamen

```php
$class = sanitize_html_class( $user_class );
```

#### `sanitize_mime_type( string $mime_type ): string`
- Sanitized MIME-Type-String
- **Verwenden für:** Content-Type-Prüfungen

#### `sanitize_option( string $option, string $value ): string`
- Sanitized basierend auf bekannten WordPress-Optionsnamen
- **Verwenden für:** WordPress-Core-Optionen

#### `sanitize_url( string $url ): string` (alias: `esc_url_raw()`)
- Bereinigt URL für Datenbank-Speicherung (kein HTML-Encoding)
- **Verwenden für:** URLs vor DB-Speicherung

```php
$website = esc_url_raw( wp_unslash( $_POST['website'] ?? '' ) );
```

### 4.2 wp_kses() Familie

#### `wp_kses( string $content, array $allowed_html, array $protocols = [] ): string`

Entfernt alle HTML-Tags/Attribute die nicht in `$allowed_html` erlaubt sind.

```php
$allowed = [
    'a'      => [ 'href' => [], 'title' => [], 'target' => [] ],
    'strong' => [],
    'em'     => [],
    'br'     => [],
    'p'      => [],
];
$clean_html = wp_kses( $dirty_html, $allowed );
```

#### `wp_kses_post( string $content ): string`

Erlaubt alle HTML-Tags die in einem WordPress-Post erlaubt sind.

```php
$content = wp_kses_post( wp_unslash( $_POST['email_template'] ?? '' ) );
```

#### `wp_kses_data( string $content ): string`

Restriktiver — erlaubt nur Basic-HTML.

### 4.3 wp_unslash()

WordPress fügt automatisch Slashes zu `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE` hinzu. **IMMER `wp_unslash()` vor Sanitization verwenden!**

```php
// RICHTIG
$name = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );

// FALSCH — Slashes bleiben erhalten
$name = sanitize_text_field( $_POST['name'] ?? '' );
```

### 4.4 Typecasting

Für numerische Werte ist Typecasting oft die einfachste Sanitization:

```php
$lead_id     = absint( $_GET['lead_id'] ?? 0 );          // Positive Ganzzahl
$page        = max( 1, intval( $_GET['paged'] ?? 1 ) );  // Mindestens 1
$price       = abs( floatval( $_POST['price'] ?? 0 ) );  // Positiver Float
$is_active   = (bool) ( $_POST['is_active'] ?? false );  // Boolean
```

---

## 5. Output Escaping

Escaping konvertiert spezielle Zeichen so, dass sie im jeweiligen Ausgabekontext sicher sind.

### 5.1 Alle esc_*() Funktionen

#### `esc_html( string $text ): string`
- Konvertiert `<`, `>`, `&`, `"`, `'` in HTML-Entities
- **Kontext:** HTML-Body-Text

```php
<h1><?php echo esc_html( $location->name ); ?></h1>
<p><?php echo esc_html( sprintf( __( '%d Leads gefunden', 'resa' ), $count ) ); ?></p>
```

#### `esc_attr( string $text ): string`
- Wie `esc_html()`, optimiert für HTML-Attribute
- **Kontext:** HTML-Attributwerte

```php
<input type="text" name="lead_name" value="<?php echo esc_attr( $lead->name ); ?>">
<div class="<?php echo esc_attr( $css_class ); ?>">
<div data-config="<?php echo esc_attr( wp_json_encode( $config ) ); ?>">
```

#### `esc_url( string $url, array $protocols = null, string $_context = 'display' ): string`
- Bereinigt URL und kodiert für sichere HTML-Ausgabe
- Erlaubte Protokolle: http, https, ftp, ftps, mailto, news, irc, irc6, ircs, gopher, nntp, feed, telnet, mms, rtsp, sms, svn, tel, fax, xmpp, webcal, urn
- **Kontext:** href, src, action Attribute

```php
<a href="<?php echo esc_url( $lead->website ); ?>"><?php echo esc_html( $lead->name ); ?></a>
<img src="<?php echo esc_url( $avatar_url ); ?>" alt="">
<form action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
```

#### `esc_url_raw( string $url ): string`
- Wie `esc_url()` aber OHNE HTML-Entity-Encoding
- **Kontext:** Datenbank-Speicherung, Redirects, HTTP-Header

```php
// Für DB-Speicherung
$wpdb->update( $table, [ 'website' => esc_url_raw( $url ) ], [ 'id' => $id ] );

// Für Redirects
wp_safe_redirect( esc_url_raw( $redirect_url ) );
```

#### `esc_js( string $text ): string`
- Escaped für Inline-JavaScript-Strings
- **Kontext:** Inline-JS (möglichst vermeiden!)

```php
<script>alert('<?php echo esc_js( $message ); ?>');</script>
```

**Besser:** `wp_json_encode()` für Datenübergabe an JS:

```php
<script>
var resaData = <?php echo wp_json_encode( $data ); ?>;
</script>
```

#### `esc_textarea( string $text ): string`
- Escaped für Textarea-Inhalt (HTML-Entities, Zeilenumbrüche erhalten)
- **Kontext:** `<textarea>` Inhalt

```php
<textarea name="notes"><?php echo esc_textarea( $lead->notes ); ?></textarea>
```

### 5.2 Escaped Translation Functions

Kombinieren Übersetzung mit Escaping — **BEVORZUGT für Ausgabe!**

| Funktion | Escaping | Returns/Echoes |
|---|---|---|
| `esc_html__( $text, 'resa' )` | HTML | Returns |
| `esc_html_e( $text, 'resa' )` | HTML | Echoes |
| `esc_attr__( $text, 'resa' )` | Attribute | Returns |
| `esc_attr_e( $text, 'resa' )` | Attribute | Echoes |
| `esc_html_x( $text, $ctx, 'resa' )` | HTML + Context | Returns |
| `esc_attr_x( $text, $ctx, 'resa' )` | Attribute + Context | Returns |

```php
<h1><?php esc_html_e( 'Lead-Übersicht', 'resa' ); ?></h1>
<input placeholder="<?php echo esc_attr__( 'Suchen...', 'resa' ); ?>">
```

### 5.3 wp_kses() für kontrollierte HTML-Ausgabe

```php
// RESA: E-Mail-Template-Vorschau mit eingeschränktem HTML
$allowed_tags = [
    'h1' => [], 'h2' => [], 'h3' => [],
    'p'  => [ 'style' => [] ],
    'a'  => [ 'href' => [], 'target' => [] ],
    'strong' => [], 'em' => [], 'br' => [],
    'img' => [ 'src' => [], 'alt' => [], 'width' => [], 'height' => [] ],
    'ul' => [], 'ol' => [], 'li' => [],
    'table' => [], 'tr' => [], 'td' => [ 'style' => [] ], 'th' => [],
];
echo wp_kses( $email_body, $allowed_tags );
```

---

## 6. Capability Checks

### 6.1 Standard WordPress Capabilities

| Capability | Rollen | Beschreibung |
|---|---|---|
| `manage_options` | Admin | Seitenweite Optionen verwalten |
| `edit_posts` | Contributor+ | Posts bearbeiten |
| `publish_posts` | Author+ | Posts veröffentlichen |
| `upload_files` | Author+ | Dateien hochladen |
| `edit_others_posts` | Editor+ | Posts anderer bearbeiten |
| `delete_posts` | Contributor+ | Eigene Posts löschen |
| `manage_categories` | Editor+ | Kategorien verwalten |
| `edit_users` | Admin | Benutzer bearbeiten |
| `install_plugins` | Admin (Single-Site) | Plugins installieren |

### 6.2 Custom Capabilities für RESA

```php
// Bei Plugin-Aktivierung
function resa_add_capabilities(): void {
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        $admin->add_cap( 'manage_resa' );
        $admin->add_cap( 'manage_resa_leads' );
        $admin->add_cap( 'manage_resa_settings' );
        $admin->add_cap( 'export_resa_leads' );
    }
}

// Bei Plugin-Deaktivierung
function resa_remove_capabilities(): void {
    $admin = get_role( 'administrator' );
    if ( $admin ) {
        $admin->remove_cap( 'manage_resa' );
        $admin->remove_cap( 'manage_resa_leads' );
        $admin->remove_cap( 'manage_resa_settings' );
        $admin->remove_cap( 'export_resa_leads' );
    }
}
```

### 6.3 Capability-Check-Patterns

```php
// In Admin-Seiten
function resa_render_settings_page(): void {
    if ( ! current_user_can( 'manage_resa_settings' ) ) {
        wp_die( esc_html__( 'Sie haben keine Berechtigung für diese Seite.', 'resa' ) );
    }
    // Seite rendern...
}

// In REST API
'permission_callback' => function () {
    return current_user_can( 'manage_resa_leads' );
},

// In AJAX-Handlern
add_action( 'wp_ajax_resa_delete_lead', function () {
    check_ajax_referer( 'resa_admin_nonce', 'nonce' );
    if ( ! current_user_can( 'manage_resa_leads' ) ) {
        wp_send_json_error( [ 'message' => __( 'Keine Berechtigung.', 'resa' ) ], 403 );
    }
    // Löschen...
} );
```

---

## 7. Database Security ($wpdb)

### 7.1 $wpdb Methoden

| Methode | Beschreibung | Rückgabe |
|---|---|---|
| `$wpdb->prepare( $sql, ...$args )` | SQL mit Platzhaltern vorbereiten | string |
| `$wpdb->get_results( $sql )` | Mehrere Zeilen abrufen | array |
| `$wpdb->get_row( $sql )` | Eine Zeile abrufen | object\|null |
| `$wpdb->get_var( $sql )` | Einen Wert abrufen | string\|null |
| `$wpdb->get_col( $sql )` | Eine Spalte abrufen | array |
| `$wpdb->insert( $table, $data, $format )` | Zeile einfügen | int\|false |
| `$wpdb->update( $table, $data, $where, $format, $where_format )` | Zeile aktualisieren | int\|false |
| `$wpdb->delete( $table, $where, $where_format )` | Zeile löschen | int\|false |
| `$wpdb->replace( $table, $data, $format )` | Insert oder Update | int\|false |
| `$wpdb->query( $sql )` | Beliebiges SQL ausführen | int\|false |

### 7.2 Platzhalter in prepare()

| Platzhalter | Typ | Beispiel |
|---|---|---|
| `%d` | Integer | `$wpdb->prepare( "WHERE id = %d", $id )` |
| `%f` | Float | `$wpdb->prepare( "WHERE price = %f", $price )` |
| `%s` | String | `$wpdb->prepare( "WHERE email = %s", $email )` |
| `%i` | Identifier (seit WP 6.2) | `$wpdb->prepare( "ORDER BY %i", $column )` |

### 7.3 RESA-Beispiele

```php
namespace Resa\Models;

class LeadRepository {
    private \wpdb $wpdb;
    private string $table;

    public function __construct() {
        global $wpdb;
        $this->wpdb  = $wpdb;
        $this->table = $wpdb->prefix . 'resa_leads';
    }

    public function find( int $id ): ?object {
        return $this->wpdb->get_row(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE id = %d",
                $id
            )
        );
    }

    public function find_by_location( int $location_id, int $limit = 50, int $offset = 0 ): array {
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE location_id = %d ORDER BY created_at DESC LIMIT %d OFFSET %d",
                $location_id,
                $limit,
                $offset
            )
        );
    }

    public function search( string $term, int $limit = 50 ): array {
        $like = '%' . $this->wpdb->esc_like( $term ) . '%';
        return $this->wpdb->get_results(
            $this->wpdb->prepare(
                "SELECT * FROM {$this->table} WHERE name LIKE %s OR email LIKE %s LIMIT %d",
                $like,
                $like,
                $limit
            )
        );
    }

    public function create( array $data ): int|false {
        $result = $this->wpdb->insert(
            $this->table,
            [
                'name'        => sanitize_text_field( $data['name'] ),
                'email'       => sanitize_email( $data['email'] ),
                'phone'       => sanitize_text_field( $data['phone'] ?? '' ),
                'location_id' => absint( $data['location_id'] ),
                'asset_type'  => sanitize_key( $data['asset_type'] ),
                'form_data'   => wp_json_encode( $data['form_data'] ?? [] ),
                'created_at'  => current_time( 'mysql' ),
            ],
            [ '%s', '%s', '%s', '%d', '%s', '%s', '%s' ]
        );

        return $result ? $this->wpdb->insert_id : false;
    }

    public function update_status( int $id, string $status ): bool {
        $allowed = [ 'new', 'contacted', 'qualified', 'closed' ];
        if ( ! in_array( $status, $allowed, true ) ) {
            return false;
        }

        return (bool) $this->wpdb->update(
            $this->table,
            [ 'status' => $status, 'updated_at' => current_time( 'mysql' ) ],
            [ 'id' => $id ],
            [ '%s', '%s' ],
            [ '%d' ]
        );
    }

    public function delete( int $id ): bool {
        return (bool) $this->wpdb->delete(
            $this->table,
            [ 'id' => $id ],
            [ '%d' ]
        );
    }

    public function count_by_location( int $location_id ): int {
        return (int) $this->wpdb->get_var(
            $this->wpdb->prepare(
                "SELECT COUNT(*) FROM {$this->table} WHERE location_id = %d",
                $location_id
            )
        );
    }
}
```

### 7.4 INSERT/UPDATE mit Format-Arrays

```php
// Format-Array gibt den Datentyp jedes Werts an
$wpdb->insert(
    $wpdb->prefix . 'resa_leads',
    [
        'name'        => $name,        // %s
        'email'       => $email,       // %s
        'location_id' => $location_id, // %d
        'score'       => $score,       // %f
    ],
    [ '%s', '%s', '%d', '%f' ]  // Reihenfolge muss übereinstimmen!
);
```

### 7.5 Dynamisches ORDER BY / Spaltenauswahl

```php
// SICHER: Whitelist für Spaltennamen
$allowed_orderby = [ 'name', 'email', 'created_at', 'status' ];
$orderby = in_array( $request['orderby'] ?? '', $allowed_orderby, true )
    ? $request['orderby']
    : 'created_at';

$allowed_order = [ 'ASC', 'DESC' ];
$order = in_array( strtoupper( $request['order'] ?? '' ), $allowed_order, true )
    ? strtoupper( $request['order'] )
    : 'DESC';

// Seit WP 6.2: %i Identifier-Platzhalter
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$table} ORDER BY %i {$order} LIMIT %d",
        $orderby,
        $limit
    )
);
```

---

## 8. REST API Security

### 8.1 Permission Callbacks — PFLICHT

**Jede Route MUSS ein `permission_callback` haben.** Ohne `permission_callback` gibt WP eine `_doing_it_wrong`-Notice aus.

```php
namespace Resa\Api;

class LeadsController extends \WP_REST_Controller {

    public function register_routes(): void {
        $namespace = 'resa/v1';

        // Admin-Endpoint: Nur mit Berechtigung
        register_rest_route( $namespace, '/leads', [
            [
                'methods'             => \WP_REST_Server::READABLE,
                'callback'            => [ $this, 'get_items' ],
                'permission_callback' => [ $this, 'admin_permissions_check' ],
                'args'                => $this->get_collection_params(),
            ],
            [
                'methods'             => \WP_REST_Server::DELETABLE,
                'callback'            => [ $this, 'delete_item' ],
                'permission_callback' => [ $this, 'admin_permissions_check' ],
            ],
        ] );

        // Öffentlicher Endpoint: Kalkulator
        register_rest_route( $namespace, '/calculate', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'calculate' ],
            'permission_callback' => '__return_true', // Öffentlich, aber MUSS gesetzt sein!
            'args'                => [
                'type' => [
                    'required'          => true,
                    'type'              => 'string',
                    'enum'              => [ 'mietpreis', 'kaufpreis', 'rendite' ],
                    'sanitize_callback' => 'sanitize_key',
                ],
                'value' => [
                    'required'          => true,
                    'type'              => 'number',
                    'validate_callback' => function ( $val ) {
                        return is_numeric( $val ) && $val >= 0;
                    },
                    'sanitize_callback' => function ( $val ) {
                        return abs( floatval( $val ) );
                    },
                ],
            ],
        ] );

        // Lead-Submission: Öffentlich aber mit Rate-Limiting
        register_rest_route( $namespace, '/leads/submit', [
            'methods'             => \WP_REST_Server::CREATABLE,
            'callback'            => [ $this, 'submit_lead' ],
            'permission_callback' => '__return_true',
            'args'                => [
                'name' => [
                    'required'          => true,
                    'type'              => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'email' => [
                    'required'          => true,
                    'type'              => 'string',
                    'validate_callback' => function ( $val ) {
                        return is_email( $val );
                    },
                    'sanitize_callback' => 'sanitize_email',
                ],
                'gdpr_consent' => [
                    'required'          => true,
                    'type'              => 'boolean',
                    'validate_callback' => function ( $val ) {
                        return true === $val || 'true' === $val || '1' === $val;
                    },
                ],
            ],
        ] );
    }

    public function admin_permissions_check( \WP_REST_Request $request ): bool {
        return current_user_can( 'manage_resa_leads' );
    }
}
```

### 8.2 Argument Validation/Sanitization in REST API

```php
// In register_rest_route 'args':
'args' => [
    'per_page' => [
        'type'              => 'integer',
        'default'           => 20,
        'minimum'           => 1,
        'maximum'           => 100,
        'sanitize_callback' => 'absint',
    ],
    'status' => [
        'type'              => 'string',
        'enum'              => [ 'new', 'contacted', 'qualified', 'closed' ],
        'sanitize_callback' => 'sanitize_key',
    ],
    'search' => [
        'type'              => 'string',
        'sanitize_callback' => 'sanitize_text_field',
    ],
],
```

### 8.3 REST API Nonces

WordPress REST API prüft automatisch den `X-WP-Nonce`-Header wenn ein eingeloggter Benutzer Requests macht:

```php
// PHP: Nonce bereitstellen
wp_localize_script( 'resa-admin', 'resaConfig', [
    'apiBase' => rest_url( 'resa/v1/' ),
    'nonce'   => wp_create_nonce( 'wp_rest' ),
] );
```

```typescript
// TypeScript: Nonce mitsenden
const response = await fetch( `${resaConfig.apiBase}leads`, {
    headers: {
        'X-WP-Nonce': resaConfig.nonce,
        'Content-Type': 'application/json',
    },
} );
```

---

## 9. File Upload Security

```php
namespace Resa\Services;

class FileUploadHandler {

    public function handle_upload( array $file ): string|\WP_Error {
        // 1. Capabilities prüfen
        if ( ! current_user_can( 'upload_files' ) ) {
            return new \WP_Error( 'no_permission', __( 'Keine Upload-Berechtigung.', 'resa' ) );
        }

        // 2. MIME-Type validieren (Whitelist)
        $allowed_mimes = [
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png'          => 'image/png',
            'pdf'          => 'application/pdf',
        ];

        // 3. WordPress Upload-Handler verwenden (sanitized Dateinamen automatisch)
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $overrides = [
            'test_form' => false,
            'mimes'     => $allowed_mimes,
        ];

        $upload = wp_handle_upload( $file, $overrides );

        if ( isset( $upload['error'] ) ) {
            return new \WP_Error( 'upload_error', $upload['error'] );
        }

        // 4. Nochmals MIME-Type mit wp_check_filetype() prüfen
        $filetype = wp_check_filetype( $upload['file'], $allowed_mimes );
        if ( ! $filetype['type'] ) {
            wp_delete_file( $upload['file'] );
            return new \WP_Error( 'invalid_type', __( 'Dateityp nicht erlaubt.', 'resa' ) );
        }

        return $upload['url'];
    }
}
```

---

## 10. Common Vulnerabilities

### 10.1 SQL Injection

```php
// FALSCH — SQL Injection möglich
$results = $wpdb->get_results( "SELECT * FROM {$table} WHERE id = {$_GET['id']}" );

// RICHTIG
$results = $wpdb->get_results(
    $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", absint( $_GET['id'] ) )
);
```

### 10.2 Cross-Site Scripting (XSS)

```php
// FALSCH — Stored XSS
echo '<h1>' . $lead->name . '</h1>';

// RICHTIG
echo '<h1>' . esc_html( $lead->name ) . '</h1>';

// FALSCH — Attribute XSS
echo '<input value="' . $value . '">';

// RICHTIG
echo '<input value="' . esc_attr( $value ) . '">';
```

### 10.3 Cross-Site Request Forgery (CSRF)

```php
// FALSCH — Kein Nonce-Check
if ( isset( $_POST['action'] ) && 'delete' === $_POST['action'] ) {
    $repo->delete( $_POST['id'] );
}

// RICHTIG
if ( isset( $_POST['action'] ) && 'delete' === $_POST['action'] ) {
    check_admin_referer( 'resa_delete_lead_' . $_POST['id'], 'resa_nonce' );
    if ( ! current_user_can( 'manage_resa_leads' ) ) {
        wp_die( esc_html__( 'Keine Berechtigung.', 'resa' ) );
    }
    $repo->delete( absint( $_POST['id'] ) );
}
```

### 10.4 Insecure Direct Object References (IDOR)

```php
// FALSCH — Kein Ownership-Check
public function get_item( \WP_REST_Request $request ): \WP_REST_Response {
    $lead = $this->repo->find( $request['id'] );
    return rest_ensure_response( $lead );
}

// RICHTIG — Prüfe ob Benutzer Zugriff auf diesen Lead hat
public function get_item( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
    $lead = $this->repo->find( absint( $request['id'] ) );
    if ( ! $lead ) {
        return new \WP_Error( 'not_found', __( 'Lead nicht gefunden.', 'resa' ), [ 'status' => 404 ] );
    }
    // Location-basierter Zugriff
    if ( ! $this->user_can_access_location( $lead->location_id ) ) {
        return new \WP_Error( 'forbidden', __( 'Kein Zugriff.', 'resa' ), [ 'status' => 403 ] );
    }
    return rest_ensure_response( $lead );
}
```

### 10.5 Path Traversal

```php
// FALSCH — Path Traversal möglich
$template = file_get_contents( RESA_PATH . '/templates/' . $_GET['template'] );

// RICHTIG — Whitelist + validate_file()
$allowed = [ 'lead-email.php', 'pdf-report.php', 'notification.php' ];
$template_name = sanitize_file_name( $_GET['template'] ?? '' );

if ( ! in_array( $template_name, $allowed, true ) ) {
    wp_die( 'Invalid template.' );
}

$path = RESA_PATH . '/templates/' . $template_name;
if ( 0 !== validate_file( $path ) ) {
    wp_die( 'Invalid file path.' );
}
$template = file_get_contents( $path );
```

### 10.6 Open Redirect

```php
// FALSCH — Open Redirect
wp_redirect( $_GET['redirect_to'] );

// RICHTIG — wp_safe_redirect() erlaubt nur lokale URLs
wp_safe_redirect( esc_url_raw( wp_unslash( $_GET['redirect_to'] ?? '' ) ) );
exit;
```

---

## 11. Quick Reference Tables

### Sanitization Quick Reference

| Input-Typ | Funktion | Beispiel |
|---|---|---|
| Text (einzeilig) | `sanitize_text_field()` | Name, Titel |
| Text (mehrzeilig) | `sanitize_textarea_field()` | Notizen, Beschreibung |
| E-Mail | `sanitize_email()` | Kontakt-E-Mail |
| URL (DB) | `esc_url_raw()` | Website-URL |
| URL (Anzeige) | `esc_url()` | Link-href |
| Dateiname | `sanitize_file_name()` | Upload-Name |
| CSS-Klasse | `sanitize_html_class()` | Dynamic Class |
| Slug/Key | `sanitize_key()` | Option-Key, Meta-Key |
| Integer (positiv) | `absint()` | ID, Zähler |
| Float | `floatval()` + `abs()` | Preis, Fläche |
| Boolean | `(bool)` / `rest_sanitize_boolean()` | Checkbox |
| HTML (eingeschränkt) | `wp_kses( $input, $tags )` | Formattierter Text |
| HTML (Post-Level) | `wp_kses_post()` | E-Mail-Template |
| Array/JSON | `wp_json_encode()` / `json_decode()` + einzeln sanitizen | Form-Daten |

### Escaping Quick Reference

| Ausgabe-Kontext | Funktion |
|---|---|
| HTML-Body | `esc_html()` |
| HTML-Attribut | `esc_attr()` |
| URL (href/src) | `esc_url()` |
| JavaScript-String | `esc_js()` (vermeiden, besser `wp_json_encode()`) |
| Textarea | `esc_textarea()` |
| Übersetzung + HTML | `esc_html__()`, `esc_html_e()` |
| Übersetzung + Attribut | `esc_attr__()`, `esc_attr_e()` |
| Kontrolliertes HTML | `wp_kses()`, `wp_kses_post()` |
| SQL | `$wpdb->prepare()` |

### Security Checklist für RESA

- [ ] Alle User-Inputs sanitized (`sanitize_*()`, `wp_unslash()`)
- [ ] Alle Outputs escaped (`esc_*()`)
- [ ] Alle Formulare haben Nonces (`wp_nonce_field()` / `wp_verify_nonce()`)
- [ ] Alle Admin-Aktionen haben Capability-Checks (`current_user_can()`)
- [ ] Alle SQL-Queries mit `$wpdb->prepare()`
- [ ] Alle REST-Routen haben `permission_callback`
- [ ] Alle REST-Args haben `sanitize_callback` und/oder `validate_callback`
- [ ] Keine direkten `$_GET`/`$_POST` Zugriffe ohne Sanitization
- [ ] Keine `echo $variable` ohne Escaping
- [ ] Whitelist-Validation für erlaubte Werte (enum-artig)
- [ ] File-Uploads: MIME-Type Whitelist + `wp_check_filetype()`
- [ ] Redirects: `wp_safe_redirect()` statt `wp_redirect()`
