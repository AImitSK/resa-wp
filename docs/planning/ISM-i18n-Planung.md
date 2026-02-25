# ISM — Internationalisierung (i18n) & Lokalisierung (l10n)

## Sprachstrategie, technische Umsetzung & Übersetzungs-Workflow

---

## 1. Zielsprachen & Locales

ISM ist für den europäischen Immobilienmarkt gedacht. Die Sprachen sind nach Marktgröße und Immobilienwirtschaft priorisiert.

### Phase 1: Launch

```
Sprache          Locale(s)              Markt         Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deutsch          de_DE                  DACH-Kern     ★★★ Entwicklungssprache
                 de_AT                  Österreich    ★★★ (Abweichungen!)
                 de_CH                  Schweiz       ★★★ (Abweichungen!)
Englisch         en_US                  Fallback      ★★★ WordPress-Standard
                 en_GB                  UK/Irland     ★★★
```

**Deutsch ist die Entwicklungssprache.** Alle Strings werden zuerst auf Deutsch geschrieben und dann übersetzt — das ist ungewöhnlich für WordPress-Plugins (normalerweise en_US), aber richtig für ISM, weil:
- Der Kernmarkt DACH ist
- Immobilien-Fachbegriffe auf Deutsch gedacht werden
- Die Qualität der deutschen Texte am wichtigsten ist

**Englisch (en_US) ist der gettext-Fallback.** WordPress erwartet englische Quellstrings. Wir lösen das so:

```
Quellcode-Strings:     Englisch (en_US) ← WordPress-Standard
Erste Übersetzung:     Deutsch (de_DE)  ← wird als erstes erstellt
Angezeigte Sprache:    Hängt von WordPress-Einstellung ab
```

### Phase 2: Europäische Expansion (Monat 3-6)

```
Sprache          Locale(s)              Markt         Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Französisch      fr_FR                  Frankreich    ★★
                 fr_BE                  Belgien       ★★
Niederländisch   nl_NL                  Niederlande   ★★
                 nl_BE                  Belgien       ★★
Spanisch         es_ES                  Spanien       ★★
Italienisch      it_IT                  Italien       ★★
```

### Phase 3: Weitere Märkte (Monat 6-12)

```
Sprache          Locale(s)              Markt         Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portugiesisch    pt_PT                  Portugal      ★
Polnisch         pl_PL                  Polen         ★
Schwedisch       sv_SE                  Schweden      ★
Dänisch          da_DK                  Dänemark      ★
Norwegisch       nb_NO                  Norwegen      ★
Tschechisch      cs_CZ                  Tschechien    ★
```

### DACH-Varianten: Was weicht ab?

Deutsch ist nicht gleich Deutsch. Für Immobilien gibt es relevante Unterschiede:

```
Begriff / Konzept          de_DE             de_AT              de_CH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Grunderwerbsteuer          3,5 - 6,5%        3,5%               Handänderungssteuer
                                                                (kantonal 0-3,3%)
Notar                      Notar             Notar              Notar (kantonal)
Maklerprovision            3-7% + MwSt       3% + 20% USt       ~2-3% + MWST
Mehrwertsteuer             MwSt (19%)        USt (20%)          MWST (8,1%)
Mietrecht                  BGB + MietR       MRG / ABGB         OR
Mietspiegel                Mietspiegel       Richtwertmiete     Referenzzinssatz
Wohnung / Stockwerk        1. OG             1. Stock           1. Obergeschoss
Makler                     Makler            Makler             Makler / Mäkler
Grundbuch                  Grundbuch         Grundbuch          Grundbuch
Nebenkosten                Nebenkosten       Betriebskosten     Nebenkosten
Kaution                    Kaution           Kaution            Depot / Kaution
Währung                    EUR               EUR                CHF
```

**Konsequenz:** de_AT und de_CH sind NICHT einfach Kopien von de_DE. Sie brauchen eigene Übersetzungen, mindestens für Fachbegriffe und rechtliche Texte. Zusätzlich brauchen die Rechner länderspezifische Standardwerte (Steuersätze, Provisionssätze etc.).

---

## 2. Was muss übersetzt werden? — Die 5 Übersetzungsschichten

