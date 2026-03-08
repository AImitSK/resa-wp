# Dialogs

> Dialog, AlertDialog, Sheet, Popover

Overlay-Komponenten fuer modale Inhalte, Seitenpanels und kontextuelle Informationen.

---

## Dialog

Standard-Modal fuer Formulare und Inhalte. Kann durch Klick auf den Overlay oder Escape geschlossen werden.

### Spezifikation

| Eigenschaft       | Wert                                    |
| ----------------- | --------------------------------------- |
| **Background**    | `white` (Overlay: `rgba(0, 0, 0, 0.8)`) |
| **Border Radius** | `12px` (sm: `rounded-lg`)               |
| **Max Width**     | `512px` (max-w-lg)                      |
| **Padding**       | `24px` (p-6)                            |
| **Gap**           | `16px` zwischen Elementen               |
| **Shadow**        | `shadow-lg`                             |
| **Z-Index**       | `50`                                    |

### Import

```tsx
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
```

### Struktur

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{__('Dialog-Titel', 'resa')}</DialogTitle>
			<DialogDescription>{__('Beschreibung des Dialogs.', 'resa')}</DialogDescription>
		</DialogHeader>

		{/* Inhalt */}
		<div className="resa-space-y-4 resa-py-4">{/* Formularfelder etc. */}</div>

		<DialogFooter>
			<OutlineButton onClick={() => setIsOpen(false)}>
				{__('Abbrechen', 'resa')}
			</OutlineButton>
			<PrimaryButton onClick={handleSave}>{__('Speichern', 'resa')}</PrimaryButton>
		</DialogFooter>
	</DialogContent>
</Dialog>
```

### Beispiel: Edit-Dialog mit Formular

```tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { __ } from '@wordpress/i18n';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const inputStyles: React.CSSProperties = {
	height: '36px',
	padding: '0 12px',
	fontSize: '14px',
	border: '1px solid hsl(214.3 31.8% 78%)',
	borderRadius: '6px',
	backgroundColor: 'white',
};

