# ISM — Integrationsstrategie

## Die größte Hürde: Ohne Integration kein Produkt

Ein Lead-Magnet-Plugin, das Leads in einer eigenen Tabelle speichert und sonst nichts, wird nicht gekauft. Makler arbeiten in ihrem CRM, nicht in einem weiteren WordPress-Backend. ISM muss sich **nahtlos in den bestehenden Workflow einfügen** — sonst ist es ein Spielzeug, kein Werkzeug.

---

## 1. Maklersoftware / Immobilien-CRM

Das ist die **wichtigste Integration** — hier lebt der Makler täglich.

### Marktlandschaft Deutschland (Stand 2025/2026)

```
Anbieter          Kunden     Eigentümer       API           Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
onOffice           6.000+    unabhängig       REST + SDK    ★★★ Muss
Propstack          3.000+    Scout24-Gruppe   REST + Hooks  ★★★ Muss
FLOWFACT           2.300+    Scout24-Gruppe   REST          ★★★ Muss
FIO Webmakler      Banken    Hypoport-Gruppe  REST          ★★  Soll
Empro/estatePro    —         Immowelt-Gruppe  begrenzt      ★   Kann
immoprofessional   —         unabhängig       begrenzt      ★   Kann
```

### Was muss passieren?

Bei jedem neuen Lead schickt ISM die Daten an das CRM des Maklers:

```
ISM Lead erfasst
      │
      ▼
┌─────────────────────────────────────────────┐
│  Lead-Daten zusammenstellen:                │
│                                             │
│  Kontakt:                                   │
│  - Name, E-Mail, Telefon                    │
│  - Quelle: "ISM Mietpreis-Kalkulator"       │
│  - Stadt/Region                             │
│  - Datum + Einwilligung                     │
│                                             │
│  Kontext (Asset-Eingaben):                  │
│  - Wohnfläche: 85m²                         │
│  - Lage: Stadt                              │
│  - Zustand: Gepflegt                        │
│  - Ergebnis: 714-833 € Kaltmiete           │
│                                             │
│  Tags / Kategorie:                          │
│  - "Vermieter"                              │
│  - "Mietpreisanalyse"                       │
│  - "Bad Oeynhausen"                         │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┼───────┐
       ▼       ▼       ▼
   onOffice  Propstack  FLOWFACT
   (API)     (Webhook)  (API)
       │       │       │
       ▼       ▼       ▼
   Adresse   Kontakt   Kontakt
   anlegen   anlegen   anlegen
   +Aktivität +Notiz   +Aktivität
   +Tags     +Tags    +Tags
```

### Integration pro CRM

**onOffice (Priorität 1 — Marktführer)**
- API: `https://api.onoffice.de/api/stable/api.php`
- Authentifizierung: Token + Secret + HMAC
- Offizielles PHP-SDK auf GitHub verfügbar
- Aktion: Adresse anlegen (`actionid: create`, `resourcetype: address`)
- Zusätzlich: Aktivitäten-Log, Aufgabe erstellen, Tags setzen
- Besonderheit: onOffice Marketplace als Vertriebskanal möglich
- Zapier-Integration existiert (Fallback)

**Propstack (Priorität 1 — stärkstes Wachstum)**
- API: REST-basiert mit API-Key
- Webhooks für bidirektionalen Datenaustausch
- Kontakt anlegen + Notiz + benutzerdefinierte Felder
- Moderne Architektur, gut dokumentiert

**FLOWFACT (Priorität 1 — großer Bestand)**
- API: REST mit API-Key (unter Einstellungen → Tools & Integrationen)
- Kontakt anlegen + Aktivität verbuchen
- Microsoft365-Integration (Outlook, Kalender)
- Vollzugriffs-Rechte für API-User erforderlich

### Integrations-Architektur im ISM-Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  Integrationen → Maklersoftware                                 │
│                                                                 │
│  Aktive Verbindung: ● onOffice                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  onOffice enterprise                          [Verbunden ✅]││
│  │                                                             ││
│  │  API-Token:    [xxxxxxxxxxxxxxxxx              ]            ││
│  │  Secret:       [••••••••••••••••••             ]            ││
│  │  API-URL:      [api.onoffice.de/api/stable/.. ]             ││
│  │                                                             ││
│  │  Mapping:                                                   ││
│  │  ISM-Feld          → onOffice-Feld                          ││
│  │  ─────────────────────────────────                          ││
│  │  Vorname            → Vorname                               ││
│  │  Nachname           → Nachname                              ││
│  │  E-Mail             → Email                                 ││
│  │  Telefon            → Telefon_privat                        ││
│  │  Asset-Typ          → Notiz / Bemerkung                     ││
│  │  Ergebnis           → Notiz / Bemerkung                     ││
│  │  Stadt              → Tag: "ISM-Bad-Oeynhausen"             ││
│  │                                                             ││
│  │  Automatisch:                                               ││
│  │  ☑ Neue Leads sofort übertragen                             ││
│  │  ☑ Aktivitäts-Log erstellen                                 ││
│  │  ☑ Tag "ISM-Lead" setzen                                    ││
│  │  ☐ Aufgabe für Makler erstellen                             ││
│  │                                                             ││
│  │  [Verbindung testen]  [Testlead senden]                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Weitere Verbindungen:                                          │
│  ○ Propstack          [Einrichten]                              │
│  ○ FLOWFACT           [Einrichten]                              │
│  ○ FIO Webmakler      [Einrichten]                              │
│  ○ Zapier (Universal) [Einrichten]                              │
│  ○ Webhook (Custom)   [Einrichten]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Newsletter-Systeme

