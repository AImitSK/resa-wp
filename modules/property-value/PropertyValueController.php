<?php

declare( strict_types=1 );

namespace Resa\Modules\PropertyValue;

use Resa\Api\RestController;
use Resa\Models\Location;
use Resa\Models\ModuleSettings;

/**
 * REST API controller for the Immobilienwert-Kalkulator module.
 *
 * POST /modules/property-value/calculate — Public calculation
 * GET  /modules/property-value/config    — Module config (cities, features, subtypes)
 */
class PropertyValueController extends RestController {

	/**
	 * @inheritDoc
	 */
	public function registerRoutes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/modules/property-value/calculate',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'calculate' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);

		register_rest_route(
			self::NAMESPACE,
			'/modules/property-value/config',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'getConfig' ],
				'permission_callback' => [ $this, 'publicAccess' ],
			]
		);
	}

	/**
	 * POST /modules/property-value/calculate
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
		if ( ! in_array( $propertyType, PropertyValueService::ALLOWED_TYPES, true ) ) {
			return $this->validationError( [
				'property_type' => __( 'Ungültiger Immobilientyp.', 'resa' ),
			] );
		}

		// Required: property_subtype (validated against correct type).
		$propertySubtype = sanitize_text_field( $params['property_subtype'] ?? '' );
		$allowedSubtypes = $propertyType === 'house'
			? PropertyValueService::ALLOWED_SUBTYPES_HOUSE
			: PropertyValueService::ALLOWED_SUBTYPES_APARTMENT;
		if ( ! in_array( $propertySubtype, $allowedSubtypes, true ) ) {
			return $this->validationError( [
				'property_subtype' => __( 'Ungültige Unterart für diesen Immobilientyp.', 'resa' ),
			] );
		}

		// Required: condition.
		$condition = sanitize_text_field( $params['condition'] ?? '' );
		if ( ! in_array( $condition, PropertyValueService::ALLOWED_CONDITIONS, true ) ) {
			return $this->validationError( [
				'condition' => __( 'Ungültiger Zustand.', 'resa' ),
			] );
		}

		// Required: quality.
		$quality = sanitize_text_field( $params['quality'] ?? '' );
		if ( ! in_array( $quality, PropertyValueService::ALLOWED_QUALITIES, true ) ) {
			return $this->validationError( [
				'quality' => __( 'Ungültige Ausstattungsqualität.', 'resa' ),
			] );
		}

		// Required: location_rating.
		$locationRating = isset( $params['location_rating'] ) ? (int) $params['location_rating'] : 0;
		if ( $locationRating < 1 || $locationRating > 5 ) {
			return $this->validationError( [
				'location_rating' => __( 'Lage-Bewertung muss zwischen 1 und 5 liegen.', 'resa' ),
			] );
		}

		// Optional: rental_status (default: owner_occupied).
		$rentalStatus = sanitize_text_field( $params['rental_status'] ?? 'owner_occupied' );
		if ( ! in_array( $rentalStatus, PropertyValueService::ALLOWED_RENTAL_STATUS, true ) ) {
			$rentalStatus = 'owner_occupied';
		}

		// Optional: features (array of strings, validated against allowlist).
		$features = [];
		if ( isset( $params['features'] ) && is_array( $params['features'] ) ) {
			foreach ( $params['features'] as $feature ) {
				$feature = sanitize_text_field( (string) $feature );
				if ( in_array( $feature, PropertyValueService::ALLOWED_FEATURES, true ) ) {
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
				$yearBuilt = null;
			}
		}

		// Optional: plot_size (only for houses).
		$plotSize = null;
		if ( $propertyType === 'house' && isset( $params['plot_size'] ) && is_numeric( $params['plot_size'] ) ) {
			$plotSize = (float) $params['plot_size'];
			if ( $plotSize < 0 || $plotSize > 100000 ) {
				$plotSize = null;
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
			'size'             => $size,
			'property_type'    => $propertyType,
			'property_subtype' => $propertySubtype,
			'condition'        => $condition,
			'quality'          => $quality,
			'rental_status'    => $rentalStatus,
			'location_rating'  => $locationRating,
			'features'         => $features,
			'year_built'       => $yearBuilt,
			'plot_size'        => $plotSize,
			'rooms'            => $rooms,
		];

		$result = PropertyValueService::calculate( $inputs, $locationData );

		// Add city info to response.
		$result['city'] = [
			'id'   => (int) $location->id,
			'name' => $location->name,
			'slug' => $location->slug,
		];

		return $this->success( $result );
	}

	/**
	 * GET /modules/property-value/config
	 */
	public function getConfig( \WP_REST_Request $request ): \WP_REST_Response {
		$locations = Location::getAll( true );

		$cities = array_map(
			static function ( object $loc ): array {
				return [
					'id'        => (int) $loc->id,
					'slug'      => $loc->slug,
					'name'      => $loc->name,
					'latitude'  => isset( $loc->latitude ) ? (float) $loc->latitude : null,
					'longitude' => isset( $loc->longitude ) ? (float) $loc->longitude : null,
				];
			},
			$locations
		);

		$module = new PropertyValueModule();
		$config = $module->getFrontendConfig();

		return $this->success( [
			'module'              => 'property-value',
			'cities'              => array_values( $cities ),
			'features'            => $config['features'],
			'subtypes_house'      => $config['subtypes_house'],
			'subtypes_apartment'  => $config['subtypes_apartment'],
		] );
	}

	/**
	 * Get calculation data for a location.
	 *
	 * @param int $locationId Location ID.
	 * @return array<string,mixed>
	 */
	private function getCalculationData( int $locationId ): array {
		$moduleSlug = 'property-value';

		$moduleSettings = ModuleSettings::getBySlug( $moduleSlug );

		if ( $moduleSettings ) {
			$calculationData = $moduleSettings['factors'] ?? [];

			$locationValues = $moduleSettings['location_values'][ (string) $locationId ] ?? null;
			if ( $locationValues ) {
				if ( isset( $locationValues['base_price'] ) && $locationValues['base_price'] > 0 ) {
					$calculationData['base_price'] = $locationValues['base_price'];
				}
				if ( isset( $locationValues['plot_price'] ) && $locationValues['plot_price'] > 0 ) {
					$calculationData['plot_price_per_sqm'] = $locationValues['plot_price'];
				}
			}

			if ( ! empty( $calculationData ) ) {
				return $calculationData;
			}
		}

		$location = Location::findById( $locationId );
		if ( $location ) {
			$regionType = $location->region_type ?? 'medium_city';
			$presets    = PropertyValueService::getRegionPresets();

			if ( isset( $presets[ $regionType ] ) ) {
				return $presets[ $regionType ];
			}
		}

		$presets = PropertyValueService::getRegionPresets();
		return $presets['medium_city'] ?? [];
	}
}
