<?php

declare( strict_types=1 );

namespace Resa\Modules\PropertyValue;

/**
 * Property value calculation engine.
 *
 * Estimates market value based on property characteristics and
 * location-specific multipliers using a simplified comparison method.
 *
 * Formula:
 *   price/m² = base_price × size_factor × type × subtype × condition
 *              × age × quality × location × rental + features
 *   plot_value = plot_size × plot_price_per_sqm (only for houses)
 *   estimated_value = size × price/m² + plot_value
 *   range = ±12%
 */
class PropertyValueService {

	/** Reference property size for degression curve. */
	private const REFERENCE_SIZE = 100.0;

	/** Range factor for low/high estimates (±12%). */
	private const RANGE_FACTOR = 0.12;

	/** Allowed property types. */
	public const ALLOWED_TYPES = [ 'house', 'apartment' ];

	/** Allowed house subtypes. */
	public const ALLOWED_SUBTYPES_HOUSE = [ 'efh', 'rh', 'dhh', 'zfh', 'mfh' ];

	/** Allowed apartment subtypes. */
	public const ALLOWED_SUBTYPES_APARTMENT = [ 'eg', 'etage', 'dg', 'maisonette', 'penthouse' ];

	/** Allowed condition values. */
	public const ALLOWED_CONDITIONS = [ 'new', 'renovated', 'good', 'needs_renovation' ];

	/** Allowed quality levels. */
	public const ALLOWED_QUALITIES = [ 'premium', 'normal', 'basic' ];

	/** Allowed rental status values. */
	public const ALLOWED_RENTAL_STATUS = [ 'owner_occupied', 'rented', 'vacant' ];

	/** Allowed feature keys. */
	public const ALLOWED_FEATURES = [
		'balcony',
		'terrace',
		'garden',
		'elevator',
		'parking',
		'garage',
		'cellar',
		'fitted_kitchen',
		'floor_heating',
		'guest_toilet',
		'barrier_free',
		'solar',
	];

