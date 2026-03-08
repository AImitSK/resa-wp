# Briefing: Form Validation Migration

> Dieses Dokument dient als Startpunkt für eine neue Claude Code Session zur Formular-Migration.

## Auftrag

Migriere alle verbleibenden Admin-Formulare von `useState`-basierter Logik auf **Zod + React Hook Form**.

## Status

- ✅ Voraussetzungen erfüllt (shadcn/ui Form, @hookform/resolvers, Schema-Verzeichnis)
- ✅ Referenz-Migration abgeschlossen: `GdprTab.tsx`
- ✅ Skill erstellt: `/form-migration`
- ⏳ 14 Komponenten verbleibend

## Zu migrierende Komponenten

Starte den Skill mit `/form-migration [Komponenten-Name]` für jede Komponente:

1. `TrackingTab` — `src/admin/components/settings/TrackingTab.tsx`
2. `RecaptchaTab` — `src/admin/components/integrations/RecaptchaTab.tsx`
3. `WebhooksTab` — `src/admin/components/integrations/WebhooksTab.tsx`
4. `ApiKeysTab` — `src/admin/components/integrations/ApiKeysTab.tsx`
5. `MessengerTab` — `src/admin/components/integrations/MessengerTab.tsx`
6. `PropstackTab` — `src/admin/components/integrations/PropstackTab.tsx`
7. `SetupTab` — `src/admin/components/module-settings/SetupTab.tsx`
8. `PdfTab` — `src/admin/components/module-settings/PdfTab.tsx`
9. `LocationValuesTab` — `src/admin/components/module-settings/LocationValuesTab.tsx`
10. `TemplateEditor` — `src/admin/components/communication/TemplateEditor.tsx`
11. `LocationEditor` — `src/admin/components/LocationEditor.tsx`
12. `FactorEditor` — `src/admin/components/FactorEditor.tsx`
13. `Settings` — `src/admin/pages/Settings.tsx`
14. `PdfTemplates` — `src/admin/pages/PdfTemplates.tsx`

## Wichtige Dateien

| Datei                                            | Beschreibung                                                |
| ------------------------------------------------ | ----------------------------------------------------------- |
| `docs/design-system/patterns/form-validation.md` | Vollständige Pattern-Dokumentation                          |
| `docs/refactoring/form-validation-migration.md`  | Migrations-Checkliste (nach jeder Migration aktualisieren!) |
| `src/admin/components/settings/GdprTab.tsx`      | ✅ Referenz-Implementation                                  |
| `src/admin/schemas/gdpr.ts`                      | ✅ Referenz-Schema                                          |
| `src/admin/schemas/index.ts`                     | Schema-Exports (erweitern!)                                 |
| `.claude/skills/form-migration/SKILL.md`         | Skill-Anleitung mit Patterns                                |

## Workflow pro Komponente

1. **Schema erstellen:** `src/admin/schemas/{name}.ts`
2. **Schema exportieren:** `src/admin/schemas/index.ts` aktualisieren
3. **Komponente migrieren:** useState → useForm, Handler → Controller/register
4. **Build prüfen:** `npm run build`
5. **Checkliste aktualisieren:** `docs/refactoring/form-validation-migration.md`

## Empfohlene Reihenfolge

**Einfach (wenige Felder):**

1. TrackingTab
2. RecaptchaTab

**Mittel (Dialoge mit CRUD):** 3. WebhooksTab 4. ApiKeysTab 5. MessengerTab 6. PropstackTab

**Komplex (viele Felder/verschachtelt):** 7. SetupTab 8. PdfTab 9. LocationValuesTab 10. TemplateEditor 11. LocationEditor 12. FactorEditor 13. Settings 14. PdfTemplates

## Startbefehl

Kopiere diesen Befehl in den neuen Chat:

```
Lies docs/refactoring/FORM-MIGRATION-BRIEFING.md und starte dann mit /form-migration TrackingTab
```

Oder für parallele Bearbeitung mehrerer Komponenten:

```
Lies docs/refactoring/FORM-MIGRATION-BRIEFING.md und migriere alle verbleibenden Komponenten gemäß der Checkliste.
```

## Wichtige Hinweise

- **Inline-Styles beibehalten** — WP-Admin hat keine Tailwind-Klassen
- **i18n beachten** — Alle Fehlermeldungen mit `__()` wrappen
- **Build nach jeder Migration** — `npm run build` muss erfolgreich sein
- **Checkliste aktualisieren** — Status ✅ setzen nach jeder fertigen Migration
- **Controller für Select/Switch** — `form.register` funktioniert nur für Input/Textarea
