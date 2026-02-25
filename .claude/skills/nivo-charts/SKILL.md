---
name: nivo-charts
description: "Nivo-Charts & Datenvisualisierung für RESA. Automatisch anwenden: resaChartTheme, resaColors, Dual-Rendering (Web interaktiv + PDF statisch), DACH-Zahlenformatierung, Framer Motion Eintritts-Animationen."
user-invocable: false
---

# Nivo-Charts & Datenvisualisierung für RESA

Diese Regeln IMMER beim Erstellen von Charts und Datenvisualisierungen anwenden. RESA nutzt **Nivo** (D3-basiert) für alle Charts.

Referenz: `docs/planning/RESA-Charts-und-PDF.md`

## Nivo-Pakete

```
@nivo/core      Basis (Theme, Farben, Utilities)
@nivo/bar       Balkendiagramme (Vergleiche)
@nivo/line      Liniendiagramme (Trends, Entwicklungen)
@nivo/pie       Kreisdiagramme (Verteilungen)
@nivo/radar     Radar-Charts (Objekt-Profile)
@nivo/bullet    Bullet-Charts (Spannen mit Markern)
@nivo/gauge     Gauge-Charts (Scores, Effizienz)
@nivo/funnel    Funnel-Charts (Lead-Qualifizierung)
@nivo/waffle    Waffle-Charts (Kostenaufteilung)
```

**IMMER `Responsive`-Variante verwenden** im Web (z.B. `ResponsiveBar`, `ResponsiveLine`).
**Feste `width`/`height` verwenden** für PDF-Rendering (z.B. `Bar` statt `ResponsiveBar`).

## Chart-Typen pro RESA-Modul

| Modul | Charts | Pakete |
|---|---|---|
| **Mietpreis-Kalkulator** | Bullet (Spanne), Bar (Vergleich), Pie (Faktoren), Line (Trend) | bullet, bar, pie, line |
| **Immobilienwert-Kalkulator** | Bullet (Wertspanne), Radar (Profil), Bar (Vergleich), Line (Trend) | bullet, radar, bar, line |
| **Kaufnebenkosten-Rechner** | Waffle (Aufteilung), Bar (Stacked) | waffle, bar |
| **Energieeffizienz-Check** | Gauge (Score), Bar (Kosten A vs H) | gauge, bar |
| **Budgetrechner** | Pie (Verteilung), Bar (Leistbarkeit) | pie, bar |
| **Renditerechner** | Line (Rendite/Zeit), Bar (Cashflow/Jahr) | line, bar |

## RESA Chart-Theme — PFLICHT

```typescript
import { resaChartTheme, resaColors } from '@/frontend/lib/chart-theme';

// IMMER das RESA-Theme verwenden:
<ResponsiveBar
  theme={resaChartTheme}
  colors={resaColors.primary}
  // ...
/>
```

### Theme-Konfiguration (Referenz)

```typescript
// src/frontend/lib/chart-theme.ts
export const resaChartTheme: Theme = {
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontSize: 13,
  axis: {
    domain: { line: { stroke: '#e2e8f0', strokeWidth: 1 } },
    ticks: {
      text: { fill: '#64748b', fontSize: 12 },
      line: { stroke: '#e2e8f0' },
    },
    legend: { text: { fill: '#334155', fontSize: 13, fontWeight: 600 } },
  },
  grid: { line: { stroke: '#f1f5f9', strokeWidth: 1 } },
  labels: { text: { fill: '#1e293b', fontSize: 13, fontWeight: 500 } },
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
```

### Farbpaletten — Semantisch wählen

| Palette | Farben | Einsatz |
|---|---|---|
| `resaColors.primary` | Blau-Abstufungen | Standard, einzelne Datenreihe |
| `resaColors.comparison` | Blau, Grau, Hellgrau | Objekt vs. Stadt vs. Kreis |
| `resaColors.gradient` | Blau → Lila → Rosa | Verlauf-Visualisierungen |
| `resaColors.factors` | Blau, Grün, Amber, Rot | Einflussfaktoren (4 Kategorien) |
| `resaColors.costs` | Blau → Lila Abstufungen | Kostenaufteilung |
| `resaColors.energy` | Grün → Rot (5 Stufen) | Energieeffizienz (A bis H) |

