# ISM — Tracking, Conversion & Zwei-Phasen-Lead-Speicherung

## Funnel-Tracking, Google Ads Integration, dataLayer Events & Partial Leads

---

## 1. Das Problem: Der unsichtbare Trichter

Heute tracken die meisten Formular-Plugins nur binär: **abgesendet** oder **nicht abgesendet**. Alles dazwischen ist eine Blackbox:

```
         Besucher                   Was wir HEUTE wissen:
              │
         ▼    │
    Seite besucht ─────────────── Google Analytics (Pageview)
              │
         ▼    │
    Kalkulator startet ─────────  ???
              │
         ▼    │
    Frage 1 beantwortet ────────  ???
              │
         ▼    │
    Frage 2 beantwortet ────────  ???
              │
         ▼    │
    Frage 3 beantwortet ────────  ???
              │
         ▼    │
    Formular erreicht ──────────  ???  ← 60% der Nutzer sind bis hier
              │
         ▼    │                             Aber WER sind sie?
    Formular ausgefüllt ────────  ???       Was haben sie eingegeben?
              │
         ▼    │
    Formular abgesendet ────────  Lead in DB  ← Nur das kennen wir
              │
         ▼    │
    PDF per E-Mail ─────────────  E-Mail-Log
```

**Was wir wissen wollen:**

1. Wie viele starten den Kalkulator? (Engagement)
2. Bei welcher Frage steigen die meisten aus? (Drop-off-Analyse)
3. Wie viele **erreichen** das Formular? (Qualifizierte Interessenten)
4. Wie viele **füllen es aus, senden aber nicht ab**? (Fast-Leads)
5. Wie viele **senden ab**? (Echte Leads)
6. Wie viele **öffnen die PDF-E-Mail**? (Engagement nach Conversion)

---

## 2. Die Lösung: Vollständiges Funnel-Tracking

### 2.1 Tracking-Events (der komplette Funnel)

ISM pusht an **jeder relevanten Stelle** Events in den dataLayer:

```
Event-Name                      Wann                        Typ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ism_asset_view                  Widget wird sichtbar        Micro
ism_asset_start                 Erste Interaktion           Micro
ism_step_complete               Jeder Frageschritt          Micro
ism_step_back                   Zurück-Navigation           Micro
ism_questions_complete          Alle Fragen beantwortet     Micro
ism_form_view                   Formular wird angezeigt     Sekundär*
ism_form_interact               Erstes Feld fokussiert      Micro
ism_form_submit                 Formular abgesendet         Primär*
ism_result_view                 Ergebnis angezeigt          Micro
ism_pdf_sent                    PDF-E-Mail versendet        Micro
ism_pdf_opened                  PDF-E-Mail geöffnet         Micro

* Primär = Google Ads Conversion (Bidding-relevant)
* Sekundär = Google Ads Observation (nicht Bidding-relevant)
```

### 2.2 dataLayer Push — Implementierung

```typescript
// src/frontend/services/tracking/TrackingService.ts

interface IsmTrackingEvent {
  event: string;
  ism_asset_type: string;          // 'rent_calculator'
  ism_location: string;            // 'bad-oeynhausen'
  ism_step?: number;               // 1, 2, 3...
  ism_step_total?: number;         // 5
  ism_funnel_stage?: string;       // 'questions' | 'form' | 'result'
  ism_session_id?: string;         // Anonyme Session-ID (UUID, kein Cookie)
  ism_conversion_value?: number;   // Dynamischer Lead-Wert
  // NIEMALS PII (keine E-Mail, Name, Telefon!)
}

class TrackingService {
  private sessionId: string;

  constructor() {
    this.sessionId = crypto.randomUUID(); // Pro Widget-Instanz
  }

  private push(data: IsmTrackingEvent): void {
    // Nur pushen wenn dataLayer existiert (GTM installiert)
    if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(data);
    }

    // Parallel: WordPress-internes Tracking (immer aktiv, auch ohne GTM)
    this.sendToWordPress(data);
  }

  // ── Funnel Events ──────────────────────────────────

  assetView(assetType: string, location: string): void {
    this.push({
      event: 'ism_asset_view',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'impression',
      ism_session_id: this.sessionId,
    });
  }

  assetStart(assetType: string, location: string): void {
    this.push({
      event: 'ism_asset_start',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'questions',
      ism_session_id: this.sessionId,
    });
  }

  stepComplete(assetType: string, location: string, step: number, totalSteps: number): void {
    this.push({
      event: 'ism_step_complete',
      ism_asset_type: assetType,
      ism_location: location,
      ism_step: step,
      ism_step_total: totalSteps,
      ism_funnel_stage: 'questions',
      ism_session_id: this.sessionId,
    });
  }

  // ★ FORMULAR ERREICHT — Sekundäre Conversion
  formView(assetType: string, location: string): void {
    this.push({
      event: 'ism_form_view',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'form',
      ism_session_id: this.sessionId,
    });
  }

  formInteract(assetType: string, location: string): void {
    this.push({
      event: 'ism_form_interact',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'form',
      ism_session_id: this.sessionId,
    });
  }

  // ★★ FORMULAR ABGESENDET — Primäre Conversion
  formSubmit(assetType: string, location: string, value?: number): void {
    this.push({
      event: 'ism_form_submit',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'form',
      ism_session_id: this.sessionId,
      ism_conversion_value: value,
    });
  }

  resultView(assetType: string, location: string): void {
    this.push({
      event: 'ism_result_view',
      ism_asset_type: assetType,
      ism_location: location,
      ism_funnel_stage: 'result',
      ism_session_id: this.sessionId,
    });
  }

  // ── Internes WordPress-Tracking ────────────────────

  private async sendToWordPress(data: IsmTrackingEvent): void {
    try {
      await fetch(ismConfig.restUrl + '/ism/v1/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          url: window.location.href,
          referrer: document.referrer,
        }),
      });
    } catch {
      // Tracking darf nie die UX blockieren — Fehler stillschweigend
    }
  }
}
```