Leads die über ISM reinkommen, sollen auch ins Newsletter-Tool fließen — mit Tags, damit der Makler segmentierte Kampagnen fahren kann.

### Marktlandschaft DACH

```
Anbieter       Herkunft    DSGVO      API            Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CleverReach    DE          ★★★       REST           ★★★ Muss
Brevo          FR/DE       ★★★       REST           ★★★ Muss
Mailchimp      US          ★★        REST           ★★  Soll
rapidmail      DE          ★★★       REST           ★★  Soll
KlickTipp      EU          ★★★       REST           ★   Kann
ActiveCampaign US          ★★        REST           ★   Kann
HubSpot        US          ★★        REST           ★   Kann
```

### Was muss passieren?

```
ISM Lead erfasst (nach DOI-Bestätigung)
      │
      ▼
Newsletter-System
      │
      ├── Kontakt anlegen / aktualisieren
      ├── Liste zuweisen (z.B. "Vermieter Bad Oeynhausen")
      ├── Tags setzen:
      │   - "ISM-Lead"
      │   - "Vermieter" oder "Käufer" oder "Investor"
      │   - "Mietpreisanalyse" (welches Asset)
      │   - "Bad-Oeynhausen" (welche Stadt)
      │
      └── Automation triggern (z.B. "Vermieter-Nurturing-Sequenz")
```

### ISM-Admin: Newsletter-Integration

```
┌─────────────────────────────────────────────────────────────────┐
│  Integrationen → Newsletter                                     │
│                                                                 │
│  Aktive Verbindung: ● CleverReach                               │
│                                                                 │
│  API-Key:     [xxxxxxxxxxxxxxxxxxxxxxxxx          ]             │
│  Standard-Liste: [▼ Alle ISM-Leads               ]             │
│                                                                 │
│  Tag-Regeln (automatisch bei jedem Lead):                       │
│  ☑ Asset-Typ als Tag (z.B. "mietpreis-kalkulator")             │
│  ☑ Stadt als Tag (z.B. "bad-oeynhausen")                       │
│  ☑ Zielgruppe als Tag (z.B. "vermieter")                       │
│  ☑ Globaler Tag: "ism-lead"                                    │
│                                                                 │
│  Zeitpunkt: ● Nach DOI-Bestätigung  ○ Sofort                   │
│                                                                 │
│  [Verbindung testen]                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Generische CRM-Systeme

Manche Makler nutzen kein branchenspezifisches CRM, sondern ein generisches.

```
System          Verbreitung bei Maklern    API          Priorität
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HubSpot CRM     Größere Büros              REST         ★★  Soll
Pipedrive       Kleinere Büros             REST         ★   Kann
Salesforce      Enterprise                 REST         ★   Kann
Microsoft 365   Banken-Makler              Graph API    ★   Kann
```

Diese werden über **Zapier / Make** abgedeckt (siehe Universalschicht unten).

---

## 4. E-Mail / Domain / Transaktions-Mails

ISM verschickt E-Mails im Namen des Maklers — das muss zuverlässig funktionieren.

### Drei Optionen (Priorität von oben nach unten)

```
Option 1: Transaktions-Mail-Dienst (empfohlen)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Brevo (SMTP/API)  — DE-Server, DSGVO, günstig
Mailgun           — Bewährt, API-first
Amazon SES        — Günstigst, aber US
SendGrid          — Verbreitet, aber US
Postmark          — Beste Zustellrate

→ ISM sendet über die API des Dienstes
→ Zustellrate > 98%, Tracking inklusive
→ Makler-Domain als Absender (SPF/DKIM)

Option 2: Eigener SMTP-Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Der Makler hat eigenen Mailserver
→ ISM sendet über SMTP
→ ISM prüft SPF/DKIM/DMARC beim Einrichten
→ Risiko: Zustellbarkeit schwankt

