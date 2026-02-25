<?php

declare( strict_types=1 );

namespace Resa\Modules\RentCalculator;

/**
 * Rent price calculation engine.
 *
 * Computes estimated monthly rent based on property characteristics
 * and location-specific multipliers. Ported from immobilien-rechner-pro.
 *
 * Formula:
 *   price/m² = base_price × size_factor × location × condition × type × age + features
 *   monthly_rent = size × price/m²
 *   range = ±15%
 */
class RentCalculatorService {

	/** Reference apartment size for degression curve. */
	private const REFERENCE_SIZE = 70.0;

	/** Range factor for low/high estimates (±15%). */
	private const RANGE_FACTOR = 0.15;

	/** Allowed feature keys (whitelist for input validation). */
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
	];

	/** Allowed property types. */
	public const ALLOWED_TYPES = [ 'apartment', 'house' ];

	/** Allowed condition values. */
	public const ALLOWED_CONDITIONS = [ 'new', 'renovated', 'good', 'needs_renovation' ];

	/**
	 * Calculate rent estimate.
	 *
	 * @param array<string,mixed> $inputs       User inputs (size, property_type, condition, etc.).
	 * @param array<string,mixed> $locationData Calculation parameters from the location.
	 * @return array<string,mixed> Result with monthly_rent, annual_rent, price_per_sqm, market_position, factors.
	 */
	public static function calculate( array $inputs, array $locationData ): array {
		$size           = max( 10.0, (float) ( $inputs['size'] ?? 70 ) );
		$propertyType   = (string) ( $inputs['property_type'] ?? 'apartment' );
		$condition      = (string) ( $inputs['condition'] ?? 'good' );
		$locationRating = max( 1, min( 5, (int) ( $inputs['location_rating'] ?? 3 ) ) );
		$features       = (array) ( $inputs['features'] ?? [] );
		$yearBuilt      = isset( $inputs['year_built'] ) ? (int) $inputs['year_built'] : null;

		// 1. Base price per m².
		$basePrice = (float) ( $locationData['base_price'] ?? 12.0 );

		// 2. Size degression.
		$degression = (float) ( $locationData['size_degression'] ?? 0.20 );
		$sizeFactor = self::getSizeFactor( $size, $degression );
		$pricePerSqm = $basePrice * $sizeFactor;

		// 3. Location rating multiplier.
		$locationRatings    = (array) ( $locationData['location_ratings'] ?? [] );
		$locationMultiplier = self::getLocationMultiplier( $locationRating, $locationRatings );
		$pricePerSqm       *= $locationMultiplier;

		// 4. Condition multiplier.
		$conditionMultipliers = (array) ( $locationData['condition_multipliers'] ?? [] );
		$conditionMultiplier  = (float) ( $conditionMultipliers[ $condition ] ?? 1.0 );
		$pricePerSqm         *= $conditionMultiplier;

		// 5. Property type multiplier.
		$typeMultipliers = (array) ( $locationData['type_multipliers'] ?? [] );
		$typeMultiplier  = (float) ( $typeMultipliers[ $propertyType ] ?? 1.0 );
		$pricePerSqm    *= $typeMultiplier;

		// 6. Age multiplier.
		$ageMultipliers = (array) ( $locationData['age_multipliers'] ?? [] );
		$ageMultiplier  = self::getAgeMultiplier( $yearBuilt, $ageMultipliers );
		$pricePerSqm   *= $ageMultiplier;

		// 7. Feature premiums (addition, not multiplication).
		$featurePremiums = (array) ( $locationData['feature_premiums'] ?? [] );
		$featurePremium  = self::getFeaturePremium( $features, $featurePremiums );
		$pricePerSqm    += $featurePremium;

		// 8. Final results.
		$monthlyRent = round( $size * $pricePerSqm, 2 );
		$pricePerSqm = round( $pricePerSqm, 2 );

		$marketPosition = self::getMarketPosition( $pricePerSqm, $basePrice );

		return [
			'monthly_rent'    => [
				'estimate' => $monthlyRent,
				'low'      => round( $monthlyRent * ( 1 - self::RANGE_FACTOR ), 2 ),
				'high'     => round( $monthlyRent * ( 1 + self::RANGE_FACTOR ), 2 ),
			],
			'annual_rent'     => round( $monthlyRent * 12, 2 ),
			'price_per_sqm'   => $pricePerSqm,
			'market_position' => $marketPosition,
			'factors'         => [
				'base_price'       => $basePrice,
				'size_factor'      => round( $sizeFactor, 4 ),
				'location_impact'  => round( $locationMultiplier, 4 ),
				'condition_impact' => round( $conditionMultiplier, 4 ),
				'type_impact'      => round( $typeMultiplier, 4 ),
				'age_impact'       => round( $ageMultiplier, 4 ),
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
	 *
	 * Smaller apartments → higher per-m² price, larger → lower.
	 */
	private static function getSizeFactor( float $size, float $degression ): float {
		if ( $size <= 0 || $degression <= 0 ) {
			return 1.0;
		}
		return pow( self::REFERENCE_SIZE / $size, $degression );
	}

	/**
	 * Get location rating multiplier.
	 *
	 * Supports both full format {"1": {"multiplier": 0.85}} and
	 * compact format {"1": 0.85} from presets.
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
	 *
	 * Supports both full format {"before_1946": {"multiplier": 1.05, "max_year": 1945}}
	 * and compact format {"before_1946": 1.05} from presets.
	 */
	private static function getAgeMultiplier( ?int $yearBuilt, array $ageMultipliers ): float {
		if ( $yearBuilt === null || empty( $ageMultipliers ) ) {
			return 1.0;
		}

		// Try full format first (with min_year/max_year).
		foreach ( $ageMultipliers as $value ) {
			if ( ! is_array( $value ) ) {
				break; // Compact format, use key-based lookup below.
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
	 * Get the 4 region type presets.
	 *
	 * @return array<string, array<string,mixed>>
	 */
	public static function getRegionPresets(): array {
		return [
			'rural'       => [
				'label'                 => __( 'Ländlich', 'resa' ),
				'base_price'            => 5.50,
				'size_degression'       => 0.15,
				'location_ratings'      => [ '1' => 0.80, '2' => 0.90, '3' => 1.00, '4' => 1.08, '5' => 1.15 ],
				'condition_multipliers' => [ 'new' => 1.20, 'renovated' => 1.08, 'good' => 1.00, 'needs_renovation' => 0.82 ],
				'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.12 ],
				'feature_premiums'      => [ 'balcony' => 0.30, 'terrace' => 0.50, 'garden' => 0.80, 'elevator' => 0.15, 'parking' => 0.25, 'garage' => 0.40, 'cellar' => 0.10, 'fitted_kitchen' => 0.35, 'floor_heating' => 0.25, 'guest_toilet' => 0.15, 'barrier_free' => 0.20 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.92, '1960_1979' => 0.88, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.05, '2015_plus' => 1.10 ],
			],
			'small_town'  => [
				'label'                 => __( 'Kleinstadt / Stadtrand', 'resa' ),
				'base_price'            => 7.50,
				'size_degression'       => 0.18,
				'location_ratings'      => [ '1' => 0.83, '2' => 0.93, '3' => 1.00, '4' => 1.10, '5' => 1.20 ],
				'condition_multipliers' => [ 'new' => 1.22, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.80 ],
				'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.14 ],
				'feature_premiums'      => [ 'balcony' => 0.40, 'terrace' => 0.60, 'garden' => 0.90, 'elevator' => 0.25, 'parking' => 0.35, 'garage' => 0.50, 'cellar' => 0.15, 'fitted_kitchen' => 0.45, 'floor_heating' => 0.35, 'guest_toilet' => 0.20, 'barrier_free' => 0.25 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.94, '1960_1979' => 0.90, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.05, '2015_plus' => 1.10 ],
			],
			'medium_city' => [
				'label'                 => __( 'Mittelstadt', 'resa' ),
				'base_price'            => 9.50,
				'size_degression'       => 0.20,
				'location_ratings'      => [ '1' => 0.85, '2' => 0.95, '3' => 1.00, '4' => 1.10, '5' => 1.25 ],
				'condition_multipliers' => [ 'new' => 1.25, 'renovated' => 1.10, 'good' => 1.00, 'needs_renovation' => 0.80 ],
				'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.15 ],
				'feature_premiums'      => [ 'balcony' => 0.50, 'terrace' => 0.75, 'garden' => 1.00, 'elevator' => 0.30, 'parking' => 0.40, 'garage' => 0.60, 'cellar' => 0.20, 'fitted_kitchen' => 0.50, 'floor_heating' => 0.40, 'guest_toilet' => 0.25, 'barrier_free' => 0.30 ],
				'age_multipliers'       => [ 'before_1946' => 1.05, '1946_1959' => 0.95, '1960_1979' => 0.90, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.05, '2015_plus' => 1.10 ],
			],
			'large_city'  => [
				'label'                 => __( 'Großstadt / Zentrum', 'resa' ),
				'base_price'            => 14.00,
				'size_degression'       => 0.22,
				'location_ratings'      => [ '1' => 0.85, '2' => 0.95, '3' => 1.00, '4' => 1.12, '5' => 1.30 ],
				'condition_multipliers' => [ 'new' => 1.28, 'renovated' => 1.12, 'good' => 1.00, 'needs_renovation' => 0.78 ],
				'type_multipliers'      => [ 'apartment' => 1.00, 'house' => 1.18 ],
				'feature_premiums'      => [ 'balcony' => 0.65, 'terrace' => 1.00, 'garden' => 1.30, 'elevator' => 0.40, 'parking' => 0.55, 'garage' => 0.80, 'cellar' => 0.25, 'fitted_kitchen' => 0.60, 'floor_heating' => 0.50, 'guest_toilet' => 0.30, 'barrier_free' => 0.35 ],
				'age_multipliers'       => [ 'before_1946' => 1.08, '1946_1959' => 0.95, '1960_1979' => 0.88, '1980_1989' => 0.95, '1990_1999' => 1.00, '2000_2014' => 1.06, '2015_plus' => 1.12 ],
			],
		];
	}
}