function EditWebhookDialog({ webhook, open, onOpenChange, onSave }) {
	const form = useForm({
		resolver: zodResolver(webhookSchema),
		defaultValues: {
			name: webhook?.name ?? '',
			url: webhook?.url ?? '',
		},
		mode: 'onChange',
	});

	// Reset form when dialog opens
	useEffect(() => {
		if (open && webhook) {
			form.reset({
				name: webhook.name,
				url: webhook.url,
			});
		}
	}, [open, webhook, form]);

	const handleClose = () => {
		onOpenChange(false);
		form.reset();
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent
				style={{
					backgroundColor: 'white',
					borderRadius: '12px',
					padding: '24px',
					maxWidth: '512px',
				}}
			>
				<DialogHeader>
					<DialogTitle
						style={{
							fontSize: '18px',
							fontWeight: 600,
							color: '#1e303a',
							margin: 0,
						}}
					>
						{__('Webhook bearbeiten', 'resa')}
					</DialogTitle>
				</DialogHeader>

				<div className="resa-space-y-4 resa-py-4">
					<div className="resa-space-y-2">
						<Label htmlFor="webhook-name">{__('Name', 'resa')}</Label>
						<Input id="webhook-name" {...form.register('name')} style={inputStyles} />
						{form.formState.errors.name && (
							<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>
								{form.formState.errors.name.message}
							</p>
						)}
					</div>

					<div className="resa-space-y-2">
						<Label htmlFor="webhook-url">{__('URL', 'resa')}</Label>
						<Input
							id="webhook-url"
							type="url"
							{...form.register('url')}
							style={inputStyles}
						/>
					</div>
				</div>

				<DialogFooter style={{ gap: '8px' }}>
					<Button
						variant="outline"
						size="sm"
						onClick={handleClose}
						style={{
							backgroundColor: 'white',
							color: '#1e303a',
							border: '1px solid hsl(214.3 31.8% 78%)',
						}}
					>
						{__('Abbrechen', 'resa')}
					</Button>
					<Button
						size="sm"
						onClick={form.handleSubmit(onSave)}
						style={{
							backgroundColor: '#a9e43f',
							color: '#1e303a',
							border: 'none',
						}}
					>
						{__('Speichern', 'resa')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
```

### Verwendungsfaelle

- **Create/Edit-Formulare**: Webhooks, API-Keys, Locations
- **Einstellungen bearbeiten**: Schnelle Aenderungen ohne Seitenwechsel
- **Test-Aktionen**: Test-Mail senden, Webhook testen
- **Informationen anzeigen**: API-Key nach Erstellung (mit Kopier-Funktion)

---

## AlertDialog

Bestaetigungsdialog fuer kritische Aktionen. Kann **nicht** durch Klick auf den Overlay geschlossen werden.

### Unterschied zu Dialog

| Eigenschaft                    | Dialog                 | AlertDialog               |
| ------------------------------ | ---------------------- | ------------------------- |
| Schliessen durch Overlay-Klick | Ja                     | Nein                      |
| Schliessen durch Escape        | Ja                     | Ja                        |
| Close-X Button                 | Ja (automatisch)       | Nein                      |
| Verwendung                     | Edit-Formulare, Modals | Bestaetigungen, Warnungen |

### Spezifikation

Identisch zu Dialog, aber ohne Close-Button und ohne Overlay-Click-to-Close.

### Import

```tsx
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

### ConfirmDeleteDialog (Empfohlen)

Fuer Loeschaktionen die vorgefertigte `ConfirmDeleteDialog`-Komponente verwenden:

```tsx
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';

<ConfirmDeleteDialog
	open={deleteDialogOpen}
	onOpenChange={setDeleteDialogOpen}
	title={__('Webhook loeschen?', 'resa')}
	description={__('Der Webhook wird unwiderruflich geloescht.', 'resa')}
	onConfirm={handleDelete}
	isLoading={deleteMutation.isPending}
	itemName={webhookToDelete?.name}
/>;
```

Siehe: [Bestaetigungsdialoge](/docs/design-system/patterns/confirm-dialogs.md)

---

## Sheet

Seitenpanel das von einer Bildschirmseite hereinslided. Fuer umfangreichere Inhalte oder Formulare.

### Spezifikation

| Eigenschaft            | Wert                                    |
| ---------------------- | --------------------------------------- |
| **Background**         | `white` (Overlay: `rgba(0, 0, 0, 0.8)`) |
| **Padding**            | `24px` (p-6)                            |
| **Width** (right/left) | `75%` (Mobile), `max-w-sm` (Desktop)    |
| **Shadow**             | `shadow-lg`                             |
| **Z-Index**            | `50`                                    |
| **Animation**          | Slide-in/out (500ms open, 300ms close)  |

### Varianten

| Side     | Beschreibung                          |
| -------- | ------------------------------------- |
| `right`  | Standard, von rechts (Detail-Ansicht) |
| `left`   | Von links (Navigation, Sidebar)       |
| `top`    | Von oben (Banner, Notifications)      |
| `bottom` | Von unten (Mobile Actions)            |

### Import

```tsx
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
```

### Beispiel: Detail-Panel

```tsx
function LeadDetailSheet({ lead, open, onOpenChange }) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				style={{
					backgroundColor: 'white',
					padding: '24px',
				}}
			>
				<SheetHeader>
					<SheetTitle
						style={{
							fontSize: '18px',
							fontWeight: 600,
							color: '#1e303a',
						}}
					>
						{lead.firstName} {lead.lastName}
					</SheetTitle>
					<SheetDescription
						style={{
							fontSize: '14px',
							color: 'hsl(215.4 16.3% 46.9%)',
						}}
					>
						{lead.email}
					</SheetDescription>
				</SheetHeader>

				<div style={{ marginTop: '24px' }}>{/* Lead-Details */}</div>

				<SheetFooter style={{ marginTop: '24px' }}>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						style={{
							backgroundColor: 'white',
							color: '#1e303a',
							border: '1px solid hsl(214.3 31.8% 78%)',
						}}
					>
						{__('Schliessen', 'resa')}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
```

### Verwendungsfaelle

- **Detail-Ansichten**: Lead-Details, Location-Details
- **Erweiterte Filter**: Filter-Panel fuer Tabellen
- **Mobile Navigation**: Hamburger-Menue
- **Umfangreiche Formulare**: Wenn Dialog zu klein waere

---

## Popover

Kontextuelle Informationen oder kleine Formulare, die an ein Element angeheftet sind.

### Spezifikation

| Eigenschaft       | Wert                                |
| ----------------- | ----------------------------------- |
| **Background**    | `var(--popover)` (typisch: `white`) |
| **Border**        | `1px solid hsl(214.3 31.8% 91.4%)`  |
| **Border Radius** | `8px` (rounded-md)                  |
| **Padding**       | `16px` (p-4)                        |
| **Width**         | `288px` (w-72) Standard             |
| **Shadow**        | `shadow-md`                         |
| **Z-Index**       | `50`                                |
| **Side Offset**   | `4px`                               |

### Import

```tsx
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
```

### Beispiel: Date Range Picker

```tsx
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

function DateRangePicker({ dateRange, onDateRangeChange }) {
	const [open, setOpen] = useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '8px',
						height: '32px',
						padding: '0 12px',
						fontSize: '13px',
						fontWeight: 500,
						borderRadius: '6px',
						border: '1px solid #e8e8e8',
						backgroundColor: 'white',
						boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
						color: '#1e303a',
						cursor: 'pointer',
					}}
				>
					<CalendarIcon style={{ width: '16px', height: '16px' }} />
					{dateRange?.from
						? format(dateRange.from, 'dd.MM.yyyy', { locale: de })
						: __('Zeitraum waehlen', 'resa')}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align="start"
				style={{
					backgroundColor: 'white',
					width: 'auto',
					maxWidth: 'none',
					border: '1px solid hsl(214.3 31.8% 91.4%)',
					boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
					borderRadius: '8px',
					padding: '0',
				}}
			>
				<div style={{ display: 'flex' }}>
					{/* Presets Sidebar */}
					<div
						style={{
							borderRight: '1px solid hsl(214.3 31.8% 91.4%)',
							padding: '8px 0',
							minWidth: '160px',
						}}
					>
						{TIME_RANGE_OPTIONS.map((option) => (
							<button
								key={option.value}
								onClick={() => handlePresetSelect(option.value)}
								style={{
									display: 'block',
									width: '100%',
									padding: '8px 16px',
									fontSize: '13px',
									textAlign: 'left',
									border: 'none',
									backgroundColor: isSelected
										? 'hsl(210 40% 96.1%)'
										: 'transparent',
									color: isSelected ? '#1e303a' : 'hsl(215.4 16.3% 46.9%)',
									fontWeight: isSelected ? 500 : 400,
									cursor: 'pointer',
								}}
							>
								{option.label}
							</button>
						))}
					</div>

					{/* Calendar */}
					<div style={{ padding: '8px' }}>
						<Calendar
							mode="range"
							selected={dateRange}
							onSelect={onDateRangeChange}
							numberOfMonths={2}
							locale={de}
						/>
					</div>
				</div>

				{/* Footer */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '8px',
						padding: '12px 16px',
						borderTop: '1px solid hsl(214.3 31.8% 91.4%)',
					}}
				>
					<Button variant="outline" size="sm" onClick={() => setOpen(false)}>
						{__('Abbrechen', 'resa')}
					</Button>
					<Button
						size="sm"
						onClick={handleApply}
						style={{ backgroundColor: '#a9e43f', color: '#1e303a' }}
					>
						{__('Anwenden', 'resa')}
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
}
```

### Verwendungsfaelle

- **Date Picker**: Kalender-Auswahl
- **Color Picker**: Farbauswahl
- **Quick Actions**: Kleine Aktions-Menues
- **Tooltips mit Interaktion**: Wenn Tooltip nicht reicht

---

## Tooltip

> **Hinweis:** Aktuell keine dedizierte Tooltip-Komponente vorhanden. Bei Bedarf den `title`-Attribut oder Popover mit `onHover` verwenden.

### Workaround mit title-Attribut

```tsx
<Button title={__('Kopieren', 'resa')} onClick={handleCopy}>
	<Copy className="resa-h-4 resa-w-4" />
</Button>
```

### Workaround mit Popover (bei Bedarf)

```tsx
// Fuer komplexere Tooltips kann Popover verwendet werden
<Popover>
	<PopoverTrigger asChild>
		<Button variant="ghost">
			<HelpCircle className="resa-h-4 resa-w-4" />
		</Button>
	</PopoverTrigger>
	<PopoverContent style={{ width: '200px', padding: '8px 12px' }}>
		<p style={{ fontSize: '13px', color: '#1e303a', margin: 0 }}>
			{__('Hilfetext hier...', 'resa')}
		</p>
	</PopoverContent>
</Popover>
```

---

## Best Practices

### Wann welche Komponente verwenden

| Anwendungsfall                  | Komponente                        |
| ------------------------------- | --------------------------------- |
| Edit-Formular (schnelle Aktion) | Dialog                            |
| Loeschbestaetigung              | AlertDialog / ConfirmDeleteDialog |
| Detail-Ansicht (umfangreich)    | Sheet                             |
| Date Picker / Filter            | Popover                           |
| Kurzer Hilfetext                | `title`-Attribut                  |

### Dialog-Inhalte

1. **Titel**: Kurz und praegnant, Aktion beschreiben
2. **Description**: Optional, nur wenn noetig
3. **Formular**: Mit Zod + React Hook Form validieren
4. **Footer**: Abbrechen (links), Primaer-Aktion (rechts)

### Inline Styles

Alle Dialog-Komponenten erfordern Inline-Styles fuer konsistentes Styling im WordPress Admin:

```tsx
<DialogContent
	style={{
		backgroundColor: 'white',
		borderRadius: '12px',
		padding: '24px',
		maxWidth: '420px', // Anpassen je nach Inhalt
	}}
>
```

### Keyboard Navigation

- **Escape**: Schliesst alle Dialoge/Sheets/Popovers
- **Tab**: Fokus innerhalb des Dialogs halten
- **Enter**: Primaer-Aktion ausfuehren (bei Formularen)

---

## Checkliste

- [ ] Richtige Komponente fuer den Anwendungsfall gewaehlt
- [ ] Inline-Styles fuer WordPress Admin Kompatibilitaet
- [ ] `open` und `onOpenChange` korrekt verbunden
- [ ] Alle Strings mit `__()` wrappen
- [ ] Loading-States bei async Aktionen
- [ ] Formular-Reset bei Dialog-Schliessung
- [ ] Destruktive Aktionen mit AlertDialog/ConfirmDeleteDialog