---

## 3. Zwei-Phasen-Lead-Speicherung

### 3.1 Das Konzept

Der entscheidende Punkt: **Beim Erreichen des Formulars haben wir bereits wertvolle Daten** — der Besucher hat alle Fragen beantwortet. Diese Antworten (Wohnfläche, Zimmeranzahl, Baujahr, Ausstattung…) sind an sich schon wertvoll für den Makler.

```
Phase 1: PARTIAL LEAD (Formular erreicht)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger:     Besucher erreicht Formular-Step
Gespeichert: Antworten aus dem Fragebogen
Status:      'partial'
Kontakt:     LEER (noch keine persönlichen Daten)
Zweck:       Statistik, Funnel-Analyse, Retargeting-Daten

           ┌──────────────────────────────────────┐
           │  Lead #4801                           │
           │  Status: ⬤ partial                   │
           │                                       │
           │  Asset: Mietpreis-Kalkulator           │
           │  Location: Bad Oeynhausen              │
           │  Datum: 2026-02-25 14:32              │
           │                                       │
           │  Eingaben:                             │
           │    Wohnfläche: 85 m²                   │
           │    Zimmer: 3                           │
           │    Baujahr: 1992                       │
           │    Ausstattung: Gehoben                │
           │    Etage: 2. OG                        │
           │    Balkon: Ja                          │
           │                                       │
           │  Kontakt: —                           │
           │  E-Mail: —                            │
           │                                       │
           └──────────────────────────────────────┘

Phase 2: COMPLETED LEAD (Formular abgesendet)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trigger:     Besucher sendet Formular ab
Gespeichert: Kontaktdaten + DSGVO-Einwilligung
Status:      'new' (wird zu 'contacted', 'qualified' etc.)
Kontakt:     Name, E-Mail, ggf. Telefon
Zweck:       Echter Lead → CRM, E-Mail, PDF

           ┌──────────────────────────────────────┐
           │  Lead #4801                           │
           │  Status: ⬤ new                       │
           │                                       │
           │  Asset: Mietpreis-Kalkulator           │
           │  Location: Bad Oeynhausen              │
           │  Datum: 2026-02-25 14:33              │
           │                                       │
           │  Eingaben:                             │
           │    Wohnfläche: 85 m²                   │
           │    Zimmer: 3                           │
           │    Baujahr: 1992                       │
           │    Ausstattung: Gehoben                │
           │    Etage: 2. OG                        │
           │    Balkon: Ja                          │
           │                                       │
           │  Kontakt:                              │
           │    Name: Maria Schmidt                 │
           │    E-Mail: m.schmidt@email.de          │
           │    Telefon: —                          │
           │    Newsletter: Ja                      │
           │                                       │
           │  DSGVO: ✅ Einwilligung 14:33:42       │
           │  Ergebnis: 714–833 €/Monat             │
           │  PDF: ✅ Gesendet 14:33:45             │
           │                                       │
           └──────────────────────────────────────┘
```

### 3.2 Warum das wertvoll ist

```
Was Partial Leads ermöglichen:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. FUNNEL-ANALYSE
   "42% der Nutzer füllen den Rechner aus,
    aber nur 28% senden das Formular ab"
   → Formular zu lang? Vertrauen fehlt? Zu viele Felder?

2. ASSET-VERGLEICH
   "Der Mietpreis-Rechner hat 65% Form-Completion,
    der Nebenkostenrechner nur 38%"
   → Welches Asset braucht Optimierung?

3. MARKTDATEN (anonymisiert)
   "In Bad Oeynhausen suchen Nutzer im Schnitt
    75 m² mit 2-3 Zimmern, Baujahr 1990-2000"
   → Wertvolle Marktinformation für den Makler!

4. CONVERSION-RATE-OPTIMIERUNG
   Partial vs. Completed pro Location, pro Asset, pro Zeitraum
   → A/B-Tests auf Daten-Basis statt Bauchgefühl

5. GOOGLE ADS OPTIMIERUNG
   ism_form_view als Sekundäre Conversion
   → Google sieht mehr Signale → Besseres Bidding
   → Auch bei wenigen echten Leads (< 30/Monat)
```

### 3.3 Datenbankmodell