Option 3: WordPress wp_mail (Fallback)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nur als Notlösung
→ Häufig blockiert, landet im Spam
→ ISM zeigt Warnung im Dashboard
```

### ISM-Admin: E-Mail-Versand

```
┌─────────────────────────────────────────────────────────────────┐
│  Integrationen → E-Mail-Versand                                 │
│                                                                 │
│  Versandmethode:                                                │
│  ● Brevo (empfohlen — DE-Server, beste Zustellrate)             │
│    API-Key: [xkeysib-xxxxxxxxxxxxx                ]             │
│                                                                 │
│  ○ Eigener SMTP-Server                                          │
│  ○ Mailgun                                                      │
│  ○ SendGrid                                                     │
│  ○ Amazon SES                                                   │
│  ○ WordPress Standard ⚠ (nicht empfohlen)                       │
│                                                                 │
│  Absender:                                                      │
│  Name:      [Brand & Co. Immobilien            ]                │
│  E-Mail:    [info@brand-partner.de             ]                │
│  Reply-To:  [info@brand-partner.de             ]                │
│                                                                 │
│  Domain-Check:                                                  │
│  ✅ SPF-Record für brand-partner.de vorhanden                   │
│  ✅ DKIM konfiguriert                                           │
│  ⚠  DMARC fehlt — Einrichtung empfohlen                        │
│                                                                 │
│  [Test-Mail senden]  Status: ✅ Zugestellt in 1.2s              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Universal-Schicht: Zapier / Make / Webhooks

Für **alles was wir nicht nativ abdecken** gibt es eine Universalschicht.

```
ISM Lead
   │
   ├──→ Native Integration (onOffice, Propstack, CleverReach...)
   │
   └──→ Universal-Schicht
        │
        ├── Zapier         → 7.000+ Apps
        ├── Make (Integromat) → flexibler, günstiger
        └── Custom Webhook → POST an beliebige URL
```

### Webhook-Format (für alle drei)

```json
{
  "event": "lead.created",
  "timestamp": "2026-02-24T14:32:00Z",
  "lead": {
    "id": "ism_lead_4721",
    "name": "Maria Schmidt",
    "email": "m.schmidt@web.de",
    "phone": "+49 173 1234567",
    "consent": true,
    "consent_date": "2026-02-24T14:31:55Z"
  },
  "asset": {
    "type": "mietpreis",
    "name": "Mietpreis-Kalkulator"
  },
  "location": {
    "id": "bad-oeynhausen",
    "name": "Bad Oeynhausen",
    "bundesland": "NRW"
  },
  "inputs": {
    "objekttyp": "wohnung",
    "flaeche_qm": 85,
    "lage": "stadt",
    "zustand": "gepflegt",
    "ausstattung": "gehoben",
    "extras": ["balkon", "stellplatz"]
  },
  "result": {
    "mietpreis_min_qm": 8.40,
    "mietpreis_max_qm": 9.80,
    "kaltmiete_min": 714,
    "kaltmiete_max": 833
  },
  "meta": {
    "page_url": "https://www.brand-partner.de/mietpreis-kalkulator/",
    "utm_source": "google",
    "utm_medium": "cpc"
  }
}
```

Dieses Format ist **identisch** egal ob Zapier, Make oder Custom Webhook. Enthält alles was ein nachgelagertes System braucht.

---

## 6. Lead-Verteilung an Makler (Multi-Makler-Büros)

### Das Problem

Größere Maklerbüros haben mehrere Makler die jeweils für bestimmte **Regionen oder Städte** zuständig sind. Wenn ein Lead über ISM reinkommt, muss er dem richtigen Makler zugewiesen werden.

### Lösung: Makler-Zuordnung über Locations

```
┌─────────────────────────────────────────────────────────────────┐
│  Einstellungen → Makler-Zuordnung                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Makler                  Zuständig für Locations            ││
│  │  ─────────────────────────────────────────────────────────  ││
│  │  Herr Brand              Bad Oeynhausen, Löhne             ││
│  │    brand@brand-partner.de                                   ││
│  │                                                             ││
│  │  Frau Jander             Vlotho, Herford                   ││
│  │    jander@brand-partner.de                                  ││
│  │                                                             ││
│  │  Herr Kühne              Minden, Porta Westfalica           ││
│  │    kuehne@brand-partner.de                                  ││
│  │                                                             ││
│  │  [+ Makler hinzufügen]                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Verteilungsregeln:                                             │
│  ● Location-basiert (Lead geht an den für die Stadt            │
│    zuständigen Makler)                                          │
│  ○ Round-Robin (gleichmäßig verteilen)                         │
│  ○ Manuell (alle Leads gehen an einen Posteingang)             │
│                                                                 │
│  Benachrichtigung bei neuem Lead:                               │
│  ☑ E-Mail an zuständigen Makler                                │
│  ☐ Push-Benachrichtigung (Browser)                             │
│  ☐ Slack/Teams-Nachricht                                       │
│                                                                 │
│  Fallback (wenn kein Makler zugewiesen):                        │
│  → brand@brand-partner.de                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Wie es funktioniert

```
Lead kommt rein
über [ism city="bad-oeynhausen"]
         │
         ▼
