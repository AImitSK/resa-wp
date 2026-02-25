# ISM — Datenvisualisierung & PDF-Generierung

## Charts, Diagramme & druckfähige PDF-Dokumente

---

## 1. Das Problem

ISM-Ergebnisse sind **keine simplen Zahlen** — sie werden als visuelle Analysen dargestellt. Ein Mietpreisergebnis zeigt nicht nur "714 € — 833 €", sondern auch:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Mietpreis-Spanne                                       │
│  ├─────────────────────────[█████]────────┤              │
│  6,00 €               9,52 — 11,11 €     14,00 €/m²    │
│                        Ihr Ergebnis                     │
│                                                         │
│  Vergleich mit Region        ┌──────────────────┐       │
│  ████████████ 9,80 €/m²     │  Kreisdiagramm   │       │
│  ██████████ 8,20 €/m²       │  Einflussfaktoren│       │
│  ████████ 7,40 €/m²         │  Lage: 35%       │       │
│  Ihr Objekt | Stadt | Kreis  │  Zustand: 25%    │       │
│                               │  Größe: 20%      │       │
│  Preisentwicklung 5 Jahre    │  Extras: 20%     │       │
│  ──────────/                 └──────────────────┘       │
│           /                                             │
│      ───/                                               │
│  ──/                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Diese Visualisierungen müssen in **zwei Kontexten** funktionieren:

```
KONTEXT 1: Web (Frontend)          KONTEXT 2: PDF (E-Mail)
━━━━━━━━━━━━━━━━━━━━━━━━           ━━━━━━━━━━━━━━━━━━━━━━━
✅ JavaScript (React)               ❌ Kein JavaScript
✅ Animationen                      ❌ Keine Animationen
✅ Hover, Tooltips                  ❌ Keine Interaktion
✅ Responsive                       ✅ Feste A4-Breite
✅ SVG oder Canvas                  ✅ SVG oder Bild (PNG)
✅ Jede Library nutzbar             ⚠ DOMPDF: SVG eingeschränkt
```

**Das Kernproblem:** DOMPDF kann weder JavaScript ausführen noch komplexe SVGs zuverlässig rendern. Charts die im Browser fantastisch aussehen, erscheinen im PDF gar nicht oder kaputt.

---

## 2. Lösung: Dual-Rendering-Architektur

Wir trennen sauber zwischen **interaktiven Web-Charts** und **statischen PDF-Charts**:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    CHART-DATEN (JSON)                         │
│                         │                                    │
│            ┌────────────┼────────────┐                       │
│            ▼                         ▼                       │
│   ┌─────────────────┐      ┌──────────────────┐             │
│   │  WEB-RENDERER   │      │  PDF-RENDERER    │             │
│   │                 │      │                  │             │
│   │  Nivo + Framer  │      │  React Static   │             │
│   │  Motion         │      │  Markup → SVG    │             │
│   │                 │      │                  │             │
│   │  Interaktiv     │      │  renderToStatic  │             │
│   │  Animiert       │      │  Markup()        │             │
│   │  Responsive     │      │                  │             │
│   └────────┬────────┘      └────────┬─────────┘             │
│            ▼                         ▼                       │
│     Browser (React)           HTML mit Inline-SVG            │
│                                      │                       │
│                                      ▼                       │
│                              ┌──────────────┐                │
│                              │   DOMPDF     │                │
│                              │   oder       │                │
│                              │   Puppeteer  │                │
│                              └──────┬───────┘                │
│                                     ▼                        │
│                                PDF-Datei                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Gleiche Daten, zwei Renderer.** Die Chart-Daten (Werte, Labels, Farben) werden einmal berechnet und dann entweder interaktiv (Web) oder statisch (PDF) dargestellt.

---

## 3. Web-Charts: Nivo (statt Recharts)

### Warum Nivo statt Recharts?