```sql
-- Aktualisierte ism_leads Tabelle
-- (erweitert gegenüber ISM-Technischer-Stack.md)

CREATE TABLE {prefix}ism_leads (
    id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- ── Identifikation ──────────────────────
    session_id       VARCHAR(36) NOT NULL,           -- UUID, verknüpft Phase 1 → 2
    asset_type       VARCHAR(50) NOT NULL,           -- 'rent_calculator'
    location_id      BIGINT UNSIGNED,                -- FK → ism_locations
    agent_id         BIGINT UNSIGNED,                -- FK → ism_agents (bei Zuweisung)

    -- ── Status ──────────────────────────────
    status           VARCHAR(20) NOT NULL DEFAULT 'partial',
    -- Mögliche Werte:
    --   'partial'    → Formular erreicht, nicht abgesendet
    --   'new'        → Formular abgesendet, unbearbeitet
    --   'contacted'  → Makler hat Kontakt aufgenommen
    --   'qualified'  → Als qualifizierter Lead eingestuft
    --   'converted'  → Abschluss / Auftrag erhalten
    --   'lost'       → Lead verloren / kein Interesse
    --   'expired'    → Automatisch nach X Tagen (Partial Leads)

    -- ── Kalkulator-Eingaben (Phase 1) ───────
    inputs           JSON NOT NULL,                  -- Alle Fragebogen-Antworten
    -- Beispiel: {"area": 85, "rooms": 3, "year": 1992, "equipment": "premium"}

    -- ── Berechnungsergebnis (Phase 1) ───────
    result           JSON,                           -- Berechnetes Ergebnis
    -- Beispiel: {"min": 714, "max": 833, "median": 773, "unit": "EUR/month"}

    -- ── Kontaktdaten (Phase 2) ──────────────
    -- ALLE NULL bei Partial Leads!
    first_name       VARCHAR(100),
    last_name        VARCHAR(100),
    email            VARCHAR(255),
    phone            VARCHAR(50),
    company          VARCHAR(200),
    salutation       VARCHAR(10),
    message          TEXT,

    -- ── Meta-Informationen ──────────────────
    meta             JSON,
    -- {
    --   "ip_hash": "a3f2...",           -- Gehashte IP (DSGVO)
    --   "user_agent_hash": "b7c1...",   -- Gehashter User-Agent
    --   "referrer": "https://...",
    --   "utm_source": "google",
    --   "utm_medium": "cpc",
    --   "utm_campaign": "mietpreis_bo",
    --   "gclid": "EAIaIQ...",           -- Google Click ID!
    --   "fbclid": "IwAR3...",           -- Facebook Click ID
    --   "form_fields_shown": ["first_name","email","phone","newsletter"],
    --   "form_preset": "balanced",
    --   "newsletter_consent": false,
    --   "callback_requested": false
    -- }

    -- ── DSGVO ───────────────────────────────
    consent_given    TINYINT(1) NOT NULL DEFAULT 0,  -- 0 bei Partial, 1 bei Completed
    consent_text     TEXT,                           -- Exakter Einwilligungstext
    consent_date     DATETIME,                       -- Zeitpunkt der Einwilligung

    -- ── Tracking-IDs ────────────────────────
    gclid            VARCHAR(255),                   -- Google Click ID (für Offline-Conversions)
    fbclid           VARCHAR(255),                   -- Facebook Click ID

    -- ── Zeitstempel ─────────────────────────
    created_at       DATETIME NOT NULL,              -- Phase 1: Formular erreicht
    updated_at       DATETIME NOT NULL,              -- Phase 2: Formular abgesendet
    completed_at     DATETIME,                       -- Exakter Zeitpunkt der Vervollständigung
    expires_at       DATETIME,                       -- Auto-Löschung für Partial Leads

    -- ── Indizes ─────────────────────────────
    INDEX idx_status (status),
    INDEX idx_asset_type (asset_type),
    INDEX idx_location_id (location_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at),
    INDEX idx_gclid (gclid),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 3.4 Lead-Lifecycle im Code

```php
// includes/Services/Lead/LeadService.php

class LeadService {

