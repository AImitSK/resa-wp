# SPEC: Kommunikation — E-Mail-Vorlagen

**Status:** Entwurf
**Erstellt:** 2026-03-03
**Betrifft:** Admin-UI zum Bearbeiten der E-Mail-Vorlagen (Templates) im Bereich Kommunikation

## Zusammenfassung

Die Backend-Infrastruktur für den E-Mail-Versand existiert bereits vollständig: `EmailService` mit Transport-Strategy-Pattern (Brevo → SMTP → wp_mail), `EmailLogger` mit DB-Logging, zwei PHP-Templates (`lead-notification.php`, `lead-result.php`) und die Notification-Services. Was fehlt, ist eine **Admin-UI zum Bearbeiten der E-Mail-Vorlagen** — aktuell sind Betreff, Texte und Variablen hardcoded in den PHP-Templates.

Ziel: Makler können Betreffzeile und Body-Text der E-Mails anpassen, Variablen einsetzen, eine Vorschau sehen und Test-Mails versenden — ohne PHP-Code anfassen zu müssen.

## Betroffene Dateien

### Neue Dateien

**PHP (Backend):**

- `includes/Api/EmailTemplatesController.php` — REST Controller: CRUD für Templates, Test-Mail, Vorschau
- `includes/Models/EmailTemplate.php` — Model: Template-CRUD aus `wp_options` lesen/schreiben

**TypeScript (Frontend):**

- `src/admin/components/communication/TemplatesTab.tsx` — Vorlagen-Listenansicht mit Status-Badges
- `src/admin/components/communication/TemplateEditor.tsx` — Editor-View: Betreff, TipTap Rich-Text-Body, Variablen-Nodes, Anhang-Toggle
- `src/admin/components/communication/TemplatePreview.tsx` — Live-Vorschau im iframe mit Beispieldaten
- `src/admin/components/communication/tiptap/EmailEditor.tsx` — TipTap-Editor-Wrapper: Toolbar, Variablen-Menü, Extensions
- `src/admin/components/communication/tiptap/VariableNode.tsx` — Custom TipTap Node: rendert `{{variable}}` als styled Inline-Badge (nicht editierbar, nur löschbar)
- `src/admin/components/communication/tiptap/VariableMenu.tsx` — Slash-Command oder Toolbar-Dropdown zum Einfügen von Variablen
- `src/admin/components/communication/tiptap/toolbar.tsx` — Editor-Toolbar: Bold, Italic, Link, Heading, Liste, Divider, Variable-Button
- `src/admin/hooks/useEmailTemplates.ts` — React Query Hooks: `useEmailTemplates()`, `useEmailTemplate()`, `useSaveEmailTemplate()`, `useSendTestEmail()`

### Neue Dependencies

```
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-placeholder @tiptap/pm
```

- `@tiptap/react` — React-Bindings für TipTap
- `@tiptap/starter-kit` — Basis-Extensions (Bold, Italic, Heading, BulletList, OrderedList, Blockquote, Code, HardBreak, History)
- `@tiptap/extension-link` — Link-Unterstützung (für "Zum Lead im Dashboard"-Links)
- `@tiptap/extension-placeholder` — Platzhalter-Text wenn Editor leer
- `@tiptap/pm` — ProseMirror-Kern (Peer-Dependency)

### Geänderte Dateien

- `src/admin/pages/Communication.tsx` — Stub durch echte `TemplatesTab`-Komponente ersetzen
- `includes/Services/Email/EmailService.php` — `renderTemplate()` Methode: Template-Daten aus DB statt hardcoded PHP laden
- `includes/Services/Notifications/LeadNotificationService.php` — Nutzt `EmailTemplate::get('lead-notification')` statt direkte Template-Datei
- `includes/Services/Pdf/LeadPdfService.php` — Nutzt `EmailTemplate::get('lead-result')` statt direkte Template-Datei
- `includes/Core/Plugin.php` — `EmailTemplatesController` registrieren

## API-Änderungen

### Neue Endpoints

| Methode | Route                                         | Beschreibung                       | Auth  |
| ------- | --------------------------------------------- | ---------------------------------- | ----- |
| GET     | `/resa/v1/admin/email-templates`              | Alle Templates auflisten           | Admin |
| GET     | `/resa/v1/admin/email-templates/{id}`         | Einzelnes Template laden           | Admin |
| PUT     | `/resa/v1/admin/email-templates/{id}`         | Template speichern                 | Admin |
| POST    | `/resa/v1/admin/email-templates/{id}/reset`   | Template auf Standard zurücksetzen | Admin |
| POST    | `/resa/v1/admin/email-templates/{id}/test`    | Test-Mail an Admin senden          | Admin |
| POST    | `/resa/v1/admin/email-templates/{id}/preview` | HTML-Vorschau mit Beispieldaten    | Admin |

