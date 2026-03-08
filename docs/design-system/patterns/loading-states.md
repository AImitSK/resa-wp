# Loading States

> Einheitliche Loading-, Error- und Empty-State-Patterns für den Admin-Bereich.

## Loading State

**Komponente:** `LoadingState` aus `@/admin/components/LoadingState`

Verwendet **Spinner + Text** als einheitliches Pattern. Keine Skeletons - diese sind aufwändiger zu pflegen und inkonsistent.

### Verwendung

```tsx
import { LoadingState } from '../components/LoadingState';

// Standard (48px padding)
if (isLoading) {
	return <LoadingState message={__('Lade Einstellungen...', 'resa')} />;
}

// Kompakt (24px padding) - für kleinere Bereiche
if (isLoading) {
	return <LoadingState message={__('Lade...', 'resa')} size="compact" />;
}
```

### Props

| Prop      | Typ                     | Default             | Beschreibung                     |
| --------- | ----------------------- | ------------------- | -------------------------------- |
| `message` | `string`                | `'Wird geladen...'` | Anzeigetext neben dem Spinner    |
| `size`    | `'normal' \| 'compact'` | `'normal'`          | Vertikales Padding (48px / 24px) |

### Styling

```tsx
// Container
{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '48px 0',  // oder 24px für compact
}

// Text
{
    fontSize: '14px',
    color: 'hsl(215.4 16.3% 46.9%)',  // muted-foreground
}

// Spinner
{
    width: '20px',
    height: '20px',
}
```

### Text-Konventionen

| Kontext         | Text                                 |
| --------------- | ------------------------------------ |
| Settings-Tab    | `'Lade {Tab-Name}-Einstellungen...'` |
| Liste/Übersicht | `'Lade {Ressource}...'`              |
| Einzelnes Item  | `'Lade {Item-Typ}...'`               |
| Generisch       | `'Wird geladen...'`                  |

**Beispiele:**

- `'Lade Tracking-Einstellungen...'`
- `'Lade Vorlagen...'`
- `'Lade Team...'`
- `'Module werden geladen...'`

---

## Error State

Für Fehlerzustände wird die `Alert`-Komponente mit `variant="destructive"` verwendet.

### Verwendung

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

if (error) {
	return (
		<Alert variant="destructive">
			<AlertTriangle style={{ width: '16px', height: '16px' }} />
			<AlertTitle>{__('Fehler', 'resa')}</AlertTitle>
			<AlertDescription>
				{error.message || __('Ein Fehler ist aufgetreten.', 'resa')}
			</AlertDescription>
		</Alert>
	);
}
```

---

## Empty State

Siehe [Empty States](./empty-states.md) für das vollständige Pattern.

**Kurzfassung:**

- Dashed Border (16px radius)
- Kein Icon
- Titel + Beschreibung zentriert
- `OutlineButton` mit Plus-Icon für Aktion

```tsx
<div
	style={{
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '48px 24px',
		textAlign: 'center',
		border: '2px dashed hsl(214.3 31.8% 78%)',
		borderRadius: '16px',
	}}
>
	<p style={{ fontSize: '16px', fontWeight: 500, color: '#1e303a', margin: '0 0 4px 0' }}>
		{__('Noch keine Einträge', 'resa')}
	</p>
	<p style={{ fontSize: '14px', color: 'hsl(215.4 16.3% 46.9%)', margin: '0 0 16px 0' }}>
		{__('Erstelle deinen ersten Eintrag.', 'resa')}
	</p>
	<OutlineButton onClick={onCreate}>
		<Plus style={{ width: '16px', height: '16px' }} />
		{__('Eintrag erstellen', 'resa')}
	</OutlineButton>
</div>
```

---

## Migration von Skeleton

**Nicht mehr verwenden:**

```tsx
// ALT - nicht mehr verwenden
<Skeleton className="resa-h-6 resa-w-32 resa-mb-4" />
<Skeleton className="resa-h-10 resa-w-full" />
```

**Stattdessen:**

```tsx
// NEU - einheitlich
<LoadingState message={__('Lade Daten...', 'resa')} />
```

### Gründe für Spinner statt Skeleton

1. **Einfacher** - Kein Layout-Mockup pro Seite nötig
2. **Konsistenter** - Ein Pattern für alle Kontexte
3. **Wartbarer** - Eine zentrale Komponente
4. **Design-System-konform** - Inline-Styles wie alle anderen Komponenten

---

## Inline Loading (in Buttons)

Für Loading-States innerhalb von Buttons:

```tsx
<PrimaryButton onClick={handleSave} disabled={isSaving}>
	{isSaving && <Spinner style={{ width: '14px', height: '14px', marginRight: '8px' }} />}
	{__('Speichern', 'resa')}
</PrimaryButton>
```

---

## Checkliste

- [ ] `LoadingState`-Komponente importieren
- [ ] `isLoading`-Check am Anfang der Komponente
- [ ] Passende Message je nach Kontext
- [ ] Bei Buttons: Spinner inline + `disabled={isPending}`
