<?php
/**
 * Plugin Name:       RESA für Propstack
 * Plugin URI:        https://resa-wt.com/propstack
 * Description:       Propstack-CRM-Integration für RESA — synchronisiert Leads automatisch.
 * Version:           1.0.3
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            resa-wt.com
 * License:           Proprietary
 * Text Domain:       resa-propstack
 * Domain Path:       /languages
 */

namespace Resa\Propstack;

defined('ABSPATH') || exit;

// Plugin constants
define('RESA_PROPSTACK_VERSION', '1.0.3');
define('RESA_PROPSTACK_FILE', __FILE__);
define('RESA_PROPSTACK_DIR', plugin_dir_path(__FILE__));
define('RESA_PROPSTACK_URL', plugin_dir_url(__FILE__));

/**
 * Dependency check: RESA Core must be active
 */
function resa_propstack_check_dependencies(): bool {
	if (!defined('RESA_VERSION')) {
		add_action('admin_notices', function() {
			?>
			<div class="notice notice-error">
				<p>
					<strong><?php esc_html_e('RESA für Propstack:', 'resa-propstack'); ?></strong>
					<?php esc_html_e('Das RESA-Plugin muss installiert und aktiviert sein.', 'resa-propstack'); ?>
				</p>
			</div>
			<?php
		});
		return false;
	}

	// Check if RESA Premium is active
	if (!function_exists('resa_fs') || !resa_fs()->can_use_premium_code()) {
		add_action('admin_notices', function() {
			?>
			<div class="notice notice-warning">
				<p>
					<strong><?php esc_html_e('RESA für Propstack:', 'resa-propstack'); ?></strong>
					<?php esc_html_e('Dieses Add-on erfordert RESA Premium. Bitte upgraden Sie Ihre Lizenz.', 'resa-propstack'); ?>
				</p>
			</div>
			<?php
		});
		return false;
	}

	return true;
}

/**
 * Initialize Freemius SDK for this add-on
 */
function resa_propstack_fs(): ?\Freemius {
	global $resa_propstack_fs;

	if (!isset($resa_propstack_fs)) {
		if (!function_exists('fs_dynamic_init')) {
			return null;
		}

		$resa_propstack_fs = fs_dynamic_init([
			'id'             => '25414',
			'slug'           => 'resa-propstack',
			'type'           => 'plugin',
			'public_key'     => 'pk_ce5e549b2fea1003af9197abb34d5',
			'is_premium'     => true,
			'has_paid_plans' => true,
			'parent'         => [
				'id'   => '24963',                         // RESA Core Product-ID
				'slug' => 'resa',
			],
		]);
	}

	return $resa_propstack_fs;
}

/**
 * Bootstrap the plugin
 */
add_action('plugins_loaded', function() {
	// Check dependencies first
	if (!resa_propstack_check_dependencies()) {
		return;
	}

	// Initialize Freemius
	resa_propstack_fs();

	// Load Composer autoloader
	$autoloader = RESA_PROPSTACK_DIR . 'vendor/autoload.php';
	if (file_exists($autoloader)) {
		require_once $autoloader;
	}

	// Register plugin hooks
	Plugin::register();
}, 20); // After RESA Core (priority 10)

/**
 * Activation hook
 */
register_activation_hook(__FILE__, function() {
	// Run migrations
	if (class_exists('Resa\Propstack\Migration')) {
		Migration::run();
	}
});
