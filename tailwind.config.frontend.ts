import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import { baseConfig } from './tailwind.config.base';

/**
 * Tailwind CSS — Frontend Widget Config
 *
 * `important: true` — damit resa-* Utilities WordPress-Theme-Styles überschreiben.
 * Content: nur Frontend + shared Components + Module.
 */
export default {
	...baseConfig,
	important: true,

	content: [
		'./src/components/**/*.{ts,tsx}',
		'./src/frontend/**/*.{ts,tsx}',
		'./src/lib/**/*.{ts,tsx}',
		'./modules/*/src/**/*.{ts,tsx}',
	],

	plugins: [tailwindcssAnimate],
} satisfies Config;
