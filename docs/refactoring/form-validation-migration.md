# Form Validation Migration

> Migration aller Admin-Formulare auf Zod + React Hook Form Pattern.

**Ziel:** Einheitliche, typsichere Formularvalidierung gemäß `docs/design-system/patterns/form-validation.md`

**Status-Legende:**

- ⬜ Offen
- 🔄 In Arbeit
- ✅ Erledigt
- ⏭️ Übersprungen (kein echtes Formular)

---

## Voraussetzungen

- [x] `@hookform/resolvers` installiert (`npm install @hookform/resolvers`)
- [x] shadcn/ui `Form` Komponente installieren (`npx shadcn@latest add form`)
- [x] Schema-Verzeichnis erstellt (`src/admin/schemas/`)

---

## Admin Components

### Integrations (`src/admin/components/integrations/`)

| Datei              | Status | Schema                    | Notizen            |
| ------------------ | ------ | ------------------------- | ------------------ |
| `WebhooksTab.tsx`  | ✅     | `webhookSchema`           | Create/Edit Dialog |
| `ApiKeysTab.tsx`   | ✅     | `apiKeyCreateSchema`      | Create Dialog      |
| `MessengerTab.tsx` | ✅     | `messengerFormSchema`     | Create/Edit Dialog |
| `PropstackTab.tsx` | ✅     | `propstackSettingsSchema` | Settings Form      |
| `RecaptchaTab.tsx` | ✅     | `recaptchaSettingsSchema` | Settings Form      |

### Settings (`src/admin/components/settings/`)

| Datei             | Status | Schema                   | Notizen            |
| ----------------- | ------ | ------------------------ | ------------------ |
| `GdprTab.tsx`     | ✅     | `gdprSettingsSchema`     | Referenz-Migration |
| `TrackingTab.tsx` | ✅     | `trackingSettingsSchema` | Multiple Inputs    |

### Module Settings (`src/admin/components/module-settings/`)

| Datei                   | Status | Schema                 | Notizen                    |
| ----------------------- | ------ | ---------------------- | -------------------------- |
| `SetupTab.tsx`          | ✅     | `moduleSetupSchema`    | Module Config              |
| `PdfTab.tsx`            | ✅     | `pdfSettingsSchema`    | PDF Config                 |
| `LocationValuesTab.tsx` | ✅     | `locationValuesSchema` | Faktor-Tabelle             |
| `OverviewTab.tsx`       | ⏭️     | —                      | Nur Anzeige, kein Formular |

### Communication (`src/admin/components/communication/`)

| Datei                 | Status | Schema                | Notizen              |
| --------------------- | ------ | --------------------- | -------------------- |
| `TemplateEditor.tsx`  | ✅     | `emailTemplateSchema` | TipTap + Metadaten   |
| `TemplatesTab.tsx`    | ⏭️     | —                     | Liste, kein Formular |
| `TemplatePreview.tsx` | ⏭️     | —                     | Nur Anzeige          |

### Core Components (`src/admin/components/`)

| Datei                | Status | Schema           | Notizen                |
| -------------------- | ------ | ---------------- | ---------------------- |
| `LocationEditor.tsx` | ✅     | `locationSchema` | Komplex: Map, Faktoren |
| `FactorEditor.tsx`   | ✅     | `factorSchema`   | Inline-Edit, generisch |

---

## Admin Pages

| Datei                | Status | Schema                  | Notizen               |
| -------------------- | ------ | ----------------------- | --------------------- |
| `Settings.tsx`       | ✅     | `generalSettingsSchema` | Agent + Branding      |
| `PdfTemplates.tsx`   | ✅     | `pdfTemplateSchema`     | Template CRUD         |
| `ModuleSettings.tsx` | ⏭️     | —                       | Container für Tabs    |
| `Leads.tsx`          | ⏭️     | —                       | Filter, kein Formular |
| `Locations.tsx`      | ⏭️     | —                       | Liste, Editor separat |
| `Analytics.tsx`      | ⏭️     | —                       | Nur Anzeige           |
| `Dashboard.tsx`      | ⏭️     | —                       | Nur Anzeige           |
| `ModuleStore.tsx`    | ⏭️     | —                       | Nur Anzeige           |
| `Integrations.tsx`   | ⏭️     | —                       | Container für Tabs    |

---

## Module (Frontend Widgets)

| Datei                                     | Status | Schema                      | Notizen             |
| ----------------------------------------- | ------ | --------------------------- | ------------------- |
| `modules/rent-calculator/src/steps/*.tsx` | ⬜     | Bereits in `validation.ts`? | Wizard-Steps prüfen |

---

## Schemas (erstellt)

