<?php
/**
 * Value Calculator Module Bootstrap.
 *
 * Loaded by ModuleRegistry::discover(). Registers the
 * ValueCalculatorModule with the central registry.
 */

declare( strict_types=1 );

require_once __DIR__ . '/ValueCalculatorModule.php';
require_once __DIR__ . '/ValueCalculatorService.php';
require_once __DIR__ . '/ValueCalculatorController.php';

use Resa\Core\ModuleRegistry;
use Resa\Modules\ValueCalculator\ValueCalculatorModule;

add_action(
	'resa_register_modules',
	static function ( ModuleRegistry $registry ): void {
		$registry->register( new ValueCalculatorModule() );
	}
);
