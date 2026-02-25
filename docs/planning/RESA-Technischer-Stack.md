# RESA — Technischer Gesamtstack

## Architektur, Toolchain & Entwicklungsumgebung

---

## 1. Architektur-Überblick

RESA ist ein **WordPress-Plugin mit React-Frontend und modularer Architektur**. Das Backend läuft in PHP (WordPress-Konventionen), das Frontend als isolierte React-App die per Shortcode in beliebige Seiten eingebettet wird.

RESA folgt einem **Three-Tier-Modell** (siehe `RESA-Modulare-Architektur.md`):
- **Tier 1: Kernplugin** (`includes/` + `src/`) — Plattform mit allen Services
- **Tier 2: Lead Tool Module** (`modules/`) — Registrierbare, aktivierbare Tools mit eigenem Flag (free/pro/paid)
- **Tier 3: Integrationen** — Basis (free im Kern) + kostenpflichtige Add-ons (separate Plugins)

```
┌─────────────────────────────────────────────────────────────────┐
│                     RESA Plugin — Gesamtarchitektur              │
│                                                                 │
│  ┌───────────────────────┐    ┌────────────────────────────┐    │
│  │   BACKEND (PHP)       │    │   FRONTEND (React/TS)      │    │
│  │                       │    │                            │    │
│  │   WordPress Plugin    │◄──►│   Vite + React 18          │    │
│  │   PHP 8.1+            │REST│   TypeScript               │    │
│  │   Composer (PSR-4)    │API │   Tailwind CSS (Prefixed)  │    │
│  │   Freemius SDK        │    │   shadcn/ui Komponenten    │    │
│  │                       │    │   Framer Motion            │    │
│  │   ┌─────────────────┐ │    │   wp.i18n (Übersetzung)    │    │
│  │   │ REST API        │ │    │                            │    │
│  │   │ /wp-json/resa/v1 │ │    │   2 Entry Points:          │    │
│  │   └─────────────────┘ │    │   ① frontend.tsx (Widget)  │    │
│  │   ┌─────────────────┐ │    │   ② admin.tsx (Dashboard)  │    │
│  │   │ Custom DB Tables│ │    │                            │    │
│  │   │ resa_leads       │ │    └────────────────────────────┘    │
│  │   │ resa_locations   │ │                                      │
│  │   │ resa_emails      │ │    ┌────────────────────────────┐    │
│  │   └─────────────────┘ │    │   BUILD (Toolchain)        │    │
│  │   ┌─────────────────┐ │    │                            │    │
│  │   │ PDF Generator   │ │    │   Vite 6                   │    │
│  │   │ (DOMPDF)        │ │    │   ESLint + Prettier        │    │
│  │   └─────────────────┘ │    │   WP-CLI (i18n)            │    │
│  │   ┌─────────────────┐ │    │   Composer (PHP deps)      │    │
│  │   │ E-Mail Engine   │ │    │   npm (JS deps)            │    │
│  │   │ (SMTP/API)      │ │    │                            │    │
│  │   └─────────────────┘ │    └────────────────────────────┘    │
│  └───────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Warum dieser Stack?

### React + TypeScript (nicht Vanilla JS, nicht Vue)

```
Kriterium                React + TS          Vanilla JS         Vue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Komponentenarchitektur   ✅ Perfekt          ❌ Manuell         ✅ Gut
State Management         ✅ Hooks/Zustand    ❌ Komplex         ✅ Pinia
Typ-Sicherheit           ✅ TypeScript       ❌ Fehleranfällig  ✅ Möglich
WordPress-Kompatibel     ✅ wp.i18n, wp.el   ✅ Nativ           ⚠ Adapter
Community & Talentpool   ✅ Riesig           ✅ Alle können JS  ⚠ Kleiner
Multi-Step-Formulare     ✅ Ideal            ⚠ Aufwändig       ✅ Gut
Animation (Framer)       ✅ Framer Motion    ❌ Manuell/GSAP    ⚠ Motion-Vue
Design-System            ✅ shadcn/ui        ❌ Keins           ⚠ Weniger
WordPress bundelt React  ✅ Bereits da       —                  ❌ Nein
```

**Entscheidung:** React ist in WordPress bereits eingebaut (`wp-element`). Wir nutzen die WordPress-gebundelte Version für den Admin-Bereich und bundeln ein eigenes React für die Frontend-Widgets (Isolation von Theme-Konflikten).

### Vite (nicht Webpack, nicht wp-scripts)

```
Kriterium                Vite 6             wp-scripts          Webpack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dev-Server Start         ~200ms             ~5-15s              ~10-30s
HMR (Hot Reload)         ✅ Instant         ⚠ Langsam          ⚠ Langsam
Build-Geschwindigkeit    ✅ Schnell         ⚠ Mittel           ❌ Langsam
Konfiguration            ✅ Minimal         ✅ Zero-config      ❌ Komplex
Tree-Shaking             ✅ Rollup          ✅ Webpack          ✅ Webpack
Multiple Entry Points    ✅ Einfach         ⚠ Umständlich      ✅ Möglich
TypeScript               ✅ Nativ           ✅ Ja               ⚠ Loader
CSS Modules / Tailwind   ✅ Nativ           ⚠ Extra Config     ⚠ Extra Config
```

**Entscheidung:** Vite 6 mit `@kucrut/vite-for-wp` für die WordPress-Integration. Schnellste Developer Experience, saubere Manifest-basierte Asset-Einbindung in PHP.

### Tailwind CSS (Prefixed) + shadcn/ui

```
Kriterium                Tailwind+shadcn    Bootstrap           Custom CSS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Bundle-Size              ✅ Nur genutzte    ❌ ~150KB           ✅ Minimal
Theme-Konflikte          ✅ Prefix möglich  ❌ Global           ✅ Keine
Konsistente UI           ✅ Design-System   ✅ Grid/Typo        ❌ Manuell
Anpassbar                ✅ Vollständig     ⚠ Override-Frust   ✅ Vollständig
Barrierefreiheit         ✅ Radix (shadcn)  ⚠ Teilweise        ❌ Manuell
Dunkler Modus            ✅ Eingebaut       ⚠ Manuell          ❌ Manuell
```

**Entscheidung:** Tailwind CSS mit einem Prefix (`resa-`) um Konflikte mit dem WordPress-Theme zu vermeiden. shadcn/ui als Komponentenbibliothek — basiert auf Radix UI (barrierefrei), voll anpassbar, kein Framework-Lock-in (Komponenten werden kopiert, nicht als Dependency installiert).

---

## 3. Detaillierter Stack

### 3.1 Backend (PHP)

```
Komponente              Technologie            Version     Zweck
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprache                 PHP                    8.1+        Typen, Enums, Fibers
Paketmanager            Composer               2.x         Autoloading (PSR-4)
Autoloading             PSR-4                  —           Namespace: Resa\
Monetarisierung         Freemius SDK           2.x         Lizenzierung, Checkout
PDF-Generierung         DOMPDF                 2.x         Fallback-Engine (PHP only)
                        + Puppeteer (Node.js)  23.x        Empfohlene Engine (Nivo-Charts
                                                            als SVG, pixelgenaue PDFs)