    /**
     * PHASE 1: Partial Lead anlegen
     * Wird aufgerufen wenn Besucher das Formular erreicht.
     * Kein Consent nötig — keine personenbezogenen Daten!
     */
    public function createPartialLead( array $data ): int {
        global $wpdb;

        $session_id = sanitize_text_field( $data['session_id'] );

        // Prüfen ob schon ein Partial Lead mit dieser Session existiert
        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ism_leads
             WHERE session_id = %s AND status = 'partial'",
            $session_id
        ) );

        if ( $existing ) {
            // Update statt Insert (Nutzer hat evtl. Zurück navigiert)
            $wpdb->update(
                "{$wpdb->prefix}ism_leads",
                [
                    'inputs'     => wp_json_encode( $data['inputs'] ),
                    'result'     => wp_json_encode( $data['result'] ?? null ),
                    'updated_at' => current_time( 'mysql' ),
                ],
                [ 'id' => $existing ],
                [ '%s', '%s', '%s' ],
                [ '%d' ]
            );
            return (int) $existing;
        }

        // Neuen Partial Lead anlegen
        $wpdb->insert(
            "{$wpdb->prefix}ism_leads",
            [
                'session_id'  => $session_id,
                'asset_type'  => sanitize_text_field( $data['asset_type'] ),
                'location_id' => absint( $data['location_id'] ),
                'agent_id'    => $this->resolveAgent( $data['location_id'] ),
                'status'      => 'partial',
                'inputs'      => wp_json_encode( $data['inputs'] ),
                'result'      => wp_json_encode( $data['result'] ?? null ),
                'meta'        => wp_json_encode( $this->collectMeta( $data ) ),
                'gclid'       => sanitize_text_field( $data['gclid'] ?? '' ),
                'fbclid'      => sanitize_text_field( $data['fbclid'] ?? '' ),
                'created_at'  => current_time( 'mysql' ),
                'updated_at'  => current_time( 'mysql' ),
                'expires_at'  => date( 'Y-m-d H:i:s', strtotime( '+30 days' ) ),
            ],
            [ '%s','%s','%d','%d','%s','%s','%s','%s','%s','%s','%s','%s','%s' ]
        );

        return (int) $wpdb->insert_id;
    }

    /**
     * PHASE 2: Partial Lead vervollständigen
     * Wird aufgerufen wenn Besucher das Formular absendet.
     * Consent MUSS gegeben sein!
     */
    public function completeLead( string $session_id, array $contactData ): ?int {
        global $wpdb;

        // Partial Lead finden
        $lead_id = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$wpdb->prefix}ism_leads
             WHERE session_id = %s AND status = 'partial'
             ORDER BY created_at DESC LIMIT 1",
            $session_id
        ) );

        if ( ! $lead_id ) {
            // Kein Partial Lead vorhanden (z.B. Tracking blockiert)
            // → Direkt einen neuen Lead anlegen
            return $this->createDirectLead( $session_id, $contactData );
        }

        // Phase 2: Vervollständigen
        $wpdb->update(
            "{$wpdb->prefix}ism_leads",
            [
                'status'        => 'new',
                'first_name'    => sanitize_text_field( $contactData['first_name'] ),
                'last_name'     => sanitize_text_field( $contactData['last_name'] ?? '' ),
                'email'         => sanitize_email( $contactData['email'] ),
                'phone'         => sanitize_text_field( $contactData['phone'] ?? '' ),
                'company'       => sanitize_text_field( $contactData['company'] ?? '' ),
                'salutation'    => sanitize_text_field( $contactData['salutation'] ?? '' ),
                'message'       => sanitize_textarea_field( $contactData['message'] ?? '' ),
                'consent_given' => 1,
                'consent_text'  => sanitize_textarea_field( $contactData['consent_text'] ),
                'consent_date'  => current_time( 'mysql' ),
                'completed_at'  => current_time( 'mysql' ),
                'updated_at'    => current_time( 'mysql' ),
                'expires_at'    => null,  // Kein Auto-Expire mehr!
            ],
            [ 'id' => $lead_id ],
        );

        // Hooks für CRM-Sync, E-Mail, PDF etc.
        do_action( 'ism_lead_completed', $lead_id, $contactData );

        return (int) $lead_id;
    }

    /**
     * Meta-Daten sammeln (ohne PII)
     */
    private function collectMeta( array $data ): array {
        return [
            'ip_hash'         => wp_hash( $this->getClientIp() ),
            'user_agent_hash' => wp_hash( $_SERVER['HTTP_USER_AGENT'] ?? '' ),
            'referrer'        => esc_url_raw( wp_get_referer() ?: '' ),
            'utm_source'      => sanitize_text_field( $data['utm_source'] ?? '' ),
            'utm_medium'      => sanitize_text_field( $data['utm_medium'] ?? '' ),
            'utm_campaign'    => sanitize_text_field( $data['utm_campaign'] ?? '' ),
            'utm_term'        => sanitize_text_field( $data['utm_term'] ?? '' ),
            'utm_content'     => sanitize_text_field( $data['utm_content'] ?? '' ),
            'page_url'        => esc_url_raw( $data['page_url'] ?? '' ),
        ];
    }
}
```

---

## 4. REST API Endpoints

```
Methode   Endpoint                      Auth          Beschreibung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST      /ism/v1/leads/partial         Public        Phase 1: Partial Lead anlegen
POST      /ism/v1/leads/complete        Public        Phase 2: Lead vervollständigen
POST      /ism/v1/tracking              Public        Tracking-Event speichern