```
src/admin/schemas/
├── index.ts              ✅ Zentrale Exports
├── gdpr.ts               ✅ GdprSettingsFormData
├── tracking.ts           ✅ TrackingSettingsFormData
├── recaptcha.ts          ✅ RecaptchaSettingsFormData
├── webhook.ts            ✅ WebhookFormData
├── apiKey.ts             ✅ ApiKeyCreateFormData
├── messenger.ts          ✅ MessengerFormData
├── propstack.ts          ✅ PropstackSettingsFormData
├── moduleSetup.ts        ✅ ModuleSetupFormData
├── pdfSettings.ts        ✅ PdfSettingsFormData
├── locationValues.ts     ✅ LocationValuesFormData
├── emailTemplate.ts      ✅ EmailTemplateFormData, TestEmailFormData
├── location.ts           ✅ LocationFormData
├── factor.ts             ✅ FactorFormData
├── generalSettings.ts    ✅ GeneralSettingsFormData
└── pdfTemplate.ts        ✅ PdfTemplateFormData
```

---

## Migration pro Komponente

### Checkliste für jede Migration:

1. [ ] Zod Schema in `src/admin/schemas/` erstellen
2. [ ] TypeScript-Typ via `z.infer<>` exportieren
3. [ ] `useState`-Felder durch `useForm` ersetzen
4. [ ] `zodResolver` konfigurieren
5. [ ] `onChange`-Handler durch `field` Props ersetzen
6. [ ] `FormField` + `FormMessage` für Error-Display
7. [ ] Submit-Handler auf `form.handleSubmit()` umstellen
8. [ ] Loading-State beibehalten (`mutation.isPending`)
9. [ ] Testen: Validierung, Submit, Reset

---

## Fortschritt

| Kategorie       | Gesamt | Erledigt | Übersprungen |
| --------------- | ------ | -------- | ------------ |
| Integrations    | 5      | 5        | 0            |
| Settings        | 2      | 2        | 0            |
| Module Settings | 4      | 3        | 1            |
| Communication   | 3      | 1        | 2            |
| Core Components | 2      | 2        | 0            |
| Admin Pages     | 9      | 2        | 7            |
| **Gesamt**      | **25** | **15**   | **10**       |

**✅ Migration abgeschlossen!**

---

## Reihenfolge (Empfehlung)

1. **Einfache Settings-Tabs** — GdprTab, TrackingTab, RecaptchaTab (wenige Felder)
2. **Integration-Dialoge** — WebhooksTab, ApiKeysTab, MessengerTab (CRUD-Pattern)
3. **Komplexe Editoren** — LocationEditor, TemplateEditor (viele Felder)
4. **Module Settings** — SetupTab, PdfTab, LocationValuesTab
5. **Pages** — Settings.tsx, PdfTemplates.tsx

---

## Changelog

| Datum      | Komponente              | Status | Notizen                                      |
| ---------- | ----------------------- | ------ | -------------------------------------------- |
| 2026-03-08 | `GdprTab.tsx`           | ✅     | Referenz-Migration abgeschlossen             |
| 2026-03-08 | `TrackingTab.tsx`       | ✅     | 11 Felder, watch() für conditional rendering |
| 2026-03-08 | `RecaptchaTab.tsx`      | ✅     | Konditionale Validierung via superRefine     |
| 2026-03-08 | `WebhooksTab.tsx`       | ✅     | Dialog-CRUD, Events-Array-Validierung        |
| 2026-03-08 | `ApiKeysTab.tsx`        | ✅     | Einfacher Create-Dialog                      |
| 2026-03-08 | `MessengerTab.tsx`      | ✅     | Plattform-spezifische URL-Validierung        |
| 2026-03-08 | `PropstackTab.tsx`      | ✅     | 11 Felder, nested broker mapping             |
| 2026-03-08 | `SetupTab.tsx`          | ✅     | Radio-Buttons mit Controller                 |
| 2026-03-08 | `PdfTab.tsx`            | ✅     | Toggle-Switches, watch() für CTA             |
| 2026-03-08 | `LocationValuesTab.tsx` | ✅     | Inline-Edit mit valueAsNumber                |
| 2026-03-08 | `TemplateEditor.tsx`    | ✅     | 2 Forms: Template + Test-Email               |
| 2026-03-08 | `LocationEditor.tsx`    | ✅     | Map-Integration, Auto-Slug                   |
| 2026-03-08 | `FactorEditor.tsx`      | ✅     | Generische Komponente mit UseFormReturn      |
| 2026-03-08 | `Settings.tsx`          | ✅     | Nested agent + branding Schemas              |
| 2026-03-08 | `PdfTemplates.tsx`      | ✅     | Margins-Objekt, Live-Preview                 |