```
Kriterium                 Nivo                    Recharts
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visueller Eindruck        ✅ Gorgeous out-of-box  ⚠ Funktional, nüchtern
Chart-Typen               ✅ 30+ Typen           ⚠ ~15 Typen
Theming-System            ✅ Vollständig          ⚠ Manuell pro Chart
Animations                ✅ React Spring         ⚠ Einfach
Responsiv                 ✅ Eingebaut            ✅ Eingebaut
SVG + Canvas + HTML       ✅ Alle drei            ✅ Nur SVG
Server-Side Rendering     ✅ @nivo/static         ❌ Nicht vorgesehen
Gauge/Radial Charts       ✅ Eingebaut            ❌ Nicht vorhanden
Waffle/Treemap/Sunburst   ✅ Alles dabei          ❌ Nicht vorhanden
Accessibility             ✅ ARIA-Rollen          ⚠ Manuell
Bundle-Size               ⚠ Modulare Pakete      ✅ Leichter
D3-Basis                  ✅                      ✅
TypeScript                ✅                      ✅
```

**Entscheidung: Nivo** — weil die Charts beim Makler-Kunden einen professionellen, modernen Eindruck machen müssen. ISM-Ergebnisse sollen "Wow" erzeugen, nicht "Excel-Tabelle mit Farbe".

### Nivo-Pakete die wir brauchen

```json
{
  "dependencies": {
    "@nivo/core": "^0.87.0",
    "@nivo/bar": "^0.87.0",        // Vergleichsbalken (Ihr Objekt vs. Stadt)
    "@nivo/line": "^0.87.0",       // Preisentwicklung über Zeit
    "@nivo/pie": "^0.87.0",        // Einflussfaktoren-Verteilung
    "@nivo/radar": "^0.87.0",      // Objekt-Profil (Lage, Zustand, Ausstattung)
    "@nivo/bullet": "^0.87.0",     // Preisspanne mit Marker
    "@nivo/gauge": "^0.87.0",      // Energieeffizienz-Score
    "@nivo/funnel": "^0.87.0",     // Lead-Qualifizierung
    "@nivo/waffle": "^0.87.0",     // Nebenkosten-Aufteilung
    "framer-motion": "^11.0.0"     // Eintritts-Animationen für Chart-Container
  }
}
```

### Chart-Typen pro ISM-Asset

```
ISM Smart Asset               Chart-Typ(en)               Nivo-Paket
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Mietpreis-Kalkulator           Bullet (Spanne + Marker)    @nivo/bullet
                               Bar (Vergleich Stadt/Kreis) @nivo/bar
                               Pie (Einflussfaktoren)      @nivo/pie
                               Line (Preisentwicklung)     @nivo/line

Immobilienwert-Kalkulator      Bullet (Wertspanne)         @nivo/bullet
                               Radar (Objekt-Profil)       @nivo/radar
                               Bar (Vergleichswerte)       @nivo/bar
                               Line (Wertentwicklung)      @nivo/line

Kaufnebenkosten-Rechner        Waffle (Kostenaufteilung)   @nivo/waffle
                               Bar (Stacked: Grundbuch,    @nivo/bar
                                    Notar, Steuer, Makler)

Energieeffizienz-Check         Gauge (Effizienz-Score)     @nivo/gauge
                               Bar (Kosten A vs. H)        @nivo/bar

Budgetrechner                  Pie (Budget-Verteilung)     @nivo/pie
                               Bar (Leistbarkeits-Check)   @nivo/bar

Renditerechner                 Line (Rendite über Zeit)    @nivo/line
                               Bar (Cashflow pro Jahr)     @nivo/bar

Mieten-vs-Kaufen               Line (Kumulierte Kosten)    @nivo/line
                               Bar (Break-Even)            @nivo/bar
```

### Nivo-Theme: ISM Design-System

```typescript
// src/frontend/lib/chart-theme.ts
import type { Theme } from '@nivo/core';

export const ismChartTheme: Theme = {
  // Basis
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,

  // Achsen
  axis: {
    domain: {
      line: { stroke: '#e2e8f0', strokeWidth: 1 },
    },
    ticks: {
      text: { fill: '#64748b', fontSize: 12 },
      line: { stroke: '#e2e8f0' },
    },
    legend: {
      text: { fill: '#334155', fontSize: 13, fontWeight: 600 },
    },
  },

  // Grid
  grid: {
    line: { stroke: '#f1f5f9', strokeWidth: 1 },
  },

  // Labels
  labels: {
    text: { fill: '#1e293b', fontSize: 13, fontWeight: 500 },
  },

  // Tooltip
  tooltip: {
    container: {
      background: '#ffffff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: '10px 14px',
      fontSize: 13,
    },
  },
};

// Farbpaletten
export const ismColors = {
  primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],     // Blau (Kern)
  comparison: ['#3b82f6', '#94a3b8', '#cbd5e1'],              // Blau, Grau, Hell
  gradient: ['#3b82f6', '#8b5cf6', '#ec4899'],                // Blau → Lila → Rosa
  factors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],      // Blau, Grün, Amber, Rot
  costs: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],        // Blau → Lila Abstufungen
  energy: ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444'], // Grün → Rot
};
```

