# RESA — Entwicklungs-Workflow

Dieser Workflow beschreibt, wie Features von der Idee bis zum fertigen Code durchlaufen werden. Claude folgt diesem Prozess automatisch, wenn ein Feature-Request kommt.

---

## Übersicht

```
Anfrage → 1. Verstehen → 2. Spec → 3. Plan → 4. Implementieren → 5. Testen → 6. Review → 7. Commit
```

Je nach Umfang können Schritte übersprungen werden (siehe [Wann welchen Schritt?](#wann-welchen-schritt)).

---

## 1. Verstehen

**Ziel:** Anfrage vollständig verstehen, bevor Code geschrieben wird.

- Relevante Planungsdocs lesen (`docs/planning/`)
- Bestehende Specs prüfen (`docs/specs/`)
- Bestehenden Code lesen, der betroffen ist
- Bei Unklarheiten: **Nachfragen statt annehmen**

**Ergebnis:** Klares Bild was gebaut werden soll und warum.

---

## 2. Spec erstellen (`/spec`)

**Ziel:** Feature strukturiert dokumentieren, bevor implementiert wird.

- `/spec [Feature-Name]` ausführen
- Spec-Datei wird unter `docs/specs/SPEC-{name}.md` erstellt
- Enthält: Betroffene Dateien, API-Änderungen, DB-Änderungen, Free vs. Premium, UI/UX, Akzeptanzkriterien
- **User-Freigabe einholen** bevor weitergearbeitet wird

**Wann überspringen:** Nur bei trivialen Änderungen (< 3 Dateien, keine API/DB-Änderungen).

**Ergebnis:** Freigegebene Spezifikation.

---

## 3. Plan erstellen

**Ziel:** Implementierungsstrategie festlegen.

- Plan-Modus aktivieren (automatisch bei nicht-trivialen Tasks)
- Codebase explorieren: Wo muss was geändert werden?
- Reihenfolge der Implementierung festlegen
- Abhängigkeiten identifizieren
- **User-Freigabe einholen**

**Bei Modul-Features zusätzlich klären:**

- Gehört das Feature in den Kern oder in ein Modul?
- Falls neues Modul: `modules/{slug}/` Struktur mit `module.php` + `ModuleInterface`
- REST-Endpoints unter `/resa/v1/modules/{slug}/*`
- FeatureGate: Welches Flag? (free/pro/paid)
- Welche Kern-Services werden konsumiert? (StepWizard, LeadForm, PDF, Icons)

**Wann überspringen:** Bei einfachen Änderungen mit klarer Spec, wo der Pfad offensichtlich ist.

**Ergebnis:** Freigegebener Implementierungsplan.

---

## 4. Implementieren

**Ziel:** Code schreiben, der die Spec erfüllt.

### Automatisch angewendete Skills

Diese Skills sind passiv und werden **immer** beim Coden beachtet — nicht erst am Ende:

| Skill           | Wann                          | Was beachten                                                                                                                   |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **wp-security** | Bei jedem PHP-Code            | Sanitization, Escaping, Nonces, Capabilities, $wpdb->prepare(), REST permission_callback                                       |
| **wp-i18n**     | Bei jedem User-facing String  | Text-Domain `'resa'`, esc_html\_\_(), Translator-Kommentare, \_n() für Plurale, DACH-Formatierung                              |
| **freemius**    | Bei Premium/Free-Logik        | can_use_premium_code(), FeatureGate, Free-Limits, Upgrade-CTAs                                                                 |
| **mpdf**        | Bei PDF-Templates & -Code     | mPDF mit nativer SVG-Unterstützung, bessere CSS-Unterstützung als DOMPDF, SimpleBarChart/SimpleGaugeChart für statische Charts |
| **nivo-charts** | Bei Charts & Visualisierungen | resaChartTheme, resaColors, Dual-Rendering (Web/PDF), DACH-Formatierung (Komma-Dezimal, €/m²), Framer Motion                   |

### Implementierungsreihenfolge

**Kern-Features (typisch):**

1. **Datenbank/Migration** — Neue Tabellen oder Spalten
2. **Models/Repository** — Daten-Zugriff
3. **Services** — Geschäftslogik
4. **REST API Controller** — Endpoints mit Validation, Sanitization, Permissions
5. **React Komponenten** — UI mit Typen, i18n, Feature-Gating
6. **Integration** — Alles zusammenführen (Shortcode, Admin-Menu, etc.)

**Lead Tool Module:**

1. **Modul-Verzeichnis** — `modules/{slug}/module.php` + `{Name}Module.php` (ModuleInterface)
2. **Calculator-Service** — `{Name}Service.php` (CalculatorInterface)
3. **Settings-Schema** — `getSettingsSchema()` im Modul definieren
4. **Frontend-Steps** — React-Komponenten in `modules/{slug}/src/steps/`
5. **Ergebnis-Komponente** — `modules/{slug}/src/result/`
6. **PDF-Bausteine** — `getPdfBlocks()` im Modul
7. **Tests** — `modules/{slug}/tests/`

**Integration Add-ons (separates Plugin):**

1. **Plugin-Bootstrap** — `resa-{name}/resa-{name}.php` mit Freemius Add-on Init
2. **Integration-Klasse** — `IntegrationInterface` implementieren
3. **Hook-Registrierung** — `add_action( 'resa_register_integrations', ... )`
4. **REST-Endpoints** — Unter `/resa/v1/admin/integrations/{slug}/*`
5. **Admin-Settings** — Konfigurationsseite

### Regeln während der Implementierung

- **Kleine Schritte:** Lieber häufiger zwischenspeichern als einen Riesencommit
- **Kein Over-Engineering:** Nur das bauen was die Spec verlangt
- **CSS-Isolation:** Frontend-Widget IMMER mit `resa-` Prefix und `.resa-widget-root` Scope
- **TypeScript:** Keine `any` Types, vollständige Interfaces
- **Zod:** Alle Formulare validieren
- **Error Handling:** Loading/Error States in React, WP_Error in PHP

**Ergebnis:** Funktionierender Code.

---

## 5. Testen (`/test`)

**Ziel:** Automatisierte Tests für den neuen Code.

- `/test [Datei]` für jede relevante Datei ausführen
- Tests werden generiert in:
    - `tests/php/` — PHPUnit + Brain Monkey für PHP
    - `tests/js/` — Vitest + React Testing Library für TypeScript
- Tests lokal ausführen und sicherstellen dass sie grün sind

### Was getestet wird

- **Happy Path** — Normaler Ablauf
- **Edge Cases** — Grenzwerte, Leerstrings, Unicode (ä, ö, ü)
- **Error Cases** — Ungültige Eingaben, fehlende Felder
- **Security** — Unauth-Zugriff, fehlende Nonces, SQL-Injection
- **Freemius** — Free-Limits, Premium-Features, SDK-Ausfall

**Wann überspringen:** Nie komplett. Mindestens Happy-Path-Tests für neue Logik.

**Ergebnis:** Grüne Tests.

---

## 6. Review (`/review`)

**Ziel:** Code-Qualität sicherstellen.

- `/review staged` (oder `/review [Datei]`) ausführen
- Checkliste wird automatisch geprüft:
    - 🔴 **Critical:** Security-Lücken, fehlende Permission-Callbacks
    - 🟡 **Warning:** Fehlende i18n, unvollständige Typen
    - 🔵 **Info:** Verbesserungsvorschläge
- Alle Critical-Findings fixen, Warnings nach Möglichkeit

**Ergebnis:** Review-bereiter Code ohne Critical-Findings.

---

## 7. Commit

**Ziel:** Sauberer, nachvollziehbarer Commit.

- Nur auf explizite Anfrage committen
- Commit-Message beschreibt das **Warum**, nicht das Was
- Relevante Dateien einzeln stagen (kein `git add -A`)
- Keine Secrets, Credentials oder .env-Dateien committen

---

## Wann welchen Schritt?

| Aufgabe                   | Spec | Plan | Impl | Test | Review |
| ------------------------- | ---- | ---- | ---- | ---- | ------ |
| **Neues Feature (groß)**  | ✅   | ✅   | ✅   | ✅   | ✅     |
| **Neues Lead Tool Modul** | ✅   | ✅   | ✅   | ✅   | ✅     |
| **Neue Integration**      | ✅   | ✅   | ✅   | ✅   | ✅     |
| **Neues Feature (klein)** | ❌   | ✅   | ✅   | ✅   | ✅     |
| **Bugfix**                | ❌   | ❌\* | ✅   | ✅   | ✅     |
| **Refactoring**           | ❌   | ✅   | ✅   | ✅   | ✅     |
| **Typo/Config**           | ❌   | ❌   | ✅   | ❌   | ❌     |

\*Plan bei komplexen Bugs die mehrere Dateien betreffen.

### Indikatoren für "großes Feature"

- Betrifft > 5 Dateien
- Neue DB-Tabellen oder API-Endpoints
- Neue Admin-Seite oder Widget-Komponente
- Free/Premium-Unterscheidung relevant

### Indikatoren für "kleines Feature"

- 2-5 Dateien betroffen
- Erweiterung bestehender Funktionalität
- Keine DB/API-Änderungen

---

## Kommunikation

- **Sprache:** Immer Deutsch
- **Rückfragen:** Lieber einmal zu viel als zu wenig fragen
- **Fortschritt:** Task-Liste nutzen bei > 3 Schritten
- **Entscheidungen:** Bei mehreren Lösungswegen User entscheiden lassen
- **Keine Überraschungen:** Keine ungefragten Refactorings oder Feature-Erweiterungen

---

## Slash-Commands Übersicht

| Command                   | Wann verwenden                                    |
| ------------------------- | ------------------------------------------------- |
| `/spec [Feature]`         | Neues Feature spezifizieren (vor Implementierung) |
| `/review [Datei\|staged]` | Code reviewen (nach Implementierung)              |
| `/test [Datei]`           | Tests generieren (nach Implementierung)           |

---

## Cheat Sheet: Was prüfe ich wann?

### Beim Schreiben von PHP

- [ ] Inputs sanitized? (`sanitize_text_field()`, `absint()`, etc.)
- [ ] Outputs escaped? (`esc_html()`, `esc_attr()`, `esc_url()`)
- [ ] Nonces bei Formularen/AJAX?
- [ ] `current_user_can()` bei Admin-Aktionen?
- [ ] `$wpdb->prepare()` bei SQL mit Variablen?
- [ ] `permission_callback` bei REST-Routen?
- [ ] Strings mit `__( '...', 'resa' )` gewrappt?
- [ ] Translator-Kommentare bei sprintf?
- [ ] Premium-Check wo nötig?

### Beim Schreiben von TypeScript/React

- [ ] Keine `any` Types?
- [ ] i18n: `__()` / `_n()` aus `@wordpress/i18n`?
- [ ] Loading/Error States?
- [ ] Zod-Validation für Formulare?
- [ ] `resaConfig.plan` für Feature-Gating?
- [ ] CSS-Klassen mit `resa-` Prefix (Widget)?

### Bei Charts (Nivo)

- [ ] `resaChartTheme` als Theme gesetzt?
- [ ] `resaColors.*` Palette semantisch gewählt?
- [ ] DACH-Formatierung in Achsen/Tooltips (Komma-Dezimal, €, m²)?
- [ ] Chart-Labels mit `__( '...', 'resa' )` gewrappt?
- [ ] Container mit `resa-` Prefix und fester Höhe?
- [ ] Framer Motion Eintritts-Animation (nur Web)?
- [ ] PDF-Variante: `animate={false}`, `isInteractive={false}`, feste Größe?

### Bei PDF-Templates (mPDF)

- [ ] Inline-Styles oder `<style>`-Block (keine externen CSS)?
- [ ] Bilder mit absolutem Pfad oder Data-URI (Base64)?
- [ ] SVGs nativ unterstützt (keine PNG-Konvertierung nötig)
- [ ] Seitenumbrüche mit `page-break-before/after`?
- [ ] UTF-8 und DejaVu-Fonts für Sonderzeichen (€, m², ä/ö/ü)?
- [ ] tempDir in WordPress uploads konfiguriert?

### Bei DB-Änderungen

- [ ] Migration via `dbDelta()`?
- [ ] Versionierung in `resa_db_version` Option?
- [ ] Cleanup in Freemius `after_uninstall` Hook?
