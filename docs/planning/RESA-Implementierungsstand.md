# RESA Implementierungsstand

> Stand: 06.03.2026 | Analysiert gegen Dokumentation in `docs/planning/`

---

## Zusammenfassung

| Bereich              | Fertigstellung | Status             |
| -------------------- | -------------- | ------------------ |
| **Core Plugin**      | ~90%           | ✅ Produktionsreif |
| **Mietpreisrechner** | ~100%          | ✅ Produktionsreif |
| **Propstack Add-on** | ~70%           | ⚠️ MVP-ready       |
| **Frontend Widget**  | ~85%           | ✅ Funktional      |
| **Infrastruktur**    | ~95%           | ✅ Solide          |

---

## 1. Core Plugin — Implementiert

### 1.1 Lead Management (VOLLSTÄNDIG)

- **Datei:** `includes/Models/Lead.php` (546 Zeilen)
- Two-Phase Capture: `createPartial()` → `complete()`
- Status-Workflow: partial → new → contacted → qualified → completed → lost
- GCLID/FBCLID Capture für Offline-Conversion
- Auto-Expiration für Partial Leads (30 Tage)
- **Admin UI:** `src/admin/pages/Leads.tsx` (1500+ Zeilen)
    - Tabelle mit Filterung, Sortierung, Pagination
    - Lead-Details mit Kommunikationshistorie
    - CSV-Export (Premium)

### 1.2 Location Management (VOLLSTÄNDIG)

- **Datei:** `includes/Models/Location.php`
- CRUD mit Koordinaten, Regionalfaktoren, Agent-Zuweisung
- **Admin UI:** `src/admin/pages/Locations.tsx`
    - Map Picker (Leaflet)
    - Bulk CSV Import

### 1.3 Agent/Makler Management (VOLLSTÄNDIG)

- **Datei:** `includes/Models/Agent.php`
- Agent-CRUD mit Lead-Zuweisung
- Location-basierte Zuordnung

### 1.4 Email Service (VOLLSTÄNDIG)

- **Dateien:** `includes/Services/Email/`
    - `EmailService.php` — Orchestrierung
    - `BrevoTransport.php` — Brevo API (Premium)
    - `SmtpTransport.php` — Custom SMTP (Premium)
    - `WpMailTransport.php` — WordPress Fallback (Free)
    - `EmailLogger.php` — Zustellungs-Tracking
- Template-System mit Variablen-Ersetzung
- **Getestet:** E-Mails werden korrekt an Mailpit gesendet

### 1.5 PDF Service (VOLLSTÄNDIG)

- **Dateien:** `includes/Services/Pdf/`
    - `LeadPdfService.php` (1186 Zeilen) — Orchestrierung
    - `PdfGenerator.php` — Engine-Auswahl
    - `DompdfEngine.php` — DOMPDF Fallback
    - `PuppeteerEngine.php` — Node.js/Puppeteer (empfohlen)
    - `Templates/rent-analysis.php` — Mietpreis-Template
    - `Charts/SimpleBarChart.php`, `SimpleGaugeChart.php`
- **Getestet:** PDFs werden generiert (368 KB) und per E-Mail versendet

### 1.6 Tracking & Analytics (VOLLSTÄNDIG)

- **Datei:** `includes/Services/Tracking/TrackingService.php`
- Funnel-Events: view, start, form_view, form_submit, result_view
- Tägliche Aggregation in `resa_tracking_daily`
- **Admin UI:** `src/admin/pages/Analytics.tsx` mit Nivo Charts

### 1.7 REST API (VOLLSTÄNDIG)

- 21+ Controller in `includes/Api/`
- Nonce-Verification, Capability-Checks
- Spam-Guard für öffentliche Endpoints

### 1.8 Module Registry (VOLLSTÄNDIG)

- **Dateien:** `includes/Core/`
    - `ModuleRegistry.php` — Discovery & Registration
    - `ModuleInterface.php` — Vertrag
    - `AbstractModule.php` — Basisklasse

### 1.9 Freemius Integration (VOLLSTÄNDIG)

- **Dateien:** `includes/Freemius/`
    - `FreemiusInit.php` — SDK Bootstrap
    - `FeatureGate.php` — Feature Gating
- Free-Limits: 2 Module, 1 Location, 50 Leads
- Add-on Support (Propstack)

