# Tables

> Tabellen und Pagination für das RESA Admin Backend

## Table

Daten-Tabellen mit Border, Header-Hintergrund und klickbaren Zeilen.

### Spezifikation Container

| Eigenschaft       | Wert                               |
| ----------------- | ---------------------------------- |
| **Border**        | `1px solid hsl(214.3 31.8% 91.4%)` |
| **Border Radius** | `8px`                              |
| **Overflow**      | `hidden`                           |

### Spezifikation Header

| Eigenschaft       | Wert                               |
| ----------------- | ---------------------------------- |
| **Background**    | `hsl(210 40% 96.1%)`               |
| **Padding**       | `12px 16px`                        |
| **Border Bottom** | `1px solid hsl(214.3 31.8% 91.4%)` |

### Spezifikation Zellen

| Eigenschaft       | Wert                                        |
| ----------------- | ------------------------------------------- |
| **Padding**       | `12px 16px` (erste Spalte), `12px` (andere) |
| **Border Bottom** | `1px solid hsl(214.3 31.8% 91.4%)`          |
| **Text Color**    | `#1e303a` (RESA Blau)                       |
| **Name Column**   | `fontWeight: 500`                           |

### Spezifikation Zeilen (klickbar)

| Eigenschaft | Wert          |
| ----------- | ------------- |
| **Cursor**  | `pointer`     |
| **Hover**   | Radix-default |

### Code

```tsx
<div
	style={{
		border: '1px solid hsl(214.3 31.8% 91.4%)',
		borderRadius: '8px',
		overflow: 'hidden',
	}}
>
	<Table>
		<TableHeader>
			<TableRow style={{ backgroundColor: 'hsl(210 40% 96.1%)' }}>
				<TableHead
					style={{
						paddingTop: '12px',
						paddingBottom: '12px',
						paddingLeft: '16px',
						borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
					}}
				>
					{__('Name', 'resa')}
				</TableHead>
				<TableHead
					style={{
						paddingTop: '12px',
						paddingBottom: '12px',
						borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
					}}
				>
					{__('E-Mail', 'resa')}
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{items.map((item) => (
				<TableRow
					key={item.id}
					onClick={() => handleClick(item)}
					style={{ cursor: 'pointer' }}
				>
					<TableCell
						style={{
							paddingLeft: '16px',
							paddingTop: '12px',
							paddingBottom: '12px',
							fontWeight: 500,
							borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
						}}
					>
						{item.name}
					</TableCell>
					<TableCell
						style={{
							paddingTop: '12px',
							paddingBottom: '12px',
							color: '#1e303a',
							borderBottom: '1px solid hsl(214.3 31.8% 91.4%)',
						}}
					>
						{item.email}
					</TableCell>
				</TableRow>
			))}
		</TableBody>
	</Table>
</div>
```

---

## Pagination

Seitennavigation für Tabellen.

### Spezifikation

| Eigenschaft          | Wert                 |
| -------------------- | -------------------- |
| **Container Gap**    | `8px`                |
| **Text Color**       | `#1e303a`            |
| **Text Size**        | `13px`               |
| **Button Variant**   | `outline`            |
| **Button Size**      | `icon` (32px × 32px) |
| **Disabled Opacity** | `0.5`                |
| **Icon Size**        | `16px × 16px`        |

### Code

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
	<p style={{ fontSize: '13px', color: '#1e303a' }}>
		{sprintf(__('Seite %d von %d', 'resa'), currentPage, totalPages)}
	</p>
	<div style={{ display: 'flex', gap: '4px' }}>
		<Button
			variant="outline"
			size="icon"
			onClick={() => setPage(1)}
			disabled={currentPage === 1}
		>
			<ChevronsLeft style={{ width: '16px', height: '16px' }} />
		</Button>
		<Button
			variant="outline"
			size="icon"
			onClick={() => setPage(currentPage - 1)}
			disabled={currentPage === 1}
		>
			<ChevronLeft style={{ width: '16px', height: '16px' }} />
		</Button>
		<Button
			variant="outline"
			size="icon"
			onClick={() => setPage(currentPage + 1)}
			disabled={currentPage === totalPages}
		>
			<ChevronRight style={{ width: '16px', height: '16px' }} />
		</Button>
		<Button
			variant="outline"
			size="icon"
			onClick={() => setPage(totalPages)}
			disabled={currentPage === totalPages}
		>
			<ChevronsRight style={{ width: '16px', height: '16px' }} />
		</Button>
	</div>
</div>
```

### Verwendung

- Am Ende von Tabellen mit vielen Einträgen
- Kombination mit "X von Y Einträge" Anzeige