### Request/Response

**GET `/admin/email-templates`**

```json
[
	{
		"id": "lead-notification",
		"name": "Lead-Benachrichtigung",
		"description": "E-Mail an Makler bei neuem Lead.",
		"subject": "Neuer Lead: {{lead_name}} — {{asset_type}}",
		"body": "Guten Tag {{agent_name}},\n\nein neuer Lead...",
		"is_active": true,
		"has_attachment": false,
		"available_variables": [
			"lead_name",
			"lead_email",
			"lead_phone",
			"asset_type",
			"location_name",
			"admin_url"
		],
		"is_modified": false
	}
]
```

**PUT `/admin/email-templates/{id}`**

```json
{
	"subject": "Neuer Lead: {{lead_name}} — {{asset_type}}",
	"body": "Guten Tag {{agent_name}},\n\nein neuer Lead wurde erfasst...",
	"is_active": true
}
```

**POST `/admin/email-templates/{id}/test`**

```json
{
	"recipient": "test@example.com"
}
```

Response: `{ "success": true, "message": "Test-Mail wurde an test@example.com gesendet." }`

## Datenbank-Änderungen

### Keine neuen Tabellen

Templates werden in `wp_options` gespeichert (wie die anderen RESA-Settings):

```php
// Option-Key pro Template
'resa_email_template_lead-notification' => [
    'subject'   => 'Neuer Lead: {{lead_name}} — {{asset_type}}',
    'body'      => 'Guten Tag {{agent_name}},\n\nein neuer Lead...',
    'is_active' => true,
],

'resa_email_template_lead-result' => [
    'subject'   => 'Ihre {{asset_type}}-Analyse',
    'body'      => 'Guten Tag {{lead_name}},\n\nvielen Dank...',
    'is_active' => true,
],
```

Wenn kein DB-Eintrag existiert, fallen die Templates auf die PHP-Datei-Defaults zurück (`Templates/lead-notification.php`, `Templates/lead-result.php`).

## Template-Definitionen

### 1. Lead-Benachrichtigung (`lead-notification`)

**Empfänger:** Makler/Agent (basierend auf Standort-Zuweisung)
**Trigger:** Lead wird erfasst
**Anhang:** Keiner

| Variable            | Beschreibung               | Beispielwert                 |
| ------------------- | -------------------------- | ---------------------------- |
| `{{lead_name}}`     | Vor- + Nachname des Leads  | Lisa Beispiel                |
| `{{lead_email}}`    | E-Mail des Leads           | lisa@example.com             |
| `{{lead_phone}}`    | Telefon des Leads          | +49 123 456789               |
| `{{asset_type}}`    | Name des Moduls            | Mietpreis-Kalkulator         |
| `{{location_name}}` | Standortname               | München                      |
| `{{admin_url}}`     | Link zum Lead im Dashboard | https://site.de/wp-admin/... |

**Standard-Betreff:** `Neuer Lead: {{lead_name}} — {{asset_type}}`

**Standard-Body:**

```
Neuer Lead über den {{asset_type}}:

Name: {{lead_name}}
E-Mail: {{lead_email}}
Telefon: {{lead_phone}}
Standort: {{location_name}}

Zum Lead im Dashboard:
{{admin_url}}
```

### 2. Lead-Ergebnis mit PDF (`lead-result`)

**Empfänger:** Lead/Interessent
**Trigger:** Lead wird erfasst
**Anhang:** Ergebnis-PDF

| Variable          | Beschreibung            | Beispielwert         |
| ----------------- | ----------------------- | -------------------- |
| `{{lead_name}}`   | Vor- + Nachname         | Lisa Beispiel        |
| `{{asset_type}}`  | Name des Moduls         | Mietpreis-Kalkulator |
| `{{agent_name}}`  | Ansprechpartner         | Max Muster           |
| `{{agent_phone}}` | Ansprechpartner-Telefon | +49 123 456789       |
| `{{agent_email}}` | Ansprechpartner-E-Mail  | max@brand.de         |