### 1.10 Database Schema (VOLLSTÄNDIG)

- 6 Custom Tables via dbDelta:
    - `resa_leads`, `resa_tracking_daily`, `resa_locations`
    - `resa_email_log`, `resa_agents`, `resa_agent_locations`
- Migrations in `includes/Database/Schema.php`

---

## 2. Mietpreisrechner Modul — Produktionsreif

### 2.1 ModuleInterface (VOLLSTÄNDIG)

- **Datei:** `modules/rent-calculator/RentCalculatorModule.php`
- Alle Interface-Methoden implementiert
- Flag: `free` (immer verfügbar)

### 2.2 Frontend Steps (VOLLSTÄNDIG)

7 Steps mit Zod-Validierung:

1. `PropertyTypeStep` — Immobilienart
2. `PropertyDetailsStep` — Grunddaten (Größe, Zimmer, Baujahr)
3. `CityStep` — Standort-Auswahl
4. `ConditionStep` — Zustand
5. `LocationRatingStep` — Lage (1-5)
6. `FeaturesStep` — Ausstattung
7. `AddressStep` — Adresse (optional, mit Karte)

### 2.3 Berechnungslogik (VOLLSTÄNDIG)

- **Datei:** `modules/rent-calculator/RentCalculatorService.php`
- Formel: `Preis/m² = Basis × Größenfaktor × Lage × Zustand × Typ × Alter + Features`
- 4 Region-Presets (ländlich, Kleinstadt, Mittelstadt, Großstadt)
- Location-spezifische Overrides
- Marktposition-Berechnung (Perzentile)

### 2.4 REST Endpoints (VOLLSTÄNDIG)

- `POST /modules/rent-calculator/calculate`
- `GET /modules/rent-calculator/config`

### 2.5 Result Display (VOLLSTÄNDIG)

- **Datei:** `modules/rent-calculator/src/result/RentResult.tsx`
- MarketPositionGauge Visualisierung
- Karten-Integration (Leaflet)
- DACH-Zahlenformatierung

### 2.6 PDF-Generierung (VOLLSTÄNDIG)

- **Template:** `includes/Services/Pdf/Templates/rent-analysis.php`
- Charts: SimpleBarChart, SimpleGaugeChart
- Statische Karte via OSM Tiles
- **Getestet:** 368 KB PDF mit Charts und Karte

### 2.7 Admin Settings (VOLLSTÄNDIG)

- 3 Tabs: Overview, Setup, Location Values
- Pauschal/Individuell Modus
- Faktor-Editor für alle Multiplikatoren

---

## 3. Propstack Add-on — MVP-Ready

### 3.1 Implementiert

- **API Integration:** 6 Endpoints (Kontakte, Aktivitäten, Makler, Sources)
- **Lead Sync:** Automatisch bei `resa_lead_created` Hook
- **Duplikat-Erkennung:** E-Mail-basiert
- **Makler-Zuweisung:** Standard + City-Mapping
- **Aktivitäten:** Task-Erstellung mit Due Date
- **Newsletter DOI:** Message-Endpoint
- **Settings UI:** `src/admin/components/integrations/PropstackTab.tsx`
- **REST API:** 8 Admin-Endpoints mit Caching
- **Freemius:** Parent-Child Beziehung korrekt konfiguriert

### 3.2 Lücken für Produktion

| Feature                      | Status             | Priorität |
| ---------------------------- | ------------------ | --------- |
| Sync-Status UI in Lead-Liste | ❌ Fehlt           | Hoch      |
| Retry-Mechanismus            | ❌ Fehlt           | Hoch      |
| Manual Re-sync Button        | ❌ Fehlt (nur API) | Mittel    |
| Bidirektionaler Sync         | ❌ Fehlt           | Niedrig   |
| DSGVO-Consent-Check vor Sync | ❌ Fehlt           | Hoch      |
| Rate Limiting                | ❌ Fehlt           | Mittel    |

---

## 4. Frontend Widget — Funktional

### 4.1 Implementiert

- **StepWizard:** Multi-Step mit Framer Motion Animationen
- **LeadForm:** DSGVO-Consent, Honeypot, Validierung
- **ProgressBar:** Step-Indikatoren
- **CSS Isolation:** `resa-` Prefix, kein Theme-Konflikt
- **Two-Phase Leads:** Partial → Complete
- **Tracking:** Google Ads, GTM, Enhanced Conversions
- **Shortcode:** `[resa type="rent-calculator" city="slug"]`

