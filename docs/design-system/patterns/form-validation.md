# Form Validation

> Zod + React Hook Form Integration für typsichere, einheitliche Formularvalidierung.

## Übersicht

RESA verwendet ein dreistufiges Validation-Pattern:

1. **Zod Schema** — Zentrale Validierungsregeln + TypeScript-Typen
2. **React Hook Form + zodResolver** — Automatische Validierung zur Laufzeit
3. **shadcn/ui FormField** — Einheitliche Fehleranzeige

---

## Zod Schema Pattern

### Grundstruktur

Schemas liegen in `src/admin/schemas/` oder direkt bei der Komponente.

```typescript
// schemas/location.ts
import { z } from 'zod';
import { __ } from '@wordpress/i18n';

export const locationSchema = z.object({
	name: z
		.string()
		.min(1, __('Name ist erforderlich', 'resa'))
		.max(100, __('Name darf maximal 100 Zeichen haben', 'resa')),

	slug: z
		.string()
		.min(1, __('Slug ist erforderlich', 'resa'))
		.regex(/^[a-z0-9-]+$/, __('Nur Kleinbuchstaben, Zahlen und Bindestriche', 'resa')),

	latitude: z.coerce
		.number()
		.min(-90, __('Breitengrad muss zwischen -90 und 90 liegen', 'resa'))
		.max(90, __('Breitengrad muss zwischen -90 und 90 liegen', 'resa')),

	longitude: z.coerce
		.number()
		.min(-180, __('Längengrad muss zwischen -180 und 180 liegen', 'resa'))
		.max(180, __('Längengrad muss zwischen -180 und 180 liegen', 'resa')),

	// Optional mit Default
	isActive: z.boolean().default(true),

	// Optional nullable
	description: z.string().nullable().optional(),
});

// TypeScript-Typ automatisch ableiten
export type LocationFormData = z.infer<typeof locationSchema>;
```

### Häufige Validierungen

```typescript
// Pflichtfeld
z.string().min(1, __('Pflichtfeld', 'resa'));

// E-Mail
z.string().email(__('Ungültige E-Mail-Adresse', 'resa'));

// URL
z.string().url(__('Ungültige URL', 'resa'));

// Telefon (DACH-Format)
z.string().regex(/^(\+49|0)[0-9\s/-]{6,}$/, __('Ungültige Telefonnummer', 'resa'));

// Zahl aus Input (string → number)
z.coerce.number().positive(__('Muss größer als 0 sein', 'resa'));

// Prozent (0-100)
z.coerce.number().min(0).max(100, __('Muss zwischen 0 und 100 liegen', 'resa'));

// Enum/Select
z.enum(['option1', 'option2'], {
	errorMap: () => ({ message: __('Bitte wählen Sie eine Option', 'resa') }),
});

// Array mit min. 1 Element
z.array(z.string()).min(1, __('Mindestens eine Auswahl erforderlich', 'resa'));

// Conditional (wenn Feld A gesetzt, dann Feld B required)
z.object({
	hasPhone: z.boolean(),
	phone: z.string(),
}).refine((data) => !data.hasPhone || data.phone.length > 0, {
	message: __('Telefonnummer erforderlich', 'resa'),
	path: ['phone'],
});
```

---

## React Hook Form Integration

### Setup mit zodResolver

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { locationSchema, type LocationFormData } from './schemas/location';

export function LocationEditor({ initialData, onSave }: Props) {
	const form = useForm<LocationFormData>({
		resolver: zodResolver(locationSchema),
		defaultValues: initialData ?? {
			name: '',
			slug: '',
			latitude: 52.52,
			longitude: 13.405,
			isActive: true,
		},
		mode: 'onChange', // Validierung bei jeder Eingabe (nicht erst bei Submit)
	});

	const onSubmit = async (data: LocationFormData) => {
		// data ist bereits validiert und typsicher
		await onSave(data);
	};

	return (
		<Form {...form}>
			{/* noValidate deaktiviert Browser-Validierung (nur Zod) */}
			<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
				{/* FormFields hier */}
			</form>
		</Form>
	);
}
```

### Wichtige Optionen

| Option       | Wert         | Beschreibung                                        |
| ------------ | ------------ | --------------------------------------------------- |
| `mode`       | `'onChange'` | Validierung bei jeder Eingabe (sofortiges Feedback) |
| `noValidate` | `true`       | Deaktiviert Browser-Tooltips, nur Zod-Validierung   |

````

### Form-Kontext für verschachtelte Komponenten

```typescript
import { useFormContext } from 'react-hook-form';

function NestedComponent() {
	const {
		control,
		formState: { errors },
	} = useFormContext<LocationFormData>();
	// Zugriff auf das übergeordnete Formular
}
````

---

## Error Display mit shadcn/ui

### FormField Pattern

```tsx
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

<FormField
	control={form.control}
	name="name"
	render={({ field }) => (
		<FormItem>
			<FormLabel>{__('Name', 'resa')}</FormLabel>
			<FormControl>
				<Input placeholder={__('z.B. Berlin Mitte', 'resa')} {...field} />
			</FormControl>
			<FormDescription>{__('Der angezeigte Name des Standorts.', 'resa')}</FormDescription>
			<FormMessage /> {/* Zeigt Zod-Fehler automatisch */}
		</FormItem>
	)}
/>;
```

### Komponenten-Mapping

| Feldtyp  | shadcn/ui Komponente      |
| -------- | ------------------------- |
| Text     | `<Input />`               |
| Textarea | `<Textarea />`            |
| Zahl     | `<Input type="number" />` |
| Select   | `<Select />`              |
| Checkbox | `<Checkbox />`            |
| Switch   | `<Switch />`              |
| Radio    | `<RadioGroup />`          |

