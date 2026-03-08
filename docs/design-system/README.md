# RESA Design System

> Status: Stabil

## Übersicht

Dieses Verzeichnis dokumentiert alle UI-Elemente des RESA Admin-Backends. Das Design System stellt sicher, dass alle Komponenten einheitlich aussehen und sich konsistent verhalten.

## Struktur

- `tokens.md` — Design Tokens (Farben, Spacing, Typography, Shadows)
- `components/` — UI-Komponenten nach Kategorie
- `patterns/` — Wiederkehrende UI-Patterns

---

## Prinzipien

### 1. Inline-Styles statt Tailwind-Klassen

Im WordPress-Admin können Tailwind-Klassen durch Theme-CSS überschrieben werden. Deshalb verwenden wir **Inline-Styles** für alle kritischen Styling-Eigenschaften:

```tsx
// Richtig: Inline-Styles
<Button
  style={{
    backgroundColor: '#a9e43f',
    color: '#1e303a',
  }}
>
  Speichern
</Button>

// Vermeiden: Tailwind-Klassen für kritische Styles
<Button className="resa-bg-green-500 resa-text-blue-900">
  Speichern
</Button>
```

### 2. RESA Farbpalette

| Farbe                | Hex                      | Verwendung                                      |
| -------------------- | ------------------------ | ----------------------------------------------- |
| **RESA Grün**        | `#a9e43f`                | Primary Buttons, Akzente, Erfolg, Premium-Badge |
| **RESA Grün Hover**  | `#98d438`                | Hover-State für Primary Buttons                 |
| **RESA Blau**        | `#1e303a`                | Texte, Labels, Buttons auf Grün, Free-Badge     |
| **Muted Background** | `hsl(210 40% 96.1%)`     | Graue Boxen, Tab-Hintergründe                   |
| **Muted Foreground** | `hsl(215.4 16.3% 46.9%)` | Sekundärer Text, Placeholder                    |
| **Border**           | `hsl(214.3 31.8% 91.4%)` | Card-Borders, Tabellen-Linien                   |
| **Input Border**     | `hsl(214.3 31.8% 78%)`   | Formular-Felder                                 |
| **Destructive**      | `#ef4444`                | Fehlermeldungen, Löschen-Buttons                |

### 3. Konsistente Abstände

| Abstand | Wert   | Verwendung                          |
| ------- | ------ | ----------------------------------- |
| **xs**  | `4px`  | Icon-zu-Text Gap, minimale Abstände |
| **sm**  | `6px`  | Label-zu-Input, enge Gruppierungen  |
| **md**  | `8px`  | Standard Gap in Flex-Containern     |
| **lg**  | `12px` | Card-Header Padding, Zellen-Padding |
| **xl**  | `16px` | Sektion-Abstände, Grid-Gaps         |
| **2xl** | `20px` | Card-Padding                        |
| **3xl** | `24px` | Große Sektionsabstände              |
| **4xl** | `48px` | Empty-State Padding, Loading-State  |

### 4. shadcn/ui als Basis

Alle UI-Komponenten basieren auf [shadcn/ui](https://ui.shadcn.com/) (Radix-basiert). Die Komponenten werden kopiert nach `src/components/ui/` und mit RESA-Styles erweitert:

- `Button` — Basis-Button mit Variants
- `Card` — Container mit Border + Shadow
- `Table` — Tabellen mit Header-Styling
- `Tabs` — Segmentierte Navigation
- `Dialog` / `AlertDialog` — Modale Dialoge
- `Input` / `Select` / `Switch` — Formularelemente
- `Badge` — Status-Labels

### 5. Internationalisierung mit `__()`

**Alle User-facing Strings** werden mit WordPress i18n gewrappt:

```tsx
import { __ } from '@wordpress/i18n';

// Richtig
<Button>{__('Speichern', 'resa')}</Button>
<Label>{__('Name', 'resa')}</Label>
toast.success(__('Einstellungen gespeichert.', 'resa'));

// Falsch: Hardcoded Strings
<Button>Save</Button>
```

---

## Nutzung

### Tokens

Die `tokens.md` enthält alle Design-Grundwerte (Farben, Abstände, Typografie, Schatten). **Kopiere Werte von dort**, anstatt eigene zu erfinden:

```tsx
// Aus tokens.md: RESA Grün = #a9e43f
style={{ backgroundColor: '#a9e43f' }}
```

### Components

Die Komponenten-Dokumentation (`components/*.md`) enthält:

1. **Spezifikation** — Exakte CSS-Werte in Tabellenform
2. **Code-Beispiele** — Kopierbare TSX-Snippets mit Inline-Styles
3. **Verwendung** — Wann und wo die Komponente eingesetzt wird
4. **Varianten** — Verschiedene Ausprägungen (mit/ohne Icon, Größen)

**Workflow:**

1. Finde die passende Komponente in `components/`
2. Kopiere den Code-Block
3. Passe Texte und Callbacks an
4. Wrappe Strings mit `__()`

### Patterns

Die Pattern-Dokumentation (`patterns/*.md`) beschreibt wiederkehrende UI-Muster, die mehrere Komponenten kombinieren:

- **Loading States** — Spinner + Text für Ladezustände
- **Empty States** — Dashed Box für leere Listen
- **Notifications** — Toast-System für Feedback
- **Confirm Dialogs** — Bestätigung vor destruktiven Aktionen
- **Form Validation** — Zod + React Hook Form Integration

**Beispiel: Empty State einbauen**

1. Öffne `patterns/empty-states.md`
2. Kopiere den vollständigen Code-Block
3. Passe Headline, Beschreibung und Button-Text an
4. Ersetze `onClick={openCreateDialog}` mit deiner Funktion

---

## Dateiübersicht

### Tokens

| Datei       | Beschreibung                                                        |
| ----------- | ------------------------------------------------------------------- |
| `tokens.md` | Design Tokens: Farben, Spacing, Typografie, Schatten, Border-Radius |

### Components

| Datei                      | Beschreibung                                                        |
| -------------------------- | ------------------------------------------------------------------- |
| `components/buttons.md`    | Primary, Outline, Ghost Buttons mit Hover-States und Icon-Varianten |
| `components/cards.md`      | Stats Card (Dashboard KPIs), Content Box (Detailseiten)             |
| `components/dialogs.md`    | Dialog, Sheet, Popover, Tooltip (Placeholder)                       |
| `components/feedback.md`   | Badge (Tier/Status), Alert, Spinner, Progress                       |
| `components/forms.md`      | Input, Select, Label, Switch, Form Field Layouts, Graue Boxen       |
| `components/layout.md`     | Section Header, AdminPageLayout, Container, Grid, Spacing           |
| `components/navigation.md` | Tabs (Filter mit Counter), Dropdown-Menüs, Breadcrumbs              |
| `components/tables.md`     | Tabellen mit klickbaren Zeilen, Pagination                          |

### Patterns

| Datei                         | Beschreibung                                                        |
| ----------------------------- | ------------------------------------------------------------------- |
| `patterns/confirm-dialogs.md` | ConfirmDeleteDialog für destruktive Aktionen, AlertDialog vs Dialog |
| `patterns/empty-states.md`    | Dashed Box für leere Listen mit Headline + Button                   |
| `patterns/form-validation.md` | Zod Schemas, React Hook Form, zodResolver, Fehleranzeige            |
| `patterns/loading-states.md`  | LoadingState-Komponente, Error State mit Alert, Inline-Spinner      |
| `patterns/notifications.md`   | Toast-System mit Sonner, Varianten (success/error/warning/info)     |