### Beispiel: Mietpreis-Bullet-Chart

```tsx
// src/frontend/assets/rent-calculator/result/RentBulletChart.tsx
import { ResponsiveBullet } from '@nivo/bullet';
import { motion } from 'framer-motion';
import { ismChartTheme, ismColors } from '@/frontend/lib/chart-theme';

interface RentBulletChartProps {
  rentMin: number;
  rentMax: number;
  rentMedian: number;
  marketMin: number;
  marketMax: number;
  currency: string;
}

export function RentBulletChart({
  rentMin, rentMax, rentMedian,
  marketMin, marketMax, currency,
}: RentBulletChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="ism-h-24"
    >
      <ResponsiveBullet
        data={[
          {
            id: 'rent',
            title: `${currency}/m²`,
            ranges: [marketMin, rentMin, rentMax, marketMax],
            measures: [rentMedian],
            markers: [rentMedian],
          },
        ]}
        theme={ismChartTheme}
        rangeColors={['#f1f5f9', '#dbeafe', '#bfdbfe', '#f1f5f9']}
        measureColors={[ismColors.primary[0]]}
        markerColors={['#1e293b']}
        margin={{ top: 10, right: 30, bottom: 30, left: 80 }}
        spacing={46}
        titleAlign="start"
        titleOffsetX={-70}
        animate={true}
        motionConfig="gentle"
      />
    </motion.div>
  );
}
```

### Eintritts-Animationen mit Framer Motion

```tsx
// src/frontend/assets/shared/AnimatedChartSection.tsx
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function AnimatedChartSection({ children }: { children: React.ReactNode[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? 'show' : 'hidden'}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={item}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

Ergebnis: Charts erscheinen nacheinander mit sanfter Aufwärts-Animation wenn der Besucher zum Ergebnis scrollt.

---

## 4. PDF-Charts: Server-Side SVG-Rendering

### Das DOMPDF-Problem

```
DOMPDF kann:                       DOMPDF kann NICHT:
✅ HTML + CSS                       ❌ JavaScript ausführen
✅ Bilder (PNG, JPEG)               ❌ Canvas-Elemente
✅ Einfaches Inline-SVG             ❌ Komplexes SVG (Gradienten, Filter)
✅ Tabellen, Listen                 ❌ CSS Grid, komplexes Flexbox
✅ @font-face (TTF)                 ❌ SVG <text> mit font-face
```

### Lösung: Zwei PDF-Engines

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  OPTION A: DOMPDF + vorgerenderte Chart-Bilder               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                │
│                                                              │
│  Für: Hosting wo Node.js NICHT verfügbar ist (Shared Hosting)│
│  Wie:  Charts werden als PNG-Bilder gerendert               │
│        und als <img> in den HTML-Template eingebettet        │
│                                                              │
│  Chart-Daten → Simple SVG (PHP) → resvg-php → PNG            │
│                  ODER                                        │
│  Chart-Daten → QuickChart.io API → PNG-URL → <img>           │
│                                                              │
│  Pro:  Läuft überall, keine Abhängigkeiten                   │
│  Contra: Einfachere Charts, keine Nivo-Qualität              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  OPTION B: Puppeteer / Chromium (empfohlen)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                  │
│                                                              │
│  Für: VPS / Dedicated Server / Cloud Hosting                 │
│  Wie:  Vollständiges HTML+CSS+SVG-Template wird              │
│        von Headless Chrome zu PDF konvertiert                │
│                                                              │
│  Chart-Daten → Nivo (renderToStaticMarkup) → SVG-Strings     │
│  SVG-Strings → HTML-Template mit Inline-SVG                  │
│  HTML-Template → Puppeteer → PDF                             │
│                                                              │
│  Pro:  Pixelgenaue PDFs, gleiche Charts wie im Web           │
│  Contra: Braucht Node.js + Chromium auf Server               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Empfehlung: Hybrid mit automatischer Erkennung

```php
// includes/Services/Pdf/PdfGenerator.php