### Select-Beispiel

```tsx
<FormField
	control={form.control}
	name="regionType"
	render={({ field }) => (
		<FormItem>
			<FormLabel>{__('Regionstyp', 'resa')}</FormLabel>
			<Select onValueChange={field.onChange} defaultValue={field.value}>
				<FormControl>
					<SelectTrigger>
						<SelectValue placeholder={__('Auswählen...', 'resa')} />
					</SelectTrigger>
				</FormControl>
				<SelectContent>
					<SelectItem value="city">{__('Stadt', 'resa')}</SelectItem>
					<SelectItem value="rural">{__('Ländlich', 'resa')}</SelectItem>
				</SelectContent>
			</Select>
			<FormMessage />
		</FormItem>
	)}
/>
```

### Checkbox-Beispiel

```tsx
<FormField
	control={form.control}
	name="isActive"
	render={({ field }) => (
		<FormItem className="resa-flex resa-items-center resa-gap-2">
			<FormControl>
				<Checkbox checked={field.value} onCheckedChange={field.onChange} />
			</FormControl>
			<FormLabel className="resa-font-normal">{__('Standort ist aktiv', 'resa')}</FormLabel>
			<FormMessage />
		</FormItem>
	)}
/>
```

---

## Submission States

### Grundpattern mit Mutation

```tsx
const saveMutation = useMutation({
	mutationFn: (data: LocationFormData) => api.post('/locations', data),
	onSuccess: () => {
		toast.success(__('Standort gespeichert', 'resa'));
		form.reset();
	},
	onError: (error) => {
		// Server-Fehler anzeigen
		if (error.response?.data?.errors) {
			// Feld-spezifische Fehler vom Server
			Object.entries(error.response.data.errors).forEach(([field, message]) => {
				form.setError(field as keyof LocationFormData, {
					type: 'server',
					message: message as string,
				});
			});
		} else {
			toast.error(__('Fehler beim Speichern', 'resa'));
		}
	},
});

const onSubmit = (data: LocationFormData) => {
	saveMutation.mutate(data);
};
```

### Submit-Button mit Loading-State

```tsx
<Button type="submit" disabled={saveMutation.isPending}>
	{saveMutation.isPending && (
		<Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />
	)}
	{saveMutation.isPending ? __('Speichert...', 'resa') : __('Speichern', 'resa')}
</Button>
```

### Formular während Submission deaktivieren

```tsx
<fieldset disabled={saveMutation.isPending}>
	{/* Alle Felder werden automatisch deaktiviert */}
</fieldset>
```

---

## Inline-Styles für WP-Admin

Da Tailwind-Klassen im WP-Admin nicht immer funktionieren, hier das Inline-Style-Pattern:

```tsx
<FormField
	control={form.control}
	name="name"
	render={({ field, fieldState }) => (
		<div style={{ marginBottom: '16px' }}>
			<label
				htmlFor="name"
				style={{
					display: 'block',
					fontSize: '14px',
					fontWeight: 500,
					color: '#1e303a',
					marginBottom: '6px',
				}}
			>
				{__('Name', 'resa')}
			</label>
			<Input
				id="name"
				{...field}
				style={{
					borderColor: fieldState.error ? '#ef4444' : undefined,
				}}
			/>
			{fieldState.error && (
				<p
					style={{
						fontSize: '13px',
						color: '#ef4444',
						marginTop: '4px',
					}}
				>
					{fieldState.error.message}
				</p>
			)}
		</div>
	)}
/>
```

---

## Vollständiges Beispiel

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { useMutation } from '@tanstack/react-query';

import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/admin/lib/toast';

// 1. Schema definieren
const webhookSchema = z.object({
	name: z.string().min(1, __('Name ist erforderlich', 'resa')),
	url: z.string().url(__('Ungültige URL', 'resa')),
	isActive: z.boolean().default(true),
});

type WebhookFormData = z.infer<typeof webhookSchema>;

// 2. Komponente
export function WebhookForm({ onSuccess }: { onSuccess: () => void }) {
	const form = useForm<WebhookFormData>({
		resolver: zodResolver(webhookSchema),
		defaultValues: {
			name: '',
			url: '',
			isActive: true,
		},
	});

	const saveMutation = useMutation({
		mutationFn: (data: WebhookFormData) => api.post('/webhooks', data),
		onSuccess: () => {
			toast.success(__('Webhook erstellt', 'resa'));
			onSuccess();
		},
		onError: () => {
			toast.error(__('Fehler beim Erstellen', 'resa'));
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{__('Name', 'resa')}</FormLabel>
							<FormControl>
								<Input {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="url"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{__('URL', 'resa')}</FormLabel>
							<FormControl>
								<Input type="url" {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={saveMutation.isPending}>
					{saveMutation.isPending && <Spinner />}
					{__('Speichern', 'resa')}
				</Button>
			</form>
		</Form>
	);
}
```

---

## Checkliste

- [ ] Zod Schema mit i18n-Fehlermeldungen definiert
- [ ] TypeScript-Typ via `z.infer<>` abgeleitet
- [ ] `useForm` mit `zodResolver` initialisiert
- [ ] `defaultValues` für alle Felder gesetzt
- [ ] `FormField` + `FormMessage` für Fehleranzeige
- [ ] Mutation mit `onSuccess`/`onError` Toast
- [ ] Submit-Button zeigt Loading-State
- [ ] Server-Fehler werden auf Felder gemappt
