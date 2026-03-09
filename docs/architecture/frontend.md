# Frontend-Architektur

## Zwei Bundles

RESA hat zwei separate React-Anwendungen mit getrennten Vite Entry Points:

### Widget (`src/frontend/main.tsx`)

Besucher-facing Rechner, eingebettet via Shortcode.

- **React:** Eigene Instanz (nicht `wp-element`), für Theme-Isolation
- **Mount:** Sucht `<div class="resa-widget-root" data-module="...">` Container
- **Module-Map:** `'rent-calculator'` → `RentCalculatorWidget`
- **Lokalisierung:** `window.resaFrontend` (restUrl, nonce, module, trackingConfig, privacyConfig, etc.)

### Admin (`src/admin/main.tsx`)

WP-Admin Dashboard.

- **React:** WordPress-bundled `wp-element`
- **Mount:** `#resa-admin-root`
- **Seiten:** Dashboard, Leads, Locations, ModuleStore, ModuleSettings, Analytics, Integrations, Settings, PdfTemplates

## CSS-Isolation

### Widget (kritisch)

Das Widget darf das Host-Theme nicht brechen:

- **Tailwind Prefix:** Alle Klassen mit `resa-` Prefix (`resa-bg-white`, `resa-text-sm`)
- **Container-Scope:** `.resa-widget-root` als Importance-Scope
- **Kein Preflight:** Tailwind Preflight ist deaktiviert
- **Mini-Reset:** Nur innerhalb `.resa-widget-root` (Box-Sizing, Font)
- **CSS-Variablen:** Branding via Custom Properties:
    - `--resa-primary` — Primärfarbe (vom Admin konfigurierbar)
    - `--resa-ring` — Focus-Ring Farbe
    - `--resa-icon-primary`, `--resa-icon-secondary`, `--resa-icon-light`, `--resa-icon-bg`
- **Hex → HSL:** Konvertierung für Tailwind-Kompatibilität

### Admin

- Nutzt WordPress-Admin-Styles als Basis
- shadcn/ui Komponenten mit angepassten Styles

## Shared Components

### StepWizard (`src/frontend/components/shared/`)

Kern-Komponente für alle Rechner-Module:

- Props: `steps`, `onComplete`, `initialData`, `backLabel`, `nextLabel`, `completeLabel`
- **Validierung:** Zod `schema.parseAsync()` pro Schritt vor Navigation
- **Animation:** Framer Motion `AnimatePresence` (slide x: ±200, opacity 0→1)
- **ProgressBar:** Visueller Fortschritt + Zurück/Weiter-Buttons

### LeadForm (`src/frontend/components/shared/`)

Kontaktformular nach den Rechner-Steps:

- React Hook Form + Zod via `buildLeadSchema(config.fields)`
- **Dynamische Felder:** Aus `LeadFormConfig` (required/optional/hidden)
- **Feldtypen:** text, email, tel, textarea, select, checkbox
- **Spam-Schutz:** Honeypot-Feld (off-screen positioniert)
- **DSGVO:** Consent-Checkbox, `[Datenschutzerklärung]` wird zu Link
- **Trust Badge:** Konfigurierbarer Vertrauenshinweis

### ResaIcon (`src/components/icons/`)

Zentrale Icon-Registry:

- Props: `name`, `size` (default 24), `className`, `label`
- SVG-Registry: `getIcon(name)` — DEV-Warnung wenn Name nicht gefunden
- Render: `<span dangerouslySetInnerHTML>` mit SVG-String
- **Kategorien:** ausstattung (15), haustypen (6), immobilientyp (4), modernisierung, nutzung, qualitaetsstufen, zeitrahmen, zustand

## Build-Konfiguration

### Vite (`vite.config.ts`)

```
Entry Points:
  frontend: src/frontend/main.tsx
  admin:    src/admin/main.tsx

Output: dist/ mit manifest.json
  [name]/[name]-[hash].js
  Shared Chunks für gemeinsame Dependencies

Aliases:
  @ → src/
  @frontend → src/frontend/
  @admin → src/admin/
  @modules → modules/

WordPress Externals Plugin:
  @wordpress/i18n → window.wp.i18n

Hot File Plugin:
  Schreibt dist/hot im Dev-Modus

Dev Server:
  Host: 0.0.0.0:5173
  Origin: http://host.docker.internal:5173

Runtime Base:
  window.__RESA_DIST_URL__ (gesetzt vom PHP-Backend)
```

### Integration mit WordPress

`@kucrut/vite-for-wp` liest das Manifest und erzeugt korrekte `<script>`/`<link>` Tags. Im Dev-Modus wird der Vite Dev Server über `dist/hot` erkannt und HMR aktiviert.

## State Management

- **Zustand:** Lokaler UI-State (Wizard-Schritt, Formular-Zustand)
- **React Query (TanStack Query 5):** Server-State (API-Calls, Caching, Refetch)
- **React Hook Form 7:** Formular-State + Validierung via Zod

## Libraries

| Bibliothek        | Zweck                        |
| ----------------- | ---------------------------- |
| React 18          | UI                           |
| TypeScript 5      | Typsicherheit                |
| Tailwind CSS 3    | Styling (mit `resa-` Prefix) |
| shadcn/ui (Radix) | UI-Komponenten               |
| Framer Motion 11  | Animationen                  |
| Nivo (D3)         | Charts                       |
| Zod 3             | Validierung                  |
| React Hook Form 7 | Formulare                    |
| Zustand 4         | Local State                  |
| React Query 5     | Server State                 |