## Dual-Rendering: Web vs. PDF

### Web-Charts (Frontend Widget)

```tsx
// IMMER: Responsive-Variante, Animation, Interaktivität
import { ResponsiveBar } from '@nivo/bar';

<ResponsiveBar
  data={data}
  theme={resaChartTheme}
  colors={resaColors.comparison}
  animate={true}
  motionConfig="gentle"
  isInteractive={true}     // Tooltips aktiv
  // ...
/>
```

### PDF-Charts (Server-Side Rendering)

```tsx
// IMMER: Feste Größe, KEINE Animation, KEINE Interaktivität
import { Bar } from '@nivo/bar';
import ReactDOMServer from 'react-dom/server';

const svgString = ReactDOMServer.renderToStaticMarkup(
  <Bar
    width={480}
    height={280}
    data={data}
    theme={resaChartTheme}
    colors={resaColors.comparison}
    animate={false}          // ← PFLICHT für PDF
    isInteractive={false}    // ← PFLICHT für PDF
    // ...
  />
);
```

**Regel:** Jede Chart-Komponente existiert zweimal:
1. `RentComparisonBar.tsx` — Web (Responsive, animiert, interaktiv)
2. `RentComparisonBarSvg.tsx` — PDF (Feste Größe, statisch)

Oder als Shared Component mit `renderMode`-Prop:

```tsx
interface ChartProps {
  data: ChartData;
  renderMode: 'web' | 'pdf';
}

function RentComparisonBar({ data, renderMode }: ChartProps) {
  const BarComponent = renderMode === 'web' ? ResponsiveBar : Bar;
  const sizeProps = renderMode === 'pdf' ? { width: 480, height: 280 } : {};

  return (
    <BarComponent
      {...sizeProps}
      data={data}
      theme={resaChartTheme}
      animate={renderMode === 'web'}
      isInteractive={renderMode === 'web'}
    />
  );
}
```

## DACH-Formatierung in Charts

### Achsen-Labels und Tooltips

```typescript
// Euro-Beträge: Komma als Dezimaltrenner, Punkt als Tausender
const formatEuro = ( value: number ): string =>
  new Intl.NumberFormat( 'de-DE', {
    style: 'currency',
    currency: 'EUR',
  } ).format( value );
// → "1.234,56 €"

// Pro Quadratmeter
const formatPerSqm = ( value: number ): string =>
  `${ value.toFixed( 2 ).replace( '.', ',' ) } €/m²`;
// → "9,52 €/m²"

// Prozent
const formatPercent = ( value: number ): string =>
  `${ value.toFixed( 1 ).replace( '.', ',' ) } %`;
// → "12,5 %"
```

### Achsen-Konfiguration

```tsx
<ResponsiveBar
  axisBottom={{
    tickSize: 5,
    tickPadding: 5,
    legend: __( 'Vergleich', 'resa' ),  // i18n!
    legendPosition: 'middle',
    legendOffset: 40,
  }}
  axisLeft={{
    tickSize: 5,
    tickPadding: 5,
    format: ( v ) => formatPerSqm( v ),  // DACH-Format
    legend: __( '€/m²', 'resa' ),
    legendPosition: 'middle',
    legendOffset: -50,
  }}
/>
```

**Regel:** Alle Zahlen in Charts IMMER mit DACH-Formatierung (Komma-Dezimal, Euro-Zeichen, m²).

## Framer Motion Eintritts-Animationen

Charts werden mit Framer Motion eingeblendet wenn der Nutzer zum Ergebnis scrollt:

```tsx
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// Chart-Container mit Fade-Up-Animation
function AnimatedChart({ children }: { children: React.ReactNode }) {
  const ref = useRef( null );
  const isInView = useInView( ref, { once: true, margin: '-50px' } );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

// Gestaffelt: Mehrere Charts nacheinander einblenden
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
```

