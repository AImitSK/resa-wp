<?php

declare( strict_types=1 );

namespace Resa\Freemius;

/**
 * Freemius SDK initialization and availability check.
 *
 * Handles SDK loading with graceful degradation —
 * if the SDK is missing or broken, the plugin falls
 * back to free-mode without errors.
 */
class FreemiusInit {

	private static bool $sdkAvailable = false;

	/**
	 * Initialize the Freemius SDK.
	 *
	 * Must be called from resa.php AFTER constants are defined
	 * and the autoloader is loaded.
	 *
	 * @return bool True if SDK loaded successfully.
	 */
	public static function init(): bool {
		if ( self::$sdkAvailable ) {
			return true;
		}

		if ( ! self::loadSdk() ) {
			return false;
		}

		self::$sdkAvailable = true;

		/**
		 * Fires after the Freemius SDK has been loaded successfully.
		 */
		do_action( 'resa_fs_loaded' );

		return true;
	}

	/**
	 * Whether the Freemius SDK is available.
	 */
	public static function isAvailable(): bool {
		return self::$sdkAvailable;
	}

	/**
	 * Load SDK and create the resa_fs() global helper.
	 */
	private static function loadSdk(): bool {
		$sdkPath = RESA_PLUGIN_DIR . 'freemius/start.php';

		if ( ! file_exists( $sdkPath ) ) {
			self::showAdminNotice(
				__( 'RESA: Freemius SDK nicht gefunden. Das Plugin läuft im Free-Modus.', 'resa' )
			);
			return false;
		}

		require_once $sdkPath;

		if ( ! function_exists( 'fs_dynamic_init' ) ) {
			self::showAdminNotice(
				__( 'RESA: Freemius SDK ist beschädigt. Das Plugin läuft im Free-Modus.', 'resa' )
			);
			return false;
		}

		self::createGlobalHelper();

		return true;
	}

	/**
	 * Create the global resa_fs() helper function.
	 */
	private static function createGlobalHelper(): void {
		if ( function_exists( 'resa_fs' ) ) {
			return;
		}

		// The helper is defined in the global namespace via resa.php.
		// This method triggers the actual SDK initialization.
		global $resa_fs;

		$resa_fs = fs_dynamic_init(
			[
				'id'             => '24963',
				'slug'           => 'resa',
				'type'           => 'plugin',
				'public_key'     => 'pk_c94f0ca40759e42eadb8bb19e2bd5',
				'is_premium'     => false,
				'has_addons'     => true,
				'has_paid_plans' => true,
				'trial'          => [
					'days'              => 14,
					'is_block_features' => true,
				],
				'menu'           => [
					'slug'    => 'resa',
					'support' => false,
				],
			]
		);
	}

	/**
	 * Show an admin notice (deferred to admin_notices hook).
	 */
	private static function showAdminNotice( string $message ): void {
		add_action(
			'admin_notices',
			static function () use ( $message ): void {
				printf(
					'<div class="notice notice-warning"><p>%s</p></div>',
					esc_html( $message )
				);
			}
		);
	}

	/**
	 * Reset state (for testing only).
	 *
	 * @internal
	 */
	public static function reset(): void {
		self::$sdkAvailable = false;
	}
}
