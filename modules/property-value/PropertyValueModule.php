<?php

declare( strict_types=1 );

namespace Resa\Modules\PropertyValue;

use Resa\Core\AbstractModule;

/**
 * Immobilienwert-Kalkulator — Property value estimation module.
 *
 * Estimates market value based on a simplified comparison method
 * (vereinfachtes Vergleichswertverfahren).
 * Flag: pro (requires Pro plan).
 */
class PropertyValueModule extends AbstractModule {

	/**
	 * @inheritDoc
	 */
	public function getSlug(): string {
		return 'property-value';
	}

	/**
	 * @inheritDoc
	 */
	public function getName(): string {
		return __( 'Immobilienwert-Kalkulator', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getDescription(): string {
		return __( 'Schätzt den Marktwert einer Immobilie anhand eines vereinfachten Vergleichswertverfahrens.', 'resa' );
	}

	/**
	 * @inheritDoc
	 */
	public function getIcon(): string {
		return 'haus-euro';
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
		return 'pro';
	}

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		$controller = new PropertyValueController();
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
				[ 'key' => 'property_subtype', 'title' => __( 'Unterart', 'resa' ) ],
				[ 'key' => 'details', 'title' => __( 'Fläche & Zimmer', 'resa' ) ],
				[ 'key' => 'year_built', 'title' => __( 'Baujahr', 'resa' ) ],
				[ 'key' => 'condition', 'title' => __( 'Zustand & Nutzung', 'resa' ) ],
				[ 'key' => 'quality', 'title' => __( 'Ausstattungsqualität', 'resa' ) ],
				[ 'key' => 'features', 'title' => __( 'Extras', 'resa' ) ],
				[ 'key' => 'city', 'title' => __( 'Standort', 'resa' ) ],
				[ 'key' => 'address', 'title' => __( 'Adresse', 'resa' ) ],
				[ 'key' => 'location_rating', 'title' => __( 'Lage', 'resa' ) ],
			],
			'features' => [
				[ 'key' => 'balcony', 'label' => __( 'Balkon', 'resa' ), 'icon' => 'balkon' ],
				[ 'key' => 'terrace', 'label' => __( 'Terrasse', 'resa' ), 'icon' => 'terrasse' ],
				[ 'key' => 'garden', 'label' => __( 'Garten', 'resa' ), 'icon' => 'garten' ],
				[ 'key' => 'elevator', 'label' => __( 'Aufzug', 'resa' ), 'icon' => 'aufzug' ],
				[ 'key' => 'parking', 'label' => __( 'Stellplatz', 'resa' ), 'icon' => 'stellplatz' ],
				[ 'key' => 'garage', 'label' => __( 'Garage', 'resa' ), 'icon' => 'garage' ],
				[ 'key' => 'cellar', 'label' => __( 'Keller', 'resa' ), 'icon' => 'keller' ],
				[ 'key' => 'fitted_kitchen', 'label' => __( 'Einbauküche', 'resa' ), 'icon' => 'kueche' ],
				[ 'key' => 'floor_heating', 'label' => __( 'Fußbodenheizung', 'resa' ), 'icon' => 'fussbodenheizung' ],
				[ 'key' => 'guest_toilet', 'label' => __( 'Gäste-WC', 'resa' ), 'icon' => 'wc' ],
				[ 'key' => 'barrier_free', 'label' => __( 'Barrierefrei', 'resa' ), 'icon' => 'barrierefrei' ],
				[ 'key' => 'solar', 'label' => __( 'Solar/PV-Anlage', 'resa' ), 'icon' => 'solar' ],
			],
			'subtypes_house' => [
				[ 'key' => 'efh', 'label' => __( 'Einfamilienhaus', 'resa' ), 'icon' => 'einfamilienhaus' ],
				[ 'key' => 'rh', 'label' => __( 'Reihenhaus', 'resa' ), 'icon' => 'reihenhaus' ],
				[ 'key' => 'dhh', 'label' => __( 'Doppelhaushälfte', 'resa' ), 'icon' => 'doppelhaushaelfte' ],
				[ 'key' => 'zfh', 'label' => __( 'Zweifamilienhaus', 'resa' ), 'icon' => 'zweifamilienhaus' ],
				[ 'key' => 'mfh', 'label' => __( 'Mehrfamilienhaus', 'resa' ), 'icon' => 'mehrfamilienhaus' ],
			],
			'subtypes_apartment' => [
				[ 'key' => 'eg', 'label' => __( 'Erdgeschosswohnung', 'resa' ), 'icon' => 'erdgeschoss' ],
				[ 'key' => 'etage', 'label' => __( 'Etagenwohnung', 'resa' ), 'icon' => 'etagenwohnung' ],
				[ 'key' => 'dg', 'label' => __( 'Dachgeschosswohnung', 'resa' ), 'icon' => 'dachgeschoss' ],
				[ 'key' => 'maisonette', 'label' => __( 'Maisonette', 'resa' ), 'icon' => 'maisonette' ],
				[ 'key' => 'penthouse', 'label' => __( 'Penthouse', 'resa' ), 'icon' => 'penthouse' ],
			],
		];
	}

	/**
	 * @inheritDoc
	 *
	 * @return array<string, mixed>
	 */
	public function getSettingsSchema(): array {
		return [
			'factors'         => [
				'base_price'            => [
					'type'    => 'number',
					'label'   => __( 'Basis-Kaufpreis EUR/m²', 'resa' ),
					'default' => 3200,
				],
				'plot_price_per_sqm'    => [
					'type'    => 'number',
					'label'   => __( 'Grundstückspreis EUR/m²', 'resa' ),
					'default' => 180,
				],
				'size_degression'       => [
					'type'    => 'number',
					'label'   => __( 'Größendegression', 'resa' ),
					'default' => 0.18,
				],
				'type_multipliers'      => [
					'type'  => 'object',
					'label' => __( 'Immobilientyp-Faktoren', 'resa' ),
					'items' => [
						'house'     => [ 'label' => __( 'Haus', 'resa' ), 'default' => 1.00 ],
						'apartment' => [ 'label' => __( 'Wohnung', 'resa' ), 'default' => 0.95 ],
					],
				],
				'subtype_multipliers'   => [
					'type'  => 'object',
					'label' => __( 'Unterart-Faktoren', 'resa' ),
					'items' => [
						'efh'        => [ 'label' => __( 'Einfamilienhaus', 'resa' ), 'default' => 1.00 ],
						'rh'         => [ 'label' => __( 'Reihenhaus', 'resa' ), 'default' => 0.90 ],
						'dhh'        => [ 'label' => __( 'Doppelhaushälfte', 'resa' ), 'default' => 0.95 ],
						'zfh'        => [ 'label' => __( 'Zweifamilienhaus', 'resa' ), 'default' => 1.05 ],
						'mfh'        => [ 'label' => __( 'Mehrfamilienhaus', 'resa' ), 'default' => 1.10 ],
						'eg'         => [ 'label' => __( 'Erdgeschosswohnung', 'resa' ), 'default' => 0.95 ],
						'etage'      => [ 'label' => __( 'Etagenwohnung', 'resa' ), 'default' => 1.00 ],
						'dg'         => [ 'label' => __( 'Dachgeschosswohnung', 'resa' ), 'default' => 0.98 ],
						'maisonette' => [ 'label' => __( 'Maisonette', 'resa' ), 'default' => 1.05 ],
						'penthouse'  => [ 'label' => __( 'Penthouse', 'resa' ), 'default' => 1.20 ],
					],
				],
				'condition_multipliers' => [
					'type'  => 'object',
					'label' => __( 'Zustands-Faktoren', 'resa' ),
					'items' => [
						'new'              => [ 'label' => __( 'Neubau/Kernsaniert', 'resa' ), 'default' => 1.25 ],
						'renovated'        => [ 'label' => __( 'Kürzlich renoviert', 'resa' ), 'default' => 1.10 ],
						'good'             => [ 'label' => __( 'Guter Zustand', 'resa' ), 'default' => 1.00 ],
						'needs_renovation' => [ 'label' => __( 'Renovierungsbedürftig', 'resa' ), 'default' => 0.75 ],
					],
				],
				'quality_multipliers'   => [
					'type'  => 'object',
					'label' => __( 'Qualitäts-Faktoren', 'resa' ),
					'items' => [
						'premium' => [ 'label' => __( 'Gehoben', 'resa' ), 'default' => 1.25 ],
						'normal'  => [ 'label' => __( 'Normal', 'resa' ), 'default' => 1.00 ],
						'basic'   => [ 'label' => __( 'Einfach', 'resa' ), 'default' => 0.80 ],
					],
				],
				'rental_discount'       => [
					'type'  => 'object',
					'label' => __( 'Vermietungsstatus-Faktoren', 'resa' ),
					'items' => [
						'owner_occupied' => [ 'label' => __( 'Eigennutzung', 'resa' ), 'default' => 1.00 ],
						'rented'         => [ 'label' => __( 'Vermietet', 'resa' ), 'default' => 0.92 ],
						'vacant'         => [ 'label' => __( 'Leerstand', 'resa' ), 'default' => 1.00 ],
					],
				],
				'location_ratings'      => [
					'type'  => 'object',
					'label' => __( 'Lage-Faktoren', 'resa' ),
					'items' => [
						'1' => [ 'label' => __( 'Einfache Lage', 'resa' ), 'default' => 0.80 ],
						'2' => [ 'label' => __( 'Normale Lage', 'resa' ), 'default' => 0.92 ],
						'3' => [ 'label' => __( 'Gute Lage', 'resa' ), 'default' => 1.00 ],
						'4' => [ 'label' => __( 'Sehr gute Lage', 'resa' ), 'default' => 1.12 ],
						'5' => [ 'label' => __( 'Premium-Lage', 'resa' ), 'default' => 1.30 ],
					],
				],
				'age_multipliers'       => [
					'type'  => 'object',
					'label' => __( 'Alter-Faktoren', 'resa' ),
					'items' => [
						'before_1946' => [ 'label' => __( 'Altbau (bis 1945)', 'resa' ), 'default' => 1.05 ],
						'1946_1959'   => [ 'label' => __( 'Nachkriegsbau (1946-1959)', 'resa' ), 'default' => 0.90 ],
						'1960_1979'   => [ 'label' => __( '60er/70er Jahre', 'resa' ), 'default' => 0.85 ],
						'1980_1989'   => [ 'label' => __( '80er Jahre', 'resa' ), 'default' => 0.92 ],
						'1990_1999'   => [ 'label' => __( '90er Jahre', 'resa' ), 'default' => 1.00 ],
						'2000_2014'   => [ 'label' => __( '2000er Jahre', 'resa' ), 'default' => 1.08 ],
						'2015_plus'   => [ 'label' => __( 'Neubau (ab 2015)', 'resa' ), 'default' => 1.15 ],
					],
				],
				'feature_premiums'      => [
					'type'  => 'object',
					'label' => __( 'Ausstattungs-Zuschläge EUR/m²', 'resa' ),
					'items' => [
						'balcony'        => [ 'label' => __( 'Balkon', 'resa' ), 'default' => 15 ],
						'terrace'        => [ 'label' => __( 'Terrasse', 'resa' ), 'default' => 25 ],
						'garden'         => [ 'label' => __( 'Garten', 'resa' ), 'default' => 30 ],
						'elevator'       => [ 'label' => __( 'Aufzug', 'resa' ), 'default' => 10 ],
						'parking'        => [ 'label' => __( 'Stellplatz', 'resa' ), 'default' => 12 ],
						'garage'         => [ 'label' => __( 'Garage', 'resa' ), 'default' => 20 ],
						'cellar'         => [ 'label' => __( 'Keller', 'resa' ), 'default' => 8 ],
						'fitted_kitchen' => [ 'label' => __( 'Einbauküche', 'resa' ), 'default' => 15 ],
						'floor_heating'  => [ 'label' => __( 'Fußbodenheizung', 'resa' ), 'default' => 18 ],
						'guest_toilet'   => [ 'label' => __( 'Gäste-WC', 'resa' ), 'default' => 8 ],
						'barrier_free'   => [ 'label' => __( 'Barrierefrei', 'resa' ), 'default' => 10 ],
						'solar'          => [ 'label' => __( 'Solar/PV-Anlage', 'resa' ), 'default' => 20 ],
					],
				],
			],
			'location_values' => [
				'base_price' => [
					'type'    => 'number',
					'label'   => __( 'Basis-Kaufpreis EUR/m²', 'resa' ),
					'default' => null,
				],
				'plot_price'  => [
					'type'    => 'number',
					'label'   => __( 'Grundstückspreis EUR/m²', 'resa' ),
					'default' => null,
				],
				'price_min'  => [
					'type'    => 'number',
					'label'   => __( 'Minimum EUR/m²', 'resa' ),
					'default' => null,
				],
				'price_max'  => [
					'type'    => 'number',
					'label'   => __( 'Maximum EUR/m²', 'resa' ),
					'default' => null,
				],
			],
		];
	}
}