**Standard-Betreff:** `Ihre persönliche {{asset_type}}-Analyse`

**Standard-Body:**

```
Guten Tag {{lead_name}},

vielen Dank für Ihr Interesse an unserem {{asset_type}}.

Anbei erhalten Sie Ihre persönliche Analyse als PDF-Dokument.

Gerne besprechen wir die Ergebnisse in einem persönlichen Gespräch.

{{agent_name}}
{{agent_phone}}
{{agent_email}}
```

## UI-Beschreibung

### Vorlagen-Tab (TemplatesTab)

Ersetzt den Stub in `Communication.tsx`. Zeigt eine Karten-Liste aller Templates:

```
┌─────────────────────────────────────────────────────────────┐
│ 📧 Lead-Benachrichtigung                        ● Aktiv    │
│    E-Mail an Makler bei neuem Lead.                         │
│    Betreff: Neuer Lead: {{lead_name}} — {{asset_type}}      │
│                                          [Bearbeiten]       │
├─────────────────────────────────────────────────────────────┤
│ 📧 Lead-PDF                                     ● Aktiv    │
│    PDF-Ergebnis an Interessenten.                           │
│    Betreff: Ihre persönliche {{asset_type}}-Analyse         │
│                                          [Bearbeiten]       │
└─────────────────────────────────────────────────────────────┘
```

### Template-Editor (TemplateEditor)

Separate View (wie Lead-Detailseite mit Zurück-Button). Zwei-Spalten-Layout:

**Links (60%) — Bearbeitung:**

- **Aktiv/Inaktiv Toggle** — Deaktivierte Templates werden nicht gesendet
- **Betreff** — Textfeld mit Variablen-Unterstützung
- **Body — TipTap Rich-Text-Editor** (siehe Details unten)
- **Anhang** — Readonly-Info "PDF wird automatisch angehängt" (bei lead-result)

**Rechts (40%) — Live-Vorschau:**

- HTML-Vorschau in einem sandboxed `<iframe>`
- Zeigt den TipTap-Output eingebettet im E-Mail-Layout (Header mit Logo, Footer mit Firmendaten)
- Variablen werden mit Beispieldaten ersetzt (z.B. `{{lead_name}}` → "Lisa Beispiel")
- Aktualisiert sich live bei Eingabe (debounced, rein clientseitig)
- Responsive E-Mail-Preview (600px Breite, wie echte Mail-Clients)

**Footer-Actions:**

- [Auf Standard zurücksetzen] — Setzt auf Default zurück (mit Bestätigungs-Dialog)
- [Test-Mail senden] — Dialog mit E-Mail-Eingabefeld, Standard: Admin-E-Mail
- [Speichern]

### TipTap Rich-Text-Editor (EmailEditor)

Der Editor nutzt TipTap v2 mit folgenden Features:

**Toolbar:**

```
┌──────────────────────────────────────────────────────────────────┐
│ B  I  🔗  │  H2  H3  │  • Liste  1. Liste  │  {x} Variable ▼  │
└──────────────────────────────────────────────────────────────────┘
```

- **Textformatierung:** Bold, Italic, Link (mit URL-Eingabe-Popover)
- **Struktur:** Heading 2, Heading 3, Bullet List, Ordered List
- **Variablen:** Dropdown-Button `{x} Variable` — öffnet gruppiertes Menü

**Toolbar-Stil:** Sticky am oberen Rand des Editors, dezentes Design passend zum RESA-Admin (weiß, border-bottom, Icons in muted-foreground, aktive Buttons mit primary-Highlight).

**Variable-Node (Custom TipTap Node):**

Variablen werden als **Inline-Nodes** gerendert — nicht als editierbarer Text, sondern als gestylte Badges:

```
Guten Tag [{{agent_name}}],

über den [{{asset_type}}] auf [{{site_name}}] wurde ein neuer Lead erfasst.
```

- Visuell: Inline-Badge mit Hintergrundfarbe (`bg-muted`, border-radius, monospace Font)
- Verhalten: Nicht editierbar (atomic node), nur als Ganzes löschbar (Backspace/Delete)
- Einfügen: Über Toolbar-Dropdown oder `/`-Slash-Command im Editor
- Serialisierung: Wird zu `{{variable_name}}` im HTML-Output

**Variablen-Dropdown (VariableMenu):**

Gruppiert nach Kontext:

