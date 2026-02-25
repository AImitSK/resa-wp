<?php

declare( strict_types=1 );

namespace Resa\Modules\RentCalculator;

use Resa\Core\AbstractModule;

/**
 * Mietpreis-Kalkulator — First lead tool module.
 *
 * Estimates monthly rent based on property characteristics,
 * location, and configurable regional multipliers.
 * Flag: free (always available, even on free plan).
 */
class RentCalculatorModule extends AbstractModule {

	/**
	 * @inheritDoc
	 */
	public function getSlug(): string {
		return 'rent-calculator';
	}

	/**
	 * @inheritDoc
	 */
	public function getName(): string {
		return __( 'Mietpreis-Kalkulator', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription(): string {
		return __( 'Schätzt die monatliche Miete basierend auf Lage, Zustand und Ausstattung.', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getIcon(): string {
		return 'haus';
	}

	/**
	 * @inheritDoc
	 */
	public function getCategory(): string {
		return 'calculator';
	}

	/**
	 * @inheritDoc
	 */
	public function getFlag(): string {
		return 'free';
	}

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		$controller = new RentCalculatorController();
		$controller->registerRoutes();
	}

	/**
	 * @inheritDoc
	 *
	 * @return array<string, mixed>
	 */
	public function getFrontendConfig(): array {
		return [
			'steps' => [
				[ 'key' => 'property_type', 'title' => __( 'Immobilienart', 'resa' ) ],
				[ 'key' => 'details', 'title' => __( 'Grunddaten', 'resa' ) ],
				[ 'key' => 'city', 'title' => __( 'Standort', 'resa' ) ],
				[ 'key' => 'condition', 'title' => __( 'Zustand', 'resa' ) ],
				[ 'key' => 'location_rating', 'title' => __( 'Lage', 'resa' ) ],
				[ 'key' => 'features', 'title' => __( 'Ausstattung', 'resa' ) ],
			],
		];
	}
}
