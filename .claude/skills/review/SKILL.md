---
name: review
description: "Umfassender Code-Review für RESA"
user-invocable: true
argument-hint: "[Datei, Verzeichnis oder 'staged' für git staged changes]"
---

# /review — Code-Review für RESA

Führe einen umfassenden Code-Review durch, orientiert an den RESA-Architekturvorgaben.

## Vorgehen

1. **Scope bestimmen:**
   - Wenn Argument eine Datei/Verzeichnis ist: Diese Datei(en) reviewen
   - Wenn Argument `staged` ist: `git diff --cached` reviewen
   - Wenn kein Argument: Alle uncommitted Changes reviewen (`git diff` + `git diff --cached`)

2. **Code lesen und analysieren** anhand der Checkliste unten

3. **Findings ausgeben** im definierten Output-Format

## Review-Checkliste

### Security (Kritisch)
- [ ] **Sanitization:** Alle `$_GET`, `$_POST`, `$_REQUEST` Daten sanitized? (`sanitize_text_field()`, `sanitize_email()`, `absint()`, etc.)
- [ ] **wp_unslash():** Vor Sanitization von Superglobals?
- [ ] **Escaping:** Alle Outputs escaped? (`esc_html()`, `esc_attr()`, `esc_url()`, `wp_kses()`)
- [ ] **Nonces:** Alle Formulare/AJAX/Admin-Aktionen mit Nonce geschützt?
- [ ] **Capabilities:** `current_user_can()` vor Admin-Aktionen?
- [ ] **SQL:** `$wpdb->prepare()` bei ALLEN Queries mit Variablen?
- [ ] **REST API:** `permission_callback` bei ALLEN Routen gesetzt?
- [ ] **REST Args:** `sanitize_callback` / `validate_callback` bei Arguments?
- [ ] **Keine gefährlichen Funktionen:** `eval()`, `extract()`, `unserialize()` auf User-Input?

### Internationalization (i18n)
- [ ] **Alle User-facing Strings** mit gettext gewrappt?
- [ ] **Text-Domain:** Immer `'resa'` als String-Literal?
- [ ] **Escaped Varianten:** `esc_html__()` / `esc_attr__()` statt `__()` + separate Escaping?
- [ ] **Translator-Kommentare:** Bei sprintf-Aufrufen mit Platzhaltern?
- [ ] **Positionale Platzhalter:** `%1$s`, `%2$d` bei 2+ Platzhaltern?
- [ ] **Plurale:** `_n()` statt Ternary?
- [ ] **DACH-Formatierung:** `number_format_i18n()`, `wp_date()`, korrekte €-Position?
- [ ] **JS:** `@wordpress/i18n` Funktionen verwendet?

### Freemius / Feature-Gating
- [ ] **Premium-Check:** `can_use_premium_code()` (nicht `is_paying()`)?
- [ ] **Free-Limits:** Asset/Location/Lead-Limits respektiert?
- [ ] **Upgrade-CTAs:** Bei Premium-Features sichtbar?
- [ ] **Graceful Degradation:** Funktioniert im Free-Modus?
- [ ] **FeatureGate:** Korrekt für Feature-Prüfung verwendet?

### CSS-Isolation (Frontend Widget)
- [ ] **Prefix:** Alle CSS-Klassen mit `resa-` Prefix?
- [ ] **Scope:** Styles unter `.resa-widget-root`?
- [ ] **Kein Preflight:** Tailwind reset deaktiviert für Widget?
- [ ] **Keine globalen Styles:** Kein `body`, `*`, `html` Styling?
- [ ] **Tailwind Config:** `resa-` Prefix in Tailwind-Klassen?

### TypeScript / React
- [ ] **Typen vollständig:** Keine `any` Types?
- [ ] **Interface statt Type:** Für Objekt-Shapes (Projekt-Konvention)?
- [ ] **React Hooks:** Korrekte Dependencies in useEffect/useMemo/useCallback?
- [ ] **Error Handling:** API-Fehler abgefangen? Loading/Error States?
- [ ] **Zod-Validation:** Form-Daten validiert?
- [ ] **Keys:** Stabile Keys in Listen (nicht Array-Index)?

### UX / Feedback
- [ ] **Loading States:** Spinner/Skeleton bei async Operationen?
- [ ] **Error Messages:** Benutzerfreundliche Fehlermeldungen (übersetzt)?
- [ ] **Success Feedback:** Toast/Notice bei erfolgreichen Aktionen?
- [ ] **Empty States:** Sinnvolle Anzeige wenn keine Daten?
- [ ] **Accessibility:** aria-Labels, Keyboard-Navigation?

### Modulare Architektur (bei Modul-Features)
- [ ] **Modul-Verzeichnis:** Unter `modules/{slug}/` mit `module.php`?
- [ ] **ModuleInterface:** Implementiert `ModuleInterface` korrekt?
- [ ] **FeatureGate:** `canUseModule( $slug )` korrekt geprüft?
- [ ] **REST-Pfad:** Endpoints unter `/resa/v1/modules/{slug}/*`?
- [ ] **Icon Registry:** Nur semantische Icon-Namen (`<ResaIcon name="..." />`), keine direkten Lucide-Imports in Modulen?
- [ ] **Kern-Bausteine:** Nutzt StepWizard, LeadForm, PDF-Service vom Kern (nicht eigen implementiert)?

### Architektur / Code-Qualität
- [ ] **CLAUDE.md Patterns:** Architekturvorgaben befolgt?
- [ ] **Over-Engineering:** Unnötige Abstraktion/Komplexität?
- [ ] **Separation of Concerns:** Klare Verantwortlichkeiten?
- [ ] **Naming:** Konsistente Benennung (resa_ Prefix für PHP-Funktionen)?
- [ ] **PSR-4:** PHP-Klassen im richtigen Namespace `Resa\`?

## Output-Format

Findings als Liste mit Severity:

```
## Review: {Datei/Scope}

### 🔴 Critical (Muss gefixt werden)
- **[Security]** `datei.php:42` — `$_POST['name']` wird nicht sanitized. Verwende `sanitize_text_field( wp_unslash( $_POST['name'] ) )`.
- **[Security]** `datei.php:78` — SQL ohne `$wpdb->prepare()`.

### 🟡 Warning (Sollte gefixt werden)
- **[i18n]** `datei.php:15` — String `'Einstellungen'` nicht übersetzt. Verwende `__( 'Einstellungen', 'resa' )`.
- **[TypeScript]** `component.tsx:23` — `any` Type vermeiden, korrektes Interface definieren.

### 🔵 Info (Verbesserungsvorschlag)
- **[Architektur]** `datei.php:5` — Klasse könnte in separaten Service ausgelagert werden.
- **[UX]** `component.tsx:45` — Fehlender Loading-State bei API-Call.

### ✅ Positives
- Security-Patterns korrekt angewendet in REST-Controller
- Gute Typ-Definitionen
- i18n vollständig
```

## Hinweise

- Bei `staged`: Fokus auf die geänderten Zeilen, aber Kontext des gesamten Files berücksichtigen
- Security-Issues IMMER als Critical markieren
- Fehlende i18n als Warning (nicht Critical, außer bei sicherheitsrelevantem Escaping)
- Keine Style-Nitpicks — fokussiere auf funktionale Issues
- Wenn alles gut ist, das auch explizit sagen (✅ Positives Sektion)