ISM prüft: Welcher Makler ist
für "Bad Oeynhausen" zuständig?
         │
         ▼
┌────────────────────┐
│  Herr Brand        │
│  Zuständig für:    │
│  Bad Oeynhausen ✓  │
│  Löhne             │
└────────┬───────────┘
         │
         ├──→ Lead wird Herrn Brand zugewiesen
         ├──→ Benachrichtigungs-Mail an brand@brand-partner.de
         ├──→ Im CRM: Lead wird Herrn Brand zugeordnet
         ├──→ Im Dashboard: Lead erscheint in seinem Bereich
         └──→ PDF-Ergebnis: Kontaktdaten von Herrn Brand
```

### Auswirkung auf alle Bereiche

```
Bereich              Was sich ändert
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PDF-Ergebnis         Kontaktdaten des zuständigen Maklers
                     (Foto, Name, Telefon, E-Mail)

E-Mail-Absender      Reply-To = zuständiger Makler
                     "Antworten Sie direkt an Herrn Brand"

Lead-Liste           Filterbar nach zuständigem Makler

Dashboard            Jeder Makler sieht seine eigenen KPIs
                     Admin sieht alles

CRM-Übergabe         Lead wird im CRM dem richtigen
                     Mitarbeiter zugewiesen

Benachrichtigung     Nur der zuständige Makler wird informiert
```

---

## 7. Integrations-Prioritäten (Roadmap)

### Phase 1: Launchfähig (Minimum Viable Integrations)

```
☐ Webhook (Custom URL)          → Deckt alles ab als Fallback
☐ Zapier                        → 7.000+ Apps ohne Eigenentwicklung
☐ Eigener SMTP / wp_mail        → Grundlegender E-Mail-Versand
☐ Makler-Zuordnung (Locations)  → Multi-Makler-Fähigkeit
```

**Warum Webhook + Zapier zuerst?** Damit ist ISM sofort mit JEDEM System verbindbar — auch mit CRMs und Newslettern die wir noch nicht nativ unterstützen. Der Makler oder sein IT-Dienstleister richtet Zapier ein, fertig.

### Phase 2: Kern-Integrationen

```
☐ onOffice API (nativ)          → Marktführer, 6.000+ Kunden
☐ Propstack API (nativ)         → Stärkstes Wachstum
☐ FLOWFACT API (nativ)          → Großer Bestand
☐ Brevo (SMTP + API)            → E-Mail-Versand + Newsletter
☐ CleverReach API               → Marktführer Newsletter DE
```

### Phase 3: Erweiterung

```
☐ FIO Webmakler                 → Bankenmakler-Segment
☐ Mailchimp API                 → Internationaler Standard
☐ rapidmail API                 → Deutscher Newsletter-Dienst
☐ Make (Integromat)             → Zapier-Alternative
☐ HubSpot CRM                   → Generisches CRM
```

### Phase 4: Premium

```
☐ onOffice Marketplace-Listing  → Direkter Vertriebskanal
☐ Propstack App-Directory       → Sichtbarkeit im Ökosystem
☐ Slack / Teams Notifications   → Echtzeit-Benachrichtigungen
☐ Google Sheets Export           → Einfache Datenanalyse
☐ REST API (ISM als Quelle)     → Andere Tools lesen ISM-Daten
```

---

## 8. Zusammenfassung: Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        ISM Plugin                                │
│                                                                 │
│  Lead erfasst                                                   │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  INTEGRATION LAYER                                       │   │
│  │                                                          │   │
│  │  1. Makler-Zuordnung (Location → Makler)                 │   │
│  │  2. Lead an Maklersoftware (onOffice/Propstack/FLOWFACT) │   │
│  │  3. Lead an Newsletter (CleverReach/Brevo + Tags)        │   │
│  │  4. PDF generieren (Makler-Branding des Zuständigen)     │   │
│  │  5. E-Mail versenden (über SMTP/API-Dienst)              │   │
│  │  6. Webhook feuern (Zapier/Make/Custom)                  │   │
│  │  7. Makler benachrichtigen (E-Mail/Push/Slack)           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Jeder dieser 7 Schritte ist optional aktivierbar. Ein Makler der nur Webhook + E-Mail nutzt, braucht keine CRM-Integration. Ein großes Büro nutzt alles.
