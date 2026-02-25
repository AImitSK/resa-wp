import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
			'@frontend': resolve(__dirname, 'src/frontend'),
			'@admin': resolve(__dirname, 'src/admin'),
			'@modules': resolve(__dirname, 'modules'),
		},
	},

	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./tests/js/setup.ts'],
		include: ['tests/js/**/*.test.{ts,tsx}', 'modules/*/tests/js/**/*.test.{ts,tsx}'],
		css: false,
	},
});
