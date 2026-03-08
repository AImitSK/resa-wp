# Navigation

> Tabs, Dropdown-Menüs, Breadcrumbs für das RESA Admin Backend

## Tabs (Filter)

Segmentierte Tabs für Filter-Optionen. Aktiver Tab hat weißen Hintergrund mit Shadow.

### Spezifikation TabsList

| Eigenschaft       | Wert                 |
| ----------------- | -------------------- |
| **Height**        | `36px`               |
| **Background**    | `hsl(210 40% 96.1%)` |
| **Border Radius** | `8px`                |
| **Padding**       | `4px`                |
| **Display**       | `inline-flex`        |

### Spezifikation TabsTrigger

| Eigenschaft              | Wert                            |
| ------------------------ | ------------------------------- |
| **Border Radius**        | `6px`                           |
| **Padding**              | `6px 12px`                      |
| **Font Size**            | `14px`                          |
| **Font Weight**          | `500`                           |
| **Text Color**           | `#1e303a` (RESA Blau)           |
| **Transition**           | `all 150ms`                     |
| **Background (aktiv)**   | `white`                         |
| **Background (inaktiv)** | `transparent`                   |
| **Shadow (aktiv)**       | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |

### Counter Badge in Tabs

| Eigenschaft       | Wert                 |
| ----------------- | -------------------- |
| **Font Size**     | `11px`               |
| **Padding**       | `2px 6px`            |
| **Border Radius** | `9999px`             |
| **Background**    | `hsl(210 40% 96.1%)` |
| **Color**         | `#1e303a`            |
| **Margin Left**   | `6px`                |

### Code

```tsx
const counterBadgeStyle = {
	fontSize: '11px',
	padding: '2px 6px',
	borderRadius: '9999px',
	backgroundColor: 'hsl(210 40% 96.1%)',
	color: '#1e303a',
	marginLeft: '6px',
};

<Tabs value={statusFilter} onValueChange={handleStatusFilter}>
	<TabsList
		style={{
			display: 'inline-flex',
			height: '36px',
			alignItems: 'center',
			justifyContent: 'center',
			borderRadius: '8px',
			backgroundColor: 'hsl(210 40% 96.1%)',
			padding: '4px',
		}}
	>
		<TabsTrigger
			value="all"
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				whiteSpace: 'nowrap',
				borderRadius: '6px',
				padding: '6px 12px',
				fontSize: '14px',
				fontWeight: 500,
				transition: 'all 150ms',
				backgroundColor: statusFilter === 'all' ? 'white' : 'transparent',
				color: '#1e303a',
				boxShadow: statusFilter === 'all' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
			}}
		>
			{__('alle', 'resa')}
			<span style={counterBadgeStyle}>{count}</span>
		</TabsTrigger>
	</TabsList>
</Tabs>;
```

---

## Dropdown-Menü (Aktionen)

Drei-Punkte-Menü für Zeilen-Aktionen in Tabellen.

### Spezifikation Trigger

| Eigenschaft   | Wert          |
| ------------- | ------------- |
| **Padding**   | `4px`         |
| **Icon Size** | `16px × 16px` |
| **Variant**   | `ghost`       |

### Spezifikation Content

| Eigenschaft    | Wert    |
| -------------- | ------- |
| **Background** | `white` |
| **Padding**    | `4px`   |
| **Align**      | `end`   |

### Spezifikation MenuItem

| Eigenschaft           | Wert               |
| --------------------- | ------------------ |
| **Icon Size**         | `14px × 14px`      |
| **Icon Margin**       | `marginRight: 8px` |
| **Destructive Color** | `#dc2626` (Rot)    |

### Code

```tsx
<DropdownMenu>
	<DropdownMenuTrigger asChild>
		<Button variant="ghost" size="sm" style={{ padding: '4px' }}>
			<MoreHorizontal style={{ width: '16px', height: '16px' }} />
			<span className="resa-sr-only">{__('Menü öffnen', 'resa')}</span>
		</Button>
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" style={{ backgroundColor: 'white', padding: '4px' }}>
		<DropdownMenuLabel>{__('Aktionen', 'resa')}</DropdownMenuLabel>
		<DropdownMenuItem onClick={handleView}>
			<Eye style={{ width: '14px', height: '14px', marginRight: '8px' }} />
			{__('Details', 'resa')}
		</DropdownMenuItem>
		<DropdownMenuSeparator />
		<DropdownMenuItem onClick={handleDelete} style={{ color: '#dc2626' }}>
			<Trash2 style={{ width: '14px', height: '14px', marginRight: '8px' }} />
			{__('Löschen', 'resa')}
		</DropdownMenuItem>
	</DropdownMenuContent>
</DropdownMenu>
```

