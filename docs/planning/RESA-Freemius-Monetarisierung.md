# RESA— Freemius Monetarisierung

## Lizenzmodell, Tiers & Add-ons

---

## 1. Monetarisierungsstrategie

RESA nutzt ein **Hybrid-Modell**: Freemium-Kern (Free → Premium) plus einzeln kaufbare Add-ons für Integrationen. Dieses Modell ist optimal weil:

- **Free** sorgt für Verbreitung über WordPress.org und senkt die Einstiegshürde
- **Premium** bündelt die Kern-Features zu einem attraktiven Paket (höherer Durchschnittspreis als Einzel-Add-ons)
- **Add-ons** für Integrationen sind modular — jeder Makler kauft nur, was er braucht (onOffice ODER Propstack, selten beides)

Abrechnung über **Freemius** — Subscriptions (jährlich), Freemius übernimmt Checkout, Lizenzierung, MwSt/VAT, Rechnungen, Auto-Renewals und Dunning.

---

## 2. Tier-Übersicht

```
┌─────────────┬────────────────────┬────────────────────┐
│    FREE      │     PREMIUM        │     ADD-ONS        │
│    0 €       │     ab 149 €/Jahr  │     ab 49 €/Jahr   │
│              │                    │     (je Add-on)     │
├─────────────┼────────────────────┼────────────────────┤
│ 2 Free-Tools │ Alle 8 Lead Tools  │ Maklersoftware:    │
│ 1 Location   │ Unbegr. Locations  │ · onOffice         │
│ Basis-Lead-  │ Volle Lead-Verwalt.│ · Propstack        │
│ Erfassung    │ PDF-Designer       │ · FLOWFACT         │
│ wp_mail      │ Kommunikation      │                    │
│              │ Makler-Zuordnung   │ Newsletter:        │
│              │ SMTP / Brevo       │ · CleverReach      │
│              │ Webhooks           │ · Brevo            │
│              │ Zapier-ready       │ · Mailchimp        │
│              │ Priority Support   │                    │
│              │                    │ Sonstige:          │
│              │                    │ · HubSpot CRM      │
│              │                    │ · Zapier Pro        │
└─────────────┴────────────────────┴────────────────────┘
```

---

## 3. FREE Tier — Details

**Ziel:** Verbreitung, Sichtbarkeit auf WordPress.org, Vertrauen aufbauen. Der Makler soll RESA installieren, ausprobieren und den Wert erkennen — dann upgraden.

### Enthaltene Features

```
Feature                          Free         Limit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead Tool Module (free)          ✅           2 Module aktiv
Verfügbare Free-Module           ✅           Mietpreis-Kalkulator
                                              + Immobilienwert-Kalkulator
Lead Tool Module (pro)           ❌           Nur Premium
Locations                        ✅           1 Stadt
Einrichtungs-Modus               ✅           Nur Pauschal
Lead-Erfassung                   ✅           Basis (Name, E-Mail)
Lead-Liste im Admin              ✅           Letzte 50 Leads sichtbar
Lead-Export                      ❌
Lead-Detailseiten                ❌
Lead-Status-Workflow             ❌
Makler-Zuordnung                 ❌
Dashboard                        ✅           Basis-KPIs
PDF-Ergebnis per E-Mail          ✅           Standard-Template
                                              (mit RESA-Branding)
PDF-Designer                     ❌
E-Mail-Vorlagen anpassen         ❌           Standard-Vorlage
E-Mail-Versand                   ✅           wp_mail (nur Fallback)
SMTP / Transaktions-Mail         ❌
Kommunikationszentrale           ❌
Versandlog                       ❌
Automationen                     ❌
Shortcode-Generator              ✅
Branding entfernbar              ❌           "Powered by RESA" bleibt
Webhooks                         ❌
Integrationen                    ❌
Support                          Community    WordPress.org Forum
```

### Free-Einschränkungen — Warum genau so?

