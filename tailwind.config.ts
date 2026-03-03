/**
 * IDE-Fallback — Re-exportiert die Frontend-Config für Tailwind IntelliSense.
 * Die tatsächlichen Configs werden per @config-Direktive in den CSS-Dateien referenziert:
 *   - src/frontend/styles/frontend.css → tailwind.config.frontend.ts
 *   - src/admin/styles/admin.css       → tailwind.config.admin.ts
 */
export { default } from './tailwind.config.frontend';
