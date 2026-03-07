# Forms

> Input, Select, Checkbox, Radio, Switch, Textarea

## Gemeinsame Eigenschaften

Alle Formularfelder teilen diese Basis-Styles:

| Eigenschaft       | Wert                             |
| ----------------- | -------------------------------- |
| **Height**        | `36px` (h-9)                     |
| **Border Radius** | `6px` (0.5rem)                   |
| **Border**        | `1px solid hsl(214.3 31.8% 78%)` |
| **Background**    | `white`                          |
| **Text Color**    | `#1e303a` (RESA Blau)            |
| **Font Size**     | `14px`                           |
| **Padding**       | `0 12px`                         |
| **Box Shadow**    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`  |

### Focus State

| Eigenschaft      | Wert                                |
| ---------------- | ----------------------------------- |
| **Border Color** | `hsl(81.5 75.4% 57.1%)` (RESA Grün) |
| **Box Shadow**   | `0 0 0 1px hsl(81.5 75.4% 57.1%)`   |
| **Outline**      | `none`                              |

---

## Input

Standard-Textfeld für einzeilige Eingaben.

### Verwendung mit shadcn/ui

```tsx
import { Input } from '@/components/ui/input';

<Input
	id="location-name"
	value={value}
	onChange={(e) => setValue(e.target.value)}
	placeholder={__('z.B. München', 'resa')}
	style={{ backgroundColor: 'white' }}
/>;
```

### Auf grauem Hintergrund

Wenn ein Input in einer grauen Box (`hsl(210 40% 96.1%)`) liegt, **muss** der Hintergrund explizit auf weiß gesetzt werden:

```tsx
<Input
	...
	style={{ backgroundColor: 'white' }}
/>
```

### Varianten

#### Input mit Icon links

```tsx
<div style={{ position: 'relative' }}>
	<Search
		style={{
			position: 'absolute',
			left: '12px',
			top: '50%',
			transform: 'translateY(-50%)',
			width: '16px',
			height: '16px',
			color: '#1e303a',
		}}
	/>
	<Input
		placeholder={__('Suchen...', 'resa')}
		style={{ paddingLeft: '40px', backgroundColor: 'white' }}
	/>
</div>
```

#### Number Input

```tsx
<Input
	type="number"
	step="0.1"
	min="0"
	max="10"
	value={value}
	onChange={(e) => setValue(Number(e.target.value))}
	style={{ backgroundColor: 'white' }}
/>
```

---

## Select

Dropdown-Auswahl. **Wichtig:** Native `<select>` mit Inline-Styles verwenden (nicht shadcn Select), da dies besser mit WordPress Admin funktioniert.

### Spezifikation

```tsx
<select
	id="field-id"
	value={value}
	onChange={(e) => setValue(e.target.value)}
	style={{
		height: '36px',
		width: '100%',
		borderRadius: '6px',
		border: '1px solid hsl(214.3 31.8% 78%)',
		backgroundColor: 'white',
		padding: '0 12px',
		fontSize: '14px',
		color: '#1e303a',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	}}
>
	<option value="option1">Option 1</option>
	<option value="option2">Option 2</option>
</select>
```

### Beispiel: Regionstyp

```tsx
const REGION_TYPES = [
	{ value: 'rural', label: 'Ländlich' },
	{ value: 'small_town', label: 'Kleinstadt / Stadtrand' },
	{ value: 'medium_city', label: 'Mittelstadt' },
	{ value: 'large_city', label: 'Großstadt / Zentrum' },
];

<select
	id="location-region-type"
	style={{
		height: '36px',
		width: '100%',
		borderRadius: '6px',
		border: '1px solid hsl(214.3 31.8% 78%)',
		backgroundColor: 'white',
		padding: '0 12px',
		fontSize: '14px',
		color: '#1e303a',
		boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
	}}
	value={form.region_type}
	onChange={(e) => setForm((prev) => ({ ...prev, region_type: e.target.value }))}
>
	{REGION_TYPES.map((rt) => (
		<option key={rt.value} value={rt.value}>
			{rt.label}
		</option>
	))}