class PdfGenerator {

    public function generate( array $data ): string {
        $engine = $this->detect_best_engine();

        if ( $engine === 'puppeteer' ) {
            return $this->generate_with_puppeteer( $data );
        }

        return $this->generate_with_dompdf( $data );
    }

    private function detect_best_engine(): string {
        // Prüfe ob Node.js + Puppeteer verfügbar
        if ( $this->is_puppeteer_available() ) {
            return 'puppeteer';
        }
        return 'dompdf';
    }
}
```

Der Makler bekommt immer ein PDF — auf einem starken Server mit Puppeteer-Qualität, auf Shared Hosting mit DOMPDF-Fallback.

---

## 5. Option A: DOMPDF + Chart-Bilder (Fallback)

### PHP-seitige einfache Charts

Für den DOMPDF-Fallback bauen wir **einfache SVG-Charts in PHP**, die DOMPDF zuverlässig rendern kann:

```php
// includes/Services/Pdf/Charts/SimpleBarChart.php

class SimpleBarChart {

    public function render( array $data ): string {
        $width = 500;
        $height = 200;
        $barWidth = 60;
        $gap = 30;
        $maxValue = max( array_column( $data, 'value' ) );

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" '
             . 'width="' . $width . '" height="' . $height . '" '
             . 'viewBox="0 0 ' . $width . ' ' . $height . '">';

        $x = 40;
        foreach ( $data as $item ) {
            $barHeight = ( $item['value'] / $maxValue ) * ( $height - 60 );
            $y = $height - 40 - $barHeight;

            // Balken
            $svg .= '<rect x="' . $x . '" y="' . $y . '" '
                   . 'width="' . $barWidth . '" height="' . $barHeight . '" '
                   . 'fill="' . ( $item['color'] ?? 'rgb(59,130,246)' ) . '" '
                   . 'rx="4" />';

            // Wert über dem Balken
            $svg .= '<text x="' . ( $x + $barWidth / 2 ) . '" y="' . ( $y - 8 ) . '" '
                   . 'text-anchor="middle" font-size="12" fill="rgb(30,41,59)">'
                   . $item['label_value'] . '</text>';

            // Label unter dem Balken
            $svg .= '<text x="' . ( $x + $barWidth / 2 ) . '" y="' . ( $height - 15 ) . '" '
                   . 'text-anchor="middle" font-size="11" fill="rgb(100,116,139)">'
                   . $item['label'] . '</text>';

            $x += $barWidth + $gap;
        }

        $svg .= '</svg>';
        return $svg;
    }
}
```

```php
// Verwendung im PDF-Template:
$chart = new SimpleBarChart();
$svg = $chart->render([
    ['label' => 'Ihr Objekt', 'value' => 9.52, 'label_value' => '9,52 €/m²',
     'color' => 'rgb(59,130,246)'],
    ['label' => 'Stadt',      'value' => 8.20, 'label_value' => '8,20 €/m²',
     'color' => 'rgb(148,163,184)'],
    ['label' => 'Kreis',      'value' => 7.40, 'label_value' => '7,40 €/m²',
     'color' => 'rgb(203,213,225)'],
]);

// → $svg wird direkt als Inline-SVG in das DOMPDF-HTML eingefügt
```

### Alternative: QuickChart.io als externer Service

```php
// Für komplexere Charts: QuickChart.io generiert Chart-PNGs per URL
$chart_url = 'https://quickchart.io/chart?' . http_build_query([
    'c' => json_encode([
        'type' => 'bar',
        'data' => [
            'labels' => ['Ihr Objekt', 'Stadtdurchschnitt', 'Kreisdurchschnitt'],
            'datasets' => [[
                'data' => [9.52, 8.20, 7.40],
                'backgroundColor' => ['#3b82f6', '#94a3b8', '#cbd5e1'],
            ]],
        ],
    ]),
    'w' => 500,
    'h' => 300,
    'f' => 'png',
]);