| Einschränkung | Begründung |
|---|---|
| 2 Free-Tools | Makler kann Mietpreis + Immobilienwert live testen — merkt schnell, dass er auch Kaufnebenkosten etc. will |
| 1 Location | Reicht für einen Standort — wer mehrere Städte bedient, braucht Premium |
| Nur Pauschal-Modus | Schneller Start, aber unpräzise — für eigene Marktdaten braucht er Premium |
| 50 Leads sichtbar | Genug um den Wert zu sehen, zu wenig für echtes Arbeiten |
| Kein Export | Leads sehen, aber nicht rausholen — starker Upgrade-Trigger |
| RESA-Branding | Kostenlose Werbung für RESA, Makler will eigenes Branding |
| wp_mail | Funktioniert, aber landet oft im Spam — SMTP ist Premium |

---

## 4. PREMIUM Tier — Details

**Ziel:** Das vollständige RESA-Erlebnis. Alles was der Makler braucht, um professionell Leads zu generieren, zu verwalten und nachzufassen. Integrationen sind bewusst NICHT enthalten — die kommen als Add-ons.

### Preisstruktur

```
Lizenz               Jährlich        Lifetime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 Website             149 €/Jahr      449 €
3 Websites            249 €/Jahr      699 €
Unlimited             399 €/Jahr      999 €
```

**Warum diese Preise?**
- Immobilienmakler sind B2B-Kunden mit ordentlichen Marketing-Budgets
- Ein einziger vermittelter Lead kann Tausende Euro Provision bringen
- 149 €/Jahr = ca. 12,50 €/Monat — ein Bruchteil dessen was Makler für Portale zahlen
- Lifetime als Upsell für preisbewusste Makler (Amortisation nach ~3 Jahren)

### Enthaltene Features

```
Feature                          Premium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead Tool Module                 ✅ ALLE Module (free + pro)
  [🟢 free] Mietpreis-Kalkulator  ✅ (auch im Free-Plan)
  [🟢 free] Immobilienwert-Kalk.  ✅ (auch im Free-Plan)
  [🔵 pro]  Kaufnebenkosten       ✅
  [🔵 pro]  Budgetrechner         ✅
  [🔵 pro]  Renditerechner        ✅
  [🔵 pro]  Energieeffizienz      ✅
  [🔵 pro]  Verkäufer-Checkliste  ✅
  [🔵 pro]  Käufer-Checkliste     ✅
  (neue Module kommen mit Updates dazu — Zukunft: auch paid Add-ons)

Locations                        ✅ Unbegrenzt
Einrichtungs-Modus               ✅ Pauschal + Individuell
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Lead-Verwaltung
  Lead-Erfassung                 ✅ Alle Felder konfigurierbar
  Lead-Liste                     ✅ Unbegrenzt, Filter, Suche
  Lead-Detailseiten              ✅ Eingaben, Ergebnis, Historie
  Lead-Status-Workflow           ✅ Neu → Kontaktiert → Qualif. → Abgeschl.
  Lead-Export                    ✅ CSV, zeitraum- und feldbasiert
  Lead-Tags                      ✅
  Lead-Notizen                   ✅
  Automatischer Export           ✅ Wöchentlich per E-Mail
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Makler-Zuordnung
  Makler anlegen                 ✅ Unbegrenzt
  Location-basierte Verteilung   ✅
  Round-Robin                    ✅
  Makler-Benachrichtigung        ✅
  Makler-spezifische PDFs        ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PDF-System
  PDF-Ergebnis per E-Mail        ✅ Ohne RESA-Branding
  PDF-Designer (Basis-Layout)    ✅ Logo, Farben, Fußzeile
  PDF-Designer (Asset-Vorlagen)  ✅ Bausteine, Drag & Drop
  Über-uns-Seite im PDF          ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kommunikation
  E-Mail-Vorlagen (anpassbar)    ✅ Pro Asset + global
  SMTP-Server                    ✅ Eigener SMTP
  Transaktions-Mail-Dienst       ✅ Brevo SMTP-Relay (eingebaut)
  Versandlog                     ✅ Status, Öffnungen, Klicks
  SPF/DKIM/DMARC-Check           ✅
  Automationen                   ✅ Ergebnis-Mail, Follow-Up, DOI
  Test-Mail-Funktion             ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dashboard                        ✅ Vollständig (KPIs, Trends, Top-Assets)
Shortcode-Generator              ✅ Visueller Builder + Vorschau
Branding                         ✅ Eigenes Branding / RESA entfernbar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Universal-Integrationen
  Custom Webhooks                ✅ POST an beliebige URL
  Zapier (Basic)                 ✅ Webhook-Trigger für Zapier
  Make / Integromat              ✅ Webhook-kompatibel
  REST API (RESA als Quelle)      ✅ Andere Tools lesen RESA-Daten
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Support                          ✅ E-Mail-Support (24–48h)
Updates                          ✅ Alle Updates + neue Assets
```