	/**
	 * Calculate property value estimate.
	 *
	 * @param array<string,mixed> $inputs       User inputs.
	 * @param array<string,mixed> $locationData Calculation parameters from location/presets.
	 * @return array<string,mixed> Result with estimated_value, price_per_sqm, plot_value, market_position, factors.
	 */
	public static function calculate( array $inputs, array $locationData ): array {
		$size            = max( 10.0, (float) ( $inputs['size'] ?? 100 ) );
		$propertyType    = (string) ( $inputs['property_type'] ?? 'house' );
		$propertySubtype = (string) ( $inputs['property_subtype'] ?? 'efh' );
		$condition       = (string) ( $inputs['condition'] ?? 'good' );
		$quality         = (string) ( $inputs['quality'] ?? 'normal' );
		$rentalStatus    = (string) ( $inputs['rental_status'] ?? 'owner_occupied' );
		$locationRating  = max( 1, min( 5, (int) ( $inputs['location_rating'] ?? 3 ) ) );
		$features        = (array) ( $inputs['features'] ?? [] );
		$yearBuilt       = isset( $inputs['year_built'] ) ? (int) $inputs['year_built'] : null;
		$plotSize         = $propertyType === 'house' && isset( $inputs['plot_size'] )
			? max( 0.0, (float) $inputs['plot_size'] )
			: 0.0;

		// 1. Base price per m².
		$basePrice = (float) ( $locationData['base_price'] ?? 3200.0 );

		// 2. Size degression.
		$degression = (float) ( $locationData['size_degression'] ?? 0.18 );
		$sizeFactor = self::getSizeFactor( $size, $degression );
		$pricePerSqm = $basePrice * $sizeFactor;

		// 3. Property type multiplier.
		$typeMultipliers = (array) ( $locationData['type_multipliers'] ?? [] );
		$typeMultiplier  = (float) ( $typeMultipliers[ $propertyType ] ?? 1.0 );
		$pricePerSqm    *= $typeMultiplier;

		// 4. Subtype multiplier.
		$subtypeMultipliers = (array) ( $locationData['subtype_multipliers'] ?? [] );
		$subtypeMultiplier  = (float) ( $subtypeMultipliers[ $propertySubtype ] ?? 1.0 );
		$pricePerSqm       *= $subtypeMultiplier;

		// 5. Condition multiplier.
		$conditionMultipliers = (array) ( $locationData['condition_multipliers'] ?? [] );
		$conditionMultiplier  = (float) ( $conditionMultipliers[ $condition ] ?? 1.0 );
		$pricePerSqm         *= $conditionMultiplier;

		// 6. Age multiplier.
		$ageMultipliers = (array) ( $locationData['age_multipliers'] ?? [] );
		$ageMultiplier  = self::getAgeMultiplier( $yearBuilt, $ageMultipliers );
		$pricePerSqm   *= $ageMultiplier;

		// 7. Quality multiplier.
		$qualityMultipliers = (array) ( $locationData['quality_multipliers'] ?? [] );
		$qualityMultiplier  = (float) ( $qualityMultipliers[ $quality ] ?? 1.0 );
		$pricePerSqm       *= $qualityMultiplier;

		// 8. Location rating multiplier.
		$locationRatings    = (array) ( $locationData['location_ratings'] ?? [] );
		$locationMultiplier = self::getLocationMultiplier( $locationRating, $locationRatings );
		$pricePerSqm       *= $locationMultiplier;

		// 9. Rental status discount.
		$rentalDiscounts = (array) ( $locationData['rental_discount'] ?? [] );
		$rentalMultiplier = (float) ( $rentalDiscounts[ $rentalStatus ] ?? 1.0 );
		$pricePerSqm     *= $rentalMultiplier;

		// 10. Feature premiums (addition, not multiplication).
		$featurePremiums = (array) ( $locationData['feature_premiums'] ?? [] );
		$featurePremium  = self::getFeaturePremium( $features, $featurePremiums );
		$pricePerSqm    += $featurePremium;

		// 11. Plot value (only for houses).
		$plotPricePerSqm = (float) ( $locationData['plot_price_per_sqm'] ?? 180.0 );
		$plotValue        = $propertyType === 'house' && $plotSize > 0
			? round( $plotSize * $plotPricePerSqm, 2 )
			: null;

		// 12. Final results.
		$pricePerSqm    = round( $pricePerSqm, 2 );
		$estimatedValue = round( $size * $pricePerSqm + ( $plotValue ?? 0 ), 2 );

		$marketPosition = self::getMarketPosition( $pricePerSqm, $basePrice );

		// City average = location base price. County average from price range midpoint.
		$priceRangeMin = (float) ( $locationData['price_range_min'] ?? $basePrice * 0.7 );
		$priceRangeMax = (float) ( $locationData['price_range_max'] ?? $basePrice * 1.5 );
		$countyAverage = round( ( $priceRangeMin + $priceRangeMax ) / 2, 2 );

		return [
			'estimated_value' => [
				'estimate' => $estimatedValue,
				'low'      => round( $estimatedValue * ( 1 - self::RANGE_FACTOR ), 2 ),
				'high'     => round( $estimatedValue * ( 1 + self::RANGE_FACTOR ), 2 ),
			],
			'price_per_sqm'   => $pricePerSqm,
			'plot_value'      => $plotValue,
			'city_average'    => $basePrice,
			'county_average'  => $countyAverage,
			'market_position' => $marketPosition,
			'factors'         => [
				'base_price'       => $basePrice,
				'size_factor'      => round( $sizeFactor, 4 ),
				'type_impact'      => round( $typeMultiplier, 4 ),
				'subtype_impact'   => round( $subtypeMultiplier, 4 ),
				'condition_impact' => round( $conditionMultiplier, 4 ),
				'age_impact'       => round( $ageMultiplier, 4 ),
				'quality_impact'   => round( $qualityMultiplier, 4 ),
				'location_impact'  => round( $locationMultiplier, 4 ),
				'rental_impact'    => round( $rentalMultiplier, 4 ),
				'feature_premium'  => round( $featurePremium, 2 ),
				'features_count'   => count( $features ),
			],
		];
	}

