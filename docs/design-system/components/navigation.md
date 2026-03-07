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

TODO
