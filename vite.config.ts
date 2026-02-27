import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs';

/**
 * WordPress externals plugin for Vite (dev + build mode).
 *
 * Replaces @wordpress/* imports with runtime globals from window.wp.*.
 * This works for both dev server and production builds.
 *
 * Required: WordPress must enqueue the corresponding script handles
 * (e.g., 'wp-i18n') before our bundle loads.
 */
function wpExternalsPlugin(): Plugin {
	// Map of npm package → window global path.
	const wpModules: Record<string, string> = {
		'@wordpress/i18n': 'wp.i18n',
	};

	// Virtual module prefix.
	const PREFIX = '\0wp-virtual:';

	return {
		name: 'resa-wp-externals',
		enforce: 'pre',

		resolveId(id) {
			if (id in wpModules) {
				// Return virtual module ID that we'll handle in load().
				return PREFIX + id;
			}
			return null;
		},

		load(id) {
			if (!id.startsWith(PREFIX)) {
				return null;
			}

			const moduleId = id.slice(PREFIX.length);
			const globalPath = wpModules[moduleId];

			if (!globalPath) {
				return null;
			}

			// Generate code that reads from the window global.
			// WordPress i18n exports: __, _x, _n, _nx, sprintf, etc.
			if (moduleId === '@wordpress/i18n') {
				return `
const i18n = window.${globalPath};
export const __ = i18n.__;
export const _x = i18n._x;
export const _n = i18n._n;
export const _nx = i18n._nx;
export const sprintf = i18n.sprintf;
export const setLocaleData = i18n.setLocaleData;
export const getLocaleData = i18n.getLocaleData;
export const subscribe = i18n.subscribe;
export const hasTranslation = i18n.hasTranslation;
export const resetLocaleData = i18n.resetLocaleData;
export default i18n;
`;
			}

			// Generic fallback for other WordPress modules.
			return `export default window.${globalPath};`;
		},
	};
}

/**
 * Writes a `dist/hot` file when the Vite dev server starts.
 * PHP reads this file to detect dev mode and enqueue assets from the dev server.
 * The file is deleted when the server stops.
 */
function hotFilePlugin(): Plugin {
	const hotFilePath = resolve(__dirname, 'dist/hot');

	return {
		name: 'resa-hot-file',

		configureServer(server) {
			const write = () => {
				mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
				const address = server.config.server.origin || 'http://localhost:5173';
				writeFileSync(hotFilePath, address);
			};

			const cleanup = () => {
				if (existsSync(hotFilePath)) {
					unlinkSync(hotFilePath);
				}
			};

			server.httpServer?.once('listening', write);
			server.httpServer?.once('close', cleanup);
			process.on('exit', cleanup);
			process.on('SIGINT', () => {
				cleanup();
				process.exit();
			});
			process.on('SIGTERM', () => {
				cleanup();
				process.exit();
			});
		},
	};
}

export default defineConfig({
	plugins: [wpExternalsPlugin(), react(), hotFilePlugin()],

	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		// Use host.docker.internal so WordPress in Docker can reach the dev server.
		origin: 'http://host.docker.internal:5173',
	},

	build: {
		outDir: 'dist',
		emptyOutDir: true,
		manifest: true,
		rollupOptions: {
			input: {
				frontend: resolve(__dirname, 'src/frontend/main.tsx'),
				admin: resolve(__dirname, 'src/admin/main.tsx'),
			},
			output: {
				entryFileNames: '[name]/[name]-[hash].js',
				chunkFileNames: 'shared/[name]-[hash].js',
				assetFileNames: '[name]/[name]-[hash].[ext]',
			},
			// Note: @wordpress/i18n is handled by wpExternalsPlugin, not Rollup external.
			// This allows it to work with ES module output (globals only works with IIFE/UMD).
		},
	},

	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
			'@frontend': resolve(__dirname, 'src/frontend'),
			'@admin': resolve(__dirname, 'src/admin'),
			'@modules': resolve(__dirname, 'modules'),
		},
	},

	// Exclude WordPress externals from dependency optimization.
	optimizeDeps: {
		exclude: ['@wordpress/i18n'],
	},
});