// In DOMPDF-Template: <img src="$chart_url" width="500" height="300">
```

---

## 6. Option B: Puppeteer / Node.js (Empfohlen)

### Architektur

```
PHP (Lead kommt rein)
  │
  ├─ Berechne Ergebnis
  ├─ Sammle Chart-Daten (JSON)
  ├─ Rufe Node.js-Script auf
  │     │
  │     ├─ Nivo-Charts als SVG rendern (renderToStaticMarkup)
  │     ├─ HTML-Template zusammenbauen
  │     ├─ Puppeteer: HTML → PDF
  │     └─ PDF-Binary zurückgeben (stdout)
  │
  └─ PDF per E-Mail senden
```

### Node.js PDF-Generator Script

```typescript
// scripts/generate-pdf.ts
import puppeteer from 'puppeteer';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { RentAnalysisPdfTemplate } from './templates/RentAnalysisPdf';

interface PdfRequest {
  template: string;
  data: Record<string, any>;
  locale: string;
  branding: {
    logo_url: string;
    primary_color: string;
    agent_name: string;
    agent_phone: string;
    agent_email: string;
    agent_photo_url: string;
  };
}

async function generatePdf(request: PdfRequest): Promise<Buffer> {
  // 1. React-Template zu HTML rendern (mit Charts als SVG)
  const html = ReactDOMServer.renderToStaticMarkup(
    React.createElement(RentAnalysisPdfTemplate, {
      data: request.data,
      locale: request.locale,
      branding: request.branding,
    })
  );

  // 2. Vollständiges HTML-Dokument bauen
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="${request.locale}">
    <head>
      <meta charset="UTF-8">
      <style>
        ${getPdfStyles(request.branding)}
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  // 3. Puppeteer: HTML → PDF
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' },
    displayHeaderFooter: true,
    footerTemplate: `
      <div style="font-size:9px; width:100%; text-align:center; color:#94a3b8;">
        ${request.branding.agent_name} — Erstellt mit ISM
        <span style="float:right; margin-right:15mm;">
          Seite <span class="pageNumber"></span> / <span class="totalPages"></span>
        </span>
      </div>
    `,
  });

  await browser.close();
  return Buffer.from(pdf);
}

// Wird von PHP aufgerufen: node scripts/generate-pdf.js '{"template":"rent",...}'
const input = JSON.parse(process.argv[2]);
generatePdf(input).then(pdf => {
  process.stdout.write(pdf);
});
```

### Nivo-Charts als statisches SVG (Server-Side)

```tsx
// scripts/templates/charts/RentComparisonBarSvg.tsx
import React from 'react';
import { Bar } from '@nivo/bar';
import { ismChartTheme, ismColors } from '../../src/frontend/lib/chart-theme';

// Server-Side: Nivo im "static" Modus (kein DOM nötig)
export function RentComparisonBarSvg({
  yourRent, cityAvg, districtAvg, currency,
}: {
  yourRent: number; cityAvg: number; districtAvg: number; currency: string;
}) {
  return (
    <Bar
      width={480}
      height={280}
      data={[
        { label: 'Ihr Objekt', value: yourRent },
        { label: 'Stadt ∅', value: cityAvg },
        { label: 'Kreis ∅', value: districtAvg },
      ]}
      keys={['value']}
      indexBy="label"
      theme={ismChartTheme}
      colors={ismColors.comparison}
      margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
      padding={0.3}
      borderRadius={6}
      labelFormat={(v) => `${v.toFixed(2)} ${currency}/m²`}
      animate={false}    // ← Keine Animation in PDF!
      isInteractive={false}  // ← Keine Tooltips in PDF!
    />
  );
}
```

### PHP-Aufruf

```php
// includes/Services/Pdf/PuppeteerPdfEngine.php

class PuppeteerPdfEngine {

