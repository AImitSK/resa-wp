import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs';

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
	plugins: [react(), hotFilePlugin()],

	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		origin: 'http://localhost:5173',
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
});