ISM hat nicht nur eine Textschicht, sondern **fünf verschiedene**, die jeweils anders behandelt werden:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  SCHICHT 1: Plugin-Admin (Backend)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                              │
│  Menü-Labels, Dashboard-Texte, Einstellungen,                   │
│  Button-Beschriftungen, Hinweise, Fehlermeldungen               │
│                                                                 │
│  Methode: WordPress gettext (__(), _e(), _x() etc.)             │
│  Dateien: .pot / .po / .mo                                      │
│  Übersetzer: Entwickler + Community                             │
│                                                                 │
│  Beispiele:                                                     │
│  __( 'Leads', 'ism' )                                           │
│  __( 'No leads found.', 'ism' )                                 │
│  __( 'Save Settings', 'ism' )                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHICHT 2: Frontend-Widget (Besucherseite)                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│  Fragen, Labels, Platzhalter, Buttons, Ergebnis-Texte,          │
│  Fortschrittsanzeige, Validierungsmeldungen                     │
│                                                                 │
│  Methode: WordPress gettext + JavaScript i18n (wp.i18n)         │
│  Dateien: .pot / .po / .mo + .json (für JS)                     │
│  Qualität: HÖCHSTE Priorität — der Besucher sieht nur das       │
│                                                                 │
│  Beispiele:                                                     │
│  __( 'What type of property do you own?', 'ism' )               │
│  __( 'Living area in m²', 'ism' )                               │
│  __( 'Show my results', 'ism' )                                 │
│  __( 'Your estimated rent:', 'ism' )                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHICHT 3: E-Mail-Vorlagen                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━                                    │
│  Betreffzeilen, E-Mail-Body, CTA-Buttons                        │
│                                                                 │
│  Methode: In DB gespeicherte Templates pro Sprache              │
│  NICHT gettext — weil der Makler sie bearbeiten können muss     │
│  Standard-Vorlagen werden beim Aktivieren einer Sprache          │
│  aus vordefinierten Übersetzungen eingefügt                     │
│                                                                 │
│  Beispiele:                                                     │
│  Betreff: "Ihre persönliche Mietpreisanalyse"                   │
│  Betreff: "Your Personal Rent Analysis"                         │
│  Betreff: "Votre analyse personnalisée du loyer"                │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHICHT 4: PDF-Ergebnisdokumente                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                                │
│  Deckblatt-Titel, Überschriften, Disclaimer,                    │
│  Handlungsempfehlung (Makler-editierbar), Fußzeile              │
│                                                                 │
│  Methode: Hybrid                                                │
│  — Strukturtexte: gettext (Überschriften, Labels)               │
│  — Makler-Texte: DB-Felder pro Sprache                          │
│  — Zahlenformat: locale-abhängig (1.234,56 vs 1,234.56)         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHICHT 5: Regionale Daten & Berechnungen                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    │
│  Steuersätze, Provisionssätze, Mietrecht-Regeln,                │
│  Währung, Maßeinheiten                                          │
│                                                                 │
│  Methode: NICHT Übersetzung, sondern Konfiguration              │
│  Wird über Locations gelöst — jedes Land/Region hat             │
│  eigene Datensätze mit länderspezifischen Werten                │
│                                                                 │
│  Beispiele:                                                     │
│  Deutschland: Grunderwerbsteuer 3,5-6,5%, EUR, m²               │
│  Schweiz: Handänderungssteuer 0-3,3%, CHF, m²                   │
│  UK: Stamp Duty 0-12%, GBP, sq ft                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technische Umsetzung

### 3.1 Text Domain

```
Text Domain:   ism
Domain Path:   /languages
```

**Plugin-Header:**
```php
/**
 * Plugin Name: ISM — Immobilien Smart Assets
 * Description: Lead magnets for real estate agents
 * Text Domain: ism
 * Domain Path: /languages
 * Requires at least: 6.0
 */
```

### 3.2 Gettext-Funktionen — Welche, wann, warum?