GET       /ism/v1/leads                 Admin         Leads auflisten (mit Filter)
GET       /ism/v1/leads/{id}            Admin         Lead-Detail
PATCH     /ism/v1/leads/{id}            Admin         Status ändern
DELETE    /ism/v1/leads/{id}            Admin         Lead löschen (DSGVO)
GET       /ism/v1/analytics/funnel      Admin         Funnel-Daten
GET       /ism/v1/analytics/partial     Admin         Partial-Lead-Statistiken
```

### API-Ablauf im Detail

```
Browser                          WordPress REST API              Datenbank
  │                                    │                            │
  │  Besucher startet Rechner          │                            │
  │  ism_asset_start ──────────────────┼── POST /tracking ─────────▶│ ism_tracking
  │                                    │                            │
  │  Frage 1 beantwortet              │                            │
  │  ism_step_complete ────────────────┼── POST /tracking ─────────▶│ ism_tracking
  │                                    │                            │
  │  Frage 2 beantwortet              │                            │
  │  ism_step_complete ────────────────┼── POST /tracking ─────────▶│ ism_tracking
  │                                    │                            │
  │  ... alle Fragen ...               │                            │
  │                                    │                            │
  │  ★ FORMULAR ERREICHT               │                            │
  │  ism_form_view ────────────────────┼── POST /leads/partial ────▶│ ism_leads
  │  + dataLayer.push(ism_form_view)   │  {session_id, inputs,      │ status='partial'
  │                                    │   asset_type, location,     │
  │                                    │   gclid, utm_*}             │
  │                                    │                            │
  │  Formular ausgefüllt               │                            │
  │  ism_form_interact                 │                            │
  │                                    │                            │
  │  ★★ FORMULAR ABGESENDET            │                            │
  │  ism_form_submit ──────────────────┼── POST /leads/complete ───▶│ ism_leads
  │  + dataLayer.push(ism_form_submit) │  {session_id, first_name,  │ status='new'
  │                                    │   email, consent...}        │ completed_at=NOW
  │                                    │                            │
  │  ◀────────────── Ergebnis-Daten ───┤                            │
  │  ism_result_view                   │                            │
  │                                    │                            │
  │                                    │── PDF generieren ─────────▶│ Queue
  │                                    │── E-Mail senden ──────────▶│ ism_email_log
  │                                    │── CRM-Sync ───────────────▶│ Webhook
```

---

## 5. Google Ads Conversion Tracking

### 5.1 Zwei Conversions einrichten

Im Google Ads Account des Maklers werden **zwei Conversion-Actions** angelegt:

```
Conversion #1: "ISM Formular erreicht" (Sekundär)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Typ:            Sekundäre Conversion (Beobachtung)
Event:          ism_form_view
Zählmethode:    Einmal pro Klick
Wert:           Keiner (oder z.B. 5 €)
Bidding:        NEIN — beeinflusst Smart Bidding nicht
Zweck:          Google sieht mehr Signale im Funnel
                Hilft bei Zielgruppen-Optimierung

Conversion #2: "ISM Lead generiert" (Primär)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Typ:            Primäre Conversion (Bidding)
Event:          ism_form_submit
Zählmethode:    Einmal pro Klick
Wert:           Dynamisch (abhängig von Asset-Typ)
Bidding:        JA — Smart Bidding optimiert darauf
Zweck:          Die echte Conversion
```

**Warum zwei?** Google Ads braucht **mindestens 30 Conversions pro 30 Tage** für effektives Smart Bidding. Ein kleiner Makler hat vielleicht nur 10-15 echte Leads/Monat. Die sekundäre Conversion "Formular erreicht" liefert zusätzliche Signale, ohne das Bidding zu verfälschen.

### 5.2 GTM Setup — Dokumentation für Makler

ISM liefert eine **fertige GTM-Setup-Anleitung** mit:

```
┌─────────────────────────────────────────────────────────────────┐
│  ISM → Einstellungen → Tracking                                │
│                                                                 │
│  ─── Google Tag Manager ────────────────────────────────────    │
│                                                                 │
│  GTM Container ID:  [GTM-XXXXXXX                          ]    │
│  (Optional: ISM pusht Events in den dataLayer,                  │
│   GTM muss separat auf der Website installiert sein)            │
│                                                                 │
│  ─── Tracking Events ───────────────────────────────────────    │
│                                                                 │
│  Verfügbare dataLayer Events:                                   │
│  ┌─────────────────┬────────────────────────────────────────┐   │
│  │ ism_asset_view   │ Widget sichtbar                       │   │
│  │ ism_asset_start  │ Erste Interaktion                     │   │
│  │ ism_step_complete│ Frageschritt abgeschlossen             │   │
│  │ ism_form_view    │ ★ Formular angezeigt (Sekundär)       │   │
│  │ ism_form_interact│ Erstes Feld fokussiert                 │   │
│  │ ism_form_submit  │ ★★ Formular abgesendet (Primär)       │   │
│  │ ism_result_view  │ Ergebnis angezeigt                    │   │
│  └─────────────────┴────────────────────────────────────────┘   │
│                                                                 │
│  [📋 GTM-Setup-Anleitung kopieren]                              │
│  [📥 GTM-Container als JSON exportieren]                        │
│                                                                 │
│  ─── Enhanced Conversions ──────────────────────────────────    │
│                                                                 │
│  Enhanced Conversions:  [✓] Aktiviert                           │
│  (Gehashte E-Mail wird bei ism_form_submit                      │
│   an den dataLayer übergeben)                                   │
│                                                                 │
│  ─── GCLID Tracking ───────────────────────────────────────     │
│                                                                 │
│  GCLID speichern:    [✓] Aktiviert                              │
│  (Google Click ID wird automatisch aus der URL                  │
│   erfasst und mit dem Lead gespeichert)                         │
│                                                                 │
│  ─── Internes Tracking ────────────────────────────────────     │
│                                                                 │
│  Funnel-Tracking:    [✓] Aktiviert (empfohlen)                  │
│  Partial Leads:      [✓] Aktiviert (empfohlen)                  │
│  Partial Lead TTL:   [▼ 30 Tage] (Automatische Löschung)       │
│                                                                 │
│  [Speichern]                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Enhanced Conversions (gehashte First-Party-Daten)

