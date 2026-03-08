# Layout

> AdminPageLayout, Container, Section Header, Spacing-System

## Section Header

Headline + Subline für Sektionen innerhalb einer Seite. Eng zusammen, ohne Card-Wrapper.

### Spezifikation

| Element       | Eigenschaft  | Wert                  |
| ------------- | ------------ | --------------------- |
| **Headline**  | fontSize     | `18px`                |
| **Headline**  | fontWeight   | `600`                 |
| **Headline**  | color        | `#1e303a` (RESA Blau) |
| **Headline**  | margin       | `0`                   |
| **Subline**   | fontSize     | `14px`                |
| **Subline**   | fontWeight   | `400`                 |
| **Subline**   | color        | `#1e303a` (RESA Blau) |
| **Subline**   | margin       | `4px 0 0 0`           |
| **Container** | marginBottom | `16px`                |

### Code (Inline CSS)

```tsx
<div style={{ marginBottom: '16px' }}>
	<h3
		style={{
			fontSize: '18px',
			fontWeight: 600,
			color: '#1e303a',
			margin: 0,
		}}
	>
		{__('Überschrift', 'resa')}
	</h3>
	<p
		style={{
			fontSize: '14px',
			color: '#1e303a',
			margin: '4px 0 0 0',
		}}
	>
		{__('Beschreibungstext', 'resa')}
	</p>
</div>
```

### Verwendung

- Sektionen auf Dashboard (z.B. "Neueste Leads")
- Bereiche auf Einstellungsseiten
- Überall wo Headline + Subline ohne Card benötigt wird

---

## AdminPageLayout

Zentrale Layout-Komponente fuer alle Admin-Seiten. Zwei Varianten: `overview` (Hauptseiten) und `detail` (Unterseiten mit Breadcrumbs).

### Struktur

```
Card (minHeight: 600px, flexDirection: column)
├── Header (overview ODER detail)
│   ├── Overview: Logo + Titel + Description + Badge (Version/Plan)
│   └── Detail: Breadcrumb-Navigation + Zurueck-Button
├── CardContent (flex: 1, className: resa-space-y-6)
│   └── {children}
├── footerContent (optional, padding: 0 24px 24px)
└── PageFooter (dunkel, sticky)
```

### Spezifikation

| Element            | Eigenschaft     | Wert                         |
| ------------------ | --------------- | ---------------------------- |
| **Card**           | minHeight       | `600px`                      |
| **Card**           | display         | `flex`                       |
| **Card**           | flexDirection   | `column`                     |
| **OverviewHeader** | padding         | `12px 24px`                  |
| **OverviewHeader** | backgroundColor | `hsl(210 40% 96.1%)`         |
| **OverviewHeader** | borderRadius    | `12px 12px 0 0`              |
| **OverviewHeader** | marginBottom    | `24px`                       |
| **DetailHeader**   | padding         | `10px 24px`                  |
| **DetailHeader**   | backgroundColor | `hsl(210 40% 96.1%)`         |
| **DetailHeader**   | borderRadius    | `12px 12px 0 0`              |
| **Logo**           | height          | `48px`                       |
| **Title**          | fontSize        | `24px`                       |
| **Title**          | fontWeight      | `600`                        |
| **Title**          | lineHeight      | `1.2`                        |
| **Title**          | color           | `#1e303a`                    |
| **Description**    | fontSize        | `14px`                       |
| **Description**    | color           | `#1e303a`                    |
| **Description**    | marginTop       | `4px`                        |
| **CardContent**    | flex            | `1`                          |
| **CardContent**    | paddingTop      | `24px` (nur detail-Variante) |
| **PageFooter**     | backgroundColor | `#1e303a`                    |
| **PageFooter**     | color           | `white`                      |
| **PageFooter**     | padding         | `16px 24px`                  |
| **PageFooter**     | borderRadius    | `0 0 12px 12px`              |
| **PageFooter**     | fontSize        | `13px`                       |

### Code (Overview-Variante)

```tsx
<AdminPageLayout
	variant="overview"
	title={__('Dashboard', 'resa')}
	description={__('Uebersicht ueber Leads, Standorte und aktive Assets.', 'resa')}
>
	{/* Page Content */}
</AdminPageLayout>
```

### Code (Detail-Variante)