```
Funktion                    Verwendung                          Beispiel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
__( $text, 'ism' )          Gibt übersetzten String zurück       $label = __( 'Leads', 'ism' );

_e( $text, 'ism' )          Echo übersetzten String              _e( 'Save', 'ism' );

_x( $text, $ctx, 'ism' )    Mit Kontext (disambiguierung)        _x( 'Post', 'noun', 'ism' );
                                                                 _x( 'Post', 'verb', 'ism' );

_n( $s, $p, $n, 'ism' )     Singular/Plural                     sprintf(
                                                                   _n( '%d lead', '%d leads',
                                                                       $count, 'ism' ), $count );

_nx( $s, $p, $n, $ctx,      Singular/Plural + Kontext           _nx( '%d result', '%d results',
     'ism' )                                                        $count, 'search', 'ism' );

esc_html__()                 HTML-escaped Übersetzung             esc_html__( 'Settings', 'ism' )
esc_html_e()                 HTML-escaped Echo                    esc_html_e( 'Delete', 'ism' )
esc_attr__()                 Attribut-escaped                     esc_attr__( 'Search', 'ism' )

wp_sprintf()                 Localized sprintf                    wp_sprintf(
                                                                   __( '%1$s to %2$s', 'ism' ),
                                                                   $min, $max );
```

### 3.3 Coding-Regeln für Entwickler

**IMMER tun:**

```php
// ✅ Literaler Text Domain
__( 'Settings', 'ism' )

// ✅ Vollständige Sätze
__( 'No leads found for this period.', 'ism' )

// ✅ Platzhalter statt Konkatenation
sprintf( __( 'Your rent is %s per month.', 'ism' ), $rent )

// ✅ Kontext bei mehrdeutigen Begriffen
_x( 'Location', 'real estate area', 'ism' )
_x( 'Location', 'GPS coordinates', 'ism' )

// ✅ Übersetzer-Hinweis bei Platzhaltern
/* translators: %s: city name */
sprintf( __( 'Rent analysis for %s', 'ism' ), $city_name )

// ✅ Zahlen locale-gerecht formatieren
number_format_i18n( $price, 2 )

// ✅ Datum locale-gerecht formatieren
date_i18n( get_option( 'date_format' ), $timestamp )

// ✅ Escaping bei Ausgabe
esc_html_e( 'Save Settings', 'ism' );
echo '<a href="#">' . esc_html__( 'Learn more', 'ism' ) . '</a>';
```

**NIEMALS tun:**

```php
// ❌ Variable als Text Domain
$domain = 'ism';
__( 'Settings', $domain )   // Parser findet es nicht!

// ❌ String-Konkatenation
__( 'Your rent is ' ) . $rent . __( ' per month' )

// ❌ HTML in Übersetzungsstrings
__( '<strong>Important:</strong> Please enter...' )
// → Stattdessen:
sprintf( '<strong>%s</strong> %s',
    __( 'Important:', 'ism' ),
    __( 'Please enter your email.', 'ism' )
)

// ❌ Leere Strings übersetzen
__( '', 'ism' )

// ❌ Nur ein Wort ohne Kontext
__( 'Post', 'ism' )   // → Was? Blogbeitrag? Abschicken?
_x( 'Post', 'submit button', 'ism' )  // ✅ So!
```

### 3.4 JavaScript i18n (Frontend-Widgets)

ISM-Widgets laufen im Frontend mit JavaScript. WordPress bietet seit 5.0 eine JS-i18n-Lösung:

**Registrierung in PHP:**
```php
wp_register_script(
    'ism-frontend',
    ISM_PLUGIN_URL . 'assets/js/frontend.js',
    array( 'wp-i18n' ),    // ← Abhängigkeit
    ISM_VERSION,
    true
);

wp_set_script_translations(
    'ism-frontend',         // Handle
    'ism',                  // Text Domain
    ISM_PLUGIN_DIR . 'languages'  // Pfad
);
```

**Verwendung in JavaScript:**
```javascript
const { __, _x, _n, sprintf } = wp.i18n;

// Einfache Übersetzung
const title = __( 'Your Results', 'ism' );

// Mit Platzhalter
const msg = sprintf(
    /* translators: %s: formatted price range */
    __( 'Estimated rent: %s per month', 'ism' ),
    priceRange
);

// Plural
const leadMsg = sprintf(
    _n( '%d new lead', '%d new leads', count, 'ism' ),
    count
);
```

