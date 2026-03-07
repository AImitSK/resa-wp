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

TODO

## Container

TODO

## Grid

TODO

## Spacing-System

TODO
