---
name: dompdf
description: "DOMPDF Limitierungen & PDF-Generierung für RESA. Automatisch anwenden: CSS-Einschränkungen beachten, Puppeteer-Fallback-Strategie, Font-Handling, Seitenumbrüche, SVG-Kompatibilität."
user-invocable: false
---

# DOMPDF & PDF-Generierung für RESA

Diese Regeln IMMER beim Erstellen von PDF-Templates und -Code anwenden. RESA nutzt eine **Dual-Engine-Architektur**: DOMPDF (Fallback) + Puppeteer (empfohlen).

Referenz: `docs/planning/RESA-Charts-und-PDF.md`

## Dual-Engine Strategie

```
Puppeteer verfügbar?
  → JA:  Nivo SSR (renderToStaticMarkup) → HTML+SVG → Puppeteer → PDF
  → NEIN: PHP SimpleCharts → Inline-SVG → DOMPDF → PDF
```

**Auto-Erkennung:** `PdfGenerator::detect_best_engine()` prüft ob Node.js 18+ verfügbar ist.

## DOMPDF CSS-Support — Was geht, was nicht

### Unterstützt

| Feature | Anmerkung |
|---|---|
| `display: block/inline/table` | Standard-Layouting |
| `float: left/right` | Für Spalten-Layouts (statt Flexbox) |
| `position: absolute/relative` | Für Positionierung |
| `width, height, margin, padding` | Feste Werte in `mm`, `px`, `%` |
| `border, border-radius` | Funktioniert |
| `background-color` | Funktioniert |
| `font-size, font-weight, color` | Funktioniert |
| `text-align, line-height` | Funktioniert |
| `page-break-before/after/inside` | Seitenumbruch-Steuerung |
| `@page` | Seitenformat, Margins |
| `table, tr, td` | Beste Option für Layouts! |

### NICHT unterstützt (DOMPDF-spezifisch)

| Feature | Workaround |
|---|---|
| `display: flex` | → `<table>` oder `float` verwenden |
| `display: grid` | → `<table>` verwenden |
| `transform` | → Nicht verwendbar |
| `box-shadow` | → `border` als Ersatz |
| `gradient` (linear/radial) | → Einfarbiger Hintergrund |
| `opacity` | → Eingeschränkt, nicht auf Text |
| `@media` Queries | → Nicht unterstützt |
| CSS Custom Properties (`var()`) | → Direkte Werte verwenden |
| `calc()` | → Vorberechnen |
| `overflow: hidden` | → Eingeschränkt |
| Komplexe SVG (Filter, Clip-Path) | → Einfache SVGs verwenden |
| SVG `<text>` mit Web-Fonts | → Nur System-Fonts in SVG |
| Canvas-Elemente | → Nicht unterstützt |
| JavaScript | → Nicht unterstützt |

## PDF-Template-Regeln

### Layout: Tabellen statt Flexbox

```html
<!-- FALSCH: Flexbox (funktioniert NICHT in DOMPDF) -->
<div style="display: flex; gap: 20px;">
  <div>Links</div>
  <div>Rechts</div>
</div>

<!-- RICHTIG: Table-Layout für DOMPDF -->
<table style="width: 100%; border-collapse: collapse;">
  <tr>
    <td style="width: 50%; vertical-align: top; padding-right: 10px;">Links</td>
    <td style="width: 50%; vertical-align: top; padding-left: 10px;">Rechts</td>
  </tr>
</table>
```

### Seitenumbrüche

```html
<!-- Seitenumbruch vor einem Element -->
<div style="page-break-before: always;">Neue Seite</div>

<!-- Seitenumbruch nach einem Element -->
<div style="page-break-after: always;">Ende der Seite</div>

<!-- Element nicht umbrechen -->
<div style="page-break-inside: avoid;">Zusammenhalten</div>

<!-- @page Regel für Ränder -->
<style>
@page {
  margin: 20mm 15mm 25mm 15mm;
  size: A4 portrait;
}
</style>
```

### Schriftarten (TTF only)

```php
// Nur TTF-Schriften! Keine WOFF/WOFF2/OTF
$dompdf->getOptions()->set( 'fontDir', RESA_PLUGIN_DIR . 'assets/fonts/' );

// System-Fonts die immer funktionieren:
// serif, sans-serif, monospace, cursive
// → Für RESA: font-family: sans-serif; (sicherer Standard)
```

**Regel:** Keine Web-Fonts in DOMPDF-Templates laden. `font-family: system-ui, sans-serif` verwenden.

### Bilder

```php
// Bilder IMMER mit absolutem Pfad oder Data-URI
// FALSCH:
'<img src="/wp-content/uploads/logo.png">'

// RICHTIG: Absoluter Server-Pfad
'<img src="' . ABSPATH . 'wp-content/uploads/logo.png">'

// RICHTIG: Data-URI (für kleine Bilder)
$data = base64_encode( file_get_contents( $image_path ) );
'<img src="data:image/png;base64,' . $data . '">'

// Max. Bildgröße beachten: DOMPDF lädt Bilder in den Speicher
// → Große Bilder vorher verkleinern (max. 800px Breite)
```

