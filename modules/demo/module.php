<?php
/**
 * Demo Module Bootstrap.
 *
 * Loaded by ModuleRegistry::discover(). Registers the
 * DemoModule with the central registry.
 */

declare( strict_types=1 );

require_once __DIR__ . '/DemoModule.php';

use Resa\Core\ModuleRegistry;
use Resa\Modules\Demo\DemoModule;

add_action(
	'resa_register_modules',
	static function ( ModuleRegistry $registry ): void {
		$registry->register( new DemoModule() );
	}
);