</select>;
```

---

## Label

Beschriftung für Formularfelder.

### Spezifikation

| Eigenschaft     | Wert                  |
| --------------- | --------------------- |
| **Color**       | `#1e303a` (RESA Blau) |
| **Font Size**   | `14px`                |
| **Font Weight** | `500`                 |

### Verwendung

```tsx
import { Label } from '@/components/ui/label';

<Label htmlFor="location-name" style={{ color: '#1e303a' }}>
	{__('Name', 'resa')} *
</Label>;
```

---

## Form Field Layout

Standard-Layout für ein Formularfeld mit Label und Input.

### Einzelnes Feld

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
	<Label htmlFor="field-id" style={{ color: '#1e303a' }}>
		{__('Feldname', 'resa')}
	</Label>
	<Input
		id="field-id"
		value={value}
		onChange={(e) => setValue(e.target.value)}
		style={{ backgroundColor: 'white' }}
	/>
</div>
```

### Zwei-Spalten Grid

```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
	<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
		<Label htmlFor="field-1" style={{ color: '#1e303a' }}>
			{__('Feld 1', 'resa')}
		</Label>
		<Input id="field-1" style={{ backgroundColor: 'white' }} />
	</div>
	<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
		<Label htmlFor="field-2" style={{ color: '#1e303a' }}>
			{__('Feld 2', 'resa')}
		</Label>
		<Input id="field-2" style={{ backgroundColor: 'white' }} />
	</div>
</div>
```

### Mit Hilfetext

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
	<Label htmlFor="field-id" style={{ color: '#1e303a' }}>
		{__('Maklerprovision (%)', 'resa')}
	</Label>
	<Input
		id="field-id"
		type="number"
		step="0.01"
		value={value}
		onChange={(e) => setValue(e.target.value)}
		style={{ backgroundColor: 'white' }}
	/>
	<p style={{ fontSize: '12px', color: '#1e303a', margin: '4px 0 0 0' }}>
		{__('Standard: 3,57% (inkl. MwSt.)', 'resa')}
	</p>
</div>
```

---

## Graue Box mit Formularfeldern

Wenn Formularfelder in einer grauen Card-Box liegen, müssen alle Inputs und Selects weißen Hintergrund haben.

### Card-Box Style

```tsx
const cardStyle: React.CSSProperties = {
	backgroundColor: 'hsl(210 40% 96.1%)',
	borderRadius: '8px',
	padding: '20px',
};

const cardHeaderStyle: React.CSSProperties = {
	fontSize: '15px',
	fontWeight: 600,
	color: '#1e303a',
	margin: 0,
};

const cardSublineStyle: React.CSSProperties = {
	fontSize: '13px',
	color: '#1e303a',
	margin: '4px 0 16px 0',
};
```

### Beispiel: Komplette Box

```tsx
<div style={cardStyle}>
	<h4 style={cardHeaderStyle}>{__('Grunddaten', 'resa')}</h4>
	<p style={cardSublineStyle}>
		{__('Name, Slug und Regionsinformationen des Standorts.', 'resa')}
	</p>

	<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
		<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
			<Label htmlFor="name" style={{ color: '#1e303a' }}>
				{__('Name', 'resa')} *
			</Label>
			<Input
				id="name"
				value={form.name}
				onChange={(e) => setName(e.target.value)}
				style={{ backgroundColor: 'white' }}
			/>
		</div>
		{/* ... weitere Felder */}
	</div>
</div>
```

---

## Switch

Toggle-Schalter für Boolean-Werte.

### Verwendung

```tsx
import { Switch } from '@/components/ui/switch';

<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
	<Switch checked={isActive} onCheckedChange={setIsActive} />
	<span style={{ fontSize: '14px', color: '#1e303a' }}>
		{isActive ? __('Aktiv', 'resa') : __('Inaktiv', 'resa')}
	</span>
</div>;
```

---

## Checkbox

TODO

## Radio

TODO

## Textarea

TODO
