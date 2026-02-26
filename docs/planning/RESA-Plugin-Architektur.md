# RESA — Immobilien Smart Assets für Makler

## Plugin-Architektur & Asset-Konzept

---

## 1. Basis-Plugin: Übersicht

```
RESA Plugin
├── Dashboard            → KPIs, Aktivität, Schnellzugriff
├── Leads                → Alle Leads, Detailseiten, Export, Tags
├── Kommunikation        → E-Mail-Vorlagen, Versandlog, SMTP, Automationen
├── PDF-Vorlagen         → Zentraler Editor für alle PDF-Ergebnisdokumente
├── Smart Assets         → Aktivierte Assets + Einstellungen
├── Locations            → Städte / Regionen verwalten
├── Shortcode Generator  → Visueller Builder für Shortcodes
├── Integrationen        → CRM, Webhooks, Zapier
└── Einstellungen        → Maklerdaten, Branding, Lizenz, DSGVO
```

### Warum diese Reihenfolge?

Das Menü folgt der **täglichen Nutzung** (oben) vs. **Einrichtung** (unten): Der Makler öffnet das Plugin, sieht seine KPIs (Dashboard), bearbeitet neue Leads, prüft den E-Mail-Versand. Die Einrichtung (Assets, Locations, Einstellungen) braucht er seltener.

---

## 1.1 Dashboard

Erste Seite nach dem Öffnen. Zeigt auf einen Blick:

```
┌─────────────────────────────────────────────────────────────────┐
│  RESA Dashboard                                        Heute ▼  │
│                                                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│  │    12      │  │     3     │  │   38%     │  │    2        │  │
│  │ Leads ges. │  │ Heute neu │  │ Conversion│  │ Unbearbeit. │  │
│  │ dieser Mo. │  │           │  │ Rate      │  │ Leads ⚠     │  │
│  └───────────┘  └───────────┘  └───────────┘  └─────────────┘  │
│                                                                 │
│  Top Assets (30 Tage)              Letzte Leads                 │
│  ━━━━━━━━━━━━━━━━━━━              ━━━━━━━━━━━━                  │
│  1. Mietpreis-Kalk.  42 Leads     M. Schmidt  vor 2h  Mietp.   │
│  2. Immobilienwert   28 Leads     K. Weber    vor 5h  Immo.    │
│  3. Kaufnebenkosten  15 Leads     T. Müller   gestern Budget    │
│                                                                 │
│  E-Mail-Status                     Schnellzugriff               │
│  ━━━━━━━━━━━━━━                    ━━━━━━━━━━━━━━               │
│  ✅ 84 zugestellt                  [+ Neue Location]            │
│  ⏳  3 ausstehend                  [Leads exportieren]          │
│  ❌  1 fehlgeschlagen → Details    [Shortcode erstellen]        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Leads

Eigenständiger Bereich mit Listenansicht, Detailseiten und Export.

### Lead-Übersicht (Liste)

```
┌─────────────────────────────────────────────────────────────────┐
│  Leads                            [Exportieren ▼] [Filter ▼]   │
│                                                                 │
│  Filter: Alle Assets ▼ | Alle Städte ▼ | Zeitraum ▼ | Status ▼ │
│  Suche:  [_________________________________]                    │
│                                                                 │
│  ☐  Name            E-Mail              Asset        Stadt    … │
│  ─────────────────────────────────────────────────────────────  │
│  ☐  M. Schmidt      m.schmidt@web.de    Mietpreis    Bad Oe. ● │
│  ☐  K. Weber        kweber@gmail.com    Immowert     Löhne   ● │
│  ☐  T. Müller       t.mueller@gmx.de    Budget       Bad Oe. ○ │
│  ☐  S. Fischer      s.fischer@mail.de   Mietpreis    Vlotho  ● │
│                                                                 │
│  ● Neu  ○ Kontaktiert  ◉ Qualifiziert  ◌ Abgeschlossen         │
│                                                                 │
│  Zeige 1-25 von 142           [◀ 1  2  3  4  5  6 ▶]           │
└─────────────────────────────────────────────────────────────────┘
```

### Lead-Detailseite

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Zurück zur Liste                                            │
│                                                                 │
│  Maria Schmidt                                Status: [Neu ▼]  │
│  m.schmidt@web.de | +49 173 1234567           Tags: [Verkäufer] │
│                                                                 │
│  ┌─────────────────────────────┐  ┌───────────────────────────┐ │
│  │  Bekannte Daten             │  │  Kommunikation            │ │
│  │                             │  │                           │ │
│  │  Quelle: Mietpreis-Kalk.   │  │  24.02. E-Mail gesendet   │ │
│  │  Stadt:  Bad Oeynhausen     │  │         "Ihre Mietpreis-  │ │
│  │  Datum:  24.02.2026         │  │          Analyse"         │ │
│  │                             │  │         ✅ Geöffnet (2x)  │ │
│  │  Eingaben aus Asset:        │  │                           │ │
│  │  ─────────────────          │  │  24.02. Lead erfasst      │ │
│  │  Wohnfläche:   85 m²       │  │         via Mietpreis-    │ │
│  │  Lage:         Stadt        │  │         Kalkulator        │ │
│  │  Zustand:      Gepflegt     │  │                           │ │
│  │  Ausstattung:  Gehoben     │  │                           │ │
│  │  Extras:       Balkon,      │  │                           │ │
│  │                Stellplatz   │  │                           │ │
│  │                             │  │                           │ │
│  │  Ergebnis:                  │  │                           │ │
│  │  Mietpreis: 8,40-9,80 €/m² │  │                           │ │
│  │  Kaltmiete: 714-833 €      │  │                           │ │
│  │                             │  │                           │ │
│  └─────────────────────────────┘  └───────────────────────────┘ │
│                                                                 │
│  Notizen                                                        │
│  ━━━━━━━━                                                       │
│  [Notiz hinzufügen...                                      ]    │
│                                                                 │
│  Aktionen                                                       │
│  [E-Mail senden]  [An CRM übergeben]  [Lead löschen]           │
└─────────────────────────────────────────────────────────────────┘
```

