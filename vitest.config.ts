import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig( {
	resolve: {
		alias: {
			'@': resolve( __dirname, 'src' ),
			'@frontend': resolve( __dirname, 'src/frontend' ),
			'@admin': resolve( __dirname, 'src/admin' ),
		},
	},

	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: [ './tests/js/setup.ts' ],
		include: [ 'tests/js/**/*.test.{ts,tsx}' ],
		css: false,
	},
} );
