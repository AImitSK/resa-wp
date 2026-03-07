# Feedback

> Alert, Toast, Spinner, Progress, Badge

## Badge

Kleine Label zur Kennzeichnung von Status, Tier oder Kategorien.

### Tier Badges

Für Plan-Anzeige (Free/Premium):

| Tier        | Background            | Text Color            |
| ----------- | --------------------- | --------------------- |
| **Free**    | `#1e303a` (RESA Blau) | `white`               |
| **Premium** | `#a9e43f` (RESA Grün) | `#1e303a` (RESA Blau) |

#### Code (Inline CSS)

```tsx
<Badge
	style={{
		backgroundColor: isPremium ? '#a9e43f' : '#1e303a',
		color: isPremium ? '#1e303a' : 'white',
		border: 'none',
	}}
>
	{isPremium ? 'Premium' : 'Free'}
</Badge>
```

### Standard Badge (Dunkel)

Für allgemeine Labels, Kategorien, Tags. Immer wie "Free" gestaltet.

| Eigenschaft    | Wert                  |
| -------------- | --------------------- |
| **Background** | `#1e303a` (RESA Blau) |
| **Text Color** | `white`               |
| **Border**     | `none`                |

#### Code (Inline CSS)

```tsx
<Badge
	style={{
		backgroundColor: '#1e303a',
		color: 'white',
		border: 'none',
	}}
>
	Label
</Badge>
```

### Verwendung

- **Tier Badges:** Plan-Anzeige in Stats Cards, Header, Account-Bereich
- **Standard Badges:** Kategorien, Status-Labels, Tags

---

## Alert

TODO

## Toast

TODO

## Spinner

TODO

## Progress

TODO