### Lead-Status-Workflow

```
● Neu → ○ Kontaktiert → ◉ Qualifiziert → ◌ Abgeschlossen
                                          └→ ✕ Verloren
```

### Export

- CSV-Export (gefiltert oder alle)
- Zeitraum wählbar
- Felder wählbar (welche Spalten)
- Automatischer Export (z.B. wöchentlich per E-Mail an Makler)

---

## 1.3 Kommunikation

Die **sensibelste Komponente** — hier laufen E-Mail-Vorlagen, Versand, Zustellbarkeit und DSGVO zusammen.

### Übersicht

```
RESA Kommunikation
├── E-Mail-Vorlagen      → Pro Asset eine Vorlage + globale Vorlagen
├── Versandlog           → Jede gesendete E-Mail mit Status
├── Automationen         → Regeln: Wann wird was gesendet?
└── Einrichtung          → SMTP, Absender, Zustellbarkeit
```

### E-Mail-Vorlagen

Jedes Asset hat eine **Standard-Vorlage** die der Makler anpassen kann:

```
┌─────────────────────────────────────────────────────────────────┐
│  E-Mail-Vorlagen                                                │
│                                                                 │
│  Asset-Vorlagen (werden nach Lead-Erfassung gesendet):          │
│  ─────────────────────────────────────────────────────          │
│  📧 Mietpreis-Kalkulator    "Ihre persönliche Mietpreisanalyse" │
│  📧 Immobilienwert          "Ihre Immobilienbewertung"          │
│  📧 Kaufnebenkosten         "Ihre Nebenkostenübersicht"         │
│  📧 Renditerechner          "Ihr Rendite-Dossier"               │
│                                                                 │
│  Globale Vorlagen:                                              │
│  ─────────────────                                              │
│  📧 Willkommen / Double-Opt-In                                  │
│  📧 Follow-Up (X Tage nach Lead)                                │
│  📧 Erinnerung Terminbuchung                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Vorlagen-Editor

```
┌─────────────────────────────────────────────────────────────────┐
│  Vorlage: Mietpreis-Kalkulator                                  │
│                                                                 │
│  Betreff: [Ihre Mietpreisanalyse für {{city}}              ]    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                             ││
│  │  Guten Tag {{vorname}} {{nachname}},                        ││
│  │                                                             ││
│  │  vielen Dank für Ihr Interesse. Anbei Ihre persönliche      ││
│  │  Mietpreisanalyse für {{city}}.                             ││
│  │                                                             ││
│  │  {{ergebnis_block}}                                         ││
│  │                                                             ││
│  │  Gerne besprechen wir die Ergebnisse in einem               ││
│  │  persönlichen Gespräch.                                     ││
│  │                                                             ││
│  │  {{makler_signatur}}                                        ││
│  │                                                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Variablen: {{vorname}} {{nachname}} {{email}} {{city}}         │
│             {{asset_name}} {{ergebnis_block}} {{ergebnis_pdf}}  │
│             {{makler_name}} {{makler_signatur}} {{makler_tel}}  │
│                                                                 │
│  Anhang:  ☑ Ergebnis als PDF anhängen                           │
│                                                                 │
│  [Test-Mail senden]  [Vorschau]  [Speichern]                   │
└─────────────────────────────────────────────────────────────────┘
```

### Versandlog

```
┌─────────────────────────────────────────────────────────────────┐
│  Versandlog                                      [Filter ▼]    │
│                                                                 │
│  Datum       Empfänger          Betreff              Status     │
│  ──────────────────────────────────────────────────────────     │
│  24.02. 14:32  m.schmidt@web.de   Ihre Mietpreis..   ✅ Zugest. │
│  24.02. 12:15  kweber@gmail.com   Ihre Immobilien..  ✅ Geöffnet│
│  24.02. 09:44  t.mueller@gmx.de   Ihre Budget..      ✅ Zugest. │
│  23.02. 18:01  fake@test.abc      Double-Opt-In      ❌ Bounce  │
│                                                                 │
│  Status-Legende:                                                │
│  ✅ Zugestellt  📬 Geöffnet  🔗 Link geklickt  ❌ Bounce  ⚠ Fehler│
└─────────────────────────────────────────────────────────────────┘
```

### Automationen

Einfache Regel-Engine — kein komplettes Marketing-Automation-Tool, aber die wichtigsten Workflows:

```
┌─────────────────────────────────────────────────────────────────┐
│  Automationen                                                   │
│                                                                 │
│  ✅ Aktiv: Ergebnis-Mail                                        │
│     Auslöser:  Lead wird erfasst                                │
│     Aktion:    Asset-spezifische Vorlage senden                 │
│     Verzög.:   Sofort                                           │
│                                                                 │
│  ✅ Aktiv: Double-Opt-In                                        │
│     Auslöser:  Lead wird erfasst                                │
│     Aktion:    DOI-Mail senden, Lead auf "unbestätigt"          │
│     Verzög.:   Sofort                                           │
│                                                                 │
│  ○ Inaktiv: Follow-Up                                           │
│     Auslöser:  Lead seit 3 Tagen im Status "Neu"               │
│     Aktion:    Follow-Up-Vorlage senden                         │
│     Verzög.:   72 Stunden                                       │
│                                                                 │
│  ○ Inaktiv: Makler-Benachrichtigung                             │
│     Auslöser:  Neuer Lead                                       │
│     Aktion:    Info-Mail an Makler mit Lead-Daten               │
│     Verzög.:   Sofort                                           │
│                                                                 │
│  [+ Neue Automation]                                            │
└─────────────────────────────────────────────────────────────────┘
```

### E-Mail-Einrichtung (SMTP)

```
┌─────────────────────────────────────────────────────────────────┐
│  E-Mail-Einrichtung                                             │
│                                                                 │
│  Versandmethode:                                                │
│  ○ WordPress Standard (wp_mail) — nicht empfohlen               │
│  ● Eigener SMTP-Server                                          │
│  ○ Externer Dienst (Mailgun / SendGrid / Amazon SES)            │
│                                                                 │
│  SMTP-Server:   [mail.brand-partner.de            ]             │
│  Port:          [587                               ]             │
│  Benutzer:      [noreply@brand-partner.de          ]             │
│  Passwort:      [••••••••••                        ]             │
│  Verschlüss.:   ○ Keine  ● STARTTLS  ○ SSL                     │
│                                                                 │
│  Absender:                                                      │
│  Name:          [Brand & Co. Immobilien            ]             │
│  E-Mail:        [info@brand-partner.de             ]             │
│  Reply-To:      [info@brand-partner.de             ]             │
│                                                                 │
│  [Verbindung testen]  Status: ✅ Verbunden                      │
│                                                                 │
│  Zustellbarkeits-Check:                                         │
│  ✅ SPF-Record vorhanden                                        │
│  ✅ DKIM konfiguriert                                           │
│  ⚠  DMARC nicht gefunden — Empfehlung: einrichten              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Warum ist Kommunikation so sensibel?

