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

Checkbox für einzelne Auswahl oder Mehrfachauswahl in Listen.

### Spezifikation

| Eigenschaft            | Wert                               |
| ---------------------- | ---------------------------------- |
| **Größe**              | `16px × 16px` (h-4 w-4)            |
| **Border Radius**      | `4px` (rounded-sm)                 |
| **Border**             | `1px solid hsl(214.3 31.8% 91.4%)` |
| **Background**         | `white`                            |
| **Box Shadow**         | `0 1px 2px 0 rgb(0 0 0 / 0.05)`    |
| **Checked Background** | `#a9e43f` (RESA Grün / primary)    |
| **Check Icon**         | Lucide `Check`, weiß               |

### Verwendung mit shadcn/ui

```tsx
import { Checkbox } from '@/components/ui/checkbox';

<Checkbox
	checked={isChecked}
	onCheckedChange={(checked) => setIsChecked(checked === true)}
	aria-label={__('Option aktivieren', 'resa')}
/>;
```

### Checkbox mit Label (in einer Liste)

Für Listen-Elemente (z.B. Standort-Zuordnung) wird die Checkbox in ein klickbares Label eingebettet:

```tsx
{
	locations.map((location) => (
		<label
			key={location.id}
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '10px',
				padding: '8px 12px',
				backgroundColor: selectedIds.includes(location.id) ? 'white' : 'transparent',
				border: selectedIds.includes(location.id)
					? '1px solid hsl(214.3 31.8% 91.4%)'
					: '1px solid transparent',
				borderRadius: '6px',
				cursor: 'pointer',
				transition: 'all 150ms',
			}}
		>
			<Checkbox
				checked={selectedIds.includes(location.id)}
				onCheckedChange={() => toggleSelection(location.id)}
			/>
			<span style={{ fontSize: '14px', color: '#1e303a' }}>{location.name}</span>
		</label>
	));
}
```

### Checkbox für Tabellen-Selektion

In Tabellen für Mehrfachauswahl (z.B. Leads-Tabelle):

```tsx
{
	/* Header Checkbox */
}
<Checkbox
	checked={allSelected}
	onCheckedChange={handleSelectAll}
	aria-label={__('Alle auswählen', 'resa')}
	{...(someSelected ? { 'data-state': 'indeterminate' } : {})}
/>;

{
	/* Row Checkbox */
}
<Checkbox
	checked={selectedRows.has(row.id)}
	onCheckedChange={(checked) => handleRowSelect(row.id, checked === true)}
	aria-label={sprintf(__('Zeile %s auswählen', 'resa'), row.name)}
/>;
```

---

## Radio

Radio-Buttons für Einzelauswahl. Verwendet native `<input type="radio">` mit Inline-Styles.

### Radio Cards

Die bevorzugte Darstellung ist als "Radio Card" — ein klickbarer Container mit Radio-Button und Beschreibung.

### Spezifikation (Radio Card)

| Eigenschaft       | Wert (Inaktiv)                     | Wert (Aktiv)                         |
| ----------------- | ---------------------------------- | ------------------------------------ |
| **Border**        | `2px solid hsl(214.3 31.8% 91.4%)` | `2px solid #a9e43f`                  |
| **Background**    | `white`                            | `rgba(169, 228, 63, 0.1)` (Grün 10%) |
| **Border Radius** | `8px`                              | `8px`                                |
| **Padding**       | `12px` oder `16px`                 | `12px` oder `16px`                   |
| **Cursor**        | `pointer`                          | `pointer`                            |
| **Transition**    | `all 150ms`                        | `all 150ms`                          |

### Radio-Button Styling

| Eigenschaft      | Wert                  |
| ---------------- | --------------------- |
| **Accent Color** | `#a9e43f` (RESA Grün) |

### Beispiel: Setup-Modus auswählen (große Karten)

Zwei nebeneinander liegende Karten mit ausführlicher Beschreibung:

```tsx
const modeCardStyle = (isActive: boolean): React.CSSProperties => ({
	flex: 1,
	display: 'flex',
	alignItems: 'flex-start',
	gap: '12px',
	borderRadius: '8px',
	border: `2px solid ${isActive ? '#a9e43f' : 'hsl(214.3 31.8% 91.4%)'}`,
	backgroundColor: isActive ? 'rgba(169, 228, 63, 0.1)' : 'white',
	padding: '16px',
	cursor: 'pointer',
	transition: 'all 150ms',
});

<div style={{ display: 'flex', gap: '16px' }}>
	{(['pauschal', 'individuell'] as const).map((mode) => (
		<label key={mode} style={modeCardStyle(selectedMode === mode)}>
			<input
				type="radio"
				name="setup_mode"
				checked={selectedMode === mode}
				onChange={() => setSelectedMode(mode)}
				style={{ marginTop: '2px', accentColor: '#a9e43f' }}
			/>
			<div>
				<div style={{ fontWeight: 500, color: '#1e303a' }}>
					{mode === 'pauschal' ? __('Pauschal', 'resa') : __('Individuell', 'resa')}
				</div>
				<div style={{ fontSize: '12px', color: '#1e303a', marginTop: '4px' }}>
					{mode === 'pauschal'
						? __('Verwende vordefinierte Werte für einen Regionstyp', 'resa')
						: __('Konfiguriere alle Faktoren manuell', 'resa')}
				</div>
			</div>
		</label>
	))}
</div>;
```