**JSON-Dateien generieren:**
```bash
# Erzeugt .json-Dateien für JS-Strings
wp i18n make-json languages/ --no-purge
```

Ergebnis: `ism-de_DE-<hash>.json` — wird automatisch von `wp_set_script_translations()` geladen.

### 3.5 Dateistruktur

```
ism/
├── ism.php                     ← Plugin-Hauptdatei mit Header
├── languages/
│   ├── ism.pot                 ← Template (Quell-Strings, en_US)
│   │
│   ├── ism-de_DE.po            ← Deutsch (Deutschland)
│   ├── ism-de_DE.mo            ← Kompiliert
│   ├── ism-de_DE-<hash>.json   ← JS-Strings
│   │
│   ├── ism-de_AT.po            ← Deutsch (Österreich)
│   ├── ism-de_AT.mo
│   ├── ism-de_AT-<hash>.json
│   │
│   ├── ism-de_CH.po            ← Deutsch (Schweiz)
│   ├── ism-de_CH.mo
│   ├── ism-de_CH-<hash>.json
│   │
│   ├── ism-en_GB.po            ← Englisch (UK)
│   ├── ism-en_GB.mo
│   ├── ism-en_GB-<hash>.json
│   │
│   ├── ism-fr_FR.po            ← Französisch
│   ├── ism-fr_FR.mo
│   ├── ism-fr_FR-<hash>.json
│   │
│   ├── ism-es_ES.po            ← Spanisch
│   ├── ism-es_ES.mo
│   ├── ism-es_ES-<hash>.json
│   │
│   ├── ism-nl_NL.po            ← Niederländisch
│   ├── ism-nl_NL.mo
│   ├── ism-nl_NL-<hash>.json
│   │
│   ├── ism-it_IT.po            ← Italienisch
│   ├── ism-it_IT.mo
│   └── ism-it_IT-<hash>.json
│
├── assets/
│   └── js/
│       └── frontend.js         ← Enthält wp.i18n Aufrufe
│
└── includes/
    └── class-ism-i18n.php      ← Sprachladung
```

### 3.6 Sprachladung

```php
// includes/class-ism-i18n.php

class ISM_i18n {

    public function load_textdomain() {
        load_plugin_textdomain(
            'ism',
            false,
            dirname( plugin_basename( __FILE__ ) ) . '/../languages'
        );
    }
}

// In ism.php (Haupt-Plugin):
add_action( 'init', array( new ISM_i18n(), 'load_textdomain' ) );
```

WordPress prüft automatisch auch `/wp-content/languages/plugins/ism-{locale}.mo` — dort landen Übersetzungen von translate.wordpress.org.

---

## 4. Übersetzungs-Workflow

### 4.1 POT-Datei generieren

Bei jedem Release oder String-Änderung:

```bash
# Mit WP-CLI
wp i18n make-pot ./wp-content/plugins/ism \
    ./wp-content/plugins/ism/languages/ism.pot \
    --domain=ism \
    --exclude=node_modules,vendor,tests

# Zusätzlich: JSON für JS-Strings
wp i18n make-json ./wp-content/plugins/ism/languages/ \
    --no-purge
```

### 4.2 Übersetzung erstellen

**Option A: Poedit (Lokal)**
```
1. Poedit öffnen → "Neue Übersetzung aus POT"
2. ism.pot auswählen → Zielsprache wählen (z.B. fr_FR)
3. Strings übersetzen
4. Speichern → erzeugt ism-fr_FR.po + ism-fr_FR.mo
5. Dateien in /languages/ ablegen
```

**Option B: translate.wordpress.org (Community)**
```
1. Plugin auf WordPress.org listen
2. Community übersetzt über GlotPress-Interface
3. Übersetzungen werden automatisch ausgeliefert
4. Kein manuelles Dateien-Handling nötig
```