```
Risiko                          RESA-Lösung
──────                          ──────────
E-Mails landen im Spam       → SMTP-Check, SPF/DKIM-Prüfung
DSGVO-Verstoß                → Double-Opt-In, Einwilligungslog
Makler sieht nicht ob         → Versandlog mit Öffnungs-
  Mail angekommen ist            und Klick-Tracking
Kein Überblick über           → Kommunikationshistorie
  Kontaktverlauf                 in Lead-Detailseite
Falsche/veraltete Vorlagen   → Zentrale Vorlagen mit
                                 Variablen + Vorschau
```

---

## 1.4 PDF-Vorlagen

Zentraler Ort um **alle PDF-Ergebnisdokumente** zu gestalten. Jedes Asset generiert ein PDF — das Design und die Struktur werden hier verwaltet.

### Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│  PDF-Vorlagen                                                   │
│                                                                 │
│  Globales Layout                                                │
│  ━━━━━━━━━━━━━━━                                                │
│  ⚙ Basis-Layout         Logo, Farben, Schriften, Fußzeile       │
│                                                                 │
│  Asset-Vorlagen                                                 │
│  ━━━━━━━━━━━━━━━                                                │
│  📄 Mietpreis-Kalkulator      Letzte Änderung: 20.02.2026      │
│  📄 Immobilienwert-Kalkulator  Letzte Änderung: 15.01.2026      │
│  📄 Kaufnebenkosten-Rechner   Letzte Änderung: 10.02.2026      │
│  📄 Renditerechner            Letzte Änderung: 10.02.2026      │
│  📄 Energieeffizienz-Check    — Noch nicht konfiguriert —       │
│                                                                 │
│  [Vorschau-PDF herunterladen]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Globales Basis-Layout

Wird von **allen** Asset-PDFs geerbt. Der Makler richtet das einmal ein.

