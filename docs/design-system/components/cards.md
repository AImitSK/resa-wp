# Cards

> Card-Varianten für das RESA Admin Backend

## Stats Card

KPI-Karte für Dashboard-Metriken mit Titel, Wert, Trend und optionaler Aktion.

### Spezifikation Card-Container

| Eigenschaft       | Wert                                                            |
| ----------------- | --------------------------------------------------------------- |
| **Border**        | `1px solid hsl(214.3 31.8% 91.4%)`                              |
| **Shadow**        | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` |
| **Border Radius** | vom Card-Component (Standard)                                   |

### Spezifikation Innenlayout

| Bereich        | Eigenschaft  | Wert                           |
| -------------- | ------------ | ------------------------------ |
| **Container**  | padding      | `20px`                         |
| **Container**  | display      | `flex` / `column`              |
| **Header**     | marginBottom | `12px`                         |
| **Header**     | layout       | `space-between` / `flex-start` |
| **Titel**      | fontSize     | `14px`                         |
| **Titel**      | fontWeight   | `600`                          |
| **Titel**      | color        | `#1e303a` (RESA Blau)          |
| **Wert**       | fontSize     | `32px`                         |
| **Wert**       | fontWeight   | `600`                          |
| **Wert**       | color        | `#1e303a`                      |
| **Wert**       | marginBottom | `16px`                         |
| **Footer**     | marginTop    | `auto`                         |
| **Footer**     | gap          | `8px`                          |
| **Trend-Text** | fontSize     | `13px`                         |
| **Trend-Text** | color        | `#1e303a` (RESA Blau)          |
| **Trend-Text** | fontWeight   | `400`                          |

### Code (Inline CSS)

```tsx
{
	/* Card Container */
}
<Card
	style={{
		border: '1px solid hsl(214.3 31.8% 91.4%)',
		boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
	}}
>
	{/* Innenlayout */}
	<div
		style={{
			display: 'flex',
			flexDirection: 'column',
			padding: '20px',
			height: '100%',
		}}
	>
		{/* Header: Titel + Badge */}
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-start',
				marginBottom: '12px',
			}}
		>
			<span
				style={{
					fontSize: '14px',
					fontWeight: 600,
					color: '#1e303a',
					margin: 0,
				}}
			>
				{__('Titel', 'resa')}
			</span>
			{/* Badge oder TrendBadge hier */}
		</div>

		{/* Wert */}
		<div
			style={{
				fontSize: '32px',
				fontWeight: 600,
				color: '#1e303a',
				lineHeight: 1.2,
				marginBottom: '16px',
			}}
		>
			42
		</div>

		{/* Footer: Trend + Button */}
		<div
			style={{
				marginTop: 'auto',
				display: 'flex',
				flexDirection: 'column',
				gap: '8px',
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					fontSize: '13px',
					color: '#1e303a',
					fontWeight: 400,
				}}
			>
				Beschreibungstext
			</div>
			{/* Outline Button hier */}
		</div>
	</div>
</Card>;
```

### Verwendung

- Dashboard KPI-Anzeigen (Leads, Standorte, Assets)
- Metriken mit Trend-Indikator
- Schnellzugriff auf Detailseiten

---

## Weitere Varianten

TODO: Content Card, List Card
