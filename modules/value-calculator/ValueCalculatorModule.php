<?php

declare( strict_types=1 );

namespace Resa\Modules\ValueCalculator;

use Resa\Core\AbstractModule;

/**
 * Immobilienwert-Rechner — Second lead tool module.
 *
 * Estimates property sale value based on rent calculation
 * multiplied by a configurable sale_factor (Vervielfältiger).
 * Flag: free (always available, even on free plan).
 */
class ValueCalculatorModule extends AbstractModule {

	/**
	 * @inheritDoc
	 */
	public function getSlug(): string {
		return 'value-calculator';
	}

	/**
	 * @inheritDoc
	 */
	public function getName(): string {
		return __( 'Immobilienwert-Rechner', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription(): string {
		return __( 'Schätzt den Verkaufswert basierend auf Mietpotenzial und Vervielfältiger.', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getIcon(): string {
		return 'euro';
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
		$controller = new ValueCalculatorController();
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
				[ 'key' => 'address', 'title' => __( 'Adresse', 'resa' ) ],
			],
		];
	}

	/**
	 * @inheritDoc
	 *
	 * Settings schema defines the configurable parameters for this module.
	 * Inherits from rent-calculator with additional sale_factor.
	 *
	 * @return array<string, mixed>
	 */
	public function getSettingsSchema(): array {
		return [
			'factors' => [
				'base_price'            => [
					'type'    => 'number',
					'label'   => __( 'Basismietpreis EUR/m²', 'resa' ),
					'default' => 9.50,
				],
				'sale_factor'           => [
					'type'    => 'number',
					'label'   => __( 'Vervielfältiger (Jahresmiete × Faktor = Wert)', 'resa' ),
					'default' => 25,
				],
				'size_degression'       => [
					'type'    => 'number',
					'label'   => __( 'Größendegression', 'resa' ),
					'default' => 0.20,
				],
				'location_ratings'      => [
					'type'  => 'object',
					'label' => __( 'Lage-Faktoren', 'resa' ),
					'items' => [
						'1' => [ 'label' => __( 'Einfache Lage', 'resa' ), 'default' => 0.85 ],
						'2' => [ 'label' => __( 'Normale Lage', 'resa' ), 'default' => 0.95 ],
						'3' => [ 'label' => __( 'Gute Lage', 'resa' ), 'default' => 1.00 ],
						'4' => [ 'label' => __( 'Sehr gute Lage', 'resa' ), 'default' => 1.10 ],
						'5' => [ 'label' => __( 'Premium-Lage', 'resa' ), 'default' => 1.25 ],
					],
				],
				'condition_multipliers' => [
					'type'  => 'object',
					'label' => __( 'Zustands-Faktoren', 'resa' ),
					'items' => [
						'new'              => [ 'label' => __( 'Neubau/Kernsaniert', 'resa' ), 'default' => 1.25 ],
						'renovated'        => [ 'label' => __( 'Renoviert', 'resa' ), 'default' => 1.10 ],
						'good'             => [ 'label' => __( 'Guter Zustand', 'resa' ), 'default' => 1.00 ],
						'needs_renovation' => [ 'label' => __( 'Renovierungsbedürftig', 'resa' ), 'default' => 0.80 ],
					],
				],
				'type_multipliers'      => [
					'type'  => 'object',
					'label' => __( 'Immobilientyp-Faktoren', 'resa' ),
					'items' => [
						'apartment' => [ 'label' => __( 'Wohnung', 'resa' ), 'default' => 1.00 ],
						'house'     => [ 'label' => __( 'Haus', 'resa' ), 'default' => 1.15 ],
					],
				],
				'feature_premiums'      => [
					'type'  => 'object',
					'label' => __( 'Ausstattungs-Zuschläge EUR/m²', 'resa' ),
					'items' => [
						'balcony'        => [ 'label' => __( 'Balkon', 'resa' ), 'default' => 0.50 ],
						'terrace'        => [ 'label' => __( 'Terrasse', 'resa' ), 'default' => 0.75 ],
						'garden'         => [ 'label' => __( 'Garten', 'resa' ), 'default' => 1.00 ],
						'elevator'       => [ 'label' => __( 'Aufzug', 'resa' ), 'default' => 0.30 ],
						'parking'        => [ 'label' => __( 'Stellplatz', 'resa' ), 'default' => 0.40 ],
						'garage'         => [ 'label' => __( 'Garage', 'resa' ), 'default' => 0.60 ],
						'cellar'         => [ 'label' => __( 'Keller', 'resa' ), 'default' => 0.20 ],
						'fitted_kitchen' => [ 'label' => __( 'Einbauküche', 'resa' ), 'default' => 0.50 ],
						'floor_heating'  => [ 'label' => __( 'Fußbodenheizung', 'resa' ), 'default' => 0.40 ],
						'guest_toilet'   => [ 'label' => __( 'Gäste-WC', 'resa' ), 'default' => 0.25 ],
						'barrier_free'   => [ 'label' => __( 'Barrierefrei', 'resa' ), 'default' => 0.30 ],
					],
				],
				'age_multipliers'       => [
					'type'  => 'object',
					'label' => __( 'Alter-Faktoren', 'resa' ),
					'items' => [
						'before_1946' => [ 'label' => __( 'Altbau (bis 1945)', 'resa' ), 'default' => 1.05 ],
						'1946_1959'   => [ 'label' => __( 'Nachkriegsbau (1946-1959)', 'resa' ), 'default' => 0.95 ],
						'1960_1979'   => [ 'label' => __( '60er/70er Jahre', 'resa' ), 'default' => 0.90 ],
						'1980_1989'   => [ 'label' => __( '80er Jahre', 'resa' ), 'default' => 0.95 ],
						'1990_1999'   => [ 'label' => __( '90er Jahre', 'resa' ), 'default' => 1.00 ],
						'2000_2014'   => [ 'label' => __( '2000er Jahre', 'resa' ), 'default' => 1.05 ],
						'2015_plus'   => [ 'label' => __( 'Neubau (ab 2015)', 'resa' ), 'default' => 1.10 ],
					],
				],
			],
			'location_values'  => [
				'base_price'  => [
					'type'    => 'number',
					'label'   => __( 'Basismietpreis EUR/m²', 'resa' ),
					'default' => null,
				],
				'sale_factor' => [
					'type'    => 'number',
					'label'   => __( 'Vervielfältiger', 'resa' ),
					'default' => null,
				],
				'price_min'   => [
					'type'    => 'number',
					'label'   => __( 'Minimum EUR/m²', 'resa' ),
					'default' => null,
				],
				'price_max'   => [
					'type'    => 'number',
					'label'   => __( 'Maximum EUR/m²', 'resa' ),
					'default' => null,
				],
			],
		];
	}
}