```tsx
<AdminPageLayout
	variant="detail"
	breadcrumbs={[
		{ label: __('Standorte', 'resa'), onClick: handleBack },
		{ label: __('Neuer Standort', 'resa') },
	]}
	onBack={handleBack}
>
	{/* Page Content */}
</AdminPageLayout>
```

### Verwendung

- **Overview**: Dashboard, Leads-Liste, Standorte-Liste, Smart Assets, Settings
- **Detail**: Lead-Detail, Standort-Editor, Modul-Settings

---

## Container

Aeusserer Wrapper fuer den gesamten Admin-Bereich. Definiert max-width und Ausrichtung.

### Spezifikation

| Element  | Eigenschaft  | Wert          | Tailwind-Klasse  |
| -------- | ------------ | ------------- | ---------------- |
| **main** | maxWidth     | `72rem` (6xl) | `resa-max-w-6xl` |
| **main** | marginLeft   | `0`           | `resa-ml-0`      |
| **main** | marginRight  | `auto`        | `resa-mr-auto`   |
| **main** | paddingRight | `1rem`        | `resa-pr-4`      |
| **main** | paddingY     | `1.5rem`      | `resa-py-6`      |

### Code

```tsx
// Layout.tsx — Shell fuer alle Admin-Seiten
export function Layout() {
	return (
		<main className="resa-max-w-6xl resa-ml-0 resa-mr-auto resa-pr-4 resa-py-6">
			<Outlet />
		</main>
	);
}
```

### Verwendung

- Wrapper fuer die gesamte Admin-App
- Linksbuendig im WP-Admin (kein Zentrieren)
- Rechts-Padding verhindert Kollision mit WP-Admin-Sidebar

---

## Grid

Grid-Layouts fuer verschiedene Content-Anordnungen.

### KPI-Cards Grid (Dashboard)

Responsives 4-Spalten-Grid fuer KPI-Karten.

| Breakpoint  | Spalten | Tailwind-Klasse       |
| ----------- | ------- | --------------------- |
| **Default** | 1       | `resa-grid-cols-1`    |
| **md**      | 2       | `md:resa-grid-cols-2` |
| **lg**      | 4       | `lg:resa-grid-cols-4` |
| **Gap**     | 16px    | `resa-gap-4`          |

```tsx
<div className="resa-grid resa-grid-cols-1 md:resa-grid-cols-2 lg:resa-grid-cols-4 resa-gap-4">
	<Card>...</Card>
	<Card>...</Card>
	<Card>...</Card>
	<Card>...</Card>
</div>
```

### Module Cards Grid (Smart Assets)

Auto-fill Grid fuer Modul-Karten mit Mindestbreite.

| Eigenschaft             | Wert                                    |
| ----------------------- | --------------------------------------- |
| **display**             | `grid`                                  |
| **gridTemplateColumns** | `repeat(auto-fill, minmax(320px, 1fr))` |
| **gap**                 | `16px`                                  |

```tsx
<div
	style={{
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
		gap: '16px',
	}}
>
	{modules.map((module) => (
		<ModuleCard key={module.slug} module={module} />
	))}
</div>
```

### Two-Column Grid (Formulare)

Zweispaltiges Grid fuer Form-Felder.

| Eigenschaft             | Wert      |
| ----------------------- | --------- |
| **display**             | `grid`    |
| **gridTemplateColumns** | `1fr 1fr` |
| **gap**                 | `16px`    |

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
	<div>
		<Label htmlFor="name">{__('Name', 'resa')}</Label>
		<Input id="name" {...form.register('name')} />
	</div>
	<div>
		<Label htmlFor="email">{__('E-Mail', 'resa')}</Label>
		<Input id="email" {...form.register('email')} />
	</div>
</div>
```

### Detail-Page Grid (Lead-Detail)

Zweispaltiges Grid fuer Detail-Ansichten.

| Eigenschaft             | Wert      |
| ----------------------- | --------- |
| **display**             | `grid`    |
| **gridTemplateColumns** | `1fr 1fr` |
| **gap**                 | `24px`    |

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
	{/* Left Column */}
	<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
		{/* Kontaktdaten, Nachricht, Notizen */}
	</div>
	{/* Right Column */}
	<div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
		{/* Eingabedaten, CRM-Sync */}
	</div>
</div>
```

---

## Spacing-System

Konsistente Abstaende zwischen Elementen und Sektionen.

### Vertikale Abstaende (Section Gaps)

