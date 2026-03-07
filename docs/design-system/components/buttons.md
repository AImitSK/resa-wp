# Buttons

> Button-Varianten für das RESA Admin Backend

## Outline Button

Kompakter Button mit weißem Hintergrund und feiner Border. Für sekundäre Aktionen und Navigation.

### Spezifikation

| Eigenschaft          | Wert                                 |
| -------------------- | ------------------------------------ |
| **Höhe**             | `32px`                               |
| **Breite**           | `fit-content`                        |
| **Padding**          | `0 12px`                             |
| **Font Size**        | `13px`                               |
| **Font Weight**      | `500`                                |
| **Border Radius**    | `6px`                                |
| **Border**           | `1px solid #e8e8e8`                  |
| **Background**       | `white`                              |
| **Background Hover** | `hsl(210 40% 96.1%)` (--resa-accent) |
| **Shadow**           | `0 1px 2px 0 rgb(0 0 0 / 0.05)`      |
| **Text Color**       | `#1e303a` (RESA Blau)                |
| **Gap (Text/Icon)**  | `8px`                                |
| **Icon Position**    | rechts                               |
| **Icon Stroke**      | `1.5`                                |

### Code (Inline CSS)

```tsx
<button
	onClick={handleClick}
	style={{
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
		height: '32px',
		width: 'fit-content',
		padding: '0 12px',
		fontSize: '13px',
		fontWeight: 500,
		whiteSpace: 'nowrap',
		borderRadius: '6px',
		border: '1px solid #e8e8e8',
		backgroundColor: 'white',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		color: '#1e303a',
		cursor: 'pointer',
	}}
	onMouseEnter={(e) => {
		e.currentTarget.style.backgroundColor = 'hsl(210 40% 96.1%)';
	}}
	onMouseLeave={(e) => {
		e.currentTarget.style.backgroundColor = 'white';
	}}
>
	{__('Button Text', 'resa')}
	<ArrowRight style={{ width: '16px', height: '16px', strokeWidth: 1.5 }} />
</button>
```

### Verwendung

- Navigation zu Unterseiten (z.B. "Alle Leads anzeigen", "Einstellungen")
- Sekundäre Aktionen in Cards
- Links mit Button-Styling

---

## Weitere Varianten

TODO: Primary Button, Destructive Button, Ghost Button