```
┌─────────────────────────────────────────────────────────────────┐
│  Basis-Layout                                                   │
│                                                                 │
│  Logo & Header                                                  │
│  ──────────────                                                 │
│  Logo:             [brand-co-logo.png]  [Hochladen]             │
│  Logo-Position:    ● Links  ○ Mitte  ○ Rechts                   │
│  Header-Farbe:     [■ #2E75B6]                                  │
│                                                                 │
│  Farben & Schriften                                             │
│  ──────────────────                                             │
│  Primärfarbe:      [■ #2E75B6]  (Überschriften, Akzente)       │
│  Sekundärfarbe:    [■ #4A4A4A]  (Fließtext)                    │
│  Hintergrund:      [■ #FFFFFF]                                  │
│  Schriftart:       [▼ Open Sans          ]                      │
│                                                                 │
│  Fußzeile (alle Seiten)                                         │
│  ──────────────────────                                         │
│  Links:            [Brand & Co. Immobilien | Tel. 05731-177550] │
│  Rechts:           [www.brand-partner.de                      ] │
│  Trennlinie:       ☑ Anzeigen   Farbe: [■ #2E75B6]             │
│                                                                 │
│  Letzte Seite: Über uns                                         │
│  ──────────────────────                                         │
│  ☑ "Über uns"-Seite an jedes PDF anhängen                       │
│  Foto:             [team-foto.jpg]  [Hochladen]                 │
│  Text:             [Brand & Co. ist seit über 20 Jahren...]     │
│  Kontaktdaten:     ☑ Adresse  ☑ Telefon  ☑ E-Mail  ☑ Website   │
│                                                                 │
│  [Speichern]  [Vorschau]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Asset-spezifische Vorlage

Jedes Asset hat seine eigene PDF-Vorlage mit **Bausteinen**, die der Makler ein-/ausschalten und anordnen kann:

```
┌─────────────────────────────────────────────────────────────────┐
│  PDF-Vorlage: Mietpreis-Kalkulator                              │
│                                                                 │
│  PDF-Bausteine (Drag & Drop zum Sortieren):                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                     │
│                                                                 │
│  ☰ ☑ Deckblatt                                                  │
│      Titel: [Ihre persönliche Mietpreisanalyse            ]     │
│      Untertitel: [für {{vorname}} {{nachname}}             ]     │
│      Zeigt: Datum, Stadt, Makler-Logo                           │
│                                                                 │
│  ☰ ☑ Kernergebnis                                               │
│      Große Darstellung der Mietpreis-Spanne                     │
│      Anpassbar: Anzeigeformat, Nachkommastellen                 │
│      [Nicht editierbar — wird automatisch befüllt]              │
│                                                                 │
│  ☰ ☑ Eingaben-Zusammenfassung                                   │
│      Tabelle mit allen Angaben des Nutzers                      │
│      ☑ Lage  ☑ Fläche  ☑ Zustand  ☑ Ausstattung  ☑ Extras     │
│                                                                 │
│  ☰ ☑ Marktvergleich                                             │
│      Einordnung des Ergebnisses im regionalen Markt             │
│      Zeigt: Spanne min/max, Durchschnitt, Position              │
│      Darstellung: ● Balkendiagramm  ○ Tabelle                  │
│                                                                 │
│  ☰ ☑ Einflussfaktoren                                           │
│      Detail-Aufschlüsselung: Welcher Faktor hat wie             │
│      zum Ergebnis beigetragen (Lage +15%, Zustand +10%...)      │
│                                                                 │
│  ☰ ☐ Preisentwicklung (optional)                                │
│      Zeigt Mietpreisentwicklung der letzten Jahre               │
│      [Nur wenn Makler Daten hinterlegt hat]                     │
│                                                                 │
│  ☰ ☑ Handlungsempfehlung                                        │
│      Freitext-Baustein, den der Makler selbst formuliert:       │
│      [Sie möchten wissen, wie Sie den optimalen Mietpreis   ]   │
│      [erzielen? Gerne beraten wir Sie persönlich und         ]   │
│      [unverbindlich. Rufen Sie uns an: 05731-177550          ]   │
│                                                                 │
│  ☰ ☑ Über uns (aus Basis-Layout)                                │
│                                                                 │
│  ☰ ☐ Rechtlicher Hinweis (optional)                             │
│      [Die Ergebnisse dienen der Orientierung und ersetzen   ]   │
│      [keine professionelle Bewertung...                      ]   │
│                                                                 │
│  [+ Freitext-Baustein hinzufügen]                               │
│                                                                 │
│  [Speichern]  [Vorschau-PDF herunterladen]                      │
└─────────────────────────────────────────────────────────────────┘
```

### Baustein-Typen

```
Baustein-Typ           Beschreibung                      Bearbeitbar?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deckblatt              Titel, Untertitel, Datum           Texte editierbar
Kernergebnis           Hauptergebnis des Assets           Automatisch
Eingaben-Zusammenfass. Was der Nutzer eingegeben hat      Felder wählbar
Marktvergleich         Einordnung im Markt                Darstellung wählbar
Einflussfaktoren       Aufschlüsselung der Faktoren       Automatisch
Preisentwicklung       Chart mit Zeitreihe                Daten aus Location
Handlungsempfehlung    Freier Text + CTA                  Frei editierbar
Über uns               Makler-Vorstellung                 Aus Basis-Layout
Rechtlicher Hinweis    Disclaimer                         Frei editierbar
Freitext               Beliebiger Inhalt                  Frei editierbar
```

### Vererbungsprinzip

```
Basis-Layout (global)
├── Logo, Farben, Schriften, Fußzeile, Über-uns
│
├── Asset-Vorlage: Mietpreis
│   └── Erbt Basis + eigene Bausteine
│
├── Asset-Vorlage: Immobilienwert
│   └── Erbt Basis + eigene Bausteine
│
└── Asset-Vorlage: Kaufnebenkosten
    └── Erbt Basis + eigene Bausteine

→ Makler ändert Logo im Basis-Layout
→ Alle PDFs haben sofort das neue Logo
```

---

## 2. Locations — Städte & Regionen (Core-Plugin)

Locations sind **globale Stammdaten** des Core-Plugins. Sie definieren die Standorte, an denen Smart Assets eingesetzt werden können.

### Location-Datenmodell

**Wichtig:** Locations enthalten nur **globale, standortbezogene Daten**. Berechnungsfaktoren und Mietpreise werden in den **Smart Asset-Einstellungen** pro Modul und Location konfiguriert.

```
Location (Core-Plugin)
├── id                  → z.B. "bad-oeynhausen" oder numerisch
├── name                → "Bad Oeynhausen"
├── bundesland          → "NRW" (für Grunderwerbsteuer etc.)
├── region_typ          → laendlich | kleinstadt | mittelstadt | grossstadt
├── plz_bereiche[]      → ["32547", "32549"]
├── koordinaten         → { lat: 52.20, lng: 8.80 }
│
├── regionale_faktoren (gesetzlich/regional festgelegt)
│   ├── grunderwerbsteuer → 6.5%
│   ├── maklerprovision   → 3.57%
│   ├── mietpreisbremse   → false
│   └── kappungsgrenze    → 20%
│
└── meta
    ├── letzte_aktualisierung → "2026-01-15"
    └── ansprechpartner       → "Herr Brand"
