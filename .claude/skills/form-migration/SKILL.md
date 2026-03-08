---
name: form-migration
description: 'Admin-Formular auf Zod + React Hook Form migrieren'
user-invocable: true
argument-hint: '[Komponenten-Name, z.B. TrackingTab]'
---

# /form-migration — Admin-Formular Migration

Migriert eine Admin-Komponente von useState-basierter Formularlogik auf Zod + React Hook Form.

## Vorgehen

1. **Komponente analysieren:**
    - Lies die zu migrierende Komponente
    - Identifiziere alle Formularfelder (useState, updateField-Pattern)
    - Identifiziere den Submit-Handler und die Mutation
    - Prüfe `docs/refactoring/form-validation-migration.md` für Status

2. **Zod Schema erstellen:**
    - Erstelle `src/admin/schemas/{name}.ts`
    - Exportiere Schema + TypeScript-Typ via `z.infer<>`
    - Aktualisiere `src/admin/schemas/index.ts`

3. **Komponente migrieren:**
    - Imports aktualisieren (useForm, Controller, zodResolver)
    - useState durch useForm ersetzen
    - useEffect für Server-Daten-Sync
    - Felder auf register/Controller umstellen
    - Error-Display hinzufügen
    - Submit auf handleSubmit umstellen

4. **Build prüfen:**
    - `npm run build` ausführen
    - TypeScript-Fehler beheben

5. **Checkliste aktualisieren:**
    - `docs/refactoring/form-validation-migration.md` aktualisieren
    - Komponente als ✅ markieren

## Referenz-Migration

Siehe `src/admin/components/settings/GdprTab.tsx` als vollständiges Beispiel.

## Schema-Pattern

```typescript
// src/admin/schemas/{name}.ts
import { z } from 'zod';
import { __ } from '@wordpress/i18n';

export const {name}Schema = z.object({
	// String-Feld (required)
	fieldName: z
		.string()
		.min(1, __('Feldname ist erforderlich', 'resa')),

	// String-Feld mit optionaler URL
	url: z
		.string()
		.refine(
			(val) => val === '' || /^https?:\/\/.+/.test(val),
			__('Bitte eine gültige URL eingeben', 'resa'),
		),

	// Zahl-Feld (für Select mit parseInt)
	numericField: z.number().int().min(0),

	// Boolean (Switch/Checkbox)
	booleanField: z.boolean(),
});

export type {Name}FormData = z.infer<typeof {name}Schema>;
```

## Komponenten-Pattern

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { {name}Schema, type {Name}FormData } from '../../schemas/{name}';

export function {Name}Tab() {
	const { data: settings, isLoading } = use{Name}Settings();
	const saveMutation = useSave{Name}Settings();

	const defaults: {Name}FormData = {
		// Default-Werte
	};

	const form = useForm<{Name}FormData>({
		resolver: zodResolver({name}Schema),
		defaultValues: defaults,
	});

	// Server-Daten synchronisieren
	useEffect(() => {
		if (settings) {
			form.reset(settings);
		}
	}, [settings, form]);

	const onSubmit = (data: {Name}FormData) => {
		saveMutation.mutate(data, {
			onSuccess: () => {
				form.reset(data);
				toast.success(__('Gespeichert.', 'resa'));
			},
			onError: () => {
				toast.error(__('Fehler beim Speichern.', 'resa'));
			},
		});
	};

	if (isLoading) {
		return <LoadingState message={__('Lade...', 'resa')} />;
	}

	const { formState: { isDirty, errors } } = form;

	return (
		// JSX mit form.register, Controller, errors
	);
}
```

## Feld-Bindungen

### Input/Textarea (register)

```tsx
<Input
	{...form.register('fieldName')}
	style={{
		...inputStyles,
		borderColor: errors.fieldName ? '#ef4444' : undefined,
	}}
/>;
{
	errors.fieldName && (
		<p style={{ fontSize: '13px', color: '#ef4444', margin: 0 }}>{errors.fieldName.message}</p>
	);
}
```

### Select (Controller)

```tsx
<Controller
	name="numericField"
	control={form.control}
	render={({ field }) => (
		<select
			value={field.value}
			onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
			style={selectStyles}
		>
			{options.map((opt) => (
				<option key={opt.value} value={opt.value}>
					{opt.label}
				</option>
			))}
		</select>
	)}
/>
```

### Switch/Checkbox (Controller)

```tsx
<Controller
	name="booleanField"
	control={form.control}
	render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
/>
```

### Submit-Button

```tsx
<Button onClick={form.handleSubmit(onSubmit)} disabled={!isDirty || saveMutation.isPending}>
	{saveMutation.isPending && <Spinner />}
	{__('Speichern', 'resa')}
</Button>
```

## Zu migrierende Komponenten

Prüfe `docs/refactoring/form-validation-migration.md` für die vollständige Liste.

Verbleibend (Stand 2026-03-08):

- `TrackingTab.tsx` — trackingSettingsSchema
- `WebhooksTab.tsx` — webhookSchema
- `ApiKeysTab.tsx` — apiKeySchema
- `MessengerTab.tsx` — messengerSchema
- `PropstackTab.tsx` — propstackSettingsSchema
- `RecaptchaTab.tsx` — recaptchaSettingsSchema
- `SetupTab.tsx` — moduleSetupSchema
- `PdfTab.tsx` — pdfSettingsSchema
- `LocationValuesTab.tsx` — locationValuesSchema
- `TemplateEditor.tsx` — emailTemplateSchema
- `LocationEditor.tsx` — locationSchema
- `FactorEditor.tsx` — factorSchema
- `Settings.tsx` — generalSettingsSchema
- `PdfTemplates.tsx` — pdfTemplateSchema

## Hinweise

- Inline-Styles beibehalten (WP-Admin Kompatibilität)
- Alle User-facing Strings mit `__()` wrappen
- Error-Farbe: `#ef4444`
- Bei Select immer `parseInt()` für numerische Werte
- `form.reset(data)` nach erfolgreichem Save um isDirty zurückzusetzen