```
┌────────────────────────────┐
│ Lead                       │
│   {{lead_name}}            │
│   {{lead_email}}           │
│   {{lead_phone}}           │
│ ─────────────────────────  │
│ Modul                      │
│   {{asset_type}}           │
│   {{location_name}}        │
│ ─────────────────────────  │
│ Makler                     │
│   {{agent_name}}           │
│   {{agent_phone}}          │
│   {{agent_email}}          │
│ ─────────────────────────  │
│ System                     │
│   {{admin_url}}            │
└────────────────────────────┘
```

Nur die für das jeweilige Template relevanten Variablen werden angezeigt (`lead-notification` hat alle 8, `lead-result` hat 5 — kein `admin_url`, kein `location_name`, kein `lead_email`/`lead_phone`).

**Slash-Command (optional, nice-to-have):**

Nutzer tippt `/` im Editor → Filterbares Menü mit allen Variablen erscheint (wie Notion/Slack). Implementierung über TipTap `@tiptap/suggestion`.

**Editor-Stil:**

- Min-Höhe: 300px, wächst mit Inhalt
- Border + border-radius passend zum RESA-Admin-Design
- Focus-Ring in RESA-Grün
- Placeholder-Text: "Schreibe deine E-Mail-Vorlage..." (wenn leer)
- Schriftart: System-Font (gleich wie E-Mail-Rendering)

### Datenformat (Serialisierung)

**Gespeichert in DB:** HTML-String (TipTap JSON → HTML via `editor.getHTML()`)

```html
<p>Guten Tag <span data-variable="agent_name">{{agent_name}}</span>,</p>
<p>
	über den <span data-variable="asset_type">{{asset_type}}</span> auf
	<span data-variable="site_name">{{site_name}}</span> wurde ein neuer Lead erfasst:
</p>
<ul>
	<li><strong>Name:</strong> <span data-variable="lead_name">{{lead_name}}</span></li>
	<li><strong>E-Mail:</strong> <span data-variable="lead_email">{{lead_email}}</span></li>
</ul>
```

**Beim Versand:** `EmailService::renderVariables()` ersetzt `{{variable}}` mit echten Werten, das HTML wird in den E-Mail-Layout-Wrapper eingebettet.

**Beim Laden im Editor:** HTML wird zurück in TipTap-State geparsed. Variable-Spans (`<span data-variable="...">`) werden als VariableNode erkannt.

## Free vs. Premium

| Feature                | Free | Premium |
| ---------------------- | ---- | ------- |
| Templates anzeigen     | ✅   | ✅      |
| Betreff ändern         | ✅   | ✅      |
| Body ändern            | ✅   | ✅      |
| Templates deaktivieren | ✅   | ✅      |
| Test-Mail senden       | ✅   | ✅      |
| Vorschau               | ✅   | ✅      |

E-Mail-Vorlagen sind komplett im Free-Plan verfügbar — sie sind ein Kern-Feature.

## Rendering-Logik (Backend)

### Ablauf beim E-Mail-Versand

```
Lead wird erfasst
  → LeadNotificationService / LeadPdfService
    → EmailTemplate::get('lead-notification')
      → Prüft wp_options für custom Template
      → Falls leer: Default aus PHP-Datei laden
    → EmailService::renderVariables($body, $data)
    → EmailService::wrapInLayout($renderedBody)  // HTML-Wrapper
    → Transport::send()
    → EmailLogger::log()
```

### EmailTemplate Model

```php
class EmailTemplate {
    // Alle bekannten Template-IDs mit Defaults
    const TEMPLATES = [
        'lead-notification' => [
            'name'        => 'Lead-Benachrichtigung',
            'description' => 'E-Mail an Makler bei neuem Lead.',
            'subject'     => 'Neuer Lead: {{lead_name}} — {{asset_type}}',
            'body'        => '...Standard-Body...',
            'has_attachment' => false,
            'variables'   => ['lead_name', 'lead_email', 'lead_phone', 'asset_type', 'location_name', 'admin_url'],
        ],
        'lead-result' => [
            'name'        => 'Lead-PDF',
            'description' => 'PDF-Ergebnis an Interessenten.',
            'subject'     => 'Ihre persönliche {{asset_type}}-Analyse',
            'body'        => '...Standard-Body...',
            'has_attachment' => true,
            'variables'   => ['lead_name', 'asset_type', 'agent_name', 'agent_phone', 'agent_email'],
        ],
    ];

    public static function get(string $id): array;     // DB oder Default
    public static function getAll(): array;             // Alle Templates
    public static function save(string $id, array $data): bool;
    public static function reset(string $id): bool;     // Löscht DB-Override
    public static function isModified(string $id): bool; // Hat User geändert?
}
```