Bei `ism_form_submit` wird die gehashte E-Mail mitgeliefert — das verbessert die Attribution um 10-30%:

```typescript
// Nur bei form_submit — NICHT bei form_view!
formSubmit(assetType: string, location: string, email: string, value?: number): void {

  // 1. Standard-Event (ohne PII)
  this.push({
    event: 'ism_form_submit',
    ism_asset_type: assetType,
    ism_location: location,
    ism_conversion_value: value,
    ism_session_id: this.sessionId,
  });

  // 2. Enhanced Conversion Data (gehashte E-Mail)
  if (this.enhancedConversionsEnabled) {
    window.dataLayer.push({
      event: 'ism_form_submit_enhanced',
      enhanced_conversion_data: {
        email: email,  // GTM hasht automatisch (SHA-256)
      },
    });
  }
}
```

### 5.4 GCLID Erfassung

Die Google Click ID kommt als URL-Parameter wenn jemand über eine Google-Anzeige kommt. ISM fängt sie ab und speichert sie mit dem Lead:

```typescript
// src/frontend/services/tracking/ClickIdCapture.ts

export function captureClickIds(): { gclid?: string; fbclid?: string } {
  const params = new URLSearchParams(window.location.search);

  const ids: Record<string, string> = {};

  // Google Click ID
  const gclid = params.get('gclid');
  if (gclid) ids.gclid = gclid;

  // Facebook Click ID
  const fbclid = params.get('fbclid');
  if (fbclid) ids.fbclid = fbclid;

  // Microsoft/Bing Click ID
  const msclkid = params.get('msclkid');
  if (msclkid) ids.msclkid = msclkid;

  // In Session speichern (überlebt Seitennavigation)
  if (Object.keys(ids).length > 0) {
    try {
      sessionStorage.setItem('ism_click_ids', JSON.stringify(ids));
    } catch {
      // sessionStorage nicht verfügbar
    }
  }

  // Vorherige IDs aus Session holen (falls nicht in aktueller URL)
  try {
    const stored = sessionStorage.getItem('ism_click_ids');
    if (stored) Object.assign(ids, JSON.parse(stored));
  } catch {}

  return ids;
}
```

### 5.5 Offline-Conversion-Upload

Für Makler die Google Ads nutzen: Wenn ein Lead zum Auftrag wird (`status = 'converted'`), kann ISM das über den GCLID zurück an Google melden:

```
Lead-Journey mit GCLID:
━━━━━━━━━━━━━━━━━━━━━━━
1. Nutzer klickt Google-Anzeige → URL enthält ?gclid=EAIaIQ...
2. Nutzer durchläuft Rechner → ISM speichert GCLID mit Lead
3. Makler kontaktiert Lead → Status: 'contacted'
4. Makler gewinnt Auftrag → Status: 'converted' (Wert: z.B. 3.500 €)
5. ISM exportiert: { gclid, conversion_time, value: 3500, currency: EUR }
6. Makler lädt CSV in Google Ads hoch (oder automatisch über API)

→ Google Ads weiß jetzt: "Dieser Klick hat 3.500 € gebracht"
→ Smart Bidding optimiert auf ähnliche Klicks
```

---

## 6. Tracking-Datenbank (Aggregiert)

Neben den Leads speichern wir **aggregierte Funnel-Daten** für die Dashboard-Statistiken:

