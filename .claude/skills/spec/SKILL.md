---
name: spec
description: "Feature-Spezifikation für RESA erstellen"
user-invocable: true
argument-hint: "[Feature-Name oder Beschreibung]"
---

# /spec — Feature-Spezifikation erstellen

Erstelle eine strukturierte Feature-Spezifikation für das RESA Plugin.

## Vorgehen

1. **Kontext sammeln:**
   - Lies relevante Planungsdocs aus `docs/planning/` (insbesondere `RESA-Technischer-Stack.md`, `RESA-Plugin-Architektur.md`)
   - Prüfe ob bereits verwandte Specs in `docs/specs/` existieren
   - Prüfe CLAUDE.md für Architektur-Vorgaben

2. **Spec-Datei erstellen:**
   - Pfad: `docs/specs/SPEC-{feature-name-kebab-case}.md`
   - Verwende das Template unten

3. **Bei Unklarheiten nachfragen:**
   - Wenn das Feature unklar ist, frage beim User nach
   - Lieber einmal mehr nachfragen als falsche Annahmen treffen

## Spec-Template

```markdown
# SPEC: {Feature-Titel}

**Status:** Entwurf
**Erstellt:** {Datum}
**Betrifft:** {Kurzbeschreibung welche Bereiche betroffen sind}

## Zusammenfassung

{2-3 Sätze was dieses Feature macht und warum es gebraucht wird}

## Betroffene Dateien

### Neue Dateien
- `includes/...` — {Beschreibung}
- `src/...` — {Beschreibung}

### Geänderte Dateien
- `includes/...` — {Was ändert sich}
- `src/...` — {Was ändert sich}

## API-Änderungen

### Neue Endpoints
| Methode | Route | Beschreibung | Auth |
|---|---|---|---|
| GET | `/resa/v1/...` | ... | Admin |

### Geänderte Endpoints
{Falls zutreffend}

## Datenbank-Änderungen

### Neue Tabellen
{Falls zutreffend — Schema mit Spalten, Typen, Indizes}

### Geänderte Tabellen
{Falls zutreffend}

### Neue Optionen
{wp_options Einträge falls zutreffend}

## Free vs. Premium

| Feature-Aspekt | Free | Premium |
|---|---|---|
| ... | ... | ... |

## UI/UX

### Admin-Seite
{Beschreibung der Admin-UI — Seitenstruktur, Komponenten, Interaktionen}

### Frontend-Widget
{Falls zutreffend — Beschreibung der Widget-Änderungen}

### Mockup/Wireframe
{ASCII-Wireframe oder Beschreibung des Layouts}

## Implementierungsdetails

### PHP-Klassen
{Klassenstruktur, Methoden-Signaturen, Verantwortlichkeiten}

### React-Komponenten
{Komponentenbaum, Props, State-Management}

### Validierung
{Zod-Schemas, PHP-Validation-Regeln}

## Akzeptanzkriterien

- [ ] {Kriterium 1}
- [ ] {Kriterium 2}
- [ ] ...

## Security-Überlegungen

{Sanitization, Escaping, Nonces, Capabilities die beachtet werden müssen}

## Testplan

### Unit Tests
- {Test 1}
- {Test 2}

### Integration Tests
- {Test 1}

## Offene Fragen

- {Frage 1}
- {Frage 2}

## Abhängigkeiten

- {Andere Features/Specs die vorher implementiert sein müssen}
```

## Hinweise

- Sprache: Deutsch (Dokumentation und Code-Kommentare)
- Berücksichtige IMMER Free vs. Premium Limits
- Berücksichtige IMMER CSS-Isolation (resa- Prefix) für Frontend-Widget
- Berücksichtige IMMER i18n (alle User-facing Strings mit gettext)
- Berücksichtige IMMER Security (Sanitization, Escaping, Nonces, Capabilities)
- Vermeide Over-Engineering — nur das Nötigste spezifizieren