### Beispiel: Region-Presets (Grid-Karten)

Kompaktere Karten in einem 2-Spalten-Grid:

```tsx
const presetCardStyle = (isActive: boolean): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	gap: '12px',
	borderRadius: '8px',
	border: `2px solid ${isActive ? '#a9e43f' : 'hsl(214.3 31.8% 91.4%)'}`,
	backgroundColor: isActive ? 'rgba(169, 228, 63, 0.1)' : 'white',
	padding: '12px',
	cursor: 'pointer',
	transition: 'all 150ms',
});

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
	{Object.entries(presets).map(([key, preset]) => (
		<label key={key} style={presetCardStyle(selectedPreset === key)}>
			<input
				type="radio"
				name="region_preset"
				checked={selectedPreset === key}
				onChange={() => setSelectedPreset(key)}
				style={{ accentColor: '#a9e43f' }}
			/>
			<div>
				<div style={{ fontSize: '14px', fontWeight: 500, color: '#1e303a' }}>
					{preset.label}
				</div>
				{preset.base_price && (
					<div style={{ fontSize: '12px', color: '#1e303a' }}>
						{__('Basispreis:', 'resa')} {preset.base_price.toLocaleString('de-DE')}{' '}
						EUR/m2
					</div>
				)}
			</div>
		</label>
	))}
</div>;
```

### Beispiel: Provider-Auswahl mit PRO-Badge

Radio-Optionen mit optionalem PRO-Badge und Disabled-State:

```tsx
const providerOptionStyles = (isSelected: boolean, isDisabled: boolean): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'flex-start',
	gap: '12px',
	padding: '12px',
	borderRadius: '8px',
	cursor: isDisabled ? 'not-allowed' : 'pointer',
	border: isSelected ? '2px solid #a9e43f' : '1px solid hsl(214.3 31.8% 91.4%)',
	backgroundColor: isSelected ? 'white' : 'transparent',
	opacity: isDisabled ? 0.6 : 1,
	transition: 'all 150ms',
});

<label style={providerOptionStyles(provider === 'google', !canUseGoogle)}>
	<input
		type="radio"
		name="provider"
		value="google"
		checked={provider === 'google'}
		onChange={() => canUseGoogle && setProvider('google')}
		disabled={!canUseGoogle}
		style={{ marginTop: '2px' }}
	/>
	<div style={{ flex: 1 }}>
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#1e303a' }}>
				{__('Google Maps', 'resa')}
			</p>
			{!canUseGoogle && (
				<Badge variant="secondary" style={{ fontSize: '10px' }}>
					PRO
				</Badge>
			)}
		</div>
		<p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'hsl(215.4 16.3% 46.9%)' }}>
			{__('Google Maps API mit Places Autocomplete.', 'resa')}
		</p>
	</div>
</label>;
```

---

## Textarea

Mehrzeilige Texteingabe für Adressen, Beschreibungen oder längere Texte.

### Spezifikation

| Eigenschaft       | Wert                             |
| ----------------- | -------------------------------- |
| **Min Height**    | `60px` (min-h-[60px])            |
| **Border Radius** | `6px`                            |
| **Border**        | `1px solid hsl(214.3 31.8% 78%)` |
| **Background**    | `white`                          |
| **Padding**       | `8px 12px`                       |
| **Font Size**     | `14px`                           |
| **Box Shadow**    | `0 1px 2px 0 rgb(0 0 0 / 0.05)`  |

### Verwendung mit shadcn/ui

```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
	id="address"
	value={address}
	onChange={(e) => setAddress(e.target.value)}
	placeholder={__('Musterstraße 1\n12345 Musterstadt', 'resa')}
	rows={3}
	style={{
		height: 'auto',
		padding: '8px 12px',
		fontSize: '14px',
		border: '1px solid hsl(214.3 31.8% 78%)',
		borderRadius: '6px',
		backgroundColor: 'white',
	}}
/>;
```

### Textarea mit React Hook Form

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
	<Label htmlFor="consent-text">{__('Einwilligungstext', 'resa')}</Label>
	<Textarea
		id="consent-text"
		rows={3}
		{...form.register('consent_text')}
		style={{
			height: 'auto',
			padding: '8px 12px',
			fontSize: '14px',
			border: '1px solid hsl(214.3 31.8% 78%)',
			borderRadius: '6px',
			backgroundColor: 'white',
			borderColor: errors.consent_text ? '#ef4444' : undefined,
		}}
	/>
	{errors.consent_text && (
		<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
			{errors.consent_text.message}
		</p>
	)}
	<p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'hsl(215.4 16.3% 46.9%)' }}>
		{__('Der Platzhalter [Datenschutzerklärung] wird als klickbarer Link dargestellt.', 'resa')}
	</p>
</div>
```

### Adress-Textarea

Für mehrzeilige Adressen:

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
	<Label htmlFor="agent-address">{__('Adresse', 'resa')}</Label>
	<Textarea
		id="agent-address"
		{...form.register('agent.address')}
		placeholder={__('Musterstraße 1\n12345 Musterstadt', 'resa')}
		rows={3}
		style={{
			height: 'auto',
			padding: '8px 12px',
			fontSize: '14px',
			border: '1px solid hsl(214.3 31.8% 78%)',
			borderRadius: '6px',
			backgroundColor: 'white',
		}}
	/>
</div>
```
