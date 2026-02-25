<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Vite asset enqueue helper.
 *
 * Handles dev mode (Hot Module Replacement via dev server)
 * and production mode (manifest-based asset loading).
 *
 * Dev mode:  Reads `dist/hot` file → enqueues from Vite dev server.
 * Prod mode: Reads `dist/.vite/manifest.json` → enqueues built assets.
 */
final class Vite {

	private ?string $devServerUrl = null;

	/** @var array<string, mixed>|null */
	private ?array $manifest = null;

	public function __construct() {
		$hotFile = RESA_PLUGIN_DIR . 'dist/hot';

		if ( file_exists( $hotFile ) ) {
			$url = trim( (string) file_get_contents( $hotFile ) );
			if ( $url !== '' ) {
				$this->devServerUrl = rtrim( $url, '/' );
			}
		}
	}

	/**
	 * Check if Vite dev server is running.
	 */
	public function isDev(): bool {
		return $this->devServerUrl !== null;
	}

	/**
	 * Enqueue a Vite entry point (JS + associated CSS).
	 *
	 * @param string   $entry  Entry point relative to project root (e.g. 'src/admin/main.tsx').
	 * @param string   $handle WordPress script/style handle.
	 * @param string[] $deps   Script dependencies (WordPress handles).
	 * @param bool     $footer Load in footer.
	 */
	public function enqueue( string $entry, string $handle, array $deps = [], bool $footer = true ): void {
		if ( $this->isDev() ) {
			$this->enqueueDev( $entry, $handle, $deps, $footer );
			return;
		}

		$this->enqueueProd( $entry, $handle, $deps, $footer );
	}

	/**
	 * Dev mode: Enqueue from Vite dev server with HMR.
	 *
	 * @param string[] $deps Script dependencies.
	 */
	private function enqueueDev( string $entry, string $handle, array $deps, bool $footer ): void {
		// Vite client for HMR.
		if ( ! wp_script_is( 'vite-client', 'enqueued' ) ) {
            // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
			wp_enqueue_script( 'vite-client', $this->devServerUrl . '/@vite/client', [], null, false );
		}

		// Entry point module.
        // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_script( $handle, $this->devServerUrl . '/' . $entry, $deps, null, $footer );

		// Both scripts must be ES modules.
		add_filter(
			'script_loader_tag',
			static function ( string $tag, string $tagHandle ) use ( $handle ): string {
				if ( $tagHandle === 'vite-client' || $tagHandle === $handle ) {
					return str_replace( '<script ', '<script type="module" ', $tag );
				}
				return $tag;
			},
			10,
			2
		);
	}

	/**
	 * Production mode: Enqueue from built manifest.
	 *
	 * @param string[] $deps Script dependencies.
	 */
	private function enqueueProd( string $entry, string $handle, array $deps, bool $footer ): void {
		$manifest = $this->getManifest();

		if ( ! isset( $manifest[ $entry ] ) ) {
			return;
		}

		$chunk = $manifest[ $entry ];
		$jsUrl = RESA_PLUGIN_URL . 'dist/' . $chunk['file'];

		wp_enqueue_script( $handle, $jsUrl, $deps, RESA_VERSION, $footer );

		// ES module attribute.
		add_filter(
			'script_loader_tag',
			static function ( string $tag, string $tagHandle ) use ( $handle ): string {
				if ( $tagHandle === $handle ) {
					return str_replace( '<script ', '<script type="module" ', $tag );
				}
				return $tag;
			},
			10,
			2
		);

		// Enqueue associated CSS files.
		if ( ! empty( $chunk['css'] ) ) {
			foreach ( $chunk['css'] as $index => $cssFile ) {
				$cssHandle = $handle . ( $index > 0 ? '-' . $index : '' ) . '-css';
				wp_enqueue_style( $cssHandle, RESA_PLUGIN_URL . 'dist/' . $cssFile, [], RESA_VERSION );
			}
		}

		// Preload imported chunks for better performance.
		if ( ! empty( $chunk['imports'] ) ) {
			foreach ( $chunk['imports'] as $importEntry ) {
				if ( isset( $manifest[ $importEntry ] ) ) {
					$importChunk = $manifest[ $importEntry ];
					$this->addModulePreload( RESA_PLUGIN_URL . 'dist/' . $importChunk['file'] );

					// CSS from imported chunks.
					if ( ! empty( $importChunk['css'] ) ) {
						foreach ( $importChunk['css'] as $cssFile ) {
							$cssHandle = $handle . '-import-' . sanitize_key( $cssFile );
							wp_enqueue_style( $cssHandle, RESA_PLUGIN_URL . 'dist/' . $cssFile, [], RESA_VERSION );
						}
					}
				}
			}
		}
	}

	/**
	 * Add modulepreload link for imported chunks.
	 */
	private function addModulePreload( string $url ): void {
		add_action(
			'wp_head',
			static function () use ( $url ): void {
				printf( '<link rel="modulepreload" href="%s">' . "\n", esc_url( $url ) );
			}
		);

		add_action(
			'admin_head',
			static function () use ( $url ): void {
				printf( '<link rel="modulepreload" href="%s">' . "\n", esc_url( $url ) );
			}
		);
	}

	/**
	 * Read and cache the Vite manifest.
	 *
	 * @return array<string, mixed>
	 */
	private function getManifest(): array {
		if ( $this->manifest !== null ) {
			return $this->manifest;
		}

		$manifestPath = RESA_PLUGIN_DIR . 'dist/.vite/manifest.json';

		if ( ! file_exists( $manifestPath ) ) {
			$this->manifest = [];
			return $this->manifest;
		}

		$contents       = file_get_contents( $manifestPath );
		$this->manifest = $contents !== false ? (array) json_decode( $contents, true ) : [];

		return $this->manifest;
	}
}