### 4.2 Lücken

| Feature               | Status       | Notiz                    |
| --------------------- | ------------ | ------------------------ |
| Nivo Charts im Result | ❌ Fehlt     | Nur Text + Gauge aktuell |
| Icon Registry         | ⚠️ Partial   | Lucide direkt importiert |
| Map Components        | ✅ Vorhanden | Leaflet + Google Maps    |

---

## 5. Was FEHLT

### 5.1 Weitere Module (7 von 8 geplant)

- ❌ Immobilienwert-Rechner (free)
- ❌ Kaufnebenkosten-Rechner (pro)
- ❌ Budgetrechner (pro)
- ❌ Renditerechner (pro)
- ❌ Energieeffizienz-Check (pro)
- ❌ Verkäufer-Checkliste (pro)
- ❌ Käufer-Checkliste (pro)

**Aufwand:** Framework steht, Pattern vom Mietpreisrechner kann kopiert werden.

### 5.2 Internationalisierung (i18n)

- ❌ Keine `.pot/.po/.mo/.json` Dateien
- ❌ `languages/` Ordner leer
- ❌ Kein `wp_set_script_translations()` Setup

**Aufwand:** `npm run i18n:build` einrichten, Strings extrahieren.

### 5.3 PDF Designer UI

- ❌ Drag & Drop Block-Editor (Admin)
- ❌ Asset-spezifische Template-Varianten
- ❌ Logo/Farben/Footer Customization UI

**Notiz:** Backend-Infrastruktur vorhanden, nur Admin UI fehlt.

### 5.4 Email Template Designer

- ❌ WYSIWYG Editor für Templates
- ❌ Template-Preview/Test
- ❌ Per-Modul Varianten

**Notiz:** Template-System funktioniert, nur UI fehlt.

### 5.5 Tests

- ⚠️ Unit Tests vorhanden (Vitest, PHPUnit)
- ❌ E2E Tests (Playwright Setup dokumentiert, nicht implementiert)
- ❌ Integration Tests für CRM-Sync

---

## 6. Empfohlene nächste Schritte

### Priorität 1: Produktions-Hardening

1. **Propstack Sync-Status UI** — Spalte in Lead-Liste
2. **Propstack DSGVO-Check** — Consent prüfen vor Sync
3. **Propstack Retry-Queue** — Fehlgeschlagene Syncs nicht verlieren

### Priorität 2: Zweites Modul

4. **Immobilienwert-Rechner** — Zweites Free-Modul nach bestehendem Pattern
5. **PDF Template** — `value-analysis.php` erstellen

### Priorität 3: Polish

6. **Nivo Charts** — Im Result-Screen für visuellen Impact
7. **i18n Setup** — POT-Datei generieren

### Priorität 4: Premium Features

8. **PDF Designer UI** — Admin-Seite für Template-Customization
9. **Email Template Editor** — WYSIWYG für E-Mail-Templates

---

## 7. Architektur-Bewertung

### Stärken

- ✅ Saubere Drei-Schichten-Architektur (Core → Module → Add-ons)
- ✅ Vollständige REST API mit Security
- ✅ Two-Phase Lead Capture für Funnel-Tracking
- ✅ Dual PDF Engine (DOMPDF + Puppeteer)
- ✅ CSS Isolation für Theme-Kompatibilität
- ✅ Freemius Integration mit Feature Gating

### Technische Schulden

- ⚠️ Node-Container oft unhealthy (Puppeteer)
- ⚠️ i18n nicht initialisiert
- ⚠️ Test-Coverage unbekannt
- ⚠️ Nivo Charts nicht genutzt (obwohl installiert)

---

## 8. Fazit

**Das Core Plugin und der Mietpreisrechner sind produktionsreif.**

Der komplette Lead-Flow funktioniert:

- Widget → Steps → LeadForm → Lead (DB) → PDF-Generierung → E-Mail-Versand

**Hauptarbeit für Launch:**

1. Propstack Sync-Status sichtbar machen
2. Weiteres Free-Modul (Immobilienwert) für Produktpalette
3. i18n für professionellen Auftritt

**Alle anderen Features sind "Nice-to-have" und können nach Launch iteriert werden.**