### Verwendung

- Zeilen-Aktionen in Tabellen
- Kontextmenüs für einzelne Einträge
- Bearbeiten, Details, Löschen Aktionen

---

## Breadcrumbs

Zurück-Navigation für Detail-Seiten. Implementiert via `AdminPageLayout` mit `variant="detail"`.

### Breadcrumb-Leiste (Detail Header)

Die Breadcrumb-Leiste erscheint oben auf Detail-Seiten und kombiniert eine Breadcrumb-Navigation mit einem Zurück-Button.

#### Spezifikation Breadcrumb-Leiste

| Eigenschaft       | Wert                   |
| ----------------- | ---------------------- |
| **Background**    | `hsl(210 40% 96.1%)`   |
| **Padding**       | `10px 24px`            |
| **Border Radius** | `12px 12px 0 0` (oben) |
| **Font Size**     | `14px`                 |
| **Display**       | `flex` (space-between) |

#### Spezifikation Breadcrumb-Items

| Eigenschaft             | Wert                     |
| ----------------------- | ------------------------ |
| **Gap zwischen Items**  | `8px`                    |
| **Separator**           | `/`                      |
| **Separator Color**     | `hsl(215.4 16.3% 46.9%)` |
| **Link Color**          | `hsl(215.4 16.3% 46.9%)` |
| **Current Item Color**  | `#1e303a`                |
| **Current Item Weight** | `500`                    |
| **Cursor (klickbar)**   | `pointer`                |

### Zurück-Button (Ghost)

Der Zurück-Button erscheint rechts in der Breadcrumb-Leiste.

#### Spezifikation Zurück-Button

| Eigenschaft            | Wert                              |
| ---------------------- | --------------------------------- |
| **Height**             | `32px`                            |
| **Padding**            | `0 12px`                          |
| **Font Size**          | `13px`                            |
| **Gap (Icon + Text)**  | `6px`                             |
| **Background**         | `transparent`                     |
| **Background (Hover)** | `hsl(210 40% 88%)`                |
| **Color**              | `#1e303a`                         |
| **Border**             | `none`                            |
| **Icon**               | `ArrowLeft` (16px)                |
| **Text**               | `"Zurück"` oder spezifischer Text |

### Code

```tsx
import { AdminPageLayout } from '../components/AdminPageLayout';
import { ArrowLeft } from 'lucide-react';

// Detail-Seite mit Breadcrumbs (via AdminPageLayout)
function LeadDetail() {
	const breadcrumbs = [
		{ label: __('Leads', 'resa'), onClick: handleBackToList },
		{ label: leadName }, // Aktuelle Seite (nicht klickbar)
	];

	return (
		<AdminPageLayout variant="detail" breadcrumbs={breadcrumbs} onBack={handleBackToList}>
			{/* Content */}
		</AdminPageLayout>
	);
}

// Standalone Zurück-Button (für Fehler-Zustände o.ä.)
function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			onClick={onClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 88%)' : 'transparent',
				color: '#1e303a',
				border: 'none',
				boxShadow: 'none',
				gap: '6px',
				height: '32px',
				padding: '0 12px',
				fontSize: '13px',
			}}
		>
			{children}
		</Button>
	);
}

<GhostButton onClick={handleBackToList}>
	<ArrowLeft style={{ width: '16px', height: '16px' }} />
	{__('Zurück zur Liste', 'resa')}
</GhostButton>;
```

### Verwendung

| Seite              | Breadcrumbs                         | Zurück-Ziel     |
| ------------------ | ----------------------------------- | --------------- |
| **Lead Detail**    | Leads / Max Mustermann              | Leads-Liste     |
| **Modul Settings** | Smart Assets / Mietpreis-Kalkulator | Module-Store    |
| **Location Edit**  | Standorte / München                 | Standorte-Liste |

### Hinweise

- Breadcrumbs verwenden eine `<nav aria-label="breadcrumb">` mit `<ol>` für Barrierefreiheit
- Das letzte Element ist **nicht klickbar** (aktuelle Seite)
- Der Zurück-Button erscheint rechts, unabhängig von den Breadcrumbs
- Bei Fehler-Zuständen kann ein zusätzlicher Zurück-Button im Content-Bereich erscheinen