### Was NICHT in Premium enthalten ist

Native Integrationen zu Drittanbieter-Systemen — diese sind Add-ons, weil:
- Jeder Makler nutzt ein anderes CRM / Newsletter-Tool
- Die Pflege von API-Anbindungen ist aufwändig (API-Änderungen, Authentifizierung)
- Add-on-Erlöse finanzieren die laufende Wartung der jeweiligen Integration
- Der Makler zahlt nur für das, was er tatsächlich nutzt

---

## 5. ADD-ONS — Details

Add-ons sind eigenständige Plugins die RESA Premium voraussetzen. Jedes Add-on wird separat über Freemius lizenziert und aktualisiert.

### Voraussetzung

```
⚠ Alle Add-ons erfordern eine aktive RESA Premium-Lizenz.
  Add-ons sind NICHT mit der Free-Version kompatibel.
```

### Preisstruktur Add-ons

```
Kategorie          Add-on              1 Site/Jahr    Lifetime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Maklersoftware     onOffice             79 €/Jahr     229 €
                   Propstack            79 €/Jahr     229 €
                   FLOWFACT             79 €/Jahr     229 €
                   FIO Webmakler        79 €/Jahr     229 €

Newsletter         CleverReach          49 €/Jahr     149 €
                   Brevo Newsletter     49 €/Jahr     149 €
                   Mailchimp            49 €/Jahr     149 €
                   rapidmail            49 €/Jahr     149 €

CRM (generisch)    HubSpot CRM          49 €/Jahr     149 €
                   Pipedrive            49 €/Jahr     149 €

Benachrichtigung   Slack Notifications  29 €/Jahr      89 €
                   MS Teams Notific.    29 €/Jahr      89 €
```

### Warum 79 € für Maklersoftware, 49 € für Newsletter?

| Preispunkt | Begründung |
|---|---|
| **79 €** Maklersoftware | Höchster Wert: Lead fließt direkt ins CRM des Maklers, spart täglich manuelle Arbeit. Komplexere API (HMAC, Feldmapping, Aktivitäten). Höhere Wartungskosten. |
| **49 €** Newsletter | Mittlerer Wert: Lead wird in Newsletter-Liste aufgenommen + getaggt. Einfachere APIs, weniger Wartung. |
| **29 €** Benachrichtigung | Geringster Wert: Reine Notification, wenig Komplexität. Impulskauf-Preis. |

### Bundles (Freemius-Feature)

Für Makler die mehrere Add-ons brauchen, bieten wir Bundles mit Rabatt:

```
Bundle                  Enthält                           Preis/Jahr   Ersparnis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Starter-Bundle          Premium + 1 Maklersoftware        199 €/Jahr    -29 €
                        + 1 Newsletter

Profi-Bundle            Premium + 1 Maklersoftware        249 €/Jahr    -56 €
                        + 1 Newsletter + Slack

All-in-One              Premium + ALLE Add-ons            499 €/Jahr   ~-200 €
```

---

## 6. Add-on-Details: Maklersoftware

### Add-on: onOffice

```
Name:           RESA für onOffice
Slug:           resa-onoffice
Voraussetzung:  RESA Premium (aktiv)
Preis:          79 €/Jahr (1 Site)
```

**Was es tut:**
- Erstellt bei jedem neuen Lead automatisch eine Adresse in onOffice
- Überträgt alle Lead-Daten: Name, E-Mail, Telefon, Quelle, Einwilligung
- Schreibt Asset-Eingaben und Ergebnis als Notiz / Aktivitäts-Log
- Setzt konfigurierbare Tags (z.B. "RESA-Lead", "Vermieter", Stadtname)
- Optional: Aufgabe für zuständigen Makler erstellen
- Feldmapping konfigurierbar (RESA-Feld → onOffice-Feld)
- Nutzt offizielles onOffice PHP-SDK
- Verbindungstest + Testlead-Funktion im Admin

