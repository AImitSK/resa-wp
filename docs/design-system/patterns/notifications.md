# Notifications (Toast)

> Einheitliche Benachrichtigungen für Erfolgs- und Fehlermeldungen im Admin-Bereich.

## Toast-System

**Library:** [Sonner](https://sonner.emilkowal.ski/) — leichtgewichtige Toast-Notifications
**Position:** `bottom-right` (unten rechts, verschiebt keinen Content)
**Duration:** 4 Sekunden (auto-dismiss)

### Import

```tsx
import { toast } from '@/admin/lib/toast';
import { __ } from '@wordpress/i18n';
```

### Verwendung

```tsx
// ✅ Erfolg
toast.success(__('Einstellungen gespeichert.', 'resa'));

// ❌ Fehler
toast.error(__('Fehler beim Speichern.', 'resa'));

// ⚠️ Warnung
toast.warning(__('Verbindung instabil.', 'resa'));

// ℹ️ Info
toast.info(__('Neue Version verfügbar.', 'resa'));
```

### Mit Beschreibung

```tsx
toast.success(__('Webhook erstellt.', 'resa'), {
	description: __('Der Webhook wurde erfolgreich angelegt.', 'resa'),
});
```

### Promise-basiert (Loading → Success/Error)

```tsx
toast.promise(saveMutation.mutateAsync(data), {
	loading: __('Speichert...', 'resa'),
	success: __('Gespeichert.', 'resa'),
	error: __('Fehler beim Speichern.', 'resa'),
});
```

---

## Varianten-Styling

| Variante  | Hintergrund | Border              | Textfarbe |
| --------- | ----------- | ------------------- | --------- |
| `success` | `#f0fdf4`   | `1px solid #a9e43f` | `#1e303a` |
| `error`   | `#fef2f2`   | `1px solid #ef4444` | `#991b1b` |
| `warning` | `#fffbeb`   | `1px solid #f59e0b` | `#92400e` |
| `info`    | `#eff6ff`   | `1px solid #3b82f6` | `#1e40af` |

---

## Konventionen

### Wann Toast verwenden

| Aktion                      | Toast-Typ | Beispiel-Text                           |
| --------------------------- | --------- | --------------------------------------- |
| Erfolgreiches Speichern     | `success` | `'Einstellungen gespeichert.'`          |
| Erfolgreiches Erstellen     | `success` | `'Webhook erstellt.'`                   |
| Erfolgreiches Löschen       | `success` | `'API-Schlüssel gelöscht.'`             |
| Speicherfehler              | `error`   | `'Fehler beim Speichern.'`              |
| Verbindungsfehler           | `error`   | `'Verbindung fehlgeschlagen.'`          |
| Validierungsfehler (global) | `error`   | `'Bitte alle Pflichtfelder ausfüllen.'` |
| Test erfolgreich            | `success` | `'Test-Mail gesendet.'`                 |
| Limit erreicht              | `warning` | `'Maximal 5 Webhooks erlaubt.'`         |

### Wann KEIN Toast

- **Validierungsfehler pro Feld** → Inline-Fehlermeldung unter dem Input
- **Wichtige Warnungen** → Alert-Komponente (z.B. "API-Key nur einmal sichtbar")
- **Loading-States** → Spinner im Button oder `LoadingState`-Komponente
- **Bestätigungen vor Aktion** → Dialog mit Confirm/Cancel

---

## Migration von Alert/Inline-Feedback

**Nicht mehr verwenden (für temporäre Meldungen):**

```tsx
// ❌ ALT: Inline-Feedback mit useState
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
	null,
);
setTimeout(() => setFeedback(null), 5000);

// ❌ ALT: Alert für Erfolgs-/Fehlermeldungen
{
	feedback && (
		<Alert variant={feedback.type === 'error' ? 'destructive' : 'default'}>
			<AlertDescription>{feedback.message}</AlertDescription>
		</Alert>
	);
}
```

**Stattdessen:**

```tsx
// ✅ NEU: Toast
import { toast } from '@/admin/lib/toast';

try {
	await saveMutation.mutateAsync(data);
	toast.success(__('Gespeichert.', 'resa'));
} catch {
	toast.error(__('Fehler beim Speichern.', 'resa'));
}
```

---

## Setup

Der `<Toaster />` ist bereits in `App.tsx` eingebunden:

```tsx
// src/admin/App.tsx
import { Toaster } from './components/Toaster';

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			{/* ... Routes ... */}
			<Toaster />
		</QueryClientProvider>
	);
}
```

---

## Checkliste

- [ ] `toast` aus `@/admin/lib/toast` importieren
- [ ] Alle User-facing Strings mit `__()` wrappen
- [ ] Passende Variante wählen (success/error/warning/info)
- [ ] Alte `feedback`-States und Alert-Meldungen entfernen
- [ ] Kurze, prägnante Nachrichten (max 1 Satz)