E-Mail                  PHPMailer (WP-Core)    —           SMTP-Versand
                        + Brevo PHP SDK        —           API-basierter Versand
HTTP-Client             wp_remote_*            —           WordPress-native HTTP
Datenbank               WordPress $wpdb        —           Custom Tables + Options
Migration               Eigenes Schema         —           dbDelta() bei Aktivierung
Cron/Queue              WP-Cron + Action       —           Async E-Mail, Webhooks
                        Scheduler
Testing                 PHPUnit                10.x        Unit + Integration Tests
Code-Qualität           PHP_CodeSniffer        3.x         WordPress Coding Standards
                        + PHPCS-WP-Standard
```

### 3.2 Frontend (JavaScript / TypeScript)

```
Komponente              Technologie            Version     Zweck
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sprache                 TypeScript             5.x         Typsicherheit
Framework               React                  18.x        Komponentenarchitektur
Build-Tool              Vite                   6.x         Dev-Server, Build, HMR
WP-Integration          @kucrut/vite-for-wp    —           Manifest, Asset-Enqueue
Styling                 Tailwind CSS           3.x         Utility-First, Prefixed
UI-Komponenten          shadcn/ui              —           Radix-basiert, kopiert
Animation               Framer Motion          11.x        Schritt-Übergänge, Micro
Icons                   Lucide React           —           Zentrale Icon Registry
                                                                (ResaIcon + semantische Namen)