**Einrichtung im Admin:**
- API-Token + Secret eingeben
- Feldmapping prüfen / anpassen
- Tags konfigurieren
- Verbindung testen
- Fertig — ca. 5 Minuten

---

### Add-on: Propstack

```
Name:           RESA für Propstack
Slug:           resa-propstack
Voraussetzung:  RESA Premium (aktiv)
Preis:          79 €/Jahr (1 Site)
```

**Was es tut:**
- Erstellt bei jedem neuen Lead einen Kontakt in Propstack
- Überträgt alle Lead-Daten + Asset-Kontext
- Nutzt Propstack-Webhooks für bidirektionalen Austausch
- Schreibt Notiz mit Ergebnis-Zusammenfassung
- Setzt Tags und benutzerdefinierte Felder
- Feldmapping konfigurierbar

---

### Add-on: FLOWFACT

```
Name:           RESA für FLOWFACT
Slug:           resa-flowfact
Voraussetzung:  RESA Premium (aktiv)
Preis:          79 €/Jahr (1 Site)
```

**Was es tut:**
- Erstellt bei jedem neuen Lead einen Kontakt in FLOWFACT
- Überträgt alle Lead-Daten + Asset-Kontext
- Erstellt Aktivitäts-Eintrag
- Setzt Tags
- Nutzt FLOWFACT REST-API mit API-Key
- Microsoft365-Kalender-Integration (wenn vom Makler gewünscht)

---

## 7. Add-on-Details: Newsletter

### Add-on: CleverReach

```
Name:           RESA für CleverReach
Slug:           resa-cleverreach
Voraussetzung:  RESA Premium (aktiv)
Preis:          49 €/Jahr (1 Site)
```

**Was es tut:**
- Fügt jeden bestätigten Lead (nach DOI) als Empfänger in CleverReach ein
- Weist ihn einer konfigurierbaren Liste / Gruppe zu
- Setzt automatische Tags: Asset-Typ, Stadt, Zielgruppe, "resa-lead"
- Kann CleverReach-Automation triggern (z.B. Willkommens-Sequenz)
- Prüft auf Duplikate (aktualisiert statt doppelt anlegen)
- Respektiert Abmeldungen (Sync zurück zu RESA)

---

### Add-on: Brevo Newsletter

```
Name:           RESA für Brevo
Slug:           resa-brevo-newsletter
Voraussetzung:  RESA Premium (aktiv)
Preis:          49 €/Jahr (1 Site)
```

**Hinweis:** Dies ist das Newsletter-Add-on für Brevo. Der Brevo-SMTP-Relay für den Transaktions-E-Mail-Versand ist bereits in RESA Premium enthalten. Das Add-on ergänzt die Newsletter-Funktionalität (Listen, Tags, Automationen).

**Was es tut:**
- Fügt Leads als Kontakte in Brevo-Listen ein
- Setzt Attribute und Tags für Segmentierung
- Kann Brevo-Automations-Workflows triggern
- Duplikat-Erkennung und -Aktualisierung

---

### Add-on: Mailchimp

```
Name:           RESA für Mailchimp
Slug:           resa-mailchimp
Voraussetzung:  RESA Premium (aktiv)
Preis:          49 €/Jahr (1 Site)
```

**Was es tut:**
- Fügt Leads als Subscriber in Mailchimp-Audiences ein
- Setzt Tags für Segmentierung
- Merge Fields werden mit Asset-Daten befüllt
- Kann Mailchimp-Automationen triggern
- Hinweis an Nutzer: DSGVO-Bedenken bei US-Hosting

---

## 8. Freemius-Konfiguration

### Produkt-Setup in Freemius

