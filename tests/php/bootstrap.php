<?php
/**
 * PHPUnit Bootstrap for RESA Tests.
 *
 * Loads Composer autoloader and sets up Brain Monkey
 * for WordPress function mocking.
 */

declare( strict_types=1 );

// Composer autoloader.
require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

// WordPress class stubs (Brain Monkey mocks functions, not classes).
require_once __DIR__ . '/stubs/wp-rest.php';

// Define WordPress constants that the plugin expects.
if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', '/tmp/wordpress/' );
}

if ( ! defined( 'RESA_VERSION' ) ) {
    define( 'RESA_VERSION', '0.1.0-test' );
}

if ( ! defined( 'RESA_PLUGIN_FILE' ) ) {
    define( 'RESA_PLUGIN_FILE', dirname( __DIR__, 2 ) . '/resa.php' );
}

if ( ! defined( 'RESA_PLUGIN_DIR' ) ) {
    define( 'RESA_PLUGIN_DIR', dirname( __DIR__, 2 ) . '/' );
}

if ( ! defined( 'RESA_PLUGIN_URL' ) ) {
    define( 'RESA_PLUGIN_URL', 'http://localhost/wp-content/plugins/resa/' );
}

if ( ! defined( 'RESA_PLUGIN_BASENAME' ) ) {
    define( 'RESA_PLUGIN_BASENAME', 'resa/resa.php' );
}