Formulare               React Hook Form        7.x         Performant, Validierung
Validierung             Zod                    3.x         Schema-basiert, TS-first
State Management        Zustand                4.x         Leichtgewichtig, kein Redux
i18n (Frontend)         @wordpress/i18n        —           wp.i18n Kompatibilität
HTTP-Client             @tanstack/react-query  5.x         Caching, Retry, Mutations
Charts                  Nivo (@nivo/*)         0.87+       Moderne Ergebnis-Visualisierung
                                                                (Bar, Line, Pie, Radar, Bullet,
                                                                 Gauge, Waffle — s. Charts-Dok.)
Datum/Zeit              date-fns               3.x         Leichtgewichtig, tree-shakable
Zahlenformat            Intl.NumberFormat       —           Native Browser-API
Karten                  Leaflet + react-leaflet 1.9/4.2     OSM-Standard (kostenlos, DSGVO)
                        @vis.gl/react-google-   1.x         Google Maps (optional, Premium)
                        maps (optional)
Testing                 Vitest                 1.x         Vite-nativ, schnell
                        + Testing Library      —           React-Komponenten-Tests
Linting                 ESLint                 9.x         Code-Qualität
Formatting              Prettier               3.x         Code-Formatierung
```

### 3.3 Infrastruktur & Tooling

```
Komponente              Technologie            Zweck
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Versionskontrolle       Git + GitHub           Code, Issues, CI/CD
CI/CD                   GitHub Actions         Build, Test, Deploy
Paket (JS)              npm                    Dependencies
Paket (PHP)             Composer               Dependencies
i18n-Build              WP-CLI                 POT/PO/MO/JSON generieren
Code-Qualität           Husky + lint-staged    Pre-commit Hooks
Plugin-Distribution     Freemius               Updates, Lizenzierung
WordPress.org           SVN (automatisiert)    Free-Version Distribution
Lokale Entwicklung      wp-env oder LocalWP    WordPress-Testumgebung
```

---

## 4. Verzeichnisstruktur

```
resa/
├── resa.php                          ← Plugin Entry Point
├── uninstall.php                    ← Cleanup bei Deinstallation
├── readme.txt                       ← WordPress.org Readme
├── composer.json                    ← PHP Dependencies
├── package.json                     ← JS Dependencies + Scripts
├── vite.config.ts                   ← Vite Konfiguration
├── tailwind.config.ts               ← Tailwind mit resa- Prefix
├── tsconfig.json                    ← TypeScript Konfiguration
├── postcss.config.js                ← PostCSS für Tailwind
├── .eslintrc.js                     ← ESLint Konfiguration
├── .prettierrc                      ← Prettier Konfiguration
├── phpcs.xml                        ← PHP CodeSniffer Regeln
│
├── includes/                        ← PHP Backend (PSR-4: Resa\)
│   ├── Core/
│   │   ├── Plugin.php               ← Haupt-Bootstrap, Hooks
│   │   ├── Activator.php            ← DB-Tabellen erstellen
│   │   ├── Deactivator.php          ← Aufräumen
│   │   ├── I18n.php                 ← Sprachladung
│   │   ├── ModuleRegistry.php       ← ★ Modul-Discovery + Registry
│   │   ├── ModuleInterface.php      ← ★ Vertrag für alle Lead Tool Module
│   │   ├── AbstractModule.php       ← ★ Basis-Implementierung
│   │   ├── FeatureGate.php          ← ★ Plan + Flag Prüfung (free/pro/paid)
│   │   └── IconRegistry.php         ← ★ Zentrale Icon-Verwaltung
│   │
│   ├── Admin/
│   │   ├── AdminMenu.php            ← WP-Admin Menü registrieren
│   │   ├── AdminPages.php           ← React-Admin mounten
│   │   ├── ModuleStorePage.php      ← ★ Modul-Übersicht ("Store")
│   │   └── Settings.php             ← Options API Wrapper
│   │
│   ├── Api/
│   │   ├── RestController.php       ← Basis REST-Controller
│   │   ├── LeadsController.php      ← /resa/v1/leads
│   │   ├── LocationsController.php  ← /resa/v1/locations
│   │   ├── ModulesController.php    ← ★ /resa/v1/modules/* (Registry-API)
│   │   ├── SettingsController.php   ← /resa/v1/settings
│   │   └── EmailController.php      ← /resa/v1/emails
│   │
│   ├── Models/
│   │   ├── Lead.php                 ← Lead CRUD
│   │   ├── Location.php             ← Location CRUD
│   │   ├── Agent.php                ← Makler
│   │   └── EmailTemplate.php        ← E-Mail-Vorlagen
│   │
│   ├── Services/
│   │   ├── Calculator/
│   │   │   └── CalculatorInterface.php  ← Vertrag, den Module implementieren
│   │   │
│   │   ├── Pdf/
│   │   │   ├── PdfService.php           ← DOMPDF/Puppeteer Wrapper
│   │   │   ├── PdfBlockInterface.php    ← Vertrag für Modul-PDF-Bausteine
│   │   │   └── templates/
│   │   │       └── base-layout.php      ← Basis-Layout (global)
│   │   │
│   │   ├── Email/
│   │   │   ├── EmailService.php         ← Dispatcher (SMTP/API)
│   │   │   ├── SmtpTransport.php        ← SMTP-Versand
│   │   │   ├── BrevoTransport.php       ← Brevo API
│   │   │   └── EmailLogger.php          ← Versandlog
│   │   │
│   │   ├── Integration/
│   │   │   ├── IntegrationInterface.php ← Vertrag für Add-on-Integrationen
│   │   │   ├── WebhookIntegration.php   ← Basis-Integration (Free)
│   │   │   └── EmailNotification.php    ← Basis-Integration (Free)
│   │   │
│   │   ├── Tracking/
│   │   │   └── TrackingService.php      ← Funnel-Tracking, Events
│   │   │
│   │   └── LeadDistribution/
│   │       └── LeadRouter.php           ← Makler-Zuordnung
│   │
│   ├── Database/
│   │   ├── Schema.php               ← Tabellen-Definition
│   │   ├── Migrator.php             ← dbDelta Wrapper
│   │   └── Seeder.php               ← Demo-Daten (Dev)
│   │
│   ├── Shortcode/
│   │   └── ResaShortcode.php        ← [resa] Shortcode Handler
│   │
│   └── Freemius/
│       └── FreemiusInit.php         ← SDK Bootstrap
│
├── modules/                         ← ★ LEAD TOOL MODULE
│   ├── rent-calculator/             ← 🟢 Free
│   │   ├── module.php               ← Bootstrap
│   │   ├── RentCalculatorModule.php ← ModuleInterface
│   │   ├── RentCalculatorService.php← Berechnungslogik
│   │   ├── src/                     ← Frontend-Komponenten
│   │   └── tests/                   ← Modul-Tests
│   ├── value-calculator/            ← 🟢 Free
│   ├── purchase-costs/              ← 🔵 Pro
│   ├── budget-calculator/           ← 🔵 Pro
│   ├── roi-calculator/              ← 🔵 Pro
│   ├── energy-check/                ← 🔵 Pro
│   ├── seller-checklist/            ← 🔵 Pro
│   └── buyer-checklist/             ← 🔵 Pro
│
├── src/                             ← TypeScript/React Quellcode
│   ├── frontend/                    ← Widget (Besucherseite) — Kern-Bausteine
│   │   ├── main.tsx                 ← Entry Point Frontend
│   │   ├── App.tsx                  ← Widget Root Component
│   │   │
│   │   ├── components/
│   │   │   ├── shared/              ← Geteilte Bausteine (alle Module nutzen diese)
│   │   │   │   ├── StepWizard.tsx   ← Multi-Step Framework
│   │   │   │   ├── LeadForm.tsx     ← Universelles Lead-Formular
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── ResultCard.tsx
│   │   │   ├── ui/                  ← shadcn/ui (kopiert)
│   │   │   │   ├── button.tsx
│   │   │   │   └── ...
│   │   │   └── icons/               ← ★ Icon Registry
│   │   │       ├── ResaIcon.tsx     ← <ResaIcon name="house" />
│   │   │       ├── registry.ts      ← Semantischer Name → Komponente
│   │   │       └── sets/
│   │   │           └── default.ts   ← Standard-Set (Lucide-basiert)
│   │   │
│   │   ├── hooks/                   ← Shared React Hooks
│   │   │   ├── useApi.ts           ← REST-API Wrapper
│   │   │   ├── useLocale.ts        ← Sprache & Zahlenformat
│   │   │   └── useModuleConfig.ts  ← ★ Modul-Konfiguration laden
│   │   │
│   │   ├── lib/                     ← Utilities
│   │   │   ├── api-client.ts       ← Fetch + Nonce
│   │   │   ├── format.ts           ← Zahlen, Währung, Datum
│   │   │   └── validation.ts       ← Zod-Schemas
│   │   │
│   │   ├── types/                   ← TypeScript-Typen
│   │   │   ├── asset.ts
│   │   │   ├── lead.ts
│   │   │   ├── location.ts
│   │   │   └── api.ts
│   │   │
│   │   └── styles/
│   │       ├── frontend.css         ← Tailwind Entry
│   │       └── reset.css            ← Widget-Isolation
│   │
│   └── admin/                       ← Admin-Dashboard (WP-Backend)
│       ├── main.tsx                 ← Entry Point Admin
│       ├── App.tsx                  ← Admin Root Component
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Leads.tsx
│       │   ├── LeadDetail.tsx
│       │   ├── ModuleStore.tsx      ← ★ Modul-Übersicht ("Chrome Store")
│       │   ├── ModuleSettings.tsx   ← ★ Einstellungen pro aktivem Modul
│       │   ├── Communication.tsx
│       │   ├── PdfDesigner.tsx
│       │   ├── Locations.tsx
│       │   ├── ShortcodeGenerator.tsx
│       │   ├── Integrations.tsx
│       │   └── Settings.tsx
│       │
│       ├── components/              ← Admin-spezifische Komponenten
│       │   ├── LeadTable.tsx
│       │   ├── LocationForm.tsx
│       │   ├── ModuleCard.tsx       ← ★ Karte im Store (Icon, Flag, Toggle)
│       │   ├── ModuleSettingsPanel.tsx ← ★ Dynamisches Settings-Panel
│       │   ├── EmailTemplateEditor.tsx
│       │   ├── PdfBlockEditor.tsx
│       │   └── StatsCard.tsx
│       │
│       ├── hooks/
│       │   ├── useLeads.ts
│       │   ├── useLocations.ts
│       │   └── useSettings.ts
│       │
│       └── styles/
│           └── admin.css            ← Tailwind Entry (Admin)
│
├── dist/                            ← Vite Build Output
│   ├── frontend/
│   │   ├── main-[hash].js
│   │   └── main-[hash].css
│   ├── admin/
│   │   ├── main-[hash].js
│   │   └── main-[hash].css
│   └── .vite/
│       └── manifest.json            ← Asset-Map für PHP
│
├── languages/                       ← i18n Dateien
│   ├── resa.pot
│   ├── resa-de_DE.po / .mo / .json
│   └── ...
│
├── vendor/                          ← Composer (PHP Dependencies)
│   ├── autoload.php
│   ├── dompdf/dompdf/
│   └── ...
│
├── freemius/                        ← Freemius SDK
│   └── start.php
│
└── tests/
    ├── php/                         ← PHPUnit Tests
    │   ├── Unit/
    │   └── Integration/
    └── js/                          ← Vitest Tests
        ├── components/
        └── hooks/
```

---

## 5. Die zwei Entry Points

RESA hat **zwei separate React-Anwendungen**, die unabhängig voneinander gebaut und geladen werden:

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ENTRY POINT 1: Frontend-Widget                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                         │
│                                                          │
│  Datei:     src/frontend/main.tsx                        │
│  Lädt auf:  Jeder Seite mit [resa] Shortcode              │
│  React:     Eigenes Bundle (NICHT wp-element)            │
│  Größe:     ~80-120 KB (gzip)                            │
│  Styling:   Isoliert (Shadow DOM oder starkes Prefixing) │
│  Zweck:     Rechner, Formulare, Ergebnisse               │
│                                                          │
│  Warum eigenes React?                                    │
│  → Das Widget muss auf JEDER WordPress-Seite laufen      │
│  → Darf nicht mit Theme-CSS kollidieren                  │
│  → Darf nicht von Theme-React-Version abhängen           │
│  → Muss garantiert funktionieren                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ENTRY POINT 2: Admin-Dashboard                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                          │
│                                                          │
│  Datei:     src/admin/main.tsx                           │
│  Lädt auf:  WP-Admin RESA-Seiten                          │
│  React:     WordPress-gebundelt (wp-element)             │
│  Größe:     ~150-250 KB (gzip, React bereits da)         │
│  Styling:   WordPress-Admin + Tailwind (Prefixed)        │
│  Zweck:     Dashboard, Lead-Verwaltung, Einstellungen    │
│                                                          │
│  Warum wp-element?                                       │
│  → Im Admin ist React bereits geladen (Gutenberg)        │
│  → Spart Bundle-Größe                                    │
│  → Konsistenter mit WP-Admin-UI                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Vite-Konfiguration (Multi Entry)

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: {
        frontend: resolve(__dirname, 'src/frontend/main.tsx'),
        admin: resolve(__dirname, 'src/admin/main.tsx'),
      },
      output: {
        entryFileNames: '[name]/[name]-[hash].js',
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: '[name]/[name]-[hash].[ext]',
      },
      // Admin: React als External (kommt von WordPress)
      // Frontend: React wird gebundelt (Isolation)
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/frontend/components'),
      '@admin': resolve(__dirname, 'src/admin'),
    },
  },
});
```

---

## 6. Frontend-Widget: CSS-Isolation

Das wichtigste technische Problem: **Das RESA-Widget darf nicht vom Theme-CSS beeinflusst werden** und darf umgekehrt das Theme nicht kaputt machen.

### Lösung: Tailwind Prefix + CSS Scoping

```typescript
// tailwind.config.ts (Frontend)
export default {
  prefix: 'resa-',                    // Alle Klassen: resa-flex, resa-p-4
  important: '.resa-widget-root',     // Spezifität nur innerhalb Root
  content: ['./src/frontend/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,                // KEIN CSS-Reset (würde Theme zerstören)
  },
  theme: {
    extend: {
      colors: {
        primary: 'var(--resa-color-primary)',
        secondary: 'var(--resa-color-secondary)',
      },
    },
  },
};
```

```css
/* src/frontend/styles/reset.css — Widget-eigener Mini-Reset */
.resa-widget-root {
  /* Eigene Baseline, beeinflusst nichts außerhalb */
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--resa-color-text, #1a1a1a);
  box-sizing: border-box;
}
.resa-widget-root *, .resa-widget-root *::before, .resa-widget-root *::after {
  box-sizing: inherit;
}
```

```php
// Shortcode-Output:
function resa_shortcode_render( $atts ) {
    $config = json_encode( $atts );
    return sprintf(
        '<div class="resa-widget-root" data-resa-config=\'%s\'></div>',
        esc_attr( $config )
    );
}
```

---

## 7. REST API Design

Alle Daten fließen über die WordPress REST API zwischen Frontend/Admin und Backend.

```
Endpunkt                            Methode    Auth       Beschreibung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PUBLIC (Frontend-Widget, kein Login nötig):
/resa/v1/modules                     GET        —          Verfügbare + aktive Module
/resa/v1/modules/{slug}/config       GET        —          Modul-Frontend-Konfiguration
/resa/v1/modules/{slug}/calculate    POST       —          Berechnung durchführen
/resa/v1/leads/partial               POST       Nonce      Phase 1: Partial Lead (Formular erreicht)
/resa/v1/leads/complete              POST       Nonce      Phase 2: Lead vervollständigen (abgesendet)
/resa/v1/tracking                    POST       —          Tracking-Event speichern

ADMIN (WP-Admin, eingeloggt + Nonce):
/resa/v1/leads                       GET        Admin      Alle Leads (paginiert, Filter)
/resa/v1/leads/{id}                  GET        Admin      Lead-Detail
/resa/v1/leads/{id}                  PATCH      Admin      Lead aktualisieren (Status, Notiz)
/resa/v1/leads/export                GET        Admin      CSV-Export (inkl. GCLID für Offline-Conv.)
/resa/v1/analytics/funnel            GET        Admin      Funnel-Daten (aggregiert)
/resa/v1/analytics/partial           GET        Admin      Partial-Lead-Statistiken

/resa/v1/locations                   GET        Admin      Alle Locations
/resa/v1/locations                   POST       Admin      Location erstellen
/resa/v1/locations/{id}              PUT        Admin      Location aktualisieren
/resa/v1/locations/{id}              DELETE     Admin      Location löschen

/resa/v1/admin/modules               GET        Admin      Alle Module + Status + Flags
/resa/v1/admin/modules/{slug}        PUT        Admin      Modul aktivieren/deaktivieren
/resa/v1/admin/modules/{slug}/settings GET/PUT  Admin      Modul-Einstellungen

/resa/v1/settings                    GET/PUT    Admin      Plugin-Einstellungen
/resa/v1/settings/email              GET/PUT    Admin      E-Mail-Konfiguration
/resa/v1/settings/email/test         POST       Admin      Test-Mail senden

/resa/v1/emails/templates            GET        Admin      E-Mail-Vorlagen
/resa/v1/emails/templates/{id}       PUT        Admin      Vorlage bearbeiten
/resa/v1/emails/log                  GET        Admin      Versandlog

/resa/v1/pdf/templates               GET        Admin      PDF-Vorlagen
/resa/v1/pdf/templates/{id}          PUT        Admin      PDF-Vorlage bearbeiten
/resa/v1/pdf/preview                 POST       Admin      Vorschau-PDF generieren

/resa/v1/agents                      GET/POST   Admin      Makler verwalten
/resa/v1/agents/{id}                 PUT/DELETE Admin      Makler bearbeiten

/resa/v1/integrations                GET        Admin      Integrations-Status
/resa/v1/integrations/{type}/test    POST       Admin      Verbindung testen
/resa/v1/webhooks                    POST       Admin      Webhook konfigurieren
```

---

## 8. Datenbank-Schema

```sql
-- Leads
-- Zwei-Phasen-Speicherung: Partial (Formular erreicht) → Completed (abgesendet)
-- Siehe RESA-Tracking-und-Conversion.md für Details
CREATE TABLE {prefix}resa_leads (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id      VARCHAR(36)     NOT NULL,         -- UUID, verknüpft Phase 1 → 2
    asset_type      VARCHAR(50)     NOT NULL,
    location_id     BIGINT UNSIGNED NOT NULL,
    agent_id        BIGINT UNSIGNED DEFAULT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'partial',
    -- 'partial' → Formular erreicht, nicht abgesendet
    -- 'new'     → Formular abgesendet, unbearbeitet
    -- 'contacted' / 'qualified' / 'converted' / 'lost' / 'expired'
    first_name      VARCHAR(100)    DEFAULT NULL,     -- NULL bei Partial!
    last_name       VARCHAR(100)    DEFAULT NULL,
    email           VARCHAR(255)    DEFAULT NULL,     -- NULL bei Partial!
    phone           VARCHAR(50)     DEFAULT NULL,
    company         VARCHAR(200)    DEFAULT NULL,
    salutation      VARCHAR(10)     DEFAULT NULL,
    message         TEXT            DEFAULT NULL,
    consent_given   TINYINT(1)      NOT NULL DEFAULT 0,
    consent_text    TEXT            DEFAULT NULL,
    consent_date    DATETIME        DEFAULT NULL,
    inputs          JSON            NOT NULL,         -- Fragebogen-Antworten (Phase 1)
    result          JSON            DEFAULT NULL,     -- Berechnungsergebnis
    meta            JSON            DEFAULT NULL,     -- UTM, Referrer, IP-Hash, etc.
    notes           TEXT            DEFAULT NULL,
    gclid           VARCHAR(255)    DEFAULT NULL,     -- Google Click ID
    fbclid          VARCHAR(255)    DEFAULT NULL,     -- Facebook Click ID
    pdf_sent        TINYINT(1)      DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    completed_at    DATETIME        DEFAULT NULL,     -- Zeitpunkt Phase 2
    expires_at      DATETIME        DEFAULT NULL,     -- Auto-Löschung (Partial)
    INDEX idx_status (status),
    INDEX idx_session (session_id),
    INDEX idx_asset (asset_type),
    INDEX idx_location (location_id),
    INDEX idx_agent (agent_id),
    INDEX idx_created (created_at),
    INDEX idx_email (email),
    INDEX idx_gclid (gclid),
    INDEX idx_expires (expires_at)
);

-- Aggregierte Funnel-Metriken (täglich, pro Asset + Location)
CREATE TABLE {prefix}resa_tracking_daily (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date            DATE            NOT NULL,
    asset_type      VARCHAR(50)     NOT NULL,
    location_id     BIGINT UNSIGNED DEFAULT NULL,
    views           INT UNSIGNED    DEFAULT 0,
    starts          INT UNSIGNED    DEFAULT 0,
    form_views      INT UNSIGNED    DEFAULT 0,   -- = Partial Leads
    form_submits    INT UNSIGNED    DEFAULT 0,   -- = Completed Leads
    result_views    INT UNSIGNED    DEFAULT 0,
    start_rate      DECIMAL(5,2)    DEFAULT NULL,
    completion_rate DECIMAL(5,2)    DEFAULT NULL,
    conversion_rate DECIMAL(5,2)    DEFAULT NULL,
    UNIQUE KEY idx_date_asset_loc (date, asset_type, location_id),
    INDEX idx_date (date)
);

-- Locations
CREATE TABLE {prefix}resa_locations (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug            VARCHAR(100)    NOT NULL UNIQUE,
    name            VARCHAR(255)    NOT NULL,
    country         VARCHAR(2)      NOT NULL DEFAULT 'DE',  -- ISO 3166-1
    bundesland      VARCHAR(100)    DEFAULT NULL,
    region_type     ENUM('rural','town','city','metro') DEFAULT 'city',
    currency        VARCHAR(3)      NOT NULL DEFAULT 'EUR',
    data            JSON            NOT NULL,     -- Miet/Kauf-Daten, Steuersätze
    factors         JSON            DEFAULT NULL, -- Individuell-Modus Faktoren
    agent_id        BIGINT UNSIGNED DEFAULT NULL,
    is_active       TINYINT(1)      DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP
);

-- E-Mail-Log
CREATE TABLE {prefix}resa_email_log (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lead_id         BIGINT UNSIGNED NOT NULL,
    template_id     VARCHAR(100)    NOT NULL,
    recipient       VARCHAR(255)    NOT NULL,
    subject         VARCHAR(500)    NOT NULL,
    status          ENUM('sent','delivered','opened','clicked','bounced','failed'),
    error_message   TEXT            DEFAULT NULL,
    sent_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    opened_at       DATETIME        DEFAULT NULL,
    clicked_at      DATETIME        DEFAULT NULL,
    INDEX idx_lead (lead_id),
    INDEX idx_status (status)
);

-- Makler
CREATE TABLE {prefix}resa_agents (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    wp_user_id      BIGINT UNSIGNED DEFAULT NULL,
    name            VARCHAR(255)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    phone           VARCHAR(50)     DEFAULT NULL,
    photo_url       VARCHAR(500)    DEFAULT NULL,
    is_active       TINYINT(1)      DEFAULT 1,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Makler ↔ Location Zuordnung
CREATE TABLE {prefix}resa_agent_locations (
    agent_id        BIGINT UNSIGNED NOT NULL,
    location_id     BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (agent_id, location_id)
);
```

---

## 9. Frontend-Komponenten-Architektur

### Multi-Step Wizard (Kern aller Lead Tool Module)

> **Hinweis:** Die modulspezifischen Steps (PropertyTypeStep, AreaStep, etc.) liegen im jeweiligen Modul-Verzeichnis (`modules/{slug}/src/steps/`). Der StepWizard, das LeadForm und die ResultCard sind Kern-Bausteine in `src/frontend/components/shared/`. Modul-Steps werden via dynamische Imports lazy-loaded. Siehe `RESA-Modulare-Architektur.md` für Details.

```
┌──────────────────────────────────────────────────────────┐
│  <StepWizard>                                            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <ProgressBar steps={5} current={2} />             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <AnimatePresence>                                 │  │
│  │    <motion.div>                                    │  │
│  │                                                    │  │
│  │      Step 1: <PropertyTypeStep />                  │  │
│  │      Step 2: <AreaStep />           ← Aktuell     │  │
│  │      Step 3: <ConditionStep />                     │  │
│  │      Step 4: <LocationStep />                      │  │
│  │      Step 5: <ExtrasStep />                        │  │
│  │                                                    │  │
│  │    </motion.div>                                   │  │
│  │  </AnimatePresence>                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [← Zurück]              [Weiter →]                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Nach letztem Step:                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <LeadForm />  ← Universell für alle Assets        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Nach Lead-Erfassung:                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │  <ResultCard />  ← Asset-spezifisch                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Framer Motion: Schritt-Übergänge

```typescript
// StepWizard.tsx — Animierte Schritt-Übergänge
const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    variants={variants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
    {steps[currentStep]}
  </motion.div>
</AnimatePresence>
```

---

## 10. Build & Development Scripts

```json
// package.json
{
  "name": "immobilien-smart-assets",
  "scripts": {
    "dev": "vite",
    "dev:admin": "vite --mode admin",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",

    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "format": "prettier --write src/",

    "test": "vitest",
    "test:coverage": "vitest --coverage",

    "i18n:pot": "wp i18n make-pot . languages/resa.pot --domain=resa --exclude=node_modules,vendor,dist,tests",
    "i18n:update": "wp i18n update-po languages/resa.pot languages/",
    "i18n:mo": "wp i18n make-mo languages/",
    "i18n:json": "wp i18n make-json languages/ --no-purge",
    "i18n:build": "npm run i18n:pot && npm run i18n:update && npm run i18n:mo && npm run i18n:json",

    "plugin:build": "npm run build && npm run i18n:build && composer install --no-dev --optimize-autoloader",
    "plugin:zip": "npm run plugin:build && node scripts/create-zip.js"
  }
}
```

---

## 11. Performance-Budgets

```
Asset                     Budget (gzip)     Begründung
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend JS (Widget)       < 120 KB         Lädt auf Kundenwebsite
Frontend CSS (Widget)      < 25 KB          Prefixed Tailwind
Admin JS (Dashboard)       < 250 KB         Nur im WP-Admin
Admin CSS (Dashboard)      < 40 KB          Nur im WP-Admin
Einzelner Asset-Chunk      < 30 KB          Code-Splitting pro Asset

Erste Interaktion (FID)    < 100ms          Formular muss sofort reagieren
Gesamte Widget-Ladezeit    < 1.5s           Inkl. API-Aufruf für Config
```

### Optimierungen

- **Code-Splitting:** Jeder Asset-Typ ist ein Lazy-loaded Chunk — nur der aktive Rechner wird geladen
- **Tree-Shaking:** Vite + Rollup entfernt ungenutzten Code
- **Tailwind Purge:** Nur genutzte Utility-Klassen im Bundle
- **React External (Admin):** WordPress liefert React, wir sparen ~40 KB
- **Kein SSR nötig:** Widgets mounten client-seitig (Shortcode liefert leeren Container)

---

## 12. Zusammenfassung: Der Stack auf einen Blick

```
┌───────────────────────────────────────────────────────────────┐
│  RESA — Technischer Gesamtstack                                │
│                                                               │
│  Backend:    PHP 8.1+ / WordPress / Composer (PSR-4)          │
│  Frontend:   React 18 / TypeScript 5 / Vite 6                 │
│  UI:         Tailwind CSS (resa- Prefix) + shadcn/ui           │
│  Charts:     Nivo (D3-basiert, 30+ Typen, SSR-fähig)       │
│  Animation:  Framer Motion (Steps + Chart-Eintritt)        │
│  Formulare:  React Hook Form + Zod                            │
│  State:      Zustand (lokal) + React Query (Server)           │
│  API:        WordPress REST API (/wp-json/resa/v1/)            │
│  PDF:        DOMPDF (Fallback) + Puppeteer (empfohlen)      │
│  E-Mail:     PHPMailer (SMTP) + Brevo API                     │
│  i18n:       WordPress gettext + wp.i18n (JS) + JSON          │
│  Lizenz:     Freemius SDK                                     │
│  Testing:    PHPUnit (PHP) + Vitest (JS)                      │
│  CI/CD:      GitHub Actions                                   │
│  Distro:     Freemius (Premium) + WordPress.org (Free)        │
│                                                               │
│  2 Entry Points:                                              │
│  ① Frontend-Widget: Eigenes React-Bundle, CSS-isoliert        │
│  ② Admin-Dashboard:  wp-element React, WP-Admin-integriert   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```