```
Produkt:        RESA— Immobilien Smart Assets
Typ:            WordPress Plugin
Modell:         Freemium + Add-ons
Repository:     WordPress.org (Free-Version)

Pläne:
━━━━━━
Plan 1: Free
  - ID: free
  - Features: 1 Asset, 1 Location, Basis-Leads, wp_mail
  - Support: Forum

Plan 2: Premium
  - ID: premium
  - Billing: Annual + Lifetime
  - Preise: s. Abschnitt 4
  - Features: Alle Assets, unbegr. Locations, PDF-Designer,
              Kommunikation, Webhooks, Makler-Zuordnung
  - Support: E-Mail (24-48h)
  - Trial: 14 Tage kostenlos (Kreditkarte optional)

Add-ons:
━━━━━━━━
Jedes Add-on = eigenes Freemius-Produkt mit eigenem Plan.
Requires: RESA Premium (active license check via Freemius API)
```

### SDK-Integration (PHP-Seitig)

```php
// Haupt-Plugin: resa.php
if ( ! function_exists( 'resa_fs' ) ) {
    function resa_fs() {
        global $resa_fs;
        if ( ! isset( $resa_fs ) ) {
            require_once dirname( __FILE__ ) . '/freemius/start.php';
            $resa_fs = fs_dynamic_init( array(
                'id'                  => '00000',  // Freemius Plugin-ID
                'slug'                => 'immobilien-smart-assets',
                'type'                => 'plugin',
                'public_key'          => 'pk_xxxxxxxxxxxxxxxx',
                'is_premium'          => false,
                'has_addons'          => true,       // ← Add-ons aktiviert
                'has_paid_plans'      => true,
                'trial'               => array(
                    'days'    => 14,
                    'is_block_features' => true,
                ),
                'menu'                => array(
                    'slug'    => 'resa-dashboard',
                    'support' => false,
                ),
            ) );
        }
        return $resa_fs;
    }
    resa_fs();
    do_action( 'resa_fs_loaded' );
}
```

### Feature-Gating (PHP-Seitig)

```php
// Prüfung: Ist Premium aktiv?
if ( resa_fs()->is_plan( 'premium' ) ) {
    // Premium-Features laden
}

// Prüfung: Ist ein bestimmtes Add-on aktiv?
if ( resa_fs()->is_addon_activated( 'resa-onoffice' ) ) {
    // onOffice-Integration laden
}

// Prüfung: Free-Limits
function resa_can_add_location() {
    if ( resa_fs()->is_plan( 'premium' ) ) return true;
    $count = resa_get_location_count();
    return $count < 1; // Free: max 1 Location
}

// Modul-Check via ModuleRegistry + FeatureGate
function resa_can_use_module( $module_slug ) {
    $gate = \Resa\Core\FeatureGate::getInstance();
    return $gate->canUseModule( $module_slug );
    // Prüft: Flag == 'free' → true, Flag == 'pro' → can_use_premium_code()
}
```

### Upgrade-Prompts (UX)

An strategischen Stellen im Free-Plugin zeigt RESA Upgrade-Hinweise:

```
┌─────────────────────────────────────────────────┐
│  ⭐ Immobilienwert-Kalkulator                   │
│                                                 │
│  Dieser Smart Asset ist Teil von RESA Premium.   │
│  Schalten Sie alle 18 Lead-Magneten frei.       │
│                                                 │
│  [Jetzt upgraden — 14 Tage kostenlos testen]    │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Sie haben 47 neue Leads diesen Monat! 🎉       │
│                                                 │
│  In der Free-Version sehen Sie nur die          │
│  letzten 50. Mit Premium: unbegrenzte Leads,    │
│  Export, Detailseiten und CRM-Integration.       │
│                                                 │
│  [Upgrade auf Premium]                          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  "Powered by RESA" entfernen?                    │
│                                                 │
│  Mit Premium nutzen Sie Ihr eigenes Branding    │
│  und gestalten PDFs mit Logo und Firmenfarben.  │
│                                                 │
│  [Branding freischalten]                        │
└─────────────────────────────────────────────────┘
```

---

## 9. Upgrade-Pfade

### Typische Customer Journeys