    public function generate( array $data ): string {
        $json_input = wp_json_encode( $data );
        $script = ISM_PLUGIN_DIR . 'scripts/generate-pdf.js';

        // Node.js aufrufen und PDF-Binary von stdout lesen
        $command = sprintf(
            'node %s %s',
            escapeshellarg( $script ),
            escapeshellarg( $json_input )
        );

        $pdf_binary = shell_exec( $command );

        if ( empty( $pdf_binary ) || substr( $pdf_binary, 0, 5 ) !== '%PDF-' ) {
            throw new \RuntimeException( 'PDF generation failed' );
        }

        return $pdf_binary;
    }

    public function is_available(): bool {
        $node_version = shell_exec( 'node --version 2>/dev/null' );
        return ! empty( $node_version ) && version_compare(
            trim( str_replace( 'v', '', $node_version ) ),
            '18.0.0', '>='
        );
    }
}
```

---

## 7. PDF-Template Beispiel: Mietpreis-Analyse

```tsx
// scripts/templates/RentAnalysisPdf.tsx
import React from 'react';
import { RentComparisonBarSvg } from './charts/RentComparisonBarSvg';
import { RentBulletSvg } from './charts/RentBulletSvg';
import { FactorsPieSvg } from './charts/FactorsPieSvg';
import { PriceTrendLineSvg } from './charts/PriceTrendLineSvg';

export function RentAnalysisPdfTemplate({ data, locale, branding }) {
  return (
    <div className="pdf-document">

      {/* SEITE 1: Deckblatt */}
      <div className="page cover">
        <img src={branding.logo_url} className="logo" />
        <h1>Mietpreisanalyse</h1>
        <h2>{data.city}</h2>
        <p className="subtitle">
          Erstellt für {data.lead_name} am {data.date}
        </p>
      </div>

      {/* SEITE 2: Kernergebnis */}
      <div className="page">
        <h2>Ihr Ergebnis</h2>

        <div className="result-box">
          <span className="result-label">Geschätzte Monatsmiete</span>
          <span className="result-value">
            {data.rentMin} — {data.rentMax} {data.currency}
          </span>
          <span className="result-sqm">
            ({data.rentMinSqm} — {data.rentMaxSqm} {data.currency}/m²)
          </span>
        </div>

        {/* Bullet-Chart: Preisspanne */}
        <RentBulletSvg
          rentMin={data.rentMinSqm}
          rentMax={data.rentMaxSqm}
          rentMedian={data.rentMedianSqm}
          marketMin={data.marketMinSqm}
          marketMax={data.marketMaxSqm}
          currency={data.currency}
        />

        {/* Balken-Chart: Vergleich */}
        <h3>Vergleich mit Region</h3>
        <RentComparisonBarSvg
          yourRent={data.rentMedianSqm}
          cityAvg={data.cityAvgSqm}
          districtAvg={data.districtAvgSqm}
          currency={data.currency}
        />
      </div>

      {/* SEITE 3: Einflussfaktoren */}
      <div className="page">
        <h2>Einflussfaktoren</h2>

        <div className="two-column">
          <div className="column">
            <FactorsPieSvg factors={data.factors} />
          </div>
          <div className="column">
            <table className="factors-table">
              {data.factors.map(f => (
                <tr key={f.name}>
                  <td>{f.name}</td>
                  <td>{f.impact}</td>
                  <td>{f.direction === 'up' ? '↑' : '↓'} {f.percent}%</td>
                </tr>
              ))}
            </table>
          </div>
        </div>

        <h3>Preisentwicklung (5 Jahre)</h3>
        <PriceTrendLineSvg data={data.priceTrend} currency={data.currency} />
      </div>

      {/* SEITE 4: Empfehlung + Makler-Kontakt */}
      <div className="page">
        <h2>Unsere Empfehlung</h2>
        <p>{data.recommendation}</p>

        <div className="agent-card">
          <img src={branding.agent_photo_url} className="agent-photo" />
          <div>
            <strong>{branding.agent_name}</strong><br/>
            {branding.agent_phone}<br/>
            {branding.agent_email}
          </div>
        </div>

        <p className="cta">
          Gerne berate ich Sie persönlich zu Ihren Möglichkeiten.
          Rufen Sie mich an oder schreiben Sie mir eine E-Mail.
        </p>
      </div>

    </div>
  );
}
```

---

## 8. Vergleich: DOMPDF vs. Puppeteer

```
Kriterium                  DOMPDF (Fallback)          Puppeteer (Empfohlen)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hosting-Anforderung        PHP only (Shared OK)       Node.js 18+ (VPS/Cloud)
Chart-Qualität             ⚠ Einfache PHP-SVGs       ✅ Nivo-Qualität
CSS-Support                ⚠ Eingeschränkt           ✅ Volles CSS
Schriftarten               ✅ TTF                     ✅ Alle Web-Fonts
Bilder                     ✅ PNG, JPEG               ✅ Alles
SVG-Rendering              ⚠ Nur einfaches SVG       ✅ Vollständig
Generierungszeit           ~0.5-1s                    ~2-4s
Speicherverbrauch          ~30 MB                     ~150 MB (Chromium)
Kosten                     Keine                      Chromium muss installiert sein
Debugging                  Schwer                     Browser DevTools
PDF-Qualität               ★★★☆☆                     ★★★★★
```

### Hosting-Empfehlung

```
ISM Free:        DOMPDF (reicht für Standard-Template mit ISM-Branding)
ISM Premium:     Puppeteer empfohlen, DOMPDF als Fallback

