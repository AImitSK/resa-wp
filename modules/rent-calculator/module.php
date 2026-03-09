<?php
/**
 * Rent Calculator Module Bootstrap.
 *
 * Loaded by ModuleRegistry::discover(). Registers the
 * RentCalculatorModule with the central registry.
 */

declare( strict_types=1 );

use Resa\Core\ModuleRegistry;
use Resa\Modules\RentCalculator\RentCalculatorModule;

add_action(
	'resa_register_modules',
	static function ( ModuleRegistry $registry ): void {
		$registry->register( new RentCalculatorModule() );
	}
);