```
JOURNEY 1: Der Einsteiger
───────────────────────────────────────────
WordPress.org → Free installieren → Mietpreis-Kalkulator einrichten
→ 2 Wochen später: "Ich will auch Immobilienwert"
→ Premium-Upgrade (14 Tage Trial)
→ 1 Monat später: "Leads sollen in mein onOffice"
→ onOffice Add-on kaufen

JOURNEY 2: Der Profi
───────────────────────────────────────────
Empfehlung von Kollege → direkt Premium + onOffice + CleverReach
→ Profi-Bundle (249 €/Jahr)

JOURNEY 3: Die Agentur
───────────────────────────────────────────
Web-Agentur betreut 5 Makler → Premium Unlimited (399 €/Jahr)
→ Pro Makler: passendes CRM-Add-on
→ Gesamtumsatz: 399 + 5×79 = 794 €/Jahr
```

---

## 10. Konkurrenzvergleich & Positionierung

```
Anbieter              Typ           Preis/Jahr    Lead-Magneten
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprengnetter          Bewertung     ab 500 €      1 (Bewertung)
Maklaro               Bewertung     ab 300 €      1 (Bewertung)
Aroundhome-Leads      Lead-Kauf     pro Lead      0 (gekaufte Leads)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESA Premium           Lead-Magneten 149 €         18 Assets
RESA+ CRM-AddOn       + Integration 228 €         18 + CRM-Anbindung
RESA Profi-Bundle      All-in        249 €         18 + CRM + Newsletter
```

**Positionierung:** RESA ist nicht ein einzelner Rechner, sondern eine **Toolbox mit 18 Lead-Magneten** für einen Bruchteil des Preises einer einzelnen Sprengnetter-Lizenz. Plus eigene Daten, eigenes Branding, eigene Leads.

---

## 11. Umsatzprojektion (konservativ)

### Annahmen

```
WordPress.org Downloads (Jahr 1):     2.000
Free → Premium Conversion:            5% = 100 zahlende Kunden
Davon mit Add-on(s):                  60% = 60 Kunden
Durchschn. Add-on-Umsatz/Kunde:       89 € (1-2 Add-ons)
```

### Projektion Jahr 1

```
Umsatz Premium:     100 × 149 €  = 14.900 €
Umsatz Add-ons:      60 ×  89 €  =  5.340 €
Umsatz Bundles:       20 × 249 € =  4.980 €   (von den 100, statt Einzel)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gesamt (konservativ):              ~20.000-25.000 €

Freemius-Anteil (~7%):             ~1.400-1.750 €
Netto:                             ~18.500-23.250 €
```

### Skalierung Jahr 2-3

Mit WordPress.org-Listing, Bewertungen und Mundpropaganda in der Maklerbranche:
- Downloads verdoppeln sich
- Conversion steigt auf 7-8% (mehr Social Proof)
- Add-on-Attach-Rate steigt (mehr Integrationen verfügbar)
- Ziel Jahr 3: 500+ zahlende Kunden, 80.000-120.000 € ARR

---

## 12. Roadmap: Welche Add-ons wann?

### Launch (Tag 1)

```
Hauptplugin:  RESA Free + Premium
Add-ons:      — (noch keine, Webhooks + Zapier reichen)
```

### Monat 2-3

```
Add-ons:      onOffice (Marktführer, größte Nachfrage)
              CleverReach (Newsletter-Marktführer DE)
```

### Monat 4-6

```
Add-ons:      Propstack
              FLOWFACT
              Brevo Newsletter
```

### Monat 7-12

```
Add-ons:      Mailchimp
              HubSpot CRM
              rapidmail
              Slack Notifications
```

### Jahr 2+

```
Add-ons:      FIO Webmakler
              Pipedrive
              MS Teams
              Google Sheets
              Weitere auf Nachfrage
```

---

## 13. Zusammenfassung Preistabelle

```
Produkt                    1 Site/Jahr     3 Sites/Jahr    Lifetime
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESA Free                   0 €             —               —
RESA Premium                149 €           249 €           449 €

Add-ons (je):
  Maklersoftware           79 €            —               229 €
  Newsletter               49 €            —               149 €
  Benachrichtigung         29 €            —                89 €

Bundles:
  Starter                  199 €           —               —
  Profi                    249 €           —               —
  All-in-One               499 €           —               —
```
