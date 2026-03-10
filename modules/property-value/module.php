<?php
/**
 * Property Value Module Bootstrap.
 *
 * Loaded by ModuleRegistry::discover(). Registers the
 * PropertyValueModule with the central registry.
 */

declare( strict_types=1 );

use Resa\Core\ModuleRegistry;
use Resa\Modules\PropertyValue\PropertyValueModule;

add_action(
	'resa_register_modules',
	static function ( ModuleRegistry $registry ): void {
		$registry->register( new PropertyValueModule() );
	}
);