### Inline-Styles verwenden

```html
<!-- FALSCH: Externe CSS-Klassen (unzuverlässig in DOMPDF) -->
<div class="result-box highlight">...</div>

<!-- RICHTIG: Inline-Styles (zuverlässig in DOMPDF) -->
<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
  ...
</div>
```

**Ausnahme:** `<style>`-Block im `<head>` funktioniert für einfache Selektoren (Tag, Class). Keine komplexen Selektoren.

## SVG in DOMPDF

### Was funktioniert

```xml
<!-- Einfache Formen: rect, circle, line, polyline, polygon, path -->
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <rect x="10" y="10" width="80" height="150" fill="#3b82f6" rx="4" />
  <text x="50" y="180" text-anchor="middle" font-size="12" fill="#334155">Label</text>
</svg>
```

### Was NICHT funktioniert

```xml
<!-- NICHT: Gradienten -->
<linearGradient>...</linearGradient>

<!-- NICHT: Filter (blur, shadow) -->
<filter>...</filter>

<!-- NICHT: clipPath -->
<clipPath>...</clipPath>

<!-- NICHT: foreignObject -->
<foreignObject>...</foreignObject>

<!-- NICHT: Animationen -->
<animate>...</animate>

<!-- NICHT: Web-Fonts in <text> -->
<text font-family="CustomFont">...</text>
```

**Regel:** PHP SimpleChart-Klassen (`includes/Services/Pdf/Charts/`) erzeugen DOMPDF-kompatible SVGs mit nur `rect`, `circle`, `line`, `path`, `text`.

## PHP SimpleChart-Pattern (für DOMPDF-Fallback)

```php
// includes/Services/Pdf/Charts/SimpleBarChart.php
class SimpleBarChart {
    public function render( array $data ): string {
        $width = 500;
        $height = 200;
        $maxValue = max( array_column( $data, 'value' ) );

        $svg = '<svg xmlns="http://www.w3.org/2000/svg" '
             . 'width="' . $width . '" height="' . $height . '" '
             . 'viewBox="0 0 ' . $width . ' ' . $height . '">';

        // Nur einfache SVG-Elemente: rect, text, line
        // Keine Gradienten, Filter, clip-path
        // Farben als rgb() oder hex, nicht als CSS-Variablen

        $svg .= '</svg>';
        return $svg;
    }
}
```

**Verfügbare SimpleChart-Klassen:**
- `SimpleBarChart` — Balkendiagramm (Vergleiche)
- `SimpleBulletChart` — Spanne mit Marker (Preis-Range)
- `SimplePieChart` — Kreisdiagramm (Faktoren)
- `SimpleLineChart` — Liniendiagramm (Trends)
- `SimpleGaugeChart` — Gauge/Tachonadel (Scores)

## Puppeteer-Engine (empfohlen)

Wenn Puppeteer verfügbar ist, gelten die DOMPDF-Einschränkungen NICHT. Trotzdem beachten:

```typescript
// Nivo-Charts für PDF: IMMER deaktivieren:
<Bar
  animate={false}         // Keine Animation
  isInteractive={false}   // Keine Tooltips
  // ... restliche Props
/>
```

### Puppeteer PDF-Einstellungen

```typescript
await page.pdf({
  format: 'A4',
  printBackground: true,
  margin: { top: '20mm', right: '15mm', bottom: '25mm', left: '15mm' },
  displayHeaderFooter: true,
  // footerTemplate mit Seitenzahlen
});
```

## Anti-Patterns — NIEMALS in PDF-Templates

```html
<!-- NIEMALS: Flexbox/Grid in DOMPDF-Templates -->
display: flex;
display: grid;

<!-- NIEMALS: CSS-Variablen -->
color: var(--resa-primary);

<!-- NIEMALS: calc() -->
width: calc(100% - 30px);

<!-- NIEMALS: Externe Ressourcen -->
<link rel="stylesheet" href="...">
<img src="https://...">  <!-- Nur bei Puppeteer OK -->

<!-- NIEMALS: JavaScript in PDF-Templates -->
<script>...</script>

<!-- NIEMALS: Komplexe SVG-Features -->
<svg><defs><linearGradient>...</linearGradient></defs></svg>
```

## Checkliste: Neues PDF-Template

- [ ] Layout mit `<table>` statt Flexbox/Grid?
- [ ] Alle Styles inline oder im `<style>`-Block?
- [ ] Keine CSS-Variablen, `calc()`, Custom Properties?
- [ ] Bilder mit absolutem Pfad oder Data-URI?
- [ ] SVGs nur mit einfachen Elementen (rect, text, line, path)?
- [ ] Seitenumbrüche mit `page-break-before/after`?
- [ ] `@page`-Regel für Ränder definiert?
- [ ] Schrift: `sans-serif` (kein Web-Font)?
- [ ] Nivo-Charts mit `animate={false}` und `isInteractive={false}`?
- [ ] Template funktioniert in BEIDEN Engines (DOMPDF + Puppeteer)?