**Option C: Professionelle Übersetzung**
```
1. POT-Datei an Übersetzungsdienstleister senden
2. Dienstleister liefert PO-Dateien zurück
3. MO-Dateien kompilieren: msgfmt ism-fr_FR.po -o ism-fr_FR.mo
4. In Plugin-Release einschließen
```

### 4.3 Übersetzung aktualisieren (bei neuen Strings)

```bash
# 1. Neues POT generieren
wp i18n make-pot . languages/ism.pot --domain=ism

# 2. Bestehende PO-Dateien aktualisieren (mergen)
wp i18n update-po languages/ism.pot languages/

# → Neue Strings werden als "fuzzy" (unübersetzt) markiert
# → Bestehende Übersetzungen bleiben erhalten
# → Gelöschte Strings werden entfernt

# 3. Übersetzer bearbeitet nur die neuen/fuzzy Strings

# 4. MO-Dateien kompilieren
wp i18n make-mo languages/

# 5. JSON für JS neu generieren
wp i18n make-json languages/ --no-purge
```

---

## 5. E-Mail-Vorlagen & PDF: Sprach-Handling

E-Mail-Vorlagen und PDF-Texte werden **nicht** über gettext übersetzt, weil der Makler sie bearbeiten können muss. Stattdessen:

### E-Mail-Vorlagen: Sprachvarianten in der Datenbank

```
┌─────────────────────────────────────────────────────────────────┐
│  E-Mail-Vorlage: Ergebnis-Mail (Mietpreis-Kalkulator)          │
│                                                                 │
│  Sprache: [▼ Deutsch (Deutschland)  ]                           │
│                                                                 │
│  Betreff: [Ihre persönliche Mietpreisanalyse              ]     │
│                                                                 │
│  Inhalt:                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Guten Tag {{vorname}} {{nachname}},                     │    │
│  │                                                         │    │
│  │ vielen Dank für Ihre Anfrage. Anbei erhalten Sie        │    │
│  │ Ihre persönliche Mietpreisanalyse für {{city}}.         │    │
│  │                                                         │    │
│  │ {{ergebnis_block}}                                      │    │
│  │                                                         │    │
│  │ Mit freundlichen Grüßen                                 │    │
│  │ {{makler_signatur}}                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Verfügbare Sprachen:                                           │
│  ✅ Deutsch (DE)  ✅ Englisch  ☐ Französisch  ☐ Spanisch       │
│                                                                 │
│  [Vorlage von anderer Sprache kopieren ▼]                       │
│  [Speichern]  [Vorschau]                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Sprachauswahl-Logik:** Welche E-Mail-Sprache bekommt der Lead?

```
1. Prüfe: Hat der Besucher eine Sprache gewählt? (lang= im Shortcode)
2. Prüfe: In welcher Sprache war die Website? (WordPress locale)
3. Fallback: Standard-Sprache des Maklers
```

### PDF-Dokumente: Gemischte Quellen

```
PDF-Inhalt              Quelle                    Sprache kommt von
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"Mietpreisanalyse"      gettext                   Automatisch (locale)
"für Maria Schmidt"     Lead-Daten                Nutzereingabe
"24.02.2026"            date_i18n()               Automatisch (locale)
"Kernergebnis"          gettext                   Automatisch (locale)
"714 € — 833 €"        number_format_i18n()       Automatisch (locale)
Handlungsempfehlung     DB (Makler-Text)          Makler wählt Sprache
"Über uns"              DB (Makler-Text)          Makler wählt Sprache
Disclaimer              gettext                   Automatisch (locale)
Fußzeile                DB (Basis-Layout)         Makler konfiguriert
```

---

## 6. Zahlen, Währungen, Maßeinheiten

### Zahlenformate nach Locale

```
Locale    Tausender    Dezimal     Beispiel
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
de_DE     .            ,           1.234,56 €
de_CH     '            .           1'234.56 CHF
en_US     ,            .           $1,234.56
en_GB     ,            .           £1,234.56
fr_FR     (Leer)       ,           1 234,56 €
es_ES     .            ,           1.234,56 €
nl_NL     .            ,           € 1.234,56
it_IT     .            ,           1.234,56 €
```

**Umsetzung:**
```php
// WordPress-eigene Funktion (nutzt locale)
number_format_i18n( 1234.56, 2 );
// de_DE → "1.234,56"
// en_US → "1,234.56"

