<?php

declare( strict_types=1 );

namespace Resa\Core;

/**
 * Server-side icon registry for PDF rendering and REST API.
 *
 * Reads SVG files from src/components/icons/svg/ and provides
 * them as raw strings for embedding in PDF templates or
 * returning via the REST API.
 */
class IconRegistry {

	/**
	 * Base directory for SVG icon files (relative to plugin root).
	 */
	private const SVG_DIR = 'src/components/icons/svg';

	/**
	 * Cached SVG content keyed by icon name.
	 *
	 * @var array<string, string>
	 */
	private static array $cache = [];

	/**
	 * Get raw SVG content for an icon.
	 *
	 * @param string $name Icon name (e.g. 'haus', 'balkon').
	 * @return string|null SVG string or null if not found.
	 */
	public static function getSvg( string $name ): ?string {
		if ( isset( self::$cache[ $name ] ) ) {
			return self::$cache[ $name ];
		}

		$path = self::findFile( $name );

		if ( $path === null ) {
			return null;
		}

		$content = file_get_contents( $path );

		if ( $content === false ) {
			return null;
		}

		self::$cache[ $name ] = $content;

		return $content;
	}

	/**
	 * Get SVG as base64 data URI (for PDF img src).
	 *
	 * @param string $name Icon name.
	 * @return string|null Data URI or null if not found.
	 */
	public static function getDataUri( string $name ): ?string {
		$svg = self::getSvg( $name );

		if ( $svg === null ) {
			return null;
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		return 'data:image/svg+xml;base64,' . base64_encode( $svg );
	}

	/**
	 * Get all available icon names.
	 *
	 * @return string[]
	 */
	public static function getAll(): array {
		$dir   = RESA_PLUGIN_DIR . self::SVG_DIR;
		$names = [];

		if ( ! is_dir( $dir ) ) {
			return $names;
		}

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $dir, \RecursiveDirectoryIterator::SKIP_DOTS )
		);

		foreach ( $iterator as $file ) {
			if ( $file->getExtension() === 'svg' ) {
				$names[] = $file->getBasename( '.svg' );
			}
		}

		sort( $names );

		return $names;
	}

	/**
	 * Find the SVG file path for a given icon name.
	 *
	 * Searches all subdirectories since icons are organized
	 * by category (immobilientyp/, haustypen/, etc.).
	 */
	private static function findFile( string $name ): ?string {
		$dir = RESA_PLUGIN_DIR . self::SVG_DIR;

		if ( ! is_dir( $dir ) ) {
			return null;
		}

		$iterator = new \RecursiveIteratorIterator(
			new \RecursiveDirectoryIterator( $dir, \RecursiveDirectoryIterator::SKIP_DOTS )
		);

		$target = $name . '.svg';

		foreach ( $iterator as $file ) {
			if ( $file->getFilename() === $target ) {
				return $file->getPathname();
			}
		}

		return null;
	}

	/**
	 * Clear the SVG cache (for testing).
	 *
	 * @internal
	 */
	public static function clearCache(): void {
		self::$cache = [];
	}
}
