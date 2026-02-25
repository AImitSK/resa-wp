# RESA — Infrastruktur-Plan

Dieser Plan definiert die Reihenfolge, in der die technische Infrastruktur aufgebaut wird. Jeder Schritt wird **einzeln besprochen, implementiert und getestet** bevor der nächste beginnt.

**Regel:** Keine Planungsdatei wird blind umgesetzt. Jeder Schritt hat einen eigenen Besprechungs-Zyklus.

---

## Status-Legende

- ⬜ Offen — Noch nicht besprochen
- 🟡 In Besprechung — Wird gerade geplant/diskutiert
- 🔵 In Arbeit — Implementierung läuft
- ✅ Fertig — Implementiert, getestet, committed

---

## Phase 1 — Build-Tooling & Grundgerüst

> Ziel: "Hello World" — Plugin aktivierbar, beide React-Apps laden, Tests laufen.

| #   | Schritt                  | Status | Beschreibung                                                                                                                                       |
| --- | ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | **PHP-Bootstrap**        | ✅     | `resa.php` Entry Point, Composer Autoloading (PSR-4 `Resa\`), `includes/Core/Plugin.php` Bootstrap-Klasse, Activation/Deactivation/Uninstall Hooks |
| 1.2 | **Vite-Setup**           | ✅     | `@kucrut/vite-for-wp`, zwei Entry Points (`src/frontend/main.tsx` + `src/admin/main.tsx`), `vite.config.ts`, HMR in Docker-Umgebung                |
| 1.3 | **Tailwind-Config**      | ✅     | `tailwind.config.ts` mit `resa-` Prefix, kein Preflight (Frontend Widget), `.resa-widget-root` Scope, shadcn/ui Integration                        |
| 1.4 | **Test-Setup**           | ✅     | PHPUnit 10 + Brain Monkey (`phpunit.xml`), Vitest + React Testing Library (`vitest.config.ts`), erste Smoke-Tests                                  |
| 1.5 | **Linting & Formatting** | ✅     | ESLint, Prettier, PHPStan (Level 6), PHP_CodeSniffer (WP-Standards), Husky + lint-staged Pre-Commit Hooks                                          |

**Meilenstein Phase 1:** Plugin lässt sich aktivieren, beide React-Apps rendern "Hello RESA", `npm run test` und `composer test` laufen grün.

---

## Phase 2 — Kern-Architektur

> Ziel: Das "Betriebssystem" — REST API, Datenbank, Modul-System, Feature-Gating stehen.

| #   | Schritt                    | Status | Beschreibung                                                                                                                   |
| --- | -------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 2.1 | **REST API Basis**         | ✅     | `RestController` Base-Klasse (Nonces, Permissions, Response-Format, Error Handling), Route-Registrierung, erste Test-Route     |
| 2.2 | **Datenbank-Schema**       | ✅     | Alle `resa_*` Tabellen via `dbDelta()`, Migrations-Versionierung (`resa_db_version`), Seed-Daten, Uninstall-Cleanup            |
| 2.3 | **Modul-System**           | ✅     | `ModuleRegistry`, `ModuleInterface`, `AbstractModule`, Modul-Discovery (`modules/*/module.php`), Aktivierung/Deaktivierung     |
| 2.4 | **Freemius + FeatureGate** | ✅     | SDK-Initialisierung, `FeatureGate` mit Flag-Prüfung (`free`/`pro`/`paid`), Plan-Erkennung, Graceful Degradation wenn SDK fehlt |

**Meilenstein Phase 2:** Ein Dummy-Modul kann sich registrieren, wird per FeatureGate geprüft, REST-Endpoints antworten mit korrekten Permissions, DB-Tabellen existieren.

---

## Phase 3 — Shared Services & UI-Framework

> Ziel: Alle Bausteine die Module später konsumieren sind verfügbar.

| #   | Schritt                     | Status | Beschreibung                                                                                                     |
| --- | --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| 3.1 | **Icon Registry**           | ✅     | `ResaIcon` Komponente, `registry.ts` mit 40 Custom SVGs, CSS-Variablen-Theming, PHP `IconRegistry` für PDF       |
| 3.2 | **Admin-Shell**             | ✅     | WP-Admin Menü-Registrierung (9 Submenüs), MemoryRouter für Seiten, Modul-Store Karten-Layout, Settings-Sektionen |
| 3.3 | **StepWizard-Framework**    | ✅     | Shared `StepWizard` Komponente, Step-Navigation, Zod-Validation pro Step, Framer Motion Übergänge, ProgressBar   |
| 3.4 | **LeadForm & Lead-Capture** | ✅     | LeadForm mit React Hook Form + Zod, Two-Phase REST API (partial/complete), DSGVO-Consent, Lead-Model mit CRUD    |
| 3.5 | **PDF-Service**             | ✅     | `PdfGenerator` mit Dual-Engine (DOMPDF + Puppeteer), Auto-Erkennung, Template-System, SimpleChart PHP-Klassen    |
| 3.6 | **Email-Service**           | ✅     | PHPMailer (SMTP) + Brevo Transport, Template-System, Lead-Benachrichtigungen, PDF-Attachment                     |
| 3.7 | **Tracking-Service**        | ✅     | Funnel-Events (Impression → Start → Step → Form → Submit), `resa_tracking_daily` Tabelle, Dashboard-Daten        |

**Meilenstein Phase 3:** Admin-Dashboard zeigt Modul-Store, ein Dummy-Modul kann aktiviert werden, StepWizard rendert Steps, LeadForm erfasst Leads, PDF wird generiert.

---

## Phase 4 — Erstes echtes Modul

> Ziel: Proof of Concept — Ein vollständiges Modul von A bis Z.

| #   | Schritt                  | Status | Beschreibung                                                                                                                          |
| --- | ------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | **Mietpreis-Kalkulator** | ⬜     | Erstes `[free]` Modul als Referenzimplementierung. Frontend-Steps, Calculator-Service, Ergebnis mit Nivo-Charts, PDF-Export, Settings |

**Meilenstein Phase 4:** Besucher kann auf einer WordPress-Seite den Mietpreis-Kalkulator durchlaufen, Lead wird erfasst, Makler sieht Lead im Dashboard, PDF wird per Email versendet.

---

## Notizen

- **Docker-Umgebung** ist bereits eingerichtet (WordPress, MySQL, phpMyAdmin, Mailpit, Node/Puppeteer)
- **Planungsdocs** in `docs/planning/` sind Referenz, werden aber nicht blind umgesetzt — jeder Schritt wird individuell besprochen
- Bei jedem Schritt klären: Was aus den Planungsdocs passt, was angepasst werden muss, welche Entscheidungen offen sind
