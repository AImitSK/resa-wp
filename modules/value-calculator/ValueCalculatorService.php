<?php

declare( strict_types=1 );

namespace Resa\Modules\ValueCalculator;

use Resa\Modules\RentCalculator\RentCalculatorService;

/**
 * Property value calculation engine.
 *
 * Computes estimated property sale value based on the rent calculation
 * multiplied by a configurable sale_factor (Vervielfältiger).
 *
 * Formula:
 *   1. Calculate monthly rent (using RentCalculatorService)
 *   2. annual_rent = monthly_rent × 12
 *   3. property_value = annual_rent × sale_factor
 *   4. range = ±10%
 */
class ValueCalculatorService {

	/** Range factor for low/high estimates (±10%). */
	private const RANGE_FACTOR = 0.10;

	/** Default sale factor (Vervielfältiger) if not configured. */
	private const DEFAULT_SALE_FACTOR = 25;

	/**
	 * Calculate property value estimate.
	 *
	 * @param array<string,mixed> $inputs       User inputs (size, property_type, condition, etc.).
	 * @param array<string,mixed> $locationData Calculation parameters from the location.
	 * @return array<string,mixed> Result with property_value, monthly_rent, price_per_sqm, market_position, etc.
	 */
	public static function calculate( array $inputs, array $locationData ): array {
		// 1. Calculate rent using the rent calculator service.
		$rentResult = RentCalculatorService::calculate( $inputs, $locationData );

		$size       = max( 10.0, (float) ( $inputs['size'] ?? 70 ) );
		$annualRent = $rentResult['annual_rent'];

		// 2. Get sale factor (Vervielfältiger).
		$saleFactor = (float) ( $locationData['sale_factor'] ?? self::DEFAULT_SALE_FACTOR );
		if ( $saleFactor <= 0 ) {
			$saleFactor = self::DEFAULT_SALE_FACTOR;
		}

		// 3. Calculate property value.
		$propertyValue = $annualRent * $saleFactor;

		// 4. Calculate range (±10%).
		$valueMin = $propertyValue * ( 1 - self::RANGE_FACTOR );
		$valueMax = $propertyValue * ( 1 + self::RANGE_FACTOR );

		// 5. Price per square meter.
		$pricePerSqm = $propertyValue / $size;

		// 6. Calculate average value for comparison.
		$averageValue     = self::calculateAverageValue( $locationData, $size );
		$comparisonPercent = $averageValue > 0
			? ( ( $propertyValue - $averageValue ) / $averageValue ) * 100
			: 0;

		// 7. Round values for presentation.
		$propertyValueRounded = self::roundToHundreds( $propertyValue );
		$valueMinRounded      = self::roundToHundreds( $valueMin );
		$valueMaxRounded      = self::roundToHundreds( $valueMax );
		$averageValueRounded  = self::roundToHundreds( $averageValue );

		return [
			'property_value'     => [
				'estimate' => $propertyValueRounded,
				'low'      => $valueMinRounded,
				'high'     => $valueMaxRounded,
			],
			'price_per_sqm'      => round( $pricePerSqm, 2 ),
			'annual_rent'        => $rentResult['annual_rent'],
			'monthly_rent'       => $rentResult['monthly_rent'],
			'sale_factor'        => $saleFactor,
			'market_position'    => $rentResult['market_position'],
			'average_value'      => $averageValueRounded,
			'comparison_percent' => round( $comparisonPercent, 1 ),
			'city_average'       => $rentResult['city_average'],
			'county_average'     => $rentResult['county_average'],
			'factors'            => $rentResult['factors'],
		];
	}

	/**
	 * Calculate average property value for the location.
	 *
	 * Uses base_price × reference_size × 12 months × sale_factor.
	 *
	 * @param array<string,mixed> $locationData Location calculation data.
	 * @param float               $size         Property size in m².
	 * @return float Average property value.
	 */
	private static function calculateAverageValue( array $locationData, float $size ): float {
		$basePrice  = (float) ( $locationData['base_price'] ?? 9.50 );
		$saleFactor = (float) ( $locationData['sale_factor'] ?? self::DEFAULT_SALE_FACTOR );

		// Average value = base_price × size × 12 months × sale_factor.
		return $basePrice * $size * 12 * $saleFactor;
	}

	/**
	 * Round a value to the nearest hundred.
	 *
	 * @param float $value Value to round.
	 * @return float Rounded value.
	 */
	private static function roundToHundreds( float $value ): float {
		return round( $value / 100 ) * 100;
	}

	/**
	 * Get the 4 region type presets with sale factors.
	 *
	 * Extends RentCalculatorService presets with sale_factor.
	 *
	 * @return array<string, array<string,mixed>>
	 */
	public static function getRegionPresets(): array {
		$rentPresets = RentCalculatorService::getRegionPresets();

		// Add sale_factor to each preset.
		$saleFactors = [
			'rural'       => 20,
			'small_town'  => 22,
			'medium_city' => 25,
			'large_city'  => 30,
		];

		foreach ( $saleFactors as $key => $factor ) {
			if ( isset( $rentPresets[ $key ] ) ) {
				$rentPresets[ $key ]['sale_factor'] = $factor;
			}
		}

		return $rentPresets;
	}
}
