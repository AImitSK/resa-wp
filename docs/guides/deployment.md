# Deployment

## Plugin-Build

### Lokaler Build

```bash
# Vollständiger Build: TypeScript-Check + Vite + i18n + Composer (ohne dev)
npm run plugin:build

# ZIP-Datei erstellen
npm run plugin:zip
```

`plugin:zip` erzeugt eine installierbare ZIP-Datei für WordPress.

### Was passiert beim Build?

1. `tsc --noEmit` — TypeScript-Typprüfung
2. `vite build` — Bundling mit Manifest nach `dist/`
3. `i18n:build` — POT → PO → MO → JSON Übersetzungsdateien
4. `composer install --no-dev` — Nur Produktions-Dependencies (dompdf)

## Versionierung

```bash
# Version bumpen (patch/minor/major)
npm run version:bump
```

Aktualisiert die Version in `package.json`, `resa.php` Header (`Version:` + `RESA_VERSION` Konstante) und `composer.json`.

## Freemius Deploy via GitHub Actions

Das Deployment läuft **automatisch über Git-Tags**. Kein manueller Upload im Freemius Dashboard nötig.

### RESA Hauptplugin (`.github/workflows/deploy-freemius.yml`)

**Trigger:** Push eines Tags mit `v*`-Prefix (z.B. `v0.5.0`)

**Ablauf:**

1. Version aus Tag extrahieren (`v0.5.0` → `0.5.0`)
2. **Version-Konsistenz prüfen** — Tag muss mit `package.json`, `resa.php` Header und `RESA_VERSION` Konstante übereinstimmen
3. Node.js 20 + PHP 8.1 Setup
4. `npm ci` + `composer install --no-dev`
5. `npm run build` + `npm run i18n:build`
6. ZIP erstellen via `node scripts/create-zip.js`
7. ZIP verifizieren (Existenz + Inhalt)
8. **Deploy zu Freemius** via API (`POST /v1/products/24963/tags.json`) — Status: "pending release"
9. ZIP als GitHub Artifact hochladen (90 Tage)

**Secret:** `FREEMIUS_BEARER_TOKEN`

### Propstack Add-on (`.github/workflows/deploy-propstack-freemius.yml`)

**Trigger:** Push eines Tags mit `propstack-v*`-Prefix (z.B. `propstack-v1.0.0`)

**Ablauf:**

1. Version aus Tag extrahieren
2. Root + Add-on Dependencies installieren
3. ZIP erstellen (`addons/resa-propstack/`)
4. **Deploy zu Freemius** via API (Product ID: 25414)
5. **GitHub Release** erstellen mit ZIP-Anhang

**Secret:** `FREEMIUS_PROPSTACK_TOKEN`

### Release-Workflow

```bash
# 1. Version bumpen
npm run version:bump        # patch/minor/major

# 2. Committen
git add -A
git commit -m "release: v0.5.0"

# 3. Tag setzen und pushen
git tag v0.5.0
git push origin main --tags

# → GitHub Action baut und deployt automatisch zu Freemius
```

Nach dem Deploy ist die Version im Freemius Dashboard als "pending release" sichtbar. Von dort kann sie veröffentlicht werden (sofort oder geplant).

## CI-Pipeline (`.github/workflows/test.yml`)

Läuft bei jedem Push auf `main`/`develop` und bei Pull Requests:

| Job          | Trigger                   | Beschreibung                       |
| ------------ | ------------------------- | ---------------------------------- |
| **lint**     | Push + PR                 | TypeScript-Check, ESLint, Prettier |
| **test-php** | Push + PR (nach lint)     | PHPUnit                            |
| **test-js**  | Push + PR (nach lint)     | Vitest                             |
| **test-e2e** | **Nur PRs** (nach php+js) | Docker + Playwright                |

## Checkliste vor Release

- [ ] Alle Tests grün (`npm run test:php`, `npm run test`, `npm run lint`)
- [ ] Version gebumpt (`npm run version:bump`)
- [ ] Commit + Tag (`git tag v{version}`)
- [ ] Push mit Tags (`git push origin main --tags`)
- [ ] GitHub Action erfolgreich durchgelaufen
- [ ] Im Freemius Dashboard Release veröffentlichen