	/**
	 * Determine market position percentile and label.
	 *
	 * @param float $pricePerSqm Calculated price per m².
	 * @param float $basePrice   Base price for the location.
	 * @return array{percentile: int, label: string}
	 */
	public static function getMarketPosition( float $pricePerSqm, float $basePrice ): array {
		if ( $basePrice <= 0 ) {
			return [ 'percentile' => 50, 'label' => 'Durchschnittlich' ];
		}

		$ratio = $pricePerSqm / $basePrice;

		if ( $ratio < 0.85 ) {
			return [ 'percentile' => 20, 'label' => 'Unterdurchschnittlich' ];
		}
		if ( $ratio < 0.95 ) {
			return [ 'percentile' => 35, 'label' => 'Leicht unterdurchschnittlich' ];
		}
		if ( $ratio < 1.05 ) {
			return [ 'percentile' => 50, 'label' => 'Durchschnittlich' ];
		}
		if ( $ratio < 1.15 ) {
			return [ 'percentile' => 65, 'label' => 'Überdurchschnittlich' ];
		}
		if ( $ratio < 1.25 ) {
			return [ 'percentile' => 80, 'label' => 'Deutlich überdurchschnittlich' ];
		}

		return [ 'percentile' => 90, 'label' => 'Premium-Segment' ];
	}

	/**
	 * Calculate size degression factor.
	 */
	private static function getSizeFactor( float $size, float $degression ): float {
		if ( $size <= 0 || $degression <= 0 ) {
			return 1.0;
		}
		return pow( self::REFERENCE_SIZE / $size, $degression );
	}

	/**
	 * Get location rating multiplier.
	 */
	private static function getLocationMultiplier( int $rating, array $locationRatings ): float {
		$ratingKey = (string) $rating;

		if ( ! isset( $locationRatings[ $ratingKey ] ) ) {
			return 1.0;
		}

		$value = $locationRatings[ $ratingKey ];

		if ( is_array( $value ) ) {
			return (float) ( $value['multiplier'] ?? 1.0 );
		}

		return (float) $value;
	}

	/**
	 * Get age multiplier based on year built.
	 */
	private static function getAgeMultiplier( ?int $yearBuilt, array $ageMultipliers ): float {
		if ( $yearBuilt === null || empty( $ageMultipliers ) ) {
			return 1.0;
		}

		// Try full format first (with min_year/max_year).
		foreach ( $ageMultipliers as $value ) {
			if ( ! is_array( $value ) ) {
				break;
			}
			$minYear = $value['min_year'] ?? 0;
			$maxYear = $value['max_year'] ?? PHP_INT_MAX;

			if ( $yearBuilt >= $minYear && $yearBuilt <= $maxYear ) {
				return (float) ( $value['multiplier'] ?? 1.0 );
			}
		}

		// Compact format: determine age class from year.
		$class = self::getAgeClass( $yearBuilt );

		if ( isset( $ageMultipliers[ $class ] ) ) {
			$value = $ageMultipliers[ $class ];
			return is_array( $value ) ? (float) ( $value['multiplier'] ?? 1.0 ) : (float) $value;
		}

		return 1.0;
	}

	/**
	 * Map a year to an age class key.
	 */
	private static function getAgeClass( int $year ): string {
		if ( $year <= 1945 ) {
			return 'before_1946';
		}
		if ( $year <= 1959 ) {
			return '1946_1959';
		}
		if ( $year <= 1979 ) {
			return '1960_1979';
		}
		if ( $year <= 1989 ) {
			return '1980_1989';
		}
		if ( $year <= 1999 ) {
			return '1990_1999';
		}
		if ( $year <= 2014 ) {
			return '2000_2014';
		}

		return '2015_plus';
	}

