<?php
/**
 * Plugin Name:       RESA — Real Estate Smart Assets
 * Plugin URI:        https://resa-wt.com
 * Description:       Interaktive, leadgenerierende Rechner und Tools für Immobilienmakler im DACH-Raum.
 * Version:           0.4.6
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            resa-wt.com
 * Author URI:        https://resa-wt.com
 * License:           Proprietary
 * Text Domain:       resa
 * Domain Path:       /languages
 */

defined( 'ABSPATH' ) || exit;

// Plugin constants.
define( 'RESA_VERSION', '0.4.6' );
define( 'RESA_PLUGIN_FILE', __FILE__ );
define( 'RESA_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'RESA_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'RESA_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

// PHP version check.
if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
	add_action(
		'admin_notices',
		static function (): void {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html(
					sprintf(
					/* translators: %s: Required PHP version */
						__( 'RESA benötigt mindestens PHP %s. Bitte aktualisieren Sie Ihre PHP-Version.', 'resa' ),
						'8.1'
					)
				)
			);
		}
	);
	return;
}

// Composer autoloader.
if ( ! file_exists( RESA_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	add_action(
		'admin_notices',
		static function (): void {
			printf(
				'<div class="notice notice-error"><p>%s</p></div>',
				esc_html__( 'RESA: Composer-Abhängigkeiten fehlen. Bitte "composer install" ausführen.', 'resa' )
			);
		}
	);
	return;
}

require_once RESA_PLUGIN_DIR . 'vendor/autoload.php';

// Freemius SDK (graceful — plugin works without it in free mode).
Resa\Freemius\FreemiusInit::init();

if ( ! function_exists( 'resa_fs' ) ) {
	/**
	 * Global helper to access the Freemius SDK instance.
	 *
	 * @return \Freemius|null Null if SDK is not available.
	 */
	function resa_fs(): ?\Freemius {
		global $resa_fs;
		return $resa_fs ?? null;
	}
}

// Bootstrap.
Resa\Core\Plugin::init();
