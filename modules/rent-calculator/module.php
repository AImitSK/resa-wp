<?php
/**
 * Rent Calculator Module Bootstrap.
 *
 * Loaded by ModuleRegistry::discover(). Registers the
 * RentCalculatorModule with the central registry.
 */

declare( strict_types=1 );

require_once __DIR__ . '/RentCalculatorModule.php';
require_once __DIR__ . '/RentCalculatorService.php';
require_once __DIR__ . '/RentCalculatorController.php';

use Resa\Core\ModuleRegistry;
use Resa\Modules\RentCalculator\RentCalculatorModule;

add_action(
	'resa_register_modules',
	static function ( ModuleRegistry $registry ): void {
		$registry->register( new RentCalculatorModule() );
	}
);