	/**
	 * Sum feature premiums for selected features.
	 */
	private static function getFeaturePremium( array $features, array $featurePremiums ): float {
		$total = 0.0;

		foreach ( $features as $feature ) {
			$feature = (string) $feature;
			if ( in_array( $feature, self::ALLOWED_FEATURES, true ) && isset( $featurePremiums[ $feature ] ) ) {
				$total += (float) $featurePremiums[ $feature ];
			}
		}

		return $total;
	}

	/**
	 * Get the 4 region type presets with purchase price scale.
	 *
	 * @return array<string, array<string,mixed>>
	 */
	public static function getRegionPresets(): array {
		return [
			'rural'       => [
				'label'                 => __( 'Ländlich', 'resa' ),
				'base_price'            => 1800,
				'plot_price_per_sqm'    => 80,
				'size_degression'       => 0.15,
				'type_multipliers'      => [ 'house' => 1.00, 'apartment' => 0.92 ],
				'subtype_multipliers'   => [
					'efh' => 1.00, 'rh' => 0.88, 'dhh' => 0.93, 'zfh' => 1.05, 'mfh' => 1.08,
					'eg' => 0.93, 'etage' => 1.00, 'dg' => 0.96, 'maisonette' => 1.03, 'penthouse' => 1.15,
				],
				'condition_multipliers' => [ 'new' => 1.22, 'renovated' => 1.08, 'good' => 1.00, 'needs_renovation' => 0.72 ],
				'quality_multipliers'   => [ 'premium' => 1.22, 'normal' => 1.00, 'basic' => 0.82 ],
				'rental_discount'       => [ 'owner_occupied' => 1.00, 'rented' => 0.90, 'vacant' => 1.00 ],
				'location_ratings'      => [ '1' => 0.78, '2' => 0.90, '3' => 1.00, '4' => 1.10, '5' => 1.20 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.88, '1960_1979' => 0.82, '1980_1989' => 0.90, '1990_1999' => 1.00, '2000_2014' => 1.08, '2015_plus' => 1.15 ],
				'feature_premiums'      => [ 'balcony' => 10, 'terrace' => 18, 'garden' => 22, 'elevator' => 6, 'parking' => 8, 'garage' => 14, 'cellar' => 5, 'fitted_kitchen' => 10, 'floor_heating' => 12, 'guest_toilet' => 5, 'barrier_free' => 7, 'solar' => 15 ],
			],
			'small_town'  => [
				'label'                 => __( 'Kleinstadt / Stadtrand', 'resa' ),
				'base_price'            => 2500,
				'plot_price_per_sqm'    => 120,
				'size_degression'       => 0.16,
				'type_multipliers'      => [ 'house' => 1.00, 'apartment' => 0.94 ],
				'subtype_multipliers'   => [
					'efh' => 1.00, 'rh' => 0.89, 'dhh' => 0.94, 'zfh' => 1.05, 'mfh' => 1.09,
					'eg' => 0.94, 'etage' => 1.00, 'dg' => 0.97, 'maisonette' => 1.04, 'penthouse' => 1.18,
				],
				'condition_multipliers' => [ 'new' => 1.23, 'renovated' => 1.09, 'good' => 1.00, 'needs_renovation' => 0.74 ],
				'quality_multipliers'   => [ 'premium' => 1.23, 'normal' => 1.00, 'basic' => 0.81 ],
				'rental_discount'       => [ 'owner_occupied' => 1.00, 'rented' => 0.91, 'vacant' => 1.00 ],
				'location_ratings'      => [ '1' => 0.80, '2' => 0.91, '3' => 1.00, '4' => 1.11, '5' => 1.24 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.89, '1960_1979' => 0.84, '1980_1989' => 0.91, '1990_1999' => 1.00, '2000_2014' => 1.08, '2015_plus' => 1.15 ],
				'feature_premiums'      => [ 'balcony' => 12, 'terrace' => 20, 'garden' => 25, 'elevator' => 8, 'parking' => 10, 'garage' => 16, 'cellar' => 6, 'fitted_kitchen' => 12, 'floor_heating' => 15, 'guest_toilet' => 6, 'barrier_free' => 8, 'solar' => 17 ],
			],
			'medium_city' => [
				'label'                 => __( 'Mittelstadt', 'resa' ),
				'base_price'            => 3200,
				'plot_price_per_sqm'    => 180,
				'size_degression'       => 0.18,
				'type_multipliers'      => [ 'house' => 1.00, 'apartment' => 0.95 ],
				'subtype_multipliers'   => [
					'efh' => 1.00, 'rh' => 0.90, 'dhh' => 0.95, 'zfh' => 1.05, 'mfh' => 1.10,
					'eg' => 0.95, 'etage' => 1.00, 'dg' => 0.98, 'maisonette' => 1.05, 'penthouse' => 1.20,
				],
				'condition_multipliers' => [ 'new' => 1.25, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.75 ],
				'quality_multipliers'   => [ 'premium' => 1.25, 'normal' => 1.00, 'basic' => 0.80 ],
				'rental_discount'       => [ 'owner_occupied' => 1.00, 'rented' => 0.92, 'vacant' => 1.00 ],
				'location_ratings'      => [ '1' => 0.80, '2' => 0.92, '3' => 1.00, '4' => 1.12, '5' => 1.30 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.90, '1960_1979' => 0.85, '1980_1989' => 0.92, '1990_1999' => 1.00, '2000_2014' => 1.08, '2015_plus' => 1.15 ],
				'feature_premiums'      => [ 'balcony' => 15, 'terrace' => 25, 'garden' => 30, 'elevator' => 10, 'parking' => 12, 'garage' => 20, 'cellar' => 8, 'fitted_kitchen' => 15, 'floor_heating' => 18, 'guest_toilet' => 8, 'barrier_free' => 10, 'solar' => 20 ],
			],
			'large_city'  => [
				'label'                 => __( 'Großstadt / Zentrum', 'resa' ),
				'base_price'            => 4500,
				'plot_price_per_sqm'    => 250,
				'size_degression'       => 0.20,
				'type_multipliers'      => [ 'house' => 1.00, 'apartment' => 0.96 ],
				'subtype_multipliers'   => [
					'efh' => 1.00, 'rh' => 0.92, 'dhh' => 0.96, 'zfh' => 1.06, 'mfh' => 1.12,
					'eg' => 0.96, 'etage' => 1.00, 'dg' => 0.98, 'maisonette' => 1.06, 'penthouse' => 1.25,
				],
				'condition_multipliers' => [ 'new' => 1.28, 'renovated' => 1.12, 'good' => 1.00, 'needs_renovation' => 0.72 ],
				'quality_multipliers'   => [ 'premium' => 1.28, 'normal' => 1.00, 'basic' => 0.78 ],
				'rental_discount'       => [ 'owner_occupied' => 1.00, 'rented' => 0.93, 'vacant' => 1.00 ],
				'location_ratings'      => [ '1' => 0.82, '2' => 0.93, '3' => 1.00, '4' => 1.14, '5' => 1.35 ],
				'age_multipliers'       => [ 'before_1946' => 1.08, '1946_1959' => 0.90, '1960_1979' => 0.85, '1980_1989' => 0.93, '1990_1999' => 1.00, '2000_2014' => 1.10, '2015_plus' => 1.18 ],
				'feature_premiums'      => [ 'balcony' => 20, 'terrace' => 30, 'garden' => 40, 'elevator' => 14, 'parking' => 16, 'garage' => 25, 'cellar' => 10, 'fitted_kitchen' => 18, 'floor_heating' => 22, 'guest_toilet' => 10, 'barrier_free' => 12, 'solar' => 25 ],
			],
		];
	}
}