Einstellungen → PDF-Engine:
  ○ Automatisch (erkennt ob Puppeteer verfügbar)
  ○ Puppeteer (Node.js erforderlich)
  ○ DOMPDF (PHP only, einfachere Charts)
```

---

## 9. Aktualisierung Tech-Stack

### Was sich ändert gegenüber dem bisherigen Stack-Dokument:

```
GEÄNDERT:
━━━━━━━━━
Recharts → Nivo                  Frontend-Charts (schöner, mehr Typen, SSR)
DOMPDF (nur) → DOMPDF + Puppeteer  Zwei PDF-Engines mit Auto-Erkennung

NEU HINZUGEFÜGT:
━━━━━━━━━━━━━━━
@nivo/*                          Chart-Pakete (bar, line, pie, radar, etc.)
framer-motion (erweitert)        Nicht nur Step-Übergänge, auch Chart-Animationen
puppeteer                        PDF-Engine (Node.js)
ReactDOMServer                   Server-Side Rendering für PDF-Charts
scripts/generate-pdf.ts          Node.js PDF-Generator Script

NEUE PAKETE (package.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━
"@nivo/core": "^0.87.0"
"@nivo/bar": "^0.87.0"
"@nivo/line": "^0.87.0"
"@nivo/pie": "^0.87.0"
"@nivo/radar": "^0.87.0"
"@nivo/bullet": "^0.87.0"
"@nivo/gauge": "^0.87.0"
"@nivo/funnel": "^0.87.0"
"@nivo/waffle": "^0.87.0"
"puppeteer": "^23.0.0"       (devDeps / optionalDeps)

NEUE PHP-PAKETE (composer.json):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"dompdf/dompdf": "^2.0"      (bleibt als Fallback)
```

---

## 10. Zusammenfassung

```
┌──────────────────────────────────────────────────────────────┐
│  ISM Charts & PDF auf einen Blick                            │
│                                                              │
│  WEB-CHARTS:                                                 │
│    Nivo (D3-basiert, 30+ Chart-Typen, Theming)               │
│    + Framer Motion (Eintritts-Animationen, Übergänge)        │
│    = Moderne, beeindruckende Datenvisualisierung              │
│                                                              │
│  PDF-CHARTS:                                                 │
│    Option A (Fallback): PHP-SVGs + DOMPDF                    │
│      → Einfach, läuft überall, ausreichende Qualität        │
│                                                              │
│    Option B (Empfohlen): Nivo SSR + Puppeteer                │
│      → Gleiche Chart-Qualität wie im Web                    │
│      → Pixelgenaue PDFs mit modernem Layout                 │
│      → Braucht Node.js auf dem Server                        │
│                                                              │
│  DUAL-ENGINE: Auto-Erkennung (Puppeteer verfügbar? → ja/nein)│
│                                                              │
│  DESIGN-SYSTEM:                                              │
│    ISM Chart-Theme (Farben, Fonts, Abstände)                 │
│    Einheitlich in Web UND PDF                                │
│    Makler-Branding (Primärfarbe) wird durchgereicht          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
