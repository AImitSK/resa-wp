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

Kontextuelles Feedback für Fehler, Warnungen oder Informationen. Besteht aus Container, Titel und Beschreibung.

### Varianten

| Variant         | Verwendung                                  | Border            | Text Color  |
| --------------- | ------------------------------------------- | ----------------- | ----------- |
| **default**     | Allgemeine Informationen, neutrale Hinweise | Standard (border) | foreground  |
| **destructive** | Fehler, Warnungen, kritische Informationen  | `destructive/50`  | destructive |

### Spezifikation

| Eigenschaft   | Wert                                                 |
| ------------- | ---------------------------------------------------- |
| **Width**     | `100%` (volle Breite)                                |
| **Padding**   | `16px` horizontal, `12px` vertikal (`px-4 py-3`)     |
| **Border**    | `1px solid`                                          |
| **Radius**    | `8px` (`rounded-lg`)                                 |
| **Font Size** | `14px` (`text-sm`)                                   |
| **Icon**      | Absolut positioniert links (`left: 16px, top: 16px`) |

### Sub-Komponenten

| Komponente           | Beschreibung                                  |
| -------------------- | --------------------------------------------- |
| **Alert**            | Container mit `role="alert"`                  |
| **AlertTitle**       | Überschrift (h5), `font-medium`, `mb-1`       |
| **AlertDescription** | Beschreibungstext, `text-sm`, relaxed leading |

### Code (Standard-Verwendung)

```tsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Error Alert (destructive)
<Alert variant="destructive">
	<AlertTitle>Fehler beim Laden</AlertTitle>
	<AlertDescription>
		Die Daten konnten nicht geladen werden.
	</AlertDescription>
</Alert>

// Info Alert (default)
<Alert>
	<AlertTitle>Hinweis</AlertTitle>
	<AlertDescription>
		Bitte prüfen Sie Ihre Eingaben.
	</AlertDescription>
</Alert>
```

### Verwendung

- **Error States:** Fehlermeldungen bei API-Fehlern, fehlenden Daten
- **Validierung:** Formular-Validierungsfehler (Seiten-Level)
- **Hinweise:** Wichtige Informationen für den Nutzer

---

## Toast

Toast-Benachrichtigungen werden über das Sonner-System bereitgestellt. Siehe [Toast-Dokumentation](./toast.md) für Details.

### Schnell-Referenz

```tsx
import { toast } from 'sonner';

// Erfolg
toast.success('Erfolgreich gespeichert');

// Fehler
toast.error('Speichern fehlgeschlagen');
```

---

## Spinner

Animierter Loading-Indikator für Ladezustände. Basiert auf Lucide `Loader2Icon`.

### Spezifikation

| Eigenschaft      | Wert                       |
| ---------------- | -------------------------- |
| **Icon**         | `Loader2Icon` (Lucide)     |
| **Default Size** | `16px` × `16px` (`size-4`) |
| **Animation**    | `spin` (CSS rotate 360°)   |
| **Role**         | `status`                   |
| **Aria-Label**   | `"Loading"`                |

### Größen (via className oder style)

| Größe       | Tailwind Class | Inline Style                |
| ----------- | -------------- | --------------------------- |
| **Small**   | `resa-size-3`  | `width: 12px, height: 12px` |
| **Default** | `resa-size-4`  | `width: 16px, height: 16px` |
| **Medium**  | `resa-size-5`  | `width: 20px, height: 20px` |
| **Large**   | `resa-size-6`  | `width: 24px, height: 24px` |

### Code (Inline CSS für WP Admin)

```tsx
import { Spinner } from '@/components/ui/spinner';

// Standard Spinner (16px)
<Spinner />

// Größerer Spinner (20px) mit Inline Styles
<Spinner style={{ width: '20px', height: '20px' }} />

// Mit Text kombiniert (LoadingState Pattern)
<div
	style={{
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
		padding: '48px 0',
	}}
>
	<Spinner style={{ width: '20px', height: '20px' }} />
	<span
		style={{
			fontSize: '14px',
			color: 'hsl(215.4 16.3% 46.9%)',
			margin: 0,
		}}
	>
		Wird geladen...
	</span>
</div>
```

### LoadingState Komponente

Für konsistente Ladezustände gibt es die `LoadingState` Wrapper-Komponente:

```tsx
import { LoadingState } from '@/admin/components/LoadingState';

// Standard (48px Padding)
<LoadingState message="Wird geladen..." />

// Kompakt (24px Padding)
<LoadingState message="Daten werden abgerufen..." size="compact" />
```

### Verwendung

- **Buttons:** Loading-State in Buttons (neben Text)
- **Tabellen:** Leere Tabellen während des Ladens
- **Seiten:** Ganzseitige Ladezustände
- **Inline:** Neben Aktionen, die laden

---

## Progress

> **Hinweis:** Eine Progress-Komponente ist derzeit nicht implementiert. Bei Bedarf kann diese aus shadcn/ui hinzugefügt werden.

### Geplante Spezifikation

| Eigenschaft    | Geplanter Wert           |
| -------------- | ------------------------ |
| **Height**     | `8px`                    |
| **Background** | `secondary` (Track)      |
| **Indicator**  | `primary` (RESA Grün)    |
| **Radius**     | `9999px` (pill)          |
| **Animation**  | CSS transition auf width |

### Code (wenn implementiert)

```tsx
import { Progress } from '@/components/ui/progress';

// 60% Fortschritt
<Progress value={60} />

// Mit Inline Styles
<Progress
	value={75}
	style={{
		height: '8px',
		backgroundColor: '#e5e7eb',
	}}
/>
```

### Verwendung (geplant)

- **Upload:** Datei-Upload-Fortschritt
- **Wizard:** Fortschritt im Step-Wizard
- **Prozesse:** Langwierige Operationen
