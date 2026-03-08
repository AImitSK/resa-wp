# Design Tokens

Design Tokens sind die atomaren Bausteine des RESA Design Systems. Sie definieren Farben, Abstände, Typografie und andere visuelle Eigenschaften als wiederverwendbare Werte.

## CSS Custom Properties

Alle Tokens werden als CSS Custom Properties mit dem Präfix `--resa-` definiert. Die Farbwerte sind in HSL-Format ohne `hsl()` Wrapper gespeichert, um Opacity-Modifikationen zu ermöglichen.

**Verwendung:**

```css
/* In CSS */
background-color: hsl(var(--resa-primary));
color: hsl(var(--resa-foreground));

/* Mit Opacity */
background-color: hsl(var(--resa-primary) / 0.5);
```

---

## Farben

### Markenfarben

| Token     | HSL-Wert           | HEX       | Verwendung                       |
| --------- | ------------------ | --------- | -------------------------------- |
| RESA Grün | `81.5 75.4% 57.1%` | `#a9e43f` | Primärfarbe Admin, Akzente, CTAs |
| RESA Blau | `203 35% 17%`      | `#1e303a` | Foreground, Text, Dark Accents   |

### Semantische Farben (Admin)

| Token                  | CSS Variable                    | HSL-Wert            | Beschreibung                |
| ---------------------- | ------------------------------- | ------------------- | --------------------------- |
| Background             | `--resa-background`             | `0 0% 100%`         | Seitenhintergrund (Weiß)    |
| Foreground             | `--resa-foreground`             | `203 35% 17%`       | Primäre Textfarbe (#1e303a) |
| Card                   | `--resa-card`                   | `0 0% 100%`         | Kartenhintergrund           |
| Card Foreground        | `--resa-card-foreground`        | `203 35% 17%`       | Kartentext                  |
| Primary                | `--resa-primary`                | `81.5 75.4% 57.1%`  | RESA Grün (#a9e43f)         |
| Primary Foreground     | `--resa-primary-foreground`     | `203 35% 17%`       | Text auf Primary            |
| Secondary              | `--resa-secondary`              | `210 40% 96.1%`     | Sekundärer Hintergrund      |
| Secondary Foreground   | `--resa-secondary-foreground`   | `222.2 47.4% 11.2%` | Text auf Secondary          |
| Muted                  | `--resa-muted`                  | `210 40% 96.1%`     | Gedämpfter Hintergrund      |
| Muted Foreground       | `--resa-muted-foreground`       | `215.4 16.3% 46.9%` | Gedämpfter Text             |
| Accent                 | `--resa-accent`                 | `210 40% 96.1%`     | Akzent-Hintergrund          |
| Accent Foreground      | `--resa-accent-foreground`      | `222.2 47.4% 11.2%` | Text auf Accent             |
| Destructive            | `--resa-destructive`            | `0 84.2% 60.2%`     | Fehler/Löschen (#ef4444)    |
| Destructive Foreground | `--resa-destructive-foreground` | `210 40% 98%`       | Text auf Destructive        |
| Popover                | `--resa-popover`                | `0 0% 100%`         | Dropdown-Hintergrund        |
| Popover Foreground     | `--resa-popover-foreground`     | `203 35% 17%`       | Dropdown-Text               |
| Border                 | `--resa-border`                 | `214.3 31.8% 82%`   | Standard-Rahmenfarbe        |
| Input                  | `--resa-input`                  | `214.3 31.8% 78%`   | Input-Rahmenfarbe           |
| Ring                   | `--resa-ring`                   | `81.5 75.4% 57.1%`  | Focus-Ring (RESA Grün)      |

### Semantische Farben (Frontend Widget)

Das Frontend Widget verwendet ein neutrales Farbschema, das vom Makler per Branding überschrieben werden kann.

| Token              | CSS Variable                | HSL-Wert            | Beschreibung                   |
| ------------------ | --------------------------- | ------------------- | ------------------------------ |
| Background         | `--resa-background`         | `0 0% 100%`         | Widget-Hintergrund             |
| Foreground         | `--resa-foreground`         | `0 0% 3.9%`         | Primäre Textfarbe              |
| Primary            | `--resa-primary`            | `221.2 83.2% 53.3%` | Standard-Blau (überschreibbar) |
| Primary Foreground | `--resa-primary-foreground` | `210 40% 98%`       | Text auf Primary               |
| Muted              | `--resa-muted`              | `0 0% 96.1%`        | Gedämpfter Hintergrund         |
| Muted Foreground   | `--resa-muted-foreground`   | `0 0% 45.1%`        | Gedämpfter Text                |
| Border             | `--resa-border`             | `0 0% 80%`          | Gut sichtbare Rahmen           |
| Input              | `--resa-input`              | `0 0% 80%`          | Input-Rahmenfarbe              |

### Icon-Farben (Frontend)

| Token           | CSS Variable            | HEX       | Beschreibung        |
| --------------- | ----------------------- | --------- | ------------------- |
| Icon Primary    | `--resa-icon-primary`   | `#428dff` | Hauptfarbe Icons    |
| Icon Secondary  | `--resa-icon-secondary` | `#7facfa` | Sekundärfarbe Icons |
| Icon Light      | `--resa-icon-light`     | `#a4c2f7` | Helle Icon-Akzente  |
| Icon Background | `--resa-icon-bg`        | `#e8edfc` | Icon-Hintergrund    |

### Chart-Farben

| Token   | CSS Variable     | HSL-Wert      | Verwendung  |
| ------- | ---------------- | ------------- | ----------- |
| Chart 1 | `--resa-chart-1` | `12 76% 61%`  | Orange      |
| Chart 2 | `--resa-chart-2` | `173 58% 39%` | Türkis      |
| Chart 3 | `--resa-chart-3` | `197 37% 24%` | Dunkelblau  |
| Chart 4 | `--resa-chart-4` | `43 74% 66%`  | Gelb        |
| Chart 5 | `--resa-chart-5` | `27 87% 67%`  | Orange-Gelb |

### Status-Farben

| Status  | HEX       | Verwendung                              |
| ------- | --------- | --------------------------------------- |
| Success | `#22c55e` | Erfolgsmeldungen, "Neu"-Status          |
| Error   | `#ef4444` | Fehlermeldungen, "Verloren"-Status      |
| Warning | `#f59e0b` | Warnungen                               |
| Info    | `#3b82f6` | Informationen, "Qualifiziert"-Status    |
| Neutral | `#6b7280` | Neutrale Zustände, "Kontaktiert"-Status |

---

## Spacing

Die Abstände basieren auf einem 4px-Raster und werden konsistent im gesamten System verwendet.

### Spacing-Skala

| Token | Pixel | Rem      | Tailwind     | Verwendung                      |
| ----- | ----- | -------- | ------------ | ------------------------------- |
| 0.5   | 2px   | 0.125rem | `resa-p-0.5` | Minimale Abstände               |
| 1     | 4px   | 0.25rem  | `resa-p-1`   | Icon-Padding, Badge-Padding     |
| 1.5   | 6px   | 0.375rem | `resa-p-1.5` | Kleine Abstände, Gaps           |
| 2     | 8px   | 0.5rem   | `resa-p-2`   | Kompakte Elemente, kleine Gaps  |
| 2.5   | 10px  | 0.625rem | `resa-p-2.5` | Badge horizontal Padding        |
| 3     | 12px  | 0.75rem  | `resa-p-3`   | Input-Padding, Tab-Padding      |
| 4     | 16px  | 1rem     | `resa-p-4`   | Standard-Padding, Alert-Padding |
| 5     | 20px  | 1.25rem  | `resa-p-5`   | Card-Padding                    |
| 6     | 24px  | 1.5rem   | `resa-p-6`   | Card-Header/Content Padding     |
| 8     | 32px  | 2rem     | `resa-p-8`   | Große Abstände, Empty States    |
| 12    | 48px  | 3rem     | `resa-p-12`  | Section-Abstände                |

### Häufige Spacing-Kombinationen

| Element        | Padding                        | Gap               |
| -------------- | ------------------------------ | ----------------- |
| Card           | 20px                           | -                 |
| Card Header    | 24px (p-6)                     | 6px (space-y-1.5) |
| Card Content   | 24px horizontal, 0 top         | -                 |
| Button         | 8px vertical, 16px horizontal  | 8px               |
| Button (sm)    | 8px vertical, 12px horizontal  | -                 |
| Input          | 4px vertical, 12px horizontal  | -                 |
| Alert          | 12px vertical, 16px horizontal | -                 |
| Badge          | 2px vertical, 10px horizontal  | -                 |
| Tab Trigger    | 4px vertical, 12px horizontal  | -                 |
| Dialog Content | 24px                           | 16px              |

---

## Typography

### Font-Familie

```css
font-family:
	system-ui,
	-apple-system,
	BlinkMacSystemFont,
	'Segoe UI',
	Roboto,
	sans-serif;
```

### Font-Größen

| Token | Pixel | Rem      | Tailwind         | Verwendung                      |
| ----- | ----- | -------- | ---------------- | ------------------------------- |
| xs    | 12px  | 0.75rem  | `resa-text-xs`   | Badges, Labels, Hilfstexte      |
| sm    | 14px  | 0.875rem | `resa-text-sm`   | Body-Text, Inputs, Buttons      |
| base  | 16px  | 1rem     | `resa-text-base` | Standard-Text (Frontend Widget) |
| lg    | 18px  | 1.125rem | `resa-text-lg`   | Dialog-Titel                    |
| xl    | 20px  | 1.25rem  | `resa-text-xl`   | Section-Überschriften           |
| 2xl   | 24px  | 1.5rem   | `resa-text-2xl`  | Card-Titel                      |
| 3xl   | 30px  | 1.875rem | `resa-text-3xl`  | Page-Titel                      |
| 4xl   | 36px  | 2.25rem  | `resa-text-4xl`  | Große Zahlen (KPIs)             |

### Font-Weights

| Token    | Wert | Tailwind             | Verwendung                            |
| -------- | ---- | -------------------- | ------------------------------------- |
| Normal   | 400  | `resa-font-normal`   | Body-Text, Beschreibungen             |
| Medium   | 500  | `resa-font-medium`   | Buttons, Labels, Nav-Items            |
| Semibold | 600  | `resa-font-semibold` | Überschriften, Badges, Wichtige Werte |

### Line-Heights

| Token   | Wert  | Tailwind               | Verwendung     |
| ------- | ----- | ---------------------- | -------------- |
| None    | 1     | `resa-leading-none`    | Überschriften  |
| Tight   | 1.25  | `resa-leading-tight`   | Kompakte Texte |
| Normal  | 1.5   | `resa-leading-normal`  | Standard-Text  |
| Relaxed | 1.625 | `resa-leading-relaxed` | Längere Texte  |

---

## Shadows

### Box-Shadow-Skala

| Token     | Wert                                                               | Tailwind         | Verwendung                           |
| --------- | ------------------------------------------------------------------ | ---------------- | ------------------------------------ |
| shadow-sm | `0 1px 2px 0 rgb(0 0 0 / 0.05)`                                    | `resa-shadow-sm` | Buttons (outline, secondary), Inputs |
| shadow    | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`    | `resa-shadow`    | Cards, Default Buttons               |
| shadow-md | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)` | `resa-shadow-md` | Dropdowns, Hover-States              |
| shadow-lg | `0 4px 12px rgba(0, 0, 0, 0.15)`                                   | `resa-shadow-lg` | Toasts, Modals, Autocomplete         |

### Focus-Ring

```css
/* Standard Focus-Ring */
box-shadow: 0 0 0 1px hsl(var(--resa-ring));

/* Focus-Ring mit Offset */
box-shadow: 0 0 0 2px hsl(var(--resa-primary) / 0.2);

/* Outline-Style (Frontend) */
outline: 2px solid hsl(var(--resa-ring));
outline-offset: -2px;
```

---

## Border Radius

### Radius-Skala

| Token | Pixel  | CSS Variable                     | Tailwind            | Verwendung                  |
| ----- | ------ | -------------------------------- | ------------------- | --------------------------- |
| sm    | 4px    | `calc(var(--resa-radius) - 4px)` | `resa-rounded-sm`   | Checkboxen, kleine Elemente |
| md    | 6px    | `calc(var(--resa-radius) - 2px)` | `resa-rounded-md`   | Buttons, Inputs, Dropdowns  |
| lg    | 8px    | `var(--resa-radius)`             | `resa-rounded-lg`   | Alerts, Tabs                |
| xl    | 12px   | -                                | `resa-rounded-xl`   | Cards                       |
| full  | 9999px | -                                | `resa-rounded-full` | Badges, Switches, Avatare   |

### Basis-Variable

```css
--resa-radius: 0.5rem; /* 8px */
```

### Verwendung nach Element

| Element     | Radius | Tailwind-Klasse      |
| ----------- | ------ | -------------------- |
| Button      | 6px    | `resa-rounded-md`    |
| Input       | 6px    | `resa-rounded-md`    |
| Card        | 12px   | `resa-rounded-xl`    |
| Alert       | 8px    | `resa-rounded-lg`    |
| Badge       | 9999px | `resa-rounded-full`  |
| Switch      | 9999px | `resa-rounded-full`  |
| Checkbox    | 4px    | `resa-rounded-sm`    |
| Dialog      | 8px    | `sm:resa-rounded-lg` |
| Dropdown    | 6px    | `resa-rounded-md`    |
| Tab List    | 8px    | `resa-rounded-lg`    |
| Tab Trigger | 6px    | `resa-rounded-md`    |

---

## Animations

### Transition-Durations

| Token       | Wert  | Verwendung                      |
| ----------- | ----- | ------------------------------- |
| Fast        | 150ms | Hover-States, Buttons           |
| Normal      | 200ms | Standard-Transitions            |
| Slow        | 300ms | Animate-Out, Komplexe Übergänge |
| Dialog Open | 500ms | Dialog/Sheet öffnen             |

### Transition-Timing

```css
transition-timing-function: ease-in-out;
```

### Häufige Transitions

```css
/* Farb-Transition */
transition-property: color, background-color, border-color;
transition-duration: 150ms;

/* Opacity */
transition-property: opacity;
transition-duration: 200ms;

/* Transform */
transition-property: transform;
transition-duration: 200ms;
```

---

## Z-Index-Skala

| Token | Wert | Verwendung                |
| ----- | ---- | ------------------------- |
| Auto  | auto | Standard                  |
| 10    | 10   | Sticky-Elemente           |
| 20    | 20   | Header                    |
| 30    | 30   | Dropdowns                 |
| 40    | 40   | Modals (Backdrop)         |
| 50    | 50   | Dialogs, Sheets, Popovers |

---

## Tailwind-Präfix

Alle Tailwind-Klassen im RESA-Projekt verwenden den Präfix `resa-`:

```tsx
// Richtig
<div className="resa-flex resa-items-center resa-gap-4 resa-p-6">

// Falsch (ohne Präfix)
<div className="flex items-center gap-4 p-6">
```

Dies verhindert Konflikte mit WordPress-Admin-Styles und Host-Theme-Styles.
