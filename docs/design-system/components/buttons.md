# Buttons

> Button-Varianten für das RESA Admin Backend

## Primary Button

Hauptaktion-Button mit RESA Grün. Für Speichern, Erstellen, CTAs.

### Spezifikation

| Eigenschaft          | Wert                     |
| -------------------- | ------------------------ |
| **Background**       | `#a9e43f` (RESA Grün)    |
| **Background Hover** | `#98d438`                |
| **Text Color**       | `#1e303a` (RESA Blau)    |
| **Border**           | `none`                   |
| **Disabled Bg**      | `hsl(210 40% 96.1%)`     |
| **Disabled Text**    | `hsl(215.4 16.3% 46.9%)` |
| **Disabled Cursor**  | `not-allowed`            |

### Varianten

#### Primary mit Icon links

Für Erstellen-Aktionen (Plus-Icon) oder CTAs mit Icon.

```tsx
<PrimaryButton onClick={handleCreate}>
	<Plus style={{ width: '16px', height: '16px', marginRight: '6px' }} />
	{__('Neuer Standort', 'resa')}
</PrimaryButton>
```

#### Primary ohne Icon

Für einfache Aktionen wie Speichern.

```tsx
<PrimaryButton type="submit" disabled={isSaving}>
	{__('Speichern', 'resa')}
</PrimaryButton>
```

### Code (Komponente)

```tsx
function PrimaryButton({
	children,
	onClick,
	disabled,
	type = 'button',
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type={type}
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? '#98d438'
						: '#a9e43f',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : '#1e303a',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
			}}
		>
			{children}
		</Button>
	);
}
```

### Verwendung

- Hauptaktion auf Seiten (Speichern, Erstellen)
- CTAs (Upgrade, Jetzt starten)
- Formular-Submit

---

## Outline Button (Sekundär)

Sekundärer Button mit weißem Hintergrund und feiner Border. Für Abbrechen, Zurück, Navigation.

### Spezifikation

| Eigenschaft          | Wert                            |
| -------------------- | ------------------------------- |
| **Background**       | `white`                         |
| **Background Hover** | `hsl(210 40% 96.1%)`            |
| **Text Color**       | `#1e303a` (RESA Blau)           |
| **Border**           | `1px solid #e8e8e8`             |
| **Shadow**           | `0 1px 2px 0 rgb(0 0 0 / 0.05)` |

### Varianten

#### Outline ohne Icon

Für Abbrechen, Zurück.

```tsx
<OutlineButton onClick={onCancel}>{__('Abbrechen', 'resa')}</OutlineButton>
```

#### Outline mit Icon rechts

Für Navigation-Links in Cards.

```tsx
<OutlineButton onClick={handleNavigate}>
	{__('Alle anzeigen', 'resa')}
	<ArrowRight style={{ width: '16px', height: '16px', strokeWidth: 1.5 }} />
</OutlineButton>
```

### Code (Komponente)

```tsx
function OutlineButton({
	children,
	onClick,
	disabled,
	type = 'button',
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
	type?: 'button' | 'submit';
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type={type}
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: isHovered ? 'hsl(210 40% 96.1%)' : 'white',
				color: '#1e303a',
				border: '1px solid #e8e8e8',
				boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
				cursor: disabled ? 'not-allowed' : 'pointer',
			}}
		>
			{children}
		</Button>
	);
}
```

### Verwendung

- Abbrechen-Aktion in Formularen
- Zurück-Navigation
- Sekundäre Links in Cards (z.B. "Alle anzeigen")

---

## Ghost Button

Minimaler Button ohne Hintergrund. Für Navigation in Headers, Icon-Buttons.

### Spezifikation

| Eigenschaft          | Wert                  |
| -------------------- | --------------------- |
| **Background**       | `transparent`         |
| **Background Hover** | `hsl(210 40% 88%)`    |
| **Text Color**       | `#1e303a` (RESA Blau) |
| **Border**           | `none`                |
| **Shadow**           | `none`                |
| **Height**           | `32px`                |
| **Padding**          | `0 12px`              |
| **Font Size**        | `13px`                |

