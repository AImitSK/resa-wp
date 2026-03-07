# Empty States

> Leere Zustände für Listen und Tabellen

## Grundstruktur

Empty States werden angezeigt, wenn eine Liste oder Tabelle keine Einträge enthält. Sie sollen den Benutzer informieren und zur ersten Aktion animieren.

### Aufbau

```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                                              │
│       Headline (fett)                        │
│       Beschreibung (normal)                  │
│                                              │
│       [ + Button-Text ]                      │
│                                              │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

### Regeln

1. **Gestrichelte Box** — Dashed Border mit großen runden Ecken
2. **Kein Icon** — Empty States haben kein Icon über dem Text
3. **Headline** — Kurz, beschreibend, z.B. "Noch keine Webhooks"
4. **Beschreibung** — Erklärt den Nutzen, 1-2 Sätze
5. **Button** — OutlineButton mit Plus-Icon links

---

## Spezifikation

### Container

| Eigenschaft       | Wert                              |
| ----------------- | --------------------------------- |
| **Border**        | `2px dashed hsl(214.3 31.8% 78%)` |
| **Border Radius** | `16px`                            |
| **Padding**       | `48px 24px`                       |
| **Text Align**    | `center`                          |

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
	{/* Content */}
</div>
```

### Headline

```tsx
<p
	style={{
		fontSize: '16px',
		fontWeight: 500,
		color: '#1e303a',
		margin: '0 0 4px 0',
	}}
>
	{__('Noch keine Webhooks', 'resa')}
</p>
```

### Beschreibung

```tsx
<p
	style={{
		fontSize: '14px',
		color: '#1e303a',
		margin: '0 0 16px 0',
	}}
>
	{__('Senden Sie automatisch Lead-Daten an Zapier, Make oder Ihre eigene API.', 'resa')}
</p>
```

### Button

OutlineButton mit Plus-Icon (siehe `buttons.md`).

```tsx
<OutlineButton onClick={openCreateDialog}>
	<Plus style={{ width: '16px', height: '16px' }} />
	{__('Ersten Webhook erstellen', 'resa')}
</OutlineButton>
```

---

## Vollständiges Beispiel

```tsx
import { Plus } from 'lucide-react';
import { __ } from '@wordpress/i18n';

// OutlineButton Komponente (siehe buttons.md)

{
	(!items || items.length === 0) && (
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
			<p
				style={{
					fontSize: '16px',
					fontWeight: 500,
					color: '#1e303a',
					margin: '0 0 4px 0',
				}}
			>
				{__('Noch keine Webhooks', 'resa')}
			</p>
			<p
				style={{
					fontSize: '14px',
					color: '#1e303a',
					margin: '0 0 16px 0',
				}}
			>
				{__(
					'Senden Sie automatisch Lead-Daten an Zapier, Make oder Ihre eigene API.',
					'resa',
				)}
			</p>
			<OutlineButton onClick={openCreateDialog}>
				<Plus style={{ width: '16px', height: '16px' }} />
				{__('Ersten Webhook erstellen', 'resa')}
			</OutlineButton>
		</div>
	);
}
```

---

## Beispiele aus dem Codebase

### Webhooks

- **Headline:** "Noch keine Webhooks"
- **Beschreibung:** "Senden Sie automatisch Lead-Daten an Zapier, Make oder Ihre eigene API."
- **Button:** "Ersten Webhook erstellen"

### API-Keys

- **Headline:** "Noch keine API-Keys"
- **Beschreibung:** "API-Keys ermöglichen externen Systemen den Zugriff auf Ihre Lead-Daten."
- **Button:** "Ersten API-Key erstellen"

### Messenger

- **Headline:** "Noch keine Messenger-Verbindungen"
- **Beschreibung:** "Erhalten Sie sofortige Benachrichtigungen in Slack, Teams oder Discord."
- **Button:** "Erste Verbindung einrichten"

---

## Anti-Patterns

```tsx
// FALSCH: Icon über dem Text
<MessageSquare className="resa-h-12 resa-w-12 resa-mb-4" />
<p>Noch keine Webhooks</p>

// FALSCH: Keine gestrichelte Box
<div style={{ padding: '48px' }}>
	<p>Noch keine Webhooks</p>
</div>

// FALSCH: Primary Button statt Outline
<PrimaryButton>Webhook erstellen</PrimaryButton>

// FALSCH: Kein Plus-Icon im Button
<OutlineButton>Webhook erstellen</OutlineButton>

// RICHTIG
<div style={{ border: '2px dashed hsl(214.3 31.8% 78%)', borderRadius: '16px', ... }}>
	<p>Noch keine Webhooks</p>
	<p>Beschreibung...</p>
	<OutlineButton>
		<Plus />
		Ersten Webhook erstellen
	</OutlineButton>
</div>
```