**Regel:** Eintritts-Animationen NUR im Web, NIE in PDF-Templates.

## Chart-Container im Frontend Widget

```tsx
// Charts müssen im Widget mit resa- Prefix gestylt werden
<div className="resa-chart-container resa-h-64 resa-w-full">
  <ResponsiveBar ... />
</div>
```

**Regel:** CSS-Klassen auf Chart-Containern immer mit `resa-` Prefix (Widget-Isolation).

## Tooltips: Custom mit DACH-Format

```tsx
// Custom Tooltip für RESA-Charts
function ResaBarTooltip({ id, value, color }: BarTooltipProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      padding: '10px 14px',
      fontSize: 13,
    }}>
      <strong style={{ color }}>{id}</strong>
      <br />
      {formatPerSqm( value )}
    </div>
  );
}

<ResponsiveBar
  tooltip={ResaBarTooltip}
  // ...
/>
```

## Chart-Daten Shared Pattern

```typescript
// Chart-Daten werden EINMAL berechnet und in Web + PDF verwendet
interface RentChartData {
  bullet: {
    rentMin: number;
    rentMax: number;
    rentMedian: number;
    marketMin: number;
    marketMax: number;
  };
  comparison: {
    yourRent: number;
    cityAvg: number;
    districtAvg: number;
  };
  factors: Array<{
    name: string;
    impact: string;
    percent: number;
    direction: 'up' | 'down';
  }>;
  trend: Array<{
    year: number;
    value: number;
  }>;
}

// Web: <RentResultCharts data={chartData} renderMode="web" />
// PDF: <RentResultCharts data={chartData} renderMode="pdf" />
```

## Anti-Patterns — NIEMALS bei Charts

```tsx
// NIEMALS: Charts ohne RESA-Theme
<ResponsiveBar data={data} />
// → IMMER: theme={resaChartTheme}

// NIEMALS: Hardcoded Farben statt Paletten
colors={['#ff0000', '#00ff00']}
// → IMMER: colors={resaColors.comparison}

// NIEMALS: Englische Labels ohne i18n
axisBottom={{ legend: 'Comparison' }}
// → IMMER: legend: __( 'Vergleich', 'resa' )

// NIEMALS: Punkt als Dezimaltrenner im DACH-Raum
format={v => `${v.toFixed(2)} €`}
// → IMMER: format={v => formatPerSqm(v)} (mit Komma)

// NIEMALS: animate={true} in PDF-Charts
<Bar animate={true} />  // In PDF!
// → IMMER: animate={false} + isInteractive={false} in PDF

// NIEMALS: Responsive-Variante in PDF
<ResponsiveBar />  // In PDF!
// → IMMER: <Bar width={480} height={280} /> in PDF

// NIEMALS: Charts ohne Container-Höhe
<ResponsiveBar />  // Responsive braucht Höhe vom Parent!
// → IMMER: <div className="resa-h-64"><ResponsiveBar /></div>
```

## Checkliste: Neuer Chart

- [ ] `resaChartTheme` als `theme` gesetzt?
- [ ] `resaColors.*` Palette gewählt (semantisch passend)?
- [ ] Achsen-Labels mit DACH-Formatierung (Komma-Dezimal, €, m²)?
- [ ] Alle sichtbaren Texte mit `__( '...', 'resa' )` gewrappt?
- [ ] Custom Tooltip mit DACH-Format?
- [ ] Container hat feste Höhe (`resa-h-*` Klasse)?
- [ ] CSS-Klassen mit `resa-` Prefix?
- [ ] Framer Motion Eintritts-Animation (nur Web)?
- [ ] PDF-Variante mit `animate={false}` + `isInteractive={false}`?
- [ ] Feste `width`/`height` in PDF-Variante?
- [ ] Chart-Daten als geteiltes Interface (Web + PDF)?
