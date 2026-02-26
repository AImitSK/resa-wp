<?php

declare( strict_types=1 );

namespace Resa\Modules\RentCalculator;

use Resa\Api\RestController;
use Resa\Models\Location;
use Resa\Models\ModuleSettings;

/**
 * REST API controller for the Mietpreis-Kalkulator module.
 *
 * POST /modules/rent-calculator/calculate — Public calculation
 * GET  /modules/rent-calculator/config    — Module config (cities, steps)
 */
class RentCalculatorController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/modules/rent-calculator/calculate',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'calculate' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/modules/rent-calculator/config',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getConfig' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);
	}

	/**
	 * POST /modules/rent-calculator/calculate
	 *
	 * Validates inputs, loads location data, runs calculation.
	 */
	public function calculate( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_json_params();

		// Required: city_id.
		$cityId = isset( $params['city_id'] ) ? absint( $params['city_id'] ) : 0;
		if ( $cityId === 0 ) {
			return $this->validationError( [
				'city_id' => __( 'city_id ist erforderlich.', 'resa' ),
			] );
		}

		// Required: size.
		if ( ! isset( $params['size'] ) || ! is_numeric( $params['size'] ) ) {
			return $this->validationError( [
				'size' => __( 'Wohnfläche ist erforderlich.', 'resa' ),
			] );
		}
		$size = (float) $params['size'];
		if ( $size < 10 || $size > 10000 ) {
			return $this->validationError( [
				'size' => __( 'Wohnfläche muss zwischen 10 und 10.000 m² liegen.', 'resa' ),
			] );
		}

		// Required: property_type.
		$propertyType = sanitize_text_field( $params['property_type'] ?? '' );
		if ( ! in_array( $propertyType, RentCalculatorService::ALLOWED_TYPES, true ) ) {
			return $this->validationError( [
				'property_type' => __( 'Ungültiger Immobilientyp.', 'resa' ),
			] );
		}

		// Required: condition.
		$condition = sanitize_text_field( $params['condition'] ?? '' );
		if ( ! in_array( $condition, RentCalculatorService::ALLOWED_CONDITIONS, true ) ) {
			return $this->validationError( [
				'condition' => __( 'Ungültiger Zustand.', 'resa' ),
			] );
		}

		// Required: location_rating.
		$locationRating = isset( $params['location_rating'] ) ? (int) $params['location_rating'] : 0;
		if ( $locationRating < 1 || $locationRating > 5 ) {
			return $this->validationError( [
				'location_rating' => __( 'Lage-Bewertung muss zwischen 1 und 5 liegen.', 'resa' ),
			] );
		}

		// Optional: features (array of strings, validated against allowlist).
		$features = [];
		if ( isset( $params['features'] ) && is_array( $params['features'] ) ) {
			foreach ( $params['features'] as $feature ) {
				$feature = sanitize_text_field( (string) $feature );
				if ( in_array( $feature, RentCalculatorService::ALLOWED_FEATURES, true ) ) {
					$features[] = $feature;
				}
			}
		}

		// Optional: year_built.
		$yearBuilt = null;
		if ( isset( $params['year_built'] ) && is_numeric( $params['year_built'] ) ) {
			$yearBuilt = (int) $params['year_built'];
			$currentYear = (int) gmdate( 'Y' );
			if ( $yearBuilt < 1800 || $yearBuilt > $currentYear + 5 ) {
				$yearBuilt = null; // Ignore invalid years silently.
			}
		}

		// Optional: rooms (not used in calculation, stored in lead).
		$rooms = isset( $params['rooms'] ) ? (float) $params['rooms'] : null;

		// Load location.
		$location = Location::findById( $cityId );
		if ( ! $location || ! $location->is_active ) {
			return $this->notFound( __( 'Location nicht gefunden oder nicht aktiv.', 'resa' ) );
		}

		// Load calculation data from module settings (with location-specific overrides).
		$locationData = $this->getCalculationData( $cityId );

		$inputs = [
			'size'            => $size,
			'property_type'   => $propertyType,
			'condition'       => $condition,
			'location_rating' => $locationRating,
			'features'        => $features,
			'year_built'      => $yearBuilt,
			'rooms'           => $rooms,
		];

		$result = RentCalculatorService::calculate( $inputs, $locationData );

		// Add city info to response.
		$result['city'] = [
			'id'   => (int) $location->id,
			'name' => $location->name,
			'slug' => $location->slug,
		];

		return $this->success( $result );
	}

	/**
	 * GET /modules/rent-calculator/config
	 *
	 * Returns available cities and module configuration.
	 */
	public function getConfig( \WP_REST_Request $request ): \WP_REST_Response {
		$locations = Location::getAll( true );

		$cities = array_map(
			static function ( object $loc ): array {
				return [
					'id'   => (int) $loc->id,
					'slug' => $loc->slug,
					'name' => $loc->name,
				];
			},
			$locations
		);

		return $this->success( [
			'module' => 'rent-calculator',
			'cities' => array_values( $cities ),
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
			],
		] );
	}

	/**
	 * Get calculation data for a location.
	 *
	 * Loads module settings with location-specific overrides.
	 * Falls back to region preset if no custom settings.
	 *
	 * @param int $locationId Location ID.
	 * @return array<string,mixed> Calculation parameters.
	 */
	private function getCalculationData( int $locationId ): array {
		$moduleSlug = 'rent-calculator';

		// First, try to get from module settings.
		$moduleSettings = ModuleSettings::getBySlug( $moduleSlug );

		if ( $moduleSettings ) {
			// Start with global factors.
			$calculationData = $moduleSettings['factors'] ?? [];

			// Apply location-specific overrides if available.
			$locationValues = $moduleSettings['location_values'][ (string) $locationId ] ?? null;
			if ( $locationValues ) {
				// Override base_price if location has custom value.
				if ( isset( $locationValues['base_price'] ) && $locationValues['base_price'] > 0 ) {
					$calculationData['base_price'] = $locationValues['base_price'];
				}
			}

			if ( ! empty( $calculationData ) ) {
				return $calculationData;
			}
		}

		// Fallback: Use default preset based on location's region_type.
		$location = Location::findById( $locationId );
		if ( $location ) {
			$regionType = $location->region_type ?? 'medium_city';
			$presets    = RentCalculatorService::getRegionPresets();

			if ( isset( $presets[ $regionType ] ) ) {
				return $presets[ $regionType ];
			}
		}

		// Ultimate fallback: medium_city preset.
		$presets = RentCalculatorService::getRegionPresets();
		return $presets['medium_city'] ?? [];
	}
}