| Kontext                   | Wert   | CSS/Tailwind                   | Verwendung                     |
| ------------------------- | ------ | ------------------------------ | ------------------------------ |
| **Zwischen Cards**        | `16px` | `gap: 16px`                    | Formular-Cards untereinander   |
| **Innerhalb CardContent** | `16px` | `gap: 16px`                    | Elemente in einer Card         |
| **Content-Sektionen**     | `24px` | `resa-space-y-6` / `gap: 24px` | Hauptsektionen auf einer Seite |
| **Header zu Content**     | `24px` | `marginBottom: 24px`           | Nach AdminPageLayout-Header    |
| **Section Header**        | `16px` | `marginBottom: 16px`           | Headline + Subline Container   |

### Horizontale Abstaende

| Kontext              | Wert   | CSS         | Verwendung                    |
| -------------------- | ------ | ----------- | ----------------------------- |
| **Grid-Spalten**     | `16px` | `gap: 16px` | Formular-Felder nebeneinander |
| **Detail-Grid**      | `24px` | `gap: 24px` | Detail-Seite zwei Spalten     |
| **Button-Gruppen**   | `8px`  | `gap: 8px`  | Buttons nebeneinander         |
| **Icon + Text**      | `6px`  | `gap: 6px`  | Icon neben Button-Label       |
| **Toolbar-Elemente** | `16px` | `gap: 16px` | Filter, Suche, Actions        |

### Card-Padding

| Element               | Padding       | Verwendung            |
| --------------------- | ------------- | --------------------- |
| **CardContent**       | `20px`        | Standard Card-Inhalt  |
| **Gray Box**          | `16px`        | Formular-Sektionen    |
| **Table Cell**        | `12px 16px`   | Tabellen-Zellen       |
| **Table Header**      | `12px 16px`   | Tabellen-Kopf         |
| **Alert/Warning Box** | `16px`        | Hinweis-Boxen         |
| **Footer Content**    | `0 24px 24px` | Inhalt vor dem Footer |

### Code-Beispiele

```tsx
// Card mit internem Spacing
<Card style={{ border: '1px solid hsl(214.3 31.8% 91.4%)' }}>
	<CardContent style={{ padding: '20px' }}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
			{/* Card Header */}
			<div>
				<h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
					{__('Maklerdaten', 'resa')}
				</h2>
				<p
					style={{
						margin: '4px 0 0 0',
						fontSize: '13px',
						color: 'hsl(215.4 16.3% 46.9%)',
					}}
				>
					{__('Beschreibung', 'resa')}
				</p>
			</div>

			{/* Gray Box Section */}
			<div
				style={{
					padding: '16px',
					backgroundColor: 'hsl(210 40% 96.1%)',
					borderRadius: '8px',
					border: '1px solid hsl(214.3 31.8% 91.4%)',
				}}
			>
				<p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 500 }}>
					{__('Persoenliche Daten', 'resa')}
				</p>
				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
					{/* Form Fields */}
				</div>
			</div>
		</div>
	</CardContent>
</Card>
```

```tsx
// Toolbar mit Spacing
<div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
	<Tabs value={filter} onValueChange={setFilter}>
		<TabsList>...</TabsList>
	</Tabs>
	<Input placeholder="Suchen..." style={{ maxWidth: '320px' }} />
	<div style={{ marginLeft: 'auto' }}>
		<Button>Export</Button>
	</div>
</div>
```

```tsx
// Button-Gruppe
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
	<Button variant="outline">{__('Abbrechen', 'resa')}</Button>
	<Button style={{ backgroundColor: '#a9e43f' }}>{__('Speichern', 'resa')}</Button>
</div>
```

### Spacing-Konstanten (empfohlen)

| Bezeichnung | Wert   | Verwendung                            |
| ----------- | ------ | ------------------------------------- |
| **xs**      | `4px`  | Subline marginTop, minimale Abstaende |
| **sm**      | `6px`  | Icon-Text-Gap, Label zu Input         |
| **md**      | `8px`  | Button-Gruppen, Badge-Gaps            |
| **base**    | `12px` | Formular-Feldabstaende, Box-Titel     |
| **lg**      | `16px` | Grid-Gaps, Card-interne Sektionen     |
| **xl**      | `24px` | Hauptsektionen, Detail-Grid           |
| **2xl**     | `48px` | Empty-State-Padding                   |