```

### Was gehört NICHT in Locations?

Die folgenden Daten werden **pro Smart Asset** in den **Modul-Einstellungen** konfiguriert:

```
❌ NICHT in Location (gehört in Smart Asset Settings):
├── Basismietpreis €/m²       → Smart Asset → Tab "Standort-Werte"
├── Mietpreisspanne           → Smart Asset → Tab "Standort-Werte"
├── Kaufpreise                → Smart Asset → Tab "Standort-Werte"
├── Lage-Faktoren             → Smart Asset → Tab "Einrichtung"
├── Zustands-Faktoren         → Smart Asset → Tab "Einrichtung"
├── Ausstattungs-Faktoren     → Smart Asset → Tab "Einrichtung"
└── Extras-Aufschläge         → Smart Asset → Tab "Einrichtung"
```

### Location-Verwaltung im Admin

- Städte anlegen, duplizieren, archivieren
- Bulk-Import via CSV (für Makler mit vielen Standorten)
- Regionale Faktoren (Grunderwerbsteuer etc.) pflegen
- Eine Location kann als "Standard" markiert werden (Fallback)

## 3. Universeller Asset-Flow

**Jedes** Smart Asset folgt exakt demselben 4-Stufen-Schema. Keine Ausnahme.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STUFE 1: FRAGEN                                               │
│   ━━━━━━━━━━━━━━━                                               │
│                                                                 │
│   Interaktiver Fragebogen — je nach Asset unterschiedlich,      │
│   aber immer Schritt-für-Schritt aufgebaut.                     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  Schritt 1 von 4                              ████░░░  │   │
│   │                                                         │   │
│   │  Welche Art von Immobilie möchten Sie vermieten?        │   │
│   │                                                         │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │   │
│   │  │ 🏢 Wohnung│  │ 🏠 Haus  │  │ 🏬 Gewerbe│              │   │
│   │  └──────────┘  └──────────┘  └──────────┘              │   │
│   │                                                         │   │
│   │                                      [Weiter →]         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ══════════════════════════════════════════════════════════     │
│                              ▼                                  │
│   STUFE 2: LEAD-FORMULAR                                        │
│   ━━━━━━━━━━━━━━━━━━━━━━                                        │
│                                                                 │
│   Erst nach allen Fragen — der Besucher hat schon investiert    │
│   und will sein Ergebnis sehen. Maximale Conversion.            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │  Ihre Analyse ist fertig!                               │   │
│   │  Wohin dürfen wir die Ergebnisse senden?                │   │
│   │                                                         │   │
│   │  Name*:     [_________________________]                 │   │
│   │  E-Mail*:   [_________________________]                 │   │
│   │  Telefon:   [_________________________]                 │   │
│   │                                                         │   │
│   │  ☐ Ich stimme der Datenverarbeitung zu (Pflicht)        │   │
│   │                                                         │   │
│   │           [Ergebnis anzeigen & per E-Mail senden]       │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ══════════════════════════════════════════════════════════     │
│                              ▼                                  │
│   STUFE 3: WEB-ERGEBNIS (Kompakt)                               │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                               │
│                                                                 │
│   Sofort sichtbar auf der Webseite. Zeigt das Kernergebnis      │
│   — genug um Wert zu liefern, aber NICHT alles. Der Teaser.     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │  Ihre geschätzte Kaltmiete:                             │   │
│   │                                                         │   │
│   │            714 € — 833 € / Monat                        │   │
│   │            (8,40 — 9,80 € / m²)                         │   │
│   │                                                         │   │
│   │  📧 Eine detaillierte Analyse mit Vergleichsdaten       │   │
│   │     und Handlungsempfehlung wurde an Ihre               │   │
│   │     E-Mail-Adresse gesendet.                            │   │
│   │                                                         │   │
│   │  Persönliche Beratung gewünscht?                        │   │
│   │  [Termin vereinbaren]  [Zurückrufen lassen]             │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ══════════════════════════════════════════════════════════     │
│                              ▼                                  │
│   STUFE 4: PDF PER E-MAIL (Detailliert)                         │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                         │
│                                                                 │
│   Automatisch versendet. Das PDF enthält MEHR als die           │
│   Web-Anzeige — das ist der eigentliche Mehrwert.               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  📄 Ihre_Mietpreisanalyse_Bad_Oeynhausen.pdf           │   │
│   │                                                         │   │
│   │  ┌─────────────────────────────────────────────────┐    │   │
│   │  │  [Makler-Logo]                                  │    │   │
│   │  │                                                 │    │   │
│   │  │  MIETPREISANALYSE                               │    │   │
│   │  │  für Maria Schmidt                              │    │   │
│   │  │  Bad Oeynhausen | 24.02.2026                    │    │   │
│   │  │                                                 │    │   │
│   │  │  Kernergebnis ....................... S. 1       │    │   │
│   │  │  Marktvergleich ..................... S. 2       │    │   │
│   │  │  Einflussfaktoren im Detail ......... S. 3      │    │   │
│   │  │  Preisentwicklung der Region ........ S. 4      │    │   │
│   │  │  Handlungsempfehlung ................ S. 5      │    │   │
│   │  │  Über [Maklername] .................. S. 6      │    │   │
│   │  │                                                 │    │   │
│   │  └─────────────────────────────────────────────────┘    │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Web-Ergebnis vs. PDF — Warum der Unterschied?

```
                    Web-Ergebnis              PDF per E-Mail
                    (Stufe 3)                 (Stufe 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zweck               Sofortige Belohnung       Nachhaltiger Mehrwert
Umfang              Kernergebnis              Vollständige Analyse
Inhalt              1-2 Kennzahlen            Vergleichsdaten, Trends,
                                              Einflussfaktoren,
                                              Handlungsempfehlung
Branding            Dezent                    Voll (Logo, Kontakt,
                                              Über-uns-Seite)
CTA                 Termin / Rückruf          Im PDF eingebettet
Verweildauer        Sekunden                  Wird gespeichert,
                                              weitergeleitet, gedruckt
Lead-Nurturing      —                         PDF bleibt als Anker
                                              beim Interessenten
```

**Der Trick:** Das Web-Ergebnis ist gut genug, um den Besucher zufriedenzustellen — aber das PDF ist so viel besser, dass er seine E-Mail-Adresse gerne dafür gibt. Das PDF wird aufgehoben, ausgedruckt, dem Partner gezeigt. Es ist das Verkaufsdokument des Maklers das beim Interessenten liegt.

---

## 4. Einrichtungs-Modi — Pauschal vs. Individuell (Admin-seitig)

Die zwei Modi bestimmen, **wie der Makler das Asset einrichtet** — nicht wie der Endnutzer es bedient. Das Frontend-Erlebnis ist für den Besucher immer gleich.

### Modus 1: Pauschal

Der Makler macht genau **eine Einstellung** — den Regionstyp:

```
┌─────────────────────────────────────────────────┐
│  Mietpreis-Kalkulator — Einrichtung             │
│                                                 │
│  Einrichtungsmodus:  ● Pauschal ○ Individuell   │
│                                                 │
│  Regionstyp:                                    │
│  ○ Ländlich                                     │
│  ○ Kleinstadt / Stadtrand                       │
│  ● Mittelstadt                                  │
│  ○ Großstadt / Zentrum                          │
│                                                 │
│  → Alle Faktoren, Multiplikatoren und           │
│    Referenzwerte werden automatisch aus          │
│    hinterlegten Defaultwerten befüllt.           │
│                                                 │
│  [ Speichern & Aktivieren ]                     │
└─────────────────────────────────────────────────┘
```

**Vorteil:** Asset ist in 2 Minuten live. Ideal für Makler die schnell starten wollen oder keine eigenen Marktdaten haben.

**Woher kommen die Defaults?** RESA liefert pro Regionstyp einen vollständigen Satz an Durchschnittswerten mit, basierend auf bundesweiten Marktdaten (z.B. IVD-Spiegel, Destatis). Diese werden mit Plugin-Updates gepflegt.

### Modus 2: Individuell

Der Makler trägt **eigene Marktdaten und Faktoren** ein:

```
┌─────────────────────────────────────────────────┐
│  Mietpreis-Kalkulator — Einrichtung             │
│                                                 │
│  Einrichtungsmodus:  ○ Pauschal ● Individuell   │
│                                                 │
│  Basismietpreis/m²:     [  8.20  ] €            │
│  Spanne min:            [  5.80  ] €            │
│  Spanne max:            [ 12.50  ] €            │
│  Steigerung p.a.:       [  3.2   ] %            │
│                                                 │
│  Lage-Faktoren:                                 │
│  Ländlich:              [  0.82  ]              │
│  Stadtrand:             [  0.93  ]              │
│  Stadt:                 [  1.00  ]              │
│  Zentrum/Top-Lage:      [  1.18  ]              │
│                                                 │
│  Ausstattungs-Faktoren:                         │
│  Einfach:               [  0.85  ]              │
│  Normal:                [  1.00  ]              │
│  Gehoben:               [  1.15  ]              │
│  Luxus:                 [  1.32  ]              │
│                                                 │
│  Zustands-Faktoren:                             │
│  Renovierungsbedürftig: [  0.78  ]              │
│  Gepflegt:              [  1.00  ]              │
│  Modernisiert:          [  1.12  ]              │
│  Neuwertig:             [  1.22  ]              │
│                                                 │
│  Extras-Aufschläge:                             │
│  Balkon:                [  3.0   ] %            │
│  Garten:                [  5.0   ] %            │
│  Stellplatz:            [  4.0   ] %            │
│  Aufzug:                [  2.0   ] %            │
│  Einbauküche:           [  3.0   ] %            │
│                                                 │
│  Datenquelle:  [ Eigene Marktanalyse 2026  ]    │
│                                                 │
│  [ Speichern & Aktivieren ]                     │
└─────────────────────────────────────────────────┘
```

**Vorteil:** Genauere, regionsspezifische Ergebnisse. Ideal für Makler mit eigenen Marktberichten, IVD-Mitglieder oder Marktberichterstatter wie Brand & Co.

### Zusammenspiel der Modi

```
Pauschal                          Individuell
────────                          ────────────
Makler wählt                      Makler trägt eigene
"Mittelstadt"                     Werte ein
     │                                 │
     ▼                                 ▼
RESA befüllt alle                  Werte werden
Faktoren aus                      direkt verwendet
Default-Tabelle
     │                                 │
     └──────────┬──────────────────────┘
                │
                ▼
        Gleiche Berechnung
        Gleiches Frontend
        Gleiches Ergebnis-Layout
                │
                ▼
          Lead-Formular
```

**Wichtig:** Der Makler kann jederzeit von Pauschal auf Individuell wechseln. Beim Umschalten werden die Pauschalwerte als Startwerte in die individuellen Felder übernommen — so muss er nicht bei Null anfangen.

---

## 5. Smart Asset-Einstellungen (Admin)

### Navigation: Smart Assets Seite

Die Smart Assets Seite zeigt alle verfügbaren Lead Tools. Aktive Assets erscheinen oben und haben ein Zahnrad-Icon für die Einstellungen:

```
Smart Assets
├── Filter: [Aktive ▼] Suche: [____________]
├── AKTIVE ASSETS (oben, mit [⚙] Zahnrad)
│   ├── Mietpreis-Kalkulator [⚙]
│   └── Immobilienwert [⚙]
└── VERFÜGBARE ASSETS
    ├── Kaufnebenkosten [🔒 Pro]
    └── ...
```

### Modul-Einstellungen (eigene Seite)

Klick auf [⚙] öffnet: `Smart Assets › Mietpreis-Kalkulator`

Jedes aktivierte Smart Asset hat eine **eigene Einstellungsseite** mit drei Tabs:

```
Smart Assets › Mietpreis-Kalkulator

[Übersicht] [Einrichtung] [Standort-Werte]
══════════════════════════════════════════
```

#### Tab 1: Übersicht

```
├── Status                → ● Aktiv / ○ Inaktiv
├── Verfügbare Locations  → [✓] Bad Oeynhausen [✓] Löhne [ ] Vlotho
└── Shortcode-Beispiel    → [resa type="mietpreis" city="bad-oeynhausen"]
```

#### Tab 2: Einrichtung

Hier werden die Berechnungsparameter des Moduls konfiguriert:

```
├── Einrichtungsmodus     → ● Pauschal / ○ Individuell
│   │
│   ├── [Pauschal]        → Regionstyp: ○ Ländlich ○ Kleinstadt ● Mittelstadt ○ Großstadt
│   │                       (alle Faktoren werden automatisch aus Presets befüllt)
│   │
│   └── [Individuell]     → Alle Felder unten werden editierbar
│
├── Lage-Faktoren (bei Pauschal: read-only)
│   ├── laendlich         → 0.85
│   ├── stadtrand         → 0.95
│   ├── stadt             → 1.00
│   └── zentrum           → 1.15
│
├── Zustands-Faktoren
│   ├── renovierungsbed   → 0.80
│   ├── gepflegt          → 1.00
│   ├── modernisiert      → 1.10
│   └── neuwertig         → 1.20
│
├── Ausstattungs-Faktoren
│   ├── einfach           → 0.85
│   ├── normal            → 1.00
│   ├── gehoben           → 1.15
│   └── luxus             → 1.30
│
├── Extras-Aufschläge
│   ├── balkon            → +3%
│   ├── garten            → +5%
│   ├── stellplatz        → +4%
│   ├── aufzug            → +2%
│   └── einbaukueche      → +3%
│
└── Globale Parameter
    ├── min_flaeche       → 20
    ├── max_flaeche       → 500
    └── dezimalstellen    → 2
```

#### Tab 3: Standort-Werte

Pro aktivierter Location können spezifische Werte gesetzt werden, die die Standardwerte überschreiben:

```
├── Bad Oeynhausen
│   ├── basismietpreis_qm → 8.50 €
│   ├── spanne_min        → 5.80 €
│   ├── spanne_max        → 12.50 €
│   ├── steigerung_pa     → 3.2%
│   └── datenquelle       → "IVD Marktbericht 2026"
│
└── Löhne
    ├── basismietpreis_qm → 7.80 €
    ├── spanne_min        → 5.20 €
    ├── spanne_max        → 10.80 €
    ├── steigerung_pa     → 2.8%
    └── datenquelle       → "Eigene Marktanalyse"
```

### Klare Trennung: Modul vs. Core

**MODUL-SETTINGS** (in der Modul-Einstellungsseite):

- Einrichtungsmodus (Pauschal/Individuell)
- Berechnungsfaktoren (Lage, Zustand, Ausstattung, Extras)
- Standort-Werte (Basispreise pro Location)

**CORE-SETTINGS** (unter RESA → Einstellungen, gilt für ALLE Module):

- Lead-Formular (Felder, Pflichtfelder, DSGVO-Text)
- Design/Branding (Primärfarbe, Logo, "Powered by RESA")
- E-Mail-Vorlagen
- SMTP-Konfiguration

**Hinweis:** Lead-Formular und Design sind **keine** Modul-Einstellungen. Sie werden einmal zentral konfiguriert und gelten für alle Smart Assets einheitlich.

---

## 6. Shortcode-System

### Syntax

```
[resa type="<asset>" city="<location-id>" mode="pauschal|individuell|hybrid" branding="true|false" ...optionen]
```

### Beispiele

```
// Mietpreis-Kalkulator, Bad Oeynhausen
[resa type="mietpreis" city="bad-oeynhausen"]

// Immobilienwert, ohne Branding
[resa type="immobilienwert" city="bad-oeynhausen" branding="false"]

// Kaufnebenkosten
[resa type="kaufnebenkosten" city="bad-oeynhausen"]

// Renditerechner, alle Städte des Maklers als Dropdown
[resa type="rendite" city="all"]

// Verkäufer-Checkliste, PDF-Download
[resa type="checkliste-verkaeufer" city="bad-oeynhausen"]
```

### Shortcode-Parameter (alle Assets)

| Parameter | Werte               | Standard        | Beschreibung                   |
| --------- | ------------------- | --------------- | ------------------------------ |
| type      | asset-slug          | (Pflicht)       | Welches Asset                  |
| city      | location-id / "all" | Standard-City   | Welche Location                |
| branding  | true / false        | true            | "Powered by RESA" anzeigen     |
| lead_form | true / false        | true            | Lead-Formular anzeigen         |
| theme     | light / dark        | light           | Farbschema                     |
| lang      | de / en             | de              | Sprache                        |
| cta_text  | "Beliebiger Text"   | (Asset-Default) | Call-to-Action Text            |
| redirect  | URL                 | null            | Weiterleitung nach Lead-Abgabe |

**Hinweis:** Der Einrichtungsmodus (Pauschal/Individuell), alle Faktoren und die Standort-Werte werden im Admin **pro Smart Asset** konfiguriert — nicht per Shortcode. Der Shortcode steuert nur _welches_ Asset _wo_ angezeigt wird. Design und Lead-Formular werden zentral unter Einstellungen konfiguriert und gelten für alle Assets.

---

## 7. Smart Assets — Welche passen in die Mechanik?

### Passt perfekt (Location + Faktoren + Modi)

Diese Assets nutzen die volle RESA-Mechanik: Location-Daten, Lage-/Ausstattungsfaktoren, beide Modi.

| #   | Asset                     | type-slug           | Nutzt Location-Daten            |
| --- | ------------------------- | ------------------- | ------------------------------- |
| 1   | Mietpreis-Kalkulator      | `mietpreis`         | Mietdaten, Lage, Ausstattung    |
| 2   | Immobilienwert-Kalkulator | `immobilienwert`    | Kaufdaten, Bodenrichtwert, Lage |
| 3   | Renditerechner            | `rendite`           | Miet+Kaufdaten, Nebenkosten     |
| 4   | Modernisierungsrechner    | `modernisierung`    | Kaufdaten (Wertsteigerung)      |
| 5   | Mieterhöhungsrechner      | `mieterhoehung`     | Mietdaten, Kappungsgrenze       |
| 6   | Verkaufszeitpunkt-Berater | `verkaufszeitpunkt` | Markttrend, Preisentwicklung    |
| 7   | Energieeffizienz-Check    | `energiecheck`      | Regionale Sanierungspflichten   |

### Passt gut (Location teilweise, eigene Parameter)

Diese Assets brauchen die Location hauptsächlich für regionale Steuersätze oder als Kontext, haben aber eigene Schwerpunkte.

| #   | Asset                    | type-slug          | Nutzt von Location               |
| --- | ------------------------ | ------------------ | -------------------------------- |
| 8   | Kaufnebenkosten-Rechner  | `kaufnebenkosten`  | Grunderwerbsteuer, Provision     |
| 9   | Budgetrechner            | `budget`           | Durchschnittspreise als Referenz |
| 10  | Mieten-vs-Kaufen         | `mieten-vs-kaufen` | Miet+Kaufdaten als Vergleich     |
| 11  | Erbschaftssteuer-Rechner | `erbschaftssteuer` | Immobilienwert-Referenz          |
| 12  | Immobilien-Stresstest    | `stresstest`       | Marktdaten als Basis             |

### Passt als Ergänzung (Location optional, eigene Logik)

Diese Assets funktionieren auch ohne Location-Daten, profitieren aber davon.

| #   | Asset                 | type-slug            | Location-Bezug                  |
| --- | --------------------- | -------------------- | ------------------------------- |
| 13  | Suchprofil-Ersteller  | `suchprofil`         | Verfügbare Regionen als Auswahl |
| 14  | Verkäufer-Checkliste  | `checkliste-vk`      | Regionale Dokumente/Hinweise    |
| 15  | Käufer-Checkliste     | `checkliste-kaeufer` | Regionale Besonderheiten        |
| 16  | Vermieter-Starter-Kit | `vermieter-kit`      | Regionale Rechtshinweise        |
| 17  | Makler-Matching-Quiz  | `makler-quiz`        | Kontextinfo                     |
| 18  | Umzugs-Checkliste     | `umzug`              | Lokale Ämter/Ansprechpartner    |

---

## 8. Datenfluss-Mechanik

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN (Backend)                          │
│                                                                 │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │ Location  │───▶│  Smart Asset     │───▶│  Shortcode       │   │
│  │ anlegen   │    │  aktivieren      │    │  Generator       │   │
│  │ + Daten   │    │  Modus wählen    │    │  [resa type=".."  │   │
│  └──────────┘    │  Faktoren setzen  │    │   city=".."]     │   │
│                  └──────────────────┘    └──────────┬───────┘   │
│  ┌──────────┐    ┌──────────────────┐               │           │
│  │ PDF-     │    │  Kommunikation   │               │           │
│  │ Vorlage  │    │  E-Mail-Vorlage  │               │           │
│  │ gestalten│    │  Automationen    │               │           │
│  └────┬─────┘    └────────┬─────────┘               │           │
│       │                   │                         │           │
├───────┼───────────────────┼─────────────────────────┼───────────┤
│       │                   │      FRONTEND           │           │
│       │                   │                         ▼           │
│       │                   │  ┌──────────────────────────────┐   │
│       │                   │  │  Stufe 1: FRAGEN             │   │
│       │                   │  │  Schritt-für-Schritt Eingabe │   │
│       │                   │  │            │                  │   │
│       │                   │  │            ▼                  │   │
│       │                   │  │  Stufe 2: LEAD-FORMULAR      │   │
│       │                   │  │  Name, E-Mail, Einwilligung  │   │
│       │                   │  │            │                  │   │
│       │                   │  │            ▼                  │   │
│       │                   │  │  Stufe 3: WEB-ERGEBNIS       │   │
│       │                   │  │  Kompakt-Anzeige + CTA       │   │
│       │                   │  └──────────────┬───────────────┘   │
│       │                   │                 │                    │
│       │                   │                 ▼                    │
│       │                   │  ┌──────────────────────────────┐   │
│       │                   │  │  Lead-Erfassung              │   │
│       │                   │  │  → DB speichern              │   │
│       │                   │  │  → Dashboard aktualisieren   │   │
│       │                   │  │  → CRM-Webhook               │   │
│       │                   │  │            │                  │   │
│       │                   │  │            ▼                  │   │
│       └───────────────────┼──│▶ Stufe 4: PDF generieren     │   │
│                           └──│▶ + E-Mail versenden          │   │
│                              │  (Vorlage + Ergebnisdaten)   │   │
│                              └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Shortcode-Generator (Admin-UI)

Der Shortcode-Generator ist ein visueller Builder im Admin:

```
┌─────────────────────────────────────────────────┐
│  Shortcode Generator                            │
│                                                 │
│  Asset:     [▼ Mietpreis-Kalkulator        ]    │
│  Location:  [▼ Bad Oeynhausen              ]    │
│  Modus:     ○ Pauschal  ○ Individuell ● Hybrid  │
│                                                 │
│  Optionen:                                      │
│  ☑ Lead-Formular anzeigen                       │
│  ☐ Branding ausblenden                          │
│  ☑ Light Theme                                  │
│  CTA-Text:  [Jetzt Miete berechnen         ]    │
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │ [resa type="mietpreis"                      ││
│  │      city="bad-oeynhausen"                 ││
│  │      mode="hybrid"                         ││
│  │      lead_form="true"                      ││
│  │      cta_text="Jetzt Miete berechnen"]     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [ Kopieren ]  [ Vorschau ]                     │
└─────────────────────────────────────────────────┘
```

---

## 10. Namenskonvention & Branding

**Plugin-Name:** RESA — Immobilien Smart Assets
**Shortcode-Prefix:** `[resa ...]`
**CSS-Prefix:** `.resa-`
**JS-Namespace:** `RESA`
**DB-Prefix:** `resa_`
**REST-API:** `/wp-json/resa/v1/`

---

## 11. Nächste Schritte

1. **Basis-Plugin Gerüst** — Admin-Menü, Location-CRUD, Settings-API
2. **Location-Datenmodell** — DB-Schema, Import/Export
3. **Asset-Framework** — Abstrakte Klasse für alle Assets (Faktoren, Modi, Lead-Gate)
4. **Asset #1 portieren** — Mietpreis-Kalkulator in die RESA-Architektur überführen
5. **Asset #2 portieren** — Immobilienwert-Kalkulator
6. **Neue Assets bauen** — Kaufnebenkosten-Rechner als erstes neues Asset
