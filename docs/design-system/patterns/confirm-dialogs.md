# Bestätigungsdialoge

> Einheitliche Bestätigungsdialoge für destruktive Aktionen im Admin-Bereich.

## Wann Bestätigung verwenden

| Aktion                           | Bestätigung | Grund                     |
| -------------------------------- | ----------- | ------------------------- |
| Löschen (Webhook, API-Key, Lead) | Ja          | Irreversibel              |
| Template zurücksetzen            | Ja          | Änderungen gehen verloren |
| Bulk-Löschen                     | Ja          | Mehrere Items betroffen   |
| Deaktivieren/Toggle              | Nein        | Einfach rückgängig        |
| Speichern                        | Nein        | Gewünschte Aktion         |

---

## ConfirmDeleteDialog

**Komponente:** `ConfirmDeleteDialog` aus `@/admin/components/ConfirmDeleteDialog`

Verwendet `AlertDialog` (verhindert Schließen durch Klick außerhalb).

### Import

```tsx
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
```

### Verwendung

```tsx
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
const deleteMutation = useDeleteItem();

const handleDeleteClick = (item: Item) => {
	setItemToDelete(item);
	setDeleteDialogOpen(true);
};

const handleConfirmDelete = async () => {
	if (!itemToDelete) return;
	try {
		await deleteMutation.mutateAsync(itemToDelete.id);
		toast.success(__('Erfolgreich gelöscht.', 'resa'));
		setDeleteDialogOpen(false);
	} catch {
		toast.error(__('Fehler beim Löschen.', 'resa'));
	}
};

return (
	<>
		{/* Lösch-Button irgendwo in der UI */}
		<Button onClick={() => handleDeleteClick(item)}>
			<Trash2 />
			{__('Löschen', 'resa')}
		</Button>

		{/* Dialog */}
		<ConfirmDeleteDialog
			open={deleteDialogOpen}
			onOpenChange={setDeleteDialogOpen}
			title={__('Webhook löschen?', 'resa')}
			description={__('Der Webhook wird unwiderruflich gelöscht.', 'resa')}
			onConfirm={handleConfirmDelete}
			isLoading={deleteMutation.isPending}
			itemName={itemToDelete?.name}
		/>
	</>
);
```

### Props

| Prop           | Typ                           | Default       | Beschreibung                           |
| -------------- | ----------------------------- | ------------- | -------------------------------------- |
| `open`         | `boolean`                     | —             | Steuert Sichtbarkeit                   |
| `onOpenChange` | `(open: boolean) => void`     | —             | Callback bei Änderung                  |
| `title`        | `string`                      | —             | Dialog-Titel                           |
| `description`  | `string`                      | —             | Warnungstext                           |
| `onConfirm`    | `() => void \| Promise<void>` | —             | Callback bei Bestätigung               |
| `isLoading`    | `boolean`                     | `false`       | Zeigt Spinner im Button                |
| `confirmText`  | `string`                      | `'Löschen'`   | Text des Bestätigungs-Buttons          |
| `cancelText`   | `string`                      | `'Abbrechen'` | Text des Abbrechen-Buttons             |
| `itemName`     | `string`                      | —             | Optional: Name des zu löschenden Items |

---

## Styling

Der Dialog verwendet RESA Design System Inline-Styles:

- **Hintergrund:** Weiß
- **Border-Radius:** 12px
- **Max-Width:** 420px
- **Abbrechen-Button:** Outline-Style
- **Löschen-Button:** Destructive (Rot)

---

## Text-Konventionen

### Titel (Frage-Form)

- `'Webhook löschen?'`
- `'API-Schlüssel löschen?'`
- `'Lead unwiderruflich löschen?'`
- `'Alle ausgewählten Leads löschen?'`

### Beschreibung (Konsequenz erklären)

- `'Der Webhook wird unwiderruflich gelöscht und kann nicht wiederhergestellt werden.'`
- `'Der API-Schlüssel verliert sofort seine Gültigkeit.'`
- `'Diese Aktion kann nicht rückgängig gemacht werden.'`

### Mit Item-Name

Wenn `itemName` übergeben wird, erscheint dieser hervorgehoben:

```
┌─────────────────────────────────────┐
│ Webhook löschen?                    │
│                                     │
│ Der Webhook wird unwiderruflich     │
│ gelöscht.                           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Slack Lead-Benachrichtigung    │ │
│ └─────────────────────────────────┘ │
│                                     │
│          [Abbrechen] [Löschen]      │
└─────────────────────────────────────┘
```

---

## Unterschied Dialog vs. AlertDialog

| Eigenschaft                   | Dialog                 | AlertDialog              |
| ----------------------------- | ---------------------- | ------------------------ |
| Schließen durch Overlay-Klick | Ja                     | Nein                     |
| Schließen durch Escape        | Ja                     | Ja                       |
| Verwendung                    | Edit-Formulare, Modals | Bestätigungen, Warnungen |
| Close-X Button                | Ja                     | Nein                     |

**Regel:** Für destruktive Aktionen immer `AlertDialog` (bzw. `ConfirmDeleteDialog`) verwenden.

---

## Checkliste

- [ ] `ConfirmDeleteDialog` importieren
- [ ] State für `deleteDialogOpen` und `itemToDelete`
- [ ] `handleDeleteClick` setzt Item und öffnet Dialog
- [ ] `handleConfirmDelete` führt Löschung durch + Toast
- [ ] `isLoading` an Mutation-Status binden
- [ ] Alle Strings mit `__()` wrappen
