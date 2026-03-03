import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { baseConfig } from './tailwind.config.base';

/**
 * Tailwind CSS — Admin Dashboard Config
 *
 * `important: '#resa-admin-root'` — scoped Spezifität statt globalem !important.
 * Generiert z.B. `#resa-admin-root .resa-flex { display: flex; }` (Spezifität 1-1-0).
 * Das überschreibt WP-Admin-Styles ohne !important-Kollisionen.
 * Content: nur Admin + shared Components (keine Module).
 */
export default {
	...baseConfig,
	important: '#resa-admin-root',

	content: [
		'./src/components/**/*.{ts,tsx}',
		'./src/admin/**/*.{ts,tsx}',
		'./src/lib/**/*.{ts,tsx}',
	],

	plugins: [tailwindcssAnimate],
} satisfies Config;