```sql
CREATE TABLE {prefix}ism_tracking_daily (
    id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date           DATE NOT NULL,
    asset_type     VARCHAR(50) NOT NULL,
    location_id    BIGINT UNSIGNED,

    -- ── Funnel-Metriken ─────────────────────
    views          INT UNSIGNED DEFAULT 0,  -- ism_asset_view
    starts         INT UNSIGNED DEFAULT 0,  -- ism_asset_start
    step_1         INT UNSIGNED DEFAULT 0,  -- ism_step_complete (step=1)
    step_2         INT UNSIGNED DEFAULT 0,
    step_3         INT UNSIGNED DEFAULT 0,
    step_4         INT UNSIGNED DEFAULT 0,
    step_5         INT UNSIGNED DEFAULT 0,
    step_6         INT UNSIGNED DEFAULT 0,
    step_7         INT UNSIGNED DEFAULT 0,
    form_views     INT UNSIGNED DEFAULT 0,  -- ism_form_view (= Partial Leads)
    form_interacts INT UNSIGNED DEFAULT 0,  -- ism_form_interact
    form_submits   INT UNSIGNED DEFAULT 0,  -- ism_form_submit (= Completed Leads)
    result_views   INT UNSIGNED DEFAULT 0,  -- ism_result_view

    -- ── Berechnete Raten ────────────────────
    -- (werden per WP-Cron täglich aktualisiert)
    start_rate     DECIMAL(5,2),   -- starts / views * 100
    completion_rate DECIMAL(5,2),  -- form_views / starts * 100
    conversion_rate DECIMAL(5,2),  -- form_submits / form_views * 100

    UNIQUE KEY idx_date_asset_loc (date, asset_type, location_id),
    INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Warum aggregiert?** Einzelne Tracking-Events werden nach 7 Tagen aggregiert und gelöscht. So bleibt die Tabelle klein und performant, während die Statistiken dauerhaft verfügbar sind.

---

## 7. Admin Dashboard — Funnel-Visualisierung

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard → Funnel-Analyse                                     │
│                                                                 │
│  Asset: [▼ Mietpreis-Kalkulator]  Location: [▼ Alle]           │
│  Zeitraum: [▼ Letzte 30 Tage]                                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │  Widget gesehen        ████████████████████████  2.340  │    │
│  │                                            │            │    │
│  │  Rechner gestartet     ██████████████████   1.450 (62%) │    │
│  │                                       │                 │    │
│  │  Alle Fragen beantw.  █████████████    980 (68%)        │    │
│  │                                  │                      │    │
│  │  ★ Formular erreicht  ████████████    920 (94%)         │    │
│  │                                 │                       │    │
│  │  Formular interagiert ████████        640 (70%)         │    │
│  │                               │                         │    │
│  │  ★★ Lead generiert    ██████          480 (75%)         │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Partial Leads (nicht abgesendet):  440                         │
│  Conversion Rate (Formular):        52,2%  (480/920)            │
│  Conversion Rate (Gesamt):          20,5%  (480/2.340)          │
│                                                                 │
│  ─── Partial vs. Completed ─────────────────────────────────    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Eingabe-Vergleich          Partial     Completed       │    │
│  │  ──────────────────────────────────────────────────     │    │
│  │  Ø Wohnfläche               72 m²       85 m²          │    │
│  │  Ø Zimmer                   2,1         3,2             │    │
│  │  Ø Baujahr                  1998        1988            │    │
│  │  Häufigste Ausstattung      Normal      Gehoben        │    │
│  │                                                         │    │
│  │  → Nutzer mit größeren/wertvolleren Objekten            │    │
│  │    senden häufiger ab!                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. DSGVO & Partial Leads

### Kritische Frage: Dürfen wir Partial Leads speichern?

```
Datenkategorie              Partial Lead          Completed Lead
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                        ❌ Nicht vorhanden    ✅ Vorhanden
E-Mail                      ❌ Nicht vorhanden    ✅ Vorhanden
Telefon                     ❌ Nicht vorhanden    ⚠ Optional
IP-Adresse                  ⚠ Gehasht            ⚠ Gehasht
Kalkulator-Eingaben         ✅ Gespeichert        ✅ Gespeichert
(Wohnfläche, Zimmer etc.)
Session-ID                  ✅ UUID (zufällig)    ✅ UUID
DSGVO-Einwilligung          ❌ Nicht gegeben      ✅ Gegeben

→ Personenbezogen?          NEIN*                 JA
→ Rechtsgrundlage           Art. 6(1)(f) DSGVO    Art. 6(1)(a) DSGVO
                            Berechtigtes Interesse Einwilligung
→ Speicherdauer             Max. 30 Tage          Bis Widerruf/Löschung
```

**\* Partial Leads sind NICHT personenbezogen**, solange:
1. Keine E-Mail, kein Name, kein Klartext-IP gespeichert wird
2. Die Session-ID ein zufälliger UUID ist (nicht Cookie-basiert)
3. Die Kalkulator-Eingaben allein keine Person identifizieren
4. IP nur als Hash gespeichert wird (irreversibel)

**Rechtsgrundlage: Art. 6(1)(f) DSGVO — Berechtigtes Interesse**
Der Website-Betreiber (Makler) hat ein berechtigtes Interesse an Funnel-Optimierung. Die Daten sind anonymisiert. Trotzdem: automatische Löschung nach 30 Tagen als Sicherheitsnetz.

### Auto-Cleanup

```php
// includes/Cron/PartialLeadCleanup.php

class PartialLeadCleanup {

    public function register(): void {
        add_action( 'ism_daily_cleanup', [ $this, 'deleteExpiredPartials' ] );
    }