// Für Währung: eigene Hilfsfunktion
function ism_format_currency( $amount, $currency = null ) {
    if ( ! $currency ) {
        $currency = ism_get_location_currency();
    }

    $formatted = number_format_i18n( $amount, 2 );

    $position = ism_get_currency_position( $currency );
    // de_DE: "1.234,56 €"  (nach Zahl)
    // en_US: "$1,234.56"   (vor Zahl)
    // nl_NL: "€ 1.234,56"  (vor Zahl mit Leer)

    return $position === 'before'
        ? $currency . $formatted
        : $formatted . ' ' . $currency;
}
```

### Währungen pro Land

```
Land             Währung    Symbol    ISO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deutschland      Euro       €         EUR
Österreich       Euro       €         EUR
Schweiz          Franken    CHF       CHF
UK               Pfund      £         GBP
Frankreich       Euro       €         EUR
Niederlande      Euro       €         EUR
Spanien          Euro       €         EUR
Italien          Euro       €         EUR
Schweden         Krone      kr        SEK
Polen            Zloty      zł        PLN
Tschechien       Krone      Kč        CZK
Dänemark         Krone      kr        DKK
```

**Wo konfiguriert?** In der Location — jede Location hat ein Feld `waehrung`. Wird bei der Erstellung vorgeschlagen basierend auf dem Land.

### Maßeinheiten

```
Region          Fläche     Grundstück
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kontinental-EU  m²         m²
UK / Irland     sq ft      acres
```

**Umsetzung:** Lokale Variable pro Location, Frontend zeigt die richtige Einheit an. Umrechnung bei Bedarf im Backend.

---

## 7. Shortcode-Parameter: Sprache

Der Shortcode unterstützt einen optionalen `lang`-Parameter:

```
[ism type="mietpreis" city="bad-oeynhausen"]
→ Sprache = WordPress-Seitensprache (automatisch)

[ism type="mietpreis" city="bad-oeynhausen" lang="en"]
→ Sprache = Englisch (explizit)
```

**Warum?** Multilinguale WordPress-Seiten (mit WPML, Polylang etc.) brauchen das normalerweise nicht — die ändern das globale Locale. Aber für Edge-Cases (z.B. englischer Rechner auf deutscher Seite für Expats) ist der Parameter nützlich.

---

## 8. Übersetzungs-Vollständigkeit tracken

### Dashboard-Anzeige für den Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Sprachen                                       │
│                                                                 │
│  Aktive Sprachen:                                               │
│                                                                 │
│  Sprache              Plugin-UI    E-Mail-Vorlagen    PDF       │
│  ─────────────────────────────────────────────────────────────  │
│  🇩🇪 Deutsch (DE)      100%         ✅ 3/3 Vorlagen   ✅       │
│  🇦🇹 Deutsch (AT)       97%         ✅ 3/3 Vorlagen   ✅       │
│  🇨🇭 Deutsch (CH)       95%         ✅ 3/3 Vorlagen   ✅       │
│  🇬🇧 English (UK)      100%         ✅ 3/3 Vorlagen   ✅       │
│  🇺🇸 English (US)      100%         ✅ 3/3 Vorlagen   ✅       │
│  🇫🇷 Français           85%         ☐ 0/3 Vorlagen   ☐        │
│  🇪🇸 Español            72%         ☐ 0/3 Vorlagen   ☐        │
│  🇳🇱 Nederlands         68%         ☐ 0/3 Vorlagen   ☐        │
│                                                                 │
│  ⚠ Unvollständige Sprachen zeigen englische Fallback-Texte     │
│                                                                 │
│  [+ Sprache hinzufügen]                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. String-Inventar: Geschätzter Umfang

```
Bereich                           Geschätzte Strings
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plugin-Admin (Backend)
  Dashboard                       ~30
  Lead-Verwaltung                 ~50
  Kommunikation                   ~40
  PDF-Designer                    ~30
  Locations                       ~25
  Einstellungen                   ~60
  Integrationen                   ~35
  Shortcode-Generator             ~15
  Fehlermeldungen                 ~40
  Validierung                     ~20
                                  ─────
  Subtotal Admin:                 ~345 Strings