### Variante

#### Ghost mit Icon links

Für Zurück-Navigation in Breadcrumb-Leisten.

```tsx
<GhostButton onClick={handleBack}>
	<ArrowLeft style={{ width: '16px', height: '16px' }} />
	{__('Zurück', 'resa')}
</GhostButton>
```

### Code (Komponente)

```tsx
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
```

### Verwendung

- Zurück-Button in Breadcrumb-Leisten
- Icon-only Buttons (Dropdown-Trigger, Menüs)
- Sekundäre Aktionen in kompakten Bereichen

---

---

## Icons in Buttons

### Pfeil rechts

**IMMER** das `ArrowRight` Icon verwenden, **NIEMALS** Text-Pfeile wie `→` oder `>`.

```tsx
import { ArrowRight } from 'lucide-react';

// Richtig ✓
<OutlineButton>
	{__('Zur Dokumentation', 'resa')}
	<ArrowRight style={{ width: '16px', height: '16px', strokeWidth: 1.5 }} />
</OutlineButton>

// FALSCH ✗
<OutlineButton>
	{__('Zur Dokumentation', 'resa')} →
</OutlineButton>
```

### Pfeil links (Zurück)

```tsx
import { ArrowLeft } from 'lucide-react';

<GhostButton onClick={handleBack}>
	<ArrowLeft style={{ width: '16px', height: '16px' }} />
	{__('Zurück', 'resa')}
</GhostButton>;
```

---

## Destructive Button

Roter Button für Lösch-Aktionen und destruktive Operationen. Signalisiert visuell, dass eine Aktion unwiderruflich ist.

### Spezifikation

| Eigenschaft          | Wert                     |
| -------------------- | ------------------------ |
| **Background**       | `hsl(0 84.2% 60.2%)`     |
| **Background Hover** | `hsl(0 84.2% 50.2%)`     |
| **Text Color**       | `white`                  |
| **Border**           | `none`                   |
| **Disabled Bg**      | `hsl(210 40% 96.1%)`     |
| **Disabled Text**    | `hsl(215.4 16.3% 46.9%)` |
| **Disabled Cursor**  | `not-allowed`            |

### Varianten

#### Destructive ohne Icon

Für einfache Lösch-Aktionen.

```tsx
<DestructiveButton onClick={handleDelete}>{__('Löschen', 'resa')}</DestructiveButton>
```

#### Destructive mit Loading-Spinner

Für asynchrone Lösch-Aktionen mit Ladezustand.

```tsx
<DestructiveButton onClick={handleDelete} disabled={isLoading}>
	{isLoading && <Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />}
	{__('Löschen', 'resa')}
</DestructiveButton>
```

### Code (Komponente)

```tsx
function DestructiveButton({
	children,
	onClick,
	disabled,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	disabled?: boolean;
}) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<Button
			type="button"
			onClick={onClick}
			disabled={disabled}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				backgroundColor: disabled
					? 'hsl(210 40% 96.1%)'
					: isHovered
						? 'hsl(0 84.2% 50.2%)'
						: 'hsl(0 84.2% 60.2%)',
				color: disabled ? 'hsl(215.4 16.3% 46.9%)' : 'white',
				border: 'none',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: 1,
			}}
		>
			{children}
		</Button>
	);
}
```

### Verwendung

- Löschen von Datensätzen (Leads, Standorte, Webhooks)
- Bestätigungsdialoge für destruktive Aktionen
- Entfernen von Verknüpfungen oder Konfigurationen
- Immer in Kombination mit `ConfirmDeleteDialog` für wichtige Löschungen

> **Hinweis:** Der Destructive Button sollte immer die sekundäre Position einnehmen, wenn er neben einem Abbrechen-Button steht. Im `ConfirmDeleteDialog` erscheint er rechts neben dem Outline-Button.

---

## Weitere Varianten

TODO: Secondary Button (RESA Blau)