## Akzeptanzkriterien

### Vorlagen-Liste

- [ ] Vorlagen-Tab zeigt alle definierten Templates mit aktuellem Betreff und Status
- [ ] Klick auf "Bearbeiten" navigiert zum Template-Editor

### TipTap-Editor

- [ ] Rich-Text-Toolbar: Bold, Italic, Link, H2, H3, Bullet List, Ordered List
- [ ] Variable-Button in Toolbar öffnet gruppiertes Dropdown-Menü
- [ ] Klick auf Variable fügt Inline-Badge-Node an Cursor-Position ein
- [ ] Variable-Nodes sind nicht editierbar, nur als Ganzes löschbar
- [ ] Editor hat Placeholder-Text wenn leer
- [ ] Editor serialisiert zu HTML mit `<span data-variable="...">{{...}}</span>`
- [ ] Editor parsed gespeichertes HTML zurück in korrekte Nodes (Round-Trip)

### Vorschau

- [ ] Live-Vorschau im iframe zeigt E-Mail mit Layout (Logo, Header, Footer)
- [ ] Variablen werden in Vorschau mit Beispieldaten ersetzt
- [ ] Vorschau aktualisiert sich live bei Eingabe (debounced)
- [ ] Vorschau rendert bei 600px Breite (E-Mail-Client-Simulation)

### Funktionen

- [ ] "Test-Mail senden" verschickt eine echte Mail an die angegebene Adresse
- [ ] "Auf Standard zurücksetzen" stellt Original-Text wieder her (mit Bestätigung)
- [ ] Speichern persistiert in `wp_options`
- [ ] Aktiv/Inaktiv-Toggle verhindert Versand bei deaktivierten Templates

### Backend-Integration

- [ ] Bestehende E-Mail-Versand-Logik nutzt die gespeicherten Templates
- [ ] Templates ohne DB-Eintrag nutzen weiterhin die PHP-Datei-Defaults
- [ ] Deaktivierte Templates werden beim Lead-Versand übersprungen
- [ ] HTML-Output des Editors ist E-Mail-Client-kompatibel (inline styles, table-layout)

---

## Folge-Aufgaben

Die folgenden Bereiche der Kommunikation werden in separaten Specs/Tasks umgesetzt:

### 2. Versandlog

Admin-UI zum Anzeigen aller versendeten E-Mails aus `resa_email_log`.

- Tabelle: Datum, Empfänger, Betreff, Template, Status (zugestellt, geöffnet, bounce, fehler)
- Filter nach Status, Template-Typ, Zeitraum
- Klick auf Eintrag zeigt Details (Volltext, Fehler-Meldung, Zeitstempel)
- Anbindung an bestehenden `EmailLogger`
- REST-Endpoint: `GET /admin/email-log` mit Pagination und Filtern

### 3. Automationen

Einfache Regel-Engine für automatisierte E-Mail-Workflows.

- 4 vordefinierte Automationen: Ergebnis-Mail (aktiv), Double-Opt-In (aktiv), Follow-Up (inaktiv, 72h Verzögerung), Makler-Benachrichtigung (inaktiv)
- UI: Karten mit Toggle, Trigger-Beschreibung, Verzögerung konfigurierbar
- Backend: WP-Cron / Action Scheduler für verzögerten Versand
- REST-Endpoints: `GET/PUT /admin/automations`
- Speicherung: `wp_options` (`resa_automations`)

### 4. SMTP-Einrichtung

Admin-UI für die E-Mail-Server-Konfiguration.

- Versandmethode wählen: WordPress Standard / Eigener SMTP / Brevo API
- SMTP-Formular: Host, Port, User, Passwort, Verschlüsselung (STARTTLS/SSL)
- Absender-Daten: Name, E-Mail, Reply-To
- Verbindungstest-Button mit Echtzeit-Feedback
- Zustellbarkeits-Check: SPF/DKIM/DMARC Prüfung (optional, nice-to-have)
- Liest/schreibt bestehende `wp_options` (`resa_email_smtp_*`, `resa_email_from_*`, `resa_email_brevo_api_key`)
- REST-Endpoints: `GET/PUT /admin/email-settings`, `POST /admin/email-settings/test`