Frontend-Widgets
  Mietpreis-Kalkulator            ~45
  Immobilienwert-Kalkulator       ~50
  Kaufnebenkosten-Rechner         ~35
  Budgetrechner                   ~40
  (weitere Assets × ~40)          ~560
  Gemeinsame Strings              ~30
  Lead-Formular                   ~15
  Ergebnis-Seite                  ~20
                                  ─────
  Subtotal Frontend:              ~795 Strings

E-Mail-Vorlagen
  Pro Asset: ~3 Vorlagen          ~60 Vorlagen
  Pro Vorlage: ~8-15 Strings      ~600 (in DB, nicht gettext)
                                  ─────
  Subtotal E-Mail:                ~600 (DB-basiert)

PDF-Texte (gettext-Anteil)
  Strukturtexte                   ~50
                                  ─────
  Subtotal PDF:                   ~50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GESAMT gettext (.pot):            ~1.190 Strings
GESAMT DB-basiert:                ~600 Vorlagen-Strings
```

**Pro Sprache:** ca. 1.190 gettext-Strings + 600 DB-Vorlagen = ~1.790 zu übersetzen.

---

## 10. Build-Prozess & CI

### Release-Checkliste (Sprachbezogen)

```
☐  1. wp i18n make-pot generieren (neue Strings?)
☐  2. wp i18n update-po ausführen (bestehende POs mergen)
☐  3. Fuzzy/unübersetzte Strings prüfen
☐  4. Übersetzer informieren (wenn neue Strings)
☐  5. PO-Dateien zurückerhalten
☐  6. wp i18n make-mo kompilieren
☐  7. wp i18n make-json generieren (JS-Strings)
☐  8. Alle Dateien in /languages/ committen
☐  9. Kurz-Test: WordPress auf de_DE, en_GB, fr_FR prüfen
☐ 10. Release
```

### Automatisierung (Composer/NPM Script)

```json
// package.json
{
  "scripts": {
    "i18n:pot": "wp i18n make-pot . languages/ism.pot --domain=ism --exclude=node_modules,vendor",
    "i18n:update": "wp i18n update-po languages/ism.pot languages/",
    "i18n:mo": "wp i18n make-mo languages/",
    "i18n:json": "wp i18n make-json languages/ --no-purge",
    "i18n:build": "npm run i18n:pot && npm run i18n:update && npm run i18n:mo && npm run i18n:json"
  }
}
```

Ein einziger Befehl: `npm run i18n:build` — fertig.

---

## 11. Zusammenfassung

```
┌─────────────────────────────────────────────────────────────────┐
│  ISM i18n auf einen Blick                                       │
│                                                                 │
│  Entwicklungssprache:   Deutsch                                 │
│  Quellstrings (POT):    Englisch (WordPress-Standard)           │
│  Text Domain:           ism                                     │
│  Methode:               WordPress gettext + wp.i18n (JS)        │
│  Dateien:               .pot → .po → .mo + .json                │
│                                                                 │
│  Phase 1:  de_DE, de_AT, de_CH, en_US, en_GB                   │
│  Phase 2:  fr_FR, nl_NL, es_ES, it_IT                          │
│  Phase 3:  pt_PT, pl_PL, sv_SE, da_DK, nb_NO, cs_CZ           │
│                                                                 │
│  5 Schichten:                                                   │
│  1. Admin-UI        → gettext (.po/.mo)                         │
│  2. Frontend-Widget → gettext + wp.i18n (.json)                 │
│  3. E-Mail-Vorlagen → DB pro Sprache (Makler-editierbar)        │
│  4. PDF-Dokumente   → Hybrid (gettext + DB)                     │
│  5. Regionale Daten → Konfiguration in Locations                │
│                                                                 │
│  Geschätzt:  ~1.190 gettext-Strings + ~600 DB-Vorlagen         │
│  Build:      npm run i18n:build (ein Befehl)                    │
│  Community:  translate.wordpress.org nach WP.org-Listing        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