    /**
     * Partial Leads nach TTL löschen
     * Standard: 30 Tage, konfigurierbar in Einstellungen
     */
    public function deleteExpiredPartials(): void {
        global $wpdb;

        $deleted = $wpdb->query(
            "DELETE FROM {$wpdb->prefix}ism_leads
             WHERE status = 'partial'
             AND expires_at IS NOT NULL
             AND expires_at < NOW()"
        );

        if ( $deleted > 0 ) {
            do_action( 'ism_partial_leads_cleaned', $deleted );
        }
    }
}
```

---

## 9. GTM Container-Export

ISM kann einen **fertig konfigurierten GTM-Container als JSON** exportieren, den der Makler einfach importieren kann:

```json
{
  "exportFormatVersion": 2,
  "containerVersion": {
    "tag": [
      {
        "name": "GA4 Event — ISM Formular erreicht",
        "type": "gaawe",
        "parameter": [
          { "key": "eventName", "value": "ism_form_view" },
          { "key": "measurementIdOverride", "value": "{{GA4 Measurement ID}}" }
        ],
        "firingTriggerId": ["trigger_ism_form_view"]
      },
      {
        "name": "GA4 Event — ISM Lead generiert",
        "type": "gaawe",
        "parameter": [
          { "key": "eventName", "value": "generate_lead" },
          { "key": "eventParameters", "value": [
            { "key": "ism_asset_type", "value": "{{DLV - ism_asset_type}}" },
            { "key": "ism_location", "value": "{{DLV - ism_location}}" },
            { "key": "value", "value": "{{DLV - ism_conversion_value}}" },
            { "key": "currency", "value": "EUR" }
          ]}
        ],
        "firingTriggerId": ["trigger_ism_form_submit"]
      },
      {
        "name": "Google Ads Conversion — ISM Lead",
        "type": "awct",
        "parameter": [
          { "key": "conversionId", "value": "{{Google Ads Conversion ID}}" },
          { "key": "conversionLabel", "value": "{{Google Ads Conversion Label}}" },
          { "key": "conversionValue", "value": "{{DLV - ism_conversion_value}}" },
          { "key": "currencyCode", "value": "EUR" }
        ],
        "firingTriggerId": ["trigger_ism_form_submit"]
      }
    ],
    "trigger": [
      {
        "name": "ISM Formular erreicht",
        "type": "customEvent",
        "customEventFilter": [
          { "parameter": [{ "key": "arg0", "value": "ism_form_view" }] }
        ]
      },
      {
        "name": "ISM Lead generiert",
        "type": "customEvent",
        "customEventFilter": [
          { "parameter": [{ "key": "arg0", "value": "ism_form_submit" }] }
        ]
      }
    ],
    "variable": [
      {
        "name": "DLV - ism_asset_type",
        "type": "v",
        "parameter": [{ "key": "name", "value": "ism_asset_type" }]
      },
      {
        "name": "DLV - ism_location",
        "type": "v",
        "parameter": [{ "key": "name", "value": "ism_location" }]
      },
      {
        "name": "DLV - ism_conversion_value",
        "type": "v",
        "parameter": [{ "key": "name", "value": "ism_conversion_value" }]
      }
    ]
  }
}
```

---

## 10. Free vs. Premium

```
Feature                                    Free              Premium
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
dataLayer Events                           ✅ Alle           ✅ Alle
Google Ads Conversion Tags                 ✅ Konfigurierbar ✅ Konfigurierbar
Partial Lead Speicherung                   ❌                ✅
Funnel-Dashboard                           ❌ Nur Zähler     ✅ Volle Visualisierung
Partial vs. Completed Vergleich            ❌                ✅
GCLID Speicherung                          ❌                ✅
Enhanced Conversions                       ❌                ✅
GTM Container-Export                       ❌                ✅
Tracking-Einstellungen (Events an/aus)     ❌                ✅
Custom Conversion Values pro Asset         ❌                ✅
Offline-Conversion-Export (CSV)            ❌                ✅
```

**Wichtig:** Die dataLayer Events sind **auch in Free** verfügbar! Jeder Makler kann GTM nutzen. Aber die erweiterte Analyse (Funnel, Partial Leads, GCLID, Export) ist Premium.

---

## 11. Zusammenfassung

```
┌──────────────────────────────────────────────────────────────┐
│  ISM Tracking & Conversion auf einen Blick                   │
│                                                              │
│  ZWEI-PHASEN-SPEICHERUNG:                                    │
│    Phase 1 (Partial): Formular erreicht → Eingaben speichern │
│    Phase 2 (Complete): Formular gesendet → Kontakt speichern │
│    → Gleicher Datensatz, session_id verknüpft beide Phasen   │
│    → Partial Leads = anonymisiert, auto-gelöscht nach 30 T.  │
│                                                              │
│  DATALAYER EVENTS (11 Events, kompletter Funnel):            │
│    asset_view → start → steps → form_view → interact →       │
│    form_submit → result_view → pdf_sent → pdf_opened         │
│                                                              │
│  GOOGLE ADS:                                                 │
│    Sekundär: ism_form_view (Beobachtung, kein Bidding)       │
│    Primär: ism_form_submit (Bidding-relevant)                │
│    Enhanced Conversions: Gehashte E-Mail bei Submit           │
│    GCLID: Automatisch erfasst + mit Lead gespeichert         │
│    Offline: CSV-Export für Conversion-Upload                  │
│                                                              │
│  MAKLER-FREUNDLICH:                                          │
│    → GTM Container-JSON zum Importieren                      │
│    → Setup-Anleitung in Plugin-Einstellungen                 │
│    → dataLayer Events auch ohne GTM intern getrackt          │
│    → Funnel-Dashboard zeigt alles visuell                    │
│                                                              │
│  DSGVO:                                                      │
│    Partial = anonymisiert (kein PII) → Berecht. Interesse    │
│    Completed = mit Einwilligung → Consent                    │
│    IP nur gehasht, Session-ID = zufällig                     │
│    Auto-Cleanup nach konfigurierbarer TTL                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
